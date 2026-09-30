<?php
// PHP-App/src/Services/IoTService.php
require_once __DIR__ . '/../../config/database.php';

class IoTService {
    // 8 Milestones along Douala ↔ Yaoundé Highway (N3)
    public static function getMilestones(): array {
        return [
            ['name' => 'Douala Gare Centrale Akwa', 'city' => 'Douala', 'lat' => 4.0511, 'lng' => 9.7679, 'km' => 0],
            ['name' => 'Yassa Checkpoint & Péage', 'city' => 'Douala Sortie', 'lat' => 4.0150, 'lng' => 9.8400, 'km' => 20],
            ['name' => 'Edéa Pont Sanaga', 'city' => 'Edéa', 'lat' => 3.8000, 'lng' => 10.1333, 'km' => 85],
            ['name' => 'Pouma Carrefour', 'city' => 'Pouma', 'lat' => 3.8500, 'lng' => 10.5167, 'km' => 130],
            ['name' => 'Boumnyébel Relais Routier', 'city' => 'Boumnyébel', 'lat' => 3.8667, 'lng' => 10.8667, 'km' => 165],
            ['name' => 'Matomb Descente', 'city' => 'Matomb', 'lat' => 3.8833, 'lng' => 11.0833, 'km' => 195],
            ['name' => 'Mbankomo Échangeur', 'city' => 'Mbankomo', 'lat' => 3.7800, 'lng' => 11.3800, 'km' => 220],
            ['name' => 'Yaoundé Terminal Mvan', 'city' => 'Yaoundé', 'lat' => 3.8480, 'lng' => 11.5021, 'km' => 242]
        ];
    }

    public static function getLivePosition(): array {
        $ms = self::getMilestones();
        // Time-based simulated progression along Douala ➔ Yaoundé
        $totalMinutes = 210; // 3h 30m
        $currentMin = (int)date('i') % 60; // Progress indicator
        $progressPct = ($currentMin / 60) * 100;
        
        $idx = (int)floor(($progressPct / 100) * (count($ms) - 1));
        $idx = max(0, min($idx, count($ms) - 1));
        $nextIdx = min($idx + 1, count($ms) - 1);

        $curr = $ms[$idx];
        $next = $ms[$nextIdx];

        return [
            'latitude' => $curr['lat'],
            'longitude' => $curr['lng'],
            'speed' => rand(65, 82),
            'battery' => 94,
            'current_stop' => $curr['name'],
            'next_stop' => $next['name'],
            'progress_pct' => round($progressPct, 1),
            'bus_plate' => 'LT-782-AA',
            'tracker_code' => 'TRK-8801',
            'updated_at' => date('Y-m-d H:i:s')
        ];
    }
}
