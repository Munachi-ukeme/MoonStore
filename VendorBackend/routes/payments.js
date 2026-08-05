const express = require("express");
const router = express.Router();
const {
  getBanks,
  verifyAccount,
  paystackWebhook,
} = require("../controllers/paymentController");

// GET /api/payment/banks → Directory list of Nigerian banks for dropdown selection
router.get("/banks", getBanks);

// POST /api/payment/verify-account → Verifies bank account details with Paystack
router.post("/verify-account", verifyAccount);

// POST /api/payment/webhook → Paystack event webhook receiver for processing order payments
router.post("/webhook", paystackWebhook);

module.exports = router;