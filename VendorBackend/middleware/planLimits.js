const Product = require("../models/Product")
const Category = require("../models/Category")

const MAX_PRODUCTS = 200
const MAX_CATEGORIES = 30
const MAX_IMAGES_PER_PRODUCT = 5

// ── Check product limit (200 max) ──
const checkProductLimit = async (req, res, next) => {
  try {
    const seller = req.seller
    const productCount = await Product.countDocuments({
      sellerId: seller._id,
    })

    if (productCount >= MAX_PRODUCTS) {
      return res.status(403).json({
        message: `You have reached the maximum limit of ${MAX_PRODUCTS} products for your store.`,
      })
    }

    next()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ── Check category limit (30 max) ──
const checkCategoryLimit = async (req, res, next) => {
  try {
    const seller = req.seller
    const categoryCount = await Category.countDocuments({
      sellerId: seller._id,
    })

    if (categoryCount >= MAX_CATEGORIES) {
      return res.status(403).json({
        message: `You have reached the maximum limit of ${MAX_CATEGORIES} categories for your store.`,
      })
    }

    next()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ── Check image limit (5 max per product) ──
const checkImageLimit = (req, res, next) => {
  try {
    let count = 0

    if (req.files) {
      if (Array.isArray(req.files)) {
        count = req.files.length
      } else if (req.files.images && Array.isArray(req.files.images)) {
        count = req.files.images.length
      }
    } else if (req.body.images && Array.isArray(req.body.images)) {
      count = req.body.images.length
    }

    if (count > MAX_IMAGES_PER_PRODUCT) {
      return res.status(400).json({
        message: `You can upload a maximum of ${MAX_IMAGES_PER_PRODUCT} images per product.`,
      })
    }

    next()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { checkProductLimit, checkCategoryLimit, checkImageLimit }