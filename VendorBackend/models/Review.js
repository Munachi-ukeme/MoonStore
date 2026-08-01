const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Seller",
            required: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        buyerEmail: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        text: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

reviewSchema.index({ productId: 1 });
reviewSchema.index({ sellerId: 1 });
reviewSchema.index({ productId: 1, buyerEmail: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);