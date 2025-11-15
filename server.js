const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const dataRoutes = require("./routes/dataRoutes");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Main API routes
app.use("/api/data", dataRoutes);

// MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// Default route
app.get("/", (req, res) => {
  res.send("🚀 Aone Backend is Live!");
});

// Export for Vercel
module.exports = app;
