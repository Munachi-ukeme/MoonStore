const Buyer = require("../models/Buyer");
const Conversation = require("../models/Conversation");
const Seller = require("../models/Seller");

const saveEmail = async (req, res) => {
    try {
        const { email, sessionId, sellerId } = req.body;

        if (!email || !sessionId || !sellerId) {
            return res.status(400).json({ error: "Email, session ID and seller ID are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        let buyer = await Buyer.findOne({ email: normalizedEmail });

        if (buyer) {
            if (!buyer.sessionIds.includes(sessionId)) {
                buyer.sessionIds.push(sessionId);
                await buyer.save();
            }
        } else {
            buyer = await Buyer.create({
                email: normalizedEmail,
                sessionIds: [sessionId],
            });
        }

        const seller = await Seller.findById(sellerId);
        if (seller && !seller.buyerEmails.includes(normalizedEmail)) {
            seller.buyerEmails.push(normalizedEmail);
            await seller.save();
        }

        res.json({ message: "Email saved successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
        console.error("Save email error:", err.message);
    }
};

const buyerLogin = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const buyer = await Buyer.findOne({ email: normalizedEmail });

        if (!buyer) {
            return res.status(404).json({
                error: "No orders found for this email. Start shopping on any MoonStore store.",
            });
        }

        res.json({
            message: "Login successful",
            sessionIds: buyer.sessionIds,
            email: buyer.email,
        });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

const getBuyerConversations = async (req, res) => {
    try {
        const { sessionIds } = req.query;

        if (!sessionIds) {
            return res.json({ conversations: [] });
        }

        const sessionArray = sessionIds.split(",");

        const conversations = await Conversation.find({
            buyerSessionId: { $in: sessionArray }
        })
            .populate("sellerId", "businessName slug logo")
            .populate("productIds", "name images")
            .sort({ createdAt: -1 });

        return res.json({ conversations });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

const getSellerConversations = async (req, res) => { 
    try {
        const { slug } = req.params;
        const { sessionId } = req.query;

        if (!sessionId) {
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

        res.json({ conversations });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { saveEmail, buyerLogin, getBuyerConversations, getSellerConversations };