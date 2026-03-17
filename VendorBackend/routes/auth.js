//Auth routes - register and login
const express = require("express");
const router = express.Router();
const { registerSeller, loginSeller } = require("../controllers/authController");

//POST /api/auth/register
router.post("/register", registerSeller)

//POST /api/auth/login
router.post("/login", loginSeller)

module.exports = router;