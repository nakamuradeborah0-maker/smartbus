<?php
// PHP-App/public/api/payment.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Services/CampayService.php';
require_once __DIR__ . '/../../src/Services/BookingService.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$amount = (int)($input['amount'] ?? 5000);
$phone = $input['phoneNumber'] ?? $input['passenger_phone'] ?? $input['phone'] ?? '';
$ref = $input['bookingReference'] ?? $input['booking_reference'] ?? ('BK-' . time());
$desc = "Global Voyages Ticket $ref";

$res = CampayService::collect($amount, $phone, $desc, $ref);

if ($res['success']) {
    // Save campay ref on booking
    $pdo = Database::getConnection();
    $stmt = $pdo->prepare("UPDATE bookings SET campay_reference = ?, campay_operator = ?, campay_ussd_code = ? WHERE booking_reference = ?");
    $stmt->execute([$res['reference'], $res['operator'], $res['ussd_code'], $ref]);
}

echo json_encode($res);
