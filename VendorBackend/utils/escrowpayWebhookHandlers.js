const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { markOrderPaid } = require("./markOrderPaid");
const { restoreStockOnRefund } = require("./restoreStockOnRefund");
const { getIO } = require("./socket");

const handleTransactionFunded = async (event) => {
    const conversation = await Conversation.findOne({ escrowTransactionId: event.object_id });
    if (!conversation) return;

    await markOrderPaid({ conversation, reference: event.object_id });
};

// ⚠️ NOT CONFIRMED — needs a real test event from EscrowPay's dashboard
// to confirm how to find the right Conversation from this event's data
const handleReleaseCompleted = async (event) => {
    const conversation = await Conversation.findOne({ escrowTransactionId: event.data.transaction_id });
    if (!conversation || conversation.escrowStatus === "released") return;

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

// ⚠️ NOT CONFIRMED — same issue as above
const handleRefundCompleted = async (event) => {
    const conversation = await Conversation.findOne({ escrowTransactionId: event.data.transaction_id });
    if (!conversation || conversation.escrowStatus === "refunded") return;

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