const routes = require("express").Router();
const authController = require("../controllers/auth");
const userController = require("../controllers/user");
const router = require("./auth");

router.patch("/update-me", authController.protect, userController.updateMe);

router.get("get-users", authController.protect, userController.getUsers);

router.get("get-friends", authController.protect, userController.getFriends);

router.get("get-friend-request", authController.protect, userController.getRequest);

module.exports = router;
