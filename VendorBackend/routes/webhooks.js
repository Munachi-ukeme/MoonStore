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
        const signatureHeader = req.headers["escrowpay-signature"];
        const secret = process.env.ESCROWPAY_WEBHOOK_SECRET;

        if (!signatureHeader) {
            return res.status(401).json({ message: "Missing signature" });
        }

        const parts = signatureHeader.split(",");
        const timestampPart = parts.find((p) => p.startsWith("t="));
        const signaturePart = parts.find((p) => p.startsWith("v1="));

        if (!timestampPart || !signaturePart) {
            return res.status(401).json({ message: "Malformed signature" });
        }

        const timestamp = timestampPart.split("=")[1];
        const providedSignature = signaturePart.split("=")[1];

        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - Number(timestamp)) > 300) {
            return res.status(401).json({ message: "Signature timestamp too old" });
        }

        const signedMessage = `${timestamp}.${req.rawBody}`;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(signedMessage)
            .digest("hex");

        const isValid = crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(providedSignature)
        );

        if (!isValid) {
            return res.status(401).json({ message: "Invalid signature" });
        }

        const event = req.body;

        if (event.type === "transaction.funded") {
            await handleTransactionFunded(event);
        } else if (event.type === "release.completed") {
            await handleReleaseCompleted(event);
        } else if (event.type === "refund.completed") {
            await handleRefundCompleted(event);
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error("Webhook error:", err.message);
        res.status(500).json({ message: "Webhook processing failed" });
    }
});

module.exports = router;s