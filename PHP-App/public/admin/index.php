<?php
// PHP-App/public/admin/index.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/Language.php';

Auth::requireRole('ADMIN');
$user = Auth::user();

$pdo = Database::getConnection();

// Metrics
$totalBookings = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
$revenue = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE payment_status = 'PAID'")->fetchColumn();
$totalParcels = $pdo->query("SELECT COUNT(*) FROM parcels")->fetchColumn();
$totalTrips = $pdo->query("SELECT COUNT(*) FROM trips")->fetchColumn();

// Data collections
$stations = $pdo->query("SELECT * FROM stations ORDER BY id ASC")->fetchAll() ?: [];
$trips = $pdo->query("SELECT t.*, r.name AS route_name, so.city AS origin_city, sd.city AS dest_city FROM trips t JOIN routes r ON t.route_id = r.id JOIN stations so ON r.origin_station_id = so.id JOIN stations sd ON r.destination_station_id = sd.id ORDER BY t.departure_scheduled DESC")->fetchAll() ?: [];
$users = $pdo->query("SELECT * FROM users ORDER BY id ASC")->fetchAll() ?: [];
$trackers = $pdo->query("SELECT * FROM iot_trackers ORDER BY id ASC")->fetchAll() ?: [];

include __DIR__ . '/../includes/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
  <!-- Admin Banner -->
  <div class="bg-[#0B1E36] text-white p-6 sm:p-8 rounded-2xl border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <span class="px-2.5 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">Panneau d'Administration Global</span>
      <h1 class="text-2xl font-black tracking-tight text-white mt-1"><?= htmlspecialchars($user['name']) ?></h1>
      <p class="text-xs text-slate-300 font-mono">Supervision de l'Exploitation, Flotte, Lignes & Billetterie</p>
    </div>
    <div class="flex items-center gap-3">
      <span class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
        Système Opérationnel
      </span>
    </div>
  </div>

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
      <span class="text-[10px] text-slate-500 font-semibold block mt-1">Enregistrements en base</span>
    </div>
    <div class="p-5 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block">Colis & Fret</span>
      <span class="text-2xl font-black text-slate-900"><?= $totalParcels ?></span>
      <span class="text-[10px] text-blue-700 font-bold block mt-1">Suivi GPS actif</span>
    </div>
    <div class="p-5 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block">Lignes Départs</span>
      <span class="text-2xl font-black text-slate-900"><?= $totalTrips ?></span>
      <span class="text-[10px] text-slate-500 font-semibold block mt-1">Douala ↔ Yaoundé N3</span>
    </div>
  </div>

  <!-- Admin Interactive Map -->
  <div class="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-4">
    <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
      <i data-lucide="radio" class="w-4 h-4 text-blue-600"></i>
      <span>Supervision Globale de la Flotte & Traceurs IoT (Carto HD)</span>
    </h3>
    <div id="admin-map" class="w-full h-[400px] rounded-xl border border-slate-300 z-10"></div>
  </div>

  <!-- Grid of Data Tables -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- Gares -->
    <div class="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-3">
      <h3 class="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
        <i data-lucide="map-pin" class="w-4 h-4 text-blue-600"></i>
        <span>Gares du Réseau (<?= count($stations) ?>)</span>
      </h3>
      <div class="divide-y divide-slate-100 text-xs">
        <?php foreach ($stations as $s): ?>
          <div class="py-2.5 flex items-center justify-between">
            <div>
              <strong class="text-slate-900"><?= htmlspecialchars($s['name']) ?></strong>
              <span class="text-slate-400 block text-[11px]"><?= htmlspecialchars($s['city']) ?> • <?= htmlspecialchars($s['phone']) ?></span>
            </div>
            <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold"><?= htmlspecialchars($s['station_code']) ?></span>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <!-- Utilisateurs -->
    <div class="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-3">
      <h3 class="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
        <i data-lucide="users" class="w-4 h-4 text-blue-600"></i>
        <span>Comptes Utilisateurs (<?= count($users) ?>)</span>
      </h3>
      <div class="divide-y divide-slate-100 text-xs">
        <?php foreach ($users as $u): ?>
          <div class="py-2.5 flex items-center justify-between">
            <div>
              <strong class="text-slate-900"><?= htmlspecialchars($u['name']) ?></strong>
              <span class="text-slate-400 block font-mono text-[11px]"><?= htmlspecialchars($u['username']) ?> • <?= htmlspecialchars($u['email']) ?></span>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase
              <?= $u['role'] === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700' ?>">
              <?= htmlspecialchars($u['role']) ?>
            </span>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</div>

<script src="<?= BASE_URL ?>/assets/js/map.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    initLiveMap('admin-map');
  });
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
