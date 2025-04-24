const fs = require("fs");
const path = require("path");

const errorHandler = (err, req, res, next) => {
  //! Status Code 500
  let status = 500;
  let message = "Internal Server Error";

  if (err.message === "Invalid requestor_id") {
    status = 400;
    message = "Invalid requestor_id";
  }

  if (err.message === "Invalid or missing XML body") {
    status = 400;
    message = "Invalid or missing XML body";
  }

  if (err.message === "Invalid client_id or client_secret") {
    status = 401;
    message = "Unauthorized";
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

  res.status(status).send({
    message,
  });
};

module.exports = errorHandler;
