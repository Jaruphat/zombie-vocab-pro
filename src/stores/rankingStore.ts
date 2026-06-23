import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeaderboardEntry, PlayerProfile, RankingStore } from '../types';

const MAX_LEADERBOARD_ENTRIES = 50;

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
  [...entries]
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
      leaderboard: [],

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

      addLeaderboardEntry: (entry) =>
        set((state) => ({
          leaderboard: sortLeaderboard([
            ...state.leaderboard,
            {
              ...entry,
              id: crypto.randomUUID(),
            },
          ]),
        })),

      clearLeaderboard: () => set({ leaderboard: [] }),

      getActiveProfile: () => {
        const state = get();
        return state.profiles.find((profile) => profile.id === state.activeProfileId)
          ?? state.profiles[0]
          ?? createFallbackProfile();
      },
    }),
    {
      name: 'zombie-vocab-ranking',
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<RankingStore>;
        const profiles =
          typedPersistedState.profiles && typedPersistedState.profiles.length > 0
            ? typedPersistedState.profiles
            : currentState.profiles;
        const activeProfileId =
          typedPersistedState.activeProfileId &&
          profiles.some((profile) => profile.id === typedPersistedState.activeProfileId)
            ? typedPersistedState.activeProfileId
            : profiles[0].id;

        return {
          ...currentState,
          ...typedPersistedState,
          profiles,
          activeProfileId,
          leaderboard: sortLeaderboard(typedPersistedState.leaderboard ?? []),
        };
      },
    },
  ),
);
