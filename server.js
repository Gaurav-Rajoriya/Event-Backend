const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const dataRoutes = require("./routes/dataRoutes");

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Static folder (optional, still keep for local uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ API Routes
app.use("/api/data", dataRoutes);

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

// ✅ Default Route (optional)
app.get("/", (req, res) => {
  res.send("Aone Backend is live 🚀");
});

// ✅ Server listen (for local + Vercel)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
