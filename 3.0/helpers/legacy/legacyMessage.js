const getLegacyRequestType = (xmlBody) => {
  if (xmlBody.includes("OTA_HotelRatePlanNotifRQ")) return "RateRQ";
  if (xmlBody.includes("OTA_HotelResNotifRQ")) return "NotifRQ";
  if (xmlBody.includes("OTA_HotelAvailNotifRQ")) return "AvailRQ";
  if (xmlBody.includes("OTA_HotelInvBlockNotifRQ")) return "GroupBlockRQ";
  if (xmlBody.includes("OTA_HotelInvCountNotifRQ")) return "InventoryRQ";

  return "Request_Body";
};

const findByKeyIncludes = (obj, keyword) => {
  if (!obj || typeof obj !== "object") return null;

  for (const key of Object.keys(obj)) {
    if (key.includes(keyword)) {
      return obj[key];
    }

    const result = findByKeyIncludes(obj[key], keyword);
    if (result) return result;
  }

  return null;
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

  if (obj.HotelCode) return obj.HotelCode;
  if (obj["@_HotelCode"]) return obj["@_HotelCode"];

  for (const key of Object.keys(obj)) {
    const result = findHotelCode(obj[key]);
    if (result) return result;
  }

  return null;
};

const extractLegacyHotelCode = (message) => {
  const basicPropertyInfo = findBasicPropertyInfo(message);

  if (Array.isArray(basicPropertyInfo)) {
    const found = basicPropertyInfo.find(
      (item) => item?.HotelCode || item?.["@_HotelCode"],
    );

    if (found?.HotelCode) return found.HotelCode;
    if (found?.["@_HotelCode"]) return found["@_HotelCode"];
  }

  if (basicPropertyInfo?.HotelCode) return basicPropertyInfo.HotelCode;
  if (basicPropertyInfo?.["@_HotelCode"])
    return basicPropertyInfo["@_HotelCode"];

  return findHotelCode(message);
};

const extractSoapMessageId = (parsedXml) => {
  const value = findByKeyIncludes(parsedXml, "MessageID");

  if (typeof value === "string") {
    return value.trim();
  }

  return null;
};

const extractSoapAction = (parsedXml) => {
  const value = findByKeyIncludes(parsedXml, "Action");

  if (typeof value === "string") {
    return value.trim();
  }

  return null;
};

module.exports = {
  getLegacyRequestType,
  extractLegacyHotelCode,
  extractSoapMessageId,
  extractSoapAction,
};
