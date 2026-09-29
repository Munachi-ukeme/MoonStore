const { createTransaction, activateTransaction, createCheckoutSession } = require("./escrowpay");
const { calculateCommissionBps } = require("./feeCalculator");

const setupEscrowPaymentForConversation = async (conversation, seller, buyerPartyId) => {
    try {
        const commissionBps = calculateCommissionBps(conversation.amount);

        const transaction = await createTransaction({
            amountMinor: conversation.amount * 100,
            payerPartyId: buyerPartyId,
            beneficiaryPartyId: seller.escrowPayMerchantRef,
            commissionBps,
            description: `Order from ${seller.businessName}`,
            externalReference: conversation._id.toString(),
        });

        if (!transaction.ok) return { ok: false, error: "Transaction creation failed" };

        const transactionId = transaction.data.data.id;

        const activation = await activateTransaction(transactionId);
        if (!activation.ok) return { ok: false, error: "Transaction activation failed" };

        const checkoutSession = await createCheckoutSession(transactionId);
        if (!checkoutSession.ok) return { ok: false, error: "Checkout session failed" };

        conversation.escrowTransactionId = transactionId;
        conversation.marketplaceCommissionBps = commissionBps;
        await conversation.save();

        return { ok: true, paymentInstructions: checkoutSession.data.data.payment_instructions };
    } catch (err) {
        console.error("EscrowPay setup error:", err.message);
        return { ok: false, error: "Payment setup failed" };
    }
};

const buildPaymentMessage = (paymentInstructions) => {
    return (
        `💳 Payment Details\n\n` +
        `Bank Code: ${paymentInstructions.bank_code}\n` +
        `Account Number: ${paymentInstructions.account_number}\n` +
        `Account Name: ${paymentInstructions.account_name}\n` +
        `Amount: ₦${(paymentInstructions.amount_minor / 100).toLocaleString()}\n\n` +
        `Transfer to this account to pay. This expires shortly — if it expires before you pay, let the seller know in this chat.`
    );
};

module.exports = { setupEscrowPaymentForConversation, buildPaymentMessage };