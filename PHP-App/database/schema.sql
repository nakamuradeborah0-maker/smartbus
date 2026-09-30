-- PHP-App Database Schema (SQLite & MySQL compatible)

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(30),
    latitude REAL,
    longitude REAL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    origin_station_id INTEGER REFERENCES stations(id),
    destination_station_id INTEGER REFERENCES stations(id),
    distance_km REAL DEFAULT 240,
    estimated_hours REAL DEFAULT 3.5,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS iot_trackers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracker_code VARCHAR(30) UNIQUE NOT NULL,
    device_model VARCHAR(100) DEFAULT 'GV-GPS-4G-Pro',
    battery_level INTEGER DEFAULT 95,
    status VARCHAR(20) DEFAULT 'ASSIGNED',
    last_latitude REAL,
    last_longitude REAL,
    last_speed REAL DEFAULT 0,
    last_ping DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_number VARCHAR(30) UNIQUE NOT NULL,
    route_id INTEGER REFERENCES routes(id),
    driver_id INTEGER REFERENCES users(id),
    bus_number VARCHAR(100) NOT NULL,
    departure_scheduled DATETIME NOT NULL,
    arrival_scheduled DATETIME NOT NULL,
    departure_actual DATETIME,
    arrival_actual DATETIME,
    price INTEGER DEFAULT 5000,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    incident_report TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    trip_id INTEGER REFERENCES trips(id),
    trip_number VARCHAR(30),
    bus_model VARCHAR(100),
    passenger_name VARCHAR(100) NOT NULL,
    passenger_id_number VARCHAR(50),
    passenger_email VARCHAR(100),
    passenger_phone VARCHAR(30) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    travel_date VARCHAR(20) NOT NULL,
    departure_time VARCHAR(20) NOT NULL,
    seat_number INTEGER NOT NULL,
    seat_label VARCHAR(50),
    amount INTEGER NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'MTN_MOMO',
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    campay_reference VARCHAR(100),
    campay_operator VARCHAR(50),
    campay_ussd_code VARCHAR(50),
    external_reference VARCHAR(100),
    tracker_id INTEGER REFERENCES iot_trackers(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parcels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES users(id),
    sender_name VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(30) NOT NULL,
    sender_email VARCHAR(100),
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    recipient_address VARCHAR(255) NOT NULL,
    origin_station_id INTEGER REFERENCES stations(id),
    destination_station_id INTEGER REFERENCES stations(id),
    current_station_id INTEGER REFERENCES stations(id),
    trip_id INTEGER REFERENCES trips(id),
    weight_kg REAL DEFAULT 5.0,
    declared_value INTEGER DEFAULT 50000,
    description TEXT,
    status VARCHAR(30) DEFAULT 'REGISTERED',
    tracker_id INTEGER REFERENCES iot_trackers(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parcel_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parcel_id INTEGER REFERENCES parcels(id),
    status VARCHAR(30) NOT NULL,
    station_id INTEGER REFERENCES stations(id),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parcel_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parcel_id INTEGER REFERENCES parcels(id),
    tracking_number VARCHAR(50),
    reporter_name VARCHAR(100),
    reporter_contact VARCHAR(50),
    issue_type VARCHAR(50) DEFAULT 'DELAY',
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'INFO',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);\n