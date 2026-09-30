<?php
// PHP-App/src/Services/TripService.php
require_once __DIR__ . '/../../config/database.php';

class TripService {
    public static function getTrips(?string $origin = null, ?string $destination = null, ?string $date = null): array {
        $pdo = Database::getConnection();

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
            $sql .= " AND (so.city LIKE ? OR so.name LIKE ?)";
            $params[] = "%$origin%";
            $params[] = "%$origin%";
        }

        if ($destination) {
            $sql .= " AND (sd.city LIKE ? OR sd.name LIKE ?)";
            $params[] = "%$destination%";
            $params[] = "%$destination%";
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
