-- ==========================================================
-- Global Voyages SmartBus System - MySQL Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.x, and MariaDB 10.x+
-- Character Set: utf8mb4, Engine: InnoDB
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS & ROLES
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. STATIONS (Douala & Yaounde Hubs)
DROP TABLE IF EXISTS stations;
CREATE TABLE stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address VARCHAR(255) NULL,
    phone VARCHAR(30) NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. INTERCITY ROUTES (Douala <-> Yaounde Express N3)
DROP TABLE IF EXISTS routes;
CREATE TABLE routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    origin_station_id INT NULL,
    destination_station_id INT NULL,
    distance_km DECIMAL(6, 2) DEFAULT 242.00,
    estimated_hours DECIMAL(4, 2) DEFAULT 3.50,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (origin_station_id) REFERENCES stations(id) ON DELETE SET NULL,
    FOREIGN KEY (destination_station_id) REFERENCES stations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. IOT GPS TRACKERS
DROP TABLE IF EXISTS iot_trackers;
CREATE TABLE iot_trackers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracker_code VARCHAR(30) UNIQUE NOT NULL,
    device_model VARCHAR(100) DEFAULT 'GV-GPS-4G-Pro',
    battery_level INT DEFAULT 95,
    status VARCHAR(20) DEFAULT 'ASSIGNED',
    last_latitude DECIMAL(10, 7) NULL,
    last_longitude DECIMAL(10, 7) NULL,
    last_speed DECIMAL(6, 2) DEFAULT 0.00,
    last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SCHEDULED DEPARTURES / TRIPS
DROP TABLE IF EXISTS trips;
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_number VARCHAR(30) UNIQUE NOT NULL,
    route_id INT NULL,
    driver_id INT NULL,
    bus_number VARCHAR(100) NOT NULL,
    departure_scheduled DATETIME NOT NULL,
    arrival_scheduled DATETIME NOT NULL,
    departure_actual DATETIME NULL,
    arrival_actual DATETIME NULL,
    price INT DEFAULT 5000,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    incident_report TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PASSENGER BOOKINGS & TICKETS
DROP TABLE IF EXISTS bookings;
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NULL,
    trip_id INT NULL,
    trip_number VARCHAR(30) NULL,
    bus_model VARCHAR(100) NULL,
    passenger_name VARCHAR(100) NOT NULL,
    passenger_id_number VARCHAR(50) NULL,
    passenger_email VARCHAR(100) NULL,
    passenger_phone VARCHAR(30) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    travel_date VARCHAR(20) NOT NULL,
    departure_time VARCHAR(20) NOT NULL,
    seat_number INT NOT NULL,
    seat_label VARCHAR(50) NULL,
    amount INT NOT NULL DEFAULT 5000,
    payment_method VARCHAR(30) DEFAULT 'MTN_MOMO',
    payment_status VARCHAR(20) DEFAULT 'PENDING',
    campay_reference VARCHAR(100) NULL,
    campay_operator VARCHAR(50) NULL,
    campay_ussd_code VARCHAR(50) NULL,
    external_reference VARCHAR(100) NULL,
    tracker_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (tracker_id) REFERENCES iot_trackers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PARCELS & FREIGHT
DROP TABLE IF EXISTS parcels;
CREATE TABLE parcels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NULL,
    sender_name VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(30) NOT NULL,
    sender_email VARCHAR(100) NULL,
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    recipient_address VARCHAR(255) NOT NULL,
    origin_station_id INT NULL,
    destination_station_id INT NULL,
    current_station_id INT NULL,
    trip_id INT NULL,
    weight_kg DECIMAL(6, 2) DEFAULT 5.00,
    declared_value INT DEFAULT 50000,
    description TEXT NULL,
    status VARCHAR(30) DEFAULT 'REGISTERED',
    tracker_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (origin_station_id) REFERENCES stations(id) ON DELETE SET NULL,
    FOREIGN KEY (destination_station_id) REFERENCES stations(id) ON DELETE SET NULL,
    FOREIGN KEY (current_station_id) REFERENCES stations(id) ON DELETE SET NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (tracker_id) REFERENCES iot_trackers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PARCEL STATUS TIMELINE / HISTORY
DROP TABLE IF EXISTS parcel_status_history;
CREATE TABLE parcel_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parcel_id INT NOT NULL,
    status VARCHAR(30) NOT NULL,
    station_id INT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. PARCEL CLAIMS / INCIDENTS
DROP TABLE IF EXISTS parcel_issues;
CREATE TABLE parcel_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parcel_id INT NULL,
    tracking_number VARCHAR(50) NULL,
    reporter_name VARCHAR(100) NULL,
    reporter_contact VARCHAR(50) NULL,
    issue_type VARCHAR(50) DEFAULT 'DELAY',
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    resolution_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. SYSTEM NOTIFICATIONS
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'INFO',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
