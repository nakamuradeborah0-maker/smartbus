<?php
// PHP-App/config/config.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// App Settings
define('APP_NAME', 'Global Voyages');
define('APP_TAGLINE', 'VIP Intercity Coach & Smart Parcel Tracking');
define('APP_VERSION', '2.0.0');

// Dynamic Base URL detection
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || ($_SERVER['SERVER_PORT'] ?? 80) == 443) ? "https://" : "http://";
$host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
define('BASE_URL', $protocol . $host);

// Database Settings
define('DB_TYPE', 'sqlite'); // 'sqlite' or 'mysql'
define('DB_SQLITE_PATH', __DIR__ . '/../database/smartbus.sqlite');
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'smartbus_db');
define('DB_USER', 'root');
define('DB_PASS', '');

// Carto Maps API Key
define('CARTO_API_KEY', 'cb1_43oe_1_75bd64c2f244c194ee1bc360');

// CamPay Mobile Money Credentials (Sandbox/Live)
define('CAMPAY_USE_DEMO', true);
define('CAMPAY_BASE_URL', 'https://demo.campay.net');
define('CAMPAY_USERNAME', 'xpxNhfcgfG8jDksYM-VEcwXnOth2nmGXWgN9amo_Ucz2_5flqcbqFXlVAZYndgPw3KwNaZEJZ-gfvNK0uX-e4Q');
define('CAMPAY_PASSWORD', 'Emuj1fTBz7v76yMk4r8xmmETWXZerN1mYXDX5OGXHz1qQh5uu1r4_mxaBrVwywca5_haT0lKaZhY5QVOHSmxAg');
define('CAMPAY_DEMO_MAX_AMOUNT', 25); // In sandbox, collect amount must be <= 25

// Active language resolution
if (isset($_GET['lang']) && in_array($_GET['lang'], ['fr', 'en'])) {
    $_SESSION['lang'] = $_GET['lang'];
} elseif (!isset($_SESSION['lang'])) {
    $_SESSION['lang'] = 'en'; // Default French
}
