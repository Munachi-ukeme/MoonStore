const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        buyerSessionId: {
            type: String,
            required: true,
        },
        buyerEmail: {
            type: String,
            default: null,
        },

        buyerPhone: {
            type: String,
            default: "" 
        },
        
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true,
        },
        productIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            }
        ],
        status: {
            type: String,
            enum: ["active", "paid"],
            default: "active",
        },
        amount: {
            type: Number,
            default: 0,
        },
        buyerName: {
            type: String,
            default: "",
        },
        deliveryAddress: {
            type: String,
            default: "",
        },
        deliveryCity: {
            type: String,
            default: "",
        },
        deliveryPhone: {
            type: String,
            default: "",
        },
        paidAt: {
            type: Date,
            default: null,
        },
        lastMessage: {
            type: String,
            default: "",
        },
        buyerLastMessageAt: {
            type: Date,
            default: null,
        },
        isReported: {
            type: Boolean,
            default: false,
        },
        reportReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ sellerId: 1 });
conversationSchema.index({ buyerSessionId: 1 });
conversationSchema.index({ sellerId: 1, status: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);