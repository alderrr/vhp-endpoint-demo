const Controller = require("../controllers/controller");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authentication");
const router = require("express").Router();

router.get("/vhpws/htng.xml", Controller.testConnection);
router.post("/vhpws/htng.xml", Controller.checkRequest);

router.post("/api/v1/security/oauth2/token", authController.getToken);
router.post("/api/v1/admin/client/add", authController.createClient);
router.get("/api/v1/admin/client/all", authController.getAllClients);

router.post(
  "/api/v1/reservation",
  authMiddleware,
  Controller.createReservation
);
router.post("/api/v1/rate", authMiddleware, Controller.createRate);
router.post(
  "/api/v1/availability",
  authMiddleware,
  Controller.createAvailability
);

module.exports = router;
