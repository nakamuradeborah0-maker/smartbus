<?php
// PHP-App/public/driver/index.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/Language.php';
require_once __DIR__ . '/../../src/Services/TripService.php';

Auth::requireRole('DRIVER', 'ADMIN');
$user = Auth::user();

$pdo = Database::getConnection();
$msg = '';

// Handle driver actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tripId = (int)($_POST['trip_id'] ?? 0);
    $action = $_POST['action'] ?? '';

    if ($tripId && $action === 'depart') {
        TripService::updateStatus($tripId, 'IN_TRANSIT');
        $msg = 'Départ confirmé ! Le trajet est maintenant EN TRANSIT sur l\'Axe Lourd N3.';
    } elseif ($tripId && $action === 'arrive') {
        TripService::updateStatus($tripId, 'ARRIVED');
        $msg = 'Arrivée en gare validée avec succès ! Le trajet est clôturé.';
    } elseif ($tripId && $action === 'update_stop') {
        $stopName = trim($_POST['stop_name'] ?? '');
        $speed = (int)($_POST['current_speed'] ?? 70);
        $coords = [
            'Douala Gare Centrale Akwa' => [4.0511, 9.7679],
            'Yassa Checkpoint' => [4.0150, 9.8400],
            'Édéa Pont Sanaga' => [3.8000, 10.1333],
            'Pouma Relais' => [3.8500, 10.5167],
            'Boumnyébel Escale' => [3.8667, 10.8667],
            'Matomb Descente' => [3.8833, 11.0833],
            'Mbankomo Entrée' => [3.7800, 11.3800],
            'Yaoundé Terminal Mvan' => [3.8480, 11.5021],
        ];
        $lat = $coords[$stopName][0] ?? 3.8667;
        $lng = $coords[$stopName][1] ?? 10.8667;
        
        $updTrk = $pdo->prepare("UPDATE iot_trackers SET last_latitude = ?, last_longitude = ?, last_speed = ? WHERE id = 1");
        $updTrk->execute([$lat, $lng, $speed]);
        $msg = "Étape GPS mise à jour : $stopName ($speed km/h) !";
    } elseif ($tripId && $action === 'report_incident') {
        $report = trim($_POST['incident_notes'] ?? '');
        $upd = $pdo->prepare("UPDATE trips SET incident_report = ? WHERE id = ?");
        $upd->execute([$report, $tripId]);
        $msg = "Rapport de circulation / incident transmis aux opérations.";
    }
}

