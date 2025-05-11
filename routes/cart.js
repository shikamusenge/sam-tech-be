const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Add item to cart
router.post("/", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    
    // Get the product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = new Cart({
        userId,
        items: [{
          product: productId,
          quantity,
          title: product.title,
          description: product.description,
          images: product.images,
          price: product.price
        }],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
    } else {
      const existingItem = cart.items.find(item => 
        item.product.toString() === productId
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          product: productId,
          quantity,
          title: product.title,
          description: product.description,
          images: product.images,
          price: product.price
        });
      }
      
      // Reset expiration on update
      cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's cart
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    
    if (!cart) {
      return res.status(200).json({ items: [] });
    }
    
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove item from cart
router.delete("/:userId/:productId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    cart.items = cart.items.filter(
      item => item.product.toString() !== req.params.productId
    );
    
    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update cart item quantity
router.put("/:userId/:productId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.params.userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      item => item.product.toString() === req.params.productId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = quantity;
    cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Reset expiration
    await cart.save();
    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cleanup expired carts (run this periodically)
const cleanupExpiredCarts = async () => {
  try {
    await Cart.deleteMany({ expiresAt: { $lt: new Date() } });
  } catch (err) {
    console.error("Error cleaning up expired carts:", err);
  }
};

// Run cleanup every 24 hours
setInterval(cleanupExpiredCarts, 24 * 60 * 60 * 1000);

module.exports = router;