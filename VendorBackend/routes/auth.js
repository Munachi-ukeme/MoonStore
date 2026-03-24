const express = require("express")
const router = express.Router()
const { registerSeller, loginSeller } = require("../controllers/authController")
const rateLimit = require("express-rate-limit")
const { body } = require("express-validator")

// rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many login attempts. Please try again after 15 minutes."
  }
})

// register validation rules
const registerValidation = [
  body("businessName")
    .trim()
    .notEmpty().withMessage("Business name is required"),
  body("email")
    .trim()
    .isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("whatsappNumber")
    .trim()
    .notEmpty().withMessage("WhatsApp number is required"),
]

// login validation rules
const loginValidation = [
  body("email")
    .trim()
    .isEmail().withMessage("Please enter a valid email"),
  body("password")
    .notEmpty().withMessage("Password is required"),
]

// POST /api/auth/register
router.post("/register", registerValidation, registerSeller)

// POST /api/auth/login
router.post("/login", loginLimiter, loginValidation, loginSeller)

module.exports = router
