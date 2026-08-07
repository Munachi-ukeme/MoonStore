const Category = require("../models/Category")

// -----------------------------------
// GET ALL CATEGORIES
// GET /api/categories (protected - seller only)
// -----------------------------------
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ sellerId: req.seller._id })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// ADD CATEGORY
// POST /api/categories (protected - seller only)
// -----------------------------------
const addCategory = async (req, res) => {
  try {

    if (!req.seller.subaccountVerified) {
      return res.status(403).json({
        message: "Your store is under review. Please try again once your account is verified.",
      })
    }
    
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: "Category name is required" })
    }

    // Check if category name already exists for this seller
    const existing = await Category.findOne({ sellerId: req.seller._id, name })
    if (existing) {
      return res.status(400).json({ message: "Category already exists" })
    }

    // Note: 30-category limit is checked by checkCategoryLimit middleware before this function runs
    const category = await Category.create({ sellerId: req.seller._id, name })

    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// UPDATE CATEGORY
// PUT /api/categories/:id (protected - seller only)
// -----------------------------------
const updateCategory = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: "Category name is required" })
    }

    // Find the category and verify seller ownership
    const category = await Category.findOne({
      _id: req.params.id,
      sellerId: req.seller._id,
    })

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    // Check if another category with the same name already exists for this seller
    const existing = await Category.findOne({
      sellerId: req.seller._id,
      name,
      _id: { $ne: req.params.id },
    })

    if (existing) {
      return res.status(400).json({ message: "Category name already exists" })
    }

    category.name = name
    await category.save()

    res.json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// -----------------------------------
// DELETE CATEGORY
// DELETE /api/categories/:id (protected - seller only)
// -----------------------------------
const deleteCategory = async (req, res) => {
  try {
    // Find category and verify seller ownership
    const category = await Category.findOne({
      _id: req.params.id,
      sellerId: req.seller._id,
    })

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    await category.deleteOne()

    res.json({ message: "Category deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getCategories, addCategory, updateCategory, deleteCategory }