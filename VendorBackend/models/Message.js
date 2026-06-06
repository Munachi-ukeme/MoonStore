const mongoose = require("mongoose");

// every message sent by buyer, seller, or system lives here
// system messages are automated — security notice, payment confirmation etc.
const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },

        // buyer = the customer
        // seller = the store owner
        // system = automated MoonStore messages (security notice, payment confirmed)
        sender: {
            type: String,
            enum: ["buyer", "seller", "system"],
            required: true,
        },

        content: {
            type: String,
            required: true,
        },
    },
    {
        // we use timestamps here instead of a manual createdAt field
        // mongoose automatically adds createdAt and updatedAt
        timestamps: true,
    }
);

// index by conversationId — every message fetch filters by this
messageSchema.index({ conversationId: 1 });

module.exports = mongoose.model("Message", messageSchema);