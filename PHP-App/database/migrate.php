<?php
// PHP-App/database/migrate.php
require_once __DIR__ . '/../config/database.php';

echo "=== SmartBus PHP Database Migration & Clean Seeder (Douala <-> Yaoundé Only) ===\n";

$pdo = Database::getConnection();
$pdo->exec("PRAGMA foreign_keys = OFF;");

// 1. Run Schema
$schema = file_get_contents(__DIR__ . '/schema.sql');
$statements = array_filter(array_map('trim', explode(';', $schema)));

foreach ($statements as $stmt) {
    if (!empty($stmt)) {
        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            // ignore table exists
        }
    }
}
echo "[OK] Schema verified.\n";

// Clear non-Douala/Yaoundé data
$pdo->exec("DELETE FROM bookings WHERE origin NOT LIKE '%Douala%' AND origin NOT LIKE '%Yaoundé%'");
$pdo->exec("DELETE FROM parcels WHERE origin_station_id > 2 OR destination_station_id > 2");
$pdo->exec("DELETE FROM trips WHERE route_id > 2");
$pdo->exec("DELETE FROM routes WHERE id > 2");
$pdo->exec("DELETE FROM stations WHERE id > 2");

// 2. Ensure only 2 Stations exist
$pdo->exec("DELETE FROM stations");
$stations = [
    [1, 'ST-DLA', 'Gare Centrale Douala (Akwa)', 'Douala', 'Boulevard de la Liberté, Akwa', '+237 233 42 11 00', 4.0511, 9.7679],
    [2, 'ST-YAO', 'Terminal Mvan Yaoundé', 'Yaoundé', 'Carrefour Mvan, Yaoundé', '+237 222 30 45 67', 3.8480, 11.5021]
];
$stmt = $pdo->prepare("INSERT INTO stations (id, station_code, name, city, address, phone, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($stations as $s) {
    $stmt->execute($s);
}
echo "[OK] Set exactly 2 stations: Douala (Akwa) and Yaoundé (Mvan).\n";

// 3. Ensure only 2 Routes exist
$pdo->exec("DELETE FROM routes");
$routes = [
    [1, 'RT-DLA-YAO', 'Douala (Akwa) ➔ Yaoundé (Mvan) Express (N3)', 1, 2, 242.0, 3.5],
    [2, 'RT-YAO-DLA', 'Yaoundé (Mvan) ➔ Douala (Akwa) Express (N3)', 2, 1, 242.0, 3.5]
];
$stmt = $pdo->prepare("INSERT INTO routes (id, route_code, name, origin_station_id, destination_station_id, distance_km, estimated_hours) VALUES (?, ?, ?, ?, ?, ?, ?)");
foreach ($routes as $r) {
    $stmt->execute($r);
}
echo "[OK] Set exactly 2 routes: Douala ➔ Yaoundé and Yaoundé ➔ Douala.\n";

// 4. Ensure Users
$users = [
    [1, 'Debora Nakamura', 'debora', 'debora@globalvoyage.com', password_hash('Demodebora', PASSWORD_DEFAULT), '+237 690 00 00 00', 'ADMIN'],
    [2, 'Paul Atangana', 'paul_driver', 'driver.paul@globalvoyage.com', password_hash('password123', PASSWORD_DEFAULT), '+237 677 11 22 33', 'DRIVER'],
    [3, 'Jean-Pierre Fotso', 'agent_douala', 'agent.fotso@globalvoyage.com', password_hash('password123', PASSWORD_DEFAULT), '+237 699 44 55 66', 'PARCEL_AGENT'],
    [4, 'Alice Mengue', 'alice_customer', 'customer.alice@gmail.com', password_hash('password123', PASSWORD_DEFAULT), '+237 650 99 88 77', 'CUSTOMER']
];
$pdo->exec("DELETE FROM users");
$stmt = $pdo->prepare("INSERT INTO users (id, name, username, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)");
foreach ($users as $u) {
    $stmt->execute($u);
}
echo "[OK] Verified all users (debora / Demodebora, etc.).\n";

// 5. Ensure IoT Trackers
$pdo->exec("DELETE FROM iot_trackers");
$trackers = [
    [1, 'TRK-8801', 'GV-GPS-4G-Pro', 94, 'ASSIGNED', 3.8667, 10.8667, 74.0],
    [2, 'TRK-8802', 'GV-GPS-4G-Pro', 98, 'ASSIGNED', 4.0511, 9.7679, 0.0],
    [3, 'TRK-8803', 'GV-GPS-4G-Pro', 87, 'AVAILABLE', 3.8480, 11.5021, 0.0],
    [4, 'TRK-8804', 'GV-GPS-4G-Compact', 91, 'AVAILABLE', 4.0511, 9.7679, 0.0]
];
$stmt = $pdo->prepare("INSERT INTO iot_trackers (id, tracker_code, device_model, battery_level, status, last_latitude, last_longitude, last_speed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($trackers as $t) {
    $stmt->execute($t);
}
echo "[OK] Seeded 4 IoT Trackers.\n";

// 6. Seed Clean Daily Trips for Today and Tomorrow between Douala and Yaoundé ONLY
$pdo->exec("DELETE FROM trips");
$today = date('Y-m-d');
$tomorrow = date('Y-m-d', strtotime('+1 day'));

$dates = [$today, $tomorrow];
$insTrip = $pdo->prepare("INSERT INTO trips (trip_number, route_id, driver_id, bus_number, departure_scheduled, arrival_scheduled, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')");

foreach ($dates as $d) {
    $daily = [
        ['GV-1025', 1, 2, 'LT-782-AA (Scania VIP First Class)', $d . ' 06:30:00', $d . ' 10:00:00', 5000],
        ['GV-1027', 1, 2, 'CE-341-BA (Mercedes Comfort Executive)', $d . ' 09:00:00', $d . ' 12:30:00', 5000],
        ['GV-1029', 1, 2, 'LT-890-BB (Scania VIP Lounge Express)', $d . ' 11:30:00', $d . ' 15:00:00', 5000],
        ['GV-1031', 1, 2, 'LT-902-CC (Volvo Highliner Luxury)', $d . ' 14:00:00', $d . ' 17:30:00', 5000],
        ['GV-1033', 1, 2, 'LT-782-AA (Scania VIP First Class)', $d . ' 16:30:00', $d . ' 20:00:00', 5000],
        ['GV-1035', 1, 2, 'CE-341-BA (Mercedes Comfort Executive)', $d . ' 18:30:00', $d . ' 22:00:00', 5000],

        // Return: Yaoundé -> Douala
        ['GV-2026', 2, 2, 'OU-112-DA (Marcopolo Paradiso VIP)', $d . ' 06:30:00', $d . ' 10:00:00', 5000],
        ['GV-2028', 2, 2, 'LT-554-DD (Scania VIP Express)', $d . ' 09:00:00', $d . ' 12:30:00', 5000],
        ['GV-2030', 2, 2, 'OU-112-DA (Marcopolo Paradiso VIP)', $d . ' 11:30:00', $d . ' 15:00:00', 5000],
        ['GV-2032', 2, 2, 'LT-554-DD (Scania VIP Express)', $d . ' 14:00:00', $d . ' 17:30:00', 5000],
        ['GV-2034', 2, 2, 'OU-112-DA (Marcopolo Paradiso VIP)', $d . ' 16:30:00', $d . ' 20:00:00', 5000],
        ['GV-2036', 2, 2, 'LT-554-DD (Scania VIP Express)', $d . ' 18:30:00', $d . ' 22:00:00', 5000],
    ];

    foreach ($daily as $tr) {
        $tr[0] = $tr[0] . '-' . date('md', strtotime($d));
        $insTrip->execute($tr);
    }
}
echo "[OK] Seeded Douala <-> Yaoundé VIP trips for today and tomorrow.\n";

// 7. Seed Sample Bookings
$pdo->exec("DELETE FROM bookings");
$insB = $pdo->prepare("INSERT INTO bookings (
    booking_reference, user_id, trip_id, trip_number, bus_model,
    passenger_name, passenger_id_number, passenger_email, passenger_phone,
    origin, destination, travel_date, departure_time, seat_number, seat_label, amount,
    payment_method, payment_status, campay_reference, campay_operator, campay_ussd_code, external_reference
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$insB->execute([
    'BK-2026-99823', 1, 1, 'GV-1025', 'Scania VIP First Class',
    'Deborah Nakamura', '110293849', 'debora@globalvoyage.com', '677949699',
    'Douala (Gare Centrale Akwa)', 'Yaoundé (Terminal Mvan)', $today, '06:30', 14, 'Siège N° 14 (Fenêtre VIP)', 5000,
    'MTN_MOMO', 'PAID', 'd7745cb0-a29c-4104-bd90-9aff213b342c', 'MTN', '*126#', 'GV-INIT-001'
]);

$insB->execute([
    'BK-2026-99824', 4, 1, 'GV-1025', 'Scania VIP First Class',
    'Alice Mengue', '109283746', 'customer.alice@gmail.com', '650998877',
    'Douala (Gare Centrale Akwa)', 'Yaoundé (Terminal Mvan)', $today, '06:30', 15, 'Siège N° 15 (Couloir VIP)', 5000,
    'ORANGE_MONEY', 'PAID', 'b8839cb0-1111-4104-bd90-9aff213b1111', 'ORANGE', '#150*50#', 'GV-INIT-002'
]);
echo "[OK] Seeded sample paid bookings.\n";

// 8. Seed Sample Parcel
$pdo->exec("DELETE FROM parcels");
$pdo->exec("DELETE FROM parcel_status_history");
$insP = $pdo->prepare("INSERT INTO parcels (
    tracking_number, customer_id, sender_name, sender_phone, sender_email,
    recipient_name, recipient_phone, recipient_address, origin_station_id, destination_station_id,
    current_station_id, trip_id, weight_kg, declared_value, description, status, tracker_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$insP->execute([
    'PAR-2026-00125', 4, 'Alice Mengue', '+237 650 99 88 77', 'customer.alice@gmail.com',
    'Henri Tagne', '+237 670 11 22 33', 'Quartier Bastos, Yaoundé', 1, 2,
    1, 1, 12.5, 450000, 'Matériel électronique et documents confidentiels', 'IN_TRANSIT', 1
]);

$insH = $pdo->prepare("INSERT INTO parcel_status_history (parcel_id, station_id, status, notes) VALUES (?, ?, ?, ?)");
$insH->execute([1, 1, 'REÇU_EN_GARE', "Dépôt du colis au guichet Gare Centrale Douala (Akwa)"]);
$insH->execute([1, 1, 'CHARGÉ_EN_SOUTE', "Chargé en soute sécurisée dans le car Scania VIP #LT-782-AA"]);
$insH->execute([1, 1, 'EN_TRANSIT', "Départ du convoi en direction de Yaoundé Mvan sur l'Axe Lourd N3"]);

echo "[OK] Seeded sample parcel PAR-2026-00125 with checkpoint history.\n";
echo "=== Migration Complete ===\n";
