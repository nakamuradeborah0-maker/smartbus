const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const ParcelLocation = require('../models/ParcelLocation');
const ParcelStatusHistory = require('../models/ParcelStatusHistory');
const ParcelIssue = require('../models/ParcelIssue');
const Notification = require('../models/Notification');

// @route   GET /api/parcels/track/:trackingNumber
// @desc    Public parcel tracking - No account or authentication required
// @access  Public
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const trackingNumber = req.params.trackingNumber.trim().toUpperCase();

    const parcel = await Parcel.findOne({ trackingNumber })
      .populate('originStationId', 'stationCode name city address latitude longitude')
      .populate('destinationStationId', 'stationCode name city address latitude longitude')
      .populate('currentStationId', 'stationCode name city')
      .populate({
        path: 'tripId',
        select: 'tripNumber busNumber departureScheduled arrivalScheduled status',
        populate: { path: 'driverId', select: 'name phone' }
      })
      .populate('trackerId', 'trackerCode batteryLevel status lastLatitude lastLongitude lastSpeed lastPing');

    if (!parcel) {
      return res.status(404).json({
        found: false,
        error: 'Parcel not found. Please verify the tracking number and try again.'
      });
    }

    // Fetch status history timeline
    const statusHistory = await ParcelStatusHistory.find({ parcelId: parcel._id })
      .populate('stationId', 'name city')
      .sort({ timestamp: 1 });

    // Fetch GPS telemetry if IoT tracker is attached
    let currentLocation = null;
    let locationHistory = [];

    if (parcel.trackerId) {
      const locations = await ParcelLocation.find({ parcelId: parcel._id })
        .sort({ timestamp: -1 })
        .limit(25);

      if (locations.length > 0) {
        currentLocation = {
          latitude: locations[0].latitude,
          longitude: locations[0].longitude,
          speed: locations[0].speed,
          batteryLevel: locations[0].batteryLevel,
          locationName: locations[0].locationName,
          timestamp: locations[0].timestamp,
        };
        locationHistory = locations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          speed: loc.speed,
          timestamp: loc.timestamp,
        })).reverse();
      } else if (parcel.trackerId.lastLatitude && parcel.trackerId.lastLongitude) {
        currentLocation = {
          latitude: parcel.trackerId.lastLatitude,
          longitude: parcel.trackerId.lastLongitude,
          speed: parcel.trackerId.lastSpeed || 0,
          batteryLevel: parcel.trackerId.batteryLevel,
          locationName: 'Active GPS Signal',
          timestamp: parcel.trackerId.lastPing,
        };
      }
    }

    // Clean public response (no sensitive customer passwords or confidential fields)
    res.json({
      found: true,
      parcel: {
        trackingNumber: parcel.trackingNumber,
        status: parcel.status,
        senderName: parcel.senderName,
        recipientName: parcel.recipientName,
        originStation: parcel.originStationId,
        destinationStation: parcel.destinationStationId,
        currentStation: parcel.currentStationId,
        trip: parcel.tripId,
        weightKg: parcel.weightKg,
        description: parcel.description,
        hasGpsTracking: Boolean(parcel.trackerId),
        trackerCode: parcel.trackerId ? parcel.trackerId.trackerCode : null,
        currentLocation,
        locationHistory,
        timeline: statusHistory.map(h => ({
          status: h.status,
          stationName: h.stationId ? h.stationId.name : null,
          stationCity: h.stationId ? h.stationId.city : null,
          notes: h.notes,
          timestamp: h.timestamp,
        })),
        createdAt: parcel.createdAt,
        updatedAt: parcel.updatedAt,
      },
    });
  } catch (error) {
    console.error('Public tracking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/parcels/public-issue
// @desc    Report parcel issue publicly without account
// @access  Public
router.post('/public-issue', async (req, res) => {
  try {
    const { trackingNumber, reporterName, reporterPhone, issueType, description } = req.body;

    if (!trackingNumber || !reporterName || !reporterPhone || !issueType || !description) {
      return res.status(400).json({ error: 'All fields are required to report an issue.' });
    }

    const parcel = await Parcel.findOne({ trackingNumber: trackingNumber.trim().toUpperCase() });
    if (!parcel) {
      return res.status(404).json({ error: 'No parcel found matching this tracking number.' });
    }

    const issue = await ParcelIssue.create({
      parcelId: parcel._id,
      trackingNumber: parcel.trackingNumber,
      customerId: null,
      reporterName: reporterName.trim(),
      reporterPhone: reporterPhone.trim(),
      issueType,
      description: description.trim(),
      status: 'OPEN',
    });

    // Notify agents
    await Notification.create({
      trackingNumber: parcel.trackingNumber,
      title: `Issue Reported: ${parcel.trackingNumber}`,
      message: `A customer reported a ${issueType} issue for parcel ${parcel.trackingNumber}.`,
      type: 'WARNING',
      stationId: parcel.originStationId,
    });

    res.status(201).json({
      success: true,
      message: 'Your issue has been reported to the station agents and is under review.',
      issue,
    });
  } catch (error) {
    console.error('Public issue error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
