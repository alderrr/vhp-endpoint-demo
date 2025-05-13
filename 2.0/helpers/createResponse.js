const crypto = require("crypto");

const createResponse = (userId, fileType, fileMessageId, fileMessageAction) => {
  // Generating UUID and Response
  const uuid = generateUUID();
  let response = "";

  // console.log(userId, fileType, fileMessageId, fileMessageAction);

  //! VHP-RMS (default)
  if (userId === "VHP-RMS") {
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
    }
    if (fileType === "NotifRQ") {
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
  }

  //! IDeaS
  if (userId === "VHP-IDeaS") {
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
    }
    if (fileType === "NotifRQ") {
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
  }

  //TODO For future purposes...

  // Created Response
  return response;
};

const generateUUID = () => {
  return crypto.randomUUID();
};

module.exports = createResponse;
