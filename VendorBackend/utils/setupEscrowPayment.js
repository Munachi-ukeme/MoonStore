const { createTransaction, activateTransaction, createCheckoutSession } = require("./escrowpay");
const { calculateCommissionNaira } = require("./feeCalculator");

const BANK_NAMES = {
    "090175": "Rubies Microfinance Bank",
};

const naira = (minor) => {
    return (minor / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 });
};

const formatExpiry = (isoString) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Lagos",
    });
};

const getPrincipalMinor = (conversation) => {
    const deliveryFee = conversation.shippingDetails?.deliveryFee || 0;
    return (conversation.amount + deliveryFee) * 100;
};

const setupEscrowPaymentForConversation = async (conversation, seller, buyerPartyId) => {
    try {
        const productAmount = conversation.amount;
        const fullAmount = getPrincipalMinor(conversation) / 100;

        // commission is on the product price only; the bps is worked out against the full amount
        // because EscrowPay applies it to everything it holds
        const commissionNaira = calculateCommissionNaira(productAmount);
        const commissionBps = Math.round((commissionNaira / fullAmount) * 10000);

        const conversationKey = conversation._id.toString();

        // stable keys: if a call times out and is retried, EscrowPay returns the stored result
        const transaction = await createTransaction({
            amountMinor: fullAmount * 100,
            payerPartyId: buyerPartyId,
            beneficiaryPartyId: seller.escrowPayMerchantRef,
            commissionBps,
            description: `Order from ${seller.businessName}`.slice(0, 100),
            externalReference: conversationKey,
            idempotencyKey: `mst-txn-${conversationKey}`,
        });

        if (!transaction.ok) return { ok: false, error: "Transaction creation failed" };

        const transactionId = transaction.data.data.id;

        const activation = await activateTransaction(transactionId, `mst-activate-${transactionId}`);
        if (!activation.ok) return { ok: false, error: "Transaction activation failed" };

        const checkoutSession = await createCheckoutSession(transactionId, `mst-checkout-${transactionId}-1`);
        const session = checkoutSession.data && checkoutSession.data.data;

        if (!checkoutSession.ok || !session || !session.payment_instructions) {
            return { ok: false, error: "Checkout session failed" };
        }

        conversation.escrowTransactionId = transactionId;
        conversation.marketplaceCommissionBps = commissionBps;
        conversation.checkoutSessionId = session.id;
        conversation.checkoutHostedUrl = session.hosted_url || null;
        conversation.checkoutPublicToken = session.public_token || null;
        conversation.paymentExpiresAt = new Date(session.payment_instructions.expires_at);
        await conversation.save();

        return { ok: true, paymentInstructions: session.payment_instructions };
    } catch (err) {
        console.error("EscrowPay setup error:", err.message);
        return { ok: false, error: "Payment setup failed" };
    }
};

const buildPaymentMessage = (paymentInstructions, conversation) => {
    const principalMinor = getPrincipalMinor(conversation);
    const feeMinor = paymentInstructions.amount_minor - principalMinor;
    const bankName = BANK_NAMES[paymentInstructions.bank_code] || `Bank code ${paymentInstructions.bank_code}`;
    const expiry = formatExpiry(paymentInstructions.expires_at);

    let message =
        `💳 Payment Details\n\n` +
        `Bank: ${bankName}\n` +
        `Account Number: ${paymentInstructions.account_number}\n` +
        `Account Name: ${paymentInstructions.account_name}\n` +
        `Amount: ₦${naira(paymentInstructions.amount_minor)}\n`;

    if (feeMinor > 0) {
        message += `(Order total ₦${naira(principalMinor)} + escrow fee ₦${naira(feeMinor)})\n`;
    }

    message += `\n`;

    if (expiry) {
        message += `Valid until ${expiry} (30 minutes). `;
    }

    message += `Transfer exactly this amount. A different amount will not be accepted. If the details expire, tap "Get new payment details" in this chat.`;

    return message;
};

module.exports = { setupEscrowPaymentForConversation, buildPaymentMessage };