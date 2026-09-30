<?php
// PHP-App/public/agent/index.php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/Language.php';
require_once __DIR__ . '/../../src/Services/ParcelService.php';

Auth::requireRole('PARCEL_AGENT', 'ADMIN');
$user = Auth::user();

$pdo = Database::getConnection();
$msg = '';

// Handle parcel registration
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['register_parcel'])) {
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

// Get stations and trackers for registration modal
$stations = $pdo->query("SELECT * FROM stations ORDER BY city ASC")->fetchAll() ?: [];
$trackers = $pdo->query("SELECT * FROM iot_trackers ORDER BY tracker_code ASC")->fetchAll() ?: [];

// Get all parcels
$parcels = $pdo->query("SELECT p.*, so.name AS origin_name, sd.name AS dest_name, trk.tracker_code 
    FROM parcels p 
    LEFT JOIN stations so ON p.origin_station_id = so.id 
    LEFT JOIN stations sd ON p.destination_station_id = sd.id 
    LEFT JOIN iot_trackers trk ON p.tracker_id = trk.id 
    ORDER BY p.id DESC")->fetchAll() ?: [];

include __DIR__ . '/../includes/header.php';
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
  <!-- Agent Header -->
  <div class="bg-[#0B1E36] text-white p-6 sm:p-8 rounded-2xl border-b-4 border-blue-600 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <img src="<?= BASE_URL ?>/assets/images/global_voyages_logo.jpg" alt="Global Voyages" class="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-sm shrink-0">
      <div>
        <span class="px-2.5 py-0.5 rounded bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider">Guichet & Messagerie Colis</span>
        <h1 class="text-2xl font-black tracking-tight text-white mt-1"><?= htmlspecialchars($user['name']) ?></h1>
        <p class="text-xs text-slate-300 font-mono">Enregistrement, Pesée, Traçabilité & Assignation IoT</p>
      </div>
    </div>
    <div>
      <button type="button" onclick="document.getElementById('register-modal').classList.remove('hidden')"
        class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer">
        <i data-lucide="package-plus" class="w-4 h-4"></i>
        <span>Enregistrer Nouveau Colis</span>
      </button>
    </div>
  </div>

  <?php if ($msg): ?>
    <div class="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
      <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0"></i>
      <span><?= htmlspecialchars($msg) ?></span>
    </div>
  <?php endif; ?>

  <!-- Parcels Table -->
  <div class="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden space-y-4 p-6">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <i data-lucide="package" class="w-4 h-4 text-blue-600"></i>
        <span>Expéditions Enregistrées (<?= count($parcels) ?>)</span>
      </h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
          <tr>
            <th class="p-3">Numéro</th>
            <th class="p-3">Expéditeur</th>
            <th class="p-3">Destinataire</th>
            <th class="p-3">Itinéraire</th>
            <th class="p-3">Poids / Valeur</th>
            <th class="p-3">Traceur IoT</th>
            <th class="p-3">Statut</th>
            <th class="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <?php foreach ($parcels as $p): ?>
            <tr class="hover:bg-slate-50/60 transition">
              <td class="p-3 font-mono font-bold text-blue-900"><?= htmlspecialchars($p['tracking_number']) ?></td>
              <td class="p-3 font-semibold"><?= htmlspecialchars($p['sender_name']) ?><br><span class="text-slate-400 font-mono"><?= htmlspecialchars($p['sender_phone']) ?></span></td>
              <td class="p-3 font-semibold"><?= htmlspecialchars($p['recipient_name']) ?><br><span class="text-slate-400 font-mono"><?= htmlspecialchars($p['recipient_phone']) ?></span></td>
              <td class="p-3"><?= htmlspecialchars($p['origin_name']) ?> ➔ <?= htmlspecialchars($p['dest_name']) ?></td>
              <td class="p-3 font-mono"><?= $p['weight_kg'] ?> kg<br><span class="text-slate-500"><?= number_format($p['declared_value'], 0, ',', ' ') ?> FCFA</span></td>
              <td class="p-3">
                <?php if ($p['tracker_code']): ?>
                  <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-[10px]"><?= htmlspecialchars($p['tracker_code']) ?></span>
                <?php else: ?>
                  <span class="text-slate-400 italic">Aucun</span>
                <?php endif; ?>
              </td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                  <?= $p['status'] === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800' ?>">
                  <?= htmlspecialchars($p['status']) ?>
                </span>
              </td>
              <td class="p-3 text-right">
                <a href="<?= BASE_URL ?>/track.php?num=<?= urlencode($p['tracking_number']) ?>" target="_blank"
                   class="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-blue-700 font-bold transition">Suivre</a>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Register Modal -->
<div id="register-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 class="font-black text-slate-900 text-base">Enregistrer un Colis au Guichet</h3>
      <button type="button" onclick="document.getElementById('register-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <form method="POST" class="space-y-3 text-xs">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Nom Expéditeur *</label>
          <input type="text" name="sender_name" required class="w-full p-2.5 rounded-lg border border-slate-300">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Tél Expéditeur *</label>
          <input type="text" name="sender_phone" required placeholder="677949699" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Nom Destinataire *</label>
          <input type="text" name="recipient_name" required class="w-full p-2.5 rounded-lg border border-slate-300">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Tél Destinataire *</label>
          <input type="text" name="recipient_phone" required placeholder="699112233" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono">
        </div>
      </div>

      <div>
        <label class="block font-bold text-slate-700 mb-1">Adresse de Livraison Destinataire</label>
        <input type="text" name="recipient_address" required placeholder="Quartier Bastos, Yaoundé" class="w-full p-2.5 rounded-lg border border-slate-300">
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Gare Expédition</label>
          <select name="origin_station_id" class="w-full p-2.5 rounded-lg border border-slate-300">
            <?php foreach ($stations as $s): ?>
              <option value="<?= $s['id'] ?>"><?= htmlspecialchars($s['name']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Gare Destination</label>
          <select name="destination_station_id" class="w-full p-2.5 rounded-lg border border-slate-300">
            <?php foreach ($stations as $s): ?>
              <option value="<?= $s['id'] ?>" <?= $s['city'] === 'Yaoundé' ? 'selected' : '' ?>><?= htmlspecialchars($s['name']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Poids (kg)</label>
          <input type="number" step="0.5" name="weight_kg" value="5.0" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Valeur Déclarée</label>
          <input type="number" name="declared_value" value="50000" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Traceur IoT</label>
          <select name="tracker_id" class="w-full p-2.5 rounded-lg border border-slate-300 font-mono">
            <option value="">Aucun</option>
            <?php foreach ($trackers as $trk): ?>
              <option value="<?= $trk['id'] ?>"><?= htmlspecialchars($trk['tracker_code']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
        <button type="button" onclick="document.getElementById('register-modal').classList.add('hidden')" class="px-4 py-2 border rounded-lg font-bold">Annuler</button>
        <button type="submit" name="register_parcel" value="1" class="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-sm">Enregistrer Colis</button>
      </div>
    </form>
  </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
