const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');

// Create a new order
router.post('/', async (req, res) => {
  try {
    const { userId, cartId, deliveryLocation, phoneNumber } = req.body;

    // Validate phone number
    if (!phoneNumber || phoneNumber.trim() === '') {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Validate delivery location
    const googleMapsRegex = /^(https?:\/\/)?(www\.)?(google\.[a-z]+\/maps|maps\.google\.[a-z]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i;
    if (!deliveryLocation || !googleMapsRegex.test(deliveryLocation)) {
      return res.status(400).json({ 
        error: 'Valid Google Maps link is required. Accepted formats: google.com/maps, maps.google.com, maps.app.goo.gl, or goo.gl/maps' 
      });
    }

    // Get the cart
    const cart = await Cart.findOne({ userId, _id: cartId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);

    // Create order items with product details
    const orderItems = cart.items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      title: item.title,
      description: item.description,
      images: item.images,
      price: item.price,
      purchasedPrice: item.price
    }));

    const newOrder = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      deliveryLocation,
      phoneNumber,
      status: 'pending'
    });

    const savedOrder = await newOrder.save();
    
    // Clear the cart after order is placed
    await Cart.findByIdAndDelete(cart._id);
    
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders for a user
router.get('/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email phoneNumber')
      .populate('items.product', 'title price');
      
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;