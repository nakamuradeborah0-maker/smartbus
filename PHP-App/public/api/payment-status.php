<?php
// PHP-App/public/api/payment-status.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Services/CampayService.php';
require_once __DIR__ . '/../../src/Services/BookingService.php';

$reference = $_GET['reference'] ?? '';
if (empty($reference)) {
    http_response_code(400);
    echo json_encode(['error' => 'Reference parameter is required']);
    exit;
}

$status = CampayService::getStatus($reference);

if (($status['status'] ?? '') === 'SUCCESSFUL') {
    BookingService::confirmPayment($reference, $status['reference'] ?? $reference);
}

echo json_encode($status);
