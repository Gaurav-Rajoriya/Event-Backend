const express = require("express");
const router = express.Router();
const Data = require("../models/dataModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ✅ Use memory storage (no local file writes)
const storage = multer.memoryStorage();
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
   ✅ POST NEW DATA (Vercel safe)
============================= */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    let fileUrl = null;
    let fileType = null;

    // ✅ Upload directly from memory
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "aone_uploads" },
        async (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload failed:", error);
            return res.status(500).json({ message: "Cloudinary upload failed" });
          }

          // ✅ Save in DB
          const newData = new Data({
            title: req.body.title,
            description: req.body.description,
            type: req.file.mimetype.includes("pdf") ? "pdf" : "image",
            fileUrl: result.secure_url,
          });

          const saved = await newData.save();
          res.json(saved);
        }
      );

      // ✅ Write stream to Cloudinary
      uploadResult.end(req.file.buffer);
    } else {
      // No file case
      const newData = new Data({
        title: req.body.title,
        description: req.body.description,
        type: null,
        fileUrl: null,
      });
      const saved = await newData.save();
      res.json(saved);
    }
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
