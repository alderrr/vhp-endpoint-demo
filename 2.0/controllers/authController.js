const { signToken } = require("../helpers/jwt");
const {
  addClient,
  findAllClients,
  verifyClient,
  findClientByIdAndHotel,
} = require("../helpers/clients");
const verifyCredentials = require("../helpers/verification");

class authController {
  static async getToken(req, res, next) {
    try {
      const auth = req.headers.authorization || "";
      const { hotel_code, grant_type } = req.body || {};

      if (grant_type !== "client_credentials") {
        return res.status(400).json({ error: "unsupported_grant_type" });
      }

      let client_id, client_secret;

      if (auth.startsWith("Basic ")) {
        const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
        [client_id, client_secret] = decoded.split(":");
      }

      if (!client_id || !client_secret || !hotel_code) {
        return res.status(401).json({ error: "invalid_client" });
      }
      const client = await verifyClient(client_id, client_secret, hotel_code);
      if (!client) {
        return res.status(401).json({ error: "invalid_client" });
      }

      const payload = { sub: client.client_id, hotel: client.hotel_code };
      const accessToken = signToken(payload);

      res.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
      });
    } catch (err) {
      // next(err);
      console.error(err);
      res.status(500).json({ error: "server_error" });
    }
  }
  static async createClient(req, res, next) {
    try {
      const { client_id, client_secret, hotel_code } = req.body;

      if (!client_id || !client_secret || !hotel_code) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const existing = await findClientByIdAndHotel(client_id, hotel_code);
      if (existing) {
        return res
          .status(409)
          .json({ error: "client_id + hotel_code already exists" });
      }

      await addClient({
        clientId: client_id,
        clientSecret: client_secret,
        hotelCode: hotel_code,
      });
      res
        .status(201)
        .json({ message: "Client added successfully", client_id, hotel_code });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server_error" });
    }
  }
  static async getAllClients(req, res, next) {
    try {
      const clients = await findAllClients();
      res.json(clients);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "server_error" });
    }
  }
}

module.exports = authController;
