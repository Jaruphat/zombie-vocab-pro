import type { LeaderboardEntry, LeaderboardSyncReason } from '../types';

export const SHARED_LEADERBOARD_LIMIT = 50;

interface SharedLeaderboardPayload {
  entries: LeaderboardEntry[];
  configured: boolean;
  source: 'shared' | 'local-fallback';
  timestamp: string;
  error?: string;
  reason?: LeaderboardSyncReason;
}

const buildLeaderboardUrl = (limit: number) => `/api/leaderboard?limit=${limit}`;

const parsePayload = async (response: Response): Promise<Partial<SharedLeaderboardPayload> | null> => {
  try {
    return (await response.json()) as Partial<SharedLeaderboardPayload>;
  } catch {
    return null;
  }
};

const normalizePayload = (
  payload: Partial<SharedLeaderboardPayload> | null,
  fallback: Pick<SharedLeaderboardPayload, 'configured' | 'error' | 'reason'>,
): SharedLeaderboardPayload => ({
  entries: Array.isArray(payload?.entries) ? (payload.entries as LeaderboardEntry[]) : [],
  configured: payload?.configured ?? fallback.configured,
  source: payload?.source === 'shared' ? 'shared' : 'local-fallback',
  timestamp: typeof payload?.timestamp === 'string' ? payload.timestamp : new Date().toISOString(),
  error: typeof payload?.error === 'string' ? payload.error : fallback.error,
  reason: payload?.reason ?? fallback.reason,
});

export const fetchSharedLeaderboard = async (
  limit = SHARED_LEADERBOARD_LIMIT,
): Promise<SharedLeaderboardPayload> => {
  try {
    const response = await fetch(buildLeaderboardUrl(limit), {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });
    const payload = await parsePayload(response);

    if (!response.ok && !payload) {
      return normalizePayload(null, {
        configured: false,
        error: 'Unable to load the shared leaderboard right now.',
        reason: 'server',
      });
    }

    return normalizePayload(payload, {
      configured: false,
      error: response.ok ? undefined : 'Unable to load the shared leaderboard right now.',
      reason: response.ok ? undefined : 'server',
    });
  } catch (error) {
    return normalizePayload(null, {
      configured: false,
      error: error instanceof Error ? error.message : 'Network error while loading the shared leaderboard.',
      reason: 'network',
    });
  }
};

export const submitSharedLeaderboardEntry = async (
  entry: LeaderboardEntry,
  limit = SHARED_LEADERBOARD_LIMIT,
): Promise<SharedLeaderboardPayload> => {
  try {
    const response = await fetch(buildLeaderboardUrl(limit), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ entry }),
    });
    const payload = await parsePayload(response);

    if (!response.ok && !payload) {
      return normalizePayload(null, {
        configured: false,
        error: 'Unable to save this score to the shared leaderboard.',
        reason: 'server',
      });
    }

    return normalizePayload(payload, {
      configured: false,
      error: response.ok ? undefined : 'Unable to save this score to the shared leaderboard.',
      reason: response.ok ? undefined : 'server',
    });
  } catch (error) {
    return normalizePayload(null, {
      configured: false,
      error: error instanceof Error ? error.message : 'Network error while saving this score.',
      reason: 'network',
    });
  }
};
