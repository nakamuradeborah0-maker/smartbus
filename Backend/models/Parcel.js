const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
  },
  senderPhone: {
    type: String,
    required: true,
    trim: true,
  },
  senderEmail: {
    type: String,
    trim: true,
    default: '',
  },
  recipientName: {
    type: String,
    required: true,
    trim: true,
  },
  recipientPhone: {
    type: String,
    required: true,
    trim: true,
  },
  recipientAddress: {
    type: String,
    default: '',
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
  currentStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    default: null,
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null,
  },
  weightKg: {
    type: Number,
    required: true,
    min: 0.1,
  },
  declaredValue: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: [
      'REGISTERED',
      'RECEIVED',
      'LOADED',
      'IN_TRANSIT',
      'ARRIVED',
      'DELIVERED',
      'MISSING',
      'DAMAGED'
    ],
    default: 'REGISTERED',
  },
  trackerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IoTTracker',
    default: null, // Nullable: GPS tracking is optional
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

parcelSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Parcel', parcelSchema);
