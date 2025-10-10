const Controller = require("../controllers/controller");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authentication");
const router = require("express").Router();

router.get("/vhpws/htng.xml", Controller.testConnection);
router.post("/vhpws/htng.xml", Controller.checkRequest);

router.post("/oauth/token", authController.getToken);
router.post("/admin/client/add", authController.createClient);
router.get("/admin/client/all", authController.getAllClients);

router.post("/vhpws/reservation", authMiddleware, Controller.createReservation);

module.exports = router;
