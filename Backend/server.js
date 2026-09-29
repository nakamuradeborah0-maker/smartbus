require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const publicTrackRoutes = require('./routes/publicTrackRoutes');
const parcelRoutes = require('./routes/parcelRoutes');
const tripRoutes = require('./routes/tripRoutes');
const stationRoutes = require('./routes/stationRoutes');
const routeRoutes = require('./routes/routeRoutes');
const userRoutes = require('./routes/userRoutes');
const iotRoutes = require('./routes/iotRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const { seedDatabase } = require('./services/seedData');
const { startIoTSimulator } = require('./services/iotSimulator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/parcels', publicTrackRoutes); // /track/:trackingNumber and /public-issue
app.use('/api/parcels', parcelRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Global Voyage Bus Parcel & IoT Tracking Backend',
    timestamp: new Date().toISOString(),
  });
});

// Database Connection & Server Initialization
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/global_voyage_db';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Database connection established successfully.');
    // Seed initial data
    await seedDatabase();
    // Start automated IoT GPS simulator
    startIoTSimulator(10000);
  })
  .catch(err => {
    console.error('MongoDB Connection error:', err.message);
  });

app.listen(PORT, () => {
  console.log(`Global Voyage Parcel API running on http://localhost:${PORT}`);
});
