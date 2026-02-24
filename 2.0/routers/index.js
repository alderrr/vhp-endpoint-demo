const Controller = require("../controllers/controller");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authentication");
const cmsAuth = require("../middlewares/cmsAuth");
const router = require("express").Router();

router.get("/vhpws/htng.xml", Controller.testConnection);
router.post("/vhpws/htng.xml", Controller.checkRequest);

router.post("/api/v1/security/oauth2/token", authController.getToken);
router.post("/api/v1/admin/client/add", authController.createClient);
router.get("/api/v1/admin/client/all", authController.getAllClients);

router.post(
  "/api/v1/events-delivery/reservations",
  authMiddleware,
  Controller.createReservation,
);
router.post(
  "/api/v1/events-delivery/rates",
  authMiddleware,
  Controller.createRate,
);
router.post(
  "/api/v1/events-delivery/notifications",
  authMiddleware,
  Controller.requestNotification,
);

// NEW ENDPOINT 23-02-2026
router.post("/api/v1/events-delivery/raw-message", Controller.receiveMessage);

router.post("/api/cms/login", authController.cmsLogin);
router.post(
  "/api/dev/security/credentials",
  cmsAuth,
  authController.createHotel,
);
router.get(
  "/api/dev/security/credentials",
  cmsAuth,
  authController.getAllHotels,
);
router.patch(
  "/api/dev/security/credentials/:hotelcode",
  cmsAuth,
  authController.updateHotel,
);
router.delete(
  "/api/dev/security/credentials/:hotelcode",
  cmsAuth,
  authController.deleteHotel,
);

router.post("/api/dev/payload/json", Controller.testPayloadJSON);
module.exports = router;
