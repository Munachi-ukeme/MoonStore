const Buyer = require("../models/Buyer");
const Conversation = require("../models/Conversation");
const Seller = require("../models/Seller");

const saveEmail = async (req, res) => {
    try {
        const { email, sessionId, sellerId } = req.body;

        if (!email || !sessionId || !sellerId) {
            return res.status(400).json({ message: "Email, session ID and seller ID are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // check if buyer already exists
        let buyer = await Buyer.findOne({ email: normalizedEmail });

        if (buyer) {
            // link new session ID if not already saved
            if (!buyer.sessionIds.includes(sessionId)) {
                buyer.sessionIds.push(sessionId);
                await buyer.save();
            }
        } else {
            // create new buyer
            buyer = await Buyer.create({
                email: normalizedEmail,
                sessionIds: [sessionId],
            });
        }

        // add email to seller's buyer list if not already there
        const seller = await Seller.findById(sellerId);
        if (seller && !seller.buyerEmails.includes(normalizedEmail)) {
            seller.buyerEmails.push(normalizedEmail);
            await seller.save();
        }

        res.json({ message: "Email saved successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
        console.error("Save email error:", err.message);
    }
};

// POST /api/buyer/login
const buyerLogin = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const buyer = await Buyer.findOne({ email: normalizedEmail });

        if (!buyer) {
            return res.status(404).json({
                message: "No orders found for this email. Start shopping on any MoonStore store.",
            });
        }

        res.json({
            message: "Login successful",
            sessionIds: buyer.sessionIds,
            email: buyer.email,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


// GET /api/buyer/conversations?sessionIds=abc,def,ghi
// the Conversation model query is commented out until chat is built
// returning empty array for now so the dashboard loads without errors
const getBuyerConversations = async (req, res) => {
    try {
        const { sessionIds } = req.query;

        if (!sessionIds) {
            return res.json({ conversations: [] });
        }

        // split comma-separated string back into an array
        const sessionArray = sessionIds.split(",");

       
        const conversations = await Conversation.find({
            sessionId: { $in: sessionArray }
        })
            .populate("sellerId", "businessName slug logo")
            .populate("productId", "name images")
            .sort({ createdAt: -1 });
        return res.json({ conversations });

        res.json({ conversations: [] });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/buyer/conversations/seller/:slug
// returns conversations for this buyer + this specific seller
// sessionId identifies the buyer without requiring login
const getSellerConversations = async (req, res) => {
    try {
        const { slug } = req.params;
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.json({ conversations: [] });
        }

      const seller = await Seller.findOne({ slug });
        if (!seller) {
            return res.status(404).json({ message: "Store not found" });
        }

        const conversations = await Conversation.find({
            sellerId: seller._id,
            buyerSessionId: sessionId,
        })
            .populate("productId", "name images")
            .populate("sellerId", "businessName slug logo")
            .sort({ updatedAt: -1 });

        res.json({ conversations });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { saveEmail, buyerLogin, getBuyerConversations, getSellerConversations };

module.exports = { saveEmail, buyerLogin, getBuyerConversations, getSellerConversations };