const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const { cloudinary, upload } = require("../config/cloudinary");

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
      const imageData = req.files?.map(file => ({
        url: file.path,
        public_id: file.filename
      })) || [];
      
      const newProduct = new Product({
        ...req.body,
        images: imageData
      });
      
      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (error) {
      console.log(error);
      
      // Delete uploaded images if product creation fails
      if (req.files) {
        req.files.forEach(file => {
          cloudinary.uploader.destroy(file.filename);
        });
      }
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
      let existingImages = product.images || [];
      
      // Add new images if any were uploaded
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({
          url: file.path,
          public_id: file.filename
        }));
        existingImages = [...newImages];
      }
      
      updateData.images = existingImages;
      
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
      
      res.json(updatedProduct);
    } catch (error) {
      // Delete newly uploaded images if update fails
      if (req.files) {
        req.files.forEach(file => {
          cloudinary.uploader.destroy(file.filename);
        });
      }
      res.status(400).json({ message: error.message });
    }
  });
});

// Delete individual image
router.delete("/:id/images/:publicId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove the image from Cloudinary
    await cloudinary.uploader.destroy(req.params.publicId);

    // Remove the image from the array
    product.images = product.images.filter(img => img.public_id !== req.params.publicId);
    await product.save();

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

    // Delete all associated images from Cloudinary
    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images.map(image => 
          cloudinary.uploader.destroy(image.public_id)
        )
      );
    }

    // Then delete the product
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;