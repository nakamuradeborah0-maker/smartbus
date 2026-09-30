<?php
// PHP-App/public/admin/index.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/Language.php';

Auth::requireRole('ADMIN');
$user = Auth::user();

$pdo = Database::getConnection();
$msg = '';

// Handle actions (Create Trip, Confirm Booking, Cancel Booking)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['create_trip'])) {
        $rId = (int)$_POST['route_id'];
        $dId = (int)$_POST['driver_id'];
        $bus = trim($_POST['bus_number']);
        $depDate = $_POST['dep_date'];
        $depTime = $_POST['dep_time'];
        $price = (int)$_POST['price'];

        $depDt = $depDate . ' ' . $depTime . ':00';
        $arrDt = date('Y-m-d H:i:s', strtotime($depDt . ' + 3 hours 30 minutes'));
        $tripNum = ($rId == 1 ? 'GV-10' : 'GV-20') . rand(40, 99) . '-' . date('md', strtotime($depDate));

        $ins = $pdo->prepare("INSERT INTO trips (trip_number, route_id, driver_id, bus_number, departure_scheduled, arrival_scheduled, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')");
        $ins->execute([$tripNum, $rId, $dId, $bus, $depDt, $arrDt, $price]);
        $msg = "Nouveau départ $tripNum Douala ↔ Yaoundé programmé avec succès !";
    } elseif (isset($_POST['confirm_booking'])) {
        $bId = (int)$_POST['booking_id'];
        $upd = $pdo->prepare("UPDATE bookings SET payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $upd->execute([$bId]);
        $msg = "Réservation #$bId marquée comme PAYÉE !";
    } elseif (isset($_POST['cancel_booking'])) {
        $bId = (int)$_POST['booking_id'];
        $upd = $pdo->prepare("UPDATE bookings SET payment_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $upd->execute([$bId]);
        $msg = "Réservation #$bId annulée.";
    }
}

// Metrics
$totalBookings = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
$revenue = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE payment_status = 'PAID'")->fetchColumn();
$totalParcels = $pdo->query("SELECT COUNT(*) FROM parcels")->fetchColumn();
$totalTrips = $pdo->query("SELECT COUNT(*) FROM trips")->fetchColumn();

// Collections
$bookings = $pdo->query("SELECT * FROM bookings ORDER BY id DESC LIMIT 50")->fetchAll() ?: [];
$trips = $pdo->query("SELECT t.*, r.name AS route_name, so.city AS origin_city, sd.city AS dest_city FROM trips t JOIN routes r ON t.route_id = r.id JOIN stations so ON r.origin_station_id = so.id JOIN stations sd ON r.destination_station_id = sd.id ORDER BY t.departure_scheduled DESC LIMIT 30")->fetchAll() ?: [];
$parcels = $pdo->query("SELECT p.*, so.city AS origin_city, sd.city AS dest_city, trk.tracker_code FROM parcels p LEFT JOIN stations so ON p.origin_station_id = so.id LEFT JOIN stations sd ON p.destination_station_id = sd.id LEFT JOIN iot_trackers trk ON p.tracker_id = trk.id ORDER BY p.id DESC LIMIT 30")->fetchAll() ?: [];
$trackers = $pdo->query("SELECT * FROM iot_trackers ORDER BY id ASC")->fetchAll() ?: [];
$drivers = $pdo->query("SELECT * FROM users WHERE role = 'DRIVER'")->fetchAll() ?: [];

include __DIR__ . '/../includes/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
  <!-- Admin Banner -->
  <div class="bg-[#0B1E36] text-white p-6 sm:p-8 rounded-2xl border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <img src="<?= BASE_URL ?>/assets/images/global_voyages_logo.jpg" alt="Global Voyages" class="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-sm shrink-0">
      <div>
        <span class="px-2.5 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">Panneau d'Administration Global</span>
        <h1 class="text-2xl font-black tracking-tight text-white mt-1"><?= htmlspecialchars($user['name']) ?></h1>
        <p class="text-xs text-slate-300 font-mono">Supervision de l'Exploitation Douala ↔ Yaoundé, Flotte & Billetterie</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button type="button" onclick="document.getElementById('new-trip-modal').classList.remove('hidden')"
        class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="plus-circle" class="w-4 h-4"></i>
        <span>Nouveau Départ</span>
      </button>
      <span class="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
        Système Opérationnel
      </span>
    </div>
  </div>

  <?php if ($msg): ?>
    <div class="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
      <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0"></i>
      <span><?= htmlspecialchars($msg) ?></span>
    </div>
  <?php endif; ?>

  <!-- Metric KPIs -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div class="p-5 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block">Chiffre d'Affaires</span>
      <span class="text-2xl font-black text-slate-900"><?= number_format($revenue, 0, ',', ' ') ?> FCFA</span>
      <span class="text-[10px] text-emerald-700 font-bold block mt-1">✓ Acquitté CamPay MoMo</span>
    </div>
    <div class="p-5 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block">Billets Réservés</span>
      <span class="text-2xl font-black text-blue-900"><?= $totalBookings ?></span>
      <span class="text-[10px] text-slate-500 font-semibold block mt-1">Voyageurs enregistrés</span>
    </div>
    <div class="p-5 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block">Colis & Fret</span>
      <span class="text-2xl font-black text-slate-900"><?= $totalParcels ?></span>
      <span class="text-[10px] text-blue-700 font-bold block mt-1">Douala ↔ Yaoundé</span>
    </div>
    <div class="p-5 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block">Départs Programmés</span>
      <span class="text-2xl font-black text-slate-900"><?= $totalTrips ?></span>
      <span class="text-[10px] text-slate-500 font-semibold block mt-1">Flotte Scania VIP N3</span>
    </div>
  </div>

  <!-- Admin Interactive Map -->
  <div class="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-4">
    <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
      <i data-lucide="radio" class="w-4 h-4 text-blue-600"></i>
      <span>Supervision en Temps Réel du Corridor Douala ↔ Yaoundé (Carto HD)</span>
    </h3>
    <div id="admin-map" class="w-full h-[380px] rounded-xl border border-slate-300 z-10"></div>
  </div>

  <!-- Tabbed Admin Management Views -->
  <div class="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden p-6 space-y-6">
    <div class="flex border-b border-slate-200 gap-6 text-xs font-bold">
      <button type="button" onclick="switchAdminTab('bookings')" id="admin-tab-bookings" class="pb-3 border-b-2 border-blue-700 text-blue-700 flex items-center gap-2 cursor-pointer">
        <i data-lucide="ticket" class="w-4 h-4"></i>
        <span>Réservations Billets (<?= count($bookings) ?>)</span>
      </button>
      <button type="button" onclick="switchAdminTab('trips')" id="admin-tab-trips" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 cursor-pointer">
        <i data-lucide="bus" class="w-4 h-4"></i>
        <span>Départs Programmés (<?= count($trips) ?>)</span>
      </button>
      <button type="button" onclick="switchAdminTab('parcels')" id="admin-tab-parcels" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 cursor-pointer">
        <i data-lucide="package" class="w-4 h-4"></i>
        <span>Fret & Colis (<?= count($parcels) ?>)</span>
      </button>
    </div>

    <!-- View 1: Bookings -->
    <div id="admin-view-bookings" class="space-y-4">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th class="p-3">Référence</th>
              <th class="p-3">Passager</th>
              <th class="p-3">Trajet</th>
              <th class="p-3">Siège</th>
              <th class="p-3">Date & Heure</th>
              <th class="p-3">Montant</th>
              <th class="p-3">Statut</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <?php foreach ($bookings as $b): ?>
              <tr class="hover:bg-slate-50/60 transition">
                <td class="p-3 font-mono font-bold text-blue-900"><?= htmlspecialchars($b['booking_reference']) ?></td>
                <td class="p-3 font-semibold"><?= htmlspecialchars($b['passenger_name']) ?><br><span class="text-slate-400 font-mono"><?= htmlspecialchars($b['passenger_phone']) ?></span></td>
                <td class="p-3"><?= htmlspecialchars($b['origin']) ?> ➔ <?= htmlspecialchars($b['destination']) ?></td>
                <td class="p-3 font-bold text-blue-700">💺 <?= htmlspecialchars($b['seat_label']) ?></td>
                <td class="p-3"><?= $b['travel_date'] ?> • <?= $b['departure_time'] ?></td>
                <td class="p-3 font-bold font-mono"><?= number_format($b['amount'], 0, ',', ' ') ?> FCFA</td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                    <?= $b['payment_status'] === 'PAID' ? 'bg-emerald-100 text-emerald-800' : ($b['payment_status'] === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800') ?>">
                    <?= htmlspecialchars($b['payment_status']) ?>
                  </span>
                </td>
                <td class="p-3 text-right space-x-1">
                  <?php if ($b['payment_status'] !== 'PAID'): ?>
                    <form method="POST" class="inline">
                      <input type="hidden" name="confirm_booking" value="1">
                      <input type="hidden" name="booking_id" value="<?= $b['id'] ?>">
                      <button type="submit" class="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-[10px]">Valider</button>
                    </form>
                  <?php else: ?>
                    <a href="<?= BASE_URL ?>/customer/ticket.php?ref=<?= urlencode($b['booking_reference']) ?>" target="_blank"
                       class="px-2 py-1 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded font-bold text-[10px]">Billet</a>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View 2: Scheduled Trips -->
    <div id="admin-view-trips" class="space-y-4 hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th class="p-3">Numéro</th>
              <th class="p-3">Ligne</th>
              <th class="p-3">Autocar VIP</th>
              <th class="p-3">Départ Programmé</th>
              <th class="p-3">Tarif</th>
              <th class="p-3">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <?php foreach ($trips as $t): ?>
              <tr class="hover:bg-slate-50/60 transition">
                <td class="p-3 font-mono font-bold text-blue-900"><?= htmlspecialchars($t['trip_number']) ?></td>
                <td class="p-3 font-bold"><?= htmlspecialchars($t['origin_city']) ?> ➔ <?= htmlspecialchars($t['dest_city']) ?></td>
                <td class="p-3"><?= htmlspecialchars($t['bus_number']) ?></td>
                <td class="p-3 font-mono"><?= $t['departure_scheduled'] ?></td>
                <td class="p-3 font-bold"><?= number_format($t['price'], 0, ',', ' ') ?> FCFA</td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase <?= $t['status'] === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800' ?>">
                    <?= htmlspecialchars($t['status']) ?>
                  </span>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View 3: Parcels -->
    <div id="admin-view-parcels" class="space-y-4 hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th class="p-3">N° Suivi</th>
              <th class="p-3">Expéditeur</th>
              <th class="p-3">Destinataire</th>
              <th class="p-3">Ligne</th>
              <th class="p-3">Poids</th>
              <th class="p-3">Traceur</th>
              <th class="p-3">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <?php foreach ($parcels as $p): ?>
              <tr class="hover:bg-slate-50/60 transition">
                <td class="p-3 font-mono font-bold text-blue-900"><?= htmlspecialchars($p['tracking_number']) ?></td>
                <td class="p-3"><?= htmlspecialchars($p['sender_name']) ?></td>
                <td class="p-3"><?= htmlspecialchars($p['recipient_name']) ?></td>
                <td class="p-3"><?= htmlspecialchars($p['origin_city']) ?> ➔ <?= htmlspecialchars($p['dest_city']) ?></td>
                <td class="p-3 font-mono"><?= $p['weight_kg'] ?> kg</td>
                <td class="p-3 font-mono text-blue-700 font-bold"><?= htmlspecialchars($p['tracker_code'] ?: 'Aucun') ?></td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                    <?= htmlspecialchars($p['status']) ?>
                  </span>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Modal Create New Trip -->
<div id="new-trip-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base">Programmer un Nouveau Départ</h3>
      <button type="button" onclick="document.getElementById('new-trip-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <form method="POST" class="space-y-3 text-xs">
      <input type="hidden" name="create_trip" value="1">
      <div>
        <label class="block font-bold text-slate-700 mb-1">Ligne Interurbaine</label>
        <select name="route_id" class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-bold text-xs">
          <option value="1">Douala (Akwa) ➔ Yaoundé (Mvan) Express N3</option>
          <option value="2">Yaoundé (Mvan) ➔ Douala (Akwa) Express N3</option>
        </select>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1">Modèle d'Autocar VIP</label>
        <select name="bus_number" class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-xs">
          <option value="LT-782-AA (Scania VIP First Class)">LT-782-AA (Scania VIP First Class)</option>
          <option value="CE-341-BA (Mercedes Comfort Executive)">CE-341-BA (Mercedes Comfort Executive)</option>
          <option value="LT-890-BB (Scania VIP Lounge Express)">LT-890-BB (Scania VIP Lounge Express)</option>
          <option value="LT-902-CC (Volvo Highliner Luxury)">LT-902-CC (Volvo Highliner Luxury)</option>
          <option value="OU-112-DA (Marcopolo Paradiso VIP)">OU-112-DA (Marcopolo Paradiso VIP)</option>
        </select>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1">Chauffeur Assigné</label>
        <select name="driver_id" class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-xs">
          <?php foreach ($drivers as $drv): ?>
            <option value="<?= $drv['id'] ?>"><?= htmlspecialchars($drv['name']) ?> (<?= htmlspecialchars($drv['phone']) ?>)</option>
          <?php endforeach; ?>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Date de Départ</label>
          <input type="date" name="dep_date" value="<?= date('Y-m-d') ?>" class="w-full p-2 rounded-lg border border-slate-300 font-bold">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Heure de Départ</label>
          <input type="time" name="dep_time" value="08:00" class="w-full p-2 rounded-lg border border-slate-300 font-bold">
        </div>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1">Tarif Billet VIP (FCFA)</label>
        <input type="number" name="price" value="5000" class="w-full p-2 rounded-lg border border-slate-300 font-bold font-mono">
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="document.getElementById('new-trip-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold">Annuler</button>
        <button type="submit" class="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs">Valider Départ</button>
      </div>
    </form>
  </div>
</div>

<script src="<?= BASE_URL ?>/assets/js/map.js"></script>
<script>
  function switchAdminTab(tab) {
    ['bookings', 'trips', 'parcels'].forEach(t => {
      document.getElementById('admin-view-' + t).classList.add('hidden');
      document.getElementById('admin-tab-' + t).classList.remove('border-blue-700', 'text-blue-700');
      document.getElementById('admin-tab-' + t).classList.add('border-transparent', 'text-slate-500');
    });
    document.getElementById('admin-view-' + tab).classList.remove('hidden');
    document.getElementById('admin-tab-' + tab).classList.add('border-blue-700', 'text-blue-700');
    document.getElementById('admin-tab-' + tab).classList.remove('border-transparent', 'text-slate-500');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLiveMap('admin-map');
  });
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
