const Review = require("../models/Review");
const Transaction = require("../models/Transaction");

const REVIEW_UNLOCK_HOURS = 24;

const checkEligibility = async (req, res) => {
    try {
        const { productId, buyerEmail } = req.query;

        if (!productId || !buyerEmail) {
            return res.status(400).json({ eligible: false, reason: "Missing productId or buyerEmail" });
        }

        const transaction = await Transaction.findOne({
            type: "order",
            productIds: productId,
            buyerEmail,
        }).sort({ paidAt: -1 });

        if (!transaction) {
            return res.json({ eligible: false, reason: "not_purchased" });
        }

        const hoursSincePaid = (Date.now() - new Date(transaction.paidAt).getTime()) / (1000 * 60 * 60);

        if (hoursSincePaid < REVIEW_UNLOCK_HOURS) {
            return res.json({
                eligible: false,
                reason: "too_soon",
                unlocksAt: new Date(new Date(transaction.paidAt).getTime() + REVIEW_UNLOCK_HOURS * 60 * 60 * 1000),
            });
        }

        const existingReview = await Review.findOne({ productId, buyerEmail });

        if (existingReview) {
            return res.json({ eligible: false, reason: "already_reviewed" });
        }

        return res.json({ eligible: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createReview = async (req, res) => {
    try {
        const { sellerId, productId, buyerEmail, rating, text } = req.body;

        if (!sellerId || !productId || !buyerEmail || !rating) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        const transaction = await Transaction.findOne({
            type: "order",
            productIds: productId,
            buyerEmail,
        });

        if (!transaction) {
            return res.status(403).json({ error: "You can only review products you've purchased" });
        }

        const hoursSincePaid = (Date.now() - new Date(transaction.paidAt).getTime()) / (1000 * 60 * 60);

        if (hoursSincePaid < REVIEW_UNLOCK_HOURS) {
            return res.status(403).json({ error: "Review not yet available for this order" });
        }

        const review = await Review.create({
            sellerId,
            productId,
            buyerEmail,
            rating,
            text: text ? text.trim() : "",
        });

        res.json({ review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "You have already reviewed this product" });
        }
        res.status(500).json({ error: error.message });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({ productId }).sort({ createdAt: -1 });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

        res.json({ reviews, averageRating, totalReviews });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { checkEligibility, createReview, getProductReviews };