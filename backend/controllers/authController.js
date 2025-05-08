const User = require("../models/userModel");
const { hash, compare } = require("../utils/hashPassword");
const generateOTP = require("../utils/generateOTP");
const generateToken = require("../utils/generateToken");
const { sendOTPEmail } = require("../services/emailService");

// Register user with email, password, and phone number
exports.register = async (req, res) => {
  const { email, password, phno } = req.body;

  // ✅ Validate required fields
  if (!email || !password || !phno) {
    return res.status(400).json({ msg: "Email, password, and phone number are required" });
  }

  try {
    // ✅ Check for existing email
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // ✅ Hash password & generate OTP
    const hashed = await hash(password);
    const otp = generateOTP();

    // ✅ Create user
    const user = await User.create({
      email,
      password: hashed,
      phno,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 min expiry
    });

    // ✅ Send OTP to email
    await sendOTPEmail(email, otp);

    // ✅ Always respond with JSON
    return res.status(201).json({ msg: "Registered. OTP sent to email." });

  } catch (err) {
    console.error("Registration Error:", err);

    // ✅ Handle duplicate email (Mongo error)
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // ✅ Always return a JSON error — never allow unhandled HTML fallback
    return res.status(500).json({ msg: "Registration failed due to server error." });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  const token = generateToken(user._id);
  res.cookie("token", token, { httpOnly: true }).json({ msg: "OTP verified", token });
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ msg: "User not found" });

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendOTPEmail(email, otp);
  res.json({ msg: "New OTP sent to email." });
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.isVerified) return res.status(401).json({ msg: "User not found or not verified" });

  const match = await compare(password, user.password);
  if (!match) return res.status(401).json({ msg: "Invalid credentials" });

  const token = generateToken(user._id);
  res.cookie("token", token, { 
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }).json({ msg: "Logged in", token });
};

// Logout
exports.logout = async (req, res) => {
  res.clearCookie("token").json({ msg: "Logged out" });
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ msg: "User not found" });

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendOTPEmail(email, otp);
  res.json({ msg: "Password reset OTP sent" });
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  user.password = await hash(newPassword);
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  res.json({ msg: "Password reset successful" });
};

exports.checkVerification = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ msg: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({ isVerified: user.isVerified });
  } catch (err) {
    console.error("Verification check error:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
};
