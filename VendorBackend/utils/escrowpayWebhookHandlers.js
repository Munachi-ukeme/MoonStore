const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { markOrderPaid } = require("./markOrderPaid");
const { restoreStockOnRefund } = require("./restoreStockOnRefund");
const { payoutToSeller } = require("./escrowActions");
const { sendAdminAlertEmail } = require("./mailer");
const { getIO } = require("./socket");

// release.*, refund.* and payout.* events: object_id is that object's own id.
// Falls back to the transaction id inside data if we have not saved the id yet.
const findConversationByEvent = async (event, idField) => {
    let conversation = null;

    if (event.object_id) {
        conversation = await Conversation.findOne({ [idField]: event.object_id });
    }

    if (!conversation && event.data && event.data.transaction_id) {
        conversation = await Conversation.findOne({ escrowTransactionId: event.data.transaction_id });
    }

    return conversation;
};

const postSystemMessage = async (conversation, content) => {
    const message = await Message.create({
        conversationId: conversation._id,
        sender: "system",
        content,
    });

    try {
        getIO().to(conversation._id.toString()).emit("new_message", message);
    } catch (err) {
        console.error("Socket emit error:", err.message);
    }
};

const handleTransactionFunded = async (event) => {
    if (!event.object_id) return;

    const conversation = await Conversation.findOne({ escrowTransactionId: event.object_id });
    if (!conversation) return;

    await markOrderPaid({ conversation, reference: event.object_id });
};

const handleReleaseCompleted = async (event) => {
    const conversation = await findConversationByEvent(event, "releaseId");
    if (!conversation || conversation.escrowStatus === "released") return;

    conversation.escrowStatus = "released";
    conversation.orderStage = "released";
    conversation.releasedAt = new Date();
    conversation.releaseRetryPending = false;
    await conversation.save();

    await postSystemMessage(
        conversation,
        "✅ Funds have been released. The seller's payment to their bank account is now being processed."
    );

    // the release only credits MoonStore's wallet; this pays the seller's bank account
    try {
        await payoutToSeller(conversation._id);
    } catch (err) {
        console.error("Payout start failed:", err.message);
    }
};

const handleReleaseFailed = async (event) => {
    const conversation = await findConversationByEvent(event, "releaseId");
    if (!conversation) return;

    conversation.releaseRetryPending = true;
    await conversation.save();
};

const handleRefundCompleted = async (event) => {
    const conversation = await findConversationByEvent(event, "refundId");
    if (!conversation || conversation.escrowStatus === "refunded") return;

    conversation.refundRetryPending = false;

    // if a release also exists, this was a split dispute: the buyer got a
    // partial refund and the final status is decided by the release
    const isSplit = !!conversation.releaseId;

    if (isSplit) {
        await conversation.save();
        await postSystemMessage(conversation, "Your share of the refund has been sent back to you.");
        return;
    }

    conversation.escrowStatus = "refunded";
    conversation.orderStage = "refunded";
    await conversation.save();

    await restoreStockOnRefund(conversation);
    await postSystemMessage(conversation, "This order has been refunded. Your money has been sent back to you.");
};

const handleRefundFailed = async (event) => {
    const conversation = await findConversationByEvent(event, "refundId");
    if (!conversation) return;

    conversation.refundRetryPending = true;
    await conversation.save();
};

const handleRefundRequiresAction = async (event) => {
    const conversation = await findConversationByEvent(event, "refundId");
    if (!conversation) return;

    conversation.refundRetryPending = true;
    await conversation.save();

    await sendAdminAlertEmail(
        "A refund needs action",
        `Order ${conversation._id} has a refund that EscrowPay says requires action. Please check the EscrowPay dashboard.`
    );
};

const handlePayoutCompleted = async (event) => {
    const conversation = await findConversationByEvent(event, "payoutId");
    if (!conversation || conversation.payoutStatus === "completed") return;

    conversation.payoutStatus = "completed";
    conversation.payoutRetryPending = false;
    await conversation.save();

    await postSystemMessage(conversation, "✅ The seller's payment has been sent to their bank account. This order is complete.");
};

const handlePayoutFailed = async (event) => {
    const conversation = await findConversationByEvent(event, "payoutId");
    if (!conversation) return;

    conversation.payoutStatus = "failed";
    conversation.payoutRetryPending = true;
    await conversation.save();
};

// holds, reversed funding and reversed payouts need a person to look at them
const handleAdminAlertEvent = async (event) => {
    await sendAdminAlertEmail(
        `EscrowPay event: ${event.type}`,
        `Event ${event.type} on ${event.object} ${event.object_id}. Please check the order in the EscrowPay dashboard before anything is released or refunded.`
    );
};

// a payment smaller than required: stop the buyer from paying again and tell the admin
const handlePartialFunding = async (event) => {
    if (!event.object_id) return;

    const conversation = await Conversation.findOne({ escrowTransactionId: event.object_id });
    if (!conversation || conversation.status === "paid") return;

    await postSystemMessage(
        conversation,
        "⚠️ We received a payment that is less than the amount required, so this order is not confirmed yet. Please do not send more money. Contact MoonStore support on WhatsApp +2348152905325 and we will sort it out."
    );

    await sendAdminAlertEmail(
        "A partial payment was received",
        `Order ${conversation._id} received a payment that is less than the required amount. Please check the transaction in the EscrowPay dashboard and help the buyer.`
    );
};

// a transfer that was not accepted (for example the wrong amount): the buyer must not send it again
const handleChargeFailed = async (event) => {
    const transactionId = event.data && event.data.transaction_id;

    if (!transactionId) {
        await handleAdminAlertEvent(event);
        return;
    }

    const conversation = await Conversation.findOne({ escrowTransactionId: transactionId });
    if (!conversation || conversation.status === "paid") return;

    await postSystemMessage(
        conversation,
        "⚠️ A transfer to your payment account was not accepted. This usually means the amount was different from the exact amount required. Please do not send it again. Contact MoonStore support on WhatsApp +2348152905325 with your transfer receipt."
    );

    await sendAdminAlertEmail(
        "A transfer was not accepted",
        `Order ${conversation._id} had a transfer that EscrowPay did not accept, probably the wrong amount. Please check the EscrowPay dashboard and help the buyer.`
    );
};

module.exports = {
    handleTransactionFunded,
    handleReleaseCompleted,
    handleReleaseFailed,
    handleRefundCompleted,
    handleRefundFailed,
    handleRefundRequiresAction,
    handlePayoutCompleted,
    handlePayoutFailed,
    handleAdminAlertEvent,
    handlePartialFunding,
    handleChargeFailed,
};