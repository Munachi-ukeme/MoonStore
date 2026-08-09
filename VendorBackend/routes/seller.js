const express = require("express")
const router = express.Router()
const { deleteSeller, changePassword, getMe } = require("../controllers/sellerController")
const { protect } = require("../middleware/authmiddleware")

// DELETE /api/seller/account — seller deletes own account
router.get("/me", protect, getMe)
router.delete("/account", protect, deleteSeller)
router.put("/change-password", protect, changePassword)
module.exports = router