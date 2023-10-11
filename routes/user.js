const routes = require("express").Router();
const authController = require("../controllers/auth");
const userController = require("../controllers/user");
const router = require("./auth");

router.patch("/update-me", authController.protect, userController.updateMe);

module.exports = router;
