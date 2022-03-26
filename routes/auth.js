var express = require("express");
var router = express.Router();
var controller = require("../controllers/authController");

// router.post("/login", )

router.post("/register", controller.registerUser);
router.post("/login", controller.loginUser);
router.post("/updatePassword", controller.updatePassword);


module.exports = router;