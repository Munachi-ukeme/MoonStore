// Admin routes - protected by admin secret key (checked inside each controller function)
const express = require("express")
const router = express.Router()
const rateLimit = require("express-rate-limit")
const {
  activateStore,
  deactivateStore,
  adminLogin,
  deleteSeller,
  getAllSellers,
  adminLogout,
  getReportedConversations,
  exportConversationPdf,
  getRevenueSummary,
  getExitSurveys,
  getDisputedConversations,
  getDisputeDetail,
  sendAdminMessage,
  notifyDisputeParties,
  resolveDispute,
} = require("../controllers/adminController")

// only failed passkey attempts count against the limit
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
})

router.put("/activate", activateStore)
router.put("/deactivate", deactivateStore)

router.post("/login", adminLoginLimiter, adminLogin)
router.post("/logout", adminLogout)

router.delete("/delete-seller", deleteSeller)
router.get("/sellers", getAllSellers)

router.get("/reports", getReportedConversations)
router.get("/reports/:conversationId/export", exportConversationPdf)

router.get("/revenue-summary", getRevenueSummary)
router.get("/exit-surveys", getExitSurveys)

router.get("/disputes", getDisputedConversations)
router.get("/disputes/:conversationId", getDisputeDetail)
router.post("/disputes/:conversationId/message", sendAdminMessage)
router.post("/disputes/:conversationId/notify", notifyDisputeParties)
router.post("/disputes/:conversationId/resolve", resolveDispute)

module.exports = router