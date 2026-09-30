<?php
// PHP-App/database/migrate.php
require_once __DIR__ . '/../config/database.php';

echo "=== SmartBus PHP Database Migration & Seeder ===\n";

$pdo = Database::getConnection();

// 1. Run Schema
$schema = file_get_contents(__DIR__ . '/schema.sql');
$statements = array_filter(array_map('trim', explode(';', $schema)));

foreach ($statements as $stmt) {
    if (!empty($stmt)) {
        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            echo "Schema notice: " . $e->getMessage() . "\n";
        }
    }
}
echo "✓ Schema tables verified.\n";

// 2. Seed Stations
$stCount = $pdo->query("SELECT COUNT(*) FROM stations")->fetchColumn();
if ($stCount == 0) {
    $stations = [
        ['ST-DLA', 'Gare Centrale Douala (Akwa)', 'Douala', 'Boulevard de la Liberté, Akwa', '+237 233 42 11 00', 4.0511, 9.7679],
        ['ST-YAO', 'Terminal Mvan Yaoundé', 'Yaoundé', 'Carrefour Mvan, Yaoundé', '+237 222 30 45 67', 3.8480, 11.5021],
        ['ST-BAF', 'Gare Urbaine Bafoussam', 'Bafoussam', 'Entrée Ville, Bafoussam', '+237 233 44 88 99', 5.4777, 10.4176],
        ['ST-BDA', 'Gare Commerciale Bamenda', 'Bamenda', 'Commercial Avenue, Bamenda', '+237 233 36 12 34', 5.9631, 10.1591],
        ['ST-BER', 'Gare de l\'Est Bertoua', 'Bertoua', 'Avenue des Transporteurs, Bertoua', '+237 222 24 10 20', 4.5773, 13.6846]
    ];
    $stmt = $pdo->prepare("INSERT INTO stations (station_code, name, city, address, phone, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($stations as $s) {
        $stmt->execute($s);
    }
    echo "✓ Seeded 5 Cameroon stations.\n";
}

// 3. Seed Routes
$rtCount = $pdo->query("SELECT COUNT(*) FROM routes")->fetchColumn();
if ($rtCount == 0) {
    $routes = [
        ['RT-DLA-YAO', 'Douala (Akwa) ↔ Yaoundé (Mvan) Express (N3)', 1, 2, 242.0, 3.5],
        ['RT-YAO-DLA', 'Yaoundé (Mvan) ↔ Douala (Akwa) Express (N3)', 2, 1, 242.0, 3.5],
        ['RT-DLA-BAF', 'Douala ↔ Bafoussam Autoroute (N5)', 1, 3, 265.0, 4.5],
        ['RT-BAF-BDA', 'Bafoussam ↔ Bamenda Route Touristique (N6)', 3, 4, 85.0, 2.0]
    ];
    $stmt = $pdo->prepare("INSERT INTO routes (route_code, name, origin_station_id, destination_station_id, distance_km, estimated_hours) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($routes as $r) {
        $stmt->execute($r);
    }
    echo "✓ Seeded 4 major intercity routes.\n";
}

// 4. Seed Users (Admin debora, driver, agent, customer)
$uCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
if ($uCount == 0) {
    $users = [
        ['Debora Nakamura', 'debora', 'debora@globalvoyage.com', password_hash('Demodebora', PASSWORD_DEFAULT), '+237 690 00 00 00', 'ADMIN'],
        ['Paul Atangana', 'driver.paul', 'driver.paul@globalvoyage.com', password_hash('Demodebora', PASSWORD_DEFAULT), '+237 677 11 22 33', 'DRIVER'],
        ['Jean-Pierre Fotso', 'agent.fotso', 'agent.fotso@globalvoyage.com', password_hash('Demodebora', PASSWORD_DEFAULT), '+237 699 44 55 66', 'PARCEL_AGENT'],
        ['Alice Mengue', 'customer.alice', 'customer.alice@gmail.com', password_hash('Demodebora', PASSWORD_DEFAULT), '+237 650 99 88 77', 'CUSTOMER']
    ];
    $stmt = $pdo->prepare("INSERT INTO users (name, username, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($users as $u) {
        $stmt->execute($u);
    }
    echo "✓ Seeded users with Admin debora (Demodebora).\n";
} else {
    // Ensure debora password is Demodebora
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = 'debora'");
    $stmt->execute([password_hash('Demodebora', PASSWORD_DEFAULT)]);
    echo "✓ Verified credentials for debora user.\n";
}

// 5. Seed IoT Trackers
$trkCount = $pdo->query("SELECT COUNT(*) FROM iot_trackers")->fetchColumn();
if ($trkCount == 0) {
    $trackers = [
        ['TRK-8801', 'GV-GPS-4G-Pro', 94, 'ASSIGNED', 3.8667, 10.8667, 74.0],
        ['TRK-8802', 'GV-GPS-4G-Pro', 98, 'ASSIGNED', 4.0511, 9.7679, 0.0],
        ['TRK-8803', 'GV-GPS-4G-Pro', 87, 'ASSIGNED', 4.0511, 9.7679, 0.0],
        ['TRK-8804', 'GV-GPS-4G-Compact', 91, 'AVAILABLE', 4.0511, 9.7679, 0.0]
    ];
    $stmt = $pdo->prepare("INSERT INTO iot_trackers (tracker_code, device_model, battery_level, status, last_latitude, last_longitude, last_speed) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($trackers as $t) {
        $stmt->execute($t);
    }
    echo "✓ Seeded 4 IoT Trackers.\n";
}

// 6. Seed Trips (Dynamic for Today and Upcoming Days)
$today = date('Y-m-d');
$tomorrow = date('Y-m-d', strtotime('+1 day'));

$tripCount = $pdo->query("SELECT COUNT(*) FROM trips")->fetchColumn();
if ($tripCount == 0) {
    $trips = [
        ['GV-1025', 1, 2, 'LT-782-AA (Scania VIP First Class)', "$today 06:30:00", "$today 10:30:00", 5000, 'IN_TRANSIT'],
        ['GV-1026', 1, 2, 'CE-341-BA (Mercedes Comfort Executive)', "$today 09:00:00", "$today 13:00:00", 5000, 'SCHEDULED'],
        ['GV-1028', 1, 2, 'LT-890-BB (Scania VIP Lounge Express)', "$today 14:00:00", "$today 18:00:00", 5000, 'SCHEDULED'],
        ['GV-1030', 1, 2, 'LT-902-CC (Volvo Highliner Luxury)', "$today 17:30:00", "$today 21:30:00", 5000, 'SCHEDULED'],
        ['GV-1031', 2, 2, 'LT-782-AA (Scania VIP Express Return)', "$tomorrow 07:00:00", "$tomorrow 11:00:00", 5000, 'SCHEDULED'],
        ['GV-2041', 3, 2, 'OU-112-DA (Marcopolo Paradiso)', "$today 08:30:00", "$today 13:00:00", 6000, 'SCHEDULED'],
    ];
    $stmt = $pdo->prepare("INSERT INTO trips (trip_number, route_id, driver_id, bus_number, departure_scheduled, arrival_scheduled, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($trips as $tr) {
        $stmt->execute($tr);
    }
    echo "✓ Seeded 6 scheduled trips for today & tomorrow.\n";
}

// 7. Seed Sample Bookings
$bkCount = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
if ($bkCount == 0) {
    $bookings = [
        [
            'BK-2026-99823', 1, 1, 'GV-1025', 'Scania VIP First Class',
            'Deborah Nakamura', '110293849', 'debora@globalvoyage.com', '677949699',
            'Douala (Gare Centrale Akwa)', 'Yaoundé (Terminal Mvan)',
            $today, '06:30', 14, 'Siège N° 14 (Fenêtre VIP)', 5000,
            'MTN_MOMO', 'PAID', 'd7745cb0-a29c-4104-bd90-9aff213b342c', 'MTN', '*126#', 'GV-INIT-001'
        ]
    ];
    $stmt = $pdo->prepare("INSERT INTO bookings (
        booking_reference, user_id, trip_id, trip_number, bus_model,
        passenger_name, passenger_id_number, passenger_email, passenger_phone,
        origin, destination, travel_date, departure_time, seat_number, seat_label, amount,
        payment_method, payment_status, campay_reference, campay_operator, campay_ussd_code, external_reference
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($bookings as $b) {
        $stmt->execute($b);
    }
    echo "✓ Seeded initial confirmed booking BK-2026-99823.\n";
}

// 8. Seed Sample Parcels
$pCount = $pdo->query("SELECT COUNT(*) FROM parcels")->fetchColumn();
if ($pCount == 0) {
    $parcels = [
        [
            'PAR-2026-00125', 4, 'Alice Mengue', '+237 650 99 88 77', 'customer.alice@gmail.com',
            'Henri Tagne', '+237 670 11 22 33', 'Quartier Bastos, Yaoundé',
            1, 2, 1, 1, 12.5, 450000, 'Laptops, networking router & electronic components',
            'IN_TRANSIT', 1
        ],
        [
            'PAR-2026-00126', 4, 'Alice Mengue', '+237 650 99 88 77', 'customer.alice@gmail.com',
            'Dr. Joseph Kamga', '+237 699 33 44 55', 'Hôpital Régional de Bafoussam',
            1, 3, 1, 6, 8.0, 120000, 'Medical diagnostic kits and pharmaceuticals',
            'REGISTERED', 2
        ]
    ];
    $stmt = $pdo->prepare("INSERT INTO parcels (
        tracking_number, customer_id, sender_name, sender_phone, sender_email,
        recipient_name, recipient_phone, recipient_address,
        origin_station_id, destination_station_id, current_station_id, trip_id,
        weight_kg, declared_value, description, status, tracker_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($parcels as $p) {
        $stmt->execute($p);
    }
    echo "✓ Seeded 2 test parcels with IoT tracking.\n";
}

echo "=== Migration & Seeding Completed Successfully! ===\n";
