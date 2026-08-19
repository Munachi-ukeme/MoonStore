const markOrderPaid = async ({ conversation, realPrice, platformFeeAmount, reference }) => {
    const Message = require("../models/Message");
    const Product = require("../models/Product");
    const Seller = require("../models/Seller");
    const Transaction = require("../models/Transaction");
    const Referral = require("../models/Referral");
    const { getIO } = require("./socket");
    const { sendLowStockEmail } = require("./mailer");

    if (conversation.status === "paid") return;

    conversation.status = "paid";
    conversation.paidAt = new Date();
    await conversation.save();

    const seller = await Seller.findById(conversation.sellerId);

    await Transaction.create({
        sellerId: conversation.sellerId,
        type: "order",
        amount: realPrice,
        platformFee: platformFeeAmount,
        reference,
        productIds: conversation.productIds,
        buyerEmail: conversation.buyerEmail,
        buyerSessionId: conversation.buyerSessionId,
    });

    try {
        for (const [productId, quantityOrdered] of Object.entries(conversation.productQuantities || {})) {
            const product = await Product.findById(productId);

            if (!product || product.stockCount === undefined || product.stockCount === null) {
                continue;
            }

            const newStock = Math.max(product.stockCount - quantityOrdered, 0);
            product.stockCount = newStock;
            product.inStock = newStock > 0;

            if (newStock <= 5 && !product.lowStockNotified && seller) {
                sendLowStockEmail(seller.email, seller.businessName, product.name, newStock)
                    .catch((err) => console.error("Low stock email error:", err.message));
                product.lowStockNotified = true;
            } else if (newStock > 5) {
                product.lowStockNotified = false;
            }

            await product.save();
        }
    } catch (err) {
        console.error("Stock decrement failed:", err.message);
    }

    try {
        const pendingReferral = await Referral.findOne({
            referredSellerId: conversation.sellerId,
            status: "pending",
        });

        if (pendingReferral) {
            const salesAggregate = await Transaction.aggregate([
                { $match: { sellerId: conversation.sellerId, type: "order" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]);

            const cumulativeSales = salesAggregate[0]?.total || 0;

            if (cumulativeSales >= 500000) {
                const referrer = await Seller.findById(pendingReferral.referrerId);
                if (referrer) {
                    referrer.commissionBalance += pendingReferral.commissionAmount;
                    referrer.totalEarned += pendingReferral.commissionAmount;
                    await referrer.save();
                }

                pendingReferral.status = "earned";
                pendingReferral.paidAt = new Date();
                await pendingReferral.save();
            }
        }
    } catch (err) {
        console.error("Referral commission check failed:", err.message);
    }

    const products = await Product.find({ _id: { $in: conversation.productIds } });

    const productLinks = products
        .map((p) => `[product]${seller.slug}/${p.slug}|${p.name}[/product]`)
        .join(", ");

    await Message.create({
        conversationId: conversation._id,
        sender: "system",
        content: `✅ Thank you for your order! Payment is confirmed. Once you receive ${productLinks}, come back to this chat and tap this product link to leave a review. Note that this conversation will be deleted in 7 days.`,
    });

    try {
        getIO().to(conversation._id.toString()).emit("conversation_paid", {
            conversationId: conversation._id,
        });
    } catch (err) {
        console.error("Socket emit error:", err.message);
    }
};

module.exports = { markOrderPaid };