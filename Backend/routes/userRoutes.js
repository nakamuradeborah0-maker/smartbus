const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// All user management routes require ADMIN
router.use(protect);
router.use(authorize('ADMIN'));

// @route   GET /api/users
// @desc    List all users with optional role & station filter
// @access  Private (ADMIN)
router.get('/', async (req, res) => {
  try {
    const { role, stationId } = req.query;
    let query = {};
    if (role) query.role = role;
    if (stationId) query.stationId = stationId;

    const users = await User.find(query)
      .select('-password')
      .populate('stationId', 'name city stationCode')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/users
// @desc    Create a new user (Staff or Customer)
// @access  Private (ADMIN)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, role, stationId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role,
      stationId: role === 'PARCEL_AGENT' ? stationId : null,
    });

    const populated = await User.findById(user._id).select('-password').populate('stationId');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/users/:id
// @desc    Update user details, role, or assigned station
// @access  Private (ADMIN)
router.patch('/:id', async (req, res) => {
  try {
    const { name, phone, role, stationId, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (stationId !== undefined) user.stationId = stationId || null;
    if (password) user.password = password; // Will be hashed by pre-save hook

    await user.save();
    const updated = await User.findById(user._id).select('-password').populate('stationId');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (ADMIN)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
