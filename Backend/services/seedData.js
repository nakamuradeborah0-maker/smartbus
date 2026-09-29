const User = require('../models/User');
const Station = require('../models/Station');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const IoTTracker = require('../models/IoTTracker');
const Parcel = require('../models/Parcel');
const ParcelLocation = require('../models/ParcelLocation');
const ParcelStatusHistory = require('../models/ParcelStatusHistory');
const ParcelIssue = require('../models/ParcelIssue');
const Notification = require('../models/Notification');

async function ensureDeboraUser() {
  try {
    let debora = await User.findOne({
      $or: [
        { username: 'debora' },
        { email: 'debora@globalvoyage.com' },
        { name: 'Debora' }
      ]
    });

    if (!debora) {
      debora = new User({
        name: 'Debora',
        username: 'debora',
        email: 'debora@globalvoyage.com',
        password: 'Demodebora',
        phone: '+237 690 00 00 00',
        role: 'ADMIN',
      });
      await debora.save();
      console.log('✅ Created debora user (ADMIN) with password Demodebora');
    } else {
      debora.username = 'debora';
      debora.password = 'Demodebora';
      debora.role = 'ADMIN';
      await debora.save();
      console.log('✅ Ensured debora user credentials updated to Demodebora');
    }
  } catch (err) {
    console.error('Error ensuring debora user:', err.message);
  }
}


async function ensureTripsAndBookings() {
  try {
    const bookingCount = await Booking.countDocuments();
    const todayStr = new Date().toISOString().split('T')[0];

    if (bookingCount === 0) {
      await Booking.create({
        bookingReference: 'BK-2026-99823',
        tripNumber: 'GV-1025',
        busModel: 'Scania VIP First Class #LT-782-AA',
        passengerName: 'Deborah Nakamura',
        passengerIdNumber: '110293849',
        passengerEmail: 'debora@globalvoyage.com',
        passengerPhone: '677949699',
        origin: 'Douala (Gare Centrale Akwa)',
        destination: 'Yaoundé (Terminal Mvan)',
        travelDate: todayStr,
        departureTime: '06:30',
        seatNumber: 14,
        seatLabel: 'Siège N° 14 (Fenêtre VIP)',
        amount: 5000,
        paymentMethod: 'MTN_MOMO',
        paymentStatus: 'PAID',
        campayReference: 'd7745cb0-a29c-4104-bd90-9aff213b342c',
        campayOperator: 'MTN',
        campayUssdCode: '*126#',
        externalReference: 'GV-INIT-001',
      });
      console.log('✅ Seeded initial persistent booking BK-2026-99823 for Deborah Nakamura in MongoDB');
    }

    // Ensure we have rich upcoming trips
    const existingScheduled = await Trip.countDocuments({ status: { $in: ['SCHEDULED', 'IN_TRANSIT'] } });
    if (existingScheduled < 4) {
      const routes = await Route.find();
      const drivers = await User.find({ role: 'DRIVER' });
      const driver = drivers.length > 0 ? drivers[0] : await User.findOne();
      const rtDLA_YAO = routes.find(r => r.routeCode === 'RT-DLA-YAO') || routes[0];
      const rtDLA_BAF = routes.find(r => r.routeCode === 'RT-DLA-BAF') || routes[0];

      if (rtDLA_YAO && driver) {
        const baseDate = new Date();
        const tripsToCreate = [
          {
            tripNumber: 'GV-1030',
            routeId: rtDLA_YAO._id,
            driverId: driver._id,
            busNumber: 'LT-782-AA (Scania VIP First Class)',
            departureScheduled: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 7, 0, 0),
            arrivalScheduled: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 11, 0, 0),
            status: 'SCHEDULED'
          },
          {
            tripNumber: 'GV-1031',
            routeId: rtDLA_YAO._id,
            driverId: driver._id,
            busNumber: 'CE-341-BA (Mercedes Comfort Express)',
            departureScheduled: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 10, 30, 0),
            arrivalScheduled: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 14, 30, 0),
            status: 'SCHEDULED'
          },
          {
            tripNumber: 'GV-1032',
            routeId: rtDLA_YAO._id,
            driverId: driver._id,
            busNumber: 'LT-890-BB (Scania VIP Lounge Express)',
            departureScheduled: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 14, 0, 0),
            arrivalScheduled: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 18, 0, 0),
            status: 'SCHEDULED'
          },
          {
            tripNumber: 'GV-1033',
            routeId: rtDLA_YAO._id,
            driverId: driver._id,
            busNumber: 'LT-902-CC (Volvo Highliner Luxury)',
            departureScheduled: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 17, 30, 0),
            arrivalScheduled: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 21, 30, 0),
            status: 'SCHEDULED'
          },
          {
            tripNumber: 'GV-2045',
            routeId: (rtDLA_BAF || rtDLA_YAO)._id,
            driverId: driver._id,
            busNumber: 'OU-112-DA (Marcopolo Paradiso)',
            departureScheduled: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 8, 30, 0),
            arrivalScheduled: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 13, 0, 0),
            status: 'SCHEDULED'
          }
        ];

        for (const t of tripsToCreate) {
          const exists = await Trip.findOne({ tripNumber: t.tripNumber });
          if (!exists) {
            await Trip.create(t);
          }
        }
        console.log('✅ Added rich upcoming trips for today in MongoDB');
      }
    }
  } catch (err) {
    console.error('ensureTripsAndBookings error:', err.message);
  }
}

async function seedDatabase() {
  try {
    const parcelCount = await Parcel.countDocuments();
    const stationCount = await Station.countDocuments();

    if (parcelCount > 0 && stationCount > 0) {
      console.log('Database already has stations and parcels. Ensuring debora account exists...');
      await ensureDeboraUser();
      await ensureTripsAndBookings();
      return;
    }

    console.log('Cleaning old test data and seeding Global Voyage system...');
    await User.deleteMany({});
    await Station.deleteMany({});
    await Route.deleteMany({});
    await Trip.deleteMany({});
    await IoTTracker.deleteMany({});
    await Parcel.deleteMany({});
    await ParcelLocation.deleteMany({});
    await ParcelStatusHistory.deleteMany({});
    await ParcelIssue.deleteMany({});
    await Notification.deleteMany({});

    // 1. STATIONS
    const stations = await Station.insertMany([
      {
        stationCode: 'ST-DLA',
        name: 'Douala Central Station',
        city: 'Douala',
        address: 'Boulevard de la Liberté, Akwa, Douala',
        phone: '+237 233 42 11 00',
        latitude: 4.0511,
        longitude: 9.7679,
        status: 'ACTIVE',
      },
      {
        stationCode: 'ST-YAO',
        name: 'Yaoundé Mvan Terminal',
        city: 'Yaoundé',
        address: 'Carrefour Mvan, Yaoundé',
        phone: '+237 222 30 45 67',
        latitude: 3.8480,
        longitude: 11.5021,
        status: 'ACTIVE',
      },
      {
        stationCode: 'ST-BAF',
        name: 'Bafoussam City Station',
        city: 'Bafoussam',
        address: 'Entrée Ville, Bafoussam',
        phone: '+237 233 44 88 99',
        latitude: 5.4777,
        longitude: 10.4176,
        status: 'ACTIVE',
      },
      {
        stationCode: 'ST-BDA',
        name: 'Bamenda Up-Station',
        city: 'Bamenda',
        address: 'Commercial Avenue, Bamenda',
        phone: '+237 233 36 12 34',
        latitude: 5.9631,
        longitude: 10.1591,
        status: 'ACTIVE',
      },
      {
        stationCode: 'ST-BER',
        name: 'Bertoua Station',
        city: 'Bertoua',
        address: 'Avenue des Transporteurs, Bertoua',
        phone: '+237 222 24 10 20',
        latitude: 4.5773,
        longitude: 13.6846,
        status: 'ACTIVE',
      },
    ]);

    const stDLA = stations.find(s => s.stationCode === 'ST-DLA');
    const stYAO = stations.find(s => s.stationCode === 'ST-YAO');
    const stBAF = stations.find(s => s.stationCode === 'ST-BAF');
    const stBDA = stations.find(s => s.stationCode === 'ST-BDA');

    // 2. USERS
    const users = await User.create([
      {
        name: 'Alex Administrator',
        email: 'admin@globalvoyage.com',
        password: 'password123',
        phone: '+237 699 00 11 22',
        role: 'ADMIN',
      },
      {
        name: 'Jean Parcel Agent (Douala)',
        email: 'agent.douala@globalvoyage.com',
        password: 'password123',
        phone: '+237 677 11 22 33',
        role: 'PARCEL_AGENT',
        stationId: stDLA._id,
      },
      {
        name: 'Claire Parcel Agent (Yaoundé)',
        email: 'agent.yaounde@globalvoyage.com',
        password: 'password123',
        phone: '+237 677 44 55 66',
        role: 'PARCEL_AGENT',
        stationId: stYAO._id,
      },
      {
        name: 'Michel Parcel Agent (Bafoussam)',
        email: 'agent.bafoussam@globalvoyage.com',
        password: 'password123',
        phone: '+237 677 77 88 99',
        role: 'PARCEL_AGENT',
        stationId: stBAF._id,
      },
      {
        name: 'Paul Driver (Bus #GV-1025)',
        email: 'driver.paul@globalvoyage.com',
        password: 'password123',
        phone: '+237 690 12 34 56',
        role: 'DRIVER',
      },
      {
        name: 'Samuel Driver (Bus #GV-1026)',
        email: 'driver.samuel@globalvoyage.com',
        password: 'password123',
        phone: '+237 690 65 43 21',
        role: 'DRIVER',
      },
      {
        name: 'Alice Customer',
        email: 'customer.alice@gmail.com',
        password: 'password123',
        phone: '+237 650 99 88 77',
        role: 'CUSTOMER',
      },
      {
        name: 'Bruno Customer',
        email: 'customer.bruno@gmail.com',
        password: 'password123',
        phone: '+237 651 22 33 44',
        role: 'CUSTOMER',
      },
    ]);

    const uAdmin = users.find(u => u.role === 'ADMIN');
    const uAgentDLA = users.find(u => u.email === 'agent.douala@globalvoyage.com');
    const uDriverPaul = users.find(u => u.email === 'driver.paul@globalvoyage.com');
    const uCustAlice = users.find(u => u.email === 'customer.alice@gmail.com');

    // 3. ROUTES
    const routes = await Route.insertMany([
      {
        routeCode: 'RT-DLA-YAO',
        name: 'Douala ↔ Yaoundé Express (N3)',
        originStationId: stDLA._id,
        destinationStationId: stYAO._id,
        distanceKm: 242,
        estimatedHours: 3.5,
        status: 'ACTIVE',
        waypoints: [
          { name: 'Douala Station', latitude: 4.0511, longitude: 9.7679, order: 1 },
          { name: 'Edéa Bridge', latitude: 3.8000, longitude: 10.1333, order: 2 },
          { name: 'Boumnyebel Toll', latitude: 3.8667, longitude: 10.8667, order: 3 },
          { name: 'Yaoundé Mvan', latitude: 3.8480, longitude: 11.5021, order: 4 },
        ]
      },
      {
        routeCode: 'RT-DLA-BAF',
        name: 'Douala ↔ Bafoussam Highway (N5)',
        originStationId: stDLA._id,
        destinationStationId: stBAF._id,
        distanceKm: 265,
        estimatedHours: 4.5,
        status: 'ACTIVE',
        waypoints: [
          { name: 'Douala Station', latitude: 4.0511, longitude: 9.7679, order: 1 },
          { name: 'Nkongsamba', latitude: 4.9547, longitude: 9.9404, order: 2 },
          { name: 'Bafang Pass', latitude: 5.1583, longitude: 10.1797, order: 3 },
          { name: 'Bafoussam Station', latitude: 5.4777, longitude: 10.4176, order: 4 },
        ]
      },
      {
        routeCode: 'RT-BAF-BDA',
        name: 'Bafoussam ↔ Bamenda Scenic Route (N6)',
        originStationId: stBAF._id,
        destinationStationId: stBDA._id,
        distanceKm: 85,
        estimatedHours: 2.0,
        status: 'ACTIVE',
      },
    ]);

    const rtDLA_YAO = routes.find(r => r.routeCode === 'RT-DLA-YAO');
    const rtDLA_BAF = routes.find(r => r.routeCode === 'RT-DLA-BAF');

    // 4. IOT TRACKERS
    const trackers = await IoTTracker.insertMany([
      {
        trackerCode: 'TRK-8801',
        deviceModel: 'GV-GPS-4G-Pro',
        batteryLevel: 94,
        status: 'ASSIGNED',
        lastLatitude: 3.8667,
        lastLongitude: 10.8667,
        lastSpeed: 74,
      },
      {
        trackerCode: 'TRK-8802',
        deviceModel: 'GV-GPS-4G-Pro',
        batteryLevel: 98,
        status: 'ASSIGNED',
        lastLatitude: 4.0511,
        lastLongitude: 9.7679,
        lastSpeed: 0,
      },
      {
        trackerCode: 'TRK-8803',
        deviceModel: 'GV-GPS-4G-Pro',
        batteryLevel: 87,
        status: 'ASSIGNED',
        lastLatitude: 4.0511,
        lastLongitude: 9.7679,
        lastSpeed: 0,
      },
      {
        trackerCode: 'TRK-8804',
        deviceModel: 'GV-GPS-4G-Compact',
        batteryLevel: 91,
        status: 'ASSIGNED',
        lastLatitude: 4.0511,
        lastLongitude: 9.7679,
        lastSpeed: 0,
      },
      {
        trackerCode: 'TRK-8805',
        deviceModel: 'GV-GPS-4G-Compact',
        batteryLevel: 100,
        status: 'AVAILABLE',
      },
    ]);

    const trk1 = trackers.find(t => t.trackerCode === 'TRK-8801');
    const trk2 = trackers.find(t => t.trackerCode === 'TRK-8802');
    const trk3 = trackers.find(t => t.trackerCode === 'TRK-8803');
    const trk4 = trackers.find(t => t.trackerCode === 'TRK-8804');

    // 5. TRIPS
    const trips = await Trip.insertMany([
      {
        tripNumber: 'GV-1025',
        routeId: rtDLA_YAO._id,
        driverId: uDriverPaul._id,
        busNumber: 'LT-782-AA (Scania VIP Express)',
        departureScheduled: new Date(Date.now() - 2 * 3600 * 1000),
        departureActual: new Date(Date.now() - 2 * 3600 * 1000),
        arrivalScheduled: new Date(Date.now() + 1.5 * 3600 * 1000),
        status: 'IN_TRANSIT',
      },
      {
        tripNumber: 'GV-1026',
        routeId: rtDLA_YAO._id,
        driverId: uDriverPaul._id,
        busNumber: 'CE-341-BA (Mercedes Comfort)',
        departureScheduled: new Date(Date.now() + 3 * 3600 * 1000),
        arrivalScheduled: new Date(Date.now() + 6.5 * 3600 * 1000),
        status: 'SCHEDULED',
      },
      {
        tripNumber: 'GV-2041',
        routeId: rtDLA_BAF._id,
        driverId: uDriverPaul._id,
        busNumber: 'LT-902-CC (Volvo Highliner)',
        departureScheduled: new Date(Date.now() + 5 * 3600 * 1000),
        arrivalScheduled: new Date(Date.now() + 9.5 * 3600 * 1000),
        status: 'SCHEDULED',
      },
    ]);

    const trip1 = trips.find(t => t.tripNumber === 'GV-1025');

    // 6. PARCELS
    const parcel1 = await Parcel.create({
      trackingNumber: 'PAR-2026-00125',
      customerId: uCustAlice._id,
      senderName: 'Alice Mengue',
      senderPhone: '+237 650 99 88 77',
      senderEmail: 'customer.alice@gmail.com',
      recipientName: 'Henri Tagne',
      recipientPhone: '+237 670 11 22 33',
      recipientAddress: 'Quartier Bastos, Yaoundé',
      originStationId: stDLA._id,
      destinationStationId: stYAO._id,
      currentStationId: stDLA._id,
      tripId: trip1._id,
      weightKg: 12.5,
      declaredValue: 450000,
      description: 'Laptops, networking router & electronic components',
      status: 'IN_TRANSIT',
      trackerId: trk1._id,
    });

    const parcel2 = await Parcel.create({
      trackingNumber: 'PAR-2026-00126',
      customerId: uCustAlice._id,
      senderName: 'Alice Mengue',
      senderPhone: '+237 650 99 88 77',
      senderEmail: 'customer.alice@gmail.com',
      recipientName: 'Dr. Joseph Kamga',
      recipientPhone: '+237 699 33 44 55',
      recipientAddress: 'Hôpital Régional de Bafoussam',
      originStationId: stDLA._id,
      destinationStationId: stBAF._id,
      currentStationId: stDLA._id,
      weightKg: 8.0,
      declaredValue: 120000,
      description: 'Medical supplies & temperature-sensitive reagents',
      status: 'REGISTERED',
      trackerId: trk2._id,
    });

    const parcel3 = await Parcel.create({
      trackingNumber: 'PAR-2026-00127',
      customerId: null,
      senderName: 'Bertrand Eto',
      senderPhone: '+237 675 00 11 22',
      recipientName: 'Carine Nkoa',
      recipientPhone: '+237 691 44 55 66',
      originStationId: stYAO._id,
      destinationStationId: stDLA._id,
      currentStationId: stDLA._id,
      weightKg: 4.2,
      declaredValue: 35000,
      description: 'Roasted artisanal Arabica coffee beans & textiles',
      status: 'DELIVERED',
      trackerId: null, // NO GPS tracker assigned
    });

    const parcel4 = await Parcel.create({
      trackingNumber: 'PAR-2026-00128',
      customerId: null,
      senderName: 'Global Tech SARL',
      senderPhone: '+237 233 41 80 90',
      recipientName: 'Bamenda Solar Works',
      recipientPhone: '+237 677 89 01 23',
      originStationId: stDLA._id,
      destinationStationId: stBDA._id,
      currentStationId: stDLA._id,
      weightKg: 19.5,
      declaredValue: 680000,
      description: 'High-capacity hybrid solar inverters and lithium batteries',
      status: 'LOADED',
      trackerId: trk3._id,
    });

    const parcel5 = await Parcel.create({
      trackingNumber: 'PAR-2026-00129',
      customerId: null,
      senderName: 'Agrilab West',
      senderPhone: '+237 699 77 66 55',
      recipientName: 'Douala Port Bio-Inspection',
      recipientPhone: '+237 674 12 34 56',
      originStationId: stBAF._id,
      destinationStationId: stDLA._id,
      currentStationId: stDLA._id,
      weightKg: 6.0,
      declaredValue: 80000,
      description: 'Highland organic seed samples & certification files',
      status: 'ARRIVED',
      trackerId: trk4._id,
    });

    // 7. STATUS HISTORIES & GPS LOCATIONS
    await ParcelStatusHistory.insertMany([
      {
        parcelId: parcel1._id,
        status: 'REGISTERED',
        stationId: stDLA._id,
        updatedBy: uAgentDLA._id,
        notes: 'Parcel intake at Douala Central Station counter',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000),
      },
      {
        parcelId: parcel1._id,
        status: 'LOADED',
        stationId: stDLA._id,
        updatedBy: uAgentDLA._id,
        notes: 'Loaded into cargo bay of Bus LT-782-AA (Trip #GV-1025)',
        timestamp: new Date(Date.now() - 2.5 * 3600 * 1000),
      },
      {
        parcelId: parcel1._id,
        status: 'IN_TRANSIT',
        stationId: stDLA._id,
        updatedBy: uDriverPaul._id,
        notes: 'Trip departed Douala. Live IoT tracking active on N3 Highway.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000),
      },
    ]);

    await ParcelLocation.insertMany([
      {
        parcelId: parcel1._id,
        trackerId: trk1._id,
        latitude: 4.0511,
        longitude: 9.7679,
        speed: 0,
        batteryLevel: 95,
        locationName: 'Douala Central Station Departure Gate',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000),
      },
      {
        parcelId: parcel1._id,
        trackerId: trk1._id,
        latitude: 3.8000,
        longitude: 10.1333,
        speed: 72,
        batteryLevel: 94,
        locationName: 'Edéa Sanaga River Bridge (Highway N3)',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000),
      },
      {
        parcelId: parcel1._id,
        trackerId: trk1._id,
        latitude: 3.8667,
        longitude: 10.8667,
        speed: 76,
        batteryLevel: 94,
        locationName: 'Boumnyebel Toll Junction (Highway N3)',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
    ]);

    // 8. ISSUES
    await ParcelIssue.create({
      parcelId: parcel2._id,
      trackingNumber: parcel2.trackingNumber,
      customerId: uCustAlice._id,
      reporterName: 'Alice Mengue',
      reporterPhone: '+237 650 99 88 77',
      issueType: 'DELAYED',
      description: 'Recipient needs urgent confirmation on whether this parcel leaves on the morning or afternoon bus.',
      status: 'OPEN',
    });

    // 9. NOTIFICATIONS
    await Notification.insertMany([
      {
        userId: uCustAlice._id,
        trackingNumber: 'PAR-2026-00125',
        title: 'Parcel in Transit',
        message: 'Your parcel PAR-2026-00125 is on its way to Yaoundé via Bus #GV-1025.',
        type: 'INFO',
      },
      {
        role: 'PARCEL_AGENT',
        stationId: stDLA._id,
        trackingNumber: 'PAR-2026-00126',
        title: 'New Issue Inquiry',
        message: 'Customer submitted a question regarding parcel PAR-2026-00126 departure time.',
        type: 'WARNING',
      },
      {
        userId: uAdmin._id,
        title: 'System Initialized',
        message: 'Global Voyage Parcel Management & IoT Telemetry System online.',
        type: 'SUCCESS',
      },
    ]);

    await ensureDeboraUser();
    console.log('Database seeded successfully with Cameroon stations, routes, IoT trackers, and test parcels!');
  } catch (error) {
    console.error('Seed error:', error);
  }
}

module.exports = { seedDatabase };
