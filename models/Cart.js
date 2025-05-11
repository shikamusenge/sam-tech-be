const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 1 
  },
  // Store product details directly
  title: String,
  description: String,
  images: [String],
  price: String
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  items: [cartItemSchema],
  expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model("Cart", cartSchema);