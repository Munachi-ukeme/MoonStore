const mongoose = require("mongoose");

const exitSurveySchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true },
    email: { type: String, required: true },
    whatsappNumber: { type: String },
    plan: { type: String },
    slug: { type: String },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExitSurvey", exitSurveySchema);