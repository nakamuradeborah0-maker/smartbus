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
// @desc    Authenticate user & get token (supports username, login, or email)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const rawIdentifier = req.body.login || req.body.email || req.body.username || '';
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(400).json({ error: 'Please provide username/email and password.' });
    }

    const cleanIdentifier = String(rawIdentifier).trim().toLowerCase();

    // Find by email, username, or name
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { username: cleanIdentifier },
        { name: new RegExp('^' + cleanIdentifier + '$', 'i') }
      ]
    }).populate('stationId');

    if (!user) {
      return res.status(401).json({ error: 'User not found. Please check your login credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
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
    let user = null;

    if (roleKey === 'DEBORA') {
      user = await User.findOne({
        $or: [
          { username: 'debora' },
          { email: 'debora@globalvoyage.com' },
          { name: /debora/i }
        ]
      }).populate('stationId');
    } else if (roleKey === 'ADMIN') {
      user = await User.findOne({ role: 'ADMIN' }).populate('stationId');
    } else if (roleKey === 'PARCEL_AGENT_DOUALA') {
      const doualaStation = await Station.findOne({ city: /Douala/i });
      user = await User.findOne({ role: 'PARCEL_AGENT', stationId: doualaStation ? doualaStation._id : { $exists: true } }).populate('stationId');
    } else if (roleKey === 'PARCEL_AGENT_YAOUNDE') {
      const yaoundeStation = await Station.findOne({ city: /Yaound/i });
      user = await User.findOne({ role: 'PARCEL_AGENT', stationId: yaoundeStation ? yaoundeStation._id : { $exists: true } }).populate('stationId');
    } else if (roleKey === 'DRIVER') {
      user = await User.findOne({ role: 'DRIVER' }).populate('stationId');
    } else if (roleKey === 'CUSTOMER') {
      user = await User.findOne({ role: 'CUSTOMER' }).populate('stationId');
    } else {
      user = await User.findOne({ role: 'ADMIN' }).populate('stationId');
    }

    if (!user) {
      return res.status(404).json({ error: `Demo account for '${roleKey}' not found.` });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
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
        username: req.user.username,
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
