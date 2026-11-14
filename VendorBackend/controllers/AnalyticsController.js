const Analytics = require("../models/Analytics");
const Conversation = require("../models/Conversation");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

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

const getAnalyticsSummary = async (req, res) => {
  try {
    const sellerId = req.seller._id;
    const { period } = req.query;

    const now = new Date();
    let startDate;
    let endDate = new Date();

    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === "week") {
      const day = now.getDay();
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
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const dateFilter = { $gte: startDate, $lte: endDate };
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const storeVisits = await Analytics.countDocuments({
      sellerId,
      type: "store_visit",
      createdAt: dateFilter,
    });

    const orders = await Conversation.countDocuments({
      sellerId,
      createdAt: dateFilter,
    });

    const productsSold = await Conversation.countDocuments({
      sellerId,
      status: "paid",
      paidAt: dateFilter,
    });

    // Total Sales — gross value of everything paid for in this period,
    // regardless of what stage it's at now (held, shipped, released, disputed)
    const totalSalesAggregate = await Conversation.aggregate([
      {
        $match: {
          sellerId: sellerObjectId,
          status: "paid",
          paidAt: dateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalSales = totalSalesAggregate[0]?.total || 0;

    // Held in Escrow — money paid in this period that is STILL locked up,
    // not yet released to the seller and not refunded/disputed away
    const heldAggregate = await Conversation.aggregate([
      {
        $match: {
          sellerId: sellerObjectId,
          escrowStatus: "held",
          paidAt: dateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const heldInEscrow = heldAggregate[0]?.total || 0;

    // Released to You — real take-home, only orders actually released in
    // this period (filtered by releasedAt, not paidAt — this answers
    // "how much actually hit my account during this period")
    const releasedAggregate = await Transaction.aggregate([
      {
        $match: {
          sellerId: sellerObjectId,
          type: "order",
        },
      },
      {
        $lookup: {
          from: "conversations",
          localField: "conversationId",
          foreignField: "_id",
          as: "conversation",
        },
      },
      { $unwind: "$conversation" },
      {
        $match: {
          "conversation.escrowStatus": "released",
          "conversation.releasedAt": dateFilter,
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
    const releasedToYou = releasedAggregate[0]
      ? releasedAggregate[0].totalAmount - releasedAggregate[0].totalFee
      : 0;

    // Disputed — count + value of orders currently under dispute
    const disputedAggregate = await Conversation.aggregate([
      {
        $match: {
          sellerId: sellerObjectId,
          escrowStatus: "disputed",
          paidAt: dateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const disputedCount = disputedAggregate[0]?.count || 0;
    const disputedAmount = disputedAggregate[0]?.total || 0;

    // Refunded — count + value of orders refunded back to buyer
    const refundedAggregate = await Conversation.aggregate([
      {
        $match: {
          sellerId: sellerObjectId,
          escrowStatus: "refunded",
          paidAt: dateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const refundedCount = refundedAggregate[0]?.count || 0;
    const refundedAmount = refundedAggregate[0]?.total || 0;

    res.json({
      storeVisits,
      orders,
      productsSold,
      totalSales,
      heldInEscrow,
      releasedToYou,
      disputedCount,
      disputedAmount,
      refundedCount,
      refundedAmount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

module.exports = { trackStoreVisit, trackProductClick, getAnalyticsSummary };