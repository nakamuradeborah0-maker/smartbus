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
          ? "A prompt has been sent to your phone. Authorize the debit with your PIN code."
          : "Une notification push a été transmise à votre mobile. Veuillez autoriser le débit avec votre code PIN." ?>
      </p>
    </div>

    <!-- Live Automated Detection Banner -->
    <div id="detection-status-box" class="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center gap-3 text-xs font-bold shadow-inner">
      <svg class="animate-spin h-4 w-4 text-blue-600 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span id="detection-status-text"><?= $isEn ? 'Detecting mobile payment automatically in real-time...' : 'Détection automatique du paiement mobile en cours...' ?></span>
    </div>

    <div class="space-y-2 pt-1">
      <button type="button" onclick="checkPaymentStatusNow()" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition cursor-pointer flex items-center justify-center gap-2">
        <span>🔄</span>
        <span><?= $isEn ? 'Refresh Payment Status' : 'Vérifier le Statut du Paiement' ?></span>
      </button>
      <a href="<?= BASE_URL ?>/customer/index.php" class="block py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition">
        <?= $isEn ? '← Return to Dashboard' : '← Retour au Tableau de Bord' ?>
      </a>
    </div>
  </div>

  <script>
  let isChecking = false;
  async function checkPaymentStatusNow() {
    if (isChecking) return;
    isChecking = true;
    try {
      const res = await fetch('<?= BASE_URL ?>/api/payment-status.php?reference=<?= urlencode($booking['booking_reference']) ?>');
      const data = await res.json();
      if (data.status === 'SUCCESSFUL') {
        const box = document.getElementById('detection-status-box');
        if (box) {
          box.className = 'p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center gap-2 text-xs font-bold';
          box.innerHTML = '<span>✓</span> <span><?= $isEn ? "Payment confirmed! Loading boarding pass..." : "Paiement confirmé ! Chargement du billet..." ?></span>';
        }
        setTimeout(() => {
          window.location.reload();
        }, 800);
        return;
      }
    } catch (e) {
      console.warn(e);
    } finally {
      isChecking = false;
    }
  }
  // Auto-poll every 2.5 seconds
  const pollTimer = setInterval(checkPaymentStatusNow, 2500);
  // Immediate initial check after 1.5 seconds
  setTimeout(checkPaymentStatusNow, 1500);
  </script>
</body>
</html>
    <?php
    exit;
}

// Render complete boarding pass HTML
echo BookingService::renderBoardingPassHtml($booking);
