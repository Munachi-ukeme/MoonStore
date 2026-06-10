const mongoose = require("mongoose");

// a conversation is created the moment a buyer clicks Order Now
// one conversation = one buyer + one product + one seller
// all messages for that order live inside this conversation
const conversationSchema = new mongoose.Schema(
    {
        // sessionId identifies the buyer without requiring registration
        // stored in their browser localStorage
        buyerSessionId: {
            type: String,
            required: true,
        },

        // optional — linked when buyer saves their email
        // enables cross-device restore and reply notifications
        buyerEmail: {
            type: String,
            default: null,
        },

        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true,
        },

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        status: {
            type: String,
            enum: ["active", "paid"],
            default: "active",
        },

        // true once seller pastes their MoonStore subaccount details
        // controls visibility of Mark as Paid button on seller side

        paidAt: {
            type: Date,
            default: null,
        },

        // stores the last message text for the chat list preview
        // updated every time a new message is sent
        lastMessage: {
            type: String,
            default: "",
        },

        // tracks when buyer last sent a message
        // used to detect if buyer has left before seller replies
        buyerLastMessageAt: {
            type: Date,
            default: null,
        },

        // set to true when buyer reports the seller
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

// index by sellerId — seller inbox fetches all conversations for their store
// index by buyerSessionId — buyer fetches their own conversations
conversationSchema.index({ sellerId: 1 });
conversationSchema.index({ buyerSessionId: 1 });
conversationSchema.index({ sellerId: 1, status: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);