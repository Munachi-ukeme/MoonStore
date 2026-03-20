// Product routes
const express = require("express")
const router = express.Router()
const {
  getProducts,
  addProduct,
  editProduct,
  deleteProduct,
} = require("../controllers/productController")
const { protect } = require("../middleware/authmiddleware")
const { checkProductLimit } = require("../middleware/planLimits")
const upload = require("../middleware/upload")

// GET /api/products — get all products
router.get("/", protect, getProducts)

// POST /api/products — add product (with image upload)
router.post("/", protect, checkProductLimit, upload.single("image"), addProduct)

// PUT /api/products/:id — edit product (with optional image upload)
router.put("/:id", protect, upload.single("image"), editProduct)

// DELETE /api/products/:id — delete product
router.delete("/:id", protect, deleteProduct)

module.exports = router