const Buyer = require("../models/Buyer");
const Seller = require("../models/Seller");
const {
    sendBuyerDisputeWarningEmail,
    sendBuyerBlockedEmail,
    sendSellerDisputeWarningEmail,
    sendAdminAlertEmail,
} = require("./mailer");

const BUYER_WARNING_AT = 2;
const BUYER_BLOCK_AT = 3;
const BUYER_BLOCK_DAYS = 90;
const SELLER_WARNING_AT = 3;
const SELLER_REVIEW_AT = 4;

// true while a buyer may not start or pay for orders
const isBuyerBlocked = (buyer) => {
    if (!buyer) return false;
    if (buyer.permanentlyBlocked) return true;
    return !!buyer.orderBlockedUntil && buyer.orderBlockedUntil > new Date();
};

const recordBuyerLostDispute = async (buyer) => {
    buyer.disputesLost = (buyer.disputesLost || 0) + 1;

    if (buyer.disputesLost >= BUYER_BLOCK_AT) {
        buyer.orderBlockedUntil = new Date(Date.now() + BUYER_BLOCK_DAYS * 24 * 60 * 60 * 1000);
        await buyer.save();
        sendBuyerBlockedEmail(buyer.email, buyer.orderBlockedUntil).catch((err) =>
            console.error("Buyer blocked email error:", err.message)
        );
        return;
    }

    await buyer.save();

    if (buyer.disputesLost === BUYER_WARNING_AT) {
        sendBuyerDisputeWarningEmail(buyer.email).catch((err) =>
            console.error("Buyer warning email error:", err.message)
        );
    }
};

// suspension stays manual for now: the admin gets an email and decides
const recordSellerLostDispute = async (seller) => {
    seller.disputesLostAgainst = (seller.disputesLostAgainst || 0) + 1;
    await seller.save();

    if (seller.disputesLostAgainst === SELLER_WARNING_AT) {
        sendSellerDisputeWarningEmail(seller.email, seller.businessName).catch((err) =>
            console.error("Seller warning email error:", err.message)
        );
    } else if (seller.disputesLostAgainst >= SELLER_REVIEW_AT) {
        sendAdminAlertEmail(
            "A seller reached the suspension limit",
            `${seller.businessName} (${seller.email}) has now lost ${seller.disputesLostAgainst} disputes. Please review the store and suspend it if needed.`
        ).catch((err) => console.error("Admin alert email error:", err.message));
    }
};

// call this ONCE when a dispute is resolved. Only disputes the buyer raised count as strikes;
// a split decision counts for nobody.
const applyDisputeOutcome = async (conversation, outcome) => {
    if (!conversation.dispute || conversation.dispute.raisedBy !== "buyer") return;

    if (outcome === "refunded_to_buyer") {
        const seller = await Seller.findById(conversation.sellerId);
        if (seller) await recordSellerLostDispute(seller);
    } else if (outcome === "released_to_seller" && conversation.buyerEmail) {
        const buyer = await Buyer.findOne({ email: conversation.buyerEmail.toLowerCase().trim() });
        if (buyer) await recordBuyerLostDispute(buyer);
    }
};

module.exports = { isBuyerBlocked, applyDisputeOutcome };