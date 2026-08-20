const Seller = require("../models/Seller");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const PDFDocument = require("pdfkit");
const Product = require("../models/Product");
const Category = require("../models/Category");
const ExitSurvey = require("../models/ExitSurvey");
const bcrypt = require("bcryptjs");
const Transaction = require("../models/Transaction");
const crypto = require("crypto");

let activeAdminToken = null;
let adminTokenExpires = null;

// Reusable admin verification helper
const verifyAdmin = (req, res) => {
  const providedToken = req.headers["admin-key"];

  if (!activeAdminToken || Date.now() > adminTokenExpires) {
    res.status(401).json({ message: "Session expired, please log in again" });
    return false;
  }

  if (providedToken !== activeAdminToken) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }

  return true;
};

// -----------------------------------
// ACTIVATE ONE STORE
// PUT /api/admin/activate
// -----------------------------------
const activateStore = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const { email } = req.body;

    const seller = await Seller.findOneAndUpdate(
      { email },
      { isActive: true },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json({ message: `${seller.businessName} store activated successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -----------------------------------
// DEACTIVATE ONE STORE
// PUT /api/admin/deactivate
// -----------------------------------
const deactivateStore = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const { email } = req.body;

    const seller = await Seller.findOneAndUpdate(
      { email },
      { isActive: false },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json({ message: `${seller.businessName} store deactivated successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -----------------------------------
// GET UNVERIFIED SELLERS (subaccount not yet verified by admin)
// GET /api/admin/unverified-sellers
// -----------------------------------
const getUnverifiedSellers = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const sellers = await Seller.find({ subaccountVerified: false }).select("-password");

    const formatted = sellers.map((seller) => ({
      businessName: seller.businessName,
      email: seller.email,
      slug: seller.slug,
      whatsappNumber: seller.whatsappNumber,
      paystackSubaccountCode: seller.paystackSubaccountCode,
      bankDetails: seller.bankDetails,
      joinedDate: seller.createdAt,
    }));

    res.json({ total: formatted.length, sellers: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -----------------------------------
// VERIFY SUBACCOUNT — unlocks Products/Categories for the seller
// PUT /api/admin/verify-subaccount
// -----------------------------------
const verifySubaccount = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const { email } = req.body;

    const seller = await Seller.findOneAndUpdate(
      { email },
      { subaccountVerified: true },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const { sendSubaccountVerifiedEmail } = require("../utils/mailer");
    sendSubaccountVerifiedEmail(seller.email, seller.businessName).catch((err) => {
      console.error("Verification email error:", err.message);
    });

    res.json({ message: `${seller.businessName} subaccount verified and unlocked` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivates Paystack subaccount when a seller account is deleted
const deactivateSubaccount = async (subaccountCode) => {
  try {
    const response = await fetch(
      `https://api.paystack.co/subaccount/${subaccountCode}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: false }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Paystack error ${response.status}: ${errorData.message || "Unknown error"}`
      );
    }

    console.log(`Subaccount deactivated: ${subaccountCode}`);
  } catch (err) {
    console.error("Subaccount deactivation failed:", err.message);
  }
};

// DELETE SELLER ACCOUNT
// DELETE /api/admin/delete-seller
const deleteSeller = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const { email } = req.body;

    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (seller.paystackSubaccountCode) {
      await deactivateSubaccount(seller.paystackSubaccountCode);
    }

    const conversations = await Conversation.find({ sellerId: seller._id });
    const conversationIds = conversations.map((c) => c._id);

    await Message.deleteMany({ conversationId: { $in: conversationIds } });
    await Conversation.deleteMany({ sellerId: seller._id });

    await Product.deleteMany({ sellerId: seller._id });
    await Category.deleteMany({ sellerId: seller._id });
    await seller.deleteOne();

    res.json({ message: "Seller account and all data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL SELLERS
// GET /api/admin/sellers
const getAllSellers = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const sellers = await Seller.find().select("-password");

      const formatted = sellers.map((seller) => ({
      businessName: seller.businessName,
      email: seller.email,
      isActive: seller.isActive,
      slug: seller.slug,
      whatsappNumber: seller.whatsappNumber,
      phoneNumber: seller.phoneNumber,
      howHeardAboutUs: seller.howHeardAboutUs,
      howHeardAboutUsOther: seller.howHeardAboutUsOther,
      referralCode: seller.referralCode,
      commissionBalance: seller.commissionBalance,
      totalEarned: seller.totalEarned,
      totalPaid: seller.totalPaid,
      bankDetails: seller.bankDetails,
      joinedDate: seller.createdAt,
    }));

    res.json({
      total: sellers.length,
      sellers: formatted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark referral commission as paid
const markCommissionPaid = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const { email } = req.body;

    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    if (seller.commissionBalance === 0) {
      return res
        .status(400)
        .json({ message: "No pending commission for this seller" });
    }

    const amountPaid = seller.commissionBalance;

    seller.totalPaid = seller.totalPaid + seller.commissionBalance;
    seller.commissionBalance = 0;
    await seller.save();

    const { sendCommissionPaidEmail } = require("../utils/mailer");
    sendCommissionPaidEmail(seller.email, seller.businessName, amountPaid).catch((err) => {
      console.error("Commission paid email error:", err.message);
    });

    res.json({
      message: `Commission marked as paid for ${seller.businessName}`,
      totalPaid: seller.totalPaid,
      pendingBalance: seller.commissionBalance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all referral relationships
const getAllReferrals = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const referredSellers = await Seller.find({
      referredBy: { $ne: null },
    }).select("-password");

    const referrals = await Promise.all(
      referredSellers.map(async (referred) => {
        const referrer = await Seller.findOne({
          referralCode: referred.referredBy,
        }).select("businessName email commissionBalance totalEarned totalPaid");

        return {
          referrer: referrer ? referrer.businessName : "Unknown",
          referrerEmail: referrer ? referrer.email : "Unknown",
          referrerCommissionBalance: referrer ? referrer.commissionBalance : 0,
          referredSeller: referred.businessName,
          referredEmail: referred.email,
          referralCode: referred.referredBy,
          joinedDate: referred.createdAt,
        };
      })
    );

    res.json({
      total: referrals.length,
      referrals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adminLogin = async (req, res) => {
  const { passkey } = req.body;

  if (!passkey || passkey !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ message: "Incorrect passkey" });
  }

  activeAdminToken = crypto.randomBytes(32).toString("hex");
  adminTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  res.json({ success: true, token: activeAdminToken });
};

const adminLogout = async (req, res) => {
  activeAdminToken = null;
  adminTokenExpires = null;
  res.json({ message: "Logged out" });
};

const getReportedConversations = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const reportedConversations = await Conversation.find({ isReported: true })
      .populate("sellerId", "businessName slug email whatsappNumber isActive")
      .populate("productIds", "name")
      .sort({ updatedAt: -1 });

    res.json({ reports: reportedConversations });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const exportConversationPdf = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId).populate(
      "sellerId",
      "businessName slug email whatsappNumber"
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversationId }).sort({
      createdAt: 1,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=conversation-${conversationId}.pdf`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(16).text("MoonStore — Conversation Export", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Seller: ${conversation.sellerId?.businessName || "Unknown"}`);
    doc.text(`Store: /${conversation.sellerId?.slug || "—"}`);
    doc.text(`Buyer name: ${conversation.buyerName || "—"}`);
    doc.text(`Buyer email: ${conversation.buyerEmail || "—"}`);
    doc.text(`Buyer phone: ${conversation.buyerPhone || "—"}`);
    doc.text(
      `Delivery: ${conversation.deliveryAddress || "—"}, ${conversation.deliveryCity || "—"}`
    );
    doc.text(`Amount: NGN ${conversation.amount?.toLocaleString() || 0}`);
    doc.text(`Report reason: ${conversation.reportReason || "Not specified"}`);
    doc.moveDown();

    doc.fontSize(13).text("Message History", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10);
    messages.forEach((msg) => {
      const time = new Date(msg.createdAt).toLocaleString("en-NG");
      const sender =
        msg.sender === "buyer"
          ? "Buyer"
          : msg.sender === "seller"
          ? "Seller"
          : "System";
      const cleanContent = msg.content.replace(
        /\[img\].*?\[\/img\]/gs,
        "[Image attached]"
      );
      doc.text(`[${time}] ${sender}: ${cleanContent}`);
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getRevenueSummary = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const summary = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          totalFee: { $sum: "$platformFee" },
          count: { $sum: 1 },
        },
      },
    ]);

    let gmv = 0;
    let transactionFeeRevenue = 0;
    let orderCount = 0;

    summary.forEach((group) => {
      if (group._id === "order") {
        gmv = group.totalAmount;
        transactionFeeRevenue = group.totalFee;
        orderCount = group.count;
      }
    });

    res.json({
      gmv,
      transactionFeeRevenue,
      totalRevenue: transactionFeeRevenue,
      orderCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getExitSurveys = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const exitSurveys = await ExitSurvey.find({}).sort({ createdAt: -1 });

    res.json({ exitSurveys });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  activateStore,
  deactivateStore,
  getReportedConversations,
  adminLogin,
  adminLogout,
  verifyAdmin,
  deleteSeller,
  getAllSellers,
  markCommissionPaid,
  getAllReferrals,
  exportConversationPdf,
  getRevenueSummary,
  getExitSurveys,
  getUnverifiedSellers,
  verifySubaccount,
};