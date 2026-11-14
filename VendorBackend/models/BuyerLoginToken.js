const mongoose = require("mongoose");

const buyerLoginTokenSchema = new mongoose.Schema(
    {
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Buyer",
            required: true,
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },
        purpose: {
            type: String,
            enum: ["login", "confirm"],
            required: true,
        },
        sessionId: {
            type: String,
            default: null,
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            default: null,
        },
        usedAt: {
            type: Date,
            default: null,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

// MongoDB removes expired links by itself
buyerLoginTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
buyerLoginTokenSchema.index({ buyerId: 1, createdAt: -1 });

module.exports = mongoose.model("BuyerLoginToken", buyerLoginTokenSchema);