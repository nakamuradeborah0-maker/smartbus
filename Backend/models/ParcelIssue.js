const mongoose = require('mongoose');

const parcelIssueSchema = new mongoose.Schema({
  parcelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parcel',
    required: true,
  },
  trackingNumber: {
    type: String,
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Nullable for public issue reporting
  },
  reporterName: {
    type: String,
    required: true,
    trim: true,
  },
  reporterPhone: {
    type: String,
    required: true,
    trim: true,
  },
  issueType: {
    type: String,
    enum: ['MISSING', 'DAMAGED', 'DELAYED', 'WRONG_LOCATION', 'OTHER'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'REJECTED'],
    default: 'OPEN',
  },
  resolutionNotes: {
    type: String,
    default: '',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('ParcelIssue', parcelIssueSchema);
