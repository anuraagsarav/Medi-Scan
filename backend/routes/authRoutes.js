const express = require("express");
const {
  register,
  verifyOTP,
  login,
  logout,
  forgotPassword,
  resetPassword,
  resendOTP,
} = require("../controllers/authController");
const { checkVerification } = require('../controllers/authController');

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/is-verified", checkVerification);

module.exports = router;
