const Conversation = require("../models/Conversation");

const hasActiveEscrow = async (sellerId) => {
    const count = await Conversation.countDocuments({
        sellerId,
        escrowStatus: { $in: ["held", "disputed"] },
    });

    return count > 0;
};

module.exports = { hasActiveEscrow };