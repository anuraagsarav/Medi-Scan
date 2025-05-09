const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://192.168.1.39:3000"], // Frontend origins
  credentials: true,              // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json({ limit: "10mb" })); // Optional: limit payload size
app.use(cookieParser());

// Route Imports
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const profileRoutes = require("./routes/profileRoutes");
const bmiRoutes = require('./routes/bmiRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const timelineRoutes = require('./routes/timelineRoutes');

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/profile", profileRoutes);
app.use('/api/bmi', bmiRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/timeline', timelineRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {})
.then(() => {
  console.log("✅ MongoDB connected");

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });

  // Background Jobs
  require("./jobs/reminderScheduler");
  require("./jobs/vitalReminderScheduler");
})
.catch((err) => {
  console.error("MongoDB connection error:", err.message);
});
