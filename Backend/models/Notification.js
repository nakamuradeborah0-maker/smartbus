const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  role: {
    type: String,
    default: null, // If targeted at a role like 'PARCEL_AGENT' or 'ADMIN'
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    default: null,
  },
  trackingNumber: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['INFO', 'SUCCESS', 'WARNING', 'ALERT'],
    default: 'INFO',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
