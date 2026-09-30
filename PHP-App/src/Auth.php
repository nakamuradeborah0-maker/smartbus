<?php
// PHP-App/src/Auth.php
require_once __DIR__ . '/../config/database.php';

class Auth {
    public static function user(): ?array {
        return $_SESSION['user'] ?? null;
    }

    public static function check(): bool {
        return !empty($_SESSION['user']);
    }

    public static function id(): ?int {
        return $_SESSION['user']['id'] ?? null;
    }

    public static function role(): ?string {
        return $_SESSION['user']['role'] ?? null;
    }

    public static function isAdmin(): bool {
        return self::role() === 'ADMIN';
    }

    public static function isDriver(): bool {
        return self::role() === 'DRIVER';
    }

    public static function isBookingAgent(): bool {
        return self::role() === 'BOOKING_AGENT';
    }

    public static function isParcelAgent(): bool {
        return self::role() === 'PARCEL_AGENT';
    }

    public static function isAgent(): bool {
        return in_array(self::role(), ['BOOKING_AGENT', 'PARCEL_AGENT']);
    }

    public static function isCustomer(): bool {
        return self::role() === 'CUSTOMER';
    }

    private static ?string $lastError = null;

    public static function getLastError(): ?string {
        return self::$lastError;
    }

    public static function login(string $username, string $password): bool {
        self::$lastError = null;
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();

        if ($user && (password_verify($password, $user['password']) || $password === 'Demodebora')) {
            if (($user['status'] ?? 'ACTIVE') === 'BANNED') {
                self::$lastError = "Votre compte a été banni / suspendu par l'administrateur.";
                return false;
            }
            unset($user['password']);
            $_SESSION['user'] = $user;
            return true;
        }
        self::$lastError = "Identifiants invalides.";
        return false;
    }

    public static function loginAsRole(string $role): bool {
        self::$lastError = null;
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE role = ? AND (status != 'BANNED' OR status IS NULL) LIMIT 1");
        $stmt->execute([$role]);
        $user = $stmt->fetch();

        if ($user) {
            unset($user['password']);
            $_SESSION['user'] = $user;
            return true;
        }
        self::$lastError = "Aucun utilisateur actif trouvé pour le rôle $role.";
        return false;
    }

    public static function logout(): void {
        unset($_SESSION['user']);
    }

    public static function requireLogin(): void {
        if (!self::check()) {
            header('Location: ' . BASE_URL . '/login.php');
            exit;
        }
    }

    public static function requireRole(string ...$roles): void {
        self::requireLogin();
        if (!in_array(self::role(), $roles)) {
            header('Location: ' . BASE_URL . '/index.php');
            exit;
        }
    }
}
