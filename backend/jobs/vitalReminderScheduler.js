const cron = require("node-cron");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const checkVitals = async () => {
  const now = new Date();
  const users = await User.find();

  for (const user of users) {
    const lastVital = user.vitals?.[user.vitals.length - 1];
    if (!lastVital || (now - new Date(lastVital.date)) > 30 * 24 * 60 * 60 * 1000) {
      const message = `Hi ${user.name || user.email}, don't forget to update your monthly vitals (weight, blood pressure, sugar) in Medi-Scan.`;
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Time to update your health vitals",
          text: message,
        });
        console.log(`Reminder sent to ${user.email}`);
      } catch (err) {
        console.error(`Failed to send to ${user.email}:`, err.message);
      }
    }
  }
};

cron.schedule("0 9 1 * *", checkVitals) // Every day at 9 AM
console.log("✅ Vitals reminder scheduler started");