// the middleware that enforces your pricing tiers.

const Product = require("../models/Product")
const Category = require("../models/Category")

// Plan limits definition
const limits = {
  basic:   { products: 15, categories: 2 },
  pro:     { products: 35, categories: 4 },
  premium: { products: Infinity, categories: Infinity },
}

// Check product limit
const checkProductLimit = async (req, res, next) => {
  try {
    const seller = req.seller // comes from auth middleware
    const plan = seller.plan

    // count how many products this seller already has
    const productCount = await Product.countDocuments({ 
      sellerId: seller._id 
    })

    // check if they've hit their limit
    if (productCount >= limits[plan].products) {
      return res.status(403).json({
        message: `You have reached the product limit for the ${plan} plan. Upgrade to add more products.`,
      })
    }

    // limit not reached — move to controller
    next()

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Check category limit
const checkCategoryLimit = async (req, res, next) => {
  try {
    const seller = req.seller
    const plan = seller.plan

    // count how many categories this seller already has
    const categoryCount = await Category.countDocuments({ 
      sellerId: seller._id 
    })

    // check if they've hit their limit
    if (categoryCount >= limits[plan].categories) {
      return res.status(403).json({
        message: `You have reached the category limit for the ${plan} plan. Upgrade to add more categories.`,
      })
    }

    // limit not reached — move to controller
    next()

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { checkProductLimit, checkCategoryLimit }