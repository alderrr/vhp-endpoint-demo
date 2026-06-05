const router = require("express").Router();

const AuthController = require("../controllers/authController");
const AmadeusController = require("../controllers/amadeus/amadeusController");
const authMiddleware = require("../middlewares/authentication");

router.post("/api/v1/security/oauth2/token", AuthController.getToken);
router.post("/api/v1/admin/client/add", AuthController.createClient);
router.get("/api/v1/admin/client/all", AuthController.getAllClients);

router.get("/api/v1/events-delivery/health", AmadeusController.healthCheck);
router.post(
  "/api/v1/events-delivery/:messageType",
  authMiddleware,
  AmadeusController.handleOtaMessage,
);

module.exports = router;
