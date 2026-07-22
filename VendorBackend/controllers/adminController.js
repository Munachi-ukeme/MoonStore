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
    } catch (err){
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

        // find all conversations for this seller first, so we can delete their messages too
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
            referrerCommissionBalance: referrer ? referrer.commissionBalance : 0,
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

const crypto = require("crypto");
let activeAdminToken = null;
let adminTokenExpires = null;

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

// replaces verifyAdmin everywhere
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


module.exports = {
  activateStore,
  deactivateStore,
  adminLogin,
  adminLogout,
  verifyAdmin,
  deleteSeller,
  getAllSellers,
  markCommissionPaid,
  getAllReferrals,
}