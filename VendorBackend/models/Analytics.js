const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    type: {
      type: String,
      enum: ["store_visit", "product_click"],
      required: true,
    },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    referrer: { type: String, default: "" },
    sessionId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analytics", analyticsSchema);