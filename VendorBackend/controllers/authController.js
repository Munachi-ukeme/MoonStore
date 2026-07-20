// register and login work 

const { validationResult } = require("express-validator")
const Seller = require("../models/Seller");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createSubaccount } = require("../controllers/paymentController");
const Referral = require("../models/Referral");

//helper function - convert business name to slug
// "Chinwe Fashion" -> "chinwe-fashion"
const generateSlug = (businessName) =>{
    return businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "") // remove special characters
    .replace(/\s+/g, "-") //replace with hyphens
}

// helper - generate random 6 digit referral code
const generateReferralCode = () =>{
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// REGISTER SELLER
// POST /api/auth/register

const registerSeller = async(req, res) =>{
    try{

        
  // check for validation errors
const errors = validationResult(req)
if (!errors.isEmpty()) {
  return res.status(400).json({ message: errors.array()[0].msg })
}

        const {businessName, email, password, whatsappNumber, referredBy, bankDetails } = req.body

        //check if seller input their bank details
        if (!bankDetails || !bankDetails.accountNumber || !bankDetails.bankCode) {
         // Stop right here and tell the user what they did wrong
         return res.status(400).json({ 
        message: "Registration failed. You must provide a valid bank account number and select a bank." 
          });
            }

        //1. Check if email already exists
        const existingSeller = await Seller.findOne({email})
        if (existingSeller) {
            return res.status(400).json({message: "Email already registered"})
        }

       // 2. generate slug from business name
let baseSlug = generateSlug(businessName);
let slug = baseSlug;

// 3. check if slug already exists - keep trying random suffixes until unique
let existingSlug = await Seller.findOne({ slug });

while (existingSlug) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number, 1000-9999
    slug = `${baseSlug}-${randomSuffix}`;
    existingSlug = await Seller.findOne({ slug });
}

    //4. Hash the password before saving
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 5. generate unique referral code for this new seller
    let referralCode = generateReferralCode()

    //  make sure the code does not already exist
    const existingCode = await Seller.findOne({ referralCode})
    if(existingCode){
      //generate a new one
      referralCode = generateReferralCode()
    }

    // 6. check if referredBy code is valid
    let validReferredBy = null
    if (referredBy){
      const referrer = await Seller.findOne({ referralCode: referredBy})
      if(referrer){
        validReferredBy = referredBy
      }
      //if code does not exist, ignore it. dont block registration because of a wrong referral code
    }


    // 7. Create new seller
    const trialEnd = new Date();
trialEnd.setDate(trialEnd.getDate() + 7);
    const seller = await Seller.create({
      businessName,
      email,
      password: hashedPassword,
      whatsappNumber,
      slug,
      plan: "basic",
      bankDetails,
      referralCode,
      referredBy: validReferredBy,
      isActive: true,
      trialEnd,
    })

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

    // Handle referral commission if seller was referred
    if(validReferredBy) {
      try{
        const referrer = await Seller.findOne({ referralCode: validReferredBy});
        if(referrer){
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
      }catch (err) {
        // referral failure must never block registration
        console.error("Referral commission error:", err.message);
    }
    }

    // 8. Generate JWT token
    const token = jwt.sign(
      { id: seller._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" } // token expires in 30 days
    )

     // 9. Return seller data and token
    res.status(201).json({
      message: "Seller registered successfully",
      token,
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email,
        slug: seller.slug,
        plan: seller.plan,
        isActive: seller.isActive,
        trialEnd: seller.trialEnd,
        subscriptionEnd: seller.subscriptionEnd,
        referralCode: seller.referralCode,
        referredBy: seller.referredBy,
        commissionBalance: seller.commissionBalance,
        totalEarned: seller.totalEarned,
        totalPaid: seller.totalPaid,
        bankDetails: seller.bankDetails,
      },
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


// LOGIN SELLER
// POST /api/auth/login

// check for validation errors

const loginSeller = async (req, res) => {
  try {

     const errors = validationResult(req)
if (!errors.isEmpty()) {
  return res.status(400).json({ message: errors.array()[0].msg })
}

    const { email, password } = req.body

    // 1. Check if seller exists
    const seller = await Seller.findOne({ email })
    if (!seller) {
      return res.status(400).json({ error: "Invalid email or password" })
    }

    // 2. Compare password with hashed password in database
    const isMatch = await bcrypt.compare(password, seller.password)
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" })
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: seller._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    )

    // 4. Return seller data and token
    res.json({
      message: "Login successful",
      token,
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email,
        slug: seller.slug,
        plan: seller.plan,
        isActive: seller.isActive,
        tagline: seller.tagline,
        whatsappNumber:seller.whatsappNumber,
        phoneNumber: seller.phoneNumber,
        address: seller.address,
        logo: seller.logo,
        bannerImage: seller.bannerImage,
        trialEnd: seller.trialEnd,
        subscriptionEnd: seller.subscriptionEnd,
        referralCode: seller.referralCode,        
        commissionBalance: seller.commissionBalance,
        totalEarned: seller.totalEarned,
        totalPaid: seller.totalPaid,
        bankDetails: seller.bankDetails,
      },
    })

} catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const crypto = require("crypto");

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const seller = await Seller.findOne({ email });

        // Always respond the same way, whether seller exists or not —
        // this prevents someone from using this form to check which emails are registered
        if (!seller) {
            return res.status(200).json({ message: "If that email exists, a reset link has been sent" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        seller.resetPasswordToken = resetToken;
        seller.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 5 minutes from now
        await seller.save();

        const { sendPasswordResetEmail } = require("../utils/mailer");
        sendPasswordResetEmail(seller.email, seller.businessName, resetToken)
            .catch((err) => console.error("Reset email error:", err.message));

        res.status(200).json({ message: "If that email exists, a reset link has been sent" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


const bcrypt = require("bcrypt");

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const seller = await Seller.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }, // $gt = "greater than" — must not be expired yet
        });

        if (!seller) {
            return res.status(400).json({ message: "Reset link is invalid or has expired" });
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

module.exports = { registerSeller, loginSeller, resetPassword, forgotPassword}