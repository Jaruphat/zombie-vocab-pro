import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_AAB_PATH = 'android/app/build/outputs/bundle/release/app-release.aab';
const DEFAULT_MODULE_NAME = 'base';
const DEFAULT_WARN_LIMIT_MB = 180;
const DEFAULT_FAIL_LIMIT_MB = 200;
const DEFAULT_TOP_FILES = 10;

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function parsePositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(argv) {
  const options = {
    bundlePath: DEFAULT_AAB_PATH,
    moduleName: DEFAULT_MODULE_NAME,
    warnLimitMb: parsePositiveNumber(process.env.AAB_BASE_WARN_MB, DEFAULT_WARN_LIMIT_MB),
    failLimitMb: parsePositiveNumber(process.env.AAB_BASE_LIMIT_MB, DEFAULT_FAIL_LIMIT_MB),
    topFiles: Math.max(1, Math.trunc(parsePositiveNumber(process.env.AAB_REPORT_TOP_FILES, DEFAULT_TOP_FILES))),
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg.startsWith('--module=')) {
      options.moduleName = arg.slice('--module='.length);
      continue;
    }

    if (arg.startsWith('--warn-mb=')) {
      options.warnLimitMb = parsePositiveNumber(arg.slice('--warn-mb='.length), options.warnLimitMb);
      continue;
    }

    if (arg.startsWith('--fail-mb=')) {
      options.failLimitMb = parsePositiveNumber(arg.slice('--fail-mb='.length), options.failLimitMb);
      continue;
    }

    if (arg.startsWith('--top-files=')) {
      options.topFiles = Math.max(
        1,
        Math.trunc(parsePositiveNumber(arg.slice('--top-files='.length), options.topFiles)),
      );
      continue;
    }

    if (!arg.startsWith('--')) {
      options.bundlePath = arg;
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/check-aab-size.mjs [bundle-path] [options]

Options:
  --module=<name>      Module folder to verify inside the bundle (default: base)
  --warn-mb=<number>   Warning threshold in MB (default: 180)
  --fail-mb=<number>   Hard limit in MB (default: 200)
  --top-files=<count>  Largest module files to print (default: 10)
`);
}

function findEndOfCentralDirectory(buffer) {
  const signature = 0x06054b50;
  const minimumSize = 22;
  const maxCommentLength = 0xffff;
  const start = Math.max(0, buffer.length - minimumSize - maxCommentLength);

  for (let offset = buffer.length - minimumSize; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) {
      return offset;
    }
  }

  throw new Error('Unable to locate ZIP end of central directory record.');
}

function readZipCentralDirectory(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

  if (totalEntries === 0xffff || centralDirectorySize === 0xffffffff || centralDirectoryOffset === 0xffffffff) {
    throw new Error('ZIP64 bundles are not supported by this size checker.');
  }

  const entries = [];
  let offset = centralDirectoryOffset;

  while (offset < centralDirectoryEnd) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x02014b50) {
      throw new Error(`Unexpected central directory signature at offset ${offset}.`);
    }

    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const nameStart = offset + 46;
    const nameEnd = nameStart + fileNameLength;
    const fileName = buffer.toString('utf8', nameStart, nameEnd);

    entries.push({
      fileName,
      compressedSize,
      uncompressedSize,
    });

    offset = nameEnd + extraLength + commentLength;
  }

  return entries;
}

function sumBytes(items) {
  return items.reduce((total, item) => total + item.compressedSize, 0);
}

function getTopLevelName(fileName) {
  const [firstSegment] = fileName.split('/');
  return firstSegment || '(root)';
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const bundlePath = path.resolve(process.cwd(), options.bundlePath);
  const [bundleStats, bundleBuffer] = await Promise.all([stat(bundlePath), readFile(bundlePath)]);
  const entries = readZipCentralDirectory(bundleBuffer);

  const moduleTotals = new Map();
  for (const entry of entries) {
    const moduleName = getTopLevelName(entry.fileName);
    moduleTotals.set(moduleName, (moduleTotals.get(moduleName) ?? 0) + entry.compressedSize);
  }

  const targetPrefix = `${options.moduleName}/`;
  const targetEntries = entries.filter((entry) => entry.fileName.startsWith(targetPrefix));
  if (targetEntries.length === 0) {
    throw new Error(`Module "${options.moduleName}" was not found in ${bundlePath}.`);
  }

  const targetCompressedBytes = sumBytes(targetEntries);
  const warnLimitBytes = options.warnLimitMb * 1024 * 1024;
  const failLimitBytes = options.failLimitMb * 1024 * 1024;

  console.log(`[aab-check] Bundle: ${bundlePath}`);
  console.log(`[aab-check] File size: ${formatMB(bundleStats.size)}`);
  console.log('[aab-check] Module compressed sizes:');

  for (const [moduleName, compressedSize] of [...moduleTotals.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${moduleName}: ${formatMB(compressedSize)}`);
  }

  console.log(`[aab-check] Largest files in "${options.moduleName}" by compressed size:`);
  for (const entry of [...targetEntries].sort((a, b) => b.compressedSize - a.compressedSize).slice(0, options.topFiles)) {
    console.log(`  - ${formatMB(entry.compressedSize)} | ${entry.fileName}`);
  }

  if (targetCompressedBytes > failLimitBytes) {
    console.error(
      `[aab-check] FAIL: ${options.moduleName} compressed size ${formatMB(targetCompressedBytes)} exceeds ${options.failLimitMb} MB.`,
    );
    process.exitCode = 1;
    return;
  }

  if (targetCompressedBytes > warnLimitBytes) {
    console.warn(
      `[aab-check] WARN: ${options.moduleName} compressed size ${formatMB(targetCompressedBytes)} exceeds warning threshold ${options.warnLimitMb} MB.`,
    );
    return;
  }

  console.log(
    `[aab-check] PASS: ${options.moduleName} compressed size ${formatMB(targetCompressedBytes)} is within ${options.failLimitMb} MB.`,
  );
}

main().catch((error) => {
  console.error(`[aab-check] ERROR: ${error.message}`);
  process.exitCode = 1;
});
