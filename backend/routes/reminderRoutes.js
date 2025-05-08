const express = require("express");
const {
  createReminder,
  getReminders,
  pauseReminder,
  deleteReminder,
  resumeReminder
} = require("../controllers/reminderController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", protect, createReminder);
router.get("/my-reminders", protect, getReminders);
router.patch("/pause/:id", protect, pauseReminder);
router.patch("/resume/:id", protect, resumeReminder);
router.delete("/delete/:id", protect, deleteReminder);

module.exports = router;
