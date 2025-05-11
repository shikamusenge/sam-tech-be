const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  images: [String], // Changed from image to images (array)
  price: String,
});

module.exports = mongoose.model("Product", productSchema);