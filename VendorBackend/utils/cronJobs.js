const cron = require("node-cron");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Product = require("../models/Product");
const Seller = require("../models/Seller");
const Transaction = require("../models/Transaction");
const { sendLowStockEmail, sendInactivityWarningEmail } = require("./mailer");

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

module.exports = { startCronJobs };