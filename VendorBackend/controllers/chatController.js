const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const { sendSellerNewChatEmail } = require("../utils/mailer");
const { getIO } = require("../utils/socket");

// ── Nigerian bank names to block in chat messages ──
// if any of these appear in a message, it is blocked
// toLowerCase comparison so "GTBank" and "gtbank" both match
const BLOCKED_BANK_NAMES = [
    "zenith bank", "zenith",
    "gtbank", "gtb", "guaranty trust",
    "access bank", "access",
    "first bank", "firstbank",
    "uba", "united bank for africa",
    "fidelity bank", "fidelity",
    "union bank",
    "stanbic ibtc", "stanbic",
    "sterling bank", "sterling",
    "wema bank", "wema",
    "polaris bank", "polaris",
    "keystone bank", "keystone",
    "ecobank",
    "fcmb", "first city monument",
    "heritage bank",
    "opay", "kuda", "moniepoint", "palmpay",
    "providus bank", "providus",
    "vfd microfinance", "vfd",
    "jaiz bank",
];

// checks if a message contains a 10-digit account number or bank name
// returns true if the message should be blocked
const containsBankDetails = (content) => {
    const lower = content.toLowerCase();

    // \b is a word boundary — ensures we match 10 consecutive digits
    // as a standalone number, not as part of a longer string like a phone number
    // Nigerian account numbers are exactly 10 digits
    const accountNumberPattern = /\b\d{10}\b/;
    if (accountNumberPattern.test(content)) return true;

    // check for any blocked bank name in the message
    const hasBankName = BLOCKED_BANK_NAMES.some((bank) =>
        lower.includes(bank)
    );
    if (hasBankName) return true;

    return false;
};

const SECURITY_NOTICE =
    "🔒 Security Notice: MoonStore never asks for your personal bank details. " +
    "Only pay to the official MoonStore subaccount your seller shares from their dashboard. " +
    "Never send money to a personal account. " +
    "Use the Report button if the seller asks you to pay outside this chat.";

