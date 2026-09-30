<?php
// PHP-App/public/api/bookings.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Services/BookingService.php';
require_once __DIR__ . '/../../src/Auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = Auth::id();
    $phone = $_GET['phone'] ?? null;
    $tripId = $_GET['trip_id'] ?? null;
    $travelDate = $_GET['travel_date'] ?? null;

    if ($tripId && $travelDate) {
        $occupied = BookingService::getOccupiedSeats((int)$tripId, $travelDate);
        $res = array_map(function($s) { return ['seat_number' => $s]; }, $occupied);
        echo json_encode($res);
        exit;
    }

    $ref = $_GET['ref'] ?? null;

    if ($ref) {
        $booking = BookingService::getBookingByRef($ref);
        echo json_encode($booking ?: ['error' => 'Booking not found']);
        exit;
    }

    $bookings = BookingService::getUserBookings($userId, $phone);
    echo json_encode($bookings);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    if (empty($input['passenger_name']) || empty($input['passenger_phone'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Passenger name and phone are required.']);
        exit;
    }

    if (Auth::check()) {
        $input['user_id'] = Auth::id();
    }

    $booking = BookingService::createBooking($input);
    echo json_encode($booking);
    exit;
}
