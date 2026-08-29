# Global Voyage — Intercity Bus Parcel Management & Real-Time IoT GPS Tracking System

A full-stack, production-grade web application for bus transportation agencies managing intercity parcel logistics across Cameroon (Douala, Yaoundé, Bafoussam, Bamenda, Bertoua).

Features real-time 4G IoT GPS telemetry streaming along highway corridors, station-scoped agent dispatch, driver trip operations, customer portals, and public unauthenticated tracking with interactive OpenStreetMap/Leaflet maps.

---

## 🌟 Key Features

- **Zero Emojis / Modern Lucide Icons**: Sleek, professional transportation UI built with Tailwind CSS and Lucide SVG icons.
- **Public Tracking (No Account Required)**: Real-time parcel lookup with interactive Leaflet GPS map, live vehicle speed (km/h), IoT battery level (%), highway location, and checkpoint timeline.
- **Strict Baggage vs. Parcel Rules**: Dedicated to parcel logistics with optional IoT trackers.
- **Role-Based Access Control (RBAC)**:
  - **Administrator**: National fleet & GPS live map, user accounts CRUD, station hubs, routes, and bus scheduling.
  - **Parcel Handling Agent**: Station-scoped dispatch (Douala, Yaoundé, Bafoussam, Bamenda), parcel intake, IoT tracker assignment, and issue resolution.
  - **Bus Driver**: Assigned trips console, live departure/arrival confirmations, and en-route incident logging.
  - **Customer**: Personal parcel inventory, detailed milestone history, and issue reporting.
- **Automated IoT GPS Simulator**: Background engine streaming GPS waypoints along Cameroon National Highways (N3, N5, N6).
- **Public Issue Reporting**: Fast dispute and inquiry submission without requiring account creation.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React Icons, Leaflet OpenStreetMap.
- **Backend**: Node.js, Express.js REST API, JWT Authentication, Bcrypt.js, RBAC Middleware.
- **Database**: MongoDB with Mongoose Schemas & Relations.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Running on `mongodb://localhost:27017`)

### 2. Backend Setup
```bash
cd Backend
npm install
node server.js
```
*API runs at `http://localhost:5000/api`*

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
*Web App runs at `http://localhost:5174` (or `http://localhost:5173`)*

---

## 🔑 Demo Accounts (1-Click Switcher Available in UI)

| Role | Email | Password | Scope |
|---|---|---|---|
| **Administrator** | `admin@globalvoyage.com` | `password123` | Global System Oversight |
| **Douala Station Agent** | `agent.douala@globalvoyage.com` | `password123` | Douala Central Station |
| **Yaoundé Station Agent** | `agent.yaounde@globalvoyage.com` | `password123` | Yaoundé Mvan Terminal |
| **Bus Driver (Paul)** | `driver.paul@globalvoyage.com` | `password123` | Trip `#GV-1025` (Douala ↔ Yaoundé) |
| **Customer (Alice)** | `customer.alice@gmail.com` | `password123` | Personal Parcels |

---

## 📦 Sample Tracking Numbers

- `PAR-2026-00125` — **In Transit** (Live GPS Telemetry Active on N3 Highway)
- `PAR-2026-00126` — **Registered** (Douala → Bafoussam)
- `PAR-2026-00127` — **Delivered** (No GPS Tracker — Station Checkpoints)
- `PAR-2026-00128` — **Loaded on Bus** (Douala → Bamenda)
- `PAR-2026-00129` — **Arrived at Station** (Bafoussam → Douala)
