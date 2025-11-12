const express = require("express");
const router = express.Router();
const Data = require("../models/dataModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer temp storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

/* =============================
   ✅ GET ALL DATA
============================= */
router.get("/", async (req, res) => {
  try {
    const data = await Data.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* =============================
   ✅ POST NEW DATA
============================= */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    let fileUrl = null;
    let fileType = null;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "auto",
        folder: "aone_uploads",
      });

      fileUrl = uploadResult.secure_url;
      fileType = req.file.mimetype.includes("pdf") ? "pdf" : "image";

      fs.unlinkSync(req.file.path); // remove temp file
    }

    const newData = new Data({
      title: req.body.title,
      description: req.body.description,
      type: fileType,
      fileUrl: fileUrl,
    });

    const saved = await newData.save();
    res.json(saved);
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* =============================
   ✅ DELETE DATA BY ID
============================= */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Data.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
