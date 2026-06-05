const fs = require("fs/promises");
const path = require("path");

const createDebugFoldersRQ = async ({ drive, userId, hotelCode }) => {
  if (!hotelCode) return;

  for (let i = 1; i <= 12; i++) {
    const debugPath = path.join(drive, userId, hotelCode, `debug${i}`);
    await fs.mkdir(debugPath, { recursive: true });
  }
};

const createDebugFoldersRS = async ({ drive, userId }) => {
  for (let i = 1; i <= 12; i++) {
    const debugPath = path.join(drive, userId, `debug${i}`);
    await fs.mkdir(debugPath, { recursive: true });
  }
};

const getSecondsSinceMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);

  return Math.floor((now.getTime() - midnight.getTime()) / 1000);
};

const saveAmadeusXml = async ({
  drive,
  userId,
  hotelCode,
  direction,
  filePrefix,
  echoToken,
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

  const now = new Date();
  const formattedDate = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timestamp = `${formattedDate}${getSecondsSinceMidnight()}`;

  const folderPath =
    direction === "RS"
      ? path.join(drive, userId, "raw")
      : path.join(drive, userId, hotelCode, "raw");

  await fs.mkdir(folderPath, { recursive: true });

  const tokenSuffix = echoToken ? `_${echoToken}` : "";

  const fileName =
    direction === "RS"
      ? `${filePrefix}_${timestamp}${tokenSuffix}.xml`
      : `${filePrefix}_${hotelCode}_${timestamp}${tokenSuffix}.xml`;

  const filePath = path.join(folderPath, fileName);

  await fs.writeFile(filePath, xmlBody, "utf8");

  if (direction === "RQ") {
    await createDebugFoldersRQ({ drive, userId, hotelCode });
  } else {
    await createDebugFoldersRS({ drive, userId });
  }

  return {
    folderPath,
    fileName,
    filePath,
  };
};

module.exports = {
  saveAmadeusXml,
};
