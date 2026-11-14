const Seller = require("../models/Seller");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const PDFDocument = require("pdfkit");
const Product = require("../models/Product");
const Category = require("../models/Category");
const ExitSurvey = require("../models/ExitSurvey");

const Transaction = require("../models/Transaction");
const crypto = require("crypto");

const { getFullAmountMinor, releaseFunds, refundFunds } = require("../utils/escrowActions");
const { restoreStockOnRefund } = require("../utils/restoreStockOnRefund");
const { getIO } = require("../utils/socket");
const { sendSms } = require("../utils/termii");
const { applyDisputeOutcome } = require("../utils/strikes");


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
      {
        isActive: true,
        reactivatedAt: new Date(),
        deactivatedAt: null,
        inactivityWarningSent: false,
      },
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



// DELETE SELLER ACCOUNT
const deleteSeller = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return;

    const { email } = req.body;

    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const activeEscrowCount = await Conversation.countDocuments({
      sellerId: seller._id,
      escrowStatus: { $in: ["held", "disputed"] },
    });

    if (activeEscrowCount > 0) {
      return res.status(400).json({
        message: `${activeEscrowCount} order(s) still have money held in escrow. Resolve them before deleting this seller.`,
      });
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


// GET /api/admin/disputes
const getDisputedConversations = async (req, res) => {
    try {
        if (!verifyAdmin(req, res)) return;

        const disputes = await Conversation.find({ escrowStatus: "disputed" })
            .populate("sellerId", "businessName slug email whatsappNumber")
            .sort({ "dispute.raisedAt": -1 });

        res.json({ disputes });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/disputes/:conversationId
const getDisputeDetail = async (req, res) => {
    try {
        if (!verifyAdmin(req, res)) return;

        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId)
            .populate("sellerId", "businessName slug email whatsappNumber");

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

        res.json({ conversation, messages });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/admin/disputes/:conversationId/message
const sendAdminMessage = async (req, res) => {
    try {
        if (!verifyAdmin(req, res)) return;

        const { conversationId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const message = await Message.create({
            conversationId,
            sender: "admin",
            content: content.trim(),
        });

        conversation.lastMessage = content.trim();
        await conversation.save();

        try {
            getIO().to(conversationId).emit("new_message", message);
        } catch (err) {
            console.error("Socket emit error:", err.message);
        }

        res.status(201).json({ message });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/admin/disputes/:conversationId/resolve
// body: { resolution: "seller" | "buyer" | "split", splitSellerPercent? }
const resolveDispute = async (req, res) => {
    try {
        if (!verifyAdmin(req, res)) return;

        const { conversationId } = req.params;
        const { resolution, splitSellerPercent, splitSellerAmount, note } = req.body;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // a split can be retried for its second half after the first half's webhook has already moved the order on
        const isOpenDispute = conversation.escrowStatus === "disputed";
        const isSplitRetry =
            resolution === "split" &&
            conversation.escrowStatus === "released" &&
            !!conversation.dispute.raisedAt &&
            !conversation.dispute.resolvedAt &&
            !conversation.refundId;

        if (!isOpenDispute && !isSplitRetry) {
            return res.status(400).json({ message: "This order is not under dispute" });
        }

        const totalMinor = getFullAmountMinor(conversation);
        const cleanNote = typeof note === "string" ? note.trim().slice(0, 500) : "";

        let outcome = "";
        let decisionText = "";

        if (resolution === "seller") {
            const result = await releaseFunds(conversation, totalMinor, "Dispute resolved in seller's favor by admin");

            if (!result.ok) {
                return res.status(result.skipped ? 400 : 500).json({
                    message: result.skipped ? "A release is already in progress for this order" : "Release failed",
                    detail: result.detail,
                });
            }

            conversation.dispute.resolution = "released_to_seller";
            outcome = "released_to_seller";
            decisionText = "The payment is being released to the seller.";

        } else if (resolution === "buyer") {
            const result = await refundFunds(conversation, totalMinor, "Dispute resolved in buyer's favor by admin");

            if (!result.ok) {
                return res.status(result.skipped ? 400 : 500).json({
                    message: result.skipped ? "A refund is already in progress for this order" : "Refund failed",
                    detail: result.detail,
                });
            }

            conversation.dispute.resolution = "refunded_to_buyer";
            outcome = "refunded_to_buyer";
            decisionText = "The buyer is being refunded.";

        } else if (resolution === "split") {
            // the admin can split by a naira amount for the seller, or by a percentage
            let sellerAmountMinor = 0;

            if (splitSellerAmount !== undefined && splitSellerAmount !== null && splitSellerAmount !== "") {
                const sellerNaira = Number(splitSellerAmount);

                if (!Number.isInteger(sellerNaira) || sellerNaira <= 0 || sellerNaira * 100 >= totalMinor) {
                    return res.status(400).json({ message: "The seller's amount must be a whole number below the order total" });
                }

                sellerAmountMinor = sellerNaira * 100;
            } else {
                const sellerPercent = Number(splitSellerPercent);

                if (!sellerPercent || sellerPercent <= 0 || sellerPercent >= 100) {
                    return res.status(400).json({ message: "Invalid split percentage" });
                }

                sellerAmountMinor = Math.round((totalMinor * sellerPercent) / 100);
            }

            const buyerAmountMinor = totalMinor - sellerAmountMinor;

            if (sellerAmountMinor <= 0 || buyerAmountMinor <= 0) {
                return res.status(400).json({ message: "Both sides must receive something in a split" });
            }

            if (!conversation.releaseId) {
                const releaseResult = await releaseFunds(
                    conversation,
                    sellerAmountMinor,
                    "Dispute split resolution: seller's share"
                );

                if (!releaseResult.ok) {
                    return res.status(500).json({
                        message: "The seller's share could not be released. Nothing was sent. Try again.",
                        detail: releaseResult.detail,
                    });
                }
            }

            if (!conversation.refundId) {
                const refundResult = await refundFunds(
                    conversation,
                    buyerAmountMinor,
                    "Dispute split resolution: buyer's share"
                );

                if (!refundResult.ok) {
                    return res.status(500).json({
                        message: "The seller's share was released, but the buyer's refund failed. Click Split again to retry only the refund.",
                        detail: refundResult.detail,
                    });
                }
            }

            const sellerNairaText = (sellerAmountMinor / 100).toLocaleString("en-NG");
            const buyerNairaText = (buyerAmountMinor / 100).toLocaleString("en-NG");

            conversation.dispute.resolution = "released_to_seller";
            conversation.dispute.resolutionNotes = `Split: ₦${sellerNairaText} seller / ₦${buyerNairaText} buyer`;
            outcome = "split";
            decisionText = `The payment is split: ₦${sellerNairaText} to the seller and ₦${buyerNairaText} to the buyer.`;

        } else {
            return res.status(400).json({ message: "Invalid resolution type" });
        }

        // everything below happens once per dispute, even if the admin clicks again to retry a failed half
        const firstTime = !conversation.dispute.resolvedAt;

        if (firstTime) {
            // statistics only
            if (conversation.dispute.raisedBy === "buyer") {
                const seller = await Seller.findById(conversation.sellerId);
                if (seller) {
                    seller.disputesAgainst = (seller.disputesAgainst || 0) + 1;
                    await seller.save();
                }

                const buyer = conversation.buyerEmail
                    ? await Buyer.findOne({ email: conversation.buyerEmail.toLowerCase().trim() })
                    : null;
                if (buyer) {
                    buyer.disputesRaised = (buyer.disputesRaised || 0) + 1;
                    await buyer.save();
                }
            }

            // strikes: warnings and blocks
            await applyDisputeOutcome(conversation, outcome);

            conversation.dispute.resolvedAt = new Date();
        }

        if (cleanNote) {
            conversation.dispute.resolutionNotes = conversation.dispute.resolutionNotes
                ? `${conversation.dispute.resolutionNotes} | ${cleanNote}`
                : cleanNote;
        }

        await conversation.save();

        if (firstTime) {
            await Message.create({
                conversationId: conversation._id,
                sender: "system",
                content: `This dispute has been resolved by MoonStore support. ${decisionText}${cleanNote ? ` Note from support: ${cleanNote}` : ""}`,
            });
        }

        res.json({ message: "Dispute resolved" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const notifyDisputeParties = async (req, res) => {
    try {
        if (!verifyAdmin(req, res)) return;
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId).populate(
            "sellerId",
            "businessName email slug phoneNumber whatsappNumber"
        );
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        if (conversation.escrowStatus !== "disputed") {
            return res.status(400).json({ message: "This order is not under dispute" });
        }

        const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        conversation.dispute.notifiedAt = new Date();
        conversation.dispute.responseDeadline = deadline;
        await conversation.save();

        await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: `MoonStore support is reviewing this dispute. Please reply in this chat before ${deadline.toLocaleString("en-NG")} so our team has everything it needs.`,
        });

        const { sendDisputeNotificationEmail } = require("../utils/mailer");
        const chatLink = `${process.env.FRONTEND_URL}/${conversation.sellerId.slug}/chat/${conversation._id}`;

        if (conversation.buyerEmail) {
            sendDisputeNotificationEmail(conversation.buyerEmail, conversation.buyerName || "there", chatLink, deadline)
                .catch((err) => console.error("Dispute email (buyer) error:", err.message));
        }
        sendDisputeNotificationEmail(conversation.sellerId.email, conversation.sellerId.businessName, chatLink, deadline)
            .catch((err) => console.error("Dispute email (seller) error:", err.message));

        const buyerPhone = conversation.buyerPhone || conversation.deliveryPhone;
        if (buyerPhone) {
            sendSms({
                to: buyerPhone,
                message: `MoonStore: Support needs your input on a disputed order. Check your order chat before ${deadline.toLocaleString("en-NG")}.`,
            }).catch((err) => console.error("Buyer SMS error:", err.message));
        }

        const sellerPhone = conversation.sellerId.phoneNumber || conversation.sellerId.whatsappNumber;
        if (sellerPhone) {
            sendSms({
                to: sellerPhone,
                message: `MoonStore: Support needs your input on a disputed order. Check your order chat before ${deadline.toLocaleString("en-NG")}.`,
            }).catch((err) => console.error("Seller SMS error:", err.message));
        }

        res.json({ message: "Both parties notified", deadline });
    } catch (err) {
        res.status(500).json({ message: err.message });
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
  exportConversationPdf,
  getRevenueSummary,
  getExitSurveys,
  getDisputedConversations,
  getDisputeDetail,
  sendAdminMessage,
  resolveDispute,
  notifyDisputeParties,
};