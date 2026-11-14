const restoreStockOnRefund = async (conversation) => {
    const Product = require("../models/Product");
    const { getQuantityEntries } = require("./quantities");

    try {
        for (const [productId, quantityOrdered] of getQuantityEntries(conversation.productQuantities)) {
            const product = await Product.findById(productId);

            if (!product || product.stockCount === undefined || product.stockCount === null) {
                continue;
            }

            product.stockCount = product.stockCount + quantityOrdered;
            product.inStock = true;
            await product.save();
        }
    } catch (err) {
        console.error("Stock restore on refund failed:", err.message);
    }
};

module.exports = { restoreStockOnRefund };