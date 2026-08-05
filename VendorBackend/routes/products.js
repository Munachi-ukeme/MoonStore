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
const { checkProductLimit, checkImageLimit } = require("../middleware/planLimits")
const upload = require("../middleware/upload")

// GET /api/products — get all products
router.get("/", protect, getProducts)

// POST /api/products — add product (checks product count limit, processes up to 5 files, checks image count limit)
router.post(
  "/",
  protect,
  checkProductLimit,
  upload.array("images", 5),
  checkImageLimit,
  addProduct
)

// PUT /api/products/:id — edit product (processes up to 5 files, checks image count limit)
router.put(
  "/:id",
  protect,
  upload.array("images", 5),
  checkImageLimit,
  editProduct
)

// DELETE /api/products/:id — delete product
router.delete("/:id", protect, deleteProduct)

module.exports = router