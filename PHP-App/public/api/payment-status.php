<?php
// PHP-App/public/api/payment-status.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Services/CampayService.php';
require_once __DIR__ . '/../../src/Services/BookingService.php';

$reference = trim($_GET['reference'] ?? $_POST['reference'] ?? '');
if (empty($reference)) {
    http_response_code(400);
    echo json_encode(['error' => 'Reference parameter is required']);
    exit;
}

// 1. Look up booking in local database
$booking = BookingService::getBookingByRef($reference);

if ($booking) {
    // A. Already marked as PAID in database
    if ($booking['payment_status'] === 'PAID') {
        echo json_encode([
            'success' => true,
            'status' => 'SUCCESSFUL',
            'booking_reference' => $booking['booking_reference'],
            'reference' => $booking['campay_reference'] ?: $booking['booking_reference'],
            'operator' => $booking['campay_operator'] ?: 'MTN',
            'amount' => (int)$booking['amount'],
            'is_paid' => true
        ]);
        exit;
    }

    // B. Check status from CamPay API if campay_reference exists
    $campayRef = $booking['campay_reference'] ?: $reference;
    if ($campayRef && !str_starts_with($campayRef, 'BK-')) {
        $campayStatus = CampayService::getStatus($campayRef);
        if (($campayStatus['status'] ?? '') === 'SUCCESSFUL') {
            BookingService::confirmPayment($booking['booking_reference'], $campayStatus['reference'] ?? $campayRef);
            echo json_encode([
                'success' => true,
                'status' => 'SUCCESSFUL',
                'booking_reference' => $booking['booking_reference'],
                'reference' => $campayRef,
                'operator' => $campayStatus['operator'] ?? $booking['campay_operator'],
                'amount' => (int)$booking['amount'],
                'live_carrier_confirmed' => true
            ]);
            exit;
        }

        if (($campayStatus['status'] ?? '') === 'FAILED') {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("UPDATE bookings SET payment_status = 'FAILED' WHERE booking_reference = ?");
            $stmt->execute([$booking['booking_reference']]);
            echo json_encode([
                'success' => false,
                'status' => 'FAILED',
                'booking_reference' => $booking['booking_reference']
            ]);
            exit;
        }
    }

    // C. Sandbox / Demo automatic detection:
    // In CamPay demo environment, real carrier USSD prompts cannot reach end users' phones.
    // Allow realistic ~4 seconds for user to view MoMo prompt, then automatically confirm payment!
    if (CAMPAY_USE_DEMO) {
        $createdAt = !empty($booking['created_at']) ? strtotime($booking['created_at'] . ' UTC') : time();
        $elapsed = time() - $createdAt;

        if ($elapsed >= 4) {
            BookingService::confirmPayment($booking['booking_reference'], $booking['campay_reference'] ?: ('DEMO-' . time()));
            echo json_encode([
                'success' => true,
                'status' => 'SUCCESSFUL',
                'booking_reference' => $booking['booking_reference'],
                'reference' => $booking['campay_reference'] ?: $booking['booking_reference'],
                'operator' => $booking['campay_operator'] ?: 'MTN',
                'amount' => (int)$booking['amount'],
                'auto_detected' => true
            ]);
            exit;
        }

        echo json_encode([
            'success' => true,
            'status' => 'PENDING',
            'booking_reference' => $booking['booking_reference'],
            'reference' => $booking['campay_reference'] ?: $booking['booking_reference'],
            'elapsed_seconds' => max(0, $elapsed),
            'wait_remaining' => max(0, 4 - $elapsed)
        ]);
        exit;
    }

    // Live mode waiting for carrier PIN debit
    echo json_encode([
        'success' => true,
        'status' => 'PENDING',
        'booking_reference' => $booking['booking_reference'],
        'reference' => $booking['campay_reference'] ?: $booking['booking_reference']
    ]);
    exit;
}

// 2. Fallback query CamPay directly if not found in local bookings
$status = CampayService::getStatus($reference);
if (($status['status'] ?? '') === 'SUCCESSFUL') {
    BookingService::confirmPayment($reference, $status['reference'] ?? $reference);
}

echo json_encode($status);

