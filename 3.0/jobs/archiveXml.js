"use strict";

/**
 * Archive prior-day VHP XML files from known integration users only.
 * Destination is ALWAYS the application's root/archive folder.
 * There is intentionally no cleanup/deletion of the archive.
 *
 * Can be invoked manually: node jobs/archiveXml.js --dry-run
 *                           node jobs/archiveXml.js
 */

const fs = require("node:fs/promises");
const { constants } = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_ARCHIVE_ROOT = path.join(PROJECT_ROOT, "archive");
const TIMEZONE = "Asia/Jakarta";
const MIN_AGE_MS = 2 * 60 * 1000;


const safeDirectoryName = (name) =>
  typeof name === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(name);

/** YYYY-MM-DD for a Date in the chosen operational time zone. */
function dateKey(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (name) => parts.find((p) => p.type === name).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

async function isRealDirectory(folder) {
  try {
    return (await fs.lstat(folder)).isDirectory(); // Reject directory symlinks.
  } catch (err) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
}

/**
 * Determine the only top-level user folders the job may scan.
 * - Basic Auth users from CLIENTS
 * - Bearer users from data/ota-clients.json
 * - Optional extra entries in ARCHIVE_USERS
 * Never enumerate the DRIVE root directly.
 */
async function getKnownUsers() {
  const ids = new Set(
    (process.env.ARCHIVE_USERS || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  );

  if (process.env.CLIENTS) {
    const clients = JSON.parse(process.env.CLIENTS);
    if (!Array.isArray(clients)) throw new Error("CLIENTS must be a JSON array");
    for (const credential of clients) {
      if (typeof credential === "string" && credential.includes(":")) {
        ids.add(credential.slice(0, credential.indexOf(":")));
      }
    }
  }

  try {
    const data = JSON.parse(
      await fs.readFile(path.join(PROJECT_ROOT, "data", "ota-clients.json"), "utf8"),
    );
    if (!Array.isArray(data.clients)) throw new Error("Invalid ota-clients.json: clients must be an array");
    for (const client of data.clients) ids.add(client.client_id);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  if (ids.size === 0) throw new Error("No integration users found; set ARCHIVE_USERS or configure CLIENTS");
  for (const id of ids) {
    if (!safeDirectoryName(id)) throw new Error(`Unsafe integration user ID: ${id}`);
  }
  return [...ids];
}

/**
 * Copy exclusively (never overwrite), then delete only when the source
 * remains unchanged. Copy works even if project root and DRIVE use different
 * disks. On an interrupted run the source is retained for a later retry.
 */
async function moveSafely(source, destination, sourceBefore) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const filename = path.parse(destination);
  let target = destination;

  for (;;) {
    try {
      await fs.copyFile(source, target, constants.COPYFILE_EXCL);
      break;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      target = path.join(filename.dir, `${filename.name}_${randomUUID()}${filename.ext}`);
    }
  }

  // Avoid deleting a file which may have been touched while copying.
  const sourceAfter = await fs.stat(source);
  if (
    sourceAfter.size !== sourceBefore.size ||
    sourceAfter.mtimeMs !== sourceBefore.mtimeMs
  ) {
    await fs.unlink(target);
    return { moved: false, reason: "source changed during copy" };
  }

  const destinationAfter = await fs.stat(target);
  if (destinationAfter.size !== sourceBefore.size) {
    await fs.unlink(target);
    return { moved: false, reason: "destination size mismatch" };
  }

  await fs.unlink(source);
  return { moved: true, target };
}

/**
 * Executes an archive pass; safe to rerun.
 * Optional arguments allow tests to use isolated temporary directories.
 */
async function archiveXml({
  now = new Date(),
  dryRun = false,
  drive = process.env.DRIVE,
  archiveRoot = DEFAULT_ARCHIVE_ROOT,
  users,
} = {}) {
  if (!drive || !path.isAbsolute(drive)) {
    throw new Error("DRIVE must be an absolute path (e.g. C:\\\\)");
  }
  if (!path.isAbsolute(archiveRoot)) {
    throw new Error("archiveRoot must be an absolute path");
  }

  const normalizedDrive = path.resolve(drive);
  const normalizedArchive = path.resolve(archiveRoot);
  if (normalizedDrive === normalizedArchive) {
    throw new Error("Archive root cannot equal DRIVE");
  }

  const userIds = users || (await getKnownUsers());
  for (const userId of userIds) {
    if (!safeDirectoryName(userId)) throw new Error(`Unsafe integration user ID: ${userId}`);
  }

  const today = dateKey(now);
  const minModifiedTime = now.getTime() - MIN_AGE_MS;
  const summary = { dryRun, eligible: 0, moved: 0, skipped: 0, failures: 0, archiveRoot: normalizedArchive };

  async function processRaw(rawDir, locationParts) {
    if (!(await isRealDirectory(rawDir))) return;
    const entries = await fs.readdir(rawDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !/\.xml$/i.test(entry.name)) continue;
      const source = path.join(rawDir, entry.name);
      try {
        const info = await fs.stat(source);
        const fileDate = dateKey(info.mtime);
        // Archive previous-day files only, and never files being written now.
        if (fileDate >= today || info.mtimeMs > minModifiedTime) {
          summary.skipped += 1;
          continue;
        }

        summary.eligible += 1;
        const destination = path.join(normalizedArchive, fileDate, ...locationParts, "raw", entry.name);
        if (dryRun) {
          console.log(`[ARCHIVE DRY RUN] ${source} -> ${destination}`);
          continue;
        }

        const result = await moveSafely(source, destination, info);
        if (result.moved) {
          summary.moved += 1;
          console.log(`[ARCHIVED] ${source} -> ${result.target}`);
        } else {
          summary.skipped += 1;
          console.warn(`[ARCHIVE SKIPPED] ${source}: ${result.reason}`);
        }
      } catch (err) {
        summary.failures += 1;
        console.error(`[ARCHIVE FAILED] ${source}: ${err.message}`);
      }
    }
  }

  for (const userId of userIds) {
    const userRoot = path.join(normalizedDrive, userId);
    if (!(await isRealDirectory(userRoot))) continue;

    // Example: C:\\AMADEUS\\raw (RS / General without HotelCode).
    await processRaw(path.join(userRoot, "raw"), [userId]);

    // Example: C:\\AMADEUS\\VHPCD\\raw (RQ / Legacy / General with HotelCode).
    const folders = await fs.readdir(userRoot, { withFileTypes: true });
    for (const folder of folders) {
      if (!folder.isDirectory() || !safeDirectoryName(folder.name)) continue;
      await processRaw(path.join(userRoot, folder.name, "raw"), [userId, folder.name]);
    }
  }

  console.log(`[ARCHIVE SUMMARY] ${JSON.stringify(summary)}`);
  if (summary.failures) throw new Error(`${summary.failures} XML file(s) could not be archived`);
  return summary;
}

if (require.main === module) {
  require("dotenv").config({ path: path.join(PROJECT_ROOT, ".env") });
  archiveXml({ dryRun: process.argv.includes("--dry-run") }).catch((err) => {
    console.error("[ARCHIVE ERROR]", err);
    process.exitCode = 1;
  });
}

module.exports = { archiveXml };
