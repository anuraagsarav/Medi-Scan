const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Medi-Scan Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your One-Time Password (OTP) - Medi-Scan Verification",
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9; padding: 30px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #000; font-size: 22px;">Medi-Scan Verification</h2>
          <p>Hello,</p>
          <p>To continue with your request, please use the following One-Time Password (OTP):</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #000; letter-spacing: 4px;">${otp}</span>
          </div>
          <p>This OTP is valid for the next <strong>10 minutes</strong>.</p>
          <p style="margin-top: 30px;">If you didn’t request this code, you can safely ignore this email.</p>
          <hr style="margin: 40px 0; border: none; border-top: 1px solid #eaeaea;" />
          <p style="font-size: 13px; color: #777;">Thank you,<br/>Medi-Scan Support Team</p>
        </div>
      </div>
    `
  });
};

