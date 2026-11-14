const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
    saveEmail,
    requestLoginLink,
    consumeLink,
    getBuyerConversations,
    getSellerConversations,
} = require("../controllers/buyerController");

const loginLinkLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: "Too many requests. Please try again in an hour." },
});

const consumeLinkLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { error: "Too many attempts. Please try again in an hour." },
});

router.post("/save-email", saveEmail);
router.post("/request-login-link", loginLinkLimiter, requestLoginLink);
router.post("/consume-link", consumeLinkLimiter, consumeLink);
router.get("/conversations", getBuyerConversations);
router.get("/conversations/seller/:slug", getSellerConversations);

module.exports = router;