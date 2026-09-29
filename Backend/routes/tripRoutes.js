const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Trip = require('../models/Trip');
const Parcel = require('../models/Parcel');
const ParcelStatusHistory = require('../models/ParcelStatusHistory');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { generateTripNumber } = require('../utils/generateCode');

// Optional auth helper
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey12345');
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

// @route   GET /api/trips
// @desc    List trips (scoped to driver for DRIVER role, all for public/customer/admin)
// @access  Public / Authenticated
router.get('/', optionalAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === 'DRIVER') {
      query.driverId = req.user._id;
    }

    const { date, status } = req.query;
    if (status) {
      query.status = status.toUpperCase();
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.departureScheduled = { $gte: startDate, $lte: endDate };
    }

    const trips = await Trip.find(query)
      .populate({
        path: 'routeId',
        populate: [
          { path: 'originStationId', select: 'name city stationCode latitude longitude' },
          { path: 'destinationStationId', select: 'name city stationCode latitude longitude' }
        ]
      })
      .populate('driverId', 'name phone email')
      .sort({ departureScheduled: 1 });

    res.json(trips);
  } catch (error) {
    console.error('Fetch trips error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/trips
// @desc    Create a new scheduled trip
// @access  Private (ADMIN)
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { routeId, driverId, busNumber, departureScheduled, arrivalScheduled } = req.body;

    if (!routeId || !driverId || !busNumber || !departureScheduled || !arrivalScheduled) {
      return res.status(400).json({ error: 'All trip parameters are required.' });
    }

    let tripNumber = generateTripNumber();
    let existing = await Trip.findOne({ tripNumber });
    while (existing) {
      tripNumber = generateTripNumber();
      existing = await Trip.findOne({ tripNumber });
    }

    const trip = await Trip.create({
      tripNumber,
      routeId,
      driverId,
      busNumber: busNumber.trim(),
      departureScheduled,
      arrivalScheduled,
      status: 'SCHEDULED',
    });

    const populated = await Trip.findById(trip._id)
      .populate({
        path: 'routeId',
        populate: [
          { path: 'originStationId', select: 'name city stationCode' },
          { path: 'destinationStationId', select: 'name city stationCode' }
        ]
      })
      .populate('driverId', 'name phone email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/trips/:id/departure
// @desc    Confirm departure of a trip (switches loaded parcels to IN_TRANSIT)
// @access  Private (DRIVER, ADMIN)
router.patch('/:id/departure', protect, authorize('DRIVER', 'ADMIN'), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('routeId');
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    trip.status = 'IN_TRANSIT';
    trip.departureActual = Date.now();
    await trip.save();

    // Automatically transition all LOADED parcels on this trip to IN_TRANSIT
    const loadedParcels = await Parcel.find({ tripId: trip._id, status: { $in: ['LOADED', 'REGISTERED', 'RECEIVED'] } });
    for (const p of loadedParcels) {
      p.status = 'IN_TRANSIT';
      await p.save();

      await ParcelStatusHistory.create({
        parcelId: p._id,
        status: 'IN_TRANSIT',
        stationId: trip.routeId ? trip.routeId.originStationId : null,
        updatedBy: req.user._id,
        notes: `Trip ${trip.tripNumber} departed. Parcel is now in transit.`,
      });

      await Notification.create({
        userId: p.customerId,
        trackingNumber: p.trackingNumber,
        title: 'Parcel In Transit',
        message: `Parcel ${p.trackingNumber} has departed on Trip ${trip.tripNumber} (${trip.busNumber}).`,
        type: 'INFO',
      });
    }

    res.json({
      message: `Trip ${trip.tripNumber} departed. ${loadedParcels.length} parcel(s) transitioned to IN_TRANSIT.`,
      trip,
    });
  } catch (error) {
    console.error('Confirm departure error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/trips/:id/arrival
// @desc    Confirm arrival of a trip (switches parcels to ARRIVED)
// @access  Private (DRIVER, ADMIN)
router.patch('/:id/arrival', protect, authorize('DRIVER', 'ADMIN'), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('routeId');
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    trip.status = 'ARRIVED';
    trip.arrivalActual = Date.now();
    await trip.save();

    // Automatically transition in-transit parcels on this trip to ARRIVED
    const inTransitParcels = await Parcel.find({ tripId: trip._id, status: 'IN_TRANSIT' });
    for (const p of inTransitParcels) {
      p.status = 'ARRIVED';
      if (trip.routeId && trip.routeId.destinationStationId) {
        p.currentStationId = trip.routeId.destinationStationId;
      }
      await p.save();

      await ParcelStatusHistory.create({
        parcelId: p._id,
        status: 'ARRIVED',
        stationId: trip.routeId ? trip.routeId.destinationStationId : null,
        updatedBy: req.user._id,
        notes: `Trip ${trip.tripNumber} arrived at destination station.`,
      });

      await Notification.create({
        userId: p.customerId,
        trackingNumber: p.trackingNumber,
        title: 'Parcel Arrived',
        message: `Parcel ${p.trackingNumber} has arrived at destination station on Trip ${trip.tripNumber}. Ready for collection.`,
        type: 'SUCCESS',
      });
    }

    res.json({
      message: `Trip ${trip.tripNumber} arrived. ${inTransitParcels.length} parcel(s) marked as ARRIVED.`,
      trip,
    });
  } catch (error) {
    console.error('Confirm arrival error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/trips/:id/incident
// @desc    Report incident/delay on trip
// @access  Private (DRIVER, ADMIN)
router.patch('/:id/incident', protect, authorize('DRIVER', 'ADMIN'), async (req, res) => {
  try {
    const { incidentReport } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    trip.incidentReport = incidentReport;
    await trip.save();

    res.json({ message: 'Incident reported successfully.', trip });
  } catch (error) {
    console.error('Report incident error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/trips/:id
// @desc    Delete a trip
// @access  Private (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }
    res.json({ message: 'Trip deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
