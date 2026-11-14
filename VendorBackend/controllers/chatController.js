//packages
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

//models
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Buyer = require("../models/Buyer");
const BuyerLoginToken = require("../models/BuyerLoginToken");

//Utils
const { sendSellerNewChatEmail, sendAdminAlertEmail, sendBuyerLoginLinkEmail, sendBuyerShippedEmail, sendBuyerOrderCancelledEmail} = require("../utils/mailer");
const { getIO } = require("../utils/socket");
const { sendSms } = require("../utils/termii");
const { setupEscrowPaymentForConversation, buildPaymentMessage } = require("../utils/setupEscrowPayment");
const { onboardParty, getTransaction, createCheckoutSession, getCheckoutBootstrap, findPartyByExternalReference, } = require("../utils/escrowpay");
const { markOrderPaid } = require("../utils/markOrderPaid");
const { describeOnboardingError, getEscrowErrorCode } = require("../utils/escrowErrors");
const { isSessionTrusted, addTrustedSessions } = require("../utils/buyerTrust");
const { continueOrderPayment } = require("../utils/continueOrderPayment");
const { refundFunds, getFullAmountMinor } = require("../utils/escrowActions");
const { isBuyerBlocked } = require("../utils/strikes");
const { generateParcelCode } = require("../utils/parcelCode");
const { removeInternalFields } = require("../utils/conversationView");


const MAX_IMAGE_SIZE_BYTES = parseInt(process.env.MAX_IMAGE_SIZE_BYTES, 10);



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

const NUMBER_WORDS = {
    zero: "0", oh: "0", one: "1", two: "2", three: "3",
    four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9",
};

// longer names only: short ones like "uba" would match ordinary words once spaces are removed
const LONG_BANK_NAMES = BLOCKED_BANK_NAMES.filter((name) => name.replace(/[^a-z]/g, "").length >= 6);

const BANK_PHRASES = [
    "account number", "acct number", "account no", "acct no", "a/c no",
    "send money to", "transfer to my", "pay me directly", "pay outside", "pay to my account",
];

// true if the message tries to share bank details, even with spaces, symbols or number words
const containsBankDetails = (content) => {
    const lower = content.toLowerCase();

    // 1. a blocked bank name written normally
    if (BLOCKED_BANK_NAMES.some((bank) => lower.includes(bank))) return true;

    // 2. bank names with spaces or symbols between the letters, like "g t b a n k"
    const lettersOnly = lower.replace(/[^a-z]/g, "");
    if (LONG_BANK_NAMES.some((bank) => lettersOnly.includes(bank.replace(/[^a-z]/g, "")))) return true;

    // 3. phrases that ask for money outside MoonStore
    if (BANK_PHRASES.some((phrase) => lower.includes(phrase))) return true;

    // 4. numbers written as words become digits
    let withDigits = lower;
    Object.keys(NUMBER_WORDS).forEach((word) => {
        withDigits = withDigits.replace(new RegExp(`\\b${word}\\b`, "g"), NUMBER_WORDS[word]);
    });

    // 5. digits split by spaces, dots or dashes: 10 digits = account number, 15-19 = card number
    const digitRuns = withDigits.match(/(?:\d[\s.\-_/]*){10,}/g) || [];

    return digitRuns.some((run) => {
        const count = run.replace(/\D/g, "").length;
        return count === 10 || (count >= 15 && count <= 19);
    });
};

// true if the message contains a web address, an email address or a chat-app link
const containsLink = (text) => {
    const linkPattern = /(https?:\/\/|www\.|wa\.me|t\.me|bit\.ly|tinyurl|[a-z0-9-]+\.(com|ng|net|org|co|io|me|ly|app|xyz|info|biz|link|shop|store|site|online)\b)/i;
    const spelledOut = /\b(dot\s*com|dot\s*ng)\b/i;

    return linkPattern.test(text) || spelledOut.test(text);
};

// returns why a message is blocked, or null if it is fine
const getBlockedReason = (text) => {
    if (containsBankDetails(text)) return "bank details";
    if (containsLink(text)) return "links";
    return null;
};


const SECURITY_NOTICE =
    "🔒 Security Notice: Only pay into the payment details MoonStore shows in this chat. " +
    "Never send money to a personal account. " +
    "Use the Report button if the seller asks you to pay outside this chat.";


const cleanList = (value) => {
    if (!Array.isArray(value)) return [];

    return value
        .filter((entry) => typeof entry === "string" && entry.trim())
        .map((entry) => entry.trim().slice(0, 40))
        .slice(0, 10);
};


// ── POST /api/chat/start ──
// buyer clicks Order Now — creates the conversation and sends first messages

