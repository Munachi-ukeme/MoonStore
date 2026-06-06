const Seller = require("../models/Seller")
const Product = require("../models/Product")
const Category = require("../models/Category")
const bcrypt = require("bcryptjs")

// helper — verify admin secret key
const verifyAdmin = (req, res) => {
  const adminKey = req.headers["admin-key"]
  if (adminKey !== process.env.ADMIN_SECRET) {
    res.status(401).json({ message: "Unauthorized" })
    return false
  }
  return true
}

// -----------------------------------
// UPGRADE SELLER PLAN
// PUT /api/admin/upgrade
// -----------------------------------
const upgradePlan = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return

    const { email, plan } = req.body

    const seller = await Seller.findOneAndUpdate(
      { email },
      { plan },
     { new: true }
    )

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" })
    }

    res.json({
      message: `Plan upgraded to ${plan} successfully`,
      seller: {
        businessName: seller.businessName,
        email: seller.email,
        plan: seller.plan,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// ACTIVATE ONE STORE
// PUT /api/admin/activate
// -----------------------------------
const activateStore = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return

    const { email } = req.body

    const seller = await Seller.findOneAndUpdate(
      { email },
      { isActive: true },
      { new: true }
    )

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" })
    }

    res.json({ message: `${seller.businessName} store activated successfully` })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// DEACTIVATE ONE STORE
// PUT /api/admin/deactivate
// -----------------------------------
const deactivateStore = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return

    const { email } = req.body

    const seller = await Seller.findOneAndUpdate(
      { email },
      { isActive: false },
      { new: true }
    )

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" })
    }

    res.json({ message: `${seller.businessName} store deactivated successfully` })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// ACTIVATE ALL STORES
// PUT /api/admin/activate-all
// -----------------------------------
const activateAll = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return

    const result = await Seller.updateMany(
      { isActive: false },
      { isActive: true }
    )

    res.json({ message: `${result.modifiedCount} stores activated successfully` })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// DEACTIVATE ALL STORES
// PUT /api/admin/deactivate-all
// -----------------------------------
const deactivateAll = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return

    const result = await Seller.updateMany(
      { isActive: true },
      { isActive: false }
    )

    res.json({ message: `${result.modifiedCount} stores deactivated successfully` })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// deactivateSubaccount is a helper function — not a route handler.
// it lives in the same file and gets called from inside deleteSeller
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
            throw new Error(`Paystack error ${response.status}: ${errorData.message || "Unknown error"}`);
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

        // deactivate Paystack subaccount before deleting seller
        // we do this first while we still have the seller object
        if (seller.paystackSubaccountCode) {
            await deactivateSubaccount(seller.paystackSubaccountCode);
        }

        // delete all seller data
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
    if (!verifyAdmin(req, res)) return

    const sellers = await Seller.find().select("-password")

    //format response to show most useful fields clearly
    const formatted = sellers.map((seller) =>({
      businessName: seller.businessName,
      email: seller.email,
      plan: seller.plan,
      isActive: seller.isActive,
      slug: seller.slug,
      whatsappNumber: seller.whatsappNumber,
      phoneNumber: seller.phoneNumber,
      referralCode: seller.referralCode,
      commissionBalance: seller.commissionBalance,
      totalEarned: seller.totalEarned,
      totalPaid: seller.totalPaid,
      bankDetails: seller.bankDetails,
      subscriptionStart: seller.subscriptionStart,
      subscriptionEnd: seller.subscriptionEnd,
      joinedDate: seller.createdAt,      
    }))

    res.json({
      total: sellers.length,
      sellers: formatted,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// RESET SELLER PASSWORD
// PUT /api/admin/reset-password
const resetPassword = async (req, res) =>{
  try{
    if(!verifyAdmin(req, res)) return

    const { email, newPassword } = req.body

    //check if seller exists
    const seller = await Seller.findOne({ email })
    if (!seller) {
      return res.status(404).json({ message: "Seller not found"})
    }

    // hash the new password before saving
    // never store plain text passwords
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    //save the new hashed password
    seller.password = hashedPassword
    await seller.save()

    res.json({
      message: `Password reset successfully for ${seller.businessName}`,
    })
  } catch (error) {
    res.status(500).json({ message: error.message})
  }
}

//Mark commission as paid
const markCommissionPaid = async(req, res) =>{
  try{
    if(!verifyAdmin(req, res)) return

    const { email } = req.body

    const seller = await Seller.findOne({email})
    if(!seller){
      return res.status(404).json({ message: "Seller not found"})
    }

    // check if there is any pending commission
    if (seller.commissionBalance === 0){
      return res.status(400).json({ message: "No pending commission for this seller"})
    }

    // move commissionBalance into totalpaid - add up each time
    seller.totalPaid = seller.totalPaid + seller.commissionBalance
    seller.commissionBalance = 0
    await seller.save()

    res.json({
      message: `Commission marked as paid for ${seller.businessName}`,
      totalPaid: seller.totalPaid,
      pendingBalance: seller.commissionBalance,
    })
  } catch (error){
    res.status(500).json({ message: error.message })
  }
}

//get all referrals
const getAllReferrals = async(req, res) =>{
  try{
    if(!verifyAdmin(req, res)) return

    // get all sellers who were referred by someone
    const referredSellers = await Seller.find({
        referredBy: {$ne: null}
      }).select("-password")

      //build referral list with referrer details
      const referrals = await Promise.all(
        referredSellers.map(async (referred) =>{
          const referrer = await Seller.findOne({
            referralCode: referred.referredBy
          }).select("businessName email commissionBalance totalEarned totalPaid")

          return{
            referrer: referrer ? referrer.businessName : "Unknown",
            referrerEmail: referrer ? referrer.email : "Unknown",
            referredSeller: referred.businessName,
            referredEmail: referred.email,
            referralCode: referred.referredBy,
            joinedDate: referred.createdAt,
          }
        })
      )
      res.json({
        total: referrals.length,
        referrals,
      })
  } catch (error){
    res.status(500).json({ message: error.message})
  }
}

module.exports = {
  upgradePlan,
  activateStore,
  deactivateStore,
  activateAll,
  deactivateAll,
  deleteSeller,
  getAllSellers,
  resetPassword,
  markCommissionPaid,
  getAllReferrals,
}