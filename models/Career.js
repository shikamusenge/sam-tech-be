const mongoose = require("mongoose");

const CareerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  pdfUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Career", CareerSchema);