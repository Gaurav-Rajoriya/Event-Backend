const express = require("express");
const router = express.Router();
const Data = require("../models/dataModel");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// ================================
// ✅ Cloudinary Config
// ================================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ================================
// ✅ Multer memory storage
// ================================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ================================
// ✅ Upload Helper (Image + PDF)
// ================================
const uploadToCloudinary = (buffer, mimetype, folder = "aone_uploads") => {
  return new Promise((resolve, reject) => {
    // PDF → raw | Images → image
    const resourceType = mimetype.includes("pdf") ? "raw" : "image";

    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ================================
// ✅ GET ALL DATA
// ================================
router.get("/", async (req, res) => {
  try {
    const data = await Data.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================================
// ✅ ADD NEW DATA
// ================================
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, description } = req.body;

    let fileUrl = null;
    let fileType = null;

    // If file exists → upload to Cloudinary
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

      fileUrl = result.secure_url;
      fileType = req.file.mimetype.includes("pdf") ? "pdf" : "image";
    }

    const newData = new Data({
      title,
      description,
      type: fileType,
      fileUrl,
    });

    const saved = await newData.save();
    res.json(saved);
  } catch (err) {
    console.error("❌ Add Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================================
// ✅ UPDATE DATA
// ================================
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const { title, description } = req.body;

    const updateFields = { title, description };

    // If file updated
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

      updateFields.fileUrl = result.secure_url;
      updateFields.type = req.file.mimetype.includes("pdf") ? "pdf" : "image";
    }

    const updated = await Data.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Item not found" });

    res.json(updated);
  } catch (err) {
    console.error("❌ Update Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================================
// ✅ DELETE DATA
// ================================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Data.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Item not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
