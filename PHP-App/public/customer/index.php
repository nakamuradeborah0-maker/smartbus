<?php
// PHP-App/public/customer/index.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/Language.php';
require_once __DIR__ . '/../../src/Services/BookingService.php';
require_once __DIR__ . '/../../src/Services/TripService.php';

Auth::requireLogin();
$user = Auth::user();
$userId = $user['id'];
$pdo = Database::getConnection();

$msg = '';
$error = '';

// Handle Passenger Actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Report Issue
    if (isset($_POST['report_issue'])) {
        $issueType = trim($_POST['issue_type'] ?? 'BAGAGE_RETARD');
        $trackingNum = trim($_POST['tracking_number'] ?? '');
        $desc = trim($_POST['description'] ?? '');
        
        $ins = $pdo->prepare("INSERT INTO parcel_issues (tracking_number, reporter_name, reporter_contact, issue_type, description, status) VALUES (?, ?, ?, ?, ?, 'OPEN')");
        $ins->execute([$trackingNum, $user['name'], $user['phone'], $issueType, $desc]);
        $msg = Language::isEn() 
            ? "Your report has been submitted! Support will contact you at " . htmlspecialchars($user['phone'])
            : "Votre signalement a été enregistré ! Le service client vous contactera au " . htmlspecialchars($user['phone']);
    }
    // 2. Cancel Booking
    elseif (isset($_POST['cancel_booking'])) {
        $bId = (int)$_POST['booking_id'];
        $chk = $pdo->prepare("SELECT id, payment_status FROM bookings WHERE id = ? AND (user_id = ? OR passenger_phone = ?)");
        $chk->execute([$bId, $userId, $user['phone']]);
        $b = $chk->fetch();
        if ($b) {
            $upd = $pdo->prepare("UPDATE bookings SET payment_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $upd->execute([$bId]);
            $msg = Language::isEn() ? "Booking #$bId was successfully cancelled." : "La réservation #$bId a été annulée.";
        } else {
            $error = Language::isEn() ? "Booking not found or access denied." : "Réservation non trouvée ou non autorisée.";
        }
    }
}

// Get Bookings with IoT trackers
$bookings = BookingService::getUserBookings($userId, $user['phone']);

