const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String, required: true }
    }
  ], // Changed from image to images (array)
  price: String,
  discount: String,
});

module.exports = mongoose.model("Product", productSchema);