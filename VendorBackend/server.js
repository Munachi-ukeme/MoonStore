// This is the app's entry point. It starts the server, connects the database, and handles all routes.

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { startCronJobs } = require("./utils/cronJobs");
const http = require("http");
const { initSocket } = require("./utils/socket");
const maintenanceMiddleware = require("./middleware/maintenance");

const app = express();

const httpServer = http.createServer(app);
initSocket(httpServer);

// 1. Helmet Security Headers
app.use(helmet());

// 2. CORS MUST COME BEFORE MAINTENANCE MIDDLEWARE
// Allows maintenance 503 responses to pass browser CORS checks safely
app.use(cors({
  origin: [process.env.FRONTEND_URL, "https://www.moonstore.ng"].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-session-id", "admin-key", "x-maintenance-bypass"],
}));

app.set("trust proxy", 1);

// 3. MAINTENANCE MIDDLEWARE (Placed right after CORS & Helmet)
app.use(maintenanceMiddleware);

// 4. Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // signed EscrowPay webhooks must never be rate limited
  skip: (req) => req.originalUrl.startsWith("/api/webhooks/"),
});

app.use(generalLimiter);

// 5. Body Parsers
// 5mb so Base64 chat images (up to 300KB each) fit; rawBody is kept for webhook signature checks
app.use(express.json({
  limit: "5mb",
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith("/api/webhooks/")) {
      req.rawBody = buf.toString();
    }
  },
}));

app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const storeRoutes = require("./routes/store");
const adminRoutes = require("./routes/admin");
const sellerRoutes = require("./routes/seller");
const buyerRoutes = require("./routes/buyer");
const chatRoutes = require("./routes/chat");
const analyticsRoutes = require("./routes/analyticsRoutes");
const reviewRoutes = require("./routes/reviews");
const bankRoutes = require("./routes/banks");
const webhookRoutes = require("./routes/webhooks");
const sitemapRoute = require("./routes/sitemaproute");

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/", sitemapRoute);

// Test route
app.get("/", (req, res) => {
  res.send("MoonStore Backend is running 🚀");
});

app.get("/health", (req, res) => res.status(200).json({ ok: true }));

// Last-resort error handler: never send stack traces to the browser
app.use((err, req, res, next) => {
  console.error("Unhandled request error:", err.message);

  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request too large" });
  }

  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ message: "Bad request" });
  }

  res.status(500).json({ message: "Something went wrong" });
});

// A stray failed promise should be logged, not crash the whole server
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
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