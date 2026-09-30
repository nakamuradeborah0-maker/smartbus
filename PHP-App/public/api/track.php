<?php
// PHP-App/public/api/track.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Services/ParcelService.php';

$num = trim($_GET['num'] ?? $_GET['query'] ?? '');
if (empty($num)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tracking number required']);
    exit;
}

$parcel = ParcelService::track($num);
if ($parcel) {
    echo json_encode(['found' => true, 'parcel' => $parcel]);
} else {
    echo json_encode(['found' => false, 'error' => 'Colis introuvable']);
}
