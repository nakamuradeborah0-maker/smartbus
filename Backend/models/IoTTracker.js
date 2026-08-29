const mongoose = require('mongoose');

const ioTTrackerSchema = new mongoose.Schema({
  trackerCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  deviceModel: {
    type: String,
    default: 'GV-GPS-4G-v2',
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'ASSIGNED', 'OFFLINE', 'MAINTENANCE'],
    default: 'AVAILABLE',
  },
  lastLatitude: {
    type: Number,
    default: null,
  },
  lastLongitude: {
    type: Number,
    default: null,
  },
  lastSpeed: {
    type: Number,
    default: 0,
  },
  lastPing: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('IoTTracker', ioTTrackerSchema);
