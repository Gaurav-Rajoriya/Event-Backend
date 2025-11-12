const express = require("express");
const router = express.Router();
const Data = require("../models/dataModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// multer setup for temp uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ GET all data
router.get("/", async (req, res) => {
  try {
    const data = await Data.find();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ POST new data (upload to Cloudinary)
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

      // remove local temp file
      fs.unlinkSync(req.file.path);
    }

    const newData = new Data({
      title: req.body.title,
      description: req.body.description,
      type: fileType,
      fileUrl,
    });

    const saved = await newData.save();
    res.json(saved);
  } catch (err) {
    console.error("POST /api/data error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ PUT / update data
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const data = await Data.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Data not found" });

    data.title = req.body.title || data.title;
    data.description = req.body.description || data.description;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "auto",
        folder: "aone_uploads",
      });

      data.fileUrl = uploadResult.secure_url;
      data.type = req.file.mimetype.includes("pdf") ? "pdf" : "image";

      fs.unlinkSync(req.file.path);
    }

    const updated = await data.save();
    res.json(updated);
  } catch (err) {
    console.error("PUT /api/data error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE data
router.delete("/:id", async (req, res) => {
  try {
    await Data.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/data error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
