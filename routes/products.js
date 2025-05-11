const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create product images directory if it doesn't exist
const productImagesDir = path.join(__dirname, "../public/product_images");
if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productImagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).array("images", 6); // Allow up to 6 files

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new product
router.post("/", async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const imagePaths = req.files?.map(file => `/product_images/${file.filename}`) || [];
      
      const newProduct = new Product({
        ...req.body,
        images: imagePaths
      });
      
      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
});

// Update a product
router.put("/:id", async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updateData = { ...req.body };
      
      // Keep existing images unless they were deleted
      let existingImages = product.images || [];
      
      // Add new images if any were uploaded
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => `/product_images/${file.filename}`);
        existingImages = [...existingImages, ...newImages];
      }
      
      updateData.images = existingImages;
      
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
      
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
});

// Delete individual image
router.delete("/:id/images/:imageName", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove the image from the array
    product.images = product.images.filter(img => !img.includes(req.params.imageName));
    await product.save();

    // Delete the physical file
    const imagePath = path.join(__dirname, '../public', req.params.imageName);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // First remove this product from all carts
    await Cart.updateMany(
      { 'items.product': req.params.id },
      { $pull: { items: { product: req.params.id } } }
    );

    // Then delete the product
    await Product.findByIdAndDelete(req.params.id);
    
    // Delete associated images
    if (product.images) {
      product.images.forEach(image => {
        const imagePath = path.join(__dirname, '../public', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }
    
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;