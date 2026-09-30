<?php
// PHP-App/src/Services/BookingService.php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Language.php';

class BookingService {
    public static function generateReference(): string {
        return 'BK-' . date('Y') . '-' . rand(10000, 99999);
    }

    public static function getOccupiedSeats(int $tripId, string $travelDate): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT seat_number FROM bookings WHERE trip_id = ? AND travel_date = ? AND payment_status != 'CANCELLED'");
        $stmt->execute([$tripId, $travelDate]);
        $seats = $stmt->fetchAll(PDO::FETCH_COLUMN);
        // Default occupied seats if brand new trip for realistic demonstration
        $defaults = [2, 3, 7, 11, 15, 19, 24, 28];
        return array_values(array_unique(array_merge($defaults, $seats ?: [])));
    }

    public static function createBooking(array $data): array {
        $pdo = Database::getConnection();
        $ref = self::generateReference();

        // Check if seat already taken
        $occupied = self::getOccupiedSeats((int)($data['trip_id'] ?? 1), $data['travel_date']);
        if (in_array((int)$data['seat_number'], $occupied)) {
            // Find next available seat
            for ($s = 1; $s <= 32; $s++) {
                if (!in_array($s, $occupied)) {
                    $data['seat_number'] = $s;
                    break;
                }
            }
        }

        $stmt = $pdo->prepare("INSERT INTO bookings (
            booking_reference, user_id, trip_id, trip_number, bus_model,
            passenger_name, passenger_id_number, passenger_email, passenger_phone,
            origin, destination, travel_date, departure_time, seat_number, seat_label, amount,
            payment_method, payment_status, campay_reference, campay_operator, campay_ussd_code, external_reference
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $seatNum = (int)$data['seat_number'];
        $seatLabel = "Siège N° {$seatNum} (VIP)";

        $stmt->execute([
            $ref,
            $data['user_id'] ?? null,
            $data['trip_id'] ?? 1,
            $data['trip_number'] ?? 'GV-1025',
            $data['bus_model'] ?? 'Scania VIP First Class',
            trim($data['passenger_name']),
            trim($data['passenger_id_number'] ?? ''),
            trim($data['passenger_email'] ?? ''),
            trim($data['passenger_phone']),
            $data['origin'] ?? 'Douala (Gare Centrale Akwa)',
            $data['destination'] ?? 'Yaoundé (Terminal Mvan)',
            $data['travel_date'],
            $data['departure_time'] ?? '06:30',
            $seatNum,
            $seatLabel,
            (int)($data['amount'] ?? 5000),
            $data['payment_method'] ?? 'MTN_MOMO',
            $data['payment_status'] ?? 'PENDING',
            $data['campay_reference'] ?? '',
            $data['campay_operator'] ?? '',
            $data['campay_ussd_code'] ?? '',
            $data['external_reference'] ?? $ref
        ]);

        $bookingId = (int)$pdo->lastInsertId();
        return self::getBookingById($bookingId);
    }

    public static function getBookingById(int $id): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public static function getBookingByRef(string $ref): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM bookings WHERE booking_reference = ? OR campay_reference = ?");
        $stmt->execute([$ref, $ref]);
        return $stmt->fetch() ?: null;
    }

    public static function getUserBookings(?int $userId = null, ?string $phone = null): array {
        $pdo = Database::getConnection();
        if ($userId && $phone) {
            $stmt = $pdo->prepare("SELECT * FROM bookings WHERE user_id = ? OR passenger_phone LIKE ? ORDER BY id DESC");
            $stmt->execute([$userId, '%' . substr($phone, -8) . '%']);
        } elseif ($userId) {
            $stmt = $pdo->prepare("SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC");
            $stmt->execute([$userId]);
        } elseif ($phone) {
            $stmt = $pdo->prepare("SELECT * FROM bookings WHERE passenger_phone LIKE ? ORDER BY id DESC");
            $stmt->execute(['%' . substr($phone, -8) . '%']);
        } else {
            $stmt = $pdo->query("SELECT * FROM bookings ORDER BY id DESC LIMIT 50");
        }
        return $stmt->fetchAll() ?: [];
    }

    public static function confirmPayment(string $ref, ?string $campayRef = null): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE bookings SET payment_status = 'PAID', campay_reference = COALESCE(NULLIF(?, ''), campay_reference), updated_at = CURRENT_TIMESTAMP WHERE booking_reference = ? OR campay_reference = ?");
        return $stmt->execute([$campayRef, $ref, $ref]);
    }

    public static function renderBoardingPassHtml(array $b): string {
        $isEn = Language::isEn();
        $ref = htmlspecialchars($b['booking_reference']);
        $passName = htmlspecialchars($b['passenger_name']);
        $origin = htmlspecialchars($b['origin']);
        $destination = htmlspecialchars($b['destination']);
        $seat = htmlspecialchars($b['seat_label'] ?? ('Siège N° ' . $b['seat_number']));
        $travelDate = htmlspecialchars($b['travel_date']);
        $time = htmlspecialchars($b['departure_time']);
        $bus = htmlspecialchars($b['bus_model'] ?? 'Scania VIP First Class');
        $phone = htmlspecialchars($b['passenger_phone']);
        $amount = number_format((int)$b['amount'], 0, ',', ' ');
        $seatNum = $b['seat_number'];

        $docTitle = ($isEn ? 'Boarding Pass' : 'Billet de Transport') . ' - ' . $ref;
        $htmlLang = $isEn ? 'en' : 'fr';
        $badgeText = '✓ ' . ($isEn ? 'CONFIRMED & VALIDATED TICKET' : 'TITRE CONFIRMÉ & VALIDÉ');
        $depLabel = $isEn ? 'Departure Station' : 'Gare de Départ';
        $arrLabel = $isEn ? 'Arrival Station' : 'Gare de Destination';
        $nameLabel = $isEn ? 'Full Passenger Name' : 'Nom du Voyageur / Passager';
        $seatLabel = $isEn ? 'Reserved Seat' : 'Siège Réservé';
        $dateLabel = $isEn ? 'Departure Date & Time' : 'Date & Heure de Départ';
        $fleetLabel = $isEn ? 'Coach & Fleet' : 'Autocar & Ligne';
        $refLabel = $isEn ? 'Booking Reference' : 'Référence Réservation';
        $fareLabel = $isEn ? 'Fare Paid (CamPay)' : 'Tarif Acquitté (CamPay)';
        $fareVal = $amount . ' ' . ($isEn ? 'XAF (PAID)' : 'FCFA (PAYÉ)');
        $codeLabel = $isEn ? 'Gate Boarding Control Code' : 'Code de Contrôle Quai';
        $valText = '✓ ' . ($isEn ? 'Validated CamPay MoMo' : 'Validé CamPay MoMo') . ' (' . $phone . ')';
        $notice = $isEn ? 'Please present this electronic boarding pass with your ID at the terminal.' : 'Présentez ce billet électronique à l\'embarquement avec votre pièce d\'identité.';

        ob_start();
        ?>
<!DOCTYPE html>
<html lang="<?= $htmlLang ?>">
<head>
  <meta charset="UTF-8">
  <title><?= $docTitle ?></title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px; background: #f8fafc; color: #0f172a; }
    .ticket-card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #cbd5e1; }
    .header { background: #0B1E36; color: #ffffff; padding: 24px 30px; border-bottom: 4px solid #1d4ed8; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; }
    .logo span { color: #38bdf8; }
    .badge { background: #059669; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .body { padding: 30px; }
    .route-banner { display: flex; justify-content: space-between; align-items: center; background: #eff6ff; padding: 18px 22px; border-radius: 12px; border: 1px solid #bfdbfe; margin-bottom: 24px; }
    .station h3 { margin: 0; font-size: 18px; font-weight: 800; color: #1e3a8a; }
    .station p { margin: 3px 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; }
    .arrow { font-size: 24px; color: #1d4ed8; font-weight: bold; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .item { padding: 12px 16px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
    .item-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .item-val { font-size: 15px; font-weight: 800; color: #0f172a; }
    .seat-val { color: #1d4ed8; font-size: 17px; }
    .barcode-section { border-top: 2px dashed #cbd5e1; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
    .barcode { font-family: monospace; letter-spacing: 5px; font-size: 18px; font-weight: bold; color: #334155; }
    .footer { background: #f8fafc; padding: 16px 30px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; }
    @media print { body { background: none; padding: 0; } .ticket-card { box-shadow: none; border: 1px solid #000; } }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="/assets/images/global_voyages_logo.jpg" alt="GV Logo" style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover; border: 2px solid rgba(255,255,255,0.3);">
        <div class="logo">GLOBAL <span>VOYAGES</span> VIP</div>
      </div>
      <div class="badge"><?= $badgeText ?></div>
    </div>
    <div class="body">
      <div class="route-banner">
        <div class="station">
          <p><?= $depLabel ?></p>
          <h3><?= $origin ?></h3>
        </div>
        <div class="arrow">➔</div>
        <div class="station" style="text-align: right;">
          <p><?= $arrLabel ?></p>
          <h3><?= $destination ?></h3>
        </div>
      </div>
      <div class="grid">
        <div class="item">
          <div class="item-label"><?= $nameLabel ?></div>
          <div class="item-val"><?= $passName ?></div>
        </div>
        <div class="item">
          <div class="item-label"><?= $seatLabel ?></div>
          <div class="item-val seat-val"><?= $seat ?></div>
        </div>
        <div class="item">
          <div class="item-label"><?= $dateLabel ?></div>
          <div class="item-val"><?= $travelDate ?> • <?= $time ?></div>
        </div>
        <div class="item">
          <div class="item-label"><?= $fleetLabel ?></div>
          <div class="item-val"><?= $bus ?></div>
        </div>
        <div class="item">
          <div class="item-label"><?= $refLabel ?></div>
          <div class="item-val" style="font-family: monospace;"><?= $ref ?></div>
        </div>
        <div class="item">
          <div class="item-label"><?= $fareLabel ?></div>
          <div class="item-val" style="color: #059669;"><?= $fareVal ?></div>
        </div>
      </div>
      <div class="barcode-section">
        <div>
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
            <?= $codeLabel ?>
          </div>
          <div class="barcode">*<?= $ref ?>-<?= $seatNum ?>*</div>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; padding: 6px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #065f46; font-size: 11px; font-weight: bold;">
            <?= $valText ?>
          </span>
        </div>
      </div>
    </div>
    <div class="footer">
      <span><?= $notice ?></span>
      <span>Global Voyages Cameroon • VIP Intercity Express</span>
    </div>
  </div>
</body>
</html>
        <?php
        return ob_get_clean();
    }
}