// ── POST /api/chat/start ──
// buyer clicks Order Now — creates the conversation and sends first messages
const startConversation = async (req, res) => {
    try {
        const { buyerSessionId, sellerId, productId, orderMessage } = req.body;

        if (!buyerSessionId || !sellerId || !productId || !orderMessage) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // verify seller and product exist
        const seller = await Seller.findById(sellerId);
        if (!seller || !seller.isActive) {
            return res.status(404).json({ message: "Store not found" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // create the conversation
        const conversation = await Conversation.create({
            buyerSessionId,
            sellerId,
            productId,
            buyerLastMessageAt: new Date(),
            lastMessage: orderMessage,
        });

        // automatically insert security notice as first message
        // sender is "system" — styled differently in the UI
        await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: SECURITY_NOTICE,
        });

        // insert the buyer's order details as the second message
        await Message.create({
            conversationId: conversation._id,
            sender: "buyer",
            content: orderMessage,
        });

        // notify seller via email
        // this runs after the response is sent so it does not slow down the buyer
        sendSellerNewChatEmail(
            seller.email,
            seller.businessName,
            product.name
        ).catch((err) => console.error("Email error:", err.message));

      
       try {
    getIO().to(sellerId.toString()).emit("new_conversation", { conversationId: conversation._id });
} catch (err) {
    console.error("Socket emit error:", err.message);
}

        res.status(201).json({
            conversationId: conversation._id,
            message: "Conversation started",
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/chat/:conversationId ──
// fetch all messages in a conversation thread
// buyer verified by sessionId — no JWT needed
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { sessionId } = req.query;

        const conversation = await Conversation.findById(conversationId)
            .populate("productId", "name images price")
            .populate("sellerId", "businessName slug logo");

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // verify the requester is either the buyer or the seller
        // buyer proves identity with sessionId
        // seller identity verified via their JWT in the protect middleware
        // for this public route we check sessionId
        if (conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 }); // oldest first — like any chat app

        res.json({
            conversation,
            messages,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/chat/seller/messages/:conversationId ──
// seller version of getMessages — verified by JWT not sessionId
const getMessagesAsSeller = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId)
            .populate("productId", "name images price")
            .populate("sellerId", "businessName slug logo");

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // make sure the logged-in seller owns this conversation
        if (conversation.sellerId._id.toString() !== req.seller._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 });

        res.json({ conversation, messages });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/chat/:conversationId/message ──
// send a message — runs bank details blocker before saving
const sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, sender, sessionId } = req.body;

        if (!content || !sender) {
            return res.status(400).json({ message: "Content and sender are required" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // verify identity based on who is sending
        if (sender === "buyer") {
            if (conversation.buyerSessionId !== sessionId) {
                return res.status(403).json({ message: "Access denied" });
            }
        }

        // ── bank details blocker ──
        // runs BEFORE the message is saved
        // if blocked, we save a system message explaining why instead
        if (containsBankDetails(content)) {
            const blockedMessage = await Message.create({
                conversationId,
                sender: "system",
                content:
                    "⚠️ That message was blocked. Sharing personal bank account details " +
                    "in chat is not allowed on MoonStore. " +
                    "Sellers should share their official MoonStore subaccount details from their dashboard.",
            });

            // update last message preview
            conversation.lastMessage = "Message blocked for security";
            await conversation.save();

          
            
           try {
                getIO().to(conversationId).emit("new_message", message);
                } catch (err) {
                console.error("Socket emit error:", err.message);
                    }

            return res.status(200).json({
                blocked: true,
                message: blockedMessage,
            });
        }

        // save the actual message
        const message = await Message.create({
            conversationId,
            sender,
            content,
        });

        // update conversation's last message preview and timestamps
        conversation.lastMessage = content;

        if (sender === "buyer") {
            conversation.buyerLastMessageAt = new Date();
        }

        // ── seller reply notification trigger ──
        // if seller is replying and it has been more than 5 minutes
        // since the buyer's last message — buyer has likely left the page
        if (sender === "seller" && conversation.buyerLastMessageAt) {
            const fiveMinutes = 5 * 60 * 1000;
            const timeSinceBuyerMessage =
                Date.now() - conversation.buyerLastMessageAt.getTime();

            if (timeSinceBuyerMessage > fiveMinutes && conversation.buyerEmail) {
                const seller = await Seller.findById(conversation.sellerId);
                if (seller) {
                    const { sendBuyerReplyEmail } = require("../utils/mailer");
                    sendBuyerReplyEmail(
                        conversation.buyerEmail,
                        seller.businessName,
                        seller.slug,
                        conversation.buyerSessionId
                    ).catch((err) => console.error("Reply email error:", err.message));
                }
            }
        }

        await conversation.save();

    
        io.to(conversationId).emit("new_message", message);

        res.status(201).json({ message });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/chat/inbox ──
// seller sees all conversations — protected route
const getSellerInbox = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            sellerId: req.seller._id,
        })
            .populate("productId", "name images")
            .populate("buyerId", "email")
            .sort({ updatedAt: -1 }); // most recent first

        res.json({ conversations });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PUT /api/chat/:conversationId/account-sent ──
// seller marks that they have shared their subaccount details
// this unlocks the Mark as Paid button on seller's side
const markAccountDetailsSent = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // only the seller who owns this conversation can do this
        if (conversation.sellerId.toString() !== req.seller._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        conversation.accountDetailsSent = true;
        await conversation.save();

        res.json({ message: "Account details marked as sent" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PUT /api/chat/:conversationId/paid ──
// seller confirms payment received — protected route
const markAsPaid = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.sellerId.toString() !== req.seller._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!conversation.accountDetailsSent) {
            return res.status(400).json({
                message: "You must share your payment details before marking as paid",
            });
        }

        conversation.status = "paid";
        conversation.paidAt = new Date();
        conversation.lastMessage = "✅ Payment confirmed";
        await conversation.save();

        // insert system confirmation message — buyer sees this instantly
        const confirmationMessage = await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content:
                "✅ Payment confirmed by seller. Thank you for shopping on MoonStore! " +
                "This conversation will be automatically deleted after 7 days.",
        });

        
        try {
    getIO().to(conversation._id.toString()).emit("payment_confirmed", {
        message: confirmationMessage,
    });
} catch (err) {
    console.error("Socket emit error:", err.message);
}

        res.json({ message: "Marked as paid", confirmationMessage });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/chat/:conversationId/report ──
// buyer reports seller for trying to move conversation off platform
// public route — buyer uses their sessionId to verify identity
const reportConversation = async (req, res) => {
    try {
        const { sessionId, reason } = req.body;
        const conversation = await Conversation.findById(req.params.conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // only the buyer in this conversation can report it
        if (conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }

        conversation.isReported = true;
        conversation.reportReason = reason || "Seller requested off-platform payment";
        await conversation.save();

        // insert system message so both buyer and seller see that a report was filed
        await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content:
                "⚠️ This conversation has been reported to MoonStore for review. " +
                "Our team will investigate within 24 hours.",
        });

        res.json({ message: "Report submitted. Our team will review this conversation." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    startConversation,
    getMessages,
    getMessagesAsSeller,
    sendMessage,
    getSellerInbox,
    markAccountDetailsSent,
    markAsPaid,
    reportConversation,
};