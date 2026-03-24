const Seller = require("../models/Seller")
const Product = require("../models/Product")
const Category = require("../models/Category")
const bcrypt = require("bcryptjs")

// -----------------------------------
// DELETE SELLER ACCOUNT
// DELETE /api/seller/account
// Protected — seller must be logged in
// -----------------------------------
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body

    // 1. Find seller
    const seller = await Seller.findById(req.seller._id)

    // 2. Confirm password before deleting
    // prevents accidental or unauthorized deletion
    const isMatch = await bcrypt.compare(password, seller.password)
    if (!isMatch) {
      return res.status(400).json({ 
        message: "Incorrect password. Account not deleted." 
      })
    }

    // 3. Delete all seller's products
    await Product.deleteMany({ sellerId: seller._id })

    // 4. Delete all seller's categories
    await Category.deleteMany({ sellerId: seller._id })

    // 5. Delete seller account
    await seller.deleteOne()

    res.json({ 
      message: "Your account and all data have been deleted successfully." 
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { deleteAccount }