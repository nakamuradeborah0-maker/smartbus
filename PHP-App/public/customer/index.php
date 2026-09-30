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

$bookings = BookingService::getUserBookings($userId, $user['phone']);
$trips = TripService::getTrips();

// Get parcels for this customer
$pdo = Database::getConnection();
$pStmt = $pdo->prepare("SELECT p.*, so.name AS origin_name, sd.name AS dest_name FROM parcels p LEFT JOIN stations so ON p.origin_station_id = so.id LEFT JOIN stations sd ON p.destination_station_id = sd.id WHERE p.customer_id = ? OR p.sender_phone = ? ORDER BY p.id DESC");
$pStmt->execute([$userId, $user['phone']]);
$parcels = $pStmt->fetchAll() ?: [];

include __DIR__ . '/../includes/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
  <!-- Profile Welcome Banner -->
  <div class="bg-[#0B1E36] text-white p-6 sm:p-8 rounded-2xl border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <span class="px-2.5 py-0.5 rounded bg-blue-600 text-[10px] font-bold uppercase tracking-wider">Espace Voyageur VIP</span>
      <h1 class="text-2xl font-black tracking-tight text-white mt-1"><?= htmlspecialchars($user['name']) ?></h1>
      <p class="text-xs text-slate-300 font-mono"><?= htmlspecialchars($user['email']) ?> • <?= htmlspecialchars($user['phone']) ?></p>
    </div>
    <div class="flex items-center gap-3">
      <button type="button" onclick="openBookingModal()" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer">
        <i data-lucide="plus-circle" class="w-4 h-4"></i>
        <span>Nouveau Billet</span>
      </button>
    </div>
  </div>

  <!-- Tabs Navigation -->
  <div class="flex border-b border-slate-200 gap-6 text-xs font-bold">
    <button type="button" onclick="switchCustomerTab('tickets')" id="tab-btn-tickets" class="pb-3 border-b-2 border-blue-700 text-blue-700 flex items-center gap-2 cursor-pointer">
      <i data-lucide="ticket" class="w-4 h-4"></i>
      <span>Mes Billets de Voyage (<?= count($bookings) ?>)</span>
    </button>
    <button type="button" onclick="switchCustomerTab('parcels')" id="tab-btn-parcels" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 cursor-pointer">
      <i data-lucide="package" class="w-4 h-4"></i>
      <span>Mes Colis Expédiés (<?= count($parcels) ?>)</span>
    </button>
  </div>

  <!-- Tab 1: My Bookings / Tickets -->
  <div id="content-tickets" class="space-y-4">
    <?php if (empty($bookings)): ?>
      <div class="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-3">
        <i data-lucide="ticket" class="w-12 h-12 mx-auto opacity-30"></i>
        <p class="text-sm font-bold text-slate-700">Aucun billet réservé pour le moment</p>
        <button type="button" onclick="openBookingModal()" class="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs">
          Acheter un billet maintenant
        </button>
      </div>
    <?php else: ?>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <?php foreach ($bookings as $b): ?>
          <div class="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm relative overflow-hidden group hover:border-blue-400 transition flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider <?= $b['payment_status'] === 'PAID' ? 'text-emerald-700' : 'text-amber-700' ?>">
                  <i data-lucide="<?= $b['payment_status'] === 'PAID' ? 'check-circle-2' : 'clock' ?>" class="w-4 h-4"></i>
                  <span><?= $b['payment_status'] === 'PAID' ? 'Billet Validé & Payé' : 'En Attente de Paiement' ?></span>
                </span>
                <span class="font-mono text-xs font-bold text-slate-400">#<?= htmlspecialchars($b['booking_reference']) ?></span>
              </div>

              <div class="text-[10px] text-slate-400 uppercase font-bold">Passager</div>
              <p class="text-xs font-bold text-slate-900 mb-2"><?= htmlspecialchars($b['passenger_name']) ?></p>

              <h3 class="text-base font-black text-slate-900 mb-1">
                <?= htmlspecialchars($b['origin']) ?> ➔ <?= htmlspecialchars($b['destination']) ?>
              </h3>
              <p class="text-xs text-slate-500 mb-3">
                <?= htmlspecialchars($b['travel_date']) ?> • <?= htmlspecialchars($b['departure_time']) ?> • <?= htmlspecialchars($b['bus_model'] ?? 'Scania VIP') ?>
              </p>

              <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs mb-3">
                <span>💺</span>
                <span><?= htmlspecialchars($b['seat_label'] ?? ('Siège N° ' . $b['seat_number'])) ?></span>
              </div>
            </div>

            <div class="border-t border-slate-100 pt-3 flex items-center justify-between mt-2">
              <span class="text-sm font-black text-blue-900"><?= number_format($b['amount'], 0, ',', ' ') ?> FCFA</span>
              <?php if ($b['payment_status'] === 'PAID'): ?>
                <a href="<?= BASE_URL ?>/customer/ticket.php?ref=<?= urlencode($b['booking_reference']) ?>" target="_blank"
                   class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition flex items-center gap-1.5 border border-emerald-200">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Billet HTML</span>
                </a>
              <?php else: ?>
                <button type="button" onclick="openBookingModal()" class="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs">Payer</button>
              <?php endif; ?>
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
        <p class="text-sm font-bold text-slate-700">Aucun colis enregistré pour le moment</p>
      </div>
    <?php else: ?>
      <div class="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 font-bold text-xs text-slate-700">Expéditions Enregistrées</div>
        <div class="divide-y divide-slate-100">
          <?php foreach ($parcels as $p): ?>
            <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-sm text-blue-900"><?= htmlspecialchars($p['tracking_number']) ?></span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800"><?= htmlspecialchars($p['status']) ?></span>
                </div>
                <p class="text-slate-600 mt-1"><?= htmlspecialchars($p['origin_name']) ?> ➔ <?= htmlspecialchars($p['dest_name']) ?> • Destinataire : <strong><?= htmlspecialchars($p['recipient_name']) ?></strong></p>
              </div>
              <a href="<?= BASE_URL ?>/track.php?num=<?= urlencode($p['tracking_number']) ?>" class="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-blue-700 font-bold rounded-lg self-start sm:self-auto transition">
                Suivre sur Carte ➔
              </a>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    <?php endif; ?>
  </div>
</div>

<!-- Modal Injection -->
<?php include __DIR__ . '/../includes/booking_modal.php'; ?>

<script>
  function switchCustomerTab(tab) {
    if (tab === 'tickets') {
      document.getElementById('content-tickets').classList.remove('hidden');
      document.getElementById('content-parcels').classList.add('hidden');
      document.getElementById('tab-btn-tickets').classList.add('border-blue-700', 'text-blue-700');
      document.getElementById('tab-btn-tickets').classList.remove('border-transparent', 'text-slate-500');
      document.getElementById('tab-btn-parcels').classList.remove('border-blue-700', 'text-blue-700');
      document.getElementById('tab-btn-parcels').classList.add('border-transparent', 'text-slate-500');
    } else {
      document.getElementById('content-parcels').classList.remove('hidden');
      document.getElementById('content-tickets').classList.add('hidden');
      document.getElementById('tab-btn-parcels').classList.add('border-blue-700', 'text-blue-700');
      document.getElementById('tab-btn-parcels').classList.remove('border-transparent', 'text-slate-500');
      document.getElementById('tab-btn-tickets').classList.remove('border-blue-700', 'text-blue-700');
      document.getElementById('tab-btn-tickets').classList.add('border-transparent', 'text-slate-500');
    }
  }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
