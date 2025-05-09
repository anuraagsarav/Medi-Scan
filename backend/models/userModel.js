const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema({
  name: String,
  relation: String,
  phone: String,
}, { _id: false });

const vitalSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  weight: Number,
  bloodPressure: String,
  sugar: Number
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phno: { type: String, required: true },
  otp: String,
  otpExpires: Date,
  isVerified: { type: Boolean, default: false },

  // Profile fields
  name: String,
  dob: Date,
  gender: String,
  bloodGroup: String,

  // Emergency Contacts
  emergencyContacts: [emergencyContactSchema],

  // Vitals
  vitals: [vitalSchema]

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
