const MESSAGE_CONFIG = {
  inventories: {
    rq: "OTA_HotelInvCountNotifRQ",
    rs: "OTA_HotelInvCountNotifRS",
    filePrefix: "inv",
  },
  reservations: {
    rq: "OTA_HotelResNotifRQ",
    rs: "OTA_HotelResNotifRS",
    filePrefix: "rsv",
  },
  rates: {
    rq: "OTA_HotelRatePlanNotifRQ",
    rs: "OTA_HotelRatePlanNotifRS",
    filePrefix: "rate",
  },
  restrictions: {
    rq: "OTA_HotelAvailNotifRQ",
    rs: "OTA_HotelAvailNotifRS",
    filePrefix: "restr",
  },
  groupblocks: {
    rq: "OTA_HotelInvBlockNotifRQ",
    rs: "OTA_HotelInvBlockNotifRS",
    filePrefix: "grp",
  },
};

const getRootMessage = (parsedXml) => {
  const rootName = Object.keys(parsedXml)[0];

  if (!rootName) {
    const error = new Error("XML root element not found");
    error.statusCode = 400;
    throw error;
  }

  return {
    rootName,
    rootData: parsedXml[rootName],
  };
};

const getMessageMeta = (messageType, rootName) => {
  const config = MESSAGE_CONFIG[messageType];

  if (!config) {
    const error = new Error("Unsupported OTA endpoint");
    error.statusCode = 404;
    throw error;
  }

  if (rootName === config.rq) {
    return {
      direction: "RQ",
      filePrefix: config.filePrefix,
      expectedRoot: config.rq,
      requiresHotelCode: true,
    };
  }

  if (rootName === config.rs) {
    return {
      direction: "RS",
      filePrefix: `${config.filePrefix}_rs`,
      expectedRoot: config.rs,
      requiresHotelCode: false,
    };
  }

  const error = new Error(
    `Invalid XML root for ${messageType}. Received ${rootName}`,
  );
  error.statusCode = 400;
  throw error;
};

const findBasicPropertyInfo = (obj) => {
  if (!obj || typeof obj !== "object") return null;

  if (obj.BasicPropertyInfo) {
    return obj.BasicPropertyInfo;
  }

  for (const key of Object.keys(obj)) {
    const result = findBasicPropertyInfo(obj[key]);
    if (result) return result;
  }

  return null;
};

const findHotelCode = (obj) => {
  if (!obj || typeof obj !== "object") return null;

  if (obj.HotelCode) {
    return obj.HotelCode;
  }

  for (const key of Object.keys(obj)) {
    const result = findHotelCode(obj[key]);
    if (result) return result;
  }

  return null;
};

const extractHotelCode = (rootData) => {
  const basicPropertyInfo = findBasicPropertyInfo(rootData);

  if (Array.isArray(basicPropertyInfo)) {
    const found = basicPropertyInfo.find((item) => item?.HotelCode);
    if (found?.HotelCode) return found.HotelCode;
  }

  if (basicPropertyInfo?.HotelCode) {
    return basicPropertyInfo.HotelCode;
  }

  return findHotelCode(rootData);
};

const sanitizeFileNamePart = (value) => {
  if (!value) return null;

  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
};

const extractEchoToken = (rootData) => {
  return sanitizeFileNamePart(rootData?.EchoToken);
};

module.exports = {
  MESSAGE_CONFIG,
  getRootMessage,
  getMessageMeta,
  extractHotelCode,
  extractEchoToken,
};
