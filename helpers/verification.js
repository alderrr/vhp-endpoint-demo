const { Buffer } = require("buffer");

const verifyCredentials = (client_id, client_secret) => {
  const clients = JSON.parse(process.env.CLIENTS);
  const decodedSecret = Buffer.from(client_secret, "base64").toString("utf-8");
  return clients[client_id] === decodedSecret;
};

module.exports = verifyCredentials;
