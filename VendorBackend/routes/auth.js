const express = require("express")
const router = express.Router()
const {
  requestSignupConfirmation,
  verifySignupToken,
  registerSeller,
  loginSeller,
  resetPassword,
  forgotPassword,
} = require("../controllers/authController")
const rateLimit = require("express-rate-limit")
const { body } = require("express-validator")

// login: only failed attempts count, so sellers sharing one mobile-network IP are not locked out together
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    error: "Too many login attempts. Please try again after 15 minutes."
  }
})

const signupRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Too many signup attempts. Please try again in an hour." }
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many attempts. Please try again in an hour." }
})

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many reset requests. Please try again in an hour." }
})

// register validation rules — password now checked before hashing at step 1
const signupRequestValidation = [
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

// POST /api/auth/request-signup-confirmation — step 1 complete, sends email
router.post("/request-signup-confirmation", signupRequestLimiter, signupRequestValidation, requestSignupConfirmation)

// GET /api/auth/verify-signup-token — confirms email link, returns step 1 data
router.get("/verify-signup-token", verifySignupToken)

// POST /api/auth/register — final step, verifies identity and saves the seller
router.post("/register", registerLimiter, registerSeller)

// POST /api/auth/login
router.post("/login", loginLimiter, loginValidation, loginSeller)

router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router