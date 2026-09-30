<?php
// PHP-App/src/Services/ParcelService.php
require_once __DIR__ . '/../../config/database.php';

class ParcelService {
    public static function track(string $trackingNumber): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT p.*,
            so.name AS origin_station, so.city AS origin_city, so.latitude AS origin_lat, so.longitude AS origin_lng,
            sd.name AS dest_station, sd.city AS dest_city, sd.latitude AS dest_lat, sd.longitude AS dest_lng,
            sc.name AS current_station,
            t.trip_number, t.bus_number,
            trk.tracker_code, trk.battery_level, trk.last_latitude, trk.last_longitude, trk.last_speed
            FROM parcels p
            LEFT JOIN stations so ON p.origin_station_id = so.id
            LEFT JOIN stations sd ON p.destination_station_id = sd.id
            LEFT JOIN stations sc ON p.current_station_id = sc.id
            LEFT JOIN trips t ON p.trip_id = t.id
            LEFT JOIN iot_trackers trk ON p.tracker_id = trk.id
            WHERE UPPER(p.tracking_number) = UPPER(?)");
        $stmt->execute([trim($trackingNumber)]);
        $parcel = $stmt->fetch();

        if (!$parcel) return null;

        // Get status history checkpoints
        $hStmt = $pdo->prepare("SELECT h.*, s.name AS station_name FROM parcel_status_history h LEFT JOIN stations s ON h.station_id = s.id WHERE h.parcel_id = ? ORDER BY h.id ASC");
        $hStmt->execute([$parcel['id']]);
        $parcel['history'] = $hStmt->fetchAll() ?: [];

        return $parcel;
    }

    public static function createParcel(array $data): ?array {
        $pdo = Database::getConnection();
        $trackingNumber = 'PAR-' . date('Y') . '-' . str_pad((string)rand(100, 99999), 5, '0', STR_PAD_LEFT);

        $stmt = $pdo->prepare("INSERT INTO parcels (
            tracking_number, customer_id, sender_name, sender_phone, sender_email,
            recipient_name, recipient_phone, recipient_address,
            origin_station_id, destination_station_id, current_station_id, trip_id,
            weight_kg, declared_value, description, status, tracker_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REGISTERED', ?)");

        $stmt->execute([
            $trackingNumber,
            $data['customer_id'] ?? null,
            trim($data['sender_name']),
            trim($data['sender_phone']),
            trim($data['sender_email'] ?? ''),
            trim($data['recipient_name']),
            trim($data['recipient_phone']),
            trim($data['recipient_address']),
            (int)($data['origin_station_id'] ?? 1),
            (int)($data['destination_station_id'] ?? 2),
            (int)($data['origin_station_id'] ?? 1),
            $data['trip_id'] ?? null,
            (float)($data['weight_kg'] ?? 5.0),
            (int)($data['declared_value'] ?? 50000),
            trim($data['description'] ?? ''),
            $data['tracker_id'] ?? null
        ]);

        $id = (int)$pdo->lastInsertId();

        // Initial history entry
        $hStmt = $pdo->prepare("INSERT INTO parcel_status_history (parcel_id, status, station_id, notes) VALUES (?, 'REGISTERED', ?, 'Colis enregistré au guichet.')");
        $hStmt->execute([$id, (int)($data['origin_station_id'] ?? 1)]);

        return self::track($trackingNumber);
    }
}