// Get assigned trips (Douala <-> Yaoundé only)
$stmt = $pdo->prepare("SELECT t.*, 
    so.name AS origin_name, sd.name AS dest_name,
    so.city AS origin_city, sd.city AS dest_city
    FROM trips t
    JOIN routes r ON t.route_id = r.id
    JOIN stations so ON r.origin_station_id = so.id
    JOIN stations sd ON r.destination_station_id = sd.id
    WHERE (t.driver_id = ? OR t.driver_id IS NULL OR ? = 'ADMIN') AND r.id IN (1, 2)
    ORDER BY t.departure_scheduled ASC");
$stmt->execute([$user['id'], $user['role']]);
$driverTrips = $stmt->fetchAll() ?: [];

// Get current IoT status
$trk = $pdo->query("SELECT * FROM iot_trackers WHERE id = 1")->fetch() ?: ['battery_level' => 94, 'last_speed' => 74];

include __DIR__ . '/../includes/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
  <!-- Driver Deck Header -->
  <div class="bg-[#0B1E36] text-white p-6 sm:p-8 rounded-2xl border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <img src="<?= BASE_URL ?>/assets/images/global_voyages_logo.jpg" alt="Global Voyages" class="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-sm shrink-0">
      <div>
        <span class="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider"><?= t('driver.deckTitle', 'Cockpit Chauffeur • Axe Lourd N3 Douala ↔ Yaoundé') ?></span>
        <h1 class="text-2xl font-black tracking-tight text-white mt-1"><?= htmlspecialchars($user['name']) ?></h1>
        <p class="text-xs text-slate-300 font-mono"><?= t('driver.deckSub', 'Télémétrie GPS 4G • Scania VIP First Class') ?></p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span><?= sprintf(t('driver.gpsOnline', 'GPS En Ligne (Batterie: %s%%)'), $trk['battery_level']) ?></span>
      </span>
      <button type="button" onclick="toggleDriverMap()" id="btn-toggle-driver-map"
        class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="map" class="w-4 h-4 text-sky-400"></i>
        <span><?= t('map.seeOnMap', 'Voir sur la Carte (See on Map)') ?></span>
      </button>
    </div>
  </div>

  <?php if ($msg): ?>
    <div class="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
      <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0"></i>
      <span><?= htmlspecialchars($msg) ?></span>
    </div>
  <?php endif; ?>

  <!-- OPTIONAL INTERACTIVE CARTO HD MAP CONTAINER (HIDDEN BY DEFAULT) -->
  <div id="driver-map-container" class="hidden bg-white rounded-2xl border border-blue-300 shadow-md p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <i data-lucide="navigation" class="w-4 h-4 text-emerald-600 animate-pulse"></i>
        <span><?= t('driver.navTitle', 'Itinéraire N3 en Direct • Douala ↔ Yaoundé (Carto HD)') ?></span>
      </h3>
      <button type="button" onclick="toggleDriverMap()" class="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer">
        <i data-lucide="x" class="w-4 h-4"></i>
        <span><?= t('map.close', 'Fermer la Carte') ?></span>
      </button>
    </div>
    <div id="driver-nav-map" class="w-full h-[400px] rounded-xl border border-slate-300 z-10"></div>
  </div>

  <!-- Trips Deck (Full Width) -->
  <div class="space-y-4">
    <h2 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
      <i data-lucide="bus" class="w-4 h-4 text-blue-600"></i>
      <span><?= t('driver.assignedTrips', 'Trajets Douala ↔ Yaoundé Assignés') ?> (<?= count($driverTrips) ?>)</span>
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <?php foreach ($driverTrips as $t): ?>
        <div class="p-6 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="font-mono text-sm font-bold text-blue-900"><?= htmlspecialchars($t['trip_number']) ?></span>
              <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                <?= $t['status'] === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800 animate-pulse' : ($t['status'] === 'ARRIVED' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800') ?>">
                <?= htmlspecialchars($t['status']) ?>
              </span>
            </div>

            <div class="flex items-center gap-3 text-base font-black text-slate-900 my-2">
              <span><?= htmlspecialchars($t['origin_name']) ?></span>
              <i data-lucide="arrow-right" class="w-4 h-4 text-slate-400"></i>
              <span><?= htmlspecialchars($t['dest_name']) ?></span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-bold block"><?= t('driver.coach', 'Autocar VIP') ?></span>
                <strong class="text-slate-900"><?= htmlspecialchars($t['bus_number']) ?></strong>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-bold block"><?= t('driver.scheduledDep', 'Départ Prévu') ?></span>
                <strong class="text-blue-700"><?= date('H:i • d/m/Y', strtotime($t['departure_scheduled'])) ?></strong>
              </div>
              <div>
                <span class="text-[10px] text-slate-400 uppercase font-bold block">Capacité</span>
                <strong class="text-emerald-700 font-bold">32 Sièges VIP</strong>
              </div>
            </div>

            <?php if (!empty($t['incident_report'])): ?>
              <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mt-3">
                <strong>Signalement en cours :</strong> <?= htmlspecialchars($t['incident_report']) ?>
              </div>
            <?php endif; ?>
          </div>

          <!-- Driver Actions Toolbar -->
          <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 mt-2">
            <form method="POST" class="inline">
              <input type="hidden" name="trip_id" value="<?= $t['id'] ?>">
              <?php if ($t['status'] === 'SCHEDULED'): ?>
                <button type="submit" name="action" value="depart" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="play" class="w-3.5 h-3.5"></i>
                  <span><?= t('driver.btnDepart', 'Démarrer Trajet') ?></span>
                </button>
              <?php elseif ($t['status'] === 'IN_TRANSIT'): ?>
                <button type="submit" name="action" value="arrive" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                  <span><?= t('driver.btnArrive', 'Confirmer Arrivée') ?></span>
                </button>
              <?php else: ?>
                <span class="text-xs text-slate-400 font-semibold italic">Trajet clôturé avec succès</span>
              <?php endif; ?>
            </form>

            <?php if ($t['status'] === 'IN_TRANSIT'): ?>
              <button type="button" onclick="openGpsModal(<?= $t['id'] ?>)" class="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs transition flex items-center gap-1.5 border border-sky-200 cursor-pointer">
                <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                <span><?= t('driver.updateGpsStop', 'Pointer Étape GPS') ?></span>
              </button>
              <button type="button" onclick="openIncidentModal(<?= $t['id'] ?>)" class="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition flex items-center gap-1.5 border border-amber-200 cursor-pointer">
                <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
                <span><?= t('driver.reportIncident', 'Signaler Ralentissement') ?></span>
              </button>
            <?php endif; ?>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</div>

