const { Buffer } = require("buffer");

const verifyLegacyCredentials = (authorization) => {
  if (!authorization || !authorization.startsWith("Basic ")) {
    return null;
  }

  const base64Credentials = authorization.slice(6).trim();
  const decoded = Buffer.from(base64Credentials, "base64").toString("utf8");

  let clients = [];

  try {
    clients = JSON.parse(process.env.CLIENTS || "[]");
  } catch {
    return null;
  }

  if (!Array.isArray(clients) || !clients.includes(decoded)) {
    return null;
  }

  const [userId, secret] = decoded.split(":");

  if (!userId || !secret) {
    return null;
  }

  return {
    userId,
    secret,
  };
};

module.exports = {
  verifyLegacyCredentials,
};
