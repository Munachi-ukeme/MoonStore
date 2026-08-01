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
        productIds: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Product",
            default: [],
        },
        buyerEmail: {
            type: String,
            default: null,
        },
        buyerSessionId: {
            type: String,
            default: null,
        },
        paidAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);