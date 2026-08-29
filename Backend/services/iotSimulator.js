const Parcel = require('../models/Parcel');
const IoTTracker = require('../models/IoTTracker');
const ParcelLocation = require('../models/ParcelLocation');
const Station = require('../models/Station');

// Preset waypoints along key Cameroon intercity transport axes
const ROUTE_WAYPOINTS = {
  'DLA-YAO': [
    { name: 'Douala Central Station', lat: 4.0511, lng: 9.7679 },
    { name: 'Yassa Douala Outpost', lat: 4.0150, lng: 9.8150 },
    { name: 'Edéa Sanaga River Bridge', lat: 3.8000, lng: 10.1333 },
    { name: 'Pouma Highway Rest', lat: 3.8500, lng: 10.5167 },
    { name: 'Boumnyebel Junction', lat: 3.8667, lng: 10.8667 },
    { name: 'Matomb Forest Pass', lat: 3.8833, lng: 11.0500 },
    { name: 'Mbankomo South Entry', lat: 3.7833, lng: 11.3833 },
    { name: 'Yaoundé Mvan Station', lat: 3.8480, lng: 11.5021 },
  ],
  'DLA-BAF': [
    { name: 'Douala Central Station', lat: 4.0511, lng: 9.7679 },
    { name: 'Mbanga Agricultural Belt', lat: 4.5000, lng: 9.5667 },
    { name: 'Nkongsamba Highlands', lat: 4.9547, lng: 9.9404 },
    { name: 'Melong Valley', lat: 5.1228, lng: 9.9575 },
    { name: 'Bafang Mountain Pass', lat: 5.1583, lng: 10.1797 },
    { name: 'Bafoussam City Station', lat: 5.4777, lng: 10.4176 },
  ],
  'BAF-BDA': [
    { name: 'Bafoussam City Station', lat: 5.4777, lng: 10.4176 },
    { name: 'Mbouda Mountain Range', lat: 5.6333, lng: 10.2500 },
    { name: 'Santa Ridge Toll', lat: 5.8333, lng: 10.1667 },
    { name: 'Bamenda Station', lat: 5.9631, lng: 10.1591 },
  ],
};

// State store for active simulated progress
const simulatedProgress = new Map(); // parcelId -> { routeKey, currentIndex, direction }

async function simulateGpsStep() {
  try {
    const inTransitParcels = await Parcel.find({
      status: 'IN_TRANSIT',
      trackerId: { $ne: null },
    }).populate('originStationId destinationStationId trackerId');

    if (!inTransitParcels || inTransitParcels.length === 0) {
      return;
    }

    for (const parcel of inTransitParcels) {
      if (!parcel.trackerId) continue;

      const originCode = parcel.originStationId?.stationCode || 'ST-DLA';
      const destCode = parcel.destinationStationId?.stationCode || 'ST-YAO';

      let routeKey = 'DLA-YAO';
      if ((originCode.includes('DLA') && destCode.includes('BAF')) || (originCode.includes('BAF') && destCode.includes('DLA'))) {
        routeKey = 'DLA-BAF';
      } else if ((originCode.includes('BAF') && destCode.includes('BDA')) || (originCode.includes('BDA') && destCode.includes('BAF'))) {
        routeKey = 'BAF-BDA';
      }

      const waypoints = ROUTE_WAYPOINTS[routeKey] || ROUTE_WAYPOINTS['DLA-YAO'];
      const parcelIdStr = parcel._id.toString();

      let prog = simulatedProgress.get(parcelIdStr);
      if (!prog) {
        prog = { routeKey, currentIndex: 0, direction: 1 };
        simulatedProgress.set(parcelIdStr, prog);
      }

      // Next waypoint
      prog.currentIndex += prog.direction;
      if (prog.currentIndex >= waypoints.length - 1) {
        prog.direction = -1; // Loop back for continuous live demo simulation
      } else if (prog.currentIndex <= 0) {
        prog.direction = 1;
      }

      const wp = waypoints[prog.currentIndex];
      // Add slight jitter for realistic GPS motion
      const jitterLat = (Math.random() - 0.5) * 0.003;
      const jitterLng = (Math.random() - 0.5) * 0.003;
      const currentLat = Number((wp.lat + jitterLat).toFixed(6));
      const currentLng = Number((wp.lng + jitterLng).toFixed(6));
      const speed = Math.floor(65 + Math.random() * 20); // 65-85 km/h
      const battery = Math.max(15, (parcel.trackerId.batteryLevel || 100) - 0.01);

      // Update tracker
      await IoTTracker.findByIdAndUpdate(parcel.trackerId._id, {
        lastLatitude: currentLat,
        lastLongitude: currentLng,
        lastSpeed: speed,
        batteryLevel: Number(battery.toFixed(1)),
        lastPing: Date.now(),
        status: 'ASSIGNED',
      });

      // Save telemetry log
      await ParcelLocation.create({
        parcelId: parcel._id,
        trackerId: parcel.trackerId._id,
        latitude: currentLat,
        longitude: currentLng,
        speed,
        batteryLevel: Number(battery.toFixed(1)),
        locationName: `${wp.name} (N3/N5 Axis)`,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('IoT Simulator step error:', error.message);
  }
}

let simulationInterval = null;

function startIoTSimulator(intervalMs = 12000) {
  if (simulationInterval) clearInterval(simulationInterval);
  console.log('[IoT Telemetry Engine] GPS Simulator active along Cameroon highway corridors');
  // Run once immediately
  simulateGpsStep();
  simulationInterval = setInterval(simulateGpsStep, intervalMs);
}

function stopIoTSimulator() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('IoT Simulator stopped.');
  }
}

module.exports = {
  startIoTSimulator,
  stopIoTSimulator,
  simulateGpsStep,
  ROUTE_WAYPOINTS,
};
