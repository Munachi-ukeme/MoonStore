const Seller = require("../models/Seller");
const Product = require("../models/Product");
const Category = require("../models/Category");
const ExitSurvey = require("../models/ExitSurvey");
const bcrypt = require("bcryptjs");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { createPayoutAccount } = require("../utils/escrowpay");

// CHANGE PASSWORD
// PUT /api/seller/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // 1. Find seller
    const seller = await Seller.findById(req.seller._id)

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, seller.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ message: "This is the current password, change it" })
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10)
    seller.password = await bcrypt.hash(newPassword, salt)

    // 4. Save
    await seller.save()

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}



// -----------------------------------
// DELETE SELLER ACCOUNT
const deleteSeller = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: "Please provide a reason of at least 10 characters." });
    }

    const seller = await Seller.findById(req.seller._id);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const activeEscrowCount = await Conversation.countDocuments({
      sellerId: seller._id,
      escrowStatus: { $in: ["held", "disputed"] },
    });

    if (activeEscrowCount > 0) {
      return res.status(400).json({
        error: `You still have ${activeEscrowCount} order(s) with money held in escrow. Please wait until they are completed before deleting your account.`,
      });
    }

    await ExitSurvey.create({
      businessName: seller.businessName,
      email: seller.email,
      whatsappNumber: seller.whatsappNumber,
      slug: seller.slug,
      reason: reason.trim(),
    });

    const conversations = await Conversation.find({ sellerId: seller._id });
    const conversationIds = conversations.map((c) => c._id);

    await Message.deleteMany({ conversationId: { $in: conversationIds } });
    await Conversation.deleteMany({ sellerId: seller._id });

    await Product.deleteMany({ sellerId: seller._id });
    await Category.deleteMany({ sellerId: seller._id });
    await seller.deleteOne();

    res.json({ message: "Account and all data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET CURRENT SELLER — returns fresh seller data from the database
// GET /api/seller/me
// Protected — seller must be logged in
const getMe = async (req, res) => {
  try {
    // req.seller is already the full seller doc (minus password),
    // freshly fetched from the DB by the protect middleware on this request
    res.json({ seller: req.seller })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const MAX_DELIVERY_OPTIONS = 10;

const updateDeliveryOptions = async (req, res) => {
    try {
        const { options } = req.body;

        if (!Array.isArray(options) || options.length === 0) {
            return res.status(400).json({ message: "Add at least one delivery option" });
        }

        if (options.length > MAX_DELIVERY_OPTIONS) {
            return res.status(400).json({ message: `You can add up to ${MAX_DELIVERY_OPTIONS} delivery options` });
        }

        const cleaned = [];
        const seenLabels = new Set();

        for (const option of options) {
            const label = typeof option.label === "string" ? option.label.trim() : "";
            const price = option.price;
            const estimatedDays = option.estimatedDays;

            if (!label || label.length > 40) {
                return res.status(400).json({ message: "Each delivery option needs a name of up to 40 characters" });
            }

            if (typeof price !== "number" || !Number.isInteger(price) || price < 0 || price > 1000000) {
                return res.status(400).json({ message: `Enter a valid price for "${label}"` });
            }

            if (typeof estimatedDays !== "number" || !Number.isInteger(estimatedDays) || estimatedDays < 1 || estimatedDays > 60) {
                return res.status(400).json({ message: `Delivery days for "${label}" must be a whole number from 1 to 60` });
            }

            const key = label.toLowerCase();
            if (seenLabels.has(key)) {
                return res.status(400).json({ message: `"${label}" is listed more than once` });
            }
            seenLabels.add(key);

            cleaned.push({ label, price, estimatedDays });
        }

        const seller = await Seller.findByIdAndUpdate(
            req.seller._id,
            { deliveryOptions: cleaned },
            { new: true }
        ).select("-password");

        res.json({ seller });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const retryPayoutSetup = async (req, res) => {
    try {
        const seller = await Seller.findById(req.seller._id);

        if (!seller) {
            return res.status(404).json({ message: "Seller not found" });
        }

        if (seller.onboardingStatus === "completed") {
            return res.status(400).json({ message: "Your payout setup is already complete" });
        }

        if (!seller.escrowPayMerchantRef) {
            return res.status(400).json({
                message: "Your identity verification was not completed. Please contact MoonStore support.",
            });
        }

        const bank = seller.bankDetails || {};
        if (!bank.accountNumber || !bank.bankCode) {
            return res.status(400).json({ message: "Your bank details are missing. Please contact MoonStore support." });
        }

        const payoutResult = await createPayoutAccount({
            ownerType: "party",
            ownerId: seller.escrowPayMerchantRef,
            bankCode: bank.bankCode,
            accountNumber: bank.accountNumber,
            isDefault: true,
        });
        const payoutData = payoutResult.data && payoutResult.data.data;

                if (
            !payoutResult.ok ||
            !payoutData ||
            !payoutData.id ||
            payoutData.status !== "verified" ||
            payoutData.payout_eligible !== true
        ) {
          console.error("Payout setup failed:", result.status, JSON.stringify(result.data));
            return res.status(500).json({
                message: "We couldn't set up your payout account right now. Please try again shortly.",
            });
        }

        seller.payoutAccountId = payoutData.id;
        seller.onboardingStatus = "completed";
        seller.subaccountVerified = true;
        await seller.save();

        res.json({ message: "Payout setup complete" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { deleteSeller, changePassword, getMe, updateDeliveryOptions, retryPayoutSetup }