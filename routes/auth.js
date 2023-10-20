const router = require("express").Router();
const authController = require("../controllers/auth");

router.post("/register", authController.register, authController.sendOtp); 
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOTP);
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword);
router.post("/forgot-password", authController.forgotPassword);

module.exports = router; 