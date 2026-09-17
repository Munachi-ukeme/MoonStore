// This is the app's entry point. It starts the server, connects the database, and handles all routes.

const express = require("express"); 
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { startCronJobs } = require("./utils/cronJobs");
const http = require("http");
const { initSocket } = require("./utils/socket");
const maintenanceMiddleware = require('./middleware/maintenance');

// Load environment variables
dotenv.config();

const app = express();

const httpServer = http.createServer(app);
initSocket(httpServer);

// 1. Helmet Security Headers
app.use(helmet());

// 2. CORS MUST COME BEFORE MAINTENANCE MIDDLEWARE
// Allows maintenance 503 responses to pass browser CORS checks safely
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://www.moonstore.ng'],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-session-id", "admin-key"],
}));

app.set('trust proxy', 1);

// 3. MAINTENANCE MIDDLEWARE (Placed right after CORS & Helmet)
app.use(maintenanceMiddleware);

// 4. Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: "Too many requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// 5. Body Parsers
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));

app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const storeRoutes = require("./routes/store");
const adminRoutes = require("./routes/admin");
const sellerRoutes = require("./routes/seller");
const paymentRoutes = require("./routes/payments");
const buyerRoutes = require("./routes/buyer");
const chatRoutes = require("./routes/chat");
const analyticsRoutes = require("./routes/analyticsRoutes");
const reviewRoutes = require("./routes/reviews");
const sitemapRoute = require("./routes/sitemaproute");

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/", sitemapRoute);

// Test route
app.get("/", (req, res) => {
  res.send("MoonStore Backend is running 🚀");
});

// Startup Engine
const startServer = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully! 📁");

    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
      startCronJobs();
      console.log("Cron jobs successfully initialized ⏰");
    });

  } catch (error) {
    console.error("Critical boot error:", error.message);
    process.exit(1);
  }
};

startServer();