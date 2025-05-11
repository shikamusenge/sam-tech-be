const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create event images directory if it doesn't exist
const eventImagesDir = path.join(__dirname, "../public/event_images");
if (!fs.existsSync(eventImagesDir)) {
  fs.mkdirSync(eventImagesDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, eventImagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).array("images", 10); // Allow up to 10 images

// Get all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new event
router.post("/", async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const imagePaths = req.files?.map(file => `/event_images/${file.filename}`) || [];
      
      // Parse YouTube URLs from comma-separated string to array
      const youtubeUrls = req.body.youtubeUrls 
        ? req.body.youtubeUrls.split(',').map(url => url.trim()).filter(url => url)
        : [];
      
      const newEvent = new Event({
        title: req.body.title,
        description: req.body.description,
        date: req.body.date,
        images: imagePaths,
        youtubeUrls: youtubeUrls
      });
      
      await newEvent.save();
      res.status(201).json(newEvent);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
});

// Update an event
router.put("/:id", async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Keep existing images unless they were deleted
      let existingImages = event.images || [];
      
      // Add new images if any were uploaded
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => `/event_images/${file.filename}`);
        existingImages = [...existingImages, ...newImages];
      }
      
      // Parse YouTube URLs from comma-separated string to array
      const youtubeUrls = req.body.youtubeUrls 
        ? req.body.youtubeUrls.split(',').map(url => url.trim()).filter(url => url)
        : event.youtubeUrls || [];
      
      const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        {
          title: req.body.title,
          description: req.body.description,
          date: req.body.date,
          images: existingImages,
          youtubeUrls: youtubeUrls
        },
        { new: true }
      );
      
      res.json(updatedEvent);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
});

// Delete an event
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    // Delete associated images
    if (event.images) {
      event.images.forEach(image => {
        const imagePath = path.join(__dirname, '../public', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }
    
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete individual image
router.delete("/:id/images/:imageName", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Remove the image from the array
    event.images = event.images.filter(img => !img.includes(req.params.imageName));
    await event.save();

    // Delete the physical file
    const imagePath = path.join(__dirname, '../public', req.params.imageName);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;