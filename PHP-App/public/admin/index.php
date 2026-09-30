<?php
// PHP-App/public/admin/index.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/Language.php';

Auth::requireRole('ADMIN');
$currentUser = Auth::user();

$pdo = Database::getConnection();
$msg = '';
$error = '';

// Handle actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Program New Trip
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
        $msg = "Nouveau départ $tripNum programmé avec succès !";
    }
    // 2. Validate/Confirm Booking
    elseif (isset($_POST['confirm_booking'])) {
        $bId = (int)$_POST['booking_id'];
        $upd = $pdo->prepare("UPDATE bookings SET payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $upd->execute([$bId]);
        $msg = "Réservation #$bId validée et acquittée !";
    }
    // 3. Cancel Booking
    elseif (isset($_POST['cancel_booking'])) {
        $bId = (int)$_POST['booking_id'];
        $upd = $pdo->prepare("UPDATE bookings SET payment_status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $upd->execute([$bId]);
        $msg = "Réservation #$bId annulée.";
    }
    // 4. Update User Account
    elseif (isset($_POST['update_user'])) {
        $uId = (int)$_POST['user_id'];
        $name = trim($_POST['name']);
        $phone = trim($_POST['phone']);
        $role = trim($_POST['role']);
        $upd = $pdo->prepare("UPDATE users SET name = ?, phone = ?, role = ? WHERE id = ?");
        $upd->execute([$name, $phone, $role, $uId]);
        $msg = "Compte utilisateur #$uId mis à jour avec succès !";
    }
    // 5. Ban / Unban User Account
    elseif (isset($_POST['toggle_ban_user'])) {
        $uId = (int)$_POST['user_id'];
        $currentStatus = $_POST['current_status'] ?? 'ACTIVE';
        $newStatus = ($currentStatus === 'BANNED') ? 'ACTIVE' : 'BANNED';
        $upd = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
        $upd->execute([$newStatus, $uId]);
        $msg = ($newStatus === 'BANNED') ? "Compte #$uId suspendu / banni !" : "Compte #$uId réactivé avec succès !";
    }
    // 6. Delete User Account
    elseif (isset($_POST['delete_user'])) {
        $uId = (int)$_POST['user_id'];
        if ($uId === (int)$currentUser['id']) {
            $error = "Vous ne pouvez pas supprimer votre propre compte administrateur.";
        } else {
            $del = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $del->execute([$uId]);
            $msg = "Compte utilisateur #$uId supprimé définitivement.";
        }
    }
    // 7. Add IoT Tracker Device
    elseif (isset($_POST['add_tracker'])) {
        $code = trim($_POST['tracker_code']);
        $model = trim($_POST['device_model'] ?: 'GV-GPS-4G-Pro');
        $battery = (int)($_POST['battery_level'] ?: 100);
        $status = $_POST['status'] ?: 'AVAILABLE';
        
        $chk = $pdo->prepare("SELECT id FROM iot_trackers WHERE tracker_code = ?");
        $chk->execute([$code]);
        if ($chk->fetch()) {
            $error = "Le code traceur '$code' existe déjà dans la base.";
        } else {
            $ins = $pdo->prepare("INSERT INTO iot_trackers (tracker_code, device_model, battery_level, status, last_latitude, last_longitude, last_speed) VALUES (?, ?, ?, ?, 3.8667, 10.8667, 0)");
            $ins->execute([$code, $model, $battery, $status]);
            $msg = "Appareil IoT $code ajouté avec succès à la flotte !";
        }
    }
    // 8. Configure / Update IoT Device
    elseif (isset($_POST['update_tracker'])) {
        $tId = (int)$_POST['tracker_id'];
        $model = trim($_POST['device_model']);
        $battery = (int)$_POST['battery_level'];
        $status = $_POST['status'];
        
        $upd = $pdo->prepare("UPDATE iot_trackers SET device_model = ?, battery_level = ?, status = ? WHERE id = ?");
        $upd->execute([$model, $battery, $status, $tId]);
        $msg = "Appareil IoT #$tId reconfiguré avec succès !";
    }
    // 9. Delete IoT Device
    elseif (isset($_POST['delete_tracker'])) {
        $tId = (int)$_POST['tracker_id'];
        $del = $pdo->prepare("DELETE FROM iot_trackers WHERE id = ?");
        $del->execute([$tId]);
        $msg = "Traceur IoT #$tId retiré de la flotte.";
    }
}

// Metrics
$totalBookings = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
$revenue = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE payment_status = 'PAID'")->fetchColumn();
$totalParcels = $pdo->query("SELECT COUNT(*) FROM parcels")->fetchColumn();
$totalTrips = $pdo->query("SELECT COUNT(*) FROM trips")->fetchColumn();
$totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$totalTrackers = $pdo->query("SELECT COUNT(*) FROM iot_trackers")->fetchColumn();

// Collections
$bookings = $pdo->query("SELECT * FROM bookings ORDER BY id DESC LIMIT 50")->fetchAll() ?: [];
$trips = $pdo->query("SELECT t.*, r.name AS route_name, so.city AS origin_city, sd.city AS dest_city FROM trips t JOIN routes r ON t.route_id = r.id JOIN stations so ON r.origin_station_id = so.id JOIN stations sd ON r.destination_station_id = sd.id ORDER BY t.departure_scheduled DESC LIMIT 30")->fetchAll() ?: [];
$parcels = $pdo->query("SELECT p.*, so.city AS origin_city, sd.city AS dest_city, trk.tracker_code FROM parcels p LEFT JOIN stations so ON p.origin_station_id = so.id LEFT JOIN stations sd ON p.destination_station_id = sd.id LEFT JOIN iot_trackers trk ON p.tracker_id = trk.id ORDER BY p.id DESC LIMIT 30")->fetchAll() ?: [];
$trackers = $pdo->query("SELECT * FROM iot_trackers ORDER BY id ASC")->fetchAll() ?: [];
$allUsers = $pdo->query("SELECT * FROM users ORDER BY id ASC")->fetchAll() ?: [];
$drivers = $pdo->query("SELECT * FROM users WHERE role = 'DRIVER'")->fetchAll() ?: [];

include __DIR__ . '/../includes/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
  <!-- Admin Banner -->
  <div class="bg-[#0B1E36] text-white p-6 sm:p-8 rounded-2xl border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <img src="<?= BASE_URL ?>/assets/images/global_voyages_logo.jpg" alt="Global Voyages" class="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-sm shrink-0">
      <div>
        <span class="px-2.5 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider"><?= t('admin.bannerTitle', 'Supervision Centrale & Administration') ?></span>
        <h1 class="text-2xl font-black tracking-tight text-white mt-1"><?= htmlspecialchars($currentUser['name']) ?></h1>
        <p class="text-xs text-slate-300 font-mono"><?= t('admin.bannerSubtitle', 'Contrôle des Utilisateurs, Traceurs IoT, Départs Douala ↔ Yaoundé & Billetterie') ?></p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <!-- Optional Map Toggle Button -->
      <button type="button" onclick="toggleAdminMap()" id="btn-toggle-admin-map"
        class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="map" class="w-4 h-4 text-sky-400"></i>
        <span><?= t('map.seeOnMap', 'Voir sur la Carte (See on Map)') ?></span>
      </button>

      <button type="button" onclick="document.getElementById('new-trip-modal').classList.remove('hidden')"
        class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="plus-circle" class="w-4 h-4"></i>
        <span><?= t('admin.newTrip', 'Nouveau Départ') ?></span>
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

  <!-- Metric KPIs -->
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    <div class="p-4 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block"><?= t('admin.kpiRevenue', "Chiffre d'Affaires") ?></span>
      <span class="text-xl font-black text-slate-900"><?= number_format($revenue, 0, ',', ' ') ?> F</span>
      <span class="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5"><i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> CamPay MoMo</span>
    </div>
    <div class="p-4 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block"><?= t('admin.kpiBookings', 'Billets Réservés') ?></span>
      <span class="text-xl font-black text-blue-900"><?= $totalBookings ?></span>
      <span class="text-[10px] text-slate-500 font-semibold block mt-0.5">Voyageurs</span>
    </div>
    <div class="p-4 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block"><?= t('admin.kpiParcels', 'Colis & Fret') ?></span>
      <span class="text-xl font-black text-slate-900"><?= $totalParcels ?></span>
      <span class="text-[10px] text-blue-700 font-bold block mt-0.5">Expéditions</span>
    </div>
    <div class="p-4 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block"><?= t('admin.kpiTrips', 'Départs Ligne N3') ?></span>
      <span class="text-xl font-black text-slate-900"><?= $totalTrips ?></span>
      <span class="text-[10px] text-slate-500 font-semibold block mt-0.5">Autocars VIP</span>
    </div>
    <div class="p-4 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block"><?= t('admin.kpiUsers', 'Comptes Utilisateurs') ?></span>
      <span class="text-xl font-black text-indigo-900"><?= $totalUsers ?></span>
      <span class="text-[10px] text-slate-500 font-semibold block mt-0.5">Acteurs Système</span>
    </div>
    <div class="p-4 bg-white rounded-2xl border border-slate-300 shadow-xs">
      <span class="text-[10px] text-slate-400 font-bold uppercase block"><?= t('admin.kpiTrackers', 'Traceurs IoT 4G') ?></span>
      <span class="text-xl font-black text-emerald-900"><?= $totalTrackers ?></span>
      <span class="text-[10px] text-emerald-700 font-bold block mt-0.5">Balises GPS</span>
    </div>
  </div>

  <!-- OPTIONAL INTERACTIVE CARTO HD MAP CONTAINER (HIDDEN BY DEFAULT) -->
  <div id="admin-map-container" class="hidden bg-white rounded-2xl border border-blue-300 shadow-md p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <i data-lucide="radio" class="w-4 h-4 text-blue-600 animate-pulse"></i>
        <span><?= t('map.title') ?></span>
      </h3>
      <button type="button" onclick="toggleAdminMap()" class="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1">
        <i data-lucide="x" class="w-4 h-4"></i>
        <span><?= t('map.close', 'Fermer la Carte') ?></span>
      </button>
    </div>
    <div id="admin-map" class="w-full h-[400px] rounded-xl border border-slate-300 z-10"></div>
    <p class="text-xs text-slate-500 flex items-center gap-1.5">
      <i data-lucide="map-pin" class="w-3.5 h-3.5 text-blue-600 shrink-0"></i>
      <span><strong>Points d'arrêt clés N3 :</strong> Douala Akwa, Yassa, Édéa Pont, Pouma, Boumnyébel, Matomb, Mbankomo, Yaoundé Mvan.</span>
    </p>
  </div>

  <!-- Tabbed Admin Management Views -->
  <div class="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden p-6 space-y-6">
    <div class="flex flex-wrap border-b border-slate-200 gap-4 sm:gap-6 text-xs font-bold">
      <button type="button" onclick="switchAdminTab('users')" id="admin-tab-users" class="pb-3 border-b-2 border-blue-700 text-blue-700 flex items-center gap-2 cursor-pointer">
        <i data-lucide="users" class="w-4 h-4"></i>
        <span><?= t('admin.tabUsers', 'Comptes Utilisateurs') ?> (<?= count($allUsers) ?>)</span>
      </button>
      <button type="button" onclick="switchAdminTab('iot')" id="admin-tab-iot" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 cursor-pointer">
        <i data-lucide="cpu" class="w-4 h-4"></i>
        <span><?= t('admin.tabIoT', 'Appareils IoT') ?> (<?= count($trackers) ?>)</span>
      </button>
      <button type="button" onclick="switchAdminTab('bookings')" id="admin-tab-bookings" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 cursor-pointer">
        <i data-lucide="ticket" class="w-4 h-4"></i>
        <span><?= t('admin.tabBookings', 'Réservations Billets') ?> (<?= count($bookings) ?>)</span>
      </button>
      <button type="button" onclick="switchAdminTab('trips')" id="admin-tab-trips" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 cursor-pointer">
        <i data-lucide="bus" class="w-4 h-4"></i>
        <span><?= t('admin.tabTrips', 'Départs Programmés') ?> (<?= count($trips) ?>)</span>
      </button>
      <button type="button" onclick="switchAdminTab('parcels')" id="admin-tab-parcels" class="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 cursor-pointer">
        <i data-lucide="package" class="w-4 h-4"></i>
        <span><?= t('admin.tabParcels', 'Fret & Colis') ?> (<?= count($parcels) ?>)</span>
      </button>
    </div>

    <!-- View 1: User Accounts Management (manage account: update, ban, delete) -->
    <div id="admin-view-users" class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-black uppercase tracking-wider text-slate-700"><?= t('admin.usersTitle') ?></h4>
        <span class="text-xs text-slate-500"><?= t('admin.usersSub') ?></span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th class="p-3"><?= t('admin.colId') ?></th>
              <th class="p-3"><?= t('admin.colFullName') ?></th>
              <th class="p-3"><?= t('admin.colUsername') ?></th>
              <th class="p-3"><?= t('admin.colPhone') ?></th>
              <th class="p-3"><?= t('admin.colRole') ?></th>
              <th class="p-3"><?= t('admin.colStatus') ?></th>
              <th class="p-3 text-right"><?= t('admin.colActions') ?></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <?php foreach ($allUsers as $u): ?>
              <?php $isBanned = ($u['status'] ?? 'ACTIVE') === 'BANNED'; ?>
              <tr class="hover:bg-slate-50/60 transition <?= $isBanned ? 'bg-red-50/40' : '' ?>">
                <td class="p-3 font-mono font-bold text-slate-500">#<?= $u['id'] ?></td>
                <td class="p-3 font-bold text-slate-900"><?= htmlspecialchars($u['name']) ?></td>
                <td class="p-3 font-mono text-slate-600"><?= htmlspecialchars($u['username']) ?><br><span class="text-slate-400 text-[11px]"><?= htmlspecialchars($u['email']) ?></span></td>
                <td class="p-3 font-mono"><?= htmlspecialchars($u['phone'] ?: 'N/A') ?></td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase
                    <?= $u['role'] === 'ADMIN' ? 'bg-blue-100 text-blue-800' : ($u['role'] === 'DRIVER' ? 'bg-amber-100 text-amber-800' : ($u['role'] === 'BOOKING_AGENT' ? 'bg-purple-100 text-purple-800' : ($u['role'] === 'PARCEL_AGENT' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'))) ?>">
                    <?= htmlspecialchars($u['role']) ?>
                  </span>
                </td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase <?= $isBanned ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800' ?>">
                    <?= $isBanned ? t('admin.statusBanned', 'BANNI / SUSPENDU') : t('admin.statusActive', 'ACTIF') ?>
                  </span>
                </td>
                <td class="p-3 text-right space-x-1">
                  <!-- Edit Modal Trigger -->
                  <button type="button" onclick="openEditUserModal(<?= htmlspecialchars(json_encode($u)) ?>)"
                    class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] inline-flex items-center gap-1">
                    <i data-lucide="edit-3" class="w-3 h-3"></i>
                    <span><?= t('admin.btnEdit', 'Modifier') ?></span>
                  </button>

                  <!-- Ban / Unban Form -->
                  <form method="POST" class="inline" onsubmit="return confirm('<?= $isBanned ? 'Réactiver' : 'Bannir' ?> cet utilisateur ?');">
                    <input type="hidden" name="toggle_ban_user" value="1">
                    <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                    <input type="hidden" name="current_status" value="<?= $u['status'] ?? 'ACTIVE' ?>">
                    <button type="submit" class="px-2 py-1 rounded font-bold text-[10px] <?= $isBanned ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white' ?>">
                      <?= $isBanned ? 'Débannir' : 'Bannir' ?>
                    </button>
                  </form>

                  <!-- Delete Form -->
                  <?php if ($u['id'] !== $currentUser['id']): ?>
                    <form method="POST" class="inline" onsubmit="return confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?');">
                      <input type="hidden" name="delete_user" value="1">
                      <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                      <button type="submit" class="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] inline-flex items-center gap-1">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                        <span><?= t('admin.btnDelete', 'Supprimer') ?></span>
                      </button>
                    </form>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View 2: IoT Devices Management (manage IOT device: add, configure, delete) -->
    <div id="admin-view-iot" class="space-y-4 hidden">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-700">Flotte des Traceurs Physiques IoT (GPS 4G)</h4>
          <p class="text-xs text-slate-500">Ajouter, configurer l'état des balises et associer aux bagages / autocars</p>
        </div>
        <button type="button" onclick="document.getElementById('new-tracker-modal').classList.remove('hidden')"
          class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
          <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
          <span>Ajouter Traceur IoT</span>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th class="p-3">ID</th>
              <th class="p-3">Code Traceur</th>
              <th class="p-3">Modèle Matériel</th>
              <th class="p-3">Niveau Batterie</th>
              <th class="p-3">Statut Balise</th>
              <th class="p-3">Dernière Vitesse</th>
              <th class="p-3">Dernier Ping</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <?php foreach ($trackers as $tk): ?>
              <tr class="hover:bg-slate-50/60 transition">
                <td class="p-3 font-mono font-bold text-slate-500">#<?= $tk['id'] ?></td>
                <td class="p-3 font-mono font-bold text-blue-900"><?= htmlspecialchars($tk['tracker_code']) ?></td>
                <td class="p-3 font-semibold text-slate-800"><?= htmlspecialchars($tk['device_model'] ?: 'GV-GPS-4G-Pro') ?></td>
                <td class="p-3 font-mono font-bold <?= $tk['battery_level'] < 20 ? 'text-red-600' : 'text-emerald-700' ?>">
                  <span class="inline-flex items-center gap-1"><i data-lucide="battery-charging" class="w-3.5 h-3.5 <?= $tk['battery_level'] < 20 ? 'text-red-600' : 'text-emerald-600' ?>"></i> <?= $tk['battery_level'] ?>%</span>
                </td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase
                    <?= $tk['status'] === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' : ($tk['status'] === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') ?>">
                    <?= htmlspecialchars($tk['status']) ?>
                  </span>
                </td>
                <td class="p-3 font-mono"><?= $tk['last_speed'] ?> km/h</td>
                <td class="p-3 font-mono text-[11px] text-slate-500"><?= $tk['last_ping'] ?: 'Récent' ?></td>
                <td class="p-3 text-right space-x-1">
                  <!-- Config Tracker Modal Trigger -->
                  <button type="button" onclick="openEditTrackerModal(<?= htmlspecialchars(json_encode($tk)) ?>)"
                    class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] inline-flex items-center gap-1">
                    <i data-lucide="settings" class="w-3 h-3"></i>
                    <span>Configurer</span>
                  </button>
                  <!-- Delete Tracker Form -->
                  <form method="POST" class="inline" onsubmit="return confirm('Retirer ce traceur IoT de la flotte ?');">
                    <input type="hidden" name="delete_tracker" value="1">
                    <input type="hidden" name="tracker_id" value="<?= $tk['id'] ?>">
                    <button type="submit" class="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] inline-flex items-center gap-1">
                      <i data-lucide="trash-2" class="w-3 h-3"></i>
                      <span>Retirer</span>
                    </button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View 3: Bookings -->
    <div id="admin-view-bookings" class="space-y-4 hidden">
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
                <td class="p-3 font-bold text-blue-700">
                  <span class="inline-flex items-center gap-1.5"><i data-lucide="armchair" class="w-3.5 h-3.5"></i> <?= htmlspecialchars($b['seat_label']) ?></span>
                </td>
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
                       class="px-2 py-1 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded font-bold text-[10px] inline-flex items-center gap-1">
                      <i data-lucide="printer" class="w-3 h-3"></i>
                      <span>Billet</span>
                    </a>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View 4: Scheduled Trips -->
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

    <!-- View 5: Parcels -->
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

<!-- Modal Edit User Account -->
<div id="edit-user-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base">Mettre à Jour le Compte Utilisateur</h3>
      <button type="button" onclick="document.getElementById('edit-user-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <form method="POST" class="space-y-3 text-xs">
      <input type="hidden" name="update_user" value="1">
      <input type="hidden" id="edit-user-id" name="user_id" value="">
      
      <div>
        <label class="block font-bold text-slate-700 mb-1">Nom Complet</label>
        <input type="text" id="edit-user-name" name="name" required class="w-full p-2.5 rounded-lg border border-slate-300">
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1">Téléphone</label>
        <input type="tel" id="edit-user-phone" name="phone" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono">
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1">Rôle Système</label>
        <select id="edit-user-role" name="role" class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-bold text-xs">
          <option value="ADMIN">ADMIN (Administrateur)</option>
          <option value="BOOKING_AGENT">BOOKING_AGENT (Agent de Réservation)</option>
          <option value="PARCEL_AGENT">PARCEL_AGENT (Agent de Colis & Fret)</option>
          <option value="DRIVER">DRIVER (Chauffeur d'Autocar)</option>
          <option value="CUSTOMER">CUSTOMER (Passager / Client)</option>
        </select>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="document.getElementById('edit-user-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold">Annuler</button>
        <button type="submit" class="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs">Enregistrer Modifications</button>
      </div>
    </form>
  </div>
</div>

<!-- Modal Add IoT Tracker -->
<div id="new-tracker-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base">Ajouter un Traceur IoT (GPS 4G)</h3>
      <button type="button" onclick="document.getElementById('new-tracker-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <form method="POST" class="space-y-3 text-xs">
      <input type="hidden" name="add_tracker" value="1">
      <div>
        <label class="block font-bold text-slate-700 mb-1">Code Balise Unique *</label>
        <input type="text" name="tracker_code" required placeholder="Ex: TRK-8805" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono font-bold">
      </div>
      <div>
        <label class="block font-bold text-slate-700 mb-1">Modèle d'Appareil</label>
        <input type="text" name="device_model" value="GV-GPS-4G-Pro" class="w-full p-2.5 rounded-lg border border-slate-300">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Batterie Initiale (%)</label>
          <input type="number" name="battery_level" value="100" min="0" max="100" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Statut Initial</label>
          <select name="status" class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-bold">
            <option value="AVAILABLE">AVAILABLE (Disponible)</option>
            <option value="ASSIGNED">ASSIGNED (Attribué)</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="document.getElementById('new-tracker-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold">Annuler</button>
        <button type="submit" class="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs">Ajouter Balise</button>
      </div>
    </form>
  </div>
</div>

<!-- Modal Configure IoT Tracker -->
<div id="edit-tracker-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base">Configurer Traceur IoT</h3>
      <button type="button" onclick="document.getElementById('edit-tracker-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <form method="POST" class="space-y-3 text-xs">
      <input type="hidden" name="update_tracker" value="1">
      <input type="hidden" id="edit-tracker-id" name="tracker_id" value="">
      
      <div>
        <span class="text-slate-500 block text-[10px] uppercase font-bold">Code Balise</span>
        <strong id="edit-tracker-code" class="text-sm font-mono text-blue-900">TRK</strong>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1">Modèle d'Appareil</label>
        <input type="text" id="edit-tracker-model" name="device_model" required class="w-full p-2.5 rounded-lg border border-slate-300">
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Niveau Batterie (%)</label>
          <input type="number" id="edit-tracker-battery" name="battery_level" min="0" max="100" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Statut Traceur</label>
          <select id="edit-tracker-status" name="status" class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-bold">
            <option value="AVAILABLE">AVAILABLE (Libre)</option>
            <option value="ASSIGNED">ASSIGNED (En mission)</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="document.getElementById('edit-tracker-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold">Annuler</button>
        <button type="submit" class="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs">Valider Configuration</button>
      </div>
    </form>
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
  let adminMapInitialized = false;

  function toggleAdminMap() {
    const container = document.getElementById('admin-map-container');
    const btn = document.getElementById('btn-toggle-admin-map');
    
    if (container.classList.contains('hidden')) {
      container.classList.remove('hidden');
      btn.innerHTML = '<i data-lucide="eye-off" class="w-4 h-4 text-amber-400"></i><span>' + (window.CURRENT_LANG === 'en' ? 'Hide Map' : 'Masquer la Carte') + '</span>';
      btn.classList.add('bg-slate-700', 'text-amber-300');
      
      if (!adminMapInitialized) {
        initLiveMap('admin-map');
        adminMapInitialized = true;
      }
    } else {
      container.classList.add('hidden');
      btn.innerHTML = '<i data-lucide="map" class="w-4 h-4 text-sky-400"></i><span><?= t('map.seeOnMap', 'Voir sur la Carte (See on Map)') ?></span>';
      btn.classList.remove('bg-slate-700', 'text-amber-300');
    }
    if (window.lucide) lucide.createIcons();
  }

  function switchAdminTab(tab) {
    ['users', 'iot', 'bookings', 'trips', 'parcels'].forEach(t => {
      const view = document.getElementById('admin-view-' + t);
      const btn = document.getElementById('admin-tab-' + t);
      if (view) view.classList.add('hidden');
      if (btn) {
        btn.classList.remove('border-blue-700', 'text-blue-700');
        btn.classList.add('border-transparent', 'text-slate-500');
      }
    });
    const activeView = document.getElementById('admin-view-' + tab);
    const activeBtn = document.getElementById('admin-tab-' + tab);
    if (activeView) activeView.classList.remove('hidden');
    if (activeBtn) {
      activeBtn.classList.add('border-blue-700', 'text-blue-700');
      activeBtn.classList.remove('border-transparent', 'text-slate-500');
    }
  }

  function openEditUserModal(user) {
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-name').value = user.name;
    document.getElementById('edit-user-phone').value = user.phone || '';
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-modal').classList.remove('hidden');
  }

  function openEditTrackerModal(tracker) {
    document.getElementById('edit-tracker-id').value = tracker.id;
    document.getElementById('edit-tracker-code').textContent = tracker.tracker_code;
    document.getElementById('edit-tracker-model').value = tracker.device_model || 'GV-GPS-4G-Pro';
    document.getElementById('edit-tracker-battery').value = tracker.battery_level || 100;
    document.getElementById('edit-tracker-status').value = tracker.status || 'AVAILABLE';
    document.getElementById('edit-tracker-modal').classList.remove('hidden');
  }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
