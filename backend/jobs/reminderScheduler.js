const Reminder = require("../models/reminderModel");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendReminderEmail = async (to, subject, body) => {
  await transporter.sendMail({
    from: `"Medi-Scan Reminders" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9; padding: 30px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #000; font-size: 22px;">⏰ Medication Reminder</h2>
          <p>Hello,</p>
          <p>This is a friendly reminder from <strong>Medi-Scan</strong> to take your medication as scheduled:</p>
          <div style="margin: 24px 0; padding: 16px; border-left: 4px solid #4f46e5; background-color: #f0f0f5;">
            <strong style="font-size: 18px;">${body}</strong>
          </div>
          <p>Stay consistent and take care of your health.</p>
          <p style="margin-top: 30px;">Warm regards,<br/>Medi-Scan Team</p>
        </div>
      </div>
    `,
  });
};

const checkReminders = async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  console.log(`🕒 Checking reminders at ${now.toISOString()}`);

  const reminders = await Reminder.find({ active: true });

  for (const reminder of reminders) {
    const user = await User.findById(reminder.user);
    
    // Skip this reminder if user not found
    if (!user) {
      console.log(`⚠️ User not found for reminder ${reminder._id}, medication: ${reminder.medication}`);
      // Optionally deactivate the reminder since user doesn't exist
      reminder.active = false;
      await reminder.save();
      continue;
    }

    let updated = false;

    for (const time of reminder.times) {
      const [targetHour, targetMinute] = time.exactTime.split(":").map(Number);

      const lastSent = time.lastSent ? new Date(time.lastSent) : null;

      // Truncate seconds and ms to compare minute-level accuracy
      const nowMinute = new Date(now);
      nowMinute.setSeconds(0, 0);

      const lastSentMinute = lastSent ? new Date(lastSent) : null;
      if (lastSentMinute) lastSentMinute.setSeconds(0, 0);

      const shouldSend =
        currentHour === targetHour &&
        currentMinute === targetMinute &&
        (!lastSent || lastSentMinute.getTime() !== nowMinute.getTime());

      console.log(
        `🔎 ${user.email} | Medication: ${reminder.medication} | Target: ${targetHour}:${targetMinute} | Now: ${currentHour}:${currentMinute} | Should send: ${shouldSend}`
      );

      if (shouldSend) {
        const message = `Time to take your ${reminder.medication} (${time.timeOfDay}) - ${time.foodInstruction}`;
        console.log(`📤 Sending reminder to ${user.email}: ${message}`);

        try {
          await sendReminderEmail(user.email, "Medication Reminder", message);
          time.lastSent = now;
          updated = true;
          console.log(`✅ Email sent at ${now.toISOString()}`);
        } catch (err) {
          console.error("❌ Failed to send email:", err.message);
        }
      }
    }

    if (updated) {
      await reminder.save();
    }
  }
};

// Run every 10 seconds
setInterval(checkReminders, 10 * 1000);

console.log("✅ Reminder scheduler started (every 10 seconds)");
