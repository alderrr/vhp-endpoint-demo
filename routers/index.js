const Controller = require("../controllers/controller");
const router = require("express").Router();

router.post("/", Controller.checkRequest);

module.exports = router;
