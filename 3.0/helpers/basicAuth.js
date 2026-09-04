const { Buffer } = require("buffer");

/**
 * Verifies Basic Auth credentials against the CLIENTS environment variable.
 *
 * Expected .env format:
 * CLIENTS=["VHP-CMGRP:1234","VHP-RMS:1234"]
 */
const verifyBasicCredentials = (authorization) => {
  if (!authorization || !authorization.startsWith("Basic ")) {
    return null;
  }

  let decoded = "";

  try {
    const base64Credentials = authorization.slice(6).trim();
    decoded = Buffer.from(base64Credentials, "base64").toString("utf8");
  } catch {
    return null;
  }

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
  };
};

module.exports = {
  verifyBasicCredentials,
};
