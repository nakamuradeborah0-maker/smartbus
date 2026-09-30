<?php
// PHP-App/public/customer/ticket.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Services/BookingService.php';

$ref = trim($_GET['ref'] ?? $_GET['pnr'] ?? '');
if (empty($ref)) {
    die("Référence de billet manquante.");
}

$booking = BookingService::getBookingByRef($ref);

if (!$booking) {
    die("Billet introuvable pour la référence : " . htmlspecialchars($ref));
}

if ($booking['payment_status'] !== 'PAID') {
    die("Paiement non confirmé pour cette réservation. Le billet ne peut pas être émis.");
}

// Render complete boarding pass HTML
echo BookingService::renderBoardingPassHtml($booking);
