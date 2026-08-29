const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/routes
// @desc    Get all routes with origin/destination populated
// @access  Public (or Private)
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find()
      .populate('originStationId', 'stationCode name city address latitude longitude')
      .populate('destinationStationId', 'stationCode name city address latitude longitude')
      .sort({ createdAt: -1 });

    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/routes
// @desc    Create new route
// @access  Private (ADMIN)
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { routeCode, name, originStationId, destinationStationId, distanceKm, estimatedHours, waypoints } = req.body;

    if (!routeCode || !name || !originStationId || !destinationStationId || !distanceKm || !estimatedHours) {
      return res.status(400).json({ error: 'All route fields are required.' });
    }

    const route = await Route.create({
      routeCode: routeCode.toUpperCase(),
      name,
      originStationId,
      destinationStationId,
      distanceKm: Number(distanceKm),
      estimatedHours: Number(estimatedHours),
      waypoints: waypoints || [],
    });

    const populated = await Route.findById(route._id)
      .populate('originStationId')
      .populate('destinationStationId');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/routes/:id
// @desc    Update route
// @access  Private (ADMIN)
router.patch('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('originStationId')
      .populate('destinationStationId');

    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }

    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/routes/:id
// @desc    Delete route
// @access  Private (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found.' });
    }
    res.json({ message: 'Route deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
