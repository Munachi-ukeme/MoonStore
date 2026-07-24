const express = require("express")
const router = express.Router()
const { deleteSeller, changePassword } = require("../controllers/sellerController")
const { protect } = require("../middleware/authmiddleware")

// DELETE /api/seller/account — seller deletes own account
router.delete("/account", protect, deleteSeller)
router.put("/change-password", protect, changePassword)
module.exports = router