const express = require("express");
const router = express.Router();
const Data = require("../models/dataModel"); // make sure path is correct
const multer = require("multer");

// multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// GET all data
router.get("/", async (req, res) => {
  try {
    const data = await Data.find();
    console.log("Fetched data from DB:", data); // add this
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// POST new data
router.post("/", upload.single("file"), async (req, res) => {
  console.log("Uploaded file:", req.file);
  try {
    const newData = new Data({
      title: req.body.title,
      description: req.body.description,
      type: req.file ? (req.file.mimetype.includes("pdf") ? "pdf" : "image") : null,
      fileUrl: req.file ? `uploads/${req.file.filename}` : null
    });
    const saved = await newData.save();
    res.json(saved);
  } catch (err) {
    console.error("POST /api/data error:", err.message);
    res.status(500).json({ message: err.message });
  }
});


// DELETE data
router.delete("/:id", async (req, res) => {
  try {
    await Data.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/data error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// PUT / update data
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const data = await Data.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Data not found" });

    // Safely get title and description from req.body
    const title = req.body.title || data.title;
    const description = req.body.description || data.description;

    data.title = title;
    data.description = description;

    // Update file if new file uploaded
    if (req.file) {
      data.fileUrl = `uploads/${req.file.filename}`;
      data.type = req.file.mimetype.includes("pdf") ? "pdf" : "image";
    }

    const updated = await data.save();
    res.json(updated);
  } catch (err) {
    console.error("PUT /api/data error:", err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
