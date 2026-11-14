const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const {
    handleTransactionFunded,
    handlePartialFunding,
    handleReleaseCompleted,
    handleReleaseFailed,
    handleRefundCompleted,
    handleRefundFailed,
    handleRefundRequiresAction,
    handlePayoutCompleted,
    handlePayoutFailed,
    handleAdminAlertEvent,
    handleChargeFailed
} = require("../utils/escrowpayWebhookHandlers");

const SIGNATURE_TOLERANCE_SECONDS = 300;

router.post("/escrowpay", async (req, res) => {
    try {
        const secret = process.env.ESCROWPAY_WEBHOOK_SECRET;

        if (!secret || !req.rawBody) {
            console.error("Webhook not configured: missing ESCROWPAY_WEBHOOK_SECRET or raw body");
            return res.status(500).json({ message: "Webhook not configured" });
        }

        const signatureHeader = req.headers["escrowpay-signature"];

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
        const providedSignature = signaturePart.split("=")[1] || "";

        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) {
            return res.status(401).json({ message: "Signature timestamp too old" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${timestamp}.${req.rawBody}`)
            .digest("hex");

        const expectedBuffer = Buffer.from(expectedSignature);
        const providedBuffer = Buffer.from(providedSignature);

        const isValid =
            expectedBuffer.length === providedBuffer.length &&
            crypto.timingSafeEqual(expectedBuffer, providedBuffer);

        if (!isValid) {
            return res.status(401).json({ message: "Invalid signature" });
        }

        const event = req.body;

        if (!event || typeof event.type !== "string") {
            return res.status(200).json({ received: true });
        }

        if (event.type === "transaction.funded") {
            await handleTransactionFunded(event);
        } else if (event.type === "transaction.partially_funded") {
            await handlePartialFunding(event);
        } else if (event.type === "release.completed") {
            await handleReleaseCompleted(event);
        } else if (event.type === "release.failed") {
            await handleReleaseFailed(event);
        } else if (event.type === "refund.completed") {
            await handleRefundCompleted(event);
        } else if (event.type === "refund.failed") {
            await handleRefundFailed(event);
        } else if (event.type === "refund.requires_action") {
            await handleRefundRequiresAction(event);
        } else if (event.type === "payout.completed") {
            await handlePayoutCompleted(event);
        } else if (event.type === "payout.failed") {
            await handlePayoutFailed(event);
        } else if (event.type === "charge.failed") {
            await handleChargeFailed(event);
        } else if (
            event.type === "administrative_hold.applied" ||
            event.type === "charge.reversed" ||
            event.type === "payout.reversed" ||
            event.type === "reconciliation.issue_detected"
        ) {
            await handleAdminAlertEvent(event);
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error("Webhook error:", err.message);
        res.status(500).json({ message: "Webhook processing failed" });
    }
});

module.exports = router;