const cron = require("node-cron");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Product = require("../models/Product");
const Seller = require("../models/Seller");

const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const { getIO } = require("./socket");
const { sendSms } = require("./termii");

const { hasActiveEscrow } = require("./hasActiveEscrow");
const { retryRelease, retryRefund, retryPayout } = require("./escrowpay");
const { getFullAmountMinor, releaseFunds, refundFunds, payoutToSeller } = require("./escrowActions");
const {
    sendLowStockEmail,
    sendInactivityWarningEmail,
    sendStoreDeactivatedEmail,
    sendAdminDeactivationSummaryEmail,
    sendStoreDeletedEmail,
    sendAdminDeletionSummaryEmail,
    sendAdminAlertEmail,
    sendBuyerReleaseReminderEmail
} = require("./mailer");

const MAX_RETRIES = 5;

const startCronJobs = () => {

    // ── Job 1: hourly — release funds once the delivery window + 48h buffer has passed ──
    cron.schedule("0 * * * *", async () => {
        try {
            const dueForRelease = await Conversation.find({
                escrowStatus: "held",
                releaseId: null,
                autoReleaseAt: { $ne: null, $lte: new Date() },
            });

            for (const conversation of dueForRelease) {
                const result = await releaseFunds(
                    conversation,
                    getFullAmountMinor(conversation),
                    "Auto-release after delivery window"
                );

                if (!result.ok && !result.skipped) {
                    console.error("Auto-release failed for", conversation._id, result.detail);
                }
            }
        } catch (err) {
            console.error("Auto-release cron failed:", err.message);
        }
    });

    // ── Job 2: hourly — refund the buyer if the seller never marked shipped within 48h ──
    cron.schedule("0 * * * *", async () => {
        try {
            const dueForShipRefund = await Conversation.find({
                escrowStatus: "held",
                shippedAt: null,
                refundId: null,
                shipDeadlineAt: { $ne: null, $lte: new Date() },
            });

            for (const conversation of dueForShipRefund) {
                const result = await refundFunds(
                    conversation,
                    getFullAmountMinor(conversation),
                    "Seller did not ship within 48 hours"
                );

                if (!result.ok && !result.skipped) {
                    console.error("Ship-deadline refund failed for", conversation._id, result.detail);
                }
            }
        } catch (err) {
            console.error("Ship-deadline refund cron failed:", err.message);
        }
    });



// clears the "retry pending" flag before retrying; if the retry fails again,
// EscrowPay's webhook sets the flag back. After MAX_RETRIES the admin gets an email.
const retryStuck = async ({ pendingField, countField, idField, noun, verb, retryFn }) => {
    const stuck = await Conversation.find({
        [pendingField]: true,
        [idField]: { $ne: null },
    });

    for (const conversation of stuck) {
        if (conversation[countField] >= MAX_RETRIES) {
            conversation[pendingField] = false;
            await conversation.save();
            await sendAdminAlertEmail(
                `A ${noun} is stuck`,
                `Order ${conversation._id} failed to ${verb} after ${MAX_RETRIES} retries. Please handle it manually in the EscrowPay dashboard.`
            );
            continue;
        }

        conversation[countField] += 1;
        conversation[pendingField] = false;
        await conversation.save();

        const result = await retryFn(conversation[idField]);

        // skipped means EscrowPay says it is no longer in a retryable state, so leave it alone
        if (!result.ok && !result.skipped) {
            conversation[pendingField] = true;
            await conversation.save();
        }
    }
};

// ── every 30 minutes: pay sellers whose release completed but payout never started,
// then retry releases, refunds and payouts that EscrowPay reported as failed ──
cron.schedule("*/30 * * * *", async () => {
    try {
        const needPayout = await Conversation.find({
            escrowStatus: "released",
            releaseId: { $ne: null },
            payoutId: null,
            payoutStatus: { $ne: "below_minimum" },
        });

        for (const conversation of needPayout) {
            const result = await payoutToSeller(conversation._id);

            if (!result.ok && !result.skipped) {
                console.error("Payout start failed for", conversation._id, result.detail || result.error);
            }
        }

        await retryStuck({
            pendingField: "releaseRetryPending",
            countField: "releaseRetryCount",
            idField: "releaseId",
            noun: "release",
            verb: "release",
            retryFn: retryRelease,
        });

        await retryStuck({
            pendingField: "refundRetryPending",
            countField: "refundRetryCount",
            idField: "refundId",
            noun: "refund",
            verb: "refund",
            retryFn: retryRefund,
        });

        await retryStuck({
            pendingField: "payoutRetryPending",
            countField: "payoutRetryCount",
            idField: "payoutId",
            noun: "payout",
            verb: "pay out",
            retryFn: retryPayout,
        });
    } catch (err) {
        console.error("Payout/retry cron failed:", err.message);
    }
});

    // ── Job 5: Daily low-stock check ──
    cron.schedule("0 8 * * *", async () => {
        console.log("Running daily low-stock check...");

        try {
            const lowStockProducts = await Product.find({
                stockCount: { $ne: null, $lte: 5, $gt: 0 },
                inStock: true,
                lowStockNotified: false,
            });

            if (lowStockProducts.length === 0) {
                console.log("No new low-stock products found.");
                return;
            }

            for (const product of lowStockProducts) {
                const seller = await Seller.findById(product.sellerId);
                if (!seller) continue;

                await sendLowStockEmail(seller.email, seller.businessName, product.name, product.stockCount)
                    .catch((err) => console.error("Low stock cron email error:", err.message));

                product.lowStockNotified = true;
                await product.save();
            }

            console.log(`Low-stock check complete: ${lowStockProducts.length} email(s) sent.`);
        } catch (err) {
            console.error("Low-stock cron job failed:", err.message);
        }
    });

    // ── Job 6: Warn sellers who've been inactive for 87 days ──
    cron.schedule("48 17 * * *", async () => {
        console.log("Running 87-day inactivity warning check...");

        try {
            const activeSellers = await Seller.find({
                isActive: true,
                inactivityWarningSent: false,
            });

            for (const seller of activeSellers) {
                const lastTransaction = await Transaction.findOne({
                    sellerId: seller._id,
                    type: "order",
                }).sort({ createdAt: -1 });

                const candidateDates = [
                    lastTransaction ? lastTransaction.createdAt : null,
                    seller.reactivatedAt,
                    seller.createdAt,
                ].filter(Boolean);

                const referenceDate = new Date(Math.max(...candidateDates.map((d) => new Date(d))));

                const daysSinceActivity = Math.floor(
                    (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysSinceActivity >= 87) {
                    await sendInactivityWarningEmail(seller.email, seller.businessName)
                        .catch((err) => console.error("Inactivity email error:", err.message));

                    seller.inactivityWarningSent = true;
                    await seller.save();
                }
            }

            console.log("87-day inactivity warning check complete.");
        } catch (err) {
            console.error("Inactivity warning cron failed:", err.message);
        }
    });

    // ── Job 7: Deactivate stores inactive for 90+ days ──
    cron.schedule("0 10 * * *", async () => {
        console.log("Running 90-day auto-deactivation check...");

        try {
            const candidateSellers = await Seller.find({
                isActive: true,
                inactivityWarningSent: true,
            });

            const deactivatedThisRun = [];

            for (const seller of candidateSellers) {
                const lastTransaction = await Transaction.findOne({
                    sellerId: seller._id,
                    type: "order",
                }).sort({ createdAt: -1 });

                const candidateDates = [
                    lastTransaction ? lastTransaction.createdAt : null,
                    seller.reactivatedAt,
                    seller.createdAt,
                ].filter(Boolean);

                const referenceDate = new Date(Math.max(...candidateDates.map((d) => new Date(d))));

                const daysSinceActivity = Math.floor(
                    (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysSinceActivity >= 90) {
                    seller.isActive = false;
                    seller.deactivatedAt = new Date();
                    await seller.save();

                    await sendStoreDeactivatedEmail(seller.email, seller.businessName)
                        .catch((err) => console.error("Deactivation email error:", err.message));

                    deactivatedThisRun.push(seller);
                }
            }

            if (deactivatedThisRun.length > 0) {
                await sendAdminDeactivationSummaryEmail(deactivatedThisRun)
                    .catch((err) => console.error("Admin summary email error:", err.message));
            }

            console.log(`90-day auto-deactivation check complete. ${deactivatedThisRun.length} store(s) deactivated.`);
        } catch (err) {
            console.error("Auto-deactivation cron failed:", err.message);
        }
    });

    // ── Job 8: Permanently delete stores 7+ days after deactivation ──
    cron.schedule("0 11 * * *", async () => {
        console.log("Running 7-day post-deactivation deletion check...");

        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const candidateSellers = await Seller.find({
                isActive: false,
                deactivatedAt: { $ne: null, $lte: sevenDaysAgo },
            });

            const deletedThisRun = [];

            for (const seller of candidateSellers) {
                // never delete a seller while buyer money is still held or disputed
                if (await hasActiveEscrow(seller._id)) {
                    console.log(`Skipping deletion of ${seller.email}: escrow still open.`);
                    continue;
                }

                try {
                    const conversations = await Conversation.find({ sellerId: seller._id });
                    const conversationIds = conversations.map((c) => c._id);

                    await Message.deleteMany({ conversationId: { $in: conversationIds } });
                    await Conversation.deleteMany({ sellerId: seller._id });
                    await Product.deleteMany({ sellerId: seller._id });
                    await Category.deleteMany({ sellerId: seller._id });

                    const sellerInfo = { businessName: seller.businessName, email: seller.email };

                    await seller.deleteOne();

                    await sendStoreDeletedEmail(sellerInfo.email, sellerInfo.businessName)
                        .catch((err) => console.error("Store deleted email error:", err.message));

                    deletedThisRun.push(sellerInfo);
                } catch (err) {
                    console.error(`Failed to delete seller ${seller.email}:`, err.message);
                }
            }

            if (deletedThisRun.length > 0) {
                await sendAdminDeletionSummaryEmail(deletedThisRun)
                    .catch((err) => console.error("Admin deletion summary email error:", err.message));
            }

            console.log(`Auto-deletion check complete. ${deletedThisRun.length} store(s) deleted.`);
        } catch (err) {
            console.error("Auto-deletion cron failed:", err.message);
        }
    });

    // ── every day at 9am: remind the admin about disputes open for more than 3 days ──
cron.schedule("0 9 * * *", async () => {
    try {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        const openDisputes = await Conversation.find({
            escrowStatus: "disputed",
            "dispute.raisedAt": { $lt: threeDaysAgo },
        }).select("_id");

        if (openDisputes.length === 0) return;

        await sendAdminAlertEmail(
            `${openDisputes.length} dispute(s) open for more than 3 days`,
            `Order ids: ${openDisputes.map((c) => c._id).join(", ")}. Please review them in the admin dispute page.`
        );
    } catch (err) {
        console.error("Open dispute reminder failed:", err.message);
    }
}, { timezone: "Africa/Lagos" });


// ── every 30 minutes: remind buyers about 24 hours before the automatic payout to the seller ──
cron.schedule("*/30 * * * *", async () => {
    try {
        const now = new Date();
        const inTwentyFourHours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const dueForReminder = await Conversation.find({
            escrowStatus: "held",
            orderStage: { $in: ["shipped", "delivered"] },
            autoReleaseAt: { $gt: now, $lte: inTwentyFourHours },
            releaseReminderSentAt: null,
        }).populate("sellerId", "businessName");

        for (const conversation of dueForReminder) {
            // claim it first so two overlapping runs cannot send it twice
            const claimed = await Conversation.updateOne(
                { _id: conversation._id, releaseReminderSentAt: null },
                { releaseReminderSentAt: new Date() }
            );

            const modified = claimed.modifiedCount !== undefined ? claimed.modifiedCount : claimed.nModified;
            if (modified !== 1) continue;

            const storeName = conversation.sellerId ? conversation.sellerId.businessName : "the seller";
            const isDelivered = conversation.orderStage === "delivered";

            let chatText = "";
            let smsText = "";

            if (isDelivered) {
                chatText = "⏰ Reminder: your window to raise a problem with this order closes in about 24 hours. After that the seller is paid and a dispute is no longer possible.";
                smsText = `MoonStore: your window to raise a problem with your order from ${storeName.slice(0, 25)} closes in about 24 hours. Open your order chat if there is an issue.`;
            } else {
                chatText = "⏰ Reminder: the seller will be paid automatically in about 24 hours. If you have not received your order, raise a dispute now. After payout a dispute is no longer possible.";
                smsText = `MoonStore: the seller will be paid for your order from ${storeName.slice(0, 25)} in about 24 hours. Not received it? Open your order chat and raise a dispute now.`;
            }

            const message = await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content: chatText,
            });

            try {
                getIO().to(conversation._id.toString()).emit("new_message", message);
            } catch (err) {
                console.error("Socket emit error:", err.message);
            }

            if (conversation.deliveryPhone) {
                sendSms({ to: conversation.deliveryPhone, message: smsText }).catch((err) =>
                    console.error("Reminder SMS error:", err.message)
                );
            }

            if (conversation.buyerEmail) {
                sendBuyerReleaseReminderEmail(conversation.buyerEmail, storeName, isDelivered).catch((err) =>
                    console.error("Reminder email error:", err.message)
                );
            }
        }
    } catch (err) {
        console.error("Release reminder cron failed:", err.message);
    }
});

    console.log("Cron jobs started.");
};


module.exports = { startCronJobs };