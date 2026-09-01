const cron = require("node-cron");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Product = require("../models/Product");
const Seller = require("../models/Seller");
const Transaction = require("../models/Transaction");
const { sendLowStockEmail, sendInactivityWarningEmail, sendStoreDeactivatedEmail, sendAdminDeactivationSummaryEmail } = require("./mailer");

const startCronJobs = () => {

    cron.schedule("0 0 * * *", async () => {
        console.log("Running auto-delete job for paid conversations...");

        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const expiredConversations = await Conversation.find({
                status: "paid",
                paidAt: { $lte: sevenDaysAgo },
            });

            if (expiredConversations.length === 0) {
                console.log("No expired conversations to delete.");
            } else {
                const conversationIds = expiredConversations.map((c) => c._id);

                const deletedMessages = await Message.deleteMany({
                    conversationId: { $in: conversationIds },
                });

                const deletedConversations = await Conversation.deleteMany({
                    _id: { $in: conversationIds },
                });

                console.log(
                    `Auto-delete complete: ${deletedConversations.deletedCount} conversations, ` +
                    `${deletedMessages.deletedCount} messages removed.`
                );
            }
        } catch (err) {
            console.error("Auto-delete cron job failed:", err.message);
        }
    });

    // catches products a seller manually edited down to low stock —
    // only emails once per low-stock event, thanks to lowStockNotified flag
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

    console.log("Cron jobs started.");
};

// ── Job 3: Warn sellers who've been inactive for 27 days ──
cron.schedule("48 17 * * *", async () => {
    console.log("Running 27-day inactivity warning check...");

    try {
        const activeSellers = await Seller.find({
            isActive: true,
            inactivityWarningSent: false,
        });

        for (const seller of activeSellers) {
            // find this seller's most recent real transaction
            const lastTransaction = await Transaction.findOne({
                sellerId: seller._id,
                type: "order",
            }).sort({ createdAt: -1 });

            // pick the most recent of: last transaction, reactivation date, or signup date
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

// ── Job 4: Deactivate stores inactive for 30+ days ──
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


// ── Job 5: Permanently delete stores 7+ days after deactivation ──
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
            try {
                if (seller.paystackSubaccountCode) {
                    await deactivateSubaccount(seller.paystackSubaccountCode);
                }

                const conversations = await Conversation.find({ sellerId: seller._id });
                const conversationIds = conversations.map((c) => c._id);

                await Message.deleteMany({ conversationId: { $in: conversationIds } });
                await Conversation.deleteMany({ sellerId: seller._id });
                await Product.deleteMany({ sellerId: seller._id });
                await Category.deleteMany({ sellerId: seller._id });

                // capture info for the email before the document is gone
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

module.exports = { startCronJobs };