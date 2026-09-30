<?php
// PHP-App/public/index.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/Language.php';
require_once __DIR__ . '/../src/Services/TripService.php';

$today = date('Y-m-d');
$tomorrow = date('Y-m-d', strtotime('+1 day'));
$trips = TripService::getTrips(null, null, $today);

include __DIR__ . '/includes/header.php';
?>

<!-- HERO SECTION WITH DOCKED SEARCH ENGINE -->
<section class="relative min-h-[520px] flex items-center justify-center overflow-hidden">
  <!-- Background Image with Dark Contrast Overlay -->
  <div class="absolute inset-0 z-0">
    <img src="<?= BASE_URL ?>/assets/images/global_voyages_terminal_night.jpg"
         alt="Global Voyages Terminal"
         class="w-full h-full object-cover object-center brightness-[0.35] contrast-[1.1]">
    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/70"></div>
  </div>

  <!-- Content & Docked Search Card -->
  <div class="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center text-white">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider text-sky-200 mb-3 backdrop-blur-xs">
      <i data-lucide="radio" class="w-3.5 h-3.5 text-sky-400"></i>
      <span><?= t('hero.badge') ?></span>
    </div>

    <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
      <?= t('hero.title') ?>
    </h1>
    <p class="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto mb-8 font-normal leading-relaxed">
      <?= t('hero.subtitle') ?>
    </p>

    <!-- DOCKED SEARCH CARD (SOLID CLEAN WHITE) -->
    <div class="max-w-2xl mx-auto bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 text-left">
      <!-- Tabs Switcher -->
      <div class="flex border-b border-slate-200 mb-5 gap-2">
        <button type="button" onclick="switchMainTab('book')" id="tab-btn-book"
          class="pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 border-blue-700 text-blue-700 transition cursor-pointer">
          <i data-lucide="ticket" class="w-4 h-4"></i>
          <span><?= t('hero.tabBook', 'Acheter un Billet') ?></span>
        </button>
        <button type="button" onclick="switchMainTab('track')" id="tab-btn-track"
          class="pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition cursor-pointer">
          <i data-lucide="package" class="w-4 h-4"></i>
          <span><?= t('hero.tabTrack', 'Suivi Colis') ?></span>
        </button>
      </div>

      <!-- Tab 1: Book / Trip Search -->
      <div id="tab-content-book" class="space-y-4 animate-fadeIn">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1"><?= t('search.origin', 'Gare Départ') ?></label>
            <select id="hero-from-city" onchange="handleHeroCityChange()" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="Douala">Douala (Akwa)</option>
              <option value="Yaoundé">Yaoundé (Mvan)</option>
              <option value="Bafoussam">Bafoussam</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1"><?= t('search.destination', 'Gare Destination') ?></label>
            <select id="hero-to-city" onchange="handleHeroCityChange()" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="Yaoundé">Yaoundé (Mvan)</option>
              <option value="Douala">Douala (Akwa)</option>
              <option value="Bafoussam">Bafoussam</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1"><?= t('search.date', 'Date de Voyage') ?></label>
            <input type="date" id="hero-date" value="<?= $today ?>" min="<?= $today ?>" onchange="updateHomeDepartures()"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600">
            <div class="flex items-center gap-1.5 mt-1.5">
              <button type="button" onclick="setHeroDate('<?= $today ?>')" class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold hover:bg-blue-200"><?= t('search.today', "Aujourd'hui") ?></button>
              <button type="button" onclick="setHeroDate('<?= $tomorrow ?>')" class="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold hover:bg-slate-300"><?= t('search.tomorrow', 'Demain') ?></button>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <span class="text-[11px] text-slate-500 flex items-center gap-1">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-blue-600"></i>
            <span>Flotte VIP climatisée • Paiement CamPay sécurisé</span>
          </span>
          <div class="flex items-center gap-2">
            <button type="button" onclick="updateHomeDepartures()" class="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5">
              <i data-lucide="filter" class="w-3.5 h-3.5"></i>
              <span>Filtrer</span>
            </button>
            <button type="button" onclick="triggerHeroSearch()" class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer">
              <i data-lucide="ticket" class="w-4 h-4"></i>
              <span><?= t('hero.tabBook', 'Acheter un Billet') ?></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 2: Track Parcel -->
      <div id="tab-content-track" class="space-y-4 hidden animate-fadeIn">
        <form action="<?= BASE_URL ?>/track.php" method="GET" class="flex gap-2">
          <input type="text" name="num" placeholder="<?= t('track.placeholder') ?>" required
            class="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600">
          <button type="submit" class="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer">
            <i data-lucide="navigation" class="w-4 h-4"></i>
            <span><?= t('track.btn') ?></span>
          </button>
        </form>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <span class="font-bold">Démo instantanée :</span>
          <a href="<?= BASE_URL ?>/track.php?num=PAR-2026-00125" class="font-mono text-blue-700 hover:underline font-bold">PAR-2026-00125</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- REAL TIME DEPARTURES LIST -->
