const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String },
  fileUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Data", dataSchema);
