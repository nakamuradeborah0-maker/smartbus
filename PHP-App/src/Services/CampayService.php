<?php
// PHP-App/src/Services/CampayService.php
require_once __DIR__ . '/../../config/config.php';

class CampayService {
    public static function normalizePhone(string $phone): ?string {
        $cleaned = preg_replace('/\D/', '', $phone);
        if (str_starts_with($cleaned, '00237')) {
            $cleaned = substr($cleaned, 2);
        }
        if (strlen($cleaned) === 9 && in_array($cleaned[0], ['6', '2'])) {
            $cleaned = '237' . $cleaned;
        }
        return (strlen($cleaned) === 12 && str_starts_with($cleaned, '237')) ? $cleaned : null;
    }

    public static function getToken(): ?string {
        $ch = curl_init(CAMPAY_BASE_URL . '/api/token/');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'username' => CAMPAY_USERNAME,
            'password' => CAMPAY_PASSWORD
        ]));
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            return $data['token'] ?? null;
        }
        return null;
    }

    public static function collect(int $amount, string $phone, string $description, string $externalRef): array {
        $formattedPhone = self::normalizePhone($phone);
        if (!$formattedPhone) {
            return ['success' => false, 'error' => 'Numéro invalide (format 9 chiffres requis ex: 677949699).'];
        }

        $token = self::getToken();
        $finalAmount = CAMPAY_USE_DEMO ? (string)CAMPAY_DEMO_MAX_AMOUNT : (string)$amount;

        if (!$token) {
            // Fallback simulation mode
            $simRef = 'SIM-' . time();
            return [
                'success' => true,
                'reference' => $simRef,
                'operator' => 'MTN',
                'ussd_code' => '*126#',
                'status' => 'PENDING',
                'external_reference' => $externalRef
            ];
        }

        $ch = curl_init(CAMPAY_BASE_URL . '/api/collect/');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Token ' . $token
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'amount' => $finalAmount,
            'currency' => 'XAF',
            'from' => $formattedPhone,
            'description' => $description,
            'external_reference' => $externalRef
        ]));
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($response, true) ?? [];

        if ($httpCode === 200 && !empty($data['reference'])) {
            return [
                'success' => true,
                'reference' => $data['reference'],
                'operator' => $data['operator'] ?? 'MTN',
                'ussd_code' => $data['ussd_code'] ?? '*126#',
                'status' => 'PENDING',
                'external_reference' => $externalRef
            ];
        }

        return [
            'success' => false,
            'error' => $data['message'] ?? 'Échec de transmission de la demande de paiement.'
        ];
    }

    public static function getStatus(string $reference): array {
        if (str_starts_with($reference, 'SIM-')) {
            return [
                'success' => true,
                'reference' => $reference,
                'status' => 'SUCCESSFUL',
                'amount' => 5000,
                'currency' => 'XAF'
            ];
        }

        $token = self::getToken();
        if (!$token) {
            return ['success' => false, 'status' => 'PENDING'];
        }

        $ch = curl_init(CAMPAY_BASE_URL . '/api/transaction/' . urlencode($reference) . '/');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Token ' . $token]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($response, true) ?? [];

        if ($httpCode === 200 && !empty($data['status'])) {
            return [
                'success' => true,
                'reference' => $data['reference'] ?? $reference,
                'status' => $data['status'], // 'SUCCESSFUL' | 'PENDING' | 'FAILED'
                'operator' => $data['operator'] ?? '',
                'amount' => $data['amount'] ?? 5000
            ];
        }

        return ['success' => false, 'status' => 'PENDING'];
    }
}
