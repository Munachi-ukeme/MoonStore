const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
  trackStoreVisit,
  trackProductClick,
  getAnalyticsSummary,
} = require("../controllers/AnalyticsController");

router.post("/store-visit", trackStoreVisit);
router.post("/product-click", trackProductClick);
router.get("/summary", protect, getAnalyticsSummary);

module.exports = router;