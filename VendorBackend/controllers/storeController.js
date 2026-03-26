const Seller = require("../models/Seller")
const Product = require("../models/Product")
const Category = require("../models/Category")

// -----------------------------------
// GET FULL STORE BY SLUG
// GET /api/store/:slug (public - no auth needed)
// -----------------------------------
const getStore = async (req, res) => {
  try {
    // 1. Find seller by slug
    const seller = await Seller.findOne({ slug: req.params.slug }).select(
      "-password" // never send password to frontend
    )

    if (!seller) {
      return res.status(404).json({ message: "Store not found" })
    }

    // 2. check if store is active
if (!seller.isActive) {
  return res.status(403).json({ 
    message: "This store is currently inactive" 
  })
}

    // 3. Get all categories for this store
    const categories = await Category.find({ sellerId: seller._id })

    // 4. Get all products for this store
    const products = await Product.find({ sellerId: seller._id })
      .populate("categoryId", "name")

    // 5. Return everything in one response
    res.json({
      store: {
        businessName: seller.businessName,
        slug: seller.slug,
        logo: seller.logo,
        bannerImage: seller.bannerImage,
        tagline: seller.tagline,
        whatsappNumber: seller.whatsappNumber,
        primaryColor: seller.primaryColor,
        secondaryColor: seller.secondaryColor,
        plan: seller.plan,
      },
      categories,
      products,
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// GET SINGLE PRODUCT BY SLUG
// GET /api/store/:slug/:productSlug (public - no auth needed)
// -----------------------------------
const getProduct = async (req, res) => {
  try {
    // 1. Find seller by slug
    const seller = await Seller.findOne({ slug: req.params.slug })
    if (!seller) {
      return res.status(404).json({ message: "Store not found" })
    }

    // 2. Find product by slug
    const product = await Product.findOne({
      sellerId: seller._id,
      slug: req.params.productSlug,
    }).populate("categoryId", "name")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // 3. Return product + store info (needed for OG tags and WhatsApp number)
    res.json({
      product,
      store: {
        businessName: seller.businessName,
        whatsappNumber: seller.whatsappNumber,
        slug: seller.slug,
      },
    })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getStore, getProduct }