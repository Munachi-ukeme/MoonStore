const Seller = require("../models/Seller")
const Product = require("../models/Product")
const Category = require("../models/Category")
const bcrypt = require("bcryptjs")


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

    if(newPassword === currentPassword){
      return res.status(400).json({ message: "This is the current password, change it"})
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

 
// -----------------------------------
// DELETE SELLER ACCOUNT
// DELETE /api/seller/account
// Protected — seller must be logged in
// -----------------------------------
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



module.exports = { deleteAccount, changePassword }