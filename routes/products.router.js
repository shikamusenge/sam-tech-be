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
router.post("/", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const imageData = req.files?.map(file => ({
        url: file.path,
        public_id: file.filename // provided by multer-storage-cloudinary
      })) || [];

      const newProduct = new Product({
        ...req.body,
        images: imageData
      });

      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (error) {
      // Cleanup uploaded images if creation fails
      if (req.files) {
        await Promise.all(
          req.files.map(file => cloudinary.uploader.destroy(file.filename))
        );
      }
      res.status(400).json({ message: error.message });
    }
  });
});

// Update a product
router.put("/:id", (req, res) => {
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

      // Add new images if uploaded
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({
          url: file.path,
          public_id: file.filename
        }));
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
      // Cleanup any new images if update fails
      if (req.files) {
        await Promise.all(
          req.files.map(file => cloudinary.uploader.destroy(file.filename))
        );
      }
      res.status(400).json({ message: error.message });
    }
  });
});

// Delete an individual image from a product
router.delete("/:id/images/:publicId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove image from Cloudinary
    await cloudinary.uploader.destroy(req.params.publicId);

    // Remove image from MongoDB document
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

    // Remove this product from all carts
    await Cart.updateMany(
      { 'items.product': req.params.id },
      { $pull: { items: { product: req.params.id } } }
    );

    // Delete all associated images from Cloudinary
    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images
          .filter(img => img.public_id)
          .map(img => cloudinary.uploader.destroy(img.public_id))
      );
    }

    // Delete the product from DB
    await product.deleteOne();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
