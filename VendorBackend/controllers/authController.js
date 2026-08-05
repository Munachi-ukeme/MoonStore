const { validationResult } = require("express-validator");
const Seller = require("../models/Seller");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createSubaccount } = require("../controllers/paymentController");
const Referral = require("../models/Referral");
const crypto = require("crypto");

// Helper function: convert business name to URL slug ("Chinwe Fashion" -> "chinwe-fashion")
const generateSlug = (businessName) => {
  return businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");
};

// Helper function: generate random 6-digit referral code
const generateReferralCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// REGISTER SELLER
// POST /api/auth/register
const registerSeller = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const {
      businessName,
      email,
      password,
      whatsappNumber,
      referredBy,
      bankDetails,
    } = req.body;

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.bankCode) {
      return res.status(400).json({
        message:
          "Registration failed. You must provide a valid bank account number and select a bank.",
      });
    }

    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ message: "Email already registered" });
    }

    let baseSlug = generateSlug(businessName);
    let slug = baseSlug;

    let existingSlug = await Seller.findOne({ slug });
    while (existingSlug) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      slug = `${baseSlug}-${randomSuffix}`;
      existingSlug = await Seller.findOne({ slug });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let referralCode = generateReferralCode();
    const existingCode = await Seller.findOne({ referralCode });
    if (existingCode) {
      referralCode = generateReferralCode();
    }

    let validReferredBy = null;
    if (referredBy) {
      const referrer = await Seller.findOne({ referralCode: referredBy });
      if (referrer) {
        validReferredBy = referredBy;
      }
    }

    const seller = await Seller.create({
      businessName,
      email,
      password: hashedPassword,
      whatsappNumber,
      slug,
      bankDetails,
      referralCode,
      referredBy: validReferredBy,
      isActive: true,
    });

    if (
      seller.bankDetails &&
      seller.bankDetails.accountNumber &&
      seller.bankDetails.bankCode
    ) {
      const subResult = await createSubaccount(
        seller.businessName,
        seller.bankDetails.accountNumber,
        seller.bankDetails.bankCode
      );

      if (!subResult.error) {
        seller.paystackSubaccountCode = subResult.subaccountCode;
        await seller.save();
      }
    }

    if (validReferredBy) {
      try {
        const referrer = await Seller.findOne({ referralCode: validReferredBy });
        if (referrer) {
          referrer.commissionBalance += 3000;
          referrer.totalEarned += 3000;
          await referrer.save();

          await Referral.create({
            referrerId: referrer._id,
            referredSellerId: seller._id,
            referralCode: validReferredBy,
            status: "pending",
            commissionAmount: 3000,
          });
        }
      } catch (err) {
        console.error("Referral commission error:", err.message);
      }
    }

    const token = jwt.sign(
      { id: seller._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      message: "Seller registered successfully",
      token,
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email,
        slug: seller.slug,
        isActive: seller.isActive,
        referralCode: seller.referralCode,
        referredBy: seller.referredBy,
        commissionBalance: seller.commissionBalance,
        totalEarned: seller.totalEarned,
        totalPaid: seller.totalPaid,
        bankDetails: seller.bankDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN SELLER
// POST /api/auth/login
const loginSeller = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: seller._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Login successful",
      token,
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email,
        slug: seller.slug,
        isActive: seller.isActive,
        tagline: seller.tagline,
        whatsappNumber: seller.whatsappNumber,
        phoneNumber: seller.phoneNumber,
        address: seller.address,
        logo: seller.logo,
        bannerImage: seller.bannerImage,
        referralCode: seller.referralCode,
        commissionBalance: seller.commissionBalance,
        totalEarned: seller.totalEarned,
        totalPaid: seller.totalPaid,
        bankDetails: seller.bankDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const seller = await Seller.findOne({ email });

    if (!seller) {
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link has been sent" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    seller.resetPasswordToken = resetToken;
    seller.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await seller.save();

    const { sendPasswordResetEmail } = require("../utils/mailer");
    sendPasswordResetEmail(seller.email, seller.businessName, resetToken).catch(
      (err) => console.error("Reset email error:", err.message)
    );

    res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const seller = await Seller.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!seller) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    seller.password = hashedPassword;
    seller.resetPasswordToken = null;
    seller.resetPasswordExpires = null;
    await seller.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerSeller,
  loginSeller,
  resetPassword,
  forgotPassword,
};