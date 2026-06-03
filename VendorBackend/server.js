//This is the app's entry point. It starts the server, connects the database, and will later handle all the routes.

const express = require("express"); 
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit")
const dotenv = require("dotenv");
const connectDB = require("./config/db");

//load environment variables
dotenv.config()

//connect to database
connectDB();

const app = express();

// Security middleware
// 1. helmet- set secure HTTP headers automatically
// protects against common attacks like clickjacking, XSS, sniffing
app.use(helmet());

// 2. CORS - only allow requests from moonstore frontend URL
// blocks any other domain from calling moonstore backend

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "admin-key"],
}));

// 3. General rate limiter - applies to all routes
// limits each IP to 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message:{
    error: "Too many requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// apply general limiter to all routes
app.use(generalLimiter);


app.use(express.json({
    verify: (req, res, buf) => {
        // If the incoming request is going to our webhook path, save the raw text string!
        if (req.originalUrl.includes('/webhook')) {
            req.rawBody = buf.toString();
        }
    }
}));

app.use(express.urlencoded({ extended: true })); // allows app to read JSON from requests

//Routes
const authRoutes = require("./routes/auth")
const categoryRoutes = require("./routes/categories")
const productRoutes = require("./routes/products")
const storeRoutes = require("./routes/store")
const adminRoutes = require("./routes/admin")
const sellerRoutes = require("./routes/seller")
const paymentRoutes = require("./routes/payments");
const buyerRoutes = require("./routes/buyer");


app.use("/api/auth", authRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/products", productRoutes)
app.use("/api/store", storeRoutes)
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes)
app.use("/api/payments", paymentRoutes);
app.use("/api/buyer", buyerRoutes);




// test route
app.get("/", (req, res) => {
  res.send("MoonStore Backend is running 🚀");
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
