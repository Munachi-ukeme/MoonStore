const cron = require("node-cron");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const startCronJobs = () => {

    // runs every day at midnight — "0 0 * * *"
    // cron syntax: minute hour day month weekday
    // 0 0 * * * means: at minute 0, hour 0, every day, every month, every weekday
    cron.schedule("0 0 * * *", async () => {
        console.log("Running auto-delete job for paid conversations...");

        try {
            const sevenDaysAgo = new Date();
            // setDate modifies the date object in place
            // subtracting 7 from today's date gives us the cutoff point
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // find all paid conversations older than 7 days
            const expiredConversations = await Conversation.find({
                status: "paid",
                paidAt: { $lte: sevenDaysAgo }, // $lte means "less than or equal to"
            });

            if (expiredConversations.length === 0) {
                console.log("No expired conversations to delete.");
                return;
            }

            // extract just the _id values into an array
            const conversationIds = expiredConversations.map((c) => c._id);

            // delete all messages belonging to these conversations first
            // always delete child documents before parent documents
            // if you delete the conversation first, the messages become
            // orphaned — they still exist in MongoDB but have no parent
            const deletedMessages = await Message.deleteMany({
                conversationId: { $in: conversationIds },
            });

            // now delete the conversations themselves
            const deletedConversations = await Conversation.deleteMany({
                _id: { $in: conversationIds },
            });

            console.log(
                `Auto-delete complete: ${deletedConversations.deletedCount} conversations, ` +
                `${deletedMessages.deletedCount} messages removed.`
            );
        } catch (err) {
            console.error("Auto-delete cron job failed:", err.message);
        }
    });

    console.log("Cron jobs started.");
};

module.exports = { startCronJobs };