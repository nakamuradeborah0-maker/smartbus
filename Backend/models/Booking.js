const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null,
  },
  tripNumber: {
    type: String,
    required: true,
    trim: true,
  },
  busModel: {
    type: String,
    default: 'Scania VIP First Class',
  },
  passengerName: {
    type: String,
    required: true,
    trim: true,
  },
  passengerIdNumber: {
    type: String,
    default: '',
    trim: true,
  },
  passengerEmail: {
    type: String,
    default: '',
    trim: true,
  },
  passengerPhone: {
    type: String,
    required: true,
    trim: true,
  },
  origin: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  travelDate: {
    type: String,
    required: true,
  },
  departureTime: {
    type: String,
    required: true,
  },
  seatNumber: {
    type: Number,
    required: true,
  },
  seatLabel: {
    type: String,
    default: '',
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['MTN_MOMO', 'ORANGE_MONEY'],
    default: 'MTN_MOMO',
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'CANCELLED', 'FAILED'],
    default: 'PENDING',
    index: true,
  },
  campayReference: {
    type: String,
    default: '',
    trim: true,
  },
  campayOperator: {
    type: String,
    default: '',
  },
  campayUssdCode: {
    type: String,
    default: '',
  },
  externalReference: {
    type: String,
    default: '',
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

bookingSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Booking', bookingSchema);
