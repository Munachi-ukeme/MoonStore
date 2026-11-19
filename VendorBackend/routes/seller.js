const express = require("express")
const router = express.Router()
const { deleteSeller, changePassword, getMe, updateDeliveryOptions,retryPayoutSetup, changeBankAccount } = require("../controllers/sellerController")
const { protect } = require("../middleware/authmiddleware")

// DELETE /api/seller/account — seller deletes own account
router.get("/me", protect, getMe)
router.delete("/account", protect, deleteSeller)
router.put("/change-password", protect, changePassword)
router.put("/delivery-options", protect, updateDeliveryOptions);
router.post("/retry-payout-setup", protect, retryPayoutSetup);
router.put("/bank-account", protect, changeBankAccount);
module.exports = router