'use strict';

/** The webservice itself runs this job; weekly archive deletion is external. */
const cron = require('node-cron');
const { archiveAcrsRaw } = require('./archiveXml');

function startArchiveScheduler() {
  if (process.env.ARCHIVE_ENABLED === 'false') {
    console.log('[ACRS ARCHIVE] Disabled by ARCHIVE_ENABLED=false');
    return null;
  }

  const task = cron.schedule('10 0 * * *', async () => {
    try {
      await archiveAcrsRaw();
    } catch (err) {
      console.error('[ACRS ARCHIVE] Scheduled archiving failed:', err);
    }
  }, {
    name: 'vhp-acrs-daily-archive',
    timezone: 'Asia/Jakarta',
    noOverlap: true,
  });

  console.log('[ACRS ARCHIVE] ACRS/raw -> ACRS/archive scheduled daily at 00:10 WIB');
  return task;
}

module.exports = { startArchiveScheduler };
