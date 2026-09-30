<?php
// PHP-App/public/agent/index.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/Language.php';
require_once __DIR__ . '/../../src/Services/ParcelService.php';

Auth::requireRole('BOOKING_AGENT', 'PARCEL_AGENT', 'ADMIN');
$currentUser = Auth::user();

$pdo = Database::getConnection();
$msg = '';
$error = '';

// Handle actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. Assign IoT Tracker to Passenger Booking / Profile (Booking Agent feature)
    if (isset($_POST['assign_tracker_booking'])) {
        $bId = (int)$_POST['booking_id'];
        $trkId = (int)$_POST['tracker_id'];
        
        $updB = $pdo->prepare("UPDATE bookings SET tracker_id = ? WHERE id = ?");
        $updB->execute([$trkId, $bId]);
        
        $updT = $pdo->prepare("UPDATE iot_trackers SET status = 'ASSIGNED' WHERE id = ?");
        $updT->execute([$trkId]);
        
        $msg = "Traceur IoT physiquement associé au bagage du passager (Réservation #$bId) !";
    }
    // 2. Validate Booking Payment at Desk (Booking Agent feature)
    elseif (isset($_POST['confirm_booking'])) {
        $bId = (int)$_POST['booking_id'];
        $upd = $pdo->prepare("UPDATE bookings SET payment_status = 'PAID', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $upd->execute([$bId]);
        $msg = "Paiement en espèces au guichet validé pour la réservation #$bId !";
    }
    // 3. Register Parcel (Parcel Agent feature)
    elseif (isset($_POST['register_parcel'])) {
        $created = ParcelService::createParcel([
            'sender_name' => $_POST['sender_name'],
            'sender_phone' => $_POST['sender_phone'],
            'sender_email' => $_POST['sender_email'] ?? '',
            'recipient_name' => $_POST['recipient_name'],
            'recipient_phone' => $_POST['recipient_phone'],
            'recipient_address' => $_POST['recipient_address'],
            'origin_station_id' => $_POST['origin_station_id'],
            'destination_station_id' => $_POST['destination_station_id'],
            'weight_kg' => (float)$_POST['weight_kg'],
            'declared_value' => (int)$_POST['declared_value'],
            'description' => $_POST['description'] ?? '',
            'tracker_id' => !empty($_POST['tracker_id']) ? (int)$_POST['tracker_id'] : null
        ]);
        if ($created) {
            $msg = "Colis {$created['tracking_number']} enregistré avec succès !";
        }
    }
    // 4. Update Parcel Checkpoint Status (Parcel Agent feature)
    elseif (isset($_POST['update_status'])) {
        $pId = (int)$_POST['parcel_id'];
        $newStatus = $_POST['new_status'];
        $notes = trim($_POST['status_notes'] ?? '');
        $stId = (int)($_POST['checkpoint_station_id'] ?? 1);

        $upd = $pdo->prepare("UPDATE parcels SET status = ?, current_station_id = ? WHERE id = ?");
        $upd->execute([$newStatus, $stId, $pId]);

        $insH = $pdo->prepare("INSERT INTO parcel_status_history (parcel_id, station_id, status, notes) VALUES (?, ?, ?, ?)");
        $insH->execute([$pId, $stId, $newStatus, $notes ?: "Statut actualisé par l'agent {$currentUser['name']}"]);
        $msg = "Statut du colis #$pId actualisé vers '$newStatus' !";
    }
}

// Queries
$stations = $pdo->query("SELECT * FROM stations WHERE id IN (1, 2) ORDER BY id ASC")->fetchAll() ?: [];
$availableTrackers = $pdo->query("SELECT * FROM iot_trackers ORDER BY tracker_code ASC")->fetchAll() ?: [];

