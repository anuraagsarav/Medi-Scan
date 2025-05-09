const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  medication: { type: String, required: true },
  times: [
    {
      timeOfDay: { type: String, enum: ['Morning', 'Afternoon', 'Evening', 'Night'], required: true },
      exactTime: { type: String, required: true },
      foodInstruction: { type: String, enum: ['Before Food', 'After Food'], required: true },
      lastSent: { type: Date, default: null },
    }
  ],
  startDate: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Reminder", reminderSchema);
