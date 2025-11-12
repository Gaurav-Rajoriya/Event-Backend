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

// multer temp upload setup
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

// ✅ POST: Upload new data
router.post("/", upload.single("file"), async (req, res) => {
  try {
    let fileUrl = null;
    let fileType = null;

    // 🔥 Important check — if file exists, upload to Cloudinary
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "auto",
        folder: "aone_uploads",
      });

      fileUrl = uploadResult.secure_url;
      fileType = req.file.mimetype.includes("pdf") ? "pdf" : "image";

      // Remove local temp file
      fs.unlinkSync(req.file.path);
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

module.exports = router;
