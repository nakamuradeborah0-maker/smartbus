const mongoose = require('mongoose');

const parcelLocationSchema = new mongoose.Schema({
  parcelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parcel',
    required: true,
    index: true,
  },
  trackerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IoTTracker',
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  speed: {
    type: Number,
    default: 0,
  },
  batteryLevel: {
    type: Number,
    default: 100,
  },
  locationName: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model('ParcelLocation', parcelLocationSchema);
