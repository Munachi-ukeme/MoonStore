//models
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Buyer = require("../models/Buyer");

//Utils
const { sendSellerNewChatEmail } = require("../utils/mailer");
const { getIO } = require("../utils/socket");
const { findOrCreatePartyByEmail, createTransaction, activateTransaction, createCheckoutSession } = require("../utils/escrowpay");
const { setupEscrowPaymentForConversation, buildPaymentMessage } = require("../utils/setupEscrowPayment");
const { onboardParty } = require("../utils/escrowpay");
const { calculateCommissionBps } = require("../utils/feeCalculator");
const { markOrderPaid } = require("../utils/markOrderPaid");
const { escrowpayRequest } = require("../utils/escrowpay"); 


const MAX_IMAGE_SIZE_BYTES = 300 * 1024; // 300KB limit after Base64


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
    "🔒 Security Notice: MoonStore never allow payment to be made into personal accounts. " +
    "Only pay to the official MoonStore payment link your seller send to you. " + 
    "Use the Report button if the seller asks you to pay outside this chat.";

// ── POST /api/chat/start ──
// buyer clicks Order Now — creates the conversation and sends first messages
const startConversation = async (req, res) => {
    try {
        const {
            slug,
            sessionId,
            items,
            buyerName,
            buyerEmail,
            deliveryAddress,
            deliveryCity,
            deliveryPhone,
        } = req.body;

        if (!slug || !sessionId || !items || !items.length) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const seller = await Seller.findOne({ slug });
        if (!seller || !seller.isActive) {
            return res.status(404).json({ message: "Store not found" });
        }

        // verify all products belong to this seller
        const productSlugs = items.map((item) => item.productSlug);
        const products = await Product.find({
            slug: { $in: productSlugs },
            sellerId: seller._id,
        });

        if (!products.length) {
            return res.status(404).json({ message: "Products not found" });
        }

        // build a map for quick lookup
        const productMap = {};
        products?.forEach((p) => {
            productMap[p.slug] = p;
        });

        // calculate total amount
        let totalAmount = 0;
        items?.forEach((item) => {
            const product = productMap[item.productSlug];
            if (product) {
                totalAmount += product.price * item.quantity;
            }
        });

        const productIds = products?.map((p) => p._id);

        // build a map of productId -> total quantity ordered for that product
const productQuantities = {};
items?.forEach((item) => {
    const product = productMap[item.productSlug];
    if (!product) return;
    const idStr = product._id.toString();
    productQuantities[idStr] = (productQuantities[idStr] || 0) + item.quantity;
});

          const conversation = await Conversation.create({
            buyerSessionId: sessionId,
            buyerEmail: buyerEmail || "",
            sellerId: seller._id,
            productIds,
            productQuantities,
            amount: totalAmount,
            buyerName: buyerName || "",
            deliveryAddress: deliveryAddress || "",
            deliveryCity: deliveryCity || "",
            deliveryPhone: deliveryPhone || "",
            buyerLastMessageAt: new Date(),
            lastMessage: "New order request",
        });

        // ── check if this buyer is already verified anywhere on MoonStore ──
        let buyer = null;
        if (buyerEmail) {
            buyer = await Buyer.findOne({ email: buyerEmail.toLowerCase().trim() });
        }

        let paymentInstructions = null;
        let needsVerification = false;

        if (buyer && buyer.identityVerificationStatus === "verified" && buyer.escrowPayPartyId) {
            const result = await setupEscrowPaymentForConversation(conversation, seller, buyer.escrowPayPartyId);
            if (result.ok) {
                paymentInstructions = result.paymentInstructions;
            }
        } else if (buyerEmail) {
            needsVerification = true;
        }

                await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: SECURITY_NOTICE,
        });

        await Message.create({
            conversationId: conversation._id,
            sender: "buyer",
            content: orderMessage,
        });

        if (paymentInstructions) {
            await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content: buildPaymentMessage(paymentInstructions),
            });
        } else if (needsVerification) {
            await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content:
                    "[verify]To hold your payment safely until delivery, we need to verify your identity once — a Central Bank requirement. Enter your NIN or BVN below. It is sent securely and never stored by MoonStore.[/verify]",
            });
        } else {
            await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content: "⚠️ We couldn't generate your payment details automatically. The seller will assist you shortly.",
            });
        }

        
        
        // notify seller
