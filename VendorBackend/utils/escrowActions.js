const crypto = require("crypto");
const Conversation = require("../models/Conversation");
const Seller = require("../models/Seller");
const { createRelease, getRelease, createRefund, createPayout } = require("./escrowpay");
const { sendAdminAlertEmail } = require("./mailer");

const STALE_CLAIM_MS = 10 * 60 * 1000;
const MIN_PAYOUT_MINOR = 10000; // EscrowPay's minimum payout is ₦100

// the escrow holds product amount + delivery fee, so every release/refund uses this full figure (in kobo)
const getFullAmountMinor = (conversation) => {
    const deliveryFee = conversation.shippingDetails?.deliveryFee || 0;
    return (conversation.amount + deliveryFee) * 100;
};


const shouldDropKey = (result) => {
    const code = result.data && result.data.detail && result.data.detail.code;
    return code === "idempotency_key_reused";
};

const releaseFunds = async (conversation, amountMinor, reason) => {
    const staleCutoff = new Date(Date.now() - STALE_CLAIM_MS);

    const claimed = await Conversation.findOneAndUpdate(
        {
            _id: conversation._id,
            releaseId: null,
            $or: [
                { releaseRequestedAt: null },
                { releaseRequestedAt: { $lt: staleCutoff } },
            ],
        },
        { releaseRequestedAt: new Date(), releasedAmountMinor: amountMinor },
        { new: true }
    );

    if (!claimed) return { ok: false, skipped: true };

    let idempotencyKey = claimed.releaseIdemKey;
    if (!idempotencyKey) {
        idempotencyKey = `mst-release-${crypto.randomUUID()}`;
        await Conversation.updateOne({ _id: conversation._id }, { releaseIdemKey: idempotencyKey });
    }

    const result = await createRelease({
        transactionId: claimed.escrowTransactionId,
        amountMinor,
        reason,
        idempotencyKey,
    });

    if (!result.ok) {
        const reset = { releaseRequestedAt: null };
        if (shouldDropKey(result)) reset.releaseIdemKey = null;
        await Conversation.updateOne({ _id: conversation._id }, reset);
        return { ok: false, detail: result.data };
    }


    if (!releaseId) {
        console.error("Release created but no id found in the response:", JSON.stringify(result.data));
        return { ok: false, detail: result.data };
    }

    await Conversation.updateOne({ _id: conversation._id }, { releaseId });

    return { ok: true, releaseId };
};

const refundFunds = async (conversation, amountMinor, reason) => {
    const staleCutoff = new Date(Date.now() - STALE_CLAIM_MS);

    const claimed = await Conversation.findOneAndUpdate(
        {
            _id: conversation._id,
            refundId: null,
            $or: [
                { refundRequestedAt: null },
                { refundRequestedAt: { $lt: staleCutoff } },
            ],
        },
        { refundRequestedAt: new Date() },
        { new: true }
    );

    if (!claimed) return { ok: false, skipped: true };

    let idempotencyKey = claimed.refundIdemKey;
    if (!idempotencyKey) {
        idempotencyKey = `mst-refund-${crypto.randomUUID()}`;
        await Conversation.updateOne({ _id: conversation._id }, { refundIdemKey: idempotencyKey });
    }

    const result = await createRefund({
        transactionId: claimed.escrowTransactionId,
        amountMinor,
        reason,
        idempotencyKey,
    });

    if (!result.ok) {
        const reset = { refundRequestedAt: null };
        if (shouldDropKey(result)) reset.refundIdemKey = null;
        await Conversation.updateOne({ _id: conversation._id }, reset);
        return { ok: false, detail: result.data };
    }


    if (!refundId) {
        console.error("Refund created but no id found in the response:", JSON.stringify(result.data));
        return { ok: false, detail: result.data };
    }

    await Conversation.updateOne({ _id: conversation._id }, { refundId });

    return { ok: true, refundId };
};

