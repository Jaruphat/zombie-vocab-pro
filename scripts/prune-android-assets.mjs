import { existsSync } from 'node:fs';
import { readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_ROOTS = ['dist', 'android/app/src/main/assets/public'];

const soldierKeepPrefixes = {
  soldier1: new Set([
    'Idle',
    'Shoot',
    'Run_Shoot',
    'Jump_Shoot',
    'Crouch_Shoot',
    'WalkShoot',
    'Happy',
    'Hurt',
    'Walk',
    'Run',
    'Melee',
  ]),
  soldier2: new Set([
    'Idle',
    'Shoot',
    'Run_Shoot',
    'Jump_Shoot',
    'Crouch_Shoot',
    'Walk_Shoot',
    'Happy',
    'Hurt',
    'Walk',
    'Run',
    'Melee',
  ]),
  soldier3: new Set([
    'Idle',
    'Shoot',
    'Run_Shoot',
    'Jump_Shoot',
    'Crouch_Shoot',
    'Walk_Shoot',
    'Happy',
    'Hurt',
    'Walk',
    'Run',
    'Melee',
  ]),
  soldier4: new Set([
    'Idle',
    'Shoot',
    'Run_Shoot',
    'Jump_Shoot',
    'Crouch_Shoot',
    'Walk_Shoot',
    'Happy',
    'Hurt',
    'Walk',
    'Run',
    'Melee',
  ]),
};

const flatZombieKeepPrefixes = {
  variant_1: new Set(['Idle 1', 'Walk 1', 'Attack', 'Dead']),
  variant_2: new Set(['Idle 1', 'Walk 2', 'Attack', 'Dead']),
};

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function listFiles(dir) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function numberedSpritePrefix(fileName) {
  return path.basename(fileName, '.png').replace(/_+\d+$/, '');
}

function flatZombiePrefix(fileName) {
  const baseName = path.basename(fileName, '.png');
  const match = baseName.match(/^(.+) \(\d+\)$/);
  return match ? match[1] : baseName;
}

async function pruneRoot(root) {
  const assetsRoot = path.join(root, 'assets');

  if (!existsSync(assetsRoot)) {
    console.log(`[prune-assets] ${root}: skipped, assets directory not found.`);
    return;
  }

  let removedFiles = 0;
  let removedBytes = 0;

  async function removeFile(filePath) {
    const fileStats = await stat(filePath);
    await rm(filePath, { force: true });
    removedFiles += 1;
    removedBytes += fileStats.size;
  }

  for (const [soldier, keepPrefixes] of Object.entries(soldierKeepPrefixes)) {
    const soldierDir = path.join(assetsRoot, 'characters', 'soldier', soldier);
    const files = await listFiles(soldierDir);

    for (const entry of files) {
      if (!entry.isFile() || !entry.name.endsWith('.png')) continue;

      const prefix = numberedSpritePrefix(entry.name);
      if (!keepPrefixes.has(prefix)) {
        await removeFile(path.join(soldierDir, entry.name));
      }
    }
  }

  for (const [variant, keepPrefixes] of Object.entries(flatZombieKeepPrefixes)) {
    const variantDir = path.join(assetsRoot, 'characters', 'zombie', 'variants', variant);
    const files = await listFiles(variantDir);

    for (const entry of files) {
      if (!entry.isFile() || !entry.name.endsWith('.png')) continue;

      const prefix = flatZombiePrefix(entry.name);
      if (!keepPrefixes.has(prefix)) {
        await removeFile(path.join(variantDir, entry.name));
      }
    }
  }

  for (let variantNumber = 3; variantNumber <= 15; variantNumber += 1) {
    const variantDir = path.join(
      assetsRoot,
      'characters',
      'zombie',
      'variants',
      `variant_${variantNumber}`,
    );

    const walkDir = path.join(variantDir, 'walk');
    const walkFiles = await listFiles(walkDir);
    for (const entry of walkFiles) {
      if (entry.isFile() && /^run_\d+\.png$/i.test(entry.name)) {
        await removeFile(path.join(walkDir, entry.name));
      }
    }

    const idleDir = path.join(variantDir, 'idle');
    const idleFiles = await listFiles(idleDir);
    const unusedIdlePattern = variantNumber === 6 ? /^idle1_\d+\.png$/i : /^idle2_\d+\.png$/i;
    for (const entry of idleFiles) {
      if (entry.isFile() && unusedIdlePattern.test(entry.name)) {
        await removeFile(path.join(idleDir, entry.name));
      }
    }
  }

  console.log(`[prune-assets] ${root}: removed ${removedFiles} files (${formatMB(removedBytes)}).`);
}

const roots = process.argv.slice(2);
const targetRoots = roots.length > 0 ? roots : DEFAULT_ROOTS;

for (const root of targetRoots) {
  await pruneRoot(root);
}