const productNames = products.map((p) => p.name);
sendSellerNewChatEmail(
    seller.email,
    seller.businessName,
    productNames
).catch((err) => console.error("Email error:", err.message));

        try {
            getIO().to(seller._id.toString()).emit("new_conversation", {
                conversationId: conversation?._id,
            });
        } catch (err) {
            console.error("Socket emit error:", err.message);
        }

        res.status(201).json({
            conversation: { _id: conversation?._id },
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
         const sessionId = req.headers["x-session-id"];

        const conversation = await Conversation.findById(conversationId)
            .populate("productIds", "name images price")
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

         await verifyEscrowIfStuck(conversation);

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
            .populate("productIds", "name images price")
            .populate("sellerId", "businessName slug logo");

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // make sure the logged-in seller owns this conversation
        if (conversation.sellerId._id.toString() !== req.seller._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        await verifyEscrowIfStuck(conversation);

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 });

        const sellerVisibleMessages = messages.filter(
            (msg) => !msg.content.includes("come back to this chat and tap this product link to leave a review")
        );

        res.json({ conversation, messages: sellerVisibleMessages });
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

        // check if content is a Base64 image
        const isImage = content.startsWith("[img]data:image");


        // if image — check size
        if (isImage) {
            const base64Data = content.replace(/\[img\]|\[\/img\]/g, "");
            const sizeInBytes = Buffer.byteLength(base64Data, "base64");
            if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
                return res.status(400).json({ message: "Image too large. Maximum size is 300KB." });
            }
        }

        // bank details blocker — skip for images
        if (!isImage && containsBankDetails(content)) {
            const blockedMessage = await Message.create({
                conversationId,
                sender: "system",
                content:
                    "⚠️ That message was blocked. Sharing personal bank account details " +
                    "in chat is not allowed on MoonStore. " +
                    "Sellers should share their official MoonStore payment link",
            });

            // update last message preview
            conversation.lastMessage = "Message blocked for security";
            await conversation.save();

          
            
           try {
                getIO().to(conversationId).emit("new_message", blockedMessage);
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

       conversation.lastMessage = isImage ? "📷 Image" : content;
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

    
        getIO().to(conversationId).emit("new_message", message);

        res.status(201).json({ message });
    } catch (err) {
        console.error("Main controller error:", err);
        
        res.status(500).json({ error: err.message || "Internal server error" });
    }
};

// ── GET /api/chat/inbox ──
// seller sees all conversations — protected route
const getSellerInbox = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            sellerId: req.seller._id,
        })
            .populate("productIds", "name images")
            .sort({ updatedAt: -1 }); // most recent first

        res.json({ conversations });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const initializeOrderPayment = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId)
            .populate("sellerId", "email businessName slug paystackSubaccountCode");

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.sellerId._id.toString() !== req.seller._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (conversation.status === "paid") {
            return res.status(400).json({ message: "This order is already paid" });
        }

        const seller = conversation.sellerId;

        if (!seller.paystackSubaccountCode) {
            return res.status(400).json({
                message: "Your Paystack subaccount is not set up. Please contact support.",
            });
        }

        // conversation.amount holds the REAL price total (sum of product prices)
        const realPrice = conversation.amount;
        const buyerChargeAmount = grossUpPrice(realPrice);

        // MoonStore's cut: 4% of the REAL price only, never the inflated total
        const platformFeeAmount = Math.min(Math.round(realPrice * 0.04), 2000);

        const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
        const PAYSTACK_BASE = "https://api.paystack.co";

        const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: seller.email,
                amount: buyerChargeAmount * 100, // kobo — total the buyer is charged
                subaccount: seller.paystackSubaccountCode,
                transaction_charge: platformFeeAmount * 100, // kobo — MoonStore's exact fixed cut
                bearer: "account",
                metadata: {
                    sellerId: seller._id,
                    conversationId: conversation._id,
                    realPrice,
                    platformFeeAmount,
                },
                callback_url: `${process.env.FRONTEND_URL}/${seller.slug}/chat/${conversationId}`,
            }),
        });

        const data = await response.json();

        console.log("Paystack response:", JSON.stringify(data));

        if (!data.status) {
            return res.status(400).json({ message: "Could not generate payment link" });
        } 

        const paymentUrl = data.data.authorization_url;
        conversation.paystackReference = data.data.reference;

        const systemMessage = await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: `💳 Payment link ready. Tap to pay:\n${paymentUrl}`,
        });

        conversation.lastMessage = "Payment link sent";
        await conversation.save();

        try {
            getIO().to(conversationId).emit("new_message", systemMessage);
        } catch (err) {
            console.error("Socket emit error:", err.message);
        }

        res.json({ message: "Payment link generated", paymentUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const verifyEscrowIfStuck = async (conversation) => {
    if (conversation.status === "paid") return;
    if (!conversation.escrowTransactionId) return;

    try {
        const result = await escrowpayRequest(`/api/v1/transactions/${conversation.escrowTransactionId}`, "GET");

        // ⚠️ UNCONFIRMED: field name/value for "this transaction is funded" — test in sandbox and correct if wrong
        if (result.ok && result.data.data.status === "funded") {
            await markOrderPaid({
                conversation,
                reference: conversation.escrowTransactionId,
            });
        }
    } catch (err) {
        console.error("Escrow verify check failed:", err.message);
    }
};

const reportConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const sessionId = req.headers["x-session-id"];
        const { reason, buyerPhone } = req.body;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        //  only the buyer in this conversation can report it
        if (conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }


        conversation.isReported = true;
        conversation.reportReason = reason;
        conversation.buyerPhone = buyerPhone || "";
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
        res.status(500).json({ message: "Server error" });
    }
};

