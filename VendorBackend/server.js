//This is the app's entry point. It starts the server, connects the database, and will later handle all the routes.

const express = require("express"); 
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

//load environment variables
dotenv.config()

//connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // allows app to read JSON from requests

//Routes
const authRoutes = require("./routes/auth")
const categoryRoutes = require("./routes/categories")
const productRoutes = require("./routes/products")
const storeRoutes = require("./routes/store")
const adminRoutes = require("./routes/admin")
const sellerRoutes = require("./routes/seller")


app.use("/api/auth", authRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/products", productRoutes)
app.use("/api/store", storeRoutes)
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes)


// test route
app.get("/", (req, res) => {
  res.send("MoonStore Backend is running 🚀");
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
