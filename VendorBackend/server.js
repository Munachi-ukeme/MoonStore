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
app.use("/api/auth", authRoutes)

// test route
app.get("/", (req, res) => {
  res.send("Vendorstore Backend is running 🚀");
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
