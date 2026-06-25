import { list, put } from '@vercel/blob';

const ENTRY_PREFIX = 'leaderboard/entries/';
const MAX_ENTRIES = 50;
const MAX_BLOB_SCAN = 1000;
const READ_BATCH_SIZE = 25;
const MAX_NAME_LENGTH = 40;
const MAX_AVATAR_DATA_URL_LENGTH = 200_000;
const MAX_WORD_SET_IDS = 10;
const MAX_WORD_SET_NAMES = 6;

type SyncReason = 'not-configured' | 'server';

interface LeaderboardEntryRecord {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatarDataUrl?: string;
  score: number;
  level: number;
  playedAt: string;
  wordSetIds: string[];
  wordSetNames: string[];
}

interface LeaderboardResponsePayload {
  entries: LeaderboardEntryRecord[];
  configured: boolean;
  source: 'shared' | 'local-fallback';
  timestamp: string;
  error?: string;
  reason?: SyncReason;
}

const hasBlobBinding = () =>
  Boolean(
    process.env.BLOB_READ_WRITE_TOKEN
    || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );

const createJsonResponse = (
  payload: LeaderboardResponsePayload,
  status = 200,
) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });

const createLocalFallbackPayload = (
  reason: SyncReason,
  error: string,
): LeaderboardResponsePayload => ({
  entries: [],
  configured: false,
  source: 'local-fallback',
  timestamp: new Date().toISOString(),
  error,
  reason,
});

const clampLimit = (value: number) => {
  if (!Number.isFinite(value)) return MAX_ENTRIES;
  return Math.min(MAX_ENTRIES, Math.max(1, Math.floor(value)));
};

const getRequestedLimit = (request: Request) => {
  const url = new URL(request.url);
  return clampLimit(Number(url.searchParams.get('limit') ?? MAX_ENTRIES));
};

const normalizeString = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const normalizeStringArray = (
  value: unknown,
  maxItems: number,
  maxItemLength: number,
) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, maxItems)
        .map((item) => item.slice(0, maxItemLength))
    : [];

const sortEntries = (entries: LeaderboardEntryRecord[]) => {
  const deduped = new Map<string, LeaderboardEntryRecord>();
  for (const entry of entries) {
    deduped.set(entry.id, entry);
  }

  return [...deduped.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime();
    })
    .slice(0, MAX_ENTRIES);
};

const sanitizeEntry = (value: unknown): LeaderboardEntryRecord | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  const id = normalizeString(candidate.id, 80);
  const playerId = normalizeString(candidate.playerId, 80);
  const playerName = normalizeString(candidate.playerName, MAX_NAME_LENGTH);
  const playerAvatarDataUrl = normalizeString(
    candidate.playerAvatarDataUrl,
    MAX_AVATAR_DATA_URL_LENGTH,
  ) || undefined;
  const playedAt = normalizeString(candidate.playedAt, 64);
  const playedAtMs = Date.parse(playedAt);
  const score = Math.max(0, Math.floor(Number(candidate.score)));
  const level = Math.max(1, Math.floor(Number(candidate.level)));

  if (!id || !playerId || !playerName || Number.isNaN(playedAtMs)) {
    return null;
  }

  return {
    id,
    playerId,
    playerName,
    playerAvatarDataUrl,
    score,
    level,
    playedAt: new Date(playedAtMs).toISOString(),
    wordSetIds: normalizeStringArray(candidate.wordSetIds, MAX_WORD_SET_IDS, 80),
    wordSetNames: normalizeStringArray(candidate.wordSetNames, MAX_WORD_SET_NAMES, 48),
  };
};

const buildEntryPath = (entry: LeaderboardEntryRecord) => {
  const playedAtMs = new Date(entry.playedAt).getTime();
  const safeId = entry.id.replace(/[^a-zA-Z0-9_-]/g, '');
  return `${ENTRY_PREFIX}${playedAtMs}-${safeId}.json`;
};

const readBlobEntry = async (blobUrl: string) => {
  try {
    const response = await fetch(blobUrl, { cache: 'no-store' });
    if (!response.ok) return null;
    return sanitizeEntry(await response.json());
  } catch {
    return null;
  }
};

const listLeaderboardEntries = async () => {
  const blobs: Awaited<ReturnType<typeof list>>['blobs'] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore && blobs.length < MAX_BLOB_SCAN) {
    const result: Awaited<ReturnType<typeof list>> = await list({
      prefix: ENTRY_PREFIX,
      limit: Math.min(1000, MAX_BLOB_SCAN - blobs.length),
      cursor,
    });

    blobs.push(...result.blobs);
    hasMore = result.hasMore;
    cursor = result.cursor;
  }

  const entries: LeaderboardEntryRecord[] = [];
  for (let index = 0; index < blobs.length; index += READ_BATCH_SIZE) {
    const batch = blobs.slice(index, index + READ_BATCH_SIZE);
    const parsedBatch = await Promise.all(batch.map((blob) => readBlobEntry(blob.url)));
    for (const parsedEntry of parsedBatch) {
      if (parsedEntry) entries.push(parsedEntry);
    }
  }

  return sortEntries(entries);
};

const handleUnexpectedError = () =>
  createJsonResponse(
    createLocalFallbackPayload(
      'server',
      'Unable to reach the shared leaderboard right now.',
    ),
    500,
  );

export async function GET(request: Request) {
  const limit = getRequestedLimit(request);

  if (!hasBlobBinding()) {
    return createJsonResponse(
      createLocalFallbackPayload(
        'not-configured',
        'Shared leaderboard storage is not configured on this Vercel project yet.',
      ),
    );
  }

  try {
    const entries = await listLeaderboardEntries();
    return createJsonResponse({
      entries: entries.slice(0, limit),
      configured: true,
      source: 'shared',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return handleUnexpectedError();
  }
}

export async function POST(request: Request) {
  const limit = getRequestedLimit(request);

  if (!hasBlobBinding()) {
    return createJsonResponse(
      createLocalFallbackPayload(
        'not-configured',
        'Shared leaderboard storage is not configured on this Vercel project yet.',
      ),
    );
  }

  try {
    const body = (await request.json()) as { entry?: unknown };
    const entry = sanitizeEntry(body.entry);

    if (!entry) {
      return createJsonResponse(
        {
          entries: [],
          configured: true,
          source: 'local-fallback',
          timestamp: new Date().toISOString(),
          error: 'Invalid leaderboard entry payload.',
          reason: 'server',
        },
        400,
      );
    }

    const entryPath = buildEntryPath(entry);

    try {
      await put(entryPath, JSON.stringify(entry), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        cacheControlMaxAge: 60 * 60 * 24 * 30,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.toLowerCase().includes('already exists')) {
        throw error;
      }
    }

    const entries = await listLeaderboardEntries();

    return createJsonResponse(
      {
        entries: entries.slice(0, limit),
        configured: true,
        source: 'shared',
        timestamp: new Date().toISOString(),
      },
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return createJsonResponse(
        {
          entries: [],
          configured: true,
          source: 'local-fallback',
          timestamp: new Date().toISOString(),
          error: 'Malformed leaderboard request body.',
          reason: 'server',
        },
        400,
      );
    }

    return handleUnexpectedError();
  }
}
