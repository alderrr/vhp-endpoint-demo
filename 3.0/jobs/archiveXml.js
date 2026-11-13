'use strict';

/**
 * Automatically archive completed files ONLY from:
 *   DRIVE/ACRS/raw/       -> DRIVE/ACRS/archive/
 *
 * The same relative path (if raw contains subdirectories) is preserved.
 * Never touches other DRIVE folders, and never creates project-root/archive.
 * Run manually: node jobs/archiveXml.js --dry-run
 *               node jobs/archiveXml.js
 */

const fs = require('node:fs/promises');
const { constants } = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');

async function getDirectoryState(directory) {
  try {
    const stats = await fs.lstat(directory);
    if (!stats.isDirectory()) throw new Error(`Expected a normal directory: ${directory}`);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

/** Creates destination directories without following existing directory symlinks. */
async function ensureArchiveDirectory(acrsRoot, relativeDirectory) {
  let current = path.join(acrsRoot, 'archive');
  await fs.mkdir(current, { recursive: true });
  if (!(await getDirectoryState(current))) throw new Error(`Unsafe archive folder: ${current}`);
  if (!relativeDirectory) return current;
  for (const part of relativeDirectory.split(path.sep)) {
    if (!part || part === '.' || part === '..') throw new Error('Invalid relative archive path');
    current = path.join(current, part);
    try { await fs.mkdir(current); }
    catch (err) { if (err.code !== 'EEXIST') throw err; }
    if (!(await getDirectoryState(current))) throw new Error(`Unsafe archive folder: ${current}`);
  }
  return current;
}

/** Copy without overwrite, check source stability, then remove only the copied source. */
async function moveFile(source, targetPath, before) {
  const parsed = path.parse(targetPath);
  let target = targetPath;
  for (;;) {
    try {
      await fs.copyFile(source, target, constants.COPYFILE_EXCL);
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      target = path.join(parsed.dir, `${parsed.name}_${randomUUID()}${parsed.ext}`);
    }
  }

  try {
    const after = await fs.stat(source);
    const archived = await fs.stat(target);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || archived.size !== before.size) {
      await fs.unlink(target);
      return { moved: false, reason: 'source changed during copy' };
    }
    await fs.unlink(source);
    return { moved: true, target };
  } catch (err) {
    // Keep the source intact whenever anything goes wrong after copying.
    await fs.unlink(target).catch(() => {});
    throw err;
  }
}

/**
 * Archives files in ACRS/raw only; never scans C:\\ recursively.
 * Includes files in nested raw subdirectories, but never follows symlinks.
 * By default all files are eligible; set ARCHIVE_MIN_AGE_SECONDS to delay recent files.
 */
async function archiveAcrsRaw({
  drive = process.env.DRIVE,
  now = new Date(),
  dryRun = false,
  minAgeMs = Number(process.env.ARCHIVE_MIN_AGE_SECONDS ?? 0) * 1000,
} = {}) {
  if (!drive || !path.isAbsolute(drive)) {
    throw new Error('DRIVE must be an absolute directory (e.g. C:\\\\)');
  }
  if (!Number.isFinite(minAgeMs) || minAgeMs < 0) {
    throw new Error('ARCHIVE_MIN_AGE_SECONDS must be a non-negative number');
  }

  const acrsRoot = path.join(path.resolve(drive), 'ACRS');
  const rawRoot = path.join(acrsRoot, 'raw');
  const archiveRoot = path.join(acrsRoot, 'archive');
  const summary = { source: rawRoot, archive: archiveRoot, dryRun, eligible: 0, moved: 0, skipped: 0, failures: 0 };

  if (!(await getDirectoryState(acrsRoot)) || !(await getDirectoryState(rawRoot))) {
    console.log(`[ACRS ARCHIVE] raw folder not found; nothing to move: ${rawRoot}`);
    return summary;
  }
  // If an archive already exists, reject symlinks/junctions/file paths.
  await getDirectoryState(archiveRoot);

  async function processDirectory(sourceDirectory, relativeDirectory = '') {
    const entries = await fs.readdir(sourceDirectory, { withFileTypes: true });
    for (const entry of entries) {
      const rel = path.join(relativeDirectory, entry.name);
      const source = path.join(sourceDirectory, entry.name);
      if (entry.isSymbolicLink()) {
        summary.skipped += 1;
        console.warn(`[ACRS ARCHIVE SKIP] Symlink ignored: ${source}`);
        continue;
      }
      if (entry.isDirectory()) {
        await processDirectory(source, rel);
        // Remove now-empty nested directories, preserving the raw root itself.
        if (!dryRun) {
          try {
            const remaining = await fs.readdir(source);
            if (remaining.length === 0) await fs.rmdir(source);
          } catch (err) {
            if (err.code !== 'ENOENT' && err.code !== 'ENOTEMPTY') {
              summary.failures += 1;
              console.error(`[ACRS ARCHIVE ERROR] ${source}: ${err.message}`);
            }
          }
        }
        continue;
      }
      if (!entry.isFile()) {
        summary.skipped += 1;
        continue;
      }

      try {
        const before = await fs.stat(source);
        if (now.getTime() - before.mtimeMs < minAgeMs) {
          summary.skipped += 1;
          console.log(`[ACRS ARCHIVE SKIP] Recently modified: ${source}`);
          continue;
        }
        summary.eligible += 1;
        const destination = path.join(archiveRoot, rel);
        if (dryRun) {
          console.log(`[ACRS ARCHIVE DRY RUN] ${source} -> ${destination}`);
          continue;
        }

        await ensureArchiveDirectory(acrsRoot, relativeDirectory);
        const result = await moveFile(source, destination, before);
        if (result.moved) {
          summary.moved += 1;
          console.log(`[ACRS ARCHIVED] ${source} -> ${result.target}`);
        } else {
          summary.skipped += 1;
          console.warn(`[ACRS ARCHIVE SKIP] ${source}: ${result.reason}`);
        }
      } catch (err) {
        summary.failures += 1;
        console.error(`[ACRS ARCHIVE ERROR] ${source}: ${err.message}`);
      }
    }
  }

  await processDirectory(rawRoot);
  console.log(`[ACRS ARCHIVE SUMMARY] ${JSON.stringify(summary)}`);
  if (summary.failures) throw new Error(`${summary.failures} ACRS file(s) could not be archived`);
  return summary;
}

if (require.main === module) {
  require('dotenv').config({ path: path.join(PROJECT_ROOT, '.env') });
  archiveAcrsRaw({ dryRun: process.argv.includes('--dry-run') }).catch((err) => {
    console.error('[ACRS ARCHIVE FAILED]', err);
    process.exitCode = 1;
  });
}

module.exports = { archiveAcrsRaw };
