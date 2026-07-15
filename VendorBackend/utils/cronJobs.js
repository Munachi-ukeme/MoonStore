const cron = require("node-cron");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Seller = require("../models/Seller");

const startCronJobs = () => {

    // ── Job 1: Auto-delete paid conversations older than 7 days ──
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

    // ── Job 2: Deactivate sellers whose trial has expired ──
    // only deactivates if they have no active paid subscription
    cron.schedule("0 0 * * *", async () => {
        console.log("Running trial expiry check...");

        try {
            const now = new Date();

            // find sellers whose trial has ended
            // and have no paid subscription covering today
            // and are still active
            const expiredTrialSellers = await Seller.find({
                isActive: true,
                trialEnd: { $lte: now },
                $or: [
                    { subscriptionEnd: null },
                    { subscriptionEnd: { $lte: now } },
                ],
            });

            if (expiredTrialSellers.length === 0) {
                console.log("No expired trials found.");
                return;
            }

            const sellerIds = expiredTrialSellers.map((s) => s._id);

            await Seller.updateMany(
                { _id: { $in: sellerIds } },
                { $set: { isActive: false } }
            );

            console.log(
                `Trial expiry: ${expiredTrialSellers.length} seller(s) deactivated.`
            );
        } catch (err) {
            console.error("Trial expiry cron job failed:", err.message);
        }
    });

    console.log("Cron jobs started.");
};

module.exports = { startCronJobs };