<?php
// PHP-App/public/api/iot-ping.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../src/Services/IoTService.php';

$pos = IoTService::getLivePosition();
echo json_encode($pos);