<section id="departures" class="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        <?= t('search.departuresTitle', 'Départs Programmés en Temps Réel') ?>
      </h2>
      <p class="text-xs text-slate-500" id="departures-sub-text">
        Date sélectionnée : <strong class="text-blue-700" id="current-date-badge"><?= $today ?></strong> • Liaisons directes avec autocars VIP
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button type="button" onclick="openBookingModal()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
        <i data-lucide="plus-circle" class="w-4 h-4"></i>
        <span>Réserver Autre Date</span>
      </button>
      <span id="trips-count-badge" class="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
        <?= count($trips) ?> <?= Language::isEn() ? 'scheduled routes' : 'départs configurés' ?>
      </span>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="home-trips-grid">
    <?php foreach ($trips as $trip): ?>
      <?php
        $tripJson = htmlspecialchars(json_encode($trip), ENT_QUOTES, 'UTF-8');
        $depTime = substr(explode(' ', $trip['departure_scheduled'])[1] ?? '06:30', 0, 5);
        $depDate = explode(' ', $trip['departure_scheduled'])[0] ?? $today;
      ?>
      <div class="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs hover:border-blue-500 transition flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="font-mono text-xs font-bold text-slate-500"><?= htmlspecialchars($trip['trip_number']) ?></span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              <?= $trip['status'] === 'SCHEDULED' ? (Language::isEn() ? 'Scheduled' : 'Programmé') : htmlspecialchars($trip['status']) ?>
            </span>
          </div>

          <h3 class="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
            <span><?= htmlspecialchars($trip['origin_city']) ?></span>
            <i data-lucide="arrow-right" class="w-4 h-4 text-slate-400 shrink-0"></i>
            <span><?= htmlspecialchars($trip['destination_city']) ?></span>
          </h3>

          <div class="space-y-1.5 text-xs text-slate-600 my-3">
            <div class="flex items-center gap-2">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i>
              <span>Départ : <strong><?= $depTime ?></strong> • <?= date('d/m/Y', strtotime($depDate)) ?></span>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="bus" class="w-3.5 h-3.5 text-blue-600"></i>
              <span class="font-semibold text-slate-700"><?= htmlspecialchars($trip['bus_number']) ?></span>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="users" class="w-3.5 h-3.5 text-slate-400"></i>
              <span class="text-emerald-700 font-bold">32 places VIP disponibles</span>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-3 flex items-center justify-between mt-2">
          <div>
            <span class="text-lg font-black text-slate-900"><?= number_format($trip['price'], 0, ',', ' ') ?> FCFA</span>
            <span class="text-[10px] text-slate-400 uppercase font-bold block">par voyageur</span>
          </div>
          <button type="button" onclick="openBookingModal(<?= $tripJson ?>, '<?= $depDate ?>')"
            class="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer">
            <?= t('search.reserve', 'Réserver Siège VIP') ?>
          </button>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
</section>

<!-- LIVE FLEET & CARTO MAP -->
<section id="live-map" class="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-white border border-slate-300 shadow-xs">
    <div class="flex items-center gap-2.5">
      <div class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
      <h3 class="font-bold text-slate-900 text-sm">
        <?= Language::isEn() ? 'Intercity Highway N3 • Live 4G Telemetry (Carto HD)' : 'Liaison Interurbaine Axe Lourd N3 • Télémétrie 4G en Direct (Carto HD)' ?>
      </h3>
    </div>
    <div class="flex items-center gap-4 text-xs font-mono">
      <span>Vitesse : <strong id="hud-speed" class="text-blue-700">74 km/h</strong></span>
      <span>Étape : <strong id="hud-stop" class="text-slate-800">Boumnyébel</strong></span>
    </div>
  </div>

  <div id="live-fleet-map" class="w-full h-[460px] rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden z-10"></div>
</section>

<!-- VIP FLEET SHOWCASE -->
<section id="fleet" class="max-w-5xl mx-auto px-4 sm:px-6 py-12">
  <div class="relative rounded-2xl overflow-hidden bg-slate-950 text-white shadow-xl border border-slate-800">
    <div class="absolute inset-0">
      <img src="<?= BASE_URL ?>/assets/images/global_voyages_vip_interior.jpg"
           alt="Global Voyages VIP Interior"
           class="w-full h-full object-cover object-center opacity-40 brightness-75">
      <div class="absolute inset-0 bg-gradient-to-r from-[#0B1E36] via-[#0B1E36]/90 to-transparent"></div>
    </div>

    <div class="relative p-6 sm:p-12 max-w-xl space-y-4">
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
        <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
        <span>Confort Première Classe</span>
      </span>
      <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
        Voyagez dans le Plus Grand Confort Interurbain
      </h2>
      <p class="text-xs sm:text-sm text-slate-200 leading-relaxed">
        Fauteuils en cuir inclinables, climatisation régulée et wifi 4G à bord sur toutes nos liaisons quotidiennes directes.
      </p>
      <div class="grid grid-cols-2 gap-2 text-xs font-medium text-slate-200 pt-2 border-t border-white/20">
        <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-4 h-4 text-sky-400"></i> Ponctualité 100%</div>
        <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-4 h-4 text-sky-400"></i> Salons VIP climatisés</div>
        <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-4 h-4 text-sky-400"></i> Soute à bagages sécurisée</div>
        <div class="flex items-center gap-1.5"><i data-lucide="check" class="w-4 h-4 text-sky-400"></i> Sécurité 24/7 sur quai</div>
      </div>
    </div>
  </div>
</section>

<!-- INCLUDED BOOKING MODAL -->
<?php include __DIR__ . '/includes/booking_modal.php'; ?>

<!-- Page Scripts -->
<script src="<?= BASE_URL ?>/assets/js/map.js"></script>
<script src="<?= BASE_URL ?>/assets/js/booking.js"></script>
<script>
  function switchMainTab(tab) {
    if (tab === 'book') {
      document.getElementById('tab-content-book').classList.remove('hidden');
      document.getElementById('tab-content-track').classList.add('hidden');
      document.getElementById('tab-btn-book').classList.add('border-blue-700', 'text-blue-700');
      document.getElementById('tab-btn-book').classList.remove('border-transparent', 'text-slate-500');
      document.getElementById('tab-btn-track').classList.remove('border-blue-700', 'text-blue-700');
      document.getElementById('tab-btn-track').classList.add('border-transparent', 'text-slate-500');
    } else {
      document.getElementById('tab-content-track').classList.remove('hidden');
      document.getElementById('tab-content-book').classList.add('hidden');
      document.getElementById('tab-btn-track').classList.add('border-blue-700', 'text-blue-700');
      document.getElementById('tab-btn-track').classList.remove('border-transparent', 'text-slate-500');
      document.getElementById('tab-btn-book').classList.remove('border-blue-700', 'text-blue-700');
      document.getElementById('tab-btn-book').classList.add('border-transparent', 'text-slate-500');
    }
  }

  function handleHeroCityChange() {
    const originSelect = document.getElementById('hero-from-city');
    const destSelect = document.getElementById('hero-to-city');
    if (originSelect.value === destSelect.value) {
      if (originSelect.value === 'Douala') destSelect.value = 'Yaoundé';
      else destSelect.value = 'Douala';
    }
    updateHomeDepartures();
  }

  function setHeroDate(dateStr) {
    document.getElementById('hero-date').value = dateStr;
    updateHomeDepartures();
  }

  async function updateHomeDepartures() {
    const origin = document.getElementById('hero-from-city').value;
    const dest = document.getElementById('hero-to-city').value;
    const date = document.getElementById('hero-date').value;
    const grid = document.getElementById('home-trips-grid');
    const dateBadge = document.getElementById('current-date-badge');
    if (dateBadge) dateBadge.textContent = date;

    if (!grid) return;
    grid.innerHTML = '<div class="col-span-1 md:col-span-2 p-10 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200"><i data-lucide="loader" class="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600"></i>Actualisation des départs en temps réel...</div>';
    if (window.lucide) lucide.createIcons();

    try {
      const res = await fetch(`/api/trips.php?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&date=${date}`);
      const trips = await res.json();

      const countBadge = document.getElementById('trips-count-badge');
      if (countBadge) countBadge.textContent = (trips?.length || 0) + ' départs configurés';

      if (!trips || trips.length === 0) {
        grid.innerHTML = '<div class="col-span-1 md:col-span-2 p-10 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2"><p class="font-bold text-slate-700">Aucun départ direct prévu sur cette ligne pour le ' + date + '.</p><button type="button" onclick="setHeroDate(\'' + '<?= $tomorrow ?>' + '\')" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Consulter les départs de demain</button></div>';
        return;
      }

      grid.innerHTML = trips.map(t => {
        const parts = (t.departure_scheduled || '').split(' ');
        const depTime = parts[1] ? parts[1].substring(0, 5) : '06:30';
        const depDate = parts[0] || date;
        const tripEscaped = JSON.stringify(t).replace(/"/g, '&quot;');

        return `
          <div class="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs hover:border-blue-500 transition flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="font-mono text-xs font-bold text-slate-500">${t.trip_number}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  ${t.status === 'SCHEDULED' ? 'Programmé' : t.status}
                </span>
              </div>

              <h3 class="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
                <span>${t.origin_city}</span>
                <i data-lucide="arrow-right" class="w-4 h-4 text-slate-400 shrink-0"></i>
                <span>${t.destination_city}</span>
              </h3>

              <div class="space-y-1.5 text-xs text-slate-600 my-3">
                <div class="flex items-center gap-2">
                  <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i>
                  <span>Départ : <strong>${depTime}</strong> • ${depDate}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="bus" class="w-3.5 h-3.5 text-blue-600"></i>
                  <span class="font-semibold text-slate-700">${t.bus_number}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i data-lucide="users" class="w-3.5 h-3.5 text-slate-400"></i>
                  <span class="text-emerald-700 font-bold">32 places VIP disponibles</span>
                </div>
              </div>
            </div>

            <div class="border-t border-slate-100 pt-3 flex items-center justify-between mt-2">
              <div>
                <span class="text-lg font-black text-slate-900">${Number(t.price).toLocaleString()} FCFA</span>
                <span class="text-[10px] text-slate-400 uppercase font-bold block">par voyageur</span>
              </div>
              <button type="button" onclick="openBookingModal(${tripEscaped}, '${depDate}')"
                class="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer">
                Réserver Siège VIP
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide) lucide.createIcons();
    } catch (e) {
      grid.innerHTML = '<div class="col-span-1 md:col-span-2 p-6 text-xs text-red-600 bg-red-50 rounded-xl">Erreur de chargement des départs.</div>';
    }
  }

  function triggerHeroSearch() {
    const origin = document.getElementById('hero-from-city').value;
    const dest = document.getElementById('hero-to-city').value;
    const date = document.getElementById('hero-date').value;
    
    // Sync into modal inputs
    const modOrigin = document.getElementById('booking-origin-city');
    const modDest = document.getElementById('booking-dest-city');
    const modDate = document.getElementById('booking-travel-date');
    if (modOrigin) modOrigin.value = origin;
    if (modDest) modDest.value = dest;
    if (modDate) modDate.value = date;

    updateHomeDepartures();
    openBookingModal(null, date);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLiveMap('live-fleet-map');
  });
</script>

<?php include __DIR__ . '/includes/footer.php'; ?>
