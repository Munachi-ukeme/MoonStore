const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true,
        },
        type: {
            type: String,
            enum: ["order", "subscription"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        platformFee: {
            type: Number,
            default: 0,
        },
        plan: {
            type: String,
            default: null,
        },
        reference: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);