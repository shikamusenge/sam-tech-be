const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Keep track of connected clients
const clients = new Set();

// Middleware to send updates to all clients
const sendUpdatesToAll = async () => {
  const messages = await Message.find().sort({ createdAt: -1 });
  const data = JSON.stringify(messages);
  clients.forEach(client => client.res.write(`data: ${data}\n\n`));
};

// Create a new message
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const newMessage = new Message({ name, email, phone, subject, message });
    await newMessage.save();
    await sendUpdatesToAll();
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error sending message' });
  }
});

// Get all messages with search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const messages = await Message.find(query).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Get single message and mark as read
router.get('/:id', async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    await sendUpdatesToAll();
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching message' });
  }
});

// Mark message as read
router.patch('/:id/read', async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    await sendUpdatesToAll();
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Error updating message' });
  }
});

// SSE endpoint for real-time updates
router.get('/stream/updates', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };

  clients.add(newClient);

  req.on('close', () => {
    clients.delete(newClient);
  });
});

module.exports = router;