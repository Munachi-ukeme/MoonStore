const express = require("express")
const router = express.Router()
const { deleteAccount } = require("../controllers/sellerController")
const { protect } = require("../middleware/authmiddleware")

// DELETE /api/seller/account — seller deletes own account
router.delete("/account", protect, deleteAccount)

module.exports = router