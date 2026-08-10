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

// REQUEST SIGNUP CONFIRMATION — step 1 complete, hash password, email a signed link
// POST /api/auth/request-signup-confirmation
const requestSignupConfirmation = async (req, res) => {
  try {
    const { businessName, email, password, whatsappNumber, referredBy } = req.body;

    if (!businessName || !email || !password || !whatsappNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const signupToken = jwt.sign(
      {
        businessName,
        email,
        hashedPassword,
        whatsappNumber,
        referredBy: referredBy || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    const { sendSignupConfirmationEmail } = require("../utils/mailer");
    sendSignupConfirmationEmail(email, businessName, signupToken).catch((err) => {
      console.error("Signup confirmation email error:", err.message);
    });

    res.status(200).json({ message: "Confirmation email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY SIGNUP TOKEN — confirms the emailed link, returns step 1 data
// GET /api/auth/verify-signup-token?token=xyz
const verifySignupToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Missing token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "This link is invalid or has expired" });
    }

    // Confirm the email still isn't registered (in case they verified twice, or
    // registered through another tab while this link was open)
    const existingSeller = await Seller.findOne({ email: decoded.email });
    if (existingSeller) {
      return res.status(400).json({ message: "Email already registered" });
    }

    res.status(200).json({
      businessName: decoded.businessName,
      email: decoded.email,
      hashedPassword: decoded.hashedPassword,
      whatsappNumber: decoded.whatsappNumber,
      referredBy: decoded.referredBy,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REGISTER SELLER — final step, password already hashed at step 1
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
      hashedPassword,
      whatsappNumber,
      referredBy,
      bankDetails,
    } = req.body;

    if (!hashedPassword) {
      return res.status(400).json({
        message: "Email confirmation is required before completing registration.",
      });
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.bankCode) {
      return res.status(400).json({
        message:
          "Registration failed. You must provide a valid bank account number and select a bank.",
      });
    }

    // Confirm the account actually resolves on Paystack before creating anything
    const resolveResponse = await fetch(
      `${process.env.PAYSTACK_BASE_KEY}/bank/resolve?account_number=${bankDetails.accountNumber}&bank_code=${bankDetails.bankCode}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );
    const resolveData = await resolveResponse.json();

    if (!resolveData.status) {
      return res.status(400).json({
        message: "Bank account could not be verified. Check the account number and bank.",
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
      bankDetails: {
        ...bankDetails,
        accountName: resolveData.data.account_name,
      },
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
        resolveData.data.account_name,
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
          // No commission paid yet — this just records the relationship.
          // Commission is only paid once the referred seller reaches
          // ₦500,000 in cumulative real sales (see paystackWebhook).
          await Referral.create({
            referrerId: referrer._id,
            referredSellerId: seller._id,
            referralCode: validReferredBy,
            status: "pending",
            commissionAmount: 3000,
          });
        }
      } catch (err) {
        console.error("Referral record error:", err.message);
      }
    } 

    const token = jwt.sign({ id: seller._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      message: "Seller registered successfully",
      token,
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email,
        slug: seller.slug,
        isActive: seller.isActive,
        subaccountVerified: seller.subaccountVerified,
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
        subaccountVerified: seller.subaccountVerified,
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
  requestSignupConfirmation,
  verifySignupToken,
  registerSeller,
  loginSeller,
  resetPassword,
  forgotPassword,
};