const generateOtp = require("../utils/generateOtp");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const sendEmail = require("../utils/email");
const jwt = require("jsonwebtoken");

// Token generation
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// Set token and send response
const createSendToken = (user, statusCode, res, message) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
    };

    res.cookie("token", token, cookieOptions);

    user.password = undefined;
    user.passwordConfirm = undefined;
    user.otp = undefined;

    res.status(statusCode).json({
        status: 'success',
        message,
        token,
        data: {
            user,
        },
    });
};

// User signup
exports.signup = catchAsync(async (req, res, next) => {
    const { email, password, passwordConfirm, username } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError("Email already registered", 400));

    const otp = generateOtp();
    const otpExpires = Date.now() + (process.env.OTP_EXPIRY_MS || 24 * 60 * 60 * 1000);

    const newUser = await User.create({
        username,
        email,
        password,
        passwordConfirm,
        otp,
        otpExpires,
    });

    try {
        await sendEmail({
            email: newUser.email,
            subject: "OTP for E-Mail verification",
            html: `<h1>Your OTP is: ${otp}</h1>`,
        });

        createSendToken(newUser, 200, res, "Registration successful. OTP sent.");
    } catch (error) {
        await User.findByIdAndDelete(newUser.id);
        return next(new AppError("Error sending the email. Try again.", 500));
    }
});

// Account verification
exports.verifyAccount = catchAsync(async (req, res, next) => {
    const { otp } = req.body;
    if (!otp) return next(new AppError("OTP is missing", 400));

    const user = req.user;

    if (user.isVerified) return next(new AppError("Account already verified", 400));

    if (user.otp !== otp) return next(new AppError("Invalid OTP", 400));

    if (user.otpExpires < Date.now()) {
        return next(new AppError("OTP expired. Request a new one.", 400));
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res, "Account verified successfully.");
});

// Resend OTP
exports.resendOTP = catchAsync(async (req, res, next) => {
    const { email } = req.user;

    if (!email) return next(new AppError("Email is missing", 400));

    const user = await User.findOne({ email });

    if (!user) return next(new AppError("No user found with that email", 404));

    if (user.isVerified) return next(new AppError("Account already verified", 400));

    const newOtp = generateOtp();
    user.otp = newOtp;
    user.otpExpires = Date.now() + (process.env.OTP_EXPIRY_MS || 24 * 60 * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    try {
        await sendEmail({
            email: user.email,
            subject: "Resend OTP for E-Mail verification",
            html: `<h1>Your new OTP is: ${newOtp}</h1>`,
        });

        res.status(200).json({
            status: "success",
            message: "New OTP sent successfully",
        });
    } catch (error) {
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("Error sending the email. Try again.", 500));
    }
});

// Login
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("Please provide email and password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401));
    }

    createSendToken(user, 200, res, "Login successful.");
});

// Logout
exports.logout = catchAsync(async (req, res, next) => {
    res.cookie("token", "loggedout", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "Lax",
    });

    res.status(200).json({ status: "success", message: "Logged out successfully" });
});

// Forget Password
exports.forgetPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return next(new AppError("No user found with that email", 404));

    const otp = generateOtp();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 5 * 60 * 1000; // 5 mins

    await user.save({ validateBeforeSave: false });

    try {
        await sendEmail({
            email: user.email,
            subject: "Password Reset OTP (valid for 5 min)",
            html: `<h1>Your OTP is: ${otp}</h1>`,
        });

        res.status(200).json({
            status: "success",
            message: "Password reset OTP sent successfully",
        });
    } catch (error) {
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("Error sending the email. Try again.", 500));
    }
});

// Reset Password 
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { email, otp, password, passwordConfirm } = req.body;

    const user = await User.findOne({
        email,
        resetPasswordOTP: otp,
        resetPasswordOTPExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError("Invalid OTP or OTP expired", 400));

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    await user.save();
    createSendToken(user, 200, res, "Password reset successful.");

});