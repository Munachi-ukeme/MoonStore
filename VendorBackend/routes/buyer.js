const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { saveEmail, buyerLogin } = require("../controllers/buyerController");

const buyerLoginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { message: "Too many attempts. Please try again in an hour." },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post("/save-email", saveEmail);
router.post("/buyer-login", buyerLoginLimiter, buyerLogin);

module.exports = router;