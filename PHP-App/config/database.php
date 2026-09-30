<?php
// PHP-App/config/database.php
require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            try {
                if (DB_TYPE === 'sqlite') {
                    $dir = dirname(DB_SQLITE_PATH);
                    if (!is_dir($dir)) {
                        mkdir($dir, 0777, true);
                    }
                    self::$instance = new PDO('sqlite:' . DB_SQLITE_PATH);
                    self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                    self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                    self::$instance->exec('PRAGMA foreign_keys = ON;');
                } else {
                    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                    self::$instance = new PDO($dsn, DB_USER, DB_PASS, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]);
                }
            } catch (PDOException $e) {
                // If SQLite file cannot be opened, throw clean error
                die(json_encode([
                    'error' => 'Database connection failed: ' . $e->getMessage()
                ]));
            }
        }
        return self::$instance;
    }
}
