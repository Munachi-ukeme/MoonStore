const Analytics = require("../models/Analytics");
const Conversation = require("../models/Conversation");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// POST /api/analytics/store-visit
const trackStoreVisit = async (req, res) => {
  try {
    const { sellerId, sessionId, referrer } = req.body;

    if (!sellerId) {
      return res.status(400).json({ error: "sellerId is required" });
    }

    await Analytics.create({
      sellerId,
      type: "store_visit",
      sessionId: sessionId || "",
      referrer: referrer || "",
    });

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to track store visit" });
  }
};


// POST /api/analytics/product-click
const trackProductClick = async (req, res) => {
  try {
    const { sellerId, productId, sessionId } = req.body;

    if (!sellerId || !productId) {
      return res.status(400).json({ error: "sellerId and productId are required" });
    }

    await Analytics.create({
      sellerId,
      type: "product_click",
      productId,
      sessionId: sessionId || "",
    });

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to track product click" });
  }
};

// GET /api/analytics/summary — protected, seller only
const getAnalyticsSummary = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    const { period } = req.query; // today, week, month, last_month, year, last_year

    const now = new Date();
    let startDate;
    let endDate = new Date(); // default end is now

    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === "week") {
      const day = now.getDay(); // 0 = Sunday
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "last_month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === "last_year") {
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    } else {
      // default: this month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const dateFilter = { $gte: startDate, $lte: endDate };

    // store visits
    const storeVisits = await Analytics.countDocuments({
      sellerId,
      type: "store_visit",
      createdAt: dateFilter,
    });

// orders = product clicks = buyer tapped Order Now
// orders = conversations started by buyers
const orders = await Conversation.countDocuments({
    sellerId,
    createdAt: dateFilter,
});

 // products sold = conversations marked paid in period
    const productsSold = await Conversation.countDocuments({
      sellerId,
      status: "paid",
      paidAt: dateFilter,
    });

    // pending payments = total amount paid today, awaiting Paystack daily settlement
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

const endOfToday = new Date();
endOfToday.setHours(23, 59, 59, 999);

const pendingAggregate = await Conversation.aggregate([
    {
        $match: {
            sellerId: new mongoose.Types.ObjectId(sellerId),
            status: "paid",
            paidAt: { $gte: startOfToday, $lte: endOfToday },
        },
    },
    {
        $group: {
            _id: null,
            total: { $sum: "$amount" },
        },
    },
]);

const pendingPayments = pendingAggregate[0]?.total || 0;



    const salesAggregate = await Conversation.aggregate([
    {
        $match: {
            sellerId: new mongoose.Types.ObjectId(sellerId),
            status: "paid",
            paidAt: dateFilter,
        },
    },
    {
        $group: {
            _id: null,
            total: { $sum: "$amount" },
        },
    },
]);

const totalSales = salesAggregate[0]?.total || 0;

// Seller's real take-home — uses actual recorded platformFee per sale
// (capped at ₦2,000 each), not a flat 4% guess
const earningsAggregate = await Transaction.aggregate([
    {
        $match: {
            sellerId: new mongoose.Types.ObjectId(sellerId),
            type: "order",
            createdAt: dateFilter,
        },
    },
    {
        $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            totalFee: { $sum: "$platformFee" },
        },
    },
]);

const sellerEarnings = earningsAggregate[0]
    ? earningsAggregate[0].totalAmount - earningsAggregate[0].totalFee
    : 0;


    res.json({
      storeVisits,
      orders,
      productsSold,
      pendingPayments,
      totalSales,
      sellerEarnings
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

module.exports = { trackStoreVisit, trackProductClick, getAnalyticsSummary };