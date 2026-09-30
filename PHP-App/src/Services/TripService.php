<?php
// PHP-App/src/Services/TripService.php
require_once __DIR__ . '/../../config/database.php';

class TripService {
    public static function ensureTripsForDate(string $date): void {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM trips WHERE date(departure_scheduled) = date(?)");
        $stmt->execute([$date]);
        if ((int)$stmt->fetchColumn() === 0) {
            $dailySchedule = [
                ['trip_num' => 'GV-1025', 'route_id' => 1, 'driver_id' => 2, 'bus' => 'LT-782-AA (Scania VIP First Class)', 'time' => '06:30:00', 'arr_time' => '10:00:00', 'price' => 5000],
                ['trip_num' => 'GV-1026', 'route_id' => 1, 'driver_id' => 2, 'bus' => 'CE-341-BA (Mercedes Comfort Executive)', 'time' => '09:00:00', 'arr_time' => '12:30:00', 'price' => 5000],
                ['trip_num' => 'GV-1028', 'route_id' => 1, 'driver_id' => 2, 'bus' => 'LT-890-BB (Scania VIP Lounge Express)', 'time' => '14:00:00', 'arr_time' => '17:30:00', 'price' => 5000],
                ['trip_num' => 'GV-1030', 'route_id' => 1, 'driver_id' => 2, 'bus' => 'LT-902-CC (Volvo Highliner Luxury)', 'time' => '17:30:00', 'arr_time' => '21:00:00', 'price' => 5000],
                ['trip_num' => 'GV-1031', 'route_id' => 2, 'driver_id' => 2, 'bus' => 'LT-782-AA (Scania VIP Express Return)', 'time' => '07:00:00', 'arr_time' => '10:30:00', 'price' => 5000],
                ['trip_num' => 'GV-1033', 'route_id' => 2, 'driver_id' => 2, 'bus' => 'CE-341-BA (Mercedes Comfort Executive)', 'time' => '13:00:00', 'arr_time' => '16:30:00', 'price' => 5000],
                ['trip_num' => 'GV-2041', 'route_id' => 3, 'driver_id' => 2, 'bus' => 'OU-112-DA (Marcopolo Paradiso)', 'time' => '08:30:00', 'arr_time' => '13:00:00', 'price' => 6000],
                ['trip_num' => 'GV-2042', 'route_id' => 3, 'driver_id' => 2, 'bus' => 'OU-112-DA (Marcopolo Paradiso Return)', 'time' => '15:00:00', 'arr_time' => '19:30:00', 'price' => 6000],
            ];

            $ins = $pdo->prepare("INSERT INTO trips (trip_number, route_id, driver_id, bus_number, departure_scheduled, arrival_scheduled, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')");
            foreach ($dailySchedule as $s) {
                $dep = $date . ' ' . $s['time'];
                $arr = $date . ' ' . $s['arr_time'];
                $tripCode = $s['trip_num'] . '-' . date('md', strtotime($date));
                $ins->execute([$tripCode, $s['route_id'], $s['driver_id'], $s['bus'], $dep, $arr, $s['price']]);
            }
        }
    }

    public static function getTrips(?string $origin = null, ?string $destination = null, ?string $date = null): array {
        $pdo = Database::getConnection();

        if ($date) {
            self::ensureTripsForDate($date);
        }

        $sql = "SELECT t.*, 
                r.name AS route_name, r.route_code, r.distance_km, r.estimated_hours,
                so.name AS origin_name, so.city AS origin_city,
                sd.name AS destination_name, sd.city AS destination_city,
                u.name AS driver_name
                FROM trips t
                JOIN routes r ON t.route_id = r.id
                JOIN stations so ON r.origin_station_id = so.id
                JOIN stations sd ON r.destination_station_id = sd.id
                LEFT JOIN users u ON t.driver_id = u.id
                WHERE 1=1";

        $params = [];

        if ($origin) {
            $cleanOrigin = trim($origin);
            $sql .= " AND (so.city LIKE ? OR so.name LIKE ?)";
            $params[] = "%$cleanOrigin%";
            $params[] = "%$cleanOrigin%";
        }

        if ($destination) {
            $cleanDest = trim($destination);
            $sql .= " AND (sd.city LIKE ? OR sd.name LIKE ?)";
            $params[] = "%$cleanDest%";
            $params[] = "%$cleanDest%";
        }

        if ($date) {
            $sql .= " AND date(t.departure_scheduled) = date(?)";
            $params[] = $date;
        }

        $sql .= " ORDER BY t.departure_scheduled ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll() ?: [];
    }

    public static function getTripById(int $id): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT t.*, 
            r.name AS route_name, so.name AS origin_name, sd.name AS destination_name,
            so.city AS origin_city, sd.city AS destination_city
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN stations so ON r.origin_station_id = so.id
            JOIN stations sd ON r.destination_station_id = sd.id
            WHERE t.id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public static function updateStatus(int $id, string $status): bool {
        $pdo = Database::getConnection();
        $field = $status === 'IN_TRANSIT' ? 'departure_actual' : ($status === 'ARRIVED' ? 'arrival_actual' : null);
        if ($field) {
            $stmt = $pdo->prepare("UPDATE trips SET status = ?, $field = CURRENT_TIMESTAMP WHERE id = ?");
            return $stmt->execute([$status, $id]);
        }
        $stmt = $pdo->prepare("UPDATE trips SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }
}