const startConversation = async (req, res) => {
    try {
             const { slug, sessionId, items, buyerEmail, deliveryZone } = req.body;

        const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
        const buyerName = clean(req.body.buyerName, 80);
        const deliveryAddress = clean(req.body.deliveryAddress, 200);
        const deliveryCity = clean(req.body.deliveryCity, 60);
        const deliveryPhone = clean(req.body.deliveryPhone, 20);

                if (
            typeof slug !== "string" ||
            typeof sessionId !== "string" ||
            sessionId.length < 10 ||
            sessionId.length > 100 ||
            !Array.isArray(items) ||
            items.length === 0 ||
            items.length > 50
        ) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const hasInvalidItem = items.some(
            (item) =>
                !item ||
                typeof item.productSlug !== "string" ||
                !Number.isInteger(item.quantity) ||
                item.quantity < 1 ||
                item.quantity > 1000
        );
        if (hasInvalidItem) {
            return res.status(400).json({ message: "Invalid order items" });
        }

        if (typeof buyerEmail !== "string" || !buyerEmail.includes("@") || buyerEmail.length > 120) {
            return res.status(400).json({ message: "A valid email is required to place an order" });
        }

        const hasInvalidQuantity = items.some(
            (item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000
        );
        if (hasInvalidQuantity) {
            return res.status(400).json({ message: "Invalid item quantity" });
        }

        const seller = await Seller.findOne({ slug });
        if (!seller || !seller.isActive) {
            return res.status(404).json({ message: "Store not found" });
        }

        if (seller.onboardingStatus !== "completed" || !seller.escrowPayMerchantRef) {
            return res.status(400).json({ message: "This store isn't ready to take orders yet." });
        }

        const productSlugs = items.map((item) => item.productSlug);
        const products = await Product.find({
            slug: { $in: productSlugs },
            sellerId: seller._id,
        });

        if (!products.length) {
            return res.status(404).json({ message: "Products not found" });
        }

        if (products.length !== new Set(productSlugs).size) {
            return res.status(400).json({ message: "One or more products are no longer available" });
        }

        const productMap = {};
        products?.forEach((p) => {
            productMap[p.slug] = p;
        });

        let totalAmount = 0;
        items?.forEach((item) => {
            const product = productMap[item.productSlug];
            if (product) {
                totalAmount += product.price * item.quantity;
            }
        });

        const productIds = products?.map((p) => p._id);

        const productQuantities = {};
        items?.forEach((item) => {
            const product = productMap[item.productSlug];
            if (!product) return;
            const idStr = product._id.toString();
            productQuantities[idStr] = (productQuantities[idStr] || 0) + item.quantity;
        });

            for (const product of products) {
            const quantityWanted = productQuantities[product._id.toString()] || 0;

            if (!product.inStock) {
                return res.status(400).json({ message: `${product.name} is sold out` });
            }

            if (
                product.stockCount !== undefined &&
                product.stockCount !== null &&
                quantityWanted > product.stockCount
            ) {
                return res.status(400).json({ message: `Only ${product.stockCount} of ${product.name} left` });
            }
        }

        const orderedProductSnapshot = [];
        items.forEach((item) => {
            const product = productMap[item.productSlug];
            if (!product) return;

            orderedProductSnapshot.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : "",
                colors: cleanList(item.colors),
                sizes: cleanList(item.sizes),
                quantity: item.quantity,
            });
        });

        let validatedZone = null;
        if (deliveryZone && deliveryZone.label) {
            validatedZone = (seller.deliveryOptions || []).find(
                (zone) => zone.label === deliveryZone.label
            );

            if (!validatedZone) {
                return res.status(400).json({ message: "That delivery option is no longer available. Please pick another." });
            }
        }

        const deliveryFee = validatedZone ? validatedZone.price : 0;

        const minOrder = Number(process.env.MIN_ORDER_NAIRA);
        const maxOrder = Number(process.env.MAX_ORDER_NAIRA);

        if (totalAmount < minOrder) {
            return res.status(400).json({ message: `The minimum order is ₦${minOrder.toLocaleString()}` });
        }

        if (totalAmount + deliveryFee > maxOrder) {
            return res.status(400).json({ message: `The maximum order is ₦${maxOrder.toLocaleString()}` });
        }

        const buyerToCheck = await Buyer.findOne({ email: buyerEmail.toLowerCase().trim() });
        if (isBuyerBlocked(buyerToCheck)) {
            return res.status(403).json({
                message: "We can't take new orders from this email right now. Please contact MoonStore support on WhatsApp 09126664419.",
            });
        }

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
            orderedProductSnapshot,
            shippingDetails: validatedZone ? {
            selectedOption: {
                label: validatedZone.label,
                estimatedDays: validatedZone.estimatedDays,
                },
                deliveryFee: validatedZone.price,
            } : undefined,
        });

                let buyer = null;
        if (buyerEmail) {
            buyer = await Buyer.findOne({ email: buyerEmail.toLowerCase().trim() });
        }

        let paymentInstructions = null;
        let needsVerification = false;
        let needsEmailConfirmation = false;

        const buyerIsVerified =
            buyer && buyer.identityVerificationStatus === "verified" && buyer.escrowPayPartyId;

        if (buyerIsVerified && isSessionTrusted(buyer, sessionId)) {
            // this browser already proved it belongs to this email
            const result = await setupEscrowPaymentForConversation(conversation, seller, buyer.escrowPayPartyId);
            if (result.ok) {
                paymentInstructions = result.paymentInstructions;
            }
        } else if (buyerIsVerified) {
            // the email is verified but this browser has not proved it owns it
            needsEmailConfirmation = true;
        } else if (buyerEmail) {
            needsVerification = true;
        }

        let orderLines = "";
        items?.forEach((item) => {
            const product = productMap[item.productSlug];
            if (!product) return;

            const itemTotal = product.price * item.quantity;
            let line = `• ${product.name} x${item.quantity}`;

            let chosenColors = "";
            if (Array.isArray(item.colors)) {
                chosenColors = item.colors.filter(Boolean).join(", ");
            } else if (typeof item.color === "string" && item.color.trim() !== "") {
                chosenColors = item.color.trim();
            }

            let chosenSizes = "";
            if (Array.isArray(item.sizes)) {
                chosenSizes = item.sizes.filter(Boolean).join(", ");
            } else if (typeof item.size === "string" && item.size.trim() !== "") {
                chosenSizes = item.size.trim();
            }

            if (chosenColors) {
                line += ` (${chosenColors})`;
            }
            if (chosenSizes) {
                line += ` — Size: ${chosenSizes}`;
            }

            line += ` — ₦${itemTotal.toLocaleString()}`;

            if (product.images && product.images.length > 0) {
                line += `\n[img]${product.images[0]}[/img]`;
            }

            orderLines += line + "\n";
        });

        let orderMessage = `New Order Request\n\n${orderLines}\nSubtotal: ₦${totalAmount.toLocaleString()}`;

                if (validatedZone) {
            orderMessage += `\nDelivery (${validatedZone.label}): ₦${deliveryFee.toLocaleString()}`;
        }

        orderMessage += `\nTotal: ₦${(totalAmount + deliveryFee).toLocaleString()}`;

        if (deliveryAddress) {
            orderMessage += `\n\n Deliver to: ${deliveryAddress}`;
            if (deliveryCity) orderMessage += `, ${deliveryCity}`;
        }
        if (deliveryPhone) {
            orderMessage += `\n Phone: ${deliveryPhone}`;
        }
        if (buyerName) {
            orderMessage += `\n Name: ${buyerName}`;
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
                content: buildPaymentMessage(paymentInstructions, conversation),
            });
        } else if (needsEmailConfirmation) {
            await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content:
                    "[confirm]We recognise this email from an earlier order. To keep your account safe, please confirm it's you. We will send a one-time link to that email address.[/confirm]",
            });
        } else if (needsVerification) {
            await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content:
                    "[verify]This check is required by our banking partner, Rubies Microfinance Bank (CBN-licensed), to open a secure account that holds your payment until delivery is confirmed. It's what lets you get refunded if anything goes wrong. Enter your NIN and date of birth exactly as they appear on your NIN record. Fake or mismatched details will be rejected.[/verify]",
            });
        } else {
            await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content: "⚠️ We couldn't create your payment details right now. Please go back and place the order again in a few minutes, or contact MoonStore support.",
            });
        }

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

        const buyerRecord = conversation.buyerEmail
            ? await Buyer.findOne({ email: conversation.buyerEmail.toLowerCase().trim() })
            : null;

        const conversationForBuyer = removeInternalFields(conversation.toObject());
        conversationForBuyer.sessionTrusted = isSessionTrusted(buyerRecord, conversation.buyerSessionId);

        res.json({ conversation: conversationForBuyer, messages });

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
            (msg) =>
                !msg.content.includes("come back to this chat and tap this product link to leave a review") &&
                !msg.content.includes("[verify]") &&
                !msg.content.includes("💳 Payment Details")
        );

        const conversationForSeller = conversation.toObject();
        delete conversationForSeller.deliveryPinAttempts;
        delete conversationForSeller.deliveryPinLockedUntil;
        delete conversationForSeller.buyerSessionId;
        delete conversationForSeller.checkoutHostedUrl;
        removeInternalFields(conversationForSeller);

        if (conversationForSeller.dispute) {
            delete conversationForSeller.dispute.answers;
        }

        res.json({ conversation: conversationForSeller, messages: sellerVisibleMessages });
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

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        if (sender !== "buyer" && sender !== "seller") {
            return res.status(400).json({ message: "Invalid sender" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (sender === "buyer") {
            if (conversation.buyerSessionId !== sessionId) {
                return res.status(403).json({ message: "Access denied" });
            }
        } else {
            // seller messages must carry the seller's login token and belong to this conversation
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ message: "Not authorized" });
            }

            try {
                const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
                if (String(decoded.id) !== String(conversation.sellerId)) {
                    return res.status(403).json({ message: "Access denied" });
                }
            } catch (err) {
                return res.status(401).json({ message: "Not authorized" });
            }
        }

        const isImage = content.startsWith("[img]data:image");

        if (isImage) {
            const base64Data = content.replace(/\[img\]|\[\/img\]/g, "");
            const sizeInBytes = Buffer.byteLength(base64Data, "base64");
            if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
                return res.status(400).json({ message: "Image too large. Maximum size is 300KB." });
            }
        }

        // check the written part of every message, including text sent together with an image
        const textOnly = content.replace(/\[img\][\s\S]*?\[\/img\]/g, "");

        if (textOnly.length > 2000) {
            return res.status(400).json({ message: "Message is too long" });
        }
        
            // only real photos may use the image tag, and users cannot fake MoonStore's own card tags
        const imageTags = content.match(/\[img\][\s\S]*?\[\/img\]/g) || [];
        const hasBadImageTag = imageTags.some((tag) => !tag.startsWith("[img]data:image/"));
        const hasCardTag = /\[(verify|confirm|product)\]/i.test(textOnly);

        if (hasBadImageTag || hasCardTag) {
            return res.status(400).json({ message: "That message could not be sent" });
        }

        const blockedReason = getBlockedReason(textOnly);

        if (blockedReason) {
            const blockedMessage = await Message.create({
                conversationId,
                sender: "system",
                content:
                    `⚠️ That message was blocked. Sharing ${blockedReason} in chat is not allowed on MoonStore, to protect buyers and sellers from scams. ` +
                    "Payments are only made through the payment details MoonStore shows in this chat.",
            });

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

        const message = await Message.create({
            conversationId,
            sender,
            content,
        });

        conversation.lastMessage = isImage ? "📷 Image" : content;
        if (sender === "buyer") {
            conversation.buyerLastMessageAt = new Date();
        }

               // seller reply notification: if the buyer has been away over 5 minutes, tell them by email and SMS.
        // at most one alert every 30 minutes, so several seller messages in a row don't cost several SMS
        if (sender === "seller" && conversation.buyerLastMessageAt) {
            const fiveMinutes = 5 * 60 * 1000;
            const thirtyMinutes = 30 * 60 * 1000;

            const buyerAway = Date.now() - conversation.buyerLastMessageAt.getTime() > fiveMinutes;
            const recentlyNotified =
                conversation.lastBuyerNotifiedAt &&
                Date.now() - conversation.lastBuyerNotifiedAt.getTime() < thirtyMinutes;

            if (buyerAway && !recentlyNotified) {
                const seller = await Seller.findById(conversation.sellerId);

                if (seller) {
                    conversation.lastBuyerNotifiedAt = new Date();

                    if (conversation.buyerEmail) {
                        const { sendBuyerReplyEmail } = require("../utils/mailer");
                        sendBuyerReplyEmail(
                            conversation.buyerEmail,
                            seller.businessName,
                            seller.slug,
                            conversation.buyerSessionId
                        ).catch((err) => console.error("Reply email error:", err.message));
                    }

                    if (conversation.deliveryPhone) {
                        sendSms({
                            to: conversation.deliveryPhone,
                            message: `MoonStore: ${seller.businessName.slice(0, 25)} replied to your order. Open moonstore.ng/my-orders to read it.`,
                        }).catch((err) => console.error("Reply SMS error:", err.message));
                    }
                }
            }
        }

        await conversation.save();

        try {
            getIO().to(conversationId).emit("new_message", message);
        } catch (err) {
            console.error("Socket emit error:", err.message);
        }

        res.status(201).json({ message });
    } catch (err) {
        console.error("sendMessage error:", err.message);
        res.status(500).json({ message: "Could not send message" });
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
            .select("-deliveryPin -deliveryPinAttempts -deliveryPinLockedUntil -checkoutHostedUrl -checkoutSessionId -releaseIdemKey -refundIdemKey -payoutIdemKey -releaseId -refundId -payoutId -buyerSessionId -dispute.answers")
            .sort({ updatedAt: -1 });

        res.json({ conversations });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



const verifyEscrowIfStuck = async (conversation) => {
    if (conversation.status === "paid") return;
    if (!conversation.escrowTransactionId) return;

    try {
        const result = await getTransaction(conversation.escrowTransactionId);
        const status = result.data && result.data.data && result.data.data.status;

        // "funded" and "active" both mean the money is held
        if (result.ok && (status === "funded" || status === "active")) {
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
        const { identifier, dateOfBirth, consent } = req.body;

        if (typeof identifier !== "string" || !/^\d{11}$/.test(identifier.trim())) {
            return res.status(400).json({ message: "Enter your 11-digit NIN" });
        }

        if (
            typeof dateOfBirth !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
            new Date(dateOfBirth) > new Date()
        ) {
            return res.status(400).json({ message: "Enter a valid date of birth" });
        }

        if (consent !== true) {
            return res.status(400).json({ message: "You must agree to identity verification to continue" });
        }

        const conversation = await Conversation.findById(conversationId).populate("sellerId");
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!conversation.buyerEmail) {
            return res.status(400).json({ message: "An email is required to continue" });
        }

        if (conversation.escrowTransactionId) {
            return res.status(400).json({ message: "Your payment details have already been created" });
        }

        const seller = conversation.sellerId;
        // the email always comes from the conversation, never from the request
        const email = conversation.buyerEmail.toLowerCase().trim();

        let buyer = await Buyer.findOne({ email });
        if (!buyer) {
            buyer = await Buyer.create({ email });
        }

        if (isBuyerBlocked(buyer)) {
            return res.status(403).json({
                message: "We can't take new orders from this email right now. Please contact MoonStore support on WhatsApp 09126664419.",
            });
        }

        const alreadyVerified = buyer.identityVerificationStatus === "verified" && buyer.escrowPayPartyId;

        // a verified identity may only be reused by a browser that has proved it owns the email
        if (alreadyVerified && !isSessionTrusted(buyer, sessionId)) {
            return res.status(403).json({ message: "Please confirm your email first. Use the button above to get a link." });
        }

        if (!alreadyVerified) {
            const onboardResult = await onboardParty({
                type: "nin",
                identifier: identifier.trim(),
                dateOfBirth,
                consent: true,
                email,
                externalReference: buyer._id.toString(),
            });

            if (onboardResult.ok) {
                const partyData = onboardResult.data.data;

                if (
                    !partyData ||
                    !partyData.party ||
                    !partyData.identity ||
                    partyData.identity.verification_status !== "verified"
                ) {
                    return res.status(422).json({
                        message: "We couldn't verify your details. Please contact support.",
                    });
                }

                buyer.escrowPayPartyId = partyData.party.id;
                buyer.identityVerificationStatus = "verified";
                await buyer.save();
            } else if (getEscrowErrorCode(onboardResult.data) === "identity_already_exists") {
                // already registered: if it is this same buyer, find them again by our own id
                const existing = await findPartyByExternalReference(buyer._id.toString());

                if (!existing) {
                    const failure = describeOnboardingError(onboardResult.data);
                    return res.status(failure.status).json({ message: failure.message });
                }

                buyer.escrowPayPartyId = existing.id;
                buyer.identityVerificationStatus = "verified";
                await buyer.save();
            } else {
                const failure = describeOnboardingError(onboardResult.data);

                if (failure.alertAdmin) {
                    sendAdminAlertEmail(
                        "EscrowPay verification could not run",
                        "A buyer verification failed because the EscrowPay wallet could not cover the verification fee. Please top up the wallet."
                    ).catch((err) => console.error("Admin alert email error:", err.message));
                }

                return res.status(failure.status).json({ message: failure.message });
            }
        }

        const result = await setupEscrowPaymentForConversation(conversation, seller, buyer.escrowPayPartyId);

        if (!result.ok) {
            return res.status(500).json({
                message: "You are verified, but we couldn't create your payment details. Please try again in a moment.",
            });
        }

        const message = await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: buildPaymentMessage(result.paymentInstructions, conversation),
        });

        try {
            getIO().to(conversationId).emit("new_message", message);
        } catch (err) {
            console.error("Socket emit error:", err.message);
        }

        res.json({ verified: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const normalizeNigerianPhone = (value) => {
    if (typeof value !== "string") return null;

    const digits = value.replace(/[\s\-+()]/g, "");

    if (/^234\d{10}$/.test(digits)) return digits;
    if (/^0\d{10}$/.test(digits)) return `234${digits.slice(1)}`;

    return null;
};
const markAsShipped = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { riderName, riderPhone } = req.body;

        const normalizedRiderPhone = normalizeNigerianPhone(riderPhone);
        if (!normalizedRiderPhone) {
            return res.status(400).json({
                message: "Enter the delivery person's phone number, for example 08012345678",
            });
        }

        const cleanRiderName = typeof riderName === "string" ? riderName.trim().slice(0, 60) : "";

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.sellerId.toString() !== req.seller._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (conversation.escrowStatus !== "held") {
            return res.status(400).json({ message: "This order cannot be marked as shipped right now" });
        }

        if (conversation.cancelledAt) {
            return res.status(400).json({ message: "This order was cancelled" });
        }

        if (conversation.shippedAt) {
            return res.status(400).json({ message: "Already marked as shipped" });
        }

        const parcelCode = conversation.deliveryPin || generateParcelCode();
        const windowDays = conversation.shippingDetails?.selectedOption?.estimatedDays || 0;

        conversation.shippedAt = new Date();
        conversation.orderStage = "shipped";
        conversation.deliveryPin = parcelCode;
        conversation.deliveryWindowDays = windowDays;
        conversation.autoReleaseAt = new Date(
            Date.now() + windowDays * 24 * 60 * 60 * 1000 + 48 * 60 * 60 * 1000
        );
        conversation.shippingDetails.riderName = cleanRiderName;
        conversation.shippingDetails.riderPhone = normalizedRiderPhone;
        await conversation.save();

        const message = await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: "📦 This order has been marked as shipped. When the parcel arrives, the buyer should check that the parcel code in this chat is written on the parcel, and confirm delivery only once they are holding it.",
        });

        try {
            getIO().to(conversationId).emit("new_message", message);
        } catch (err) {
            console.error("Socket emit error:", err.message);
        }

               const storeName = req.seller.businessName || "Your seller";

        if (conversation.deliveryPhone) {
            sendSms({
                to: conversation.deliveryPhone,
                message: `MoonStore: ${storeName.slice(0, 25)} shipped your order. Rider: +${normalizedRiderPhone}. On arrival, open your chat and type your parcel code to confirm. Only when you hold it.`,
            }).catch((err) => console.error("Shipping SMS error:", err.message));
        }

        if (conversation.buyerEmail) {
            sendBuyerShippedEmail(
                conversation.buyerEmail,
                storeName,
                cleanRiderName,
                normalizedRiderPhone
            ).catch((err) => console.error("Shipping email error:", err.message));
        }

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

        if (conversation.escrowStatus !== "held" || !conversation.shippedAt || !conversation.deliveryPin) {
            return res.status(400).json({ message: "This order is not ready for delivery confirmation" });
        }

        if (conversation.deliveredAt) {
            return res.status(400).json({ message: "Delivery was already confirmed" });
        }

        if (typeof pin !== "string" || !pin.trim()) {
            return res.status(400).json({ message: "Enter your parcel code" });
        }

        if (conversation.deliveryPinLockedUntil && conversation.deliveryPinLockedUntil > new Date()) {
            return res.status(429).json({ message: "Too many attempts. Try again later." });
        }

        if (conversation.deliveryPin !== pin.trim()) {
            conversation.deliveryPinAttempts += 1;

            if (conversation.deliveryPinAttempts >= 5) {
                conversation.deliveryPinLockedUntil = new Date(Date.now() + 60 * 60 * 1000);
                conversation.deliveryPinAttempts = 0;
            }

            await conversation.save();
            return res.status(400).json({ message: "Incorrect code" });
        }

        conversation.deliveredAt = new Date();
        conversation.orderStage = "delivered";
        conversation.autoReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
        conversation.releaseReminderSentAt = null;
        conversation.deliveryPinAttempts = 0;
        await conversation.save();

        const message = await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: "✅ Delivery confirmed. You have 48 hours to raise a dispute if there's an issue.",
        });

        try {
            getIO().to(conversationId).emit("new_message", message);
        } catch (err) {
            console.error("Socket emit error:", err.message);
        }

        res.json({ message: "Delivery confirmed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const BUYER_DISPUTE_CATEGORIES = ["not_received", "wrong_item", "damaged", "not_as_described", "other"];
const SELLER_DISPUTE_CATEGORIES = ["buyer_unreachable", "buyer_refused", "wrong_address", "other"];
const ANSWER_CHOICES = ["yes", "no", "not_sure"];

const raiseDispute = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { reason, answers } = req.body;
        const sessionId = req.headers["x-session-id"];
        const raisedBy = req.seller ? "seller" : "buyer";

        if (typeof reason !== "string" || !reason.trim()) {
            return res.status(400).json({ message: "A reason is required to raise a dispute" });
        }

        // older forms send no category, so default to "other"
        const category = typeof req.body.category === "string" ? req.body.category : "other";
        const allowedCategories = raisedBy === "seller" ? SELLER_DISPUTE_CATEGORIES : BUYER_DISPUTE_CATEGORIES;

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({ message: "Please choose what went wrong" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (raisedBy === "buyer" && conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (raisedBy === "seller" && conversation.sellerId.toString() !== req.seller._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (conversation.escrowStatus === "disputed") {
            return res.status(400).json({ message: "This order is already under dispute" });
        }
        if (conversation.escrowStatus !== "held") {
            return res.status(400).json({ message: "This order cannot be disputed right now" });
        }
        if (!conversation.shippedAt) {
            return res.status(400).json({ message: "A dispute can only be raised after the order has been shipped" });
        }

        // a buyer who says "not received" answers three short questions
        let cleanAnswers = { riderCalled: "", someoneElseReceived: "", addressUsed: "" };

        if (raisedBy === "buyer" && category === "not_received") {
            const given = answers && typeof answers === "object" ? answers : {};

            const answersAreValid =
                ANSWER_CHOICES.includes(given.riderCalled) &&
                ANSWER_CHOICES.includes(given.someoneElseReceived) &&
                typeof given.addressUsed === "string" &&
                given.addressUsed.trim().length > 0;

            if (!answersAreValid) {
                return res.status(400).json({ message: "Please answer the three questions" });
            }

            cleanAnswers = {
                riderCalled: given.riderCalled,
                someoneElseReceived: given.someoneElseReceived,
                addressUsed: given.addressUsed.trim().slice(0, 200),
            };
        }

        const cleanReason = reason.trim().slice(0, 500);

        // claim it in one step so two people cannot raise it at once,
        // and so it cannot be raised while a payout is already being made
        const updated = await Conversation.findOneAndUpdate(
            { _id: conversation._id, escrowStatus: "held", releaseId: null, releaseRequestedAt: null },
            {
                $set: {
                    escrowStatus: "disputed",
                    orderStage: "disputed",
                    "dispute.reason": cleanReason,
                    "dispute.category": category,
                    "dispute.answers": cleanAnswers,
                    "dispute.raisedBy": raisedBy,
                    "dispute.raisedAt": new Date(),
                },
            },
            { new: true }
        );

        if (!updated) {
            return res.status(400).json({ message: "This order can no longer be disputed" });
        }

        await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: `⚠️ A dispute has been raised by the ${raisedBy}. MoonStore support will review this order and may join this chat.`,
        });

        const { sendAdminNewDisputeEmail } = require("../utils/mailer");
        const seller = await Seller.findById(conversation.sellerId);
        sendAdminNewDisputeEmail(
            conversation._id.toString(),
            seller?.businessName || "Unknown seller",
            `[${category}] ${cleanReason}`,
            raisedBy
        ).catch((err) => console.error("Admin dispute notify error:", err.message));

        res.json({ message: "Dispute raised" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const cancelDispute = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const sessionId = req.headers["x-session-id"];
        const requester = req.seller ? "seller" : "buyer";

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        if (requester === "buyer" && conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }
        if (requester === "seller" && conversation.sellerId.toString() !== req.seller._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (conversation.escrowStatus !== "disputed") {
            return res.status(400).json({ message: "This order is not under dispute" });
        }

        if (conversation.dispute.raisedBy !== requester) {
            return res.status(403).json({ message: "Only the person who raised this dispute can cancel it" });
        }

        if (conversation.releaseId || conversation.refundId) {
            return res.status(400).json({ message: "This dispute is already being resolved and can no longer be cancelled" });
        }

        // extend the release deadline by however long the dispute was open,
        // so a mistaken dispute doesn't cost the seller real delivery-window time
        if (conversation.dispute.raisedAt && conversation.autoReleaseAt) {
            const disputeDurationMs = Date.now() - conversation.dispute.raisedAt.getTime();
            conversation.autoReleaseAt = new Date(conversation.autoReleaseAt.getTime() + disputeDurationMs);
        }

        conversation.escrowStatus = "held";
        conversation.orderStage = conversation.deliveredAt ? "delivered" : conversation.shippedAt ? "shipped" : "payment_held";
        conversation.dispute.reason = "";
        conversation.dispute.raisedBy = null;
        conversation.dispute.raisedAt = null;
        conversation.dispute.notifiedAt = null;
        conversation.dispute.responseDeadline = null;
        await conversation.save();

        await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: `The dispute was cancelled by the ${requester}. This order is back to normal.`,
        });

        res.json({ message: "Dispute cancelled" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const refreshPaymentDetails = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const sessionId = req.headers["x-session-id"];

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!conversation.escrowTransactionId) {
            return res.status(400).json({ message: "Payment has not been set up for this order yet" });
        }

        // the buyer may have paid just before the details expired
        await verifyEscrowIfStuck(conversation);

        if (conversation.status === "paid") {
            return res.json({ paid: true });
        }

        const bufferMs = 60 * 1000;

        if (conversation.paymentExpiresAt && conversation.paymentExpiresAt.getTime() > Date.now() + bufferMs) {
            return res.status(400).json({ message: "Your current payment details are still valid" });
        }

        let instructions = null;

        // 1. EscrowPay's checkout bootstrap issues a new account number on the same session
        if (conversation.checkoutPublicToken) {
            const bootstrap = await getCheckoutBootstrap(conversation.checkoutPublicToken);
            const body = bootstrap.data && bootstrap.data.data;

            let bootstrapInstructions = null;
            if (body && body.payment_instructions) {
                bootstrapInstructions = body.payment_instructions;
            } else if (body && body.session && body.session.payment_instructions) {
                bootstrapInstructions = body.session.payment_instructions;
            }

            const isFresh =
                bootstrapInstructions &&
                new Date(bootstrapInstructions.expires_at).getTime() > Date.now() + bufferMs;

            if (bootstrap.ok && isFresh) {
                instructions = bootstrapInstructions;
            } else {
                console.error(`Checkout bootstrap gave no fresh details (status ${bootstrap.status}); opening a new session instead`);
            }
        }

        // 2. otherwise open a new checkout session on the same transaction
        if (!instructions) {
            const created = await createCheckoutSession(
                conversation.escrowTransactionId,
                `mst-checkout-${conversation.escrowTransactionId}-${Date.now()}`
            );
            const createdSession = created.data && created.data.data;

            if (!created.ok || !createdSession || !createdSession.payment_instructions) {
                return res.status(500).json({
                    message: "We couldn't create new payment details right now. Please try again in a moment.",
                });
            }

            instructions = createdSession.payment_instructions;
            conversation.checkoutSessionId = createdSession.id;
            conversation.checkoutHostedUrl = createdSession.hosted_url || null;
            conversation.checkoutPublicToken = createdSession.public_token || null;
        }

        conversation.paymentExpiresAt = new Date(instructions.expires_at);
        await conversation.save();

        const message = await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: buildPaymentMessage(instructions, conversation),
        });

        try {
            getIO().to(conversationId).emit("new_message", message);
        } catch (err) {
            console.error("Socket emit error:", err.message);
        }

        res.json({ refreshed: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/chat/:conversationId/request-confirm-link
const requestConfirmLink = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const sessionId = req.headers["x-session-id"];

        const conversation = await Conversation.findById(conversationId).populate("sellerId", "businessName");
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (conversation.escrowTransactionId || !conversation.buyerEmail) {
            return res.status(400).json({ message: "Nothing to confirm for this order" });
        }

        const buyer = await Buyer.findOne({ email: conversation.buyerEmail.toLowerCase().trim() });
        const buyerIsVerified =
            buyer && buyer.identityVerificationStatus === "verified" && buyer.escrowPayPartyId;

        if (!buyerIsVerified) {
            return res.status(400).json({ message: "Nothing to confirm for this order" });
        }

        if (isSessionTrusted(buyer, sessionId)) {
            return res.status(400).json({ message: "This browser is already confirmed" });
        }

        // do not send a second email within two minutes
        const recentLink = await BuyerLoginToken.findOne({
            buyerId: buyer._id,
            purpose: "confirm",
            createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) },
        });

        if (recentLink) {
            return res.json({ sent: true });
        }

        const token = crypto.randomBytes(32).toString("hex");

        await BuyerLoginToken.create({
            buyerId: buyer._id,
            tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
            purpose: "confirm",
            sessionId,
            conversationId: conversation._id,
            expiresAt: new Date(Date.now() + 20 * 60 * 1000),
        });

        sendBuyerLoginLinkEmail(
            buyer.email,
            token,
            "confirm",
            conversation.sellerId ? conversation.sellerId.businessName : ""
        ).catch((err) => console.error("Confirm link email error:", err.message));

        res.json({ sent: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/chat/:conversationId/continue-payment
// after the browser is trusted, creates the payment details for the order
const continuePayment = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const sessionId = req.headers["x-session-id"];

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.buyerSessionId !== sessionId) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (conversation.escrowTransactionId) {
            return res.json({ already: true });
        }

        const buyer = conversation.buyerEmail
            ? await Buyer.findOne({ email: conversation.buyerEmail.toLowerCase().trim() })
            : null;

        const buyerIsVerified =
            buyer && buyer.identityVerificationStatus === "verified" && buyer.escrowPayPartyId;

        if (isBuyerBlocked(buyer)) {
            return res.status(403).json({
                message: "We can't take new orders from this email right now. Please contact MoonStore support on WhatsApp 09126664419.",
            });
        }

        if (!buyerIsVerified || !isSessionTrusted(buyer, sessionId)) {
            return res.status(403).json({ message: "Please confirm your email first" });
        }

        const result = await continueOrderPayment(conversation._id, buyer.escrowPayPartyId);

        if (!result.ok && !result.skipped) {
            return res.status(500).json({ message: "We couldn't create your payment details right now. Please try again." });
        }

        res.json({ continued: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const SELLER_CANCEL_REASONS = {
    out_of_stock: "Out of stock",
    cannot_deliver_there: "Cannot deliver to that location",
    wrong_price: "Wrong price on the listing",
    buyer_asked: "The buyer asked to cancel",
    other: "Other",
};

// POST /api/chat/:conversationId/seller-cancel
// the seller cancels before shipping: the buyer is fully refunded (the escrow fee cannot be returned)
const sellerCancelOrder = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { reason, note } = req.body;

        if (typeof reason !== "string" || !SELLER_CANCEL_REASONS[reason]) {
            return res.status(400).json({ message: "Please choose a reason" });
        }

        const cleanNote = typeof note === "string" ? note.trim().slice(0, 300) : "";
        if (reason === "other" && !cleanNote) {
            return res.status(400).json({ message: "Please add a short note" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        if (conversation.sellerId.toString() !== req.seller._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }

        const reasonText = cleanNote
            ? `${SELLER_CANCEL_REASONS[reason]}: ${cleanNote}`
            : SELLER_CANCEL_REASONS[reason];

        // claim the cancel first so a double tap cannot start two refunds
        const claimed = await Conversation.findOneAndUpdate(
            { _id: conversation._id, escrowStatus: "held", shippedAt: null, cancelledAt: null },
            { cancelledAt: new Date(), cancelledBy: "seller", cancelReason: reasonText },
            { new: true }
        );

        if (!claimed) {
            return res.status(400).json({ message: "This order can no longer be cancelled" });
        }

        const refund = await refundFunds(claimed, getFullAmountMinor(claimed), "Order cancelled by the seller");

        if (!refund.ok && !refund.skipped) {
            // the refund could not be started: undo the cancel so the seller can try again
            await Conversation.updateOne(
                { _id: claimed._id },
                { cancelledAt: null, cancelledBy: null, cancelReason: "" }
            );
            return res.status(500).json({
                message: "We couldn't start the refund right now. Please try again in a moment.",
            });
        }

        await Seller.updateOne({ _id: req.seller._id }, { $inc: { cancellations: 1 } });

        const message = await Message.create({
            conversationId: claimed._id,
            sender: "system",
            content: `❌ The seller cancelled this order (${reasonText}). Your payment is being refunded. The escrow service fee cannot be returned.`,
        });

        try {
            getIO().to(conversationId).emit("new_message", message);
        } catch (err) {
            console.error("Socket emit error:", err.message);
        }

        const storeName = req.seller.businessName || "The seller";

        if (claimed.buyerEmail) {
            sendBuyerOrderCancelledEmail(claimed.buyerEmail, storeName, reasonText).catch((err) =>
                console.error("Cancel email error:", err.message)
            );
        }

        if (claimed.deliveryPhone) {
            sendSms({
                to: claimed.deliveryPhone,
                message: `MoonStore: ${storeName.slice(0, 25)} cancelled your order. Your payment is being refunded (the escrow fee cannot be returned). Open your order chat for details.`,
            }).catch((err) => console.error("Cancel SMS error:", err.message));
        }

        res.json({ message: "Order cancelled" });
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
    verifyEscrowIfStuck,
    verifyBuyerIdentity,
    markAsShipped,
    confirmDelivery,
    raiseDispute,
    cancelDispute,
    refreshPaymentDetails,
    requestConfirmLink,
    continuePayment,
    sellerCancelOrder,
};