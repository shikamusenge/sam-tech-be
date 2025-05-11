const express = require("express");
const router = express.Router();
const Career = require("../models/Career");
const upload = require("../config/fileUpload");

// Create a new career post
router.post("/", upload.single('pdfFile'), async (req, res) => {
  try {
    const { title, description, requirements, location, type, deadline } = req.body;
    
    const newCareer = new Career({
      title,
      description,
      requirements,
      location,
      type,
      deadline,
      pdfUrl: req.file ? `/uploads/${req.file.filename}` : null
    });

    const savedCareer = await newCareer.save();
    res.status(201).json(savedCareer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all career posts
router.get("/", async (req, res) => {
  try {
    const careers = await Career.find().sort({ createdAt: -1 });
    res.json(careers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single career post
router.get("/:id", async (req, res) => {
  try {
    const career = await Career.findById(req.params.id);
    if (!career) return res.status(404).json({ message: "Career post not found" });
    res.json(career);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a career post
router.put("/:id", upload.single('pdfFile'), async (req, res) => {
  try {
    const { title, description, requirements, location, type, deadline } = req.body;
    
    const updateData = {
      title,
      description,
      requirements,
      location,
      type,
      deadline
    };

    if (req.file) {
      updateData.pdfUrl = `/uploads/${req.file.filename}`;
    }

    const updatedCareer = await Career.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedCareer) return res.status(404).json({ message: "Career post not found" });
    res.json(updatedCareer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a career post
router.delete("/:id", async (req, res) => {
  try {
    const deletedCareer = await Career.findByIdAndDelete(req.params.id);
    if (!deletedCareer) return res.status(404).json({ message: "Career post not found" });
    res.json({ message: "Career post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;