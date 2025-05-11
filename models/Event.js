const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  images: [String], // Array of image paths
  youtubeUrls: [String] // Array of YouTube URLs
});

module.exports = mongoose.model("Event", eventSchema);