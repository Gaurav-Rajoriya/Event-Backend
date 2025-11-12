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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/data", dataRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

app.get("/", (req, res) => {
  res.send("Aone Backend is live 🚀");
});

// ✅ For Vercel: export instead of listen
module.exports = app;
