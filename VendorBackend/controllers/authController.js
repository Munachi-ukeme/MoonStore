const { validationResult } = require("express-validator");
const Seller = require("../models/Seller");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { onboardParty, createPayoutAccount, resolveBankAccount } = require("../utils/escrowpay");
const { describeOnboardingError } = require("../utils/escrowErrors");
const { sendAdminAlertEmail } = require("../utils/mailer");

// Helper function: convert business name to URL slug ("Chinwe Fashion" -> "chinwe-fashion")
const generateSlug = (businessName) => {
  return businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");
};

// REQUEST SIGNUP CONFIRMATION — step 1 complete, hash password, email a signed link
// POST /api/auth/request-signup-confirmation
const requestSignupConfirmation = async (req, res) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { businessName, email, password, whatsappNumber, howHeardAboutUs, howHeardAboutUsOther } = req.body;

    if (typeof businessName !== "string" || typeof email !== "string" || typeof password !== "string" || typeof whatsappNumber !== "string") {
            return res.status(400).json({ message: "Invalid details" });
        }
        

   if (!businessName || !email || !password || !whatsappNumber || !howHeardAboutUs) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!whatsappNumber.startsWith("234")) {
      return res.status(400).json({
        message: "MoonStore is currently only available to sellers in Nigeria.",
      });
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
        howHeardAboutUs,
        howHeardAboutUsOther: howHeardAboutUsOther || "",
      },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
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
      howHeardAboutUs: decoded.howHeardAboutUs,
      howHeardAboutUsOther: decoded.howHeardAboutUsOther,
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

    const { signupToken, identifier, dateOfBirth, consent, bankDetails } = req.body;

    if (!signupToken) {
      return res.status(400).json({
        message: "Email confirmation is required before completing registration.",
      });
    }

    // everything about the seller comes from the signed token, never from the request body
    let decoded;
    try {
      decoded = jwt.verify(signupToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        message: "Your confirmation link is invalid or has expired. Please start signup again.",
      });
    }

    const { businessName, email, hashedPassword, whatsappNumber, howHeardAboutUs, howHeardAboutUsOther } = decoded;

    if (!businessName || !email || !hashedPassword || !whatsappNumber || !howHeardAboutUs) {
      return res.status(400).json({
        message: "Your confirmation link is invalid. Please start signup again.",
      });
    }

    if (!whatsappNumber.startsWith("234")) {
      return res.status(400).json({
        message: "MoonStore is currently only available to sellers in Nigeria.",
      });
    }

    if (typeof identifier !== "string" || !/^\d{11}$/.test(identifier.trim())) {
      return res.status(400).json({ message: "Enter your 11-digit NIN" });
    }

    if (
      typeof dateOfBirth !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
      new Date(dateOfBirth) > new Date()
    ) {
      return res.status(400).json({ message: "Enter a valid date of birth" });
    }

    if (consent !== true) {
      return res.status(400).json({ message: "You must agree to identity verification to continue" });
    }

    if (
      !bankDetails ||
      typeof bankDetails.accountNumber !== "string" ||
      !/^\d{10}$/.test(bankDetails.accountNumber) ||
      typeof bankDetails.bankCode !== "string" ||
      !bankDetails.bankCode.trim()
    ) {
      return res.status(400).json({
        message: "You must provide a valid bank account number and select a bank.",
      });
    }

    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // re-check the bank account on the server; the account name comes from EscrowPay, not the browser
    const resolved = await resolveBankAccount({
      bankCode: bankDetails.bankCode.trim(),
      accountNumber: bankDetails.accountNumber,
    });
    const resolvedData = resolved.data && resolved.data.data;

    if (!resolved.ok || !resolvedData || resolvedData.status !== "verified") {
      return res.status(400).json({
        message: "Bank account could not be verified. Check the account number and bank.",
      });
    }

    const sellerId = new mongoose.Types.ObjectId();

    const onboardResult = await onboardParty({
      type: "nin",
      identifier: identifier.trim(),
      dateOfBirth,
      consent: true,
      email,
      externalReference: sellerId.toString(),
    });

    if (!onboardResult.ok) {
      const failure = describeOnboardingError(onboardResult.data);

      if (failure.alertAdmin) {
        sendAdminAlertEmail(
          "EscrowPay verification could not run",
          "A seller verification failed because the EscrowPay wallet could not cover the verification fee. Please top up the wallet."
        ).catch((err) => console.error("Admin alert email error:", err.message));
      }

      return res.status(failure.status).json({ message: failure.message });
    }

    const partyData = onboardResult.data.data;

    if (
      !partyData ||
      !partyData.party ||
      !partyData.identity ||
      partyData.identity.verification_status !== "verified"
    ) {
      return res.status(422).json({
        message: "We couldn't verify your details. Please contact MoonStore support.",
      });
    }

    const partyId = partyData.party.id;

    let baseSlug = generateSlug(businessName);
    let slug = baseSlug;

    let existingSlug = await Seller.findOne({ slug });
    while (existingSlug) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      slug = `${baseSlug}-${randomSuffix}`;
      existingSlug = await Seller.findOne({ slug });
    }

    let seller;
    try {
      seller = await Seller.create({
        _id: sellerId,
        businessName,
        email,
        password: hashedPassword,
        whatsappNumber,
        howHeardAboutUs,
        howHeardAboutUsOther: howHeardAboutUsOther || "",
        slug,
        escrowPayMerchantRef: partyId,
        onboardingStatus: "pending",
        bankDetails: {
          accountNumber: bankDetails.accountNumber,
          bankCode: bankDetails.bankCode.trim(),
          bankName: typeof bankDetails.bankName === "string" ? bankDetails.bankName.slice(0, 80) : "",
          accountName: resolvedData.account_name,
        },
        isActive: true,
      });
    } catch (createErr) {
      console.error(
        `Seller creation failed AFTER identity verification. email=${email} partyId=${partyId}:`,
        createErr.message
      );
      return res.status(500).json({
        message: "Something went wrong while creating your store. Please contact MoonStore support. Your verification was successful.",
      });
    }

    // payout account: if this fails the seller stays "pending" and can retry from Settings
    let payoutDone = false;

    const payoutResult = await createPayoutAccount({
      ownerType: "party",
      ownerId: partyId,
      bankCode: seller.bankDetails.bankCode,
      accountNumber: seller.bankDetails.accountNumber,
      isDefault: true,
    });
    const payoutData = payoutResult.data && payoutResult.data.data;

     if (
      payoutResult.ok &&
      payoutData &&
      payoutData.id &&
      payoutData.status === "verified" &&
      payoutData.payout_eligible === true
    ) {
      seller.payoutAccountId = payoutData.id;
      seller.onboardingStatus = "completed";
      seller.subaccountVerified = true;
      await seller.save();
      payoutDone = true;
    }

    const token = jwt.sign({ id: seller._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      message: payoutDone
        ? "Seller registered successfully"
        : "Seller registered. Payout setup still needs to be finished from Settings.",
      token,
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email,
        slug: seller.slug,
        isActive: seller.isActive,
        bankDetails: seller.bankDetails,
        subaccountVerified: seller.subaccountVerified,
        onboardingStatus: seller.onboardingStatus,
        deliveryOptions: seller.deliveryOptions,
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
        bankDetails: seller.bankDetails,
        subaccountVerified: seller.subaccountVerified,
        onboardingStatus: seller.onboardingStatus,
        deliveryOptions: seller.deliveryOptions,
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
    if (typeof email !== "string") {
      return res.status(200).json({ message: "If that email exists, a reset link has been sent" });
    }
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

    if (typeof token !== "string" || typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "Reset link is invalid, or the password is shorter than 6 characters" });
    }

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