const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },
    originalName: String,
    fileType: String,
    hospital: { type: String, required: true },
    purpose: { type: String },
    summary: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
