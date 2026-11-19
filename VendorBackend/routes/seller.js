const express = require("express")
const rateLimit = require("express-rate-limit")
const router = express.Router()
const { deleteSeller, changePassword, getMe, updateDeliveryOptions, retryPayoutSetup, changeBankAccount } = require("../controllers/sellerController")
const { protect } = require("../middleware/authmiddleware")

const payoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Too many attempts. Please wait a few minutes and try again." },
})

router.get("/me", protect, getMe)
router.delete("/account", protect, deleteSeller)
router.put("/change-password", protect, changePassword)
router.put("/delivery-options", protect, updateDeliveryOptions);
router.post("/retry-payout-setup", protect, payoutLimiter, retryPayoutSetup);
router.put("/bank-account", protect, payoutLimiter, changeBankAccount);
module.exports = router