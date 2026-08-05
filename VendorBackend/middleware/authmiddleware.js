const jwt = require("jsonwebtoken")
const Seller = require("../models/Seller")

// ── PROTECT MIDDLEWARE ──
// Verifies JWT token and attaches seller instance to req.seller
const protect = async (req, res, next) => {
  try {
    let token

    // 1. Check if token exists in request headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // 2. Extract token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1]
    }

    // 3. If no token found — block the request
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" })
    }

    // 4. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 5. Find the seller attached to this token
    req.seller = await Seller.findById(decoded.id).select("-password")

    if (!req.seller) {
      return res.status(401).json({ message: "Not authorized, user not found" })
    }

    // 6. Proceed to controller
    next()
  } catch (error) {
    res.status(401).json({ message: "Not authorized, invalid token" })
  }
}

module.exports = { protect }