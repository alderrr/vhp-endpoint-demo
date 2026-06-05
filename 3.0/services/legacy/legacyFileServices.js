const fs = require("fs/promises");
const path = require("path");

const createLegacyDebugFolders = async ({ drive, userId, hotelCode }) => {
  for (let i = 1; i <= 12; i++) {
    const debugPath = path.join(drive, userId, hotelCode, `debug${i}`);
    await fs.mkdir(debugPath, { recursive: true });
  }
};

const getSecondsSinceMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);

  midnight.setHours(0, 0, 0, 0);

  return Math.floor((now.getTime() - midnight.getTime()) / 1000);
};

const getCmgrpTimestamp = () => {
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

const saveLegacyXml = async ({
  drive,
  userId,
  hotelCode,
  fileType,
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

  if (!hotelCode) {
    const error = new Error("HotelCode not found in XML");
    error.statusCode = 400;
    throw error;
  }

  const folderPath = path.join(drive, userId, hotelCode, "raw");

  await fs.mkdir(folderPath, { recursive: true });

  let fileName;

  if (userId.toUpperCase() === "VHP-CMGRP") {
    fileName = `rsv_${hotelCode}_${getCmgrpTimestamp()}.xml`;
  } else {
    const formattedDate = new Date().toISOString().split("T")[0];
    const timestamp = getSecondsSinceMidnight();

    fileName = `${fileType}_${formattedDate}_${timestamp}.xml`;
  }

  const filePath = path.join(folderPath, fileName);

  await fs.writeFile(filePath, xmlBody, "utf8");

  await createLegacyDebugFolders({
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
  saveLegacyXml,
};
