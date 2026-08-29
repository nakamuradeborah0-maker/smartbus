const express = require('express');
const router = express.Router();
const IoTTracker = require('../models/IoTTracker');
const Parcel = require('../models/Parcel');
const ParcelLocation = require('../models/ParcelLocation');
const { protect, authorize } = require('../middleware/auth');
const { generateTrackerCode } = require('../utils/generateCode');

// @route   POST /api/iot/location
// @desc    Ingest real-time GPS telemetry from IoT Hardware / API
// @access  Public (IoT Device API endpoint with optional API key check)
router.post('/location', async (req, res) => {
  try {
    const { trackerCode, latitude, longitude, speed = 0, batteryLevel = 100, locationName = '' } = req.body;

    if (!trackerCode || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'trackerCode, latitude, and longitude are required.' });
    }

    const tracker = await IoTTracker.findOne({ trackerCode: trackerCode.toUpperCase() });
    if (!tracker) {
      return res.status(404).json({ error: `IoT Tracker '${trackerCode}' not registered.` });
    }

    tracker.lastLatitude = Number(latitude);
    tracker.lastLongitude = Number(longitude);
    tracker.lastSpeed = Number(speed);
    tracker.batteryLevel = Number(batteryLevel);
    tracker.lastPing = Date.now();
    await tracker.save();

    // Check if parcel is actively assigned to this tracker
    const activeParcel = await Parcel.findOne({
      trackerId: tracker._id,
      status: { $in: ['IN_TRANSIT', 'LOADED', 'REGISTERED'] }
    });

    let locationLog = null;
    if (activeParcel) {
      locationLog = await ParcelLocation.create({
        parcelId: activeParcel._id,
        trackerId: tracker._id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed: Number(speed),
        batteryLevel: Number(batteryLevel),
        locationName: locationName || 'Highway Telemetry',
        timestamp: Date.now(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'GPS Telemetry recorded successfully.',
      trackerCode: tracker.trackerCode,
      parcelId: activeParcel ? activeParcel._id : null,
      trackingNumber: activeParcel ? activeParcel.trackingNumber : null,
      coordinates: { latitude, longitude },
    });
  } catch (error) {
    console.error('IoT Location Ingestion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/iot/trackers
// @desc    List all IoT Tracker devices
// @access  Private
router.get('/trackers', protect, async (req, res) => {
  try {
    const trackers = await IoTTracker.find().sort({ trackerCode: 1 });
    res.json(trackers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/iot/trackers
// @desc    Register a new IoT hardware tracker
// @access  Private (ADMIN)
router.post('/trackers', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { deviceModel, trackerCode } = req.body;

    let code = trackerCode ? trackerCode.toUpperCase() : generateTrackerCode();
    let existing = await IoTTracker.findOne({ trackerCode: code });
    while (existing && !trackerCode) {
      code = generateTrackerCode();
      existing = await IoTTracker.findOne({ trackerCode: code });
    }

    const tracker = await IoTTracker.create({
      trackerCode: code,
      deviceModel: deviceModel || 'GV-GPS-4G-v2',
      batteryLevel: 100,
      status: 'AVAILABLE',
    });

    res.status(201).json(tracker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
