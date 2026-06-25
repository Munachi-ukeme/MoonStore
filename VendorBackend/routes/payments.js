const express = require("express");
const router = express.Router();
const {
    getBanks,
    verifyAccount,
    initializePayment,
    paystackWebhook,
    verifyAndSyncSubscription
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authmiddleware");

// Fetches the directory list of Nigerian banks for frontend dropdown selection menu
router.get("/banks", getBanks);

// Verifies if an account number belongs to a real human before submitting a form
router.post("/verify-account", verifyAccount);

// Secret hotline channel that Paystack's background server calls to deliver transaction success alerts
router.post("/webhook", paystackWebhook);


// Triggered from seller dashboard to pay or renew subscription memberships
router.post("/initialize", protect, initializePayment);

// Endpoint for frontend background check
router.get("/sync-subscription", protect, verifyAndSyncSubscription);

module.exports = router;