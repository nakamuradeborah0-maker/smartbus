<?php
// PHP-App/public/api/campay-webhook.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Services/BookingService.php';

// Accept JSON payload from CamPay webhook
$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?? $_POST;

if (empty($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'No payload received']);
    exit;
}

$status = strtoupper($data['status'] ?? '');
$ref = $data['reference'] ?? '';
$externalRef = $data['external_reference'] ?? '';

if ($status === 'SUCCESSFUL' && ($externalRef || $ref)) {
    // Confirm payment permanently in database
    BookingService::confirmPayment($externalRef ?: $ref, $ref);
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Payment webhook processed successfully']);
    exit;
}

http_response_code(200);
echo json_encode(['status' => 'acknowledged', 'event_status' => $status]);
