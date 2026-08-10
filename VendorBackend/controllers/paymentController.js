const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = process.env.PAYSTACK_BASE_KEY;

// Creates subaccounts for every seller on Paystack with a 4% split charge
const createSubaccount = async (businessName, accountNumber, bankCode) => {
  try {
    const response = await fetch(`${PAYSTACK_BASE}/subaccount`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: `MoonStore - ${businessName}`,
        settlement_bank: bankCode,
        account_number: accountNumber,
        percentage_charge: 4, // 4% platform fee taken from seller share
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return { error: data.message || "Subaccount creation failed" };
    }

    return { subaccountCode: data.data.subaccount_code };
  } catch (err) {
    return { error: "Subaccount creation failed" };
  }
};

// Extracts bank directory list from Paystack for dropdowns
const getBanks = async (req, res) => {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE}/bank?country=nigeria&use_cursor=false&perPage=100`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const data = await response.json();

    if (!data.status) {
      console.error("Paystack banks error:", data);
      return res.status(400).json({ message: "Could not fetch banks" });
    }

    const banks = data.data.map((bank) => ({
      name: bank.name,
      code: bank.code,
    }));

    res.json({ banks });
  } catch (err) {
    console.error("getBanks error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Verifies bank account numbers against selected bank codes
const verifyAccount = async (req, res) => {
  const { accountNumber, bankCode } = req.body;

  if (!accountNumber || !bankCode) {
    return res
      .status(400)
      .json({ message: "Account number and bank code are required" });
  }

  try {
    const response = await fetch(
      `${PAYSTACK_BASE}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const data = await response.json();

    if (!data.status) {
      return res
        .status(400)
        .json({ message: "Account not found. Check the number and bank." });
    }

    res.json({ accountName: data.data.account_name });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Webhook listener called by Paystack upon successful charge completion
const paystackWebhook = async (req, res) => {
  const crypto = require("crypto");
  const secret = process.env.PAYSTACK_SECRET_KEY;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.rawBody)
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const { metadata } = event.data;
    const conversationId = metadata?.conversationId;

    // ── Order payment handling ──
    if (conversationId) {
      try {
        const Conversation = require("../models/Conversation");
        const Message = require("../models/Message");
        const Product = require("../models/Product");
        const Seller = require("../models/Seller");
        const { getIO } = require("../utils/socket");

        const conversation = await Conversation.findById(conversationId);

        if (conversation && conversation.status !== "paid") {
          conversation.status = "paid";
          conversation.paidAt = new Date();
          // conversation.amount stays as the REAL price — never overwrite it
          // with event.data.amount, which is the grossed-up buyer charge
          await conversation.save();

          const Transaction = require("../models/Transaction");
          await Transaction.create({
            sellerId: conversation.sellerId,
            type: "order",
            amount: metadata.realPrice,
            platformFee: metadata.platformFeeAmount,
            reference: event.data.reference,
            productIds: conversation.productIds,
            buyerEmail: conversation.buyerEmail,
            buyerSessionId: conversation.buyerSessionId,
          });

          // ── Referral commission check ──
          // If this seller was referred and hasn't triggered commission yet,
          // check whether their cumulative real sales just crossed ₦500,000
          try {
            const Referral = require("../models/Referral");
            const pendingReferral = await Referral.findOne({
              referredSellerId: conversation.sellerId,
              status: "pending",
            });

            if (pendingReferral) {
              const salesAggregate = await Transaction.aggregate([
                { $match: { sellerId: conversation.sellerId, type: "order" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
              ]);

              const cumulativeSales = salesAggregate[0]?.total || 0;

              if (cumulativeSales >= 500000) {
                const referrer = await Seller.findById(pendingReferral.referrerId);
                if (referrer) {
                  referrer.commissionBalance += pendingReferral.commissionAmount;
                  referrer.totalEarned += pendingReferral.commissionAmount;
                  await referrer.save();
                }

                pendingReferral.status = "earned";
                pendingReferral.paidAt = new Date();
                await pendingReferral.save();
              }
            }
          } catch (err) {
            console.error("Referral commission check failed:", err.message);
          }

          const seller = await Seller.findById(conversation.sellerId);
          const products = await Product.find({
            _id: { $in: conversation.productIds },
          });

          const productLinks = products
            .map((p) => `[product]${seller.slug}/${p.slug}|${p.name}[/product]`)
            .join(", ");

          await Message.create({
            conversationId: conversation._id,
            sender: "system",
            content: `✅ Thank you for your order! Payment is confirmed. Once you receive ${productLinks}, come back to this chat and tap this product link to leave a review. Note that this conversation will be deleted in 7 days.`,
          });

          try {
            getIO()
              .to(conversationId.toString())
              .emit("conversation_paid", {
                conversationId,
              });
          } catch (err) {
            console.error("Socket emit error:", err.message);
          }
        }
      } catch (err) {
        console.error("Webhook order update failed:", err.message);
      }
    }
  }

  return res.sendStatus(200);
};

module.exports = {
  getBanks,
  verifyAccount,
  paystackWebhook,
  createSubaccount,
};