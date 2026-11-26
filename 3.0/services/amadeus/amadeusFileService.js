'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { MESSAGE_CONFIG, extractEchoToken } = require('../../helpers/otaMessage');

const LOG_TIMEZONE = 'Asia/Jakarta';
const pendingWrites = new Map(); // Serialize appends per log file within this Node.js process.

const createDebugFolders = async (basePath) => {
  await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      fs.mkdir(path.join(basePath, `debug${i + 1}`), { recursive: true }),
    ),
  );
};

/** Prevent an untrusted client or HotelCode from escaping the configured DRIVE. */
const validateFolderSegment = (value, label) => {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(value) ||
    /[. ]$/.test(value)
  ) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
};

/** Stable WIB day boundary, regardless of the Windows server timezone. */
const getJakartaTimestamp = (date) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: LOG_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const values = Object.fromEntries(
    formatter.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  );
  const day = `${values.year}${values.month}${values.day}`;
  const millis = String(date.getMilliseconds()).padStart(3, '0');
  const human = `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}.${millis} WIB`;
  return { day, human };
};

/** Keep untrusted metadata on a single log line without losing meaningful punctuation. */
const safeLine = (value) =>
  value == null || value === ''
    ? '-'
    : String(value).replace(/[\r\n\t\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 500) || '-';

const formatLogEntry = ({
  loggedAt,
  messageType,
  rootName,
  direction,
  hotelCode,
  reservationNumber,
  echoToken,
  status,
  warnings,
  errors,
  xmlBody,
  xmlFileName = null,
}) => {
  const lines = [
    '================================================================================',
    `Timestamp          : ${loggedAt}`,
    `Message Type       : ${safeLine(messageType)}`,
    `OTA Message        : ${safeLine(rootName)}`,
    `Direction          : ${safeLine(direction)}`,
    `HotelCode          : ${safeLine(hotelCode)}`,
    `Reservation Number : ${safeLine(reservationNumber)}`,
    `EchoToken          : ${safeLine(echoToken)}`,
    `Status             : ${safeLine(status)}`,
    `Body               : ${safeLine(status)}`,
  ];

  // Link the daily log entry to its corresponding RQ XML file.
  if (xmlFileName) lines.push(`XML File           : ${safeLine(xmlFileName)}`);

  // Successful RS responses are compact. Keep any important warning details.
  if (status === 'SUCCESS' && warnings?.length) {
    lines.push(`Warnings           : ${JSON.stringify(warnings)}`);
  }

  if (status === 'ERROR' && Array.isArray(errors) && errors.length > 0) {
    // Write only the parsed <Errors> content. JSON preserves arbitrary fields,
    // attributes, nested elements, and multiple Error entries without guessing
    // which fields the OTA will return.
    // Match the compact, single-line format used for Warnings.
    // JSON.stringify safely escapes line breaks in error values and retains
    // all attributes, nested fields, and multiple errors.
    lines.push(`Errors             : ${JSON.stringify(errors.length === 1 ? errors[0] : errors)}`);
  } else if (status !== 'SUCCESS') {
    // For REQUEST/UNKNOWN or errors without an <Errors> element (e.g. SOAP
    // Fault), retain the original XML so diagnostic detail is not lost.
    lines.push('Original XML:');
    lines.push(String(xmlBody ?? '').trim());
  }

  return lines.join('\n') + '\n\n';
};

/**
 * Persist the original RQ exactly as received, in the same hotel/raw folder
 * as its daily log. Use the historic XML naming convention, with an exclusive
 * create to avoid overwriting another request in the same second.
 */
const saveRqXml = async ({ folderPath, hotelCode, messageType, echoToken, xmlBody, day, human }) => {
  const config = MESSAGE_CONFIG[messageType];
  if (!config) {
    const error = new Error('Unsupported OTA message type for RQ XML storage');
    error.statusCode = 400;
    throw error;
  }

  // Timestamp convention: YYYYMMDD + seconds since midnight (Jakarta time).
  const [hh, mm, ss] = human.slice(11, 19).split(':').map(Number);
  const seconds = hh * 3600 + mm * 60 + ss;
  const safeEchoToken = extractEchoToken({ EchoToken: echoToken });
  const suffix = safeEchoToken ? `_${safeEchoToken}` : '';
  const baseName = `${config.filePrefix}_${hotelCode}_${day}${seconds}${suffix}`;
  let fileName = `${baseName}.xml`;

  for (;;) {
    const filePath = path.join(folderPath, fileName);
    try {
      await fs.writeFile(filePath, xmlBody, { encoding: 'utf8', flag: 'wx' });
      return { xmlFileName: fileName, xmlFilePath: filePath };
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      // Never replace the earlier XML even when two requests share timestamp/EchoToken.
      fileName = `${baseName}_${randomUUID()}.xml`;
    }
  }
};

/** Serialize concurrent writes to the SAME daily log within a single process. */
const appendSequentially = (filePath, content) => {
  const previous = pendingWrites.get(filePath) || Promise.resolve();
  const current = previous.catch(() => {}).then(() => fs.appendFile(filePath, content, 'utf8'));
  pendingWrites.set(filePath, current);
  const clear = () => {
    if (pendingWrites.get(filePath) === current) pendingWrites.delete(filePath);
  };
  current.then(clear, clear);
  return current;
};

/**
 * Stores every request in a daily log; RQ also saves a standalone XML file.
 * Same folder rules as before:
 *   RS -> DRIVE/userId/raw/YYYYMMDD.log
 *   RQ -> DRIVE/userId/hotelCode/raw/YYYYMMDD.log
 */
const appendAmadeusLog = async ({
  drive,
  userId,
  hotelCode = null,
  direction,
  messageType,
  rootName,
  reservationNumber = null,
  echoToken = null,
  status,
  warnings = [],
  errors = [],
  xmlBody,
  now = new Date(),
}) => {
  if (!drive) {
    const error = new Error('Missing Environment Variable: Drive');
    error.statusCode = 500;
    throw error;
  }
  validateFolderSegment(userId, 'userId');
  if (direction !== 'RS' && direction !== 'RQ') {
    const error = new Error('Invalid OTA message direction');
    error.statusCode = 400;
    throw error;
  }
  if (direction === 'RQ') validateFolderSegment(hotelCode, 'hotelCode');

  const basePath = direction === 'RS'
    ? path.join(drive, userId)
    : path.join(drive, userId, hotelCode);
  const folderPath = path.join(basePath, 'raw');
  const { day, human } = getJakartaTimestamp(now);
  const fileName = `${day}.log`;
  const filePath = path.join(folderPath, fileName);

  await fs.mkdir(folderPath, { recursive: true });
  await createDebugFolders(basePath);

  // RS remains log-only. Every RQ additionally creates its original XML.
  const rqFile = direction === 'RQ'
    ? await saveRqXml({ folderPath, hotelCode, messageType, echoToken, xmlBody, day, human })
    : { xmlFileName: null, xmlFilePath: null };

  const logEntry = formatLogEntry({
    loggedAt: human,
    messageType,
    rootName,
    direction,
    hotelCode,
    reservationNumber,
    echoToken,
    status,
    warnings,
    errors,
    xmlBody,
    xmlFileName: rqFile.xmlFileName,
  });

  await appendSequentially(filePath, logEntry);

  return { folderPath, fileName, filePath, ...rqFile };
};

module.exports = { appendAmadeusLog };
