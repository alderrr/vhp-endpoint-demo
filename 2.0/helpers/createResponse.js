const crypto = require("crypto");

const createResponse = (userId, fileType, fileMessageId, fileMessageAction) => {
  const uuid = generateUUID();
  let response = "";

  // Normalize userId (avoid case-sensitive mismatches)
  const normalizedUser = userId?.trim().toUpperCase() || "";

  // Function to build RMS-style response (used as default)
  const buildRMSResponse = () => {
    if (fileType === "RateRQ") {
      return `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing">
        <soap:Header>
          <wsa:Action>${fileMessageAction}</wsa:Action>
          <wsa:MessageID>${uuid}</wsa:MessageID>
          <wsa:RelatesTo>${fileMessageId}</wsa:RelatesTo>
          <wsa:To>http://www.w3.org/2005/08/addressing/role/anonymous</wsa:To>
        </soap:Header>
        <soap:Body/>
      </soap:Envelope>`;
    }

    if (fileType === "NotifRQ") {
      return `<?xml version="1.0" encoding="UTF-8"?>
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://www.w3.org/2005/08/addressing">
        <soap:Header>
          <wsa:To>http://www.w3.org/2005/08/addressing/role/anonymous</wsa:To>
          <wsa:Action soap:mustUnderstand="1">${fileMessageAction}</wsa:Action>
          <wsa:RelatesTo>${fileMessageId}</wsa:RelatesTo>
          <wsa:MessageID>${uuid}</wsa:MessageID>
        </soap:Header>
        <soap:Body/>
      </soap:Envelope>`;
    }

    return "";
  };

  // Handle specific users
  if (normalizedUser === "VHP-RMS") {
    response = buildRMSResponse();
  } else if (normalizedUser === "VHP-IDEAS") {
    if (fileType === "RateRQ") {
      response = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing">
        <soap:Header>
          <wsa:Action>${fileMessageAction}</wsa:Action>
          <wsa:MessageID>${uuid}</wsa:MessageID>
          <wsa:RelatesTo>${fileMessageId}</wsa:RelatesTo>
          <wsa:To>http://www.w3.org/2005/08/addressing/role/anonymous</wsa:To>
        </soap:Header>
        <soap:Body/>
      </soap:Envelope>`;
    } else if (fileType === "NotifRQ") {
      response = `<?xml version="1.0" encoding="UTF-8"?>
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://www.w3.org/2005/08/addressing">
        <soap:Header>
          <wsa:To>http://www.w3.org/2005/08/addressing/role/anonymous</wsa:To>
          <wsa:Action soap:mustUnderstand="1">${fileMessageAction}</wsa:Action>
          <wsa:RelatesTo>${fileMessageId}</wsa:RelatesTo>
          <wsa:MessageID>${uuid}</wsa:MessageID>
        </soap:Header>
        <soap:Body/>
      </soap:Envelope>`;
    }
  } else if (normalizedUser === "VHP-CMGRP") {
    const now = new Date().toISOString().slice(0, 19);
    if (fileType === "NotifRQ") {
      response = `<OTA_HotelResNotifRS TimeStamp="${now}">
        <HotelReservations>
          <HotelReservation>
            <ResGlobalInfo>
              <HotelReservationIDs></HotelReservationIDs>
            </ResGlobalInfo>
          </HotelReservation>
        </HotelReservations>
        <Success/>
      </OTA_HotelResNotifRS>`;
    }
  }

  // Default fallback: behaves like VHP-RMS
  if (!response) {
    response = buildRMSResponse();
  }

  return response;
};

const generateUUID = () => crypto.randomUUID();

module.exports = createResponse;
