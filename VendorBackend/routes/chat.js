const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
    startConversation,
    getMessages,
    getMessagesAsSeller,
    sendMessage,
    getSellerInbox,
    reportConversation,
    initializeOrderPayment,
    
} = require("../controllers/chatController");

// ── public routes — buyers access these using sessionId ──
router.post("/start", startConversation);
router.get("/:conversationId", getMessages);
router.post("/:conversationId/message", sendMessage);
// ── protected routes — seller only, requires JWT ──
router.get("/seller/inbox", protect, getSellerInbox);
router.get("/seller/messages/:conversationId", protect, getMessagesAsSeller);
router.post("/:conversationId/generate-payment-link", protect, initializeOrderPayment);
router.post("/:conversationId/report", reportConversation);
router.post("/:conversationId/verify-identity", verifyBuyerIdentity);
router.post("/:conversationId/mark-shipped", protect, markAsShipped);
router.post("/:conversationId/confirm-delivery", confirmDelivery);
router.post("/:conversationId/dispute/buyer", raiseDispute);
router.post("/:conversationId/dispute/seller", protect, raiseDispute);
router.post("/:conversationId/dispute/buyer/cancel", cancelDispute);
router.post("/:conversationId/dispute/seller/cancel", protect, cancelDispute);
module.exports = router;