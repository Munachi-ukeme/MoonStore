const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const {
    handleTransactionFunded,
    handleReleaseCompleted,
    handleRefundCompleted,
} = require("../utils/escrowpayWebhookHandlers");

router.post("/escrowpay", async (req, res) => {
    try {
        const signature = req.headers["escrowpay-signature"];
        const secret = process.env.ESCROWPAY_WEBHOOK_SECRET;

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(req.rawBody)
            .digest("hex");

        if (signature !== expectedSignature) {
            return res.status(401).json({ message: "Invalid signature" });
        }

        const event = req.body;

        if (event.type === "transaction.funded") {
            await handleTransactionFunded(event.data);
        } else if (event.type === "release.completed") {
            await handleReleaseCompleted(event.data);
        } else if (event.type === "refund.completed") {
            await handleRefundCompleted(event.data);
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error("Webhook error:", err.message);
        res.status(500).json({ message: "Webhook processing failed" });
    }
});

module.exports = router;