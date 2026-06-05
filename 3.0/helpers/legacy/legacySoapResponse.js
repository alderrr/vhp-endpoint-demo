const crypto = require("crypto");

const buildRmsSoapResponse = ({
  fileType,
  fileMessageId,
  fileMessageAction,
}) => {
  const uuid = crypto.randomUUID();

  if (fileType === "RateRQ") {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing">
  <soap:Header>
    <wsa:Action>${fileMessageAction || ""}</wsa:Action>
    <wsa:MessageID>${uuid}</wsa:MessageID>
    <wsa:RelatesTo>${fileMessageId || ""}</wsa:RelatesTo>
    <wsa:To>http://www.w3.org/2005/08/addressing/role/anonymous</wsa:To>
  </soap:Header>
  <soap:Body/>
</soap:Envelope>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://www.w3.org/2005/08/addressing">
  <soap:Header>
    <wsa:To>http://www.w3.org/2005/08/addressing/role/anonymous</wsa:To>
    <wsa:Action soap:mustUnderstand="1">${fileMessageAction || ""}</wsa:Action>
    <wsa:RelatesTo>${fileMessageId || ""}</wsa:RelatesTo>
    <wsa:MessageID>${uuid}</wsa:MessageID>
  </soap:Header>
  <soap:Body/>
</soap:Envelope>`;
};

const buildCmgrpResponse = () => {
  const now = new Date().toISOString().slice(0, 19);

  return `<OTA_HotelResNotifRS TimeStamp="${now}">
  <HotelReservations>
    <HotelReservation>
      <ResGlobalInfo>
        <HotelReservationIDs></HotelReservationIDs>
      </ResGlobalInfo>
    </HotelReservation>
  </HotelReservations>
  <Success/>
</OTA_HotelResNotifRS>`;
};

const buildLegacySoapResponse = ({
  userId,
  fileType,
  fileMessageId,
  fileMessageAction,
}) => {
  const normalizedUser = userId?.trim().toUpperCase() || "";

  if (normalizedUser === "VHP-CMGRP" && fileType === "NotifRQ") {
    return buildCmgrpResponse();
  }

  return buildRmsSoapResponse({
    fileType,
    fileMessageId,
    fileMessageAction,
  });
};

const buildLegacySoapFault = (message) => {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <soap:Fault>
      <soap:Code>
        <soap:Value>soap:Sender</soap:Value>
      </soap:Code>
      <soap:Reason>
        <soap:Text xml:lang="en-US">${message}</soap:Text>
      </soap:Reason>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;
};

module.exports = {
  buildLegacySoapResponse,
  buildLegacySoapFault,
};
