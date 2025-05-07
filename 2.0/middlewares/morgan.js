const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const drive = process.env.DRIVE;

morgan.token("client_secret", (req) => {
  const encoded = req.headers["client_secret"];
  if (!encoded) return "missing_secret";
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const userId = decoded.split(":")[0];
    return userId || "unknown";
  } catch (err) {
    return "invalid_secret";
  }
});
morgan.token("client_id", (req) => {
  return req.headers["client_id"] || "missing_id";
});
morgan.token("gmt7-date", () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Bangkok",
    hour12: false, // 24-hour format
  });
});

const morganMiddleware = morgan(
  ":gmt7-date GMT+7 - IP: :remote-addr - Method: :method - URL: :url - Status: :status - Response Time: :response-time ms - UserId: :client_secret - Client_ID: :client_id",
  {
    stream: {
      write: (message) => {
        const userId = message.match(/UserId:\s*(\S+)/)?.[1] || "unknown";
        const client_id = message.match(/Client_ID:\s*(\S+)/)?.[1] || "unknown";
        const logDirectory = path.join(`${drive}/${userId}/${client_id}/log/`);
        if (!fs.existsSync(logDirectory)) {
          fs.mkdirSync(logDirectory, { recursive: true });
        }
        const currentYearMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
        const logFileName = `${currentYearMonth}-requests.log`;
        const logFilePath = path.join(logDirectory, logFileName);
        fs.appendFileSync(logFilePath, message + "\n");
      },
    },
  }
);

module.exports = morganMiddleware;

// Note: Morgan is a HTTP request logger middleware for node.js
