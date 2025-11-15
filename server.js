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

// Serve static folder (optional)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Main API route
app.use("/api/data", dataRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// Default Route
app.get("/", (req, res) => {
  res.send("🚀 Aone Backend is Live!");
});

// For Vercel (no app.listen)
module.exports = app;
