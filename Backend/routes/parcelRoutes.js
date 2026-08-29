const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const ParcelLocation = require('../models/ParcelLocation');
const ParcelStatusHistory = require('../models/ParcelStatusHistory');
const ParcelIssue = require('../models/ParcelIssue');
const IoTTracker = require('../models/IoTTracker');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { generateTrackingNumber } = require('../utils/generateCode');

// @route   GET /api/parcels
// @desc    Get parcels (Station-restricted for PARCEL_AGENT, own for CUSTOMER, all for ADMIN)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, stationId, search, limit = 50 } = req.query;
    let query = {};

    if (req.user.role === 'CUSTOMER') {
      query.$or = [
        { customerId: req.user._id },
        { senderEmail: req.user.email },
        ...(req.user.phone ? [{ senderPhone: req.user.phone }, { recipientPhone: req.user.phone }] : [])
      ];
    } else if (req.user.role === 'PARCEL_AGENT') {
      if (req.user.stationId) {
        const agentStationId = req.user.stationId._id || req.user.stationId;
        query.$or = [
          { originStationId: agentStationId },
          { destinationStationId: agentStationId },
          { currentStationId: agentStationId },
        ];
      }
    } else if (req.user.role === 'ADMIN') {
      if (stationId) {
        query.$or = [
          { originStationId: stationId },
          { destinationStationId: stationId },
        ];
      }
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { trackingNumber: searchRegex },
          { senderName: searchRegex },
          { recipientName: searchRegex },
          { senderPhone: searchRegex },
          { recipientPhone: searchRegex },
          { description: searchRegex },
        ]
      });
    }

    const parcels = await Parcel.find(query)
      .populate('originStationId', 'stationCode name city address')
      .populate('destinationStationId', 'stationCode name city address')
      .populate('currentStationId', 'stationCode name city')
      .populate('tripId', 'tripNumber busNumber departureScheduled status')
      .populate('trackerId', 'trackerCode batteryLevel status lastLatitude lastLongitude lastSpeed lastPing')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(parcels);
  } catch (error) {
    console.error('Fetch parcels error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/parcels
// @desc    Register a new parcel (Parcel Agent, Admin, Customer)
// @access  Private
router.post('/', protect, authorize('PARCEL_AGENT', 'ADMIN', 'CUSTOMER'), async (req, res) => {
  try {
    const {
      senderName,
      senderPhone,
      senderEmail,
      recipientName,
      recipientPhone,
      recipientAddress,
      originStationId,
      destinationStationId,
      weightKg,
      declaredValue,
      description,
      trackerId,
      tripId,
    } = req.body;

    if (!senderName || !senderPhone || !recipientName || !recipientPhone || !originStationId || !destinationStationId || !weightKg) {
      return res.status(400).json({ error: 'Please provide all mandatory parcel details.' });
    }

    // Auto-generate unique tracking number
    let trackingNumber = generateTrackingNumber();
    let existing = await Parcel.findOne({ trackingNumber });
    while (existing) {
      trackingNumber = generateTrackingNumber();
      existing = await Parcel.findOne({ trackingNumber });
    }

    // Handle IoT tracker assignment if chosen
    let assignedTrackerId = null;
    if (trackerId) {
      const tracker = await IoTTracker.findById(trackerId);
      if (tracker) {
        assignedTrackerId = tracker._id;
        tracker.status = 'ASSIGNED';
        await tracker.save();
      }
    }

    const newParcel = await Parcel.create({
      trackingNumber,
      customerId: req.user.role === 'CUSTOMER' ? req.user._id : req.body.customerId || null,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      senderEmail: senderEmail ? senderEmail.trim().toLowerCase() : '',
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      recipientAddress: recipientAddress || '',
      originStationId,
      destinationStationId,
      currentStationId: originStationId,
      tripId: tripId || null,
      weightKg: Number(weightKg),
      declaredValue: declaredValue ? Number(declaredValue) : 0,
      description: description || '',
      status: 'REGISTERED',
      trackerId: assignedTrackerId,
    });

    // Record initial status history
    await ParcelStatusHistory.create({
      parcelId: newParcel._id,
      status: 'REGISTERED',
      stationId: originStationId,
      updatedBy: req.user._id,
      notes: 'Parcel registered in the system.',
    });

    // In-app notification
    await Notification.create({
      userId: req.user.role === 'CUSTOMER' ? req.user._id : null,
      trackingNumber: newParcel.trackingNumber,
      title: 'Parcel Registered',
      message: `Parcel ${newParcel.trackingNumber} has been registered successfully.`,
      type: 'SUCCESS',
      stationId: originStationId,
    });

    const populatedParcel = await Parcel.findById(newParcel._id)
      .populate('originStationId')
      .populate('destinationStationId')
      .populate('trackerId');

    res.status(201).json(populatedParcel);
  } catch (error) {
    console.error('Create parcel error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/parcels/:id
// @desc    Get parcel details, issues, timeline, and location
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate('originStationId')
      .populate('destinationStationId')
      .populate('currentStationId')
      .populate({
        path: 'tripId',
        populate: { path: 'driverId', select: 'name phone email' }
      })
      .populate('trackerId')
      .populate('customerId', 'name email phone');

    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found.' });
    }

    const history = await ParcelStatusHistory.find({ parcelId: parcel._id })
      .populate('stationId', 'name city')
      .populate('updatedBy', 'name role')
      .sort({ timestamp: 1 });

    const issues = await ParcelIssue.find({ parcelId: parcel._id })
      .sort({ reportedAt: -1 });

    let latestLocation = null;
    let locations = [];
    if (parcel.trackerId) {
      locations = await ParcelLocation.find({ parcelId: parcel._id })
        .sort({ timestamp: -1 })
        .limit(30);
      if (locations.length > 0) {
        latestLocation = locations[0];
      }
    }

    res.json({
      parcel,
      history,
      issues,
      latestLocation,
      locationHistory: locations.reverse(),
    });
  } catch (error) {
    console.error('Get parcel error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/parcels/:id/status
// @desc    Update parcel status
// @access  Private (PARCEL_AGENT, ADMIN, DRIVER)
router.patch('/:id/status', protect, authorize('PARCEL_AGENT', 'ADMIN', 'DRIVER'), async (req, res) => {
  try {
    const { status, notes, currentStationId, tripId } = req.body;

    const validStatuses = [
      'REGISTERED',
      'RECEIVED',
      'LOADED',
      'IN_TRANSIT',
      'ARRIVED',
      'DELIVERED',
      'MISSING',
      'DAMAGED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status '${status}'.` });
    }

    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found.' });
    }

    parcel.status = status;
    if (currentStationId) parcel.currentStationId = currentStationId;
    if (tripId) parcel.tripId = tripId;

    // If delivered, mark tracker as AVAILABLE again
    if (status === 'DELIVERED' && parcel.trackerId) {
      await IoTTracker.findByIdAndUpdate(parcel.trackerId, { status: 'AVAILABLE' });
    }

    await parcel.save();

    // Log status transition
    await ParcelStatusHistory.create({
      parcelId: parcel._id,
      status,
      stationId: currentStationId || req.user.stationId || parcel.originStationId,
      updatedBy: req.user._id,
      notes: notes || `Status updated to ${status} by ${req.user.name}`,
    });

    // Send notification
    await Notification.create({
      userId: parcel.customerId,
      trackingNumber: parcel.trackingNumber,
      title: `Status: ${status}`,
      message: `Parcel ${parcel.trackingNumber} is now ${status.replace('_', ' ')}.`,
      type: status === 'DAMAGED' || status === 'MISSING' ? 'ALERT' : 'INFO',
      stationId: parcel.currentStationId,
    });

    const updated = await Parcel.findById(parcel._id)
      .populate('originStationId')
      .populate('destinationStationId')
      .populate('currentStationId')
      .populate('tripId')
      .populate('trackerId');

    res.json(updated);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/parcels/:id/tracker
// @desc    Assign or unassign IoT Tracker to parcel
// @access  Private (PARCEL_AGENT, ADMIN)
router.post('/:id/tracker', protect, authorize('PARCEL_AGENT', 'ADMIN'), async (req, res) => {
  try {
    const { trackerId } = req.body;
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found.' });
    }

    // If unassigning
    if (!trackerId) {
      if (parcel.trackerId) {
        await IoTTracker.findByIdAndUpdate(parcel.trackerId, { status: 'AVAILABLE' });
      }
      parcel.trackerId = null;
      await parcel.save();
      return res.json({ message: 'Tracker unassigned successfully.', parcel });
    }

    // If assigning new tracker
    const tracker = await IoTTracker.findById(trackerId);
    if (!tracker) {
      return res.status(404).json({ error: 'IoT Tracker device not found.' });
    }

    // Release old tracker if any
    if (parcel.trackerId && parcel.trackerId.toString() !== trackerId) {
      await IoTTracker.findByIdAndUpdate(parcel.trackerId, { status: 'AVAILABLE' });
    }

    parcel.trackerId = tracker._id;
    await parcel.save();

    tracker.status = 'ASSIGNED';
    await tracker.save();

    res.json({ message: `IoT Tracker ${tracker.trackerCode} assigned successfully.`, parcel });
  } catch (error) {
    console.error('Assign tracker error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/parcels/:id/issues
// @desc    Authenticated user report issue
// @access  Private
router.post('/:id/issues', protect, async (req, res) => {
  try {
    const { issueType, description } = req.body;
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found.' });
    }

    if (!issueType || !description) {
      return res.status(400).json({ error: 'Issue type and description are required.' });
    }

    const issue = await ParcelIssue.create({
      parcelId: parcel._id,
      trackingNumber: parcel.trackingNumber,
      customerId: req.user._id,
      reporterName: req.user.name,
      reporterPhone: req.user.phone || 'N/A',
      issueType,
      description,
      status: 'OPEN',
    });

    await Notification.create({
      trackingNumber: parcel.trackingNumber,
      title: `Issue: ${issueType}`,
      message: `Issue reported for ${parcel.trackingNumber}: ${description}`,
      type: 'WARNING',
      stationId: parcel.originStationId,
    });

    res.status(201).json(issue);
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/parcels/issues
// @desc    List all parcel issues
// @access  Private (PARCEL_AGENT, ADMIN)
router.get('/issues/all', protect, authorize('PARCEL_AGENT', 'ADMIN'), async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const issues = await ParcelIssue.find(query)
      .populate('parcelId')
      .populate('customerId', 'name email phone')
      .populate('resolvedBy', 'name')
      .sort({ reportedAt: -1 });

    res.json(issues);
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/parcels/issues/:issueId
// @desc    Resolve or update issue status
// @access  Private (PARCEL_AGENT, ADMIN)
router.patch('/issues/:issueId', protect, authorize('PARCEL_AGENT', 'ADMIN'), async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const issue = await ParcelIssue.findById(req.params.issueId);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    if (status) issue.status = status;
    if (resolutionNotes) issue.resolutionNotes = resolutionNotes;
    if (status === 'RESOLVED' || status === 'REJECTED') {
      issue.resolvedAt = Date.now();
      issue.resolvedBy = req.user._id;
    }

    await issue.save();
    res.json(issue);
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
