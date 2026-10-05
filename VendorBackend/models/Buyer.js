const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        sessionIds: {
            type: [String],
            default: [],
        },

        escrowPayPartyId: {
            type: String,
            default: null,
        },
        identityVerificationStatus: {
            type: String,
            enum: [null, "verified", "failed", "requires_review"],
            default: null,
        },

        disputesRaised: { type: Number, default: 0 },
disputesLost: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Buyer", buyerSchema);