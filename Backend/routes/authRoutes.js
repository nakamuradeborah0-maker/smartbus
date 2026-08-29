const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Station = require('../models/Station');
const { protect } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'global_voyage_jwt_secret_key_2026_super_secure_token',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new customer account
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'CUSTOMER',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        stationId: null,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('stationId');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        stationId: user.stationId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/demo-login
// @desc    Fast one-click demo login for UI review
// @access  Public
router.post('/demo-login', async (req, res) => {
  try {
    const { roleKey } = req.body;
    let query = {};

    if (roleKey === 'ADMIN') {
      query = { role: 'ADMIN' };
    } else if (roleKey === 'PARCEL_AGENT_DOUALA') {
      const doualaStation = await Station.findOne({ city: /Douala/i });
      query = { role: 'PARCEL_AGENT', stationId: doualaStation ? doualaStation._id : { $exists: true } };
    } else if (roleKey === 'PARCEL_AGENT_YAOUNDE') {
      const yaoundeStation = await Station.findOne({ city: /Yaound/i });
      query = { role: 'PARCEL_AGENT', stationId: yaoundeStation ? yaoundeStation._id : { $exists: true } };
    } else if (roleKey === 'DRIVER') {
      query = { role: 'DRIVER' };
    } else if (roleKey === 'CUSTOMER') {
      query = { role: 'CUSTOMER' };
    } else {
      query = { role: 'ADMIN' };
    }

    const user = await User.findOne(query).populate('stationId');
    if (!user) {
      return res.status(404).json({ error: `Demo account for role '${roleKey}' not found.` });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        stationId: user.stationId,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        stationId: req.user.stationId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
