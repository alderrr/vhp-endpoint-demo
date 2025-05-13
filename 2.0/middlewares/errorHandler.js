const fs = require("fs");
const path = require("path");
const checkMessageId = require("../helpers/checkMessageId");

const generateUUID = () => {
  return crypto.randomUUID();
};

const errorHandler = (err, req, res, next) => {
  //! Status Code 500
  let status = 500;
  let message = "Internal Server Error";
  let isInvalidToken = false;
  let uuid = ""
  let xmlBody = ""
  let fileMessageId = ""

  if (err.message === "Invalid or missing XML body") {
    status = 400;
    message = "Invalid or missing XML body";
  }

  if (err.message === "Malformed XML body" || err.message === "missing root element") {
    status = 400;
    message = "Malformed XML body";
  }

  if (err.message === "Invalid token") {
    status = 401;
    message = "Invalid token";
    isInvalidToken = true
    uuid = generateUUID()
    xmlBody = req.body
    fileMessageId = checkMessageId(xmlBody);
  }

  try {
    // const logDir = process.env.DRIVE || "C:/gitlab/vhp-xml-webservice/logs";
    const logDir = "C:/gitlab/vhp-xml-webservice/logs";
    const currentDate = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    const logFile = path.join(logDir, `${currentDate}-error.log`);

    const errorMessage = `
[${new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" })}]
URL: ${req.originalUrl}
Method: ${req.method}
IP: ${req.ip}
Status: ${status}
Message: ${message}
Stack: ${err.stack || err}
--------------------------------------------------
`;

    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, errorMessage);
  } catch (logErr) {
    console.error("Failed to write to error log:", logErr.message);
  }

  if (isInvalidToken) {
    res.status(status).type("application/soap+xml").send(`<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing">
  <soap:Header>
    <wsa:Action>http://htng.org/PWSWG/2010/12/RatePlan_SubmitRequest</wsa:Action>
    <wsa:MessageID>${uuid}</wsa:MessageID>
    <wsa:RelatesTo>${fileMessageId}</wsa:RelatesTo>
    <wsa:To>http://www.w3.org/2005/08/addressing/role/anonymous</wsa:To>
  </soap:Header>
  <soap:Body>
    <soap:Fault>
      <soap:Code>
        <soap:Value>soap:Sender</soap:Value>
      </soap:Code>
      <soap:Reason>
        <soap:Text xml:lang="en-US">Invalid Username/Password</soap:Text>
      </soap:Reason>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`);
  } else {
    res.status(status).send({
    message,
  });
  }
};

module.exports = errorHandler;
