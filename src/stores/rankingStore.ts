import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchSharedLeaderboard, SHARED_LEADERBOARD_LIMIT, submitSharedLeaderboardEntry } from '../services/sharedLeaderboard';
import type { LeaderboardEntry, PlayerProfile, RankingStore } from '../types';

const MAX_LEADERBOARD_ENTRIES = 50;
const DEFAULT_REFRESH_LIMIT = 20;

const createFallbackProfile = (): PlayerProfile => {
  const now = new Date().toISOString();
  return {
    id: 'guest-survivor',
    name: 'Guest Survivor',
    createdAt: now,
    updatedAt: now,
  };
};

const sortLeaderboard = (entries: LeaderboardEntry[]) =>
  [...new Map(entries.map((entry) => [entry.id, entry])).values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime();
    })
    .slice(0, MAX_LEADERBOARD_ENTRIES);

export const useRankingStore = create<RankingStore>()(
  persist(
    (set, get) => ({
      profiles: [createFallbackProfile()],
      activeProfileId: 'guest-survivor',
      localLeaderboard: [],
      leaderboard: [],
      leaderboardSource: 'local',
      remoteConfigured: false,
      syncStatus: 'idle',
      syncError: undefined,
      syncReason: undefined,
      lastSyncedAt: undefined,

      addProfile: (profile) => {
        const now = new Date().toISOString();
        const nextProfile: PlayerProfile = {
          id: crypto.randomUUID(),
          name: profile.name.trim(),
          avatarDataUrl: profile.avatarDataUrl,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          profiles: [...state.profiles, nextProfile],
          activeProfileId: nextProfile.id,
        }));

        return nextProfile.id;
      },

      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((profile) =>
            profile.id === id
              ? {
                  ...profile,
                  ...updates,
                  name: updates.name?.trim() ?? profile.name,
                  updatedAt: new Date().toISOString(),
                }
              : profile,
          ),
        })),

      removeProfile: (id) =>
        set((state) => {
          const remainingProfiles = state.profiles.filter((profile) => profile.id !== id);
          if (remainingProfiles.length === 0) {
            const fallbackProfile = createFallbackProfile();
            return {
              profiles: [fallbackProfile],
              activeProfileId: fallbackProfile.id,
            };
          }

          return {
            profiles: remainingProfiles,
            activeProfileId:
              state.activeProfileId === id ? remainingProfiles[0].id : state.activeProfileId,
          };
        }),

      setActiveProfile: (id) =>
        set((state) => ({
          activeProfileId: state.profiles.some((profile) => profile.id === id)
            ? id
            : state.activeProfileId,
        })),

      submitLeaderboardEntry: async (entry) => {
        const localEntry: LeaderboardEntry = {
          ...entry,
          id: entry.id ?? crypto.randomUUID(),
        };

        set((state) => {
          const localLeaderboard = sortLeaderboard([...state.localLeaderboard, localEntry]);
          return {
            localLeaderboard,
            leaderboard:
              state.leaderboardSource === 'shared'
                ? sortLeaderboard([...state.leaderboard, localEntry])
                : localLeaderboard,
            syncStatus: 'saving',
            syncError: undefined,
            syncReason: undefined,
          };
        });

        const result = await submitSharedLeaderboardEntry(localEntry, SHARED_LEADERBOARD_LIMIT);

        if (result.configured && result.source === 'shared') {
          set(() => ({
            leaderboard: sortLeaderboard([localEntry, ...result.entries]),
            leaderboardSource: 'shared',
            remoteConfigured: true,
            syncStatus: 'ready',
            syncError: undefined,
            syncReason: undefined,
            lastSyncedAt: result.timestamp,
          }));

          return localEntry;
        }

        set((state) => {
          const preserveSharedBoard =
            state.remoteConfigured
            && state.leaderboardSource === 'shared'
            && result.reason !== 'not-configured';

          return {
            leaderboardSource: preserveSharedBoard ? 'shared' : 'local',
            leaderboard: preserveSharedBoard
              ? sortLeaderboard(state.leaderboard)
              : sortLeaderboard(state.localLeaderboard),
            remoteConfigured: result.reason === 'not-configured' ? false : state.remoteConfigured,
            syncStatus: 'error',
            syncError: result.error,
            syncReason: result.reason,
          };
        });

        return localEntry;
      },

      refreshLeaderboard: async (limit = DEFAULT_REFRESH_LIMIT) => {
        set((state) => ({
          syncStatus: state.syncStatus === 'saving' ? 'saving' : 'loading',
          syncError: undefined,
          syncReason: undefined,
        }));

        const result = await fetchSharedLeaderboard(limit);

        if (result.configured && result.source === 'shared') {
          set(() => ({
            leaderboard: sortLeaderboard(result.entries),
            leaderboardSource: 'shared',
            remoteConfigured: true,
            syncStatus: 'ready',
            syncError: undefined,
            syncReason: undefined,
            lastSyncedAt: result.timestamp,
          }));
          return;
        }

        set((state) => {
          const preserveSharedBoard =
            state.remoteConfigured
            && state.leaderboardSource === 'shared'
            && state.leaderboard.length > 0
            && result.reason !== 'not-configured';

          return {
            leaderboardSource: preserveSharedBoard ? 'shared' : 'local',
            leaderboard: preserveSharedBoard
              ? state.leaderboard
              : sortLeaderboard(state.localLeaderboard),
            remoteConfigured: result.reason === 'not-configured' ? false : state.remoteConfigured,
            syncStatus: 'error',
            syncError: result.error,
            syncReason: result.reason,
          };
        });
      },

      clearLeaderboard: () =>
        set((state) => ({
          localLeaderboard: [],
          leaderboard: state.leaderboardSource === 'local' ? [] : state.leaderboard,
        })),

      getActiveProfile: () => {
        const state = get();
        return state.profiles.find((profile) => profile.id === state.activeProfileId)
          ?? state.profiles[0]
          ?? createFallbackProfile();
      },
    }),
    {
      name: 'zombie-vocab-ranking',
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        localLeaderboard: state.localLeaderboard,
      }),
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<RankingStore> & {
          leaderboard?: LeaderboardEntry[];
        };
        const profiles =
          typedPersistedState.profiles && typedPersistedState.profiles.length > 0
            ? typedPersistedState.profiles
            : currentState.profiles;
        const activeProfileId =
          typedPersistedState.activeProfileId &&
          profiles.some((profile) => profile.id === typedPersistedState.activeProfileId)
            ? typedPersistedState.activeProfileId
            : profiles[0].id;
        const localLeaderboard = sortLeaderboard(
          typedPersistedState.localLeaderboard
          ?? typedPersistedState.leaderboard
          ?? [],
        );

        return {
          ...currentState,
          ...typedPersistedState,
          profiles,
          activeProfileId,
          localLeaderboard,
          leaderboard: localLeaderboard,
          leaderboardSource: 'local',
          remoteConfigured: false,
          syncStatus: 'idle',
          syncError: undefined,
          syncReason: undefined,
          lastSyncedAt: undefined,
        };
      },
    },
  ),
);
