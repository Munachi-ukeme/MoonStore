const Conversation = require("../models/Conversation");
const Seller = require("../models/Seller");
const Message = require("../models/Message");
const { setupEscrowPaymentForConversation, buildPaymentMessage } = require("./setupEscrowPayment");
const { getIO } = require("./socket");

const continueOrderPayment = async (conversationId, buyerPartyId) => {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.escrowTransactionId || conversation.status === "paid") {
        return { ok: false, skipped: true };
    }

    const seller = await Seller.findById(conversation.sellerId);
    if (!seller) {
        return { ok: false, error: "Store not found" };
    }

    const result = await setupEscrowPaymentForConversation(conversation, seller, buyerPartyId);
    if (!result.ok) {
        return { ok: false, error: result.error };
    }

    const message = await Message.create({
        conversationId: conversation._id,
        sender: "system",
        content: buildPaymentMessage(result.paymentInstructions, conversation),
    });

    try {
        getIO().to(conversation._id.toString()).emit("new_message", message);
    } catch (err) {
        console.error("Socket emit error:", err.message);
    }

    return { ok: true };
};

module.exports = { continueOrderPayment };