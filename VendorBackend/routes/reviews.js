const express = require("express");
const router = express.Router();
const { checkEligibility, createReview, getProductReviews } = require("../controllers/reviewController");

router.get("/eligibility", checkEligibility);
router.post("/", createReview);
router.get("/product/:productId", getProductReviews);

module.exports = router;