const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  title: String,
  description: String,
  images: [String],
  price: String,
  purchasedPrice: String
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryLocation: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?(www\.)?(google\.[a-z]+\/maps|maps\.google\.[a-z]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(v);
      },
      message: props => `${props.value} is not a valid Google Maps link!`
    }
  },
  phoneNumber: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', OrderSchema);