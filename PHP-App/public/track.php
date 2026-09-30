<?php
// PHP-App/public/track.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/Services/ParcelService.php';
require_once __DIR__ . '/../src/Language.php';

$query = trim($_GET['num'] ?? '');
$parcel = $query ? ParcelService::track($query) : null;

include __DIR__ . '/includes/header.php';
?>

<div class="max-w-4xl mx-auto px-4 py-12 animate-fadeIn space-y-6">
  <!-- Search Header -->
  <div class="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
        <i data-lucide="package" class="w-5 h-5"></i>
      </div>
      <div>
        <h2 class="text-xl font-black text-slate-900"><?= t('track.title', "Suivi d'Acheminement Colis") ?></h2>
        <p class="text-xs text-slate-500"><?= t('track.subtitle', 'Télémétrie GPS et traçabilité aux checkpoints de gare') ?></p>
      </div>
    </div>

    <form method="GET" class="flex gap-2">
      <input type="text" name="num" value="<?= htmlspecialchars($query) ?>" placeholder="<?= t('track.placeholder', 'Entrez le numéro (ex: PAR-2026-00125)') ?>" required
        class="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600">
      <button type="submit" class="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer">
        <i data-lucide="search" class="w-4 h-4"></i>
        <span><?= t('track.btn', 'Localiser') ?></span>
      </button>
    </form>
  </div>

  <?php if ($query && !$parcel): ?>
    <div class="p-8 text-center bg-white rounded-2xl border border-red-200 text-red-600 text-xs space-y-2">
      <i data-lucide="alert-circle" class="w-8 h-8 mx-auto text-red-500"></i>
      <p class="font-bold"><?= t('track.notFound', 'Colis introuvable pour la référence') ?> "<?= htmlspecialchars($query) ?>"</p>
      <p class="text-slate-500"><?= t('track.notFoundHelp', "Vérifiez l'orthographe de votre numéro d'expédition.") ?></p>
    </div>
  <?php elseif ($parcel): ?>
    <!-- Parcel Details Card -->
    <div class="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden space-y-6 p-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span class="text-[10px] text-slate-400 font-bold uppercase block"><?= t('track.trackingNum', 'Numéro de Suivi') ?></span>
          <span class="font-mono text-2xl font-black text-blue-900"><?= htmlspecialchars($parcel['tracking_number']) ?></span>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="openTrackMapModal()"
            class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="map" class="w-4 h-4 text-sky-400"></i>
            <span><?= t('track.seeMap', '🗺️ Voir sur la Carte (See on Map)') ?></span>
          </button>
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
            <?= $parcel['status'] === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300' ?>">
            <?= htmlspecialchars($parcel['status']) ?>
          </span>
        </div>
      </div>

      <!-- Route Stations -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span class="text-[10px] text-slate-500 uppercase font-bold"><?= t('track.senderStation', 'Gare Expéditrice') ?></span>
          <p class="text-sm font-bold text-slate-900 mt-0.5"><?= htmlspecialchars($parcel['origin_station']) ?></p>
          <span class="text-xs text-slate-500 font-semibold"><?= htmlspecialchars($parcel['sender_name']) ?> (<?= htmlspecialchars($parcel['sender_phone']) ?>)</span>
        </div>
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span class="text-[10px] text-slate-500 uppercase font-bold"><?= t('track.destStation', 'Gare Destinataire') ?></span>
          <p class="text-sm font-bold text-slate-900 mt-0.5"><?= htmlspecialchars($parcel['dest_station']) ?></p>
          <span class="text-xs text-slate-500 font-semibold"><?= htmlspecialchars($parcel['recipient_name']) ?> (<?= htmlspecialchars($parcel['recipient_phone']) ?>)</span>
        </div>
      </div>

      <!-- Checkpoint Timeline -->
      <div>
        <h4 class="text-xs font-black uppercase tracking-wider text-slate-900 mb-3"><?= t('track.history', 'Chronologie des Événements') ?></h4>
        <div class="space-y-3 pl-2 border-l-2 border-blue-500">
          <?php foreach ($parcel['history'] as $h): ?>
            <div class="relative pl-4">
              <div class="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
              <span class="text-xs font-bold text-slate-900 block"><?= htmlspecialchars($h['status']) ?></span>
              <p class="text-xs text-slate-600"><?= htmlspecialchars($h['notes']) ?></p>
              <span class="text-[10px] text-slate-400 font-mono"><?= $h['created_at'] ?></span>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
  <?php endif; ?>
</div>

<!-- Modal Interactive Carto HD Map (Optional) -->
<div id="track-map-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs flex">
  <div class="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-4xl w-full p-6 space-y-4 animate-fadeIn">
    <div class="flex items-center justify-between pb-3 border-b border-slate-200">
      <div>
        <h3 class="font-black text-slate-900 text-base"><?= t('map.title') ?></h3>
        <p class="text-xs text-slate-500 font-mono"><?= t('map.subtitle') ?></p>
      </div>
      <button type="button" onclick="closeTrackMapModal()" class="text-slate-400 hover:text-slate-800">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>
    
    <div id="track-live-map" class="w-full h-[420px] rounded-xl border border-slate-300"></div>

    <div class="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
      <span class="text-slate-500">📍 <?= t('track.activeTracker', 'Balise GPS 4G active sur le convoi') ?></span>
      <button type="button" onclick="closeTrackMapModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl"><?= t('map.close', 'Fermer') ?></button>
    </div>
  </div>
</div>

<script src="<?= BASE_URL ?>/assets/js/map.js"></script>
<script>
  let trackMapInitialized = false;

  function openTrackMapModal() {
    document.getElementById('track-map-modal').classList.remove('hidden');
    if (!trackMapInitialized) {
      setTimeout(() => {
        initLiveMap('track-live-map');
        trackMapInitialized = true;
      }, 100);
    }
  }

  function closeTrackMapModal() {
    document.getElementById('track-map-modal').classList.add('hidden');
  }
</script>

<?php include __DIR__ . '/includes/footer.php'; ?>
