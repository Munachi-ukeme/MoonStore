const markOrderPaid = async ({ conversation, reference }) => {
    const Message = require("../models/Message");
    const Product = require("../models/Product");
    const Seller = require("../models/Seller");
    const Transaction = require("../models/Transaction");
    const { getIO } = require("./socket");
    const { sendLowStockEmail } = require("./mailer");

    if (conversation.status === "paid") return;

    const realPrice = conversation.amount;
    const platformFeeAmount = Math.round((realPrice * conversation.marketplaceCommissionBps) / 10000);

    conversation.status = "paid";
    conversation.escrowStatus = "held";
    conversation.orderStage = "payment_held";
    conversation.paidAt = new Date();
    conversation.shipDeadlineAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
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
        conversationId: conversation._id,
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

    const products = await Product.find({ _id: { $in: conversation.productIds } });

    const productLinks = products
        .map((p) => `[product]${seller.slug}/${p.slug}|${p.name}[/product]`)
        .join(", ");

    await Message.create({
        conversationId: conversation._id,
        sender: "system",
        content: `✅ Payment received and secured. The seller has 48 hours to ship your order. Once you receive ${productLinks}, come back to this chat and tap this product link to leave a review.`,
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