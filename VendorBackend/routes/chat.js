const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/authmiddleware");
const {
    startConversation,
    getMessages,
    getMessagesAsSeller,
    sendMessage,
    getSellerInbox,
    reportConversation,
    verifyBuyerIdentity,
    markAsShipped,
    confirmDelivery,
    raiseDispute,
    cancelDispute,
    refreshPaymentDetails,
    requestConfirmLink,
    continuePayment,
    sellerCancelOrder,
} = require("../controllers/chatController");

const verifyIdentityLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: "Too many verification attempts. Please try again in an hour." },
});

const startOrderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: { message: "Too many orders started. Please try again later." },
});

const refreshPaymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: "Too many attempts. Please try again later." },
});

const confirmLinkLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: "Too many attempts. Please try again later." },
});


// ── protected routes — seller only, requires JWT ──
router.get("/seller/inbox", protect, getSellerInbox);
router.get("/seller/messages/:conversationId", protect, getMessagesAsSeller);
router.post("/:conversationId/mark-shipped", protect, markAsShipped);
router.post("/:conversationId/dispute/seller", protect, raiseDispute);
router.post("/:conversationId/dispute/seller/cancel", protect, cancelDispute);

// ── public routes — buyers access these using their sessionId ──
router.post("/start", startOrderLimiter, startConversation);
router.get("/:conversationId", getMessages);
router.post("/:conversationId/message", sendMessage);
router.post("/:conversationId/report", reportConversation);
router.post("/:conversationId/verify-identity", verifyIdentityLimiter, verifyBuyerIdentity);
router.post("/:conversationId/confirm-delivery", confirmDelivery);
router.post("/:conversationId/dispute/buyer", raiseDispute);
router.post("/:conversationId/dispute/buyer/cancel", cancelDispute);
router.post("/:conversationId/refresh-payment", refreshPaymentLimiter, refreshPaymentDetails);
router.post("/:conversationId/request-confirm-link", confirmLinkLimiter, requestConfirmLink);
router.post("/:conversationId/continue-payment", continuePayment);
router.post("/:conversationId/seller-cancel", protect, sellerCancelOrder);

module.exports = router;