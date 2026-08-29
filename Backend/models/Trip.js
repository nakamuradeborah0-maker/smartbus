const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  busNumber: {
    type: String,
    required: true,
    trim: true,
  },
  departureScheduled: {
    type: Date,
    required: true,
  },
  departureActual: {
    type: Date,
    default: null,
  },
  arrivalScheduled: {
    type: Date,
    required: true,
  },
  arrivalActual: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'CANCELLED'],
    default: 'SCHEDULED',
  },
  incidentReport: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Trip', tripSchema);
