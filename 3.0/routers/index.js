const router = require("express").Router();

const AuthController = require("../controllers/authController");
const AmadeusController = require("../controllers/amadeus/amadeusController");
const LegacyController = require("../controllers/legacy/legacyController");
const GeneralController = require("../controllers/general/generalController");

const authMiddleware = require("../middlewares/authentication");

router.post("/api/v1/admin/client/add", AuthController.createClient);
router.get("/api/v1/admin/client/all", AuthController.getAllClients);
router.post("/api/v1/security/oauth2/token", AuthController.getToken);

// Amadeus
router.get("/api/v1/events-delivery/health", AmadeusController.healthCheck);
router.post(
  "/api/v1/events-delivery/:messageType",
  authMiddleware,
  AmadeusController.handleOtaMessage,
);

// General
router.post("/api/v1/reservations", GeneralController.receiveReservation);

// Legacy
router.get("/vhpws/htng.xml", LegacyController.healthCheck);
router.post("/vhpws/htng.xml", LegacyController.handleHtng);

module.exports = router;
