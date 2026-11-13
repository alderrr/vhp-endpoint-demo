"use strict";

/**
 * Starts the in-process daily XML archiving job.
 * The cron job belongs to the webservice: no Windows scheduled task is
 * necessary for archiving. A separate support-owned task may delete archives.
 */

const cron = require("node-cron");
const { archiveXml } = require("./archiveXml");

function startArchiveScheduler() {
  if (process.env.ARCHIVE_ENABLED === "false") {
    console.log("[ARCHIVE] Disabled (ARCHIVE_ENABLED=false)");
    return null;
  }

  const task = cron.schedule(
    "10 0 * * *", // Every day, 00:10 Asia/Jakarta (WIB).
    async () => {
      await archiveXml();
    },
    {
      name: "vhp-daily-xml-archive",
      timezone: "Asia/Jakarta",
      noOverlap: true,
    },
  );

  // Failures are logged rather than terminating the Express webservice.
  task.on("execution:failed", (context) => {
    console.error("[ARCHIVE] Daily archive failed:", context.execution?.error);
  });

  console.log("[ARCHIVE] Daily XML archiving scheduled for 00:10 WIB");
  return task;
}

module.exports = { startArchiveScheduler };