const verifyBuyerIdentity = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const sessionId = req.headers["x-session-id"];
        const { type, identifier, consent, buyerName, buyerEmail } = req.body;

        if (!type || !identifier || !consent || !buyerEmail) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const conversation = await Conversation.findById(conversationId).populate("sellerId");
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }

        let buyer = await Buyer.findOne({ email: buyerEmail.toLowerCase().trim() });
        if (!buyer) {
            buyer = await Buyer.create({ email: buyerEmail.toLowerCase().trim() });
        }

        const onboardResult = await onboardParty({
            type,
            identifier,
            consent,
            email: buyerEmail,
            name: buyerName || "MoonStore Buyer",
            externalReference: buyer._id.toString(),
        });

        if (!onboardResult.ok) {
            await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content: "⚠️ We couldn't verify your details. Please check your NIN/BVN and try again, or contact support.",
            });
            return res.status(422).json({ message: "Verification failed", detail: onboardResult.data });
        }

        const partyData = onboardResult.data.data;

        buyer.escrowPayPartyId = partyData.party.id;
        buyer.identityVerificationStatus = partyData.identity.verification_status;
        await buyer.save();

        if (partyData.identity.verification_status !== "verified") {
            await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content: "Your verification is under review. We'll notify you once it's complete.",
            });
            return res.json({ verified: false, status: partyData.identity.verification_status });
        }

        const seller = conversation.sellerId;
        const result = await setupEscrowPaymentForConversation(conversation, seller, buyer.escrowPayPartyId);

        if (result.ok) {
            const message = await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content: buildPaymentMessage(result.paymentInstructions),
            });
            getIO().to(conversationId).emit("new_message", message);
            return res.json({ verified: true });
        }

        await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: "⚠️ Verified, but we couldn't generate payment details. The seller will assist you shortly.",
        });
        return res.status(500).json({ message: result.error });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const crypto = require("crypto");

const markAsShipped = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.sellerId.toString() !== req.seller._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (conversation.shippedAt) {
            return res.status(400).json({ message: "Already marked as shipped" });
        }

        const pin = crypto.randomInt(100000, 999999).toString();

        conversation.shippedAt = new Date();
        conversation.orderStage = "shipped";
        conversation.deliveryPin = pin;
        conversation.autoReleaseAt = new Date(
            Date.now() + conversation.deliveryWindowDays * 24 * 60 * 60 * 1000 + 48 * 60 * 60 * 1000
        );
        await conversation.save();

        await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: "📦 Your order has been shipped! You'll receive a delivery PIN separately — enter it once you receive your item to confirm delivery.",
        });

        // send PIN to buyer only — never expose it to the seller
        // TODO: also send via Termii SMS once that integration is wired up
        await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: `[buyer-only-pin]${pin}[/buyer-only-pin]`,
        });

        res.json({ message: "Marked as shipped" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const confirmDelivery = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const sessionId = req.headers["x-session-id"];
        const { pin } = req.body;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (conversation.deliveryPinLockedUntil && conversation.deliveryPinLockedUntil > new Date()) {
            return res.status(429).json({ message: "Too many attempts. Try again later." });
        }

        if (conversation.deliveryPin !== pin) {
            conversation.deliveryPinAttempts += 1;

            if (conversation.deliveryPinAttempts >= 5) {
                conversation.deliveryPinLockedUntil = new Date(Date.now() + 60 * 60 * 1000);
                conversation.deliveryPinAttempts = 0;
            }

            await conversation.save();
            return res.status(400).json({ message: "Incorrect PIN" });
        }

        conversation.deliveredAt = new Date();
        conversation.orderStage = "delivered";
        conversation.autoReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await conversation.save();

        await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: "✅ Delivery confirmed. You have 48 hours to raise a dispute if there's an issue.",
        });

        res.json({ message: "Delivery confirmed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


module.exports = {
    startConversation,
    reportConversation,
    getMessages,
    getMessagesAsSeller,
    sendMessage,
    getSellerInbox,
    initializeOrderPayment,
    verifyEscrowIfStuck,
    verifyBuyerIdentity,
    markAsShipped,
    confirmDelivery,

};