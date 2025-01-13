const crypto = require("crypto");

const createResponse = (requestor_id, fileType, fileMessageId) => {
  // Generating UUID and Response
  const uuid = generateUUID();
  let response = "";

  //! IDeaS
  if (requestor_id === "IDeaS") {
    if (fileType === "RateRQ") {
      response = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing">
	      <soap:Header>
		      <wsa:Action>http://htng.org/2014B/HTNG_ARIAndReservationPushService#OTA_HotelRatePlanNotifRQ</wsa:Action>
		      <wsa:MessageID>${uuid}</wsa:MessageID>
		      <wsa:RelatesTo>${fileMessageId}</wsa:RelatesTo>
		      <wsa:To>http://www.w3.org/2005/08/addressing/role/anonymous</wsa:To>
	      </soap:Header>
	      <soap:Body/>
      </soap:Envelope>`;
    }
    if (fileType === "NotifRQ") {
      response = `<?xml version="1.0" encoding="UTF-8"?>
      <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://www.w3.org/2005/08/addressing">
	      <soap:Header>
		      <wsa:To>http://www.w3.org/2005/08/addressing/role/anonymous</wsa:To>
		      <wsa:Action soap:mustUnderstand="1">http://htng.org/2014B/HTNG_ARIAndReservationPush#OTA_HotelResNotifRS</wsa:Action>
		      <wsa:RelatesTo>${fileMessageId}</wsa:RelatesTo>
		      <wsa:MessageID>${uuid}</wsa:MessageID>
	      </soap:Header>
	      <soap:Body/>
      </soap:Envelope>`;
    }
  }

  //TODO For future purposes...
  //! Radiant1
  if (requestor_id === "Radiant1") {
    response = "TEST";
  }

  // Created Response
  return response;
};

const generateUUID = () => {
  return crypto.randomUUID();
};

module.exports = createResponse;
