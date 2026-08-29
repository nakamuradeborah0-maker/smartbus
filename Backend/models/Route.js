const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  originStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
  },
  destinationStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
  },
  distanceKm: {
    type: Number,
    required: true,
  },
  estimatedHours: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  },
  waypoints: [
    {
      name: String,
      latitude: Number,
      longitude: Number,
      order: Number,
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Route', routeSchema);
