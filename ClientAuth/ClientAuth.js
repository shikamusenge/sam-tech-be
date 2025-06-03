const cors = require('cors');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express.Router();
const FRONTEND_URLSALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:5173';
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || FRONTEND_URLSALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS ${FRONTEND_URLSALLOWED_ORIGINS}`));
    }
  },
  credentials: true
}));
const JWT_SECRET = process.env.JWT_SECRET || 'RGphSK1512200055';
// Auth Middleware
// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.cookies.token;
//     if (!token) return res.status(401).json({ message: 'Not authenticated' });

//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.user = await User.findById(decoded.userId).select('-password');
//     next();
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

const authMiddleware = async (req, res, next) => {
  try {
    console.log('Cookies received:', req.cookies); // Debug: Check if cookies exist
    const token = req.cookies.token;
    if (!token) {
      console.log('No token found in cookies');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('Token found:', token); // Debug: Verify the token string
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded JWT:', decoded); // Debug: Check decoded payload

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('User not found in DB');
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT Error:', err.message); // Debug: Log the exact error
    res.status(401).json({ message: 'Invalid token' });
  }
};


// Middleware

const User = require('../models/User');

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, dateOfBirth, gender, phoneNumber, password, passwordRepeat } = req.body;
    
    // Validation
    if (password !== passwordRepeat) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      username,
      email,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      phoneNumber,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    res.json({ message: 'Logged in successfully',token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/user', authMiddleware, (req, res) => {
  res.json(req.user);
});

app.put('/api/user', async (req, res) => {
  try {
    const { username, email, dateOfBirth, gender, phoneNumber } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, email, dateOfBirth, gender, phoneNumber },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/user/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, newPasswordRepeat } = req.body;
    
    if (newPassword !== newPasswordRepeat) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = app;