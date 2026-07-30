// Admin routes - protected by admin secret key
const express = require("express")
const router = express.Router()
const {
  activateStore,
  deactivateStore,
  adminLogin,
  deleteSeller,
  getAllSellers,
  markCommissionPaid,
  getAllReferrals,
  adminLogout,
  getReportedConversations,
  exportConversationPdf,
  getRevenueSummary,
  getExitSurveys,
} = require("../controllers/adminController")

// PUT /api/admin/activate → activate one store
router.put("/activate", activateStore)

// PUT /api/admin/deactivate → deactivate one store
router.put("/deactivate", deactivateStore)

router.post("/login", adminLogin);

// DELETE /api/admin/delete-seller → delete seller account + all data
router.delete("/delete-seller", deleteSeller)

// GET /api/admin/get- all all sellers
router.get("/sellers", getAllSellers)

router.post("/logout", adminLogout);

//mark commission as paid
router.put("/mark-commission-paid", markCommissionPaid)

// get all referrals
router.get("/referrals", getAllReferrals)

router.get("/reports", getReportedConversations);

router.get("/reports/:conversationId/export", exportConversationPdf);

router.get("/revenue-summary", getRevenueSummary);

router.get("/exit-surveys", getExitSurveys);

module.exports = router