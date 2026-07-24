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
    reportConversation
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
module.exports = router;