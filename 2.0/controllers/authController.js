const { signToken } = require("../helpers/jwt");
const { signCmsToken } = require("../helpers/cmsJwt");
const {
  addClient,
  findAllClients,
  findClientById,
  verifyClient,
} = require("../helpers/clients");
const {
  addHotel,
  getAllHotels,
  getHotelByHotelcode,
  editHotel,
  deleteHotel,
  verifyHotel,
} = require("../helpers/hotelCredential");

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
  static async createHotel(req, res, next) {
    try {
      const { username, password, hotelcode, directory } = req.body;

      if (!username || !password || !hotelcode) {
        return res
          .status(400)
          .json({ error: "Mandatory fields: username, password, hotelcode" });
      }

      const existing = await getHotelByHotelcode(hotelcode);
      if (existing) {
        return res.status(400).json({ error: "hotelcode already exists" });
      }

      await addHotel({
        username,
        password,
        hotelcode,
        directory,
      });

      res.status(201).json({ message: "Hotel added successfully", hotelcode });
    } catch (err) {
      next(err);
    }
  }
  static async getAllHotels(req, res, next) {
    try {
      const hotels = await getAllHotels();
      res.status(200).json(hotels);
    } catch (err) {
      next(err);
    }
  }
  static async updateHotel(req, res, next) {
    try {
      const { hotelcode } = req.params;
      if (!hotelcode) {
        return res.status(400).json({
          error: "hotelcode parameter is required",
        });
      }
      const existingHotel = await getHotelByHotelcode(hotelcode);
      if (!existingHotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }

      const { username, password, directory, active } = req.body;
      const updatedHotel = await editHotel(hotelcode, {
        ...(username && { username }),
        ...(password && { password }),
        ...(directory && { directory }),
        ...(active !== undefined && { active }),
      });

      res.status(200).json({
        message: "Hotel updated successfully",
        data: updatedHotel,
      });
    } catch (err) {
      next(err);
    }
  }
  static async deleteHotel(req, res, next) {
    try {
      const { hotelcode } = req.params;
      if (!hotelcode) {
        return res.status(400).json({
          error: "hotelcode parameter is required",
        });
      }

      const existingHotel = await getHotelByHotelcode(hotelcode);

      if (!existingHotel) {
        return res.ststus(400).json({
          error: "Hotel not found",
        });
      }

      await deleteHotel(hotelcode);

      res.status(200).json({
        message: "Hotel deleted successfully",
        hotelcode,
      });
    } catch (err) {
      next(err);
    }
  }
  static async cmsLogin(req, res, next) {
    try {
      const { username, password } = req.body;

      if (
        username === process.env.CMS_ADMIN_USERNAME &&
        password === process.env.CMS_ADMIN_PASSWORD
      ) {
        const token = signCmsToken({
          username: username,

          role: "admin",
        });

        return res.json({
          access_token: token,

          token_type: "Bearer",

          expires_in: 28800,
        });
      }

      return res.status(401).json({
        error: "Invalid login",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = authController;
