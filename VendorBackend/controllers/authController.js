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

        //2. generate slug from business name
        let slug = generateSlug(businessName)

        //3. check if slug already exists - add number if it does. e.g if chinwe-fashion already exists create chinwe-fashion-1

        const existingSlug = await Seller.findOne({ slug })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
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
    const seller = await Seller.create({
      businessName,
      email,
      password: hashedPassword,
      whatsappNumber,
      slug,
      plan: "basic", // defaults to basic if not specified
      bankDetails,
      referralCode,
      referredBy: validReferredBy
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
      return res.status(400).json({ message: "Invalid email or password" })
    }

    // 2. Compare password with hashed password in database
    const isMatch = await bcrypt.compare(password, seller.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" })
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
        referralCode: seller.referralCode,        
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

module.exports = { registerSeller, loginSeller }