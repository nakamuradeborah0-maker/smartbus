<?php
// PHP-App/public/api/payment-demo-confirm.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Services/BookingService.php';

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$ref = $input['reference'] ?? '';

if ($ref) {
    BookingService::confirmPayment($ref);
    echo json_encode([
        'success' => true,
        'status' => 'SUCCESSFUL',
        'message' => 'Paiement confirmé et billet émis en base de données.'
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Reference missing']);
