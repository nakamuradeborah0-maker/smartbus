const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/stations
// @desc    Get all active stations
// @access  Public (or Private)
router.get('/', async (req, res) => {
  try {
    const stations = await Station.find().sort({ city: 1 });
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/stations
// @desc    Create new station
// @access  Private (ADMIN)
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { stationCode, name, city, address, phone, latitude, longitude } = req.body;

    if (!stationCode || !name || !city || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'All station parameters are required.' });
    }

    const station = await Station.create({
      stationCode: stationCode.toUpperCase(),
      name,
      city,
      address,
      phone: phone || '',
      latitude: Number(latitude),
      longitude: Number(longitude),
    });

    res.status(201).json(station);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/stations/:id
// @desc    Update station
// @access  Private (ADMIN)
router.patch('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!station) {
      return res.status(404).json({ error: 'Station not found.' });
    }
    res.json(station);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/stations/:id
// @desc    Delete/Deactivate station
// @access  Private (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found.' });
    }
    res.json({ message: 'Station deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