<!-- GPS Checkpoint Modal -->
<div id="gps-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base"><?= t('driver.updateGpsStop', 'Mettre à Jour la Position GPS') ?></h3>
      <button type="button" onclick="document.getElementById('gps-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <form method="POST" class="space-y-3 text-xs">
      <input type="hidden" name="action" value="update_stop">
      <input type="hidden" id="gps-trip-id" name="trip_id" value="">

      <div>
        <label class="block font-bold text-slate-700 mb-1">Étape Actuelle sur l'Axe Lourd N3</label>
        <select name="stop_name" class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-bold text-xs">
          <option value="Douala Gare Centrale Akwa">Douala Gare Centrale (Départ)</option>
          <option value="Yassa Checkpoint">Yassa Checkpoint (Sortie Douala)</option>
          <option value="Édéa Pont Sanaga">Édéa (Pont sur la Sanaga)</option>
          <option value="Pouma Relais">Pouma (Relais Routier)</option>
          <option value="Boumnyébel Escale" selected>Boumnyébel (Escale Repas)</option>
          <option value="Matomb Descente">Matomb (Descente)</option>
          <option value="Mbankomo Entrée">Mbankomo (Entrée Yaoundé)</option>
          <option value="Yaoundé Terminal Mvan">Yaoundé Terminal Mvan (Arrivée)</option>
        </select>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1"><?= t('driver.currentSpeed', 'Vitesse Instantanée (km/h)') ?></label>
        <input type="number" name="current_speed" value="74" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold">
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="document.getElementById('gps-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold">Annuler</button>
        <button type="submit" class="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs"><?= t('driver.btnUpdatePosition', 'Actualiser Télémétrie') ?></button>
      </div>
    </form>
  </div>
</div>

<!-- Incident Modal -->
<div id="incident-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base"><?= t('driver.reportIncident', 'Signaler un Ralentissement / Incident') ?></h3>
      <button type="button" onclick="document.getElementById('incident-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <form method="POST" class="space-y-3 text-xs">
      <input type="hidden" name="action" value="report_incident">
      <input type="hidden" id="incident-trip-id" name="trip_id" value="">

      <div>
        <label class="block font-bold text-slate-700 mb-1">Description de la Situation Routière</label>
        <textarea name="incident_notes" rows="3" required placeholder="Ex: Travaux routiers après Pouma, retard estimé à 20 minutes..."
          class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold"></textarea>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="document.getElementById('incident-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold">Annuler</button>
        <button type="submit" class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs"><?= t('driver.btnTransmitReport', "Transmettre l'Alerte") ?></button>
      </div>
    </form>
  </div>
</div>

<script src="<?= BASE_URL ?>/assets/js/map.js"></script>
<script>
  function openGpsModal(id) {
    document.getElementById('gps-trip-id').value = id;
    document.getElementById('gps-modal').classList.remove('hidden');
  }

  function openIncidentModal(id) {
    document.getElementById('incident-trip-id').value = id;
    document.getElementById('incident-modal').classList.remove('hidden');
  }

  let driverMapInitialized = false;

  function toggleDriverMap() {
    const container = document.getElementById('driver-map-container');
    const btn = document.getElementById('btn-toggle-driver-map');
    
    if (container.classList.contains('hidden')) {
      container.classList.remove('hidden');
      btn.innerHTML = '<i data-lucide="eye-off" class="w-4 h-4 text-amber-400"></i><span>' + (window.CURRENT_LANG === 'en' ? 'Hide Map' : 'Masquer la Carte') + '</span>';
      btn.classList.add('bg-slate-700', 'text-amber-300');
      
      if (!driverMapInitialized) {
        initLiveMap('driver-nav-map');
        driverMapInitialized = true;
      }
    } else {
      container.classList.add('hidden');
      btn.innerHTML = '<i data-lucide="map" class="w-4 h-4 text-sky-400"></i><span><?= t('map.seeOnMap', 'Voir sur la Carte (See on Map)') ?></span>';
      btn.classList.remove('bg-slate-700', 'text-amber-300');
    }
    if (window.lucide) lucide.createIcons();
  }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