// A release only credits MoonStore's own EscrowPay wallet. This pays the seller's bank account
// with what they are owed: the released amount minus MoonStore's commission.
const payoutToSeller = async (conversationId) => {
    const walletId = process.env.ESCROWPAY_WALLET_ID;

    if (!walletId) {
        console.error("ESCROWPAY_WALLET_ID is not set, so sellers cannot be paid out");
        return { ok: false, error: "Wallet not configured" };
    }

    const staleCutoff = new Date(Date.now() - STALE_CLAIM_MS);

    const claimed = await Conversation.findOneAndUpdate(
        {
            _id: conversationId,
            escrowStatus: "released",
            releaseId: { $ne: null },
            payoutId: null,
            $or: [
                { payoutRequestedAt: null },
                { payoutRequestedAt: { $lt: staleCutoff } },
            ],
        },
        { payoutRequestedAt: new Date() },
        { new: true }
    );

    if (!claimed) return { ok: false, skipped: true };

    const clearClaim = async (extra) => {
        await Conversation.updateOne({ _id: conversationId }, { payoutRequestedAt: null, ...extra });
    };

    const seller = await Seller.findById(claimed.sellerId);

    if (!seller || !seller.payoutAccountId) {
        await clearClaim();
        console.error("Seller has no payout account for order", conversationId);
        return { ok: false, error: "Seller has no payout account" };
    }

    const release = await getRelease(claimed.releaseId);
    const releaseData = release.data && release.data.data;

    if (!release.ok || !releaseData) {
        await clearClaim();
        return { ok: false, detail: release.data };
    }

    // ⚠️ UNCONFIRMED field names: amount_minor and marketplace_commission_minor on the release.
    // If they are missing we fall back to the numbers we stored ourselves.
    const releasedMinor = Number.isInteger(releaseData.amount_minor)
        ? releaseData.amount_minor
        : claimed.releasedAmountMinor;

    if (!Number.isInteger(releasedMinor)) {
        await clearClaim();
        return { ok: false, error: "Released amount unknown" };
    }

    const commissionMinor = Number.isInteger(releaseData.marketplace_commission_minor)
        ? releaseData.marketplace_commission_minor
        : Math.ceil((releasedMinor * (claimed.marketplaceCommissionBps || 0)) / 10000);

    const payoutMinor = releasedMinor - commissionMinor;

    if (payoutMinor < MIN_PAYOUT_MINOR) {
        await clearClaim({ payoutStatus: "below_minimum" });
        await sendAdminAlertEmail(
            "A seller payout is below the minimum",
            `Order ${conversationId} leaves the seller less than ₦100 after commission, which EscrowPay cannot pay out. Please handle it manually.`
        );
        return { ok: false, error: "Below minimum payout" };
    }

    let idempotencyKey = claimed.payoutIdemKey;
    if (!idempotencyKey) {
        idempotencyKey = `mst-payout-${crypto.randomUUID()}`;
        await Conversation.updateOne({ _id: conversationId }, { payoutIdemKey: idempotencyKey });
    }

    const result = await createPayout({
        walletId,
        amountMinor: payoutMinor,
        payoutAccountId: seller.payoutAccountId,
        transactionId: claimed.escrowTransactionId,
        idempotencyKey,
    });

    if (!result.ok) {
        await clearClaim(shouldDropKey(result) ? { payoutIdemKey: null } : {});
        return { ok: false, detail: result.data };
    }

    const payoutData = result.data && result.data.data;

    if (!payoutData || !payoutData.id) {
        console.error("Payout created but no id found in the response:", JSON.stringify(result.data));
        return { ok: false, detail: result.data };
    }

    await Conversation.updateOne(
        { _id: conversationId },
        {
            payoutId: payoutData.id,
            payoutAmountMinor: payoutMinor,
            payoutStatus: payoutData.status || "pending",
        }
    );

    return { ok: true, payoutId: payoutData.id };
};

module.exports = { getFullAmountMinor, releaseFunds, refundFunds, payoutToSeller };