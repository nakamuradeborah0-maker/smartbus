<?php
// PHP-App/public/customer/ticket.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Language.php';
require_once __DIR__ . '/../../src/Services/BookingService.php';

$ref = trim($_GET['ref'] ?? $_GET['pnr'] ?? '');
$isEn = Language::isEn();

if (empty($ref)) {
    die($isEn ? "Missing ticket reference." : "Référence de billet manquante.");
}

// Support 1-click test confirmation
if (isset($_POST['confirm_demo']) || (isset($_GET['action']) && $_GET['action'] === 'confirm_demo')) {
    BookingService::confirmPayment($ref);
    header('Location: ' . BASE_URL . '/customer/ticket.php?ref=' . urlencode($ref) . '&lang=' . Language::current());
    exit;
}

$booking = BookingService::getBookingByRef($ref);

if (!$booking) {
    die($isEn ? "Ticket not found for reference: " . htmlspecialchars($ref) : "Billet introuvable pour la référence : " . htmlspecialchars($ref));
}

// If payment is pending or not paid, render a clean interactive payment confirmation gate
if ($booking['payment_status'] !== 'PAID') {
    $operator = ($booking['payment_method'] === 'ORANGE_MONEY' || $booking['payment_method'] === 'OM') ? 'Orange Money' : 'MTN MoMo';
    $ussd = ($operator === 'Orange Money') ? '#150*50#' : '*126#';
    $amount = number_format((int)$booking['amount'], 0, ',', ' ');
    ?>
<!DOCTYPE html>
<html lang="<?= $isEn ? 'en' : 'fr' ?>">
<head>
  <meta charset="UTF-8">
  <title><?= $isEn ? 'Payment Pending - ' . htmlspecialchars($ref) : 'Paiement en Attente - ' . htmlspecialchars($ref) ?></title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100 text-slate-900 font-sans min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white rounded-3xl border border-slate-300 shadow-2xl p-6 sm:p-8 space-y-6 text-center">
    <div class="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border-2 border-amber-300">
      <span class="text-2xl">⏳</span>
    </div>

    <div>
      <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
        <?= $isEn ? 'PAYMENT PENDING' : 'EN ATTENTE DE PAIEMENT' ?>
      </span>
      <h2 class="text-xl font-black text-slate-900 mt-2">
        <?= $isEn ? 'Debit Authorization Required' : 'Validation du Débit Requise' ?>
      </h2>
      <p class="text-xs text-slate-500 mt-1 font-mono">#<?= htmlspecialchars($booking['booking_reference']) ?></p>
    </div>

    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
      <div class="flex justify-between border-b border-slate-200 pb-2">
        <span class="text-slate-500"><?= $isEn ? 'Passenger:' : 'Voyageur :' ?></span>
        <strong class="text-slate-900"><?= htmlspecialchars($booking['passenger_name']) ?></strong>
      </div>
      <div class="flex justify-between border-b border-slate-200 pb-2">
        <span class="text-slate-500"><?= $isEn ? 'Route:' : 'Trajet :' ?></span>
        <strong class="text-slate-900"><?= htmlspecialchars($booking['origin']) ?> ➔ <?= htmlspecialchars($booking['destination']) ?></strong>
      </div>
      <div class="flex justify-between border-b border-slate-200 pb-2">
        <span class="text-slate-500"><?= $isEn ? 'Seat & Date:' : 'Siège & Date :' ?></span>
        <strong class="text-blue-700">💺 <?= htmlspecialchars($booking['seat_label'] ?? $booking['seat_number']) ?> • <?= $booking['travel_date'] ?></strong>
      </div>
      <div class="flex justify-between pt-1">
        <span class="text-slate-500"><?= $isEn ? 'Amount Due:' : 'Montant à Payer :' ?></span>
        <strong class="text-emerald-700 font-black text-sm"><?= $amount ?> <?= $isEn ? 'XAF' : 'FCFA' ?></strong>
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-left text-xs text-amber-900 space-y-1.5">
      <div class="font-bold flex items-center justify-between">
        <span><?= $operator ?></span>
        <span class="font-mono text-base font-black"><?= $ussd ?></span>
      </div>
      <p class="text-[11px] leading-relaxed">
        <?= $isEn 
          ? "Dial the code on your phone to authorize with your PIN, or confirm instantly below for test/demo mode."
          : "Composez le code sur votre téléphone pour valider avec votre code PIN, ou validez directement ci-dessous en mode test." ?>
      </p>
    </div>

    <form method="POST" class="space-y-3 pt-2">
      <input type="hidden" name="confirm_demo" value="1">
      <button type="submit" class="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-2">
        <span>✓</span>
        <span><?= $isEn ? 'Validate Payment (Test / Demo Mode)' : 'Valider Paiement (Mode Test / Démo)' ?></span>
      </button>
      <a href="<?= BASE_URL ?>/customer/index.php" class="block py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition">
        <?= $isEn ? '← Return to Dashboard' : '← Retour au Tableau de Bord' ?>
      </a>
    </form>
  </div>
</body>
</html>
    <?php
    exit;
}

// Render complete boarding pass HTML
echo BookingService::renderBoardingPassHtml($booking);
