const cron = require("node-cron");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

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

    console.log("Cron jobs started.");
};

module.exports = { startCronJobs };