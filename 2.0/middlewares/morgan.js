const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const drive = process.env.DRIVE;

// Extract username from Basic Auth
morgan.token("basic_user", (req) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Basic ")) return "missing_auth";
  try {
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8"
    );
    const [username] = credentials.split(":");
    return username || "unknown_user";
  } catch {
    return "invalid_auth";
  }
});

// Extract password from Basic Auth
morgan.token("basic_pass", (req) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Basic ")) return "missing_auth";
  try {
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8"
    );
    const [, password] = credentials.split(":");
    return password || "unknown_pass";
  } catch {
    return "invalid_auth";
  }
});

morgan.token("gmt7-date", () => {
  return new Date().toLocaleString("en-US", {
    timeZone: "Asia/Bangkok",
    hour12: false,
  });
});

const morganMiddleware = morgan(
  ":gmt7-date GMT+7 - IP: :remote-addr - Method: :method - URL: :url - Status: :status - Response Time: :response-time ms - Username: :basic_user - Hotelcode: :basic_pass",
  {
    stream: {
      write: (message) => {
        const username =
          message.match(/Username:\s*(\S+)/)?.[1] || "unknown_user";
        const hotelcode =
          message.match(/Hotelcode:\s*(\S+)/)?.[1] || "unknown_pass";
        const logDirectory = path.join(
          `${drive}/${username}/${hotelcode}/log/`
        );
        if (!fs.existsSync(logDirectory)) {
          fs.mkdirSync(logDirectory, { recursive: true });
        }
        const currentYearMonth = new Date().toISOString().slice(0, 7);
        const logFileName = `${currentYearMonth}-requests.log`;
        const logFilePath = path.join(logDirectory, logFileName);
        fs.appendFileSync(logFilePath, message + "\n");
      },
    },
  }
);

module.exports = morganMiddleware;
