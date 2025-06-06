const mongoose = require("mongoose");

const cartItemImageSchema = new mongoose.Schema({
  url: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/i.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  public_id: { type: String, required: true },
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
}, { _id: true });

const cartItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 1,
    min: [1, 'Quantity cannot be less than 1']
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    trim: true 
  },
  images: {
    type: [cartItemImageSchema],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one image is required'
    }
  },
  price: { 
    type: Number, 
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'User'
  },
  items: [cartItemSchema],
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expires: 0 } // Auto-delete when expiresAt is reached
  }
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);