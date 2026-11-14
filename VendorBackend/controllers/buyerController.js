const crypto = require("crypto");
const Buyer = require("../models/Buyer");
const BuyerLoginToken = require("../models/BuyerLoginToken");
const Conversation = require("../models/Conversation");
const Seller = require("../models/Seller");
const { removeInternalFields, removePinFields } = require("../utils/conversationView");
const { isValidSessionId, addTrustedSessions } = require("../utils/buyerTrust");
const { sendBuyerLoginLinkEmail } = require("../utils/mailer");

const MAX_SESSIONS = 50;
const MAX_BUYER_EMAILS_PER_SELLER = 5000;
const LINK_LIFETIME_MS = 20 * 60 * 1000;
const RESEND_AFTER_MS = 2 * 60 * 1000;

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

// list views never need the delivery PIN, the hosted checkout link or any payment bookkeeping
const toBuyerListItem = (conversation) => {
    const plain = removePinFields(removeInternalFields(conversation.toObject()));
    delete plain.checkoutHostedUrl;
    return plain;
};

// the popup still calls this. It only remembers the email on the seller's list;
// it no longer links a browser to an email, because nobody has proved they own it yet.
const saveEmail = async (req, res) => {
    try {
        const { email, sellerId } = req.body;

        if (
            typeof email !== "string" ||
            typeof sellerId !== "string" ||
            !email.includes("@") ||
            email.length > 120 ||
            !/^[a-f0-9]{24}$/.test(sellerId)
        ) {
            return res.status(400).json({ error: "A valid email and seller ID are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const seller = await Seller.findById(sellerId);
        if (
            seller &&
            !seller.buyerEmails.includes(normalizedEmail) &&
            seller.buyerEmails.length < MAX_BUYER_EMAILS_PER_SELLER
        ) {
            seller.buyerEmails.push(normalizedEmail);
            await seller.save();
        }

        res.json({ message: "Email saved successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
        console.error("Save email error:", err.message);
    }
};

// POST /api/buyer/request-login-link
// emails a one-time login link; always gives the same answer so nobody can test which emails have orders
const requestLoginLink = async (req, res) => {
    try {
        const { email } = req.body;

        const genericReply = { message: "If we have orders for that email, a link has been sent to it." };

        if (typeof email !== "string" || !email.includes("@") || email.length > 120) {
            return res.json(genericReply);
        }

        const buyer = await Buyer.findOne({ email: email.toLowerCase().trim() });

        const hasSomethingToAccess =
            buyer && (buyer.identityVerificationStatus === "verified" || buyer.trustedSessionIds.length > 0);

        if (!hasSomethingToAccess) {
            return res.json(genericReply);
        }

        const recentLink = await BuyerLoginToken.findOne({
            buyerId: buyer._id,
            createdAt: { $gt: new Date(Date.now() - RESEND_AFTER_MS) },
        });

        if (recentLink) {
            return res.json(genericReply);
        }

        const token = crypto.randomBytes(32).toString("hex");

        await BuyerLoginToken.create({
            buyerId: buyer._id,
            tokenHash: hashToken(token),
            purpose: "login",
            expiresAt: new Date(Date.now() + LINK_LIFETIME_MS),
        });

        sendBuyerLoginLinkEmail(buyer.email, token, "login").catch((err) =>
            console.error("Login link email error:", err.message)
        );

        return res.json(genericReply);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// POST /api/buyer/consume-link
// called by the page the emailed link opens; the link works once
const consumeLink = async (req, res) => {
    try {
        const { token, sessionId } = req.body;

        if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token) || !isValidSessionId(sessionId)) {
            return res.status(400).json({ error: "This link is invalid or has expired." });
        }

        const record = await BuyerLoginToken.findOneAndUpdate(
            { tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: new Date() } },
            { usedAt: new Date() },
            { new: true }
        );

        if (!record) {
            return res.status(400).json({ error: "This link is invalid or has expired. Please request a new one." });
        }

        const buyer = await Buyer.findById(record.buyerId);
        if (!buyer) {
            return res.status(400).json({ error: "This link is invalid or has expired." });
        }

        // the browser that clicked the link becomes trusted; for an order confirmation so does the order's own browser
        const toTrust = [sessionId];
        if (record.purpose === "confirm" && record.sessionId) {
            toTrust.push(record.sessionId);
        }

        addTrustedSessions(buyer, toTrust);
        await buyer.save();

        let conversationInfo = null;

        if (record.purpose === "confirm" && record.conversationId) {
            const conversation = await Conversation.findById(record.conversationId).populate("sellerId", "slug");

            if (conversation && conversation.sellerId) {
                conversationInfo = { id: conversation._id, slug: conversation.sellerId.slug };
            }
        }

        res.json({
            email: buyer.email,
            sessionIds: buyer.trustedSessionIds,
            restoreSessionId: record.purpose === "confirm" ? record.sessionId : null,
            conversation: conversationInfo,
        });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

const getBuyerConversations = async (req, res) => {
    try {
        const { sessionIds } = req.query;

        if (typeof sessionIds !== "string" || !sessionIds) {
            return res.json({ conversations: [] });
        }

        const sessionArray = sessionIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
            .slice(0, MAX_SESSIONS);

        const conversations = await Conversation.find({
            buyerSessionId: { $in: sessionArray },
        })
            .populate("sellerId", "businessName slug logo")
            .populate("productIds", "name images")
            .sort({ createdAt: -1 });

        // filter out conversations whose seller no longer exists (deleted store)
        const validConversations = conversations
            .filter((convo) => convo.sellerId !== null)
            .map(toBuyerListItem);

        return res.json({ conversations: validConversations });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

const getSellerConversations = async (req, res) => {
    try {
        const { slug } = req.params;
        const { sessionId } = req.query;

        if (typeof sessionId !== "string" || !sessionId) {
            return res.json({ conversations: [] });
        }

        const seller = await Seller.findOne({ slug });
        if (!seller) {
            return res.status(404).json({ error: "Store not found" });
        }

        const conversations = await Conversation.find({
            sellerId: seller._id,
            buyerSessionId: sessionId,
        })
            .populate("productIds", "name images")
            .populate("sellerId", "businessName slug logo")
            .sort({ updatedAt: -1 });

        res.json({ conversations: conversations.map(toBuyerListItem) });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    saveEmail,
    requestLoginLink,
    consumeLink,
    getBuyerConversations,
    getSellerConversations,
};