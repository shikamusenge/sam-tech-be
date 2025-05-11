const express = require('express');
const mongoose = require('mongoose');
const Express = require('express');
const Order = require('./models/Order');
const app = Express.Router();
if(process.env.NODE_ENV !== 'production'){
  const dotenv = require('dotenv');
  dotenv.config();
  }
app.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { _id: mongoose.Types.ObjectId.isValid(search) ? new mongoose.Types.ObjectId(search) : null },
        { 'user.email': { $regex: searchRegex } },
        { 'items.title': { $regex: searchRegex } },
        { 'items.description': { $regex: searchRegex } },
        { deliveryLocation: { $regex: searchRegex } }
      ].filter(Boolean);
    }

    const orders = await Order.find(query)
      .populate('user', 'email username')
      .sort({ createdAt: -1 });
      
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Start Server
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;