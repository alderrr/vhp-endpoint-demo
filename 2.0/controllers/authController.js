const { signToken } = require("../helpers/jwt");
const {
  addClient,
  findAllClients,
  verifyClient,
  findClientById,
} = require("../helpers/clients");

class authController {
  static async getToken(req, res, next) {
    try {
      const { client_id, client_secret, grant_type } = req.body;
      if (!client_id || !client_secret || !grant_type) {
        return res.status(400).json({ error: "invalid_client" });
      }
      if (grant_type !== "client_credentials") {
        return res.status(400).json({ error: "unsupported grant type" });
      }

      const client = await verifyClient(client_id, client_secret);
      if (!client) {
        return res.status(401).json({ error: "invalid_client" });
      }
      const payload = { sub: client.client_id };
      const accessToken = signToken(payload);

      res.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
      });
    } catch (err) {
      next(err);
    }
  }
  static async createClient(req, res, next) {
    try {
      const { client_id, client_secret } = req.body;

      if (!client_id || !client_secret) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const existing = await findClientById(client_id);
      if (existing) {
        return res.status(409).json({ error: "client_id already exists" });
      }

      await addClient({
        clientId: client_id,
        clientSecret: client_secret,
      });
      res.status(201).json({ message: "Client added successfully", client_id });
    } catch (err) {
      next(err);
    }
  }
  static async getAllClients(req, res, next) {
    try {
      const clients = await findAllClients();
      res.json(clients);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = authController;
