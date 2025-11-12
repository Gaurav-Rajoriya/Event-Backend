const express = require("express");
const router = express.Router();
const Data = require("../models/dataModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier"); // 🧠 for converting buffer to stream

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ✅ Use memory storage (no local writes)
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
   ✅ POST NEW DATA (with Memory Buffer)
============================= */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    let fileUrl = null;
    let fileType = null;

    // ✅ If file is uploaded, push it to Cloudinary directly
    if (req.file) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "aone_uploads" },
        async (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload failed:", error);
            return res.status(500).json({ message: "Cloudinary upload failed" });
          }

          fileUrl = result.secure_url;
          fileType = req.file.mimetype.includes("pdf") ? "pdf" : "image";

          // ✅ Save data to MongoDB
          const newData = new Data({
            title: req.body.title,
            description: req.body.description,
            type: fileType,
            fileUrl: fileUrl,
          });

          const saved = await newData.save();
          res.json(saved);
        }
      );

      // ✅ Convert buffer to stream and pipe to Cloudinary
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } else {
      // ✅ No file case
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
   ✅ DELETE DATA
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