// Get all Bookings with associated IoT tracker
$bookings = $pdo->query("SELECT b.*, trk.tracker_code 
    FROM bookings b 
    LEFT JOIN iot_trackers trk ON b.tracker_id = trk.id 
    ORDER BY b.id DESC LIMIT 50")->fetchAll() ?: [];

// Get all Parcels with history counts
$parcels = $pdo->query("SELECT p.*, so.name AS origin_name, sd.name AS dest_name, trk.tracker_code,
    (SELECT COUNT(*) FROM parcel_status_history WHERE parcel_id = p.id) AS history_count
    FROM parcels p 
    LEFT JOIN stations so ON p.origin_station_id = so.id 
    LEFT JOIN stations sd ON p.destination_station_id = sd.id 
    LEFT JOIN iot_trackers trk ON p.tracker_id = trk.id 
    ORDER BY p.id DESC")->fetchAll() ?: [];

// Fetch all status histories for modal lookup
$historiesByParcel = [];
$rawHist = $pdo->query("SELECT h.*, s.name AS station_name FROM parcel_status_history h LEFT JOIN stations s ON h.station_id = s.id ORDER BY h.id ASC")->fetchAll() ?: [];
foreach ($rawHist as $rh) {
    $historiesByParcel[$rh['parcel_id']][] = $rh;
}

$defaultTab = ($currentUser['role'] === 'BOOKING_AGENT') ? 'bookings' : 'parcels';

include __DIR__ . '/../includes/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
  <!-- Agent Header -->
  <div class="bg-[#0B1E36] text-white p-6 sm:p-8 rounded-2xl border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <img src="<?= BASE_URL ?>/assets/images/global_voyages_logo.jpg" alt="Global Voyages" class="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-sm shrink-0">
      <div>
        <span class="px-2.5 py-0.5 rounded bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider">
          <?= ($currentUser['role'] === 'BOOKING_AGENT') ? t('agent.bookingDesk', 'Guichet Réservations & Bagages VIP') : t('agent.parcelDesk', 'Guichet Fret, Colis & Messagerie') ?>
        </span>
        <h1 class="text-2xl font-black tracking-tight text-white mt-1"><?= htmlspecialchars($currentUser['name']) ?></h1>
        <p class="text-xs text-slate-300 font-mono"><?= t('agent.operationalMgmt', 'Douala (Akwa) ↔ Yaoundé (Mvan) • Gestion Opérationnelle') ?></p>
      </div>
    </div>
    
    <div class="flex flex-wrap items-center gap-2">
      <!-- Optional Map Toggle Button -->
      <button type="button" onclick="toggleAgentMap()" id="btn-toggle-agent-map"
        class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="map" class="w-4 h-4 text-sky-400"></i>
        <span><?= t('map.seeOnMap', '🗺️ Voir sur la Carte (See on Map)') ?></span>
      </button>

      <button type="button" onclick="openRegisterModal()"
        class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="package-plus" class="w-4 h-4"></i>
        <span><?= t('agent.newParcel', 'Nouveau Colis') ?></span>
      </button>
    </div>
  </div>

  <?php if ($msg): ?>
    <div class="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
      <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0"></i>
      <span><?= htmlspecialchars($msg) ?></span>
    </div>
  <?php endif; ?>

  <!-- OPTIONAL INTERACTIVE CARTO HD MAP CONTAINER (HIDDEN BY DEFAULT) -->
  <div id="agent-map-container" class="hidden bg-white rounded-2xl border border-blue-300 shadow-md p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <i data-lucide="radio" class="w-4 h-4 text-blue-600 animate-pulse"></i>
        <span><?= t('map.title') ?></span>
      </h3>
      <button type="button" onclick="toggleAgentMap()" class="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1">
        <i data-lucide="x" class="w-4 h-4"></i>
        <span><?= t('map.close', 'Fermer la Carte') ?></span>
      </button>
    </div>
    <div id="agent-map" class="w-full h-[380px] rounded-xl border border-slate-300 z-10"></div>
  </div>

  <!-- Agent Workspace Tabs -->
  <div class="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden p-6 space-y-6">
    <div class="flex flex-wrap border-b border-slate-200 gap-4 sm:gap-6 text-xs font-bold">
      <button type="button" onclick="switchAgentTab('parcels')" id="agent-tab-parcels"
        class="pb-3 border-b-2 <?= $defaultTab === 'parcels' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800' ?> flex items-center gap-2 cursor-pointer">
        <i data-lucide="package" class="w-4 h-4"></i>
        <span><?= t('agent.tabParcels', '📦 Espace Agent de Colis') ?> (<?= count($parcels) ?>)</span>
      </button>
      <button type="button" onclick="switchAgentTab('bookings')" id="agent-tab-bookings"
        class="pb-3 border-b-2 <?= $defaultTab === 'bookings' ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800' ?> flex items-center gap-2 cursor-pointer">
        <i data-lucide="ticket" class="w-4 h-4"></i>
        <span><?= t('agent.tabBookings', '🎫 Espace Agent de Réservation') ?> (<?= count($bookings) ?>)</span>
      </button>
    </div>

    <!-- Tab 1: Parcel Agent (Gérer les colis, voir l'historique) -->
    <div id="agent-view-parcels" class="space-y-4 <?= $defaultTab === 'parcels' ? '' : 'hidden' ?>">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-800"><?= t('agent.parcelsTitle', 'Gestion des Expéditions de Colis & Fret') ?></h4>
          <p class="text-xs text-slate-500"><?= t('agent.parcelsSub', "Enregistrement, Pesée, Checkpoints et Journal d'Audit") ?></p>
        </div>
        <input type="text" id="parcel-search" onkeyup="filterParcels()" placeholder="<?= t('agent.searchPlaceholder', 'Rechercher par n° de suivi, expéditeur...') ?>"
          class="p-2 rounded-xl bg-slate-50 border border-slate-300 text-xs w-72 focus:outline-none focus:ring-2 focus:ring-blue-600">
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" id="parcels-table">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th class="p-3"><?= t('agent.colNumber', 'Numéro') ?></th>
              <th class="p-3"><?= t('agent.colSender', 'Expéditeur') ?></th>
              <th class="p-3"><?= t('agent.colRecipient', 'Destinataire') ?></th>
              <th class="p-3"><?= t('agent.colRoute', 'Ligne') ?></th>
              <th class="p-3"><?= t('agent.colWeightFees', 'Poids / Frais') ?></th>
              <th class="p-3"><?= t('agent.colTracker', 'Traceur IoT') ?></th>
              <th class="p-3"><?= t('agent.colStatus', 'Statut') ?></th>
              <th class="p-3 text-right"><?= t('agent.colActions', 'Actions') ?></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <?php foreach ($parcels as $p): ?>
              <?php $price = max(2500, (int)($p['weight_kg'] * 500)); ?>
              <tr class="hover:bg-slate-50/60 transition">
                <td class="p-3 font-mono font-bold text-blue-900"><?= htmlspecialchars($p['tracking_number']) ?></td>
                <td class="p-3 font-semibold"><?= htmlspecialchars($p['sender_name']) ?><br><span class="text-slate-400 font-mono"><?= htmlspecialchars($p['sender_phone']) ?></span></td>
                <td class="p-3 font-semibold"><?= htmlspecialchars($p['recipient_name']) ?><br><span class="text-slate-400 font-mono"><?= htmlspecialchars($p['recipient_phone']) ?></span></td>
                <td class="p-3"><?= htmlspecialchars($p['origin_name']) ?> ➔ <?= htmlspecialchars($p['dest_name']) ?></td>
                <td class="p-3 font-mono"><?= $p['weight_kg'] ?> kg<br><span class="text-emerald-700 font-bold"><?= number_format($price, 0, ',', ' ') ?> FCFA</span></td>
                <td class="p-3">
                  <?php if ($p['tracker_code']): ?>
                    <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px]"><?= htmlspecialchars($p['tracker_code']) ?></span>
                  <?php else: ?>
                    <span class="text-slate-400 italic"><?= t('agent.none', 'Aucun') ?></span>
                  <?php endif; ?>
                </td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                    <?= $p['status'] === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' : ($p['status'] === 'LIVRÉ' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') ?>">
                    <?= htmlspecialchars($p['status']) ?>
                  </span>
                </td>
                <td class="p-3 text-right space-x-1">
                  <!-- Checkpoint Status Update -->
                  <button type="button" onclick="openStatusModal(<?= $p['id'] ?>, '<?= htmlspecialchars($p['tracking_number']) ?>', '<?= htmlspecialchars($p['status']) ?>')"
                    class="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition text-[11px] cursor-pointer">
                    <?= t('agent.btnStatus', 'Statut ⚙️') ?>
                  </button>
                  <!-- View History -->
                  <button type="button" onclick="openHistoryModal(<?= $p['id'] ?>, '<?= htmlspecialchars($p['tracking_number']) ?>')"
                    class="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold transition text-[11px] cursor-pointer">
                    <?= t('agent.btnHistory', 'Historique 📜') ?> (<?= $p['history_count'] ?>)
                  </button>
                  <!-- Printable Waybill -->
                  <a href="<?= BASE_URL ?>/agent/waybill.php?num=<?= urlencode($p['tracking_number']) ?>" target="_blank"
                     class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition text-[11px]">
                    <?= t('agent.btnWaybill', 'Bordereau 🖨️') ?>
                  </a>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: Booking Agent (Gérer les réservations, assigner appareil IoT à un profil / bagage) -->
    <div id="agent-view-bookings" class="space-y-4 <?= $defaultTab === 'bookings' ? '' : 'hidden' ?>">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-800"><?= t('agent.bookingsTitle', 'Gestion des Réservations & Attribution IoT Bagage') ?></h4>
          <p class="text-xs text-slate-500"><?= t('agent.bookingsSub', 'Superviser les passagers, valider les encaissements guichet et lier un traceur physique au bagage') ?></p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th class="p-3"><?= t('agent.colRef', 'Référence') ?></th>
              <th class="p-3"><?= t('agent.colPassenger', 'Passager (Profil)') ?></th>
              <th class="p-3"><?= t('agent.colTrip', 'Trajet') ?></th>
              <th class="p-3"><?= t('agent.colSeat', 'Siège VIP') ?></th>
              <th class="p-3"><?= t('agent.colDateTime', 'Date & Heure') ?></th>
              <th class="p-3"><?= t('agent.colLuggageTracker', 'Traceur IoT Bagage') ?></th>
              <th class="p-3"><?= t('agent.colPayment', 'Paiement') ?></th>
              <th class="p-3 text-right"><?= t('agent.colDeskActions', 'Actions Guichet') ?></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <?php foreach ($bookings as $b): ?>
              <tr class="hover:bg-slate-50/60 transition">
                <td class="p-3 font-mono font-bold text-blue-900"><?= htmlspecialchars($b['booking_reference']) ?></td>
                <td class="p-3 font-semibold">
                  <?= htmlspecialchars($b['passenger_name']) ?><br>
                  <span class="text-slate-400 font-mono"><?= htmlspecialchars($b['passenger_phone']) ?></span>
                </td>
                <td class="p-3"><?= htmlspecialchars($b['origin']) ?> ➔ <?= htmlspecialchars($b['destination']) ?></td>
                <td class="p-3 font-bold text-blue-700">💺 <?= htmlspecialchars($b['seat_label']) ?></td>
                <td class="p-3"><?= $b['travel_date'] ?> • <?= $b['departure_time'] ?></td>
                <td class="p-3">
                  <?php if (!empty($b['tracker_code'])): ?>
                    <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                      🏷️ <?= htmlspecialchars($b['tracker_code']) ?>
                    </span>
                  <?php else: ?>
                    <span class="text-slate-400 italic text-[11px]"><?= t('agent.unassigned', 'Non assigné') ?></span>
                  <?php endif; ?>
                </td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                    <?= $b['payment_status'] === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800' ?>">
                    <?= htmlspecialchars($b['payment_status']) ?>
                  </span>
                </td>
                <td class="p-3 text-right space-x-1">
                  <!-- Assign IoT Tracker to Luggage / Profile Modal Trigger -->
                  <button type="button" onclick="openAssignTrackerModal(<?= $b['id'] ?>, '<?= htmlspecialchars($b['booking_reference']) ?>', '<?= htmlspecialchars($b['passenger_name']) ?>')"
                    class="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold transition text-[11px] cursor-pointer">
                    <?= t('agent.btnLinkTracker', 'Lier Traceur IoT 🏷️') ?>
                  </button>

                  <!-- Validate Payment if Pending -->
                  <?php if ($b['payment_status'] !== 'PAID'): ?>
                    <form method="POST" class="inline">
                      <input type="hidden" name="confirm_booking" value="1">
                      <input type="hidden" name="booking_id" value="<?= $b['id'] ?>">
                      <button type="submit" class="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[11px] cursor-pointer">
                        <?= t('agent.btnDeskCollect', 'Encaisser Guichet') ?>
                      </button>
                    </form>
                  <?php else: ?>
                    <a href="<?= BASE_URL ?>/customer/ticket.php?ref=<?= urlencode($b['booking_reference']) ?>" target="_blank"
                       class="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px]">
                      <?= t('agent.btnTicket', 'Billet 🖨️') ?>
                    </a>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Modal Assign IoT Tracker to Passenger Luggage / Profile -->
<div id="assign-tracker-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base"><?= t('agent.modalAssignTitle', 'Assigner un Appareil IoT au Bagage') ?></h3>
      <button type="button" onclick="document.getElementById('assign-tracker-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <form method="POST" class="space-y-3 text-xs">
      <input type="hidden" name="assign_tracker_booking" value="1">
      <input type="hidden" id="assign-booking-id" name="booking_id" value="">
      
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
        <div>Réservation : <strong id="assign-booking-ref" class="font-mono text-blue-900">REF</strong></div>
        <div>Passager : <strong id="assign-passenger-name" class="text-slate-900">Nom</strong></div>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1"><?= t('agent.modalAssignSub', 'Sélectionner la Balise IoT Physique à Fixer *') ?></label>
        <select name="tracker_id" required class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-bold text-xs">
          <?php foreach ($availableTrackers as $tk): ?>
            <option value="<?= $tk['id'] ?>">
              <?= htmlspecialchars($tk['tracker_code']) ?> (<?= htmlspecialchars($tk['device_model']) ?> • Batterie <?= $tk['battery_level'] ?>%)
            </option>
          <?php endforeach; ?>
        </select>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="document.getElementById('assign-tracker-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold">Annuler</button>
        <button type="submit" class="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-xs"><?= t('agent.btnAttach', 'Associer au Bagage') ?></button>
      </div>
    </form>
  </div>
</div>

<!-- Modal View Parcel History -->
<div id="history-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <div>
        <h3 class="font-black text-slate-900 text-base"><?= t('agent.modalHistoryTitle', "Historique d'Acheminement du Colis") ?></h3>
        <p class="text-xs text-slate-500 font-mono" id="history-parcel-ref">PAR-2026</p>
      </div>
      <button type="button" onclick="document.getElementById('history-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <div id="history-timeline-content" class="space-y-3 max-h-96 overflow-y-auto pl-2 border-l-2 border-blue-500 text-xs">
      <!-- Injected via JavaScript -->
    </div>
    <div class="flex justify-end pt-2 border-t border-slate-200">
      <button type="button" onclick="document.getElementById('history-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold text-xs">Fermer</button>
    </div>
  </div>
</div>

<!-- Status Update Modal -->
<div id="status-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base"><?= t('agent.modalStatusTitle', 'Actualiser le Statut du Colis') ?></h3>
      <button type="button" onclick="document.getElementById('status-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    <form method="POST" class="space-y-3 text-xs">
      <input type="hidden" name="update_status" value="1">
      <input type="hidden" id="status-parcel-id" name="parcel_id" value="">
      
      <div>
        <span class="text-slate-500 block text-[10px] uppercase font-bold"><?= t('agent.colisConcerned', 'Colis Concerné') ?></span>
        <strong id="status-parcel-ref" class="text-sm font-mono text-blue-900">PAR-2026</strong>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1"><?= t('agent.newStatusLabel', "Nouveau Statut d'Acheminement") ?></label>
        <select name="new_status" class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-bold text-xs">
          <option value="REÇU_EN_GARE">REÇU EN GARE (Dépôt guichet validé)</option>
          <option value="CHARGÉ_EN_SOUTE">CHARGÉ EN SOUTE (Dans l'autocar VIP)</option>
          <option value="EN_TRANSIT">EN TRANSIT (Sur l'Axe Lourd N3)</option>
          <option value="ARRIVÉ_EN_GARE">ARRIVÉ EN GARE (Prêt pour retrait)</option>
          <option value="LIVRÉ_AU_DESTINATAIRE">LIVRÉ AU DESTINATAIRE (Retrait confirmé)</option>
        </select>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1"><?= t('agent.currentStationLabel', 'Gare / Checkpoint Actuel') ?></label>
        <select name="checkpoint_station_id" class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 font-semibold text-xs">
          <option value="1">Douala (Gare Centrale Akwa)</option>
          <option value="2">Yaoundé (Terminal Mvan)</option>
        </select>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1"><?= t('agent.notesLabel', 'Notes & Observations Checkpoint') ?></label>
        <textarea name="status_notes" rows="2" placeholder="<?= t('agent.notesPlaceholder', 'Ex: Colis inspecté, scellé intact, chargé dans soute VIP...') ?>"
          class="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold"></textarea>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="document.getElementById('status-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold">Annuler</button>
        <button type="submit" class="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs"><?= t('agent.btnSaveStatus', 'Enregistrer Statut') ?></button>
      </div>
    </form>
  </div>
</div>

<!-- Register Modal -->
<div id="register-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base"><?= t('agent.modalRegisterTitle', 'Enregistrer un Colis au Guichet') ?></h3>
      <button type="button" onclick="document.getElementById('register-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <form method="POST" class="space-y-3 text-xs">
      <input type="hidden" name="register_parcel" value="1">

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1"><?= t('agent.senderName', 'Expéditeur (Nom) *') ?></label>
          <input type="text" name="sender_name" required placeholder="Nom complet" class="w-full p-2 rounded-lg border border-slate-300">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1"><?= t('agent.senderPhone', 'Téléphone Expéditeur *') ?></label>
          <input type="tel" name="sender_phone" required placeholder="6XXXXXXXX" class="w-full p-2 rounded-lg border border-slate-300 font-mono">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1"><?= t('agent.recipientName', 'Destinataire (Nom) *') ?></label>
          <input type="text" name="recipient_name" required placeholder="Nom complet" class="w-full p-2 rounded-lg border border-slate-300">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1"><?= t('agent.recipientPhone', 'Téléphone Destinataire *') ?></label>
          <input type="tel" name="recipient_phone" required placeholder="6XXXXXXXX" class="w-full p-2 rounded-lg border border-slate-300 font-mono">
        </div>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1"><?= t('agent.recipientAddress', 'Adresse / Quartier de Livraison *') ?></label>
        <input type="text" name="recipient_address" required placeholder="Ex: Quartier Bastos, Yaoundé" class="w-full p-2 rounded-lg border border-slate-300">
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1"><?= t('agent.originStation', 'Gare Départ') ?></label>
          <select name="origin_station_id" id="modal-orig" onchange="flipAgentDest()" class="w-full p-2 rounded-lg border border-slate-300 font-bold">
            <option value="1">Douala (Gare Centrale Akwa)</option>
            <option value="2">Yaoundé (Terminal Mvan)</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1"><?= t('agent.destStation', 'Gare Arrivée') ?></label>
          <select name="destination_station_id" id="modal-dest" class="w-full p-2 rounded-lg border border-slate-300 font-bold">
            <option value="2">Yaoundé (Terminal Mvan)</option>
            <option value="1">Douala (Gare Centrale Akwa)</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1"><?= t('agent.weightKg', 'Poids (kg) *') ?></label>
          <input type="number" step="0.5" name="weight_kg" id="parcel-weight" required value="5.0" oninput="calcPrice()"
            class="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1"><?= t('agent.shippingFee', "Frais d'Expédition (500 F/kg)") ?></label>
          <div id="price-display" class="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono">
            2 500 FCFA
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1"><?= t('agent.declaredValue', 'Valeur Déclarée (FCFA)') ?></label>
          <input type="number" name="declared_value" value="25000" class="w-full p-2 rounded-lg border border-slate-300 font-mono">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1"><?= t('agent.trackerSelect', 'Traceur IoT Fixé') ?></label>
          <select name="tracker_id" class="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs">
            <option value=""><?= t('agent.trackerNone', 'Aucun (Traceur standard)') ?></option>
            <?php foreach ($availableTrackers as $tk): ?>
              <option value="<?= $tk['id'] ?>"><?= htmlspecialchars($tk['tracker_code']) ?> (<?= $tk['battery_level'] ?>%)</option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1"><?= t('agent.description', 'Description du Contenu') ?></label>
        <textarea name="description" rows="2" placeholder="<?= t('agent.descriptionPlaceholder', 'Ex: Documents juridiques, pièces détachées, effets personnels...') ?>"
          class="w-full p-2 rounded-lg border border-slate-300 text-xs"></textarea>
      </div>

      <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
        <button type="button" onclick="document.getElementById('register-modal').classList.add('hidden')" class="px-4 py-2 border rounded-xl font-bold">Annuler</button>
        <button type="submit" class="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs"><?= t('agent.btnRegisterSubmit', 'Enregistrer & Émettre Bordereau') ?></button>
      </div>
    </form>
  </div>
</div>

<script src="<?= BASE_URL ?>/assets/js/map.js"></script>
<script>
  const allHistories = <?= json_encode($historiesByParcel) ?>;
  let agentMapInitialized = false;

  function toggleAgentMap() {
    const container = document.getElementById('agent-map-container');
    const btn = document.getElementById('btn-toggle-agent-map');
    
    if (container.classList.contains('hidden')) {
      container.classList.remove('hidden');
      btn.innerHTML = '<i data-lucide="eye-off" class="w-4 h-4 text-amber-400"></i><span>' + (window.CURRENT_LANG === 'en' ? 'Hide Map' : 'Masquer la Carte') + '</span>';
      btn.classList.add('bg-slate-700', 'text-amber-300');
      
      if (!agentMapInitialized) {
        initLiveMap('agent-map');
        agentMapInitialized = true;
      }
    } else {
      container.classList.add('hidden');
      btn.innerHTML = '<i data-lucide="map" class="w-4 h-4 text-sky-400"></i><span><?= t('map.seeOnMap', '🗺️ Voir sur la Carte (See on Map)') ?></span>';
      btn.classList.remove('bg-slate-700', 'text-amber-300');
    }
    if (window.lucide) lucide.createIcons();
  }

  function switchAgentTab(tab) {
    ['parcels', 'bookings'].forEach(t => {
      const view = document.getElementById('agent-view-' + t);
      const btn = document.getElementById('agent-tab-' + t);
      if (view) view.classList.add('hidden');
      if (btn) {
        btn.classList.remove('border-blue-700', 'text-blue-700');
        btn.classList.add('border-transparent', 'text-slate-500');
      }
    });
    const activeView = document.getElementById('agent-view-' + tab);
    const activeBtn = document.getElementById('agent-tab-' + tab);
    if (activeView) activeView.classList.remove('hidden');
    if (activeBtn) {
      activeBtn.classList.add('border-blue-700', 'text-blue-700');
      activeBtn.classList.remove('border-transparent', 'text-slate-500');
    }
  }

  function openRegisterModal() {
    document.getElementById('register-modal').classList.remove('hidden');
  }

  function openStatusModal(id, ref, currentStatus) {
    document.getElementById('status-parcel-id').value = id;
    document.getElementById('status-parcel-ref').textContent = ref;
    document.getElementById('status-modal').classList.remove('hidden');
  }

  function openAssignTrackerModal(id, ref, passengerName) {
    document.getElementById('assign-booking-id').value = id;
    document.getElementById('assign-booking-ref').textContent = ref;
    document.getElementById('assign-passenger-name').textContent = passengerName;
    document.getElementById('assign-tracker-modal').classList.remove('hidden');
  }

  function openHistoryModal(parcelId, ref) {
    document.getElementById('history-parcel-ref').textContent = ref;
    const list = allHistories[parcelId] || [];
    const container = document.getElementById('history-timeline-content');
    
    if (list.length === 0) {
      container.innerHTML = '<p class="text-slate-400 italic">Aucune étape enregistrée pour le moment.</p>';
    } else {
      container.innerHTML = list.map(h => `
        <div class="relative pl-4 pb-3">
          <div class="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white"></div>
          <span class="font-bold text-slate-900 block text-xs">${h.status} • <span class="text-blue-700">${h.station_name || 'Gare'}</span></span>
          <p class="text-slate-600 text-xs mt-0.5">${h.notes || 'Checkpoint validé'}</p>
          <span class="text-[10px] text-slate-400 font-mono">${h.created_at}</span>
        </div>
      `).join('');
    }
    document.getElementById('history-modal').classList.remove('hidden');
  }

  function flipAgentDest() {
    const orig = document.getElementById('modal-orig').value;
    document.getElementById('modal-dest').value = (orig === '1') ? '2' : '1';
  }

  function calcPrice() {
    const w = parseFloat(document.getElementById('parcel-weight').value) || 0;
    const price = Math.max(2500, Math.round(w * 500));
    document.getElementById('price-display').textContent = price.toLocaleString('fr-FR') + ' FCFA';
  }

  function filterParcels() {
    const q = document.getElementById('parcel-search').value.toLowerCase();
    const rows = document.querySelectorAll('#parcels-table tbody tr');
    rows.forEach(r => {
      r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  }
</script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
