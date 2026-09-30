<?php
// PHP-App/public/api/trips.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Services/TripService.php';

$origin = $_GET['origin'] ?? null;
$destination = $_GET['destination'] ?? null;
$date = $_GET['date'] ?? null;

$trips = TripService::getTrips($origin, $destination, $date);
echo json_encode($trips);
