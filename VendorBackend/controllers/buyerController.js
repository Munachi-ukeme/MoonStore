const Buyer = require("../models/Buyer");
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

module.exports = { saveEmail, buyerLogin };