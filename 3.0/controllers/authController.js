const { signToken } = require("../helpers/jwt");
const {
  addOtaClient,
  findOtaClientById,
  verifyOtaClient,
  getAllOtaClients,
} = require("../helpers/otaClientStore");

class AuthController {
  static async getToken(req, res, next) {
    try {
      const { client_id, client_secret, grant_type } = req.body;

      if (!client_id || !client_secret || !grant_type) {
        return res.status(400).json({
          error: "invalid_client",
          error_description:
            "client_id, client_secret, and grant_type are required",
        });
      }

      if (grant_type !== "client_credentials") {
        return res.status(400).json({
          error: "unsupported_grant_type",
          error_description: "Only client_credentials is supported",
        });
      }

      const client = await verifyOtaClient(client_id, client_secret);

      if (!client) {
        return res.status(401).json({
          error: "invalid_client",
          error_description: "Invalid client_id or client_secret",
        });
      }

      const accessToken = signToken({
        sub: client.client_id,
        type: "ota",
      });

      return res.status(200).json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 1800,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createClient(req, res, next) {
    try {
      const { client_id, client_secret, name } = req.body;

      if (!client_id || !client_secret) {
        return res.status(400).json({
          statusCode: 400,
          statusDescription: "Bad Request",
          data: "FAILED",
          error: {
            message: "client_id and client_secret are required",
          },
        });
      }

      const existingClient = await findOtaClientById(client_id);

      if (existingClient) {
        return res.status(409).json({
          statusCode: 409,
          statusDescription: "Conflict",
          data: "FAILED",
          error: {
            message: "client_id already exists",
          },
        });
      }

      const client = await addOtaClient({
        clientId: client_id,
        clientSecret: client_secret,
        name,
      });

      return res.status(201).json({
        statusCode: 201,
        statusDescription: "Client created successfully",
        data: client,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllClients(req, res, next) {
    try {
      const clients = await getAllOtaClients();

      return res.status(200).json({
        statusCode: 200,
        statusDescription: "SUCCESS",
        data: clients,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
