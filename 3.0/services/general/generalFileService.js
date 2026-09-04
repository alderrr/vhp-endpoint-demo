const fs = require("fs/promises");
const path = require("path");

const createGeneralDebugFolders = async ({ drive, userId, hotelCode }) => {
  const basePath = hotelCode
    ? path.join(drive, userId, hotelCode)
    : path.join(drive, userId);

  for (let i = 1; i <= 12; i++) {
    const debugPath = path.join(basePath, `debug${i}`);
    await fs.mkdir(debugPath, { recursive: true });
  }
};

/**
 * Same timestamp style as legacy VHP-CMGRP:
 * DDMMYYHHMMSS
 */
const getGeneralTimestamp = () => {
  const now = new Date();

  return (
    String(now.getDate()).padStart(2, "0") +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getFullYear()).slice(-2) +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0")
  );
};

const saveGeneralReservationXml = async ({
  drive,
  userId,
  hotelCode,
  xmlBody,
}) => {
  if (!drive) {
    const error = new Error("Missing Environment Variable: Drive");
    error.statusCode = 500;
    throw error;
  }

  if (!userId) {
    const error = new Error("Missing userId");
    error.statusCode = 401;
    throw error;
  }

  const folderPath = hotelCode
    ? path.join(drive, userId, hotelCode, "raw")
    : path.join(drive, userId, "raw");

  await fs.mkdir(folderPath, { recursive: true });

  const timestamp = getGeneralTimestamp();

  const fileName = hotelCode
    ? `rsv_${hotelCode}_${timestamp}.xml`
    : `rsv_${timestamp}.xml`;

  const filePath = path.join(folderPath, fileName);

  await fs.writeFile(filePath, xmlBody, "utf8");

  await createGeneralDebugFolders({
    drive,
    userId,
    hotelCode,
  });

  return {
    folderPath,
    fileName,
    filePath,
  };
};

module.exports = {
  saveGeneralReservationXml,
};
