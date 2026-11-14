const express = require("express");
const rateLimit = require("express-rate-limit");
const { getBanks, verifyAccount } = require("../controllers/bankController");

const router = express.Router();

const resolveLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { message: "Too many attempts. Please wait a few minutes and try again." },
});

router.get("/", getBanks);
router.post("/resolve", resolveLimiter, verifyAccount);

module.exports = router;