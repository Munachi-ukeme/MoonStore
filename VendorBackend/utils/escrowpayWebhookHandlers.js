const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { markOrderPaid } = require("./markOrderPaid");
const { restoreStockOnRefund } = require("./restoreStockOnRefund");
const { getIO } = require("./socket");

const handleTransactionFunded = async (eventData) => {
    const conversation = await Conversation.findOne({ escrowTransactionId: eventData.id });
    if (!conversation) return;

    await markOrderPaid({ conversation, reference: eventData.id });
};

const handleReleaseCompleted = async (eventData) => {
    const conversation = await Conversation.findOne({ escrowTransactionId: eventData.transaction_id });
    if (!conversation) return;

    conversation.escrowStatus = "released";
    conversation.orderStage = "released";
    conversation.releasedAt = new Date();
    await conversation.save();

    const message = await Message.create({
        conversationId: conversation._id,
        sender: "system",
        content: "✅ Funds have been released to the seller. This order is now complete.",
    });

    try {
        getIO().to(conversation._id.toString()).emit("new_message", message);
    } catch (err) {
        console.error("Socket emit error:", err.message);
    }
};

const handleRefundCompleted = async (eventData) => {
    const conversation = await Conversation.findOne({ escrowTransactionId: eventData.transaction_id });
    if (!conversation) return;

    conversation.escrowStatus = "refunded";
    conversation.orderStage = "refunded";
    await conversation.save();

    await restoreStockOnRefund(conversation);

    const message = await Message.create({
        conversationId: conversation._id,
        sender: "system",
        content: "This order has been refunded. Your money has been sent back to you.",
    });

    try {
        getIO().to(conversation._id.toString()).emit("new_message", message);
    } catch (err) {
        console.error("Socket emit error:", err.message);
    }
};

module.exports = { handleTransactionFunded, handleReleaseCompleted, handleRefundCompleted };