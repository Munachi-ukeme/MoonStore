//This is the app's entry point. It starts the server, connects the database, and will later handle all the routes.

const express = require("express"); 
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit")
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { startCronJobs } = require("./utils/cronJobs");
const http = require("http");
const { initSocket } = require("./utils/socket");

//load environment variables
dotenv.config()



const app = express();
const httpServer = http.createServer(app);
initSocket(httpServer);

// Security middleware
// 1. helmet- set secure HTTP headers automatically
// protects against common attacks like clickjacking, XSS, sniffing
app.use(helmet());

// 2. CORS - only allow requests from moonstore frontend URL
// blocks any other domain from calling moonstore backend

app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://www.moonstore.ng'],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization","x-session-id", "admin-key",],
}));

app.set('trust proxy', 1);

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
const reviewRoutes = require("./routes/reviews")
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




// test route
app.get("/", (req, res) => {
  res.send("MoonStore Backend is running 🚀");
});

// Create an async engine to handle startup order
const startServer = async () => {
  try {
    // 1. Wait for database connection first
    await connectDB();
    console.log("Database connected successfully! 📁");

    // 2. Start listening on network port
    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);

      // 3. Start cron jobs now that everything else is ready
      startCronJobs();
      console.log("Cron jobs successfully initialized ⏰");
    });

  } catch (error) {
    console.error("Critical boot error:", error.message);
    process.exit(1); // Safely shut down if database connection fails
  }
};

// Execute the function
startServer();