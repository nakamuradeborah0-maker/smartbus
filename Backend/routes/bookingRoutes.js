const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Optional auth helper: if bearer token exists and is valid, attach req.user, else continue as guest
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
    // invalid token, proceed without user
    req.user = null;
  }
  next();
};

// Generate human-friendly booking reference like BK-2026-87421
function generateBookingReference() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `BK-${year}-${rand}`;
}

// @route   GET /api/bookings
// @desc    Get user bookings or public filter by phone / reference / all for admin
// @access  Public / Authenticated
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { phone, reference, search, date } = req.query;
    let query = {};

    if (req.user) {
      if (req.user.role === 'ADMIN' || req.user.role === 'PARCEL_AGENT') {
        // Admin sees all, optional filters
        if (search) {
          query.$or = [
            { bookingReference: new RegExp(search, 'i') },
            { passengerName: new RegExp(search, 'i') },
            { passengerPhone: new RegExp(search, 'i') },
          ];
        }
      } else {
        // Customer sees their own
        query.$or = [
          { userId: req.user._id },
          { passengerPhone: req.user.phone },
          { passengerEmail: req.user.email }
        ];
      }
    } else {
      // Guest query
      if (phone) {
        query.passengerPhone = new RegExp(phone.replace(/\D/g, ''), 'i');
      } else if (reference) {
        query.bookingReference = reference.toUpperCase().trim();
      } else {
        // Return latest public demo bookings or recent 20
        query = {};
      }
    }

    if (date) {
      query.travelDate = date;
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(bookings);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking in MongoDB
// @access  Public / Authenticated
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      tripId,
      tripNumber,
      busModel,
      passengerName,
      passengerIdNumber,
      passengerEmail,
      passengerPhone,
      origin,
      destination,
      travelDate,
      departureTime,
      seatNumber,
      seatLabel,
      amount,
      paymentMethod,
      paymentStatus,
      campayReference,
      campayOperator,
      campayUssdCode,
      externalReference
    } = req.body;

    if (!passengerName || !passengerPhone || !origin || !destination || !travelDate || !seatNumber) {
      return res.status(400).json({ error: 'Missing required booking fields (passengerName, passengerPhone, origin, destination, travelDate, seatNumber).' });
    }

    let bookingReference = generateBookingReference();
    let existing = await Booking.findOne({ bookingReference });
    while (existing) {
      bookingReference = generateBookingReference();
      existing = await Booking.findOne({ bookingReference });
    }

    const booking = await Booking.create({
      bookingReference,
      userId: req.user ? req.user._id : null,
      tripId: tripId || null,
      tripNumber: tripNumber || 'GV-1025',
      busModel: busModel || 'Scania VIP First Class',
      passengerName: passengerName.trim(),
      passengerIdNumber: passengerIdNumber ? passengerIdNumber.trim() : '',
      passengerEmail: passengerEmail ? passengerEmail.trim() : '',
      passengerPhone: passengerPhone.trim(),
      origin,
      destination,
      travelDate,
      departureTime: departureTime || '06:30',
      seatNumber: Number(seatNumber),
      seatLabel: seatLabel || `Siège N° ${seatNumber}`,
      amount: Number(amount) || 5000,
      paymentMethod: paymentMethod === 'ORANGE_MONEY' || paymentMethod === 'OM' ? 'ORANGE_MONEY' : 'MTN_MOMO',
      paymentStatus: paymentStatus || 'PENDING',
      campayReference: campayReference || '',
      campayOperator: campayOperator || '',
      campayUssdCode: campayUssdCode || '',
      externalReference: externalReference || `GV-${Date.now()}`,
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID or reference
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let booking = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingReference: id.toUpperCase().trim() });
    }
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/bookings/:id/confirm
// @desc    Confirm booking payment (marks as PAID)
// @access  Public / Authenticated
router.patch('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { campayReference, paymentStatus } = req.body;
    let booking = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({
        $or: [
          { bookingReference: id.toUpperCase().trim() },
          { campayReference: id },
          { externalReference: id }
        ]
      });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found to confirm.' });
    }

    booking.paymentStatus = paymentStatus || 'PAID';
    if (campayReference) booking.campayReference = campayReference;
    booking.updatedAt = Date.now();
    await booking.save();

    res.json({ success: true, message: 'Booking confirmed and marked as PAID.', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Public / Authenticated
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    let booking = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingReference: id.toUpperCase().trim() });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    booking.paymentStatus = 'CANCELLED';
    booking.updatedAt = Date.now();
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled.', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
