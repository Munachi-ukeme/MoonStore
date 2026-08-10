const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
    {
        referrerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true,
        },

        referredSellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true,
        },

        referralCode: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "earned", "cancelled"],
            default: "pending",
        },

        commissionAmount: {
            type: Number,
            default: 3000,
        },

        paidAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Referral", referralSchema);