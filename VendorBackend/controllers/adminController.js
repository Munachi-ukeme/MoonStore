const Seller = require("../models/Seller")
const Product = require("../models/Product")
const Category = require("../models/Category")

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

// -----------------------------------
// DELETE SELLER ACCOUNT
// DELETE /api/admin/delete-seller
// -----------------------------------
const deleteSeller = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return

    const { email } = req.body

    const seller = await Seller.findOne({ email })
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" })
    }

    // Delete all seller's products
    await Product.deleteMany({ sellerId: seller._id })

    // Delete all seller's categories
    await Category.deleteMany({ sellerId: seller._id })

    // Delete seller account
    await seller.deleteOne()

    res.json({ message: "Seller account and all data deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// GET ALL SELLERS
// GET /api/admin/sellers
const getAllSellers = async (req, res) => {
  try {
    if (!verifyAdmin(req, res)) return

    const sellers = await Seller.find().select("-password")

    res.json({
      total: sellers.length,
      sellers
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
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
}