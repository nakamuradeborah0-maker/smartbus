<?php
// PHP-App/public/driver/index.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/Language.php';
require_once __DIR__ . '/../../src/Services/TripService.php';

Auth::requireRole('DRIVER', 'ADMIN');
$user = Auth::user();

$pdo = Database::getConnection();

// Handle status updates
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tripId = (int)($_POST['trip_id'] ?? 0);
    $action = $_POST['action'] ?? '';
    if ($tripId && $action === 'depart') {
        TripService::updateStatus($tripId, 'IN_TRANSIT');
        $msg = 'Départ confirmé ! Le trajet est maintenant EN TRANSIT.';
    } elseif ($tripId && $action === 'arrive') {
        TripService::updateStatus($tripId, 'ARRIVED');
        $msg = 'Arrivée en gare validée avec succès.';
    }
}

// Get assigned trips
$stmt = $pdo->prepare("SELECT t.*, 
    so.name AS origin_name, sd.name AS dest_name,
    so.city AS origin_city, sd.city AS dest_city
    FROM trips t
    JOIN routes r ON t.route_id = r.id
    JOIN stations so ON r.origin_station_id = so.id
    JOIN stations sd ON r.destination_station_id = sd.id
    WHERE t.driver_id = ? OR t.driver_id IS NULL OR ? = 'ADMIN'
    ORDER BY t.departure_scheduled DESC");
$stmt->execute([$user['id'], $user['role']]);
$driverTrips = $stmt->fetchAll() ?: [];

include __DIR__ . '/../includes/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
  <!-- Driver Deck Header -->
  <div class="bg-[#0B1E36] text-white p-6 sm:p-8 rounded-2xl border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <span class="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">Console Chauffeur Professionnel</span>
      <h1 class="text-2xl font-black tracking-tight text-white mt-1"><?= htmlspecialchars($user['name']) ?></h1>
      <p class="text-xs text-slate-300 font-mono">Autocar VIP Express • Ligne N3 Douala ↔ Yaoundé</p>
    </div>
    <div class="flex items-center gap-3">
      <span class="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-mono font-bold text-sky-300 border border-white/20">
        GPS 4G Connecté
      </span>
    </div>
  </div>

  <?php if ($msg): ?>
    <div class="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
      <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0"></i>
      <span><?= htmlspecialchars($msg) ?></span>
    </div>
  <?php endif; ?>

  <!-- Grid of Driver's Trips & Live Navigation -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Left 2 Cols: Trips Deck -->
    <div class="lg:col-span-2 space-y-4">
      <h2 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <i data-lucide="bus" class="w-4 h-4 text-blue-600"></i>
        <span>Trajets Assignés & Départs Programmés (<?= count($driverTrips) ?>)</span>
      </h2>

      <div class="space-y-4">
        <?php foreach ($driverTrips as $t): ?>
          <div class="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <span class="font-mono text-sm font-bold text-blue-900"><?= htmlspecialchars($t['trip_number']) ?></span>
              <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                <?= $t['status'] === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800 animate-pulse' : ($t['status'] === 'ARRIVED' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800') ?>">
                <?= htmlspecialchars($t['status']) ?>
              </span>
            </div>

            <div class="flex items-center gap-3 text-base font-black text-slate-900">
              <span><?= htmlspecialchars($t['origin_name']) ?></span>
              <i data-lucide="arrow-right" class="w-4 h-4 text-slate-400"></i>
              <span><?= htmlspecialchars($t['dest_name']) ?></span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-bold block">Autocar VIP</span>
                <strong class="text-slate-900"><?= htmlspecialchars($t['bus_number']) ?></strong>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-bold block">Heure Départ</span>
                <strong class="text-blue-700"><?= date('H:i • d/m/Y', strtotime($t['departure_scheduled'])) ?></strong>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-bold block">Capacité</span>
                <strong class="text-emerald-700 font-bold">32 Sièges VIP</strong>
              </div>
            </div>

            <!-- Actions Bar -->
            <form method="POST" class="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
              <input type="hidden" name="trip_id" value="<?= $t['id'] ?>">
              <?php if ($t['status'] === 'SCHEDULED'): ?>
                <button type="submit" name="action" value="depart" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5">
                  <i data-lucide="play" class="w-3.5 h-3.5"></i>
                  <span>Démarrer Trajet (Départ)</span>
                </button>
              <?php elseif ($t['status'] === 'IN_TRANSIT'): ?>
                <button type="submit" name="action" value="arrive" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  <span>Confirmer Arrivée en Gare</span>
                </button>
              <?php else: ?>
                <span class="text-xs text-slate-400 font-semibold italic">Trajet clôturé avec succès</span>
              <?php endif; ?>
            </form>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <!-- Right Col: Live Navigation GPS Route Map -->
    <div class="space-y-4">
      <h2 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <i data-lucide="navigation" class="w-4 h-4 text-emerald-600"></i>
        <span>Itinéraire & GPS en Direct</span>
      </h2>
      <div id="driver-nav-map" class="w-full h-[480px] rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden z-10"></div>
    </div>
  </div>
</div>

<script src="<?= BASE_URL ?>/assets/js/map.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    initLiveMap('driver-nav-map');
  });
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
