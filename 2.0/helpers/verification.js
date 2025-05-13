const { Buffer } = require("buffer");

const verifyCredentials = (authorization) => {
  if (!authorization || !authorization.startsWith("Basic ")) {
    return false;
  }
  const base64Credentials = authorization.slice(6).trim();
  const decoded = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const clients = JSON.parse(process.env.CLIENTS);
  return clients.includes(decoded);
};

module.exports = verifyCredentials;
