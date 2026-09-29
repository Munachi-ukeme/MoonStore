const cron = require("node-cron");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Product = require("../models/Product");
const Seller = require("../models/Seller");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category"); // Added missing import from Job 5
const { 
    sendLowStockEmail, 
    sendInactivityWarningEmail, 
    sendStoreDeactivatedEmail, 
    sendAdminDeactivationSummaryEmail,
    sendStoreDeletedEmail,
    sendAdminDeletionSummaryEmail
} = require("./mailer");

// Import your EscrowPay integration helper or SDK here
// const { releaseEscrowFunds } = require("../services/escrowpay");

const startCronJobs = () => {

    // ── Job 1: Auto-Release Escrow Funds (Runs Hourly) ──
    cron.schedule("0 * * * *", async () => {
        console.log("Running hourly auto-release escrow check...");

        try {
            const now = new Date();

            // Find all held orders whose countdown timer has passed
            const expiredEscrows = await Conversation.find({
                escrowStatus: "held",
                autoReleaseAt: { $lte: now },
            });

            if (expiredEscrows.length === 0) {
                console.log("No pending escrow releases found.");
                return;
            }

            let releasedCount = 0;

            for (const order of expiredEscrows) {
                // Atomic state update prevents double-release race conditions
                const updatedOrder = await Conversation.findOneAndUpdate(
                    { _id: order._id, escrowStatus: "held" },
                    { 
                        $set: { 
                            escrowStatus: "released", 
                            releasedAt: now 
                        } 
                    },
                    { new: true }
                );

                if (!updatedOrder) continue; // Skip if released or disputed concurrently

                try {
                    // Call EscrowPay API or perform ledger transfer to seller
                    // await releaseEscrowFunds(updatedOrder.paymentReference, updatedOrder.sellerId);

                    // Record transaction ledger entry
                    await Transaction.create({
                        sellerId: updatedOrder.sellerId,
                        conversationId: updatedOrder._id,
                        amount: updatedOrder.amount,
                        type: "escrow_release",
                        status: "completed",
                    });

                    releasedCount++;
                } catch (apiErr) {
                    console.error(`EscrowPay release failed for order ${order._id}:`, apiErr.message);
                    // Rollback status to 'held' so it retries on next cron cycle
                    await Conversation.findByIdAndUpdate(order._id, {
                        escrowStatus: "held",
                        releasedAt: null,
                    });
                }
            }

            console.log(`Hourly auto-release complete: ${releasedCount} order(s) released.`);
        } catch (err) {
            console.error("Hourly auto-release cron failed:", err.message);
        }
    });

    

    // ── Job 3: Daily low-stock check ──
    cron.schedule("0 8 * * *", async () => {
        console.log("Running daily low-stock check...");

        try {
            const lowStockProducts = await Product.find({
                stockCount: { $ne: null, $lte: 5,$gt: 0 },
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

    // ── Job 4: Warn sellers who've been inactive for 27 days ──
    cron.schedule("48 17 * * *", async () => {
        console.log("Running 27-day inactivity warning check...");

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

                if (daysSinceActivity >= 27) {
                    await sendInactivityWarningEmail(seller.email, seller.businessName)
                        .catch((err) => console.error("Inactivity email error:", err.message));

                    seller.inactivityWarningSent = true;
                    await seller.save();
                }
            }

            console.log("27-day inactivity warning check complete.");
        } catch (err) {
            console.error("Inactivity warning cron failed:", err.message);
        }
    });

    // ── Job 5: Deactivate stores inactive for 30+ days ──
    cron.schedule("0 10 * * *", async () => {
        console.log("Running 30-day auto-deactivation check...");

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

                if (daysSinceActivity >= 30) {
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

            console.log(`30-day auto-deactivation check complete. ${deactivatedThisRun.length} store(s) deactivated.`);
        } catch (err) {
            console.error("Auto-deactivation cron failed:", err.message);
        }
    });

    // ── Job 6: Permanently delete stores 7+ days after deactivation ──
    cron.schedule("0 11 * * *", async () => {
        console.log("Running 7-day post-deactivation deletion check...");

        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const candidateSellers = await Seller.find({
                isActive: false,
                deactivatedAt: { $ne: null,$lte: sevenDaysAgo },
            });

            const deletedThisRun = [];

            for (const seller of candidateSellers) {
                try {
                    // Paystack subaccount removal eliminated here
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

    console.log("Cron jobs started.");
};

const cron = require("node-cron");
const Conversation = require("./models/Conversation");
const { createRelease, createRefund } = require("./utils/escrowpay");
const { restoreStockOnRefund } = require("./utils/restoreStockOnRefund");
const Message = require("./models/Message");
const { getIO } = require("./utils/socket");

// runs hourly — releases funds once autoReleaseAt has passed
cron.schedule("0 * * * *", async () => {
    const dueForRelease = await Conversation.find({
        escrowStatus: "held",
        autoReleaseAt: { $ne: null, $lte: new Date() },
    });

    for (const conversation of dueForRelease) {
        const result = await createRelease({
            transactionId: conversation.escrowTransactionId,
            amountMinor: conversation.amount * 100,
            reason: "Auto-release after delivery window",
        });

        if (!result.ok) {
            console.error("Auto-release failed for", conversation._id, result.data);
        }
        // conversation.escrowStatus flips to "released" only when the
        // Release Completed webhook actually fires — not here
    }
});

// runs hourly — refunds buyers if seller never marked shipped within 48h
cron.schedule("0 * * * *", async () => {
    const dueForShipRefund = await Conversation.find({
        escrowStatus: "held",
        shippedAt: null,
        shipDeadlineAt: { $ne: null, $lte: new Date() },
    });

    for (const conversation of dueForShipRefund) {
        const result = await createRefund({
            transactionId: conversation.escrowTransactionId,
            amountMinor: conversation.amount * 100,
            reason: "Seller did not ship within 48 hours",
        });

        if (!result.ok) {
            console.error("Ship-deadline refund failed for", conversation._id, result.data);
        }
        // conversation.escrowStatus flips to "refunded" only when the
        // Refund Completed webhook actually fires — not here
    }
});

module.exports = { startCronJobs };