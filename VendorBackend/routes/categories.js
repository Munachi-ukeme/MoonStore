// Category routes
const express = require("express")
const router = express.Router()
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController")
const { protect } = require("../middleware/authmiddleware")
const { checkCategoryLimit } = require("../middleware/planLimits")

// GET /api/categories — get all categories for logged-in seller
router.get("/", protect, getCategories)

// POST /api/categories — add category (authenticates seller, checks 30-category limit, creates category)
router.post("/", protect, checkCategoryLimit, addCategory)

// PUT /api/categories/:id — update category
router.put("/:id", protect, updateCategory)

// DELETE /api/categories/:id — delete category
router.delete("/:id", protect, deleteCategory)

module.exports = router