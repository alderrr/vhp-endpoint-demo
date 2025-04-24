const Controller = require("../controllers/controller");
const router = require("express").Router();

router.post("/vhpws/htng.xml", Controller.checkRequest);

module.exports = router;
