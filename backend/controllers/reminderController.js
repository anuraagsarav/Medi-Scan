const Reminder = require("../models/reminderModel");

// Converts '3 days', '1 week' into milliseconds
const parseDuration = (durationStr) => {
  const match = durationStr.match(/(\d+)\s*(day|week|month)s?/i);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const msIn = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };

  return value * msIn[unit];
};

exports.createReminder = async (req, res) => {
  const { medication, times } = req.body;

  if (!medication || !Array.isArray(times) || times.length === 0) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    const reminder = await Reminder.create({
      user: req.user.id,
      medication,
      times,
    });

    res.status(201).json({ msg: "Reminder created", reminder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to create reminder" });
  }
};


exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to retrieve reminders" });
  }
};

exports.pauseReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!reminder) return res.status(404).json({ msg: "Reminder not found" });

    reminder.active = false;
    await reminder.save();

    res.json({ msg: "Reminder paused", reminder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to pause reminder" });
  }
};

exports.resumeReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!reminder) return res.status(404).json({ msg: "Reminder not found" });

    reminder.active = true;
    await reminder.save();

    res.json({ msg: "Reminder resumed", reminder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to resume reminder" });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!reminder) return res.status(404).json({ msg: "Reminder not found" });

    res.json({ msg: "Reminder deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to delete reminder" });
  }
};