// Get Parcels for this customer
$pStmt = $pdo->prepare("SELECT p.*, so.name AS origin_name, sd.name AS dest_name, trk.tracker_code 
    FROM parcels p 
    LEFT JOIN stations so ON p.origin_station_id = so.id 
    LEFT JOIN stations sd ON p.destination_station_id = sd.id 
    LEFT JOIN iot_trackers trk ON p.tracker_id = trk.id 
    WHERE p.customer_id = ? OR p.sender_phone = ? 
    ORDER BY p.id DESC");
$pStmt->execute([$userId, $user['phone']]);
$parcels = $pStmt->fetchAll() ?: [];

// Get Notifications for this customer
$nStmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY id DESC LIMIT 20");
$nStmt->execute([$userId]);
$notifications = $nStmt->fetchAll() ?: [];

// Get Reported Issues by this customer
$iStmt = $pdo->prepare("SELECT * FROM parcel_issues WHERE reporter_contact = ? OR reporter_name = ? ORDER BY id DESC");
$iStmt->execute([$user['phone'], $user['name']]);
$myIssues = $iStmt->fetchAll() ?: [];

include __DIR__ . '/../includes/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
  <!-- Profile Welcome Banner -->
  <div class="bg-[#0B1E36] text-white p-6 sm:p-8 rounded-2xl border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <img src="<?= BASE_URL ?>/assets/images/global_voyages_logo.jpg" alt="Global Voyages" class="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-sm shrink-0">
      <div>
        <span class="px-2.5 py-0.5 rounded bg-blue-600 text-[10px] font-bold uppercase tracking-wider"><?= t('customer.vipWelcome') ?></span>
        <h1 class="text-2xl font-black tracking-tight text-white mt-1"><?= htmlspecialchars($user['name']) ?></h1>
        <p class="text-xs text-slate-300 font-mono"><?= htmlspecialchars($user['email']) ?> • <?= htmlspecialchars($user['phone']) ?></p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <!-- Optional Map Toggle Button -->
      <button type="button" onclick="openCustomerMapModal()"
        class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="map" class="w-4 h-4 text-sky-400"></i>
        <span><?= t('customer.seeMap') ?></span>
      </button>

      <button type="button" onclick="document.getElementById('report-issue-modal').classList.remove('hidden')"
        class="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400"></i>
        <span><?= t('customer.reportIssue') ?></span>
      </button>

      <button type="button" onclick="openBookingModal()"
        class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="plus-circle" class="w-4 h-4"></i>
        <span><?= t('customer.newTicket') ?></span>
      </button>
    </div>
  </div>

  <?php if ($msg): ?>
    <div class="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
      <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0"></i>
      <span><?= htmlspecialchars($msg) ?></span>
    </div>
  <?php endif; ?>

  <?php if ($error): ?>
    <div class="p-4 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 font-bold flex items-center gap-2 animate-fadeIn">
      <i data-lucide="alert-circle" class="w-4 h-4 text-red-600 shrink-0"></i>
      <span><?= htmlspecialchars($error) ?></span>
    </div>
  <?php endif; ?>

  <!-- Tabs Navigation -->
  <div class="flex flex-wrap border-b border-slate-200 gap-4 sm:gap-6 text-xs font-bold">
    <button type="button" onclick="switchCustomerTab('tickets')" id="tab-btn-tickets" class="pb-3 border-b-2 border-blue-700 text-blue-700 flex items-center gap-2 cursor-pointer">
      <i data-lucide="ticket" class="w-4 h-4"></i>
      <span><?= t('customer.tabTickets') ?> (<?= count($bookings) ?>)</span>
    </button>
    <button type="button" onclick="switchCustomerTab('parcels')" id="tab-btn-parcels" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 cursor-pointer">
      <i data-lucide="package" class="w-4 h-4"></i>
      <span><?= t('customer.tabParcels') ?> (<?= count($parcels) ?>)</span>
    </button>
    <button type="button" onclick="switchCustomerTab('notifications')" id="tab-btn-notifications" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 cursor-pointer">
      <i data-lucide="bell" class="w-4 h-4"></i>
      <span><?= t('customer.tabNotifications') ?> (<?= count($notifications) ?>)</span>
    </button>
    <button type="button" onclick="switchCustomerTab('issues')" id="tab-btn-issues" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 cursor-pointer">
      <i data-lucide="help-circle" class="w-4 h-4"></i>
      <span><?= t('customer.tabIssues') ?> (<?= count($myIssues) ?>)</span>
    </button>
  </div>

  <!-- Tab 1: My Bookings / Tickets -->
  <div id="content-tickets" class="space-y-4">
    <?php if (empty($bookings)): ?>
      <div class="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-3">
        <i data-lucide="ticket" class="w-12 h-12 mx-auto opacity-30"></i>
        <p class="text-sm font-bold text-slate-700"><?= t('customer.noTickets') ?></p>
        <button type="button" onclick="openBookingModal()" class="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs">
          <?= t('customer.buyNow') ?>
        </button>
      </div>
    <?php else: ?>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <?php foreach ($bookings as $b): ?>
          <div class="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm relative overflow-hidden group hover:border-blue-400 transition flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider <?= $b['payment_status'] === 'PAID' ? 'text-emerald-700' : ($b['payment_status'] === 'CANCELLED' ? 'text-slate-400' : 'text-amber-700') ?>">
                  <i data-lucide="<?= $b['payment_status'] === 'PAID' ? 'check-circle-2' : ($b['payment_status'] === 'CANCELLED' ? 'x-circle' : 'clock') ?>" class="w-4 h-4"></i>
                  <span><?= $b['payment_status'] === 'PAID' ? t('customer.paid') : ($b['payment_status'] === 'CANCELLED' ? t('customer.cancelled') : t('customer.pending')) ?></span>
                </span>
                <span class="font-mono text-xs font-bold text-slate-400">#<?= htmlspecialchars($b['booking_reference']) ?></span>
              </div>

              <div class="text-[10px] text-slate-400 uppercase font-bold"><?= t('customer.passenger') ?></div>
              <p class="text-xs font-bold text-slate-900 mb-2"><?= htmlspecialchars($b['passenger_name']) ?></p>

              <h3 class="text-base font-black text-slate-900 mb-1">
                <?= htmlspecialchars($b['origin']) ?> ➔ <?= htmlspecialchars($b['destination']) ?>
              </h3>
              <p class="text-xs text-slate-500 mb-3">
                <?= htmlspecialchars($b['travel_date']) ?> • <?= htmlspecialchars($b['departure_time']) ?> • <?= htmlspecialchars($b['bus_model'] ?? 'Scania VIP') ?>
              </p>

              <div class="flex flex-wrap items-center gap-2 mb-3">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs">
                  <span>💺</span>
                  <span><?= htmlspecialchars($b['seat_label'] ?? sprintf(t('booking.seatVIP', 'Siège N° %s (VIP)'), $b['seat_number'])) ?></span>
                </span>

                <?php if (!empty($b['tracker_code'])): ?>
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs font-mono">
                    <span>🏷️</span>
                    <span>IoT: <?= htmlspecialchars($b['tracker_code']) ?></span>
                  </span>
                <?php endif; ?>
              </div>
            </div>

            <div class="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 mt-2">
              <span class="text-sm font-black text-blue-900"><?= number_format($b['amount'], 0, ',', ' ') ?> <?= t('search.price') ?></span>
              
              <div class="flex items-center gap-1.5">
                <button type="button" onclick="openCustomerMapModal()" title="<?= t('customer.seeMap') ?>"
                  class="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition text-xs font-bold">
                  🗺️ <?= Language::isEn() ? 'Map' : 'Carte' ?>
                </button>

                <?php if ($b['payment_status'] === 'PAID'): ?>
                  <a href="<?= BASE_URL ?>/customer/ticket.php?ref=<?= urlencode($b['booking_reference']) ?>" target="_blank"
                     class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition flex items-center gap-1.5 border border-emerald-200">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span><?= t('customer.ticket') ?></span>
                  </a>
                <?php elseif ($b['payment_status'] === 'PENDING'): ?>
                  <button type="button" onclick="resumeBookingPayment('<?= htmlspecialchars($b['booking_reference']) ?>', '<?= htmlspecialchars($b['passenger_phone']) ?>', '<?= htmlspecialchars($b['payment_method'] ?? 'MTN_MOMO') ?>', '<?= $b['seat_number'] ?>', '<?= htmlspecialchars($b['bus_model'] ?? 'Scania VIP') ?>')" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition cursor-pointer">
                    💳 <?= t('customer.pay') ?>
                  </button>
                  <a href="<?= BASE_URL ?>/customer/ticket.php?ref=<?= urlencode($b['booking_reference']) ?>" target="_blank"
                     class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
                    <?= t('customer.ticket') ?>
                  </a>
                  <form method="POST" class="inline" onsubmit="return confirm('<?= Language::isEn() ? 'Cancel this booking?' : 'Annuler cette réservation ?' ?>');">
                    <input type="hidden" name="cancel_booking" value="1">
                    <input type="hidden" name="booking_id" value="<?= $b['id'] ?>">
                    <button type="submit" class="px-2 py-1.5 rounded-lg text-slate-400 hover:text-red-600 text-xs font-bold cursor-pointer">✕ <?= t('customer.cancel') ?></button>
                  </form>
                <?php endif; ?>
              </div>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>

  <!-- Tab 2: My Parcels -->
  <div id="content-parcels" class="space-y-4 hidden">
    <?php if (empty($parcels)): ?>
      <div class="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
        <i data-lucide="package" class="w-12 h-12 mx-auto opacity-30"></i>
        <p class="text-sm font-bold text-slate-700"><?= t('customer.noParcels') ?></p>
      </div>
    <?php else: ?>
      <div class="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 font-bold text-xs text-slate-700"><?= t('customer.tabParcels') ?></div>
        <div class="divide-y divide-slate-100">
          <?php foreach ($parcels as $p): ?>
            <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-sm text-blue-900"><?= htmlspecialchars($p['tracking_number']) ?></span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800"><?= htmlspecialchars($p['status']) ?></span>
                  <?php if (!empty($p['tracker_code'])): ?>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800">IoT: <?= htmlspecialchars($p['tracker_code']) ?></span>
                  <?php endif; ?>
                </div>
                <p class="text-slate-600 mt-1"><?= htmlspecialchars($p['origin_name']) ?> ➔ <?= htmlspecialchars($p['dest_name']) ?> • <?= Language::isEn() ? 'Recipient' : 'Destinataire' ?> : <strong><?= htmlspecialchars($p['recipient_name']) ?></strong></p>
              </div>
              <div class="flex items-center gap-2 self-start sm:self-auto">
                <button type="button" onclick="openCustomerMapModal()" class="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-lg border border-sky-200 transition text-xs flex items-center gap-1">
                  <span><?= t('customer.seeMap') ?></span>
                </button>
                <a href="<?= BASE_URL ?>/agent/waybill.php?num=<?= urlencode($p['tracking_number']) ?>" target="_blank" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition text-xs">
                  <?= t('customer.waybill') ?>
                </a>
                <a href="<?= BASE_URL ?>/track.php?num=<?= urlencode($p['tracking_number']) ?>" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-xs">
                  <?= t('customer.track') ?>
                </a>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    <?php endif; ?>
  </div>

  <!-- Tab 3: Notifications -->
  <div id="content-notifications" class="space-y-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-4">
      <h3 class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
        <i data-lucide="bell" class="w-4 h-4 text-blue-600"></i>
        <span><?= Language::isEn() ? 'Real-time Alerts & Notifications' : "Centre d'Alertes & Notifications en Direct" ?></span>
      </h3>
      <div class="divide-y divide-slate-100">
        <?php foreach ($notifications as $n): ?>
          <div class="py-3 flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <i data-lucide="<?= $n['type'] === 'SUCCESS' ? 'check' : 'info' ?>" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900"><?= htmlspecialchars($n['title']) ?></h4>
              <p class="text-xs text-slate-600 mt-0.5"><?= htmlspecialchars($n['message']) ?></p>
              <span class="text-[10px] text-slate-400 font-mono"><?= $n['created_at'] ?></span>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>

  <!-- Tab 4: Reported Issues -->
  <div id="content-issues" class="space-y-4 hidden">
    <div class="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xs font-black uppercase tracking-wider text-slate-800"><?= Language::isEn() ? 'Your Support Tickets & Reported Issues' : 'Historique de vos Réclamations & Signalements' ?></h3>
          <p class="text-xs text-slate-500"><?= Language::isEn() ? 'Track ticket resolutions by station operations' : 'Suivez le traitement de vos signalements par les équipes de gare' ?></p>
        </div>
        <button type="button" onclick="document.getElementById('report-issue-modal').classList.remove('hidden')"
          class="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
          <span><?= t('customer.newReport') ?></span>
        </button>
      </div>

      <?php if (empty($myIssues)): ?>
        <p class="text-slate-400 italic text-xs py-4"><?= t('customer.noIssues') ?></p>
      <?php else: ?>
        <div class="divide-y divide-slate-100">
          <?php foreach ($myIssues as $iss): ?>
            <div class="py-3 text-xs space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900 uppercase text-[11px]"><?= htmlspecialchars($iss['issue_type']) ?></span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase <?= $iss['status'] === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800' ?>">
                  <?= htmlspecialchars($iss['status']) ?>
                </span>
              </div>
              <p class="text-slate-700"><?= htmlspecialchars($iss['description']) ?></p>
              <?php if (!empty($iss['resolution_notes'])): ?>
                <div class="p-2 rounded bg-emerald-50 text-emerald-800 text-[11px]">
                  <strong><?= Language::isEn() ? 'Support response:' : "Réponse d'exploitation :" ?></strong> <?= htmlspecialchars($iss['resolution_notes']) ?>
                </div>
              <?php endif; ?>
              <span class="text-[10px] text-slate-400 font-mono"><?= $iss['created_at'] ?></span>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>
  </div>
</div>

<!-- Modal Report Issue -->
<div id="report-issue-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base"><?= Language::isEn() ? 'Report an Issue / Baggage Claim' : 'Signaler un Incident / Réclamation' ?></h3>
      <button type="button" onclick="document.getElementById('report-issue-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <form method="POST" class="space-y-3 text-xs">
      <input type="hidden" name="report_issue" value="1">
      <div>
        <label class="block font-bold text-slate-700 mb-1"><?= Language::isEn() ? 'Issue Type *' : 'Type de Problème *' ?></label>
        <select name="issue_type" class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-bold text-xs">
          <option value="BAGAGE_RETARD"><?= Language::isEn() ? 'Delayed Baggage' : "Retard d'Acheminement Bagage" ?></option>
          <option value="BAGAGE_ENDOMMAGE"><?= Language::isEn() ? 'Damaged Luggage in Hold' : 'Bagage Endommagé en Soute' ?></option>
          <option value="RETARD_AUTOCAR"><?= Language::isEn() ? 'Coach Delay' : 'Retard Départ / Arrivée Autocar VIP' ?></option>
          <option value="RECLAMATION_SERVICE"><?= Language::isEn() ? 'Onboard Service Feedback' : 'Réclamation Confort / Service à Bord' ?></option>
        </select>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1"><?= Language::isEn() ? 'Booking or Tracking Reference (Optional)' : 'Numéro de Billet ou de Suivi (Optionnel)' ?></label>
        <input type="text" name="tracking_number" placeholder="Ex: GV-1025 or PAR-2026-00125" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono">
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1"><?= Language::isEn() ? 'Detailed Description *' : 'Description Détaillée du Problème *' ?></label>
        <textarea name="description" rows="3" required placeholder="<?= Language::isEn() ? 'Explain what happened in detail...' : "Expliquez en détails ce qui s'est produit..." ?>"
          class="w-full p-2.5 rounded-lg border border-slate-300 text-xs"></textarea>
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
        <button type="button" onclick="document.getElementById('report-issue-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold"><?= Language::isEn() ? 'Cancel' : 'Annuler' ?></button>
        <button type="submit" class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs"><?= Language::isEn() ? 'Submit Ticket' : 'Transmettre Réclamation' ?></button>
      </div>
    </form>
  </div>
</div>

<!-- Modal Interactive Carto HD Map (Optional: opened on demand) -->
<div id="customer-map-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-4xl w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <div>
        <h3 class="font-black text-slate-900 text-base"><?= t('map.title') ?></h3>
        <p class="text-xs text-slate-500 font-mono"><?= t('map.subtitle') ?></p>
      </div>
      <button type="button" onclick="closeCustomerMapModal()" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    
    <div id="customer-live-map" class="w-full h-[420px] rounded-xl border border-slate-300"></div>

    <div class="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
      <span class="text-slate-500">📍 <?= Language::isEn() ? 'Active 4G GPS trackers along checkpoints' : 'Balises GPS 4G actives aux points de contrôle' ?></span>
      <button type="button" onclick="closeCustomerMapModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl"><?= t('customer.close') ?></button>
    </div>
  </div>
</div>

<!-- Modal Injection -->
<?php include __DIR__ . '/../includes/booking_modal.php'; ?>

<script src="<?= BASE_URL ?>/assets/js/map.js"></script>
<script>
  let customerMapInitialized = false;

  function openCustomerMapModal() {
    document.getElementById('customer-map-modal').classList.remove('hidden');
    if (!customerMapInitialized) {
      setTimeout(() => {
        initLiveMap('customer-live-map');
        customerMapInitialized = true;
      }, 100);
    }
  }

  function closeCustomerMapModal() {
    document.getElementById('customer-map-modal').classList.add('hidden');
  }

  function switchCustomerTab(tab) {
    ['tickets', 'parcels', 'notifications', 'issues'].forEach(t => {
      const view = document.getElementById('content-' + t);
      const btn = document.getElementById('tab-btn-' + t);
      if (view) view.classList.add('hidden');
      if (btn) {
        btn.classList.remove('border-blue-700', 'text-blue-700');
        btn.classList.add('border-transparent', 'text-slate-500');
      }
    });
    const activeView = document.getElementById('content-' + tab);
    const activeBtn = document.getElementById('tab-btn-' + tab);
    if (activeView) activeView.classList.remove('hidden');
    if (activeBtn) {
      activeBtn.classList.add('border-blue-700', 'text-blue-700');
      activeBtn.classList.remove('border-transparent', 'text-slate-500');
    }
  }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
