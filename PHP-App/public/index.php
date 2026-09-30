<?php
// PHP-App/public/index.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/Language.php';
require_once __DIR__ . '/../src/Services/TripService.php';

$trips = TripService::getTrips();
$today = date('Y-m-d');

include __DIR__ . '/includes/header.php';
?>

<!-- HERO SECTION WITH DOCKED SEARCH ENGINE -->
<section class="relative min-h-[500px] flex items-center justify-center overflow-hidden">
  <!-- Background Image with Dark Contrast Overlay -->
  <div class="absolute inset-0 z-0">
    <img src="<?= BASE_URL ?>/assets/images/global_voyages_terminal_night.jpg"
         alt="Global Voyages Terminal"
         class="w-full h-full object-cover object-center brightness-[0.38] contrast-[1.1]">
    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-900/60"></div>
  </div>

  <!-- Content & Docked Search Card -->
  <div class="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center text-white">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider text-sky-200 mb-3">
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
          <i data-lucide="search" class="w-4 h-4"></i>
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
            <select id="hero-from-city" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="Douala">Douala (Akwa)</option>
              <option value="Yaoundé">Yaoundé (Mvan)</option>
              <option value="Bafoussam">Bafoussam</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1"><?= t('search.destination', 'Gare Destination') ?></label>
            <select id="hero-to-city" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600">
              <option value="Yaoundé">Yaoundé (Mvan)</option>
              <option value="Douala">Douala (Akwa)</option>
              <option value="Bafoussam">Bafoussam</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1"><?= t('search.date', 'Date de Voyage') ?></label>
            <input type="date" id="hero-date" value="<?= $today ?>" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600">
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-[11px] text-slate-500">Liaisons directes autoroutières (N3)</span>
          <button type="button" onclick="triggerHeroSearch()" class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer">
            <i data-lucide="search" class="w-4 h-4"></i>
            <span><?= t('search.btn', 'Rechercher Départs') ?></span>
          </button>
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
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        <?= t('search.departuresTitle', 'Départs Programmés en Temps Réel') ?>
      </h2>
      <p class="text-xs text-slate-500">Liaisons directes garanties avec autocars VIP climatisés</p>
    </div>
    <span class="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
      <?= count($trips) ?> <?= Language::isEn() ? 'scheduled routes' : 'départs configurés' ?>
    </span>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="home-trips-grid">
    <?php foreach ($trips as $trip): ?>
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
              <span>Départ : <strong><?= date('H:i', strtotime($trip['departure_scheduled'])) ?></strong> • <?= date('d/m/Y', strtotime($trip['departure_scheduled'])) ?></span>
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
          <button type="button" onclick='openBookingModal(<?= json_encode($trip) ?>)'
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
        <?= Language::isEn() ? 'Intercity Highway N3 • Live 4G Telemetry' : 'Liaison Interurbaine Axe Lourd N3 • Télémétrie 4G en Direct' ?>
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

<!-- ================= INTERACTIVE BOOKING FLOW MODAL ================= -->
<div id="booking-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
  <div class="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-300 shadow-2xl overflow-hidden my-auto">
    <!-- Header -->
    <div class="bg-[#0B1E36] text-white px-6 py-4 flex items-center justify-between border-b-2 border-blue-600">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black">GV</div>
        <div>
          <h3 class="text-base font-black tracking-tight text-white"><?= t('booking.title') ?></h3>
          <p class="text-[11px] text-sky-200">Global Voyages VIP Intercity Express</p>
        </div>
      </div>
      <button type="button" onclick="closeBookingModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <!-- Modal Content -->
    <div class="p-6 max-h-[80vh] overflow-y-auto">

      <!-- STEP 1: SCHEDULE & DEPARTURES SELECTION -->
      <div id="step-schedule" class="booking-step space-y-4">
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Gare Départ</label>
              <select id="booking-origin-city" onchange="loadScheduleDepartures()" class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900">
                <option value="Douala">Douala (Akwa)</option>
                <option value="Yaoundé">Yaoundé (Mvan)</option>
                <option value="Bafoussam">Bafoussam</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Destination</label>
              <select id="booking-dest-city" onchange="loadScheduleDepartures()" class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900">
                <option value="Yaoundé">Yaoundé (Mvan)</option>
                <option value="Douala">Douala (Akwa)</option>
                <option value="Bafoussam">Bafoussam</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Date de Voyage</label>
              <input type="date" id="booking-travel-date" value="<?= $today ?>" onchange="loadScheduleDepartures()"
                class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900">
            </div>
          </div>
        </div>

        <div id="schedule-departures-list" class="space-y-2"></div>
      </div>

      <!-- STEP 2: SEAT SELECTION -->
      <div id="step-seat" class="booking-step space-y-5 hidden">
        <div class="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Autocar & Ligne</span>
            <strong id="seat-trip-info" class="text-slate-900">GV-1025 • Scania VIP</strong>
          </div>
          <div class="text-right">
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Date & Départ</span>
            <strong id="seat-date-info" class="text-blue-700"><?= $today ?> • 06:30</strong>
          </div>
        </div>

        <!-- Coach Layout -->
        <div class="max-w-md mx-auto p-5 bg-slate-100 rounded-2xl border-2 border-slate-300 shadow-inner">
          <div class="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-300 text-xs font-bold text-slate-500">
            <span>🚗 Avant du Bus / Chauffeur</span>
            <span>🚪 Porte VIP</span>
          </div>
          <div id="seat-layout-grid" class="space-y-2"></div>
        </div>

        <div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs">
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Siège Sélectionné</span>
            <strong id="selected-seat-display" class="text-blue-950 font-black text-sm">Siège N° 14 (VIP)</strong>
          </div>
          <div class="text-right">
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Tarif Billet</span>
            <strong class="text-emerald-700 font-black text-base">5 000 FCFA</strong>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <button type="button" onclick="showBookingStep('schedule')" class="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">Retour</button>
          <button type="button" onclick="showBookingStep('payment')" class="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer">Continuer vers Paiement ➔</button>
        </div>
      </div>

      <!-- STEP 3: PASSENGER & CAMPAY FORM -->
      <div id="step-payment" class="booking-step space-y-4 hidden">
        <form onsubmit="submitPaymentForm(event)" class="space-y-4">
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider">Coordonnées du Passager Titulaire</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Nom et Prénom *</label>
                <input type="text" id="pass-name" required value="Deborah Nakamura" class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">N° CNI ou Passeport</label>
                <input type="text" id="pass-cni" value="110293849" class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900">
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
              <input type="email" id="pass-email" value="debora@globalvoyage.com" class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900">
            </div>
          </div>

          <!-- Operator Choices -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-2">Opérateur Mobile Money</label>
            <div class="grid grid-cols-2 gap-3">
              <label class="p-3.5 rounded-xl border-2 border-slate-200 hover:border-amber-400 bg-white flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="radio" name="operator" value="MTN" checked class="text-amber-500">
                <span>MTN MoMo (*126#)</span>
              </label>
              <label class="p-3.5 rounded-xl border-2 border-slate-200 hover:border-orange-400 bg-white flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="radio" name="operator" value="OM" class="text-orange-500">
                <span>Orange Money (#150*50#)</span>
              </label>
            </div>
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1">Numéro Mobile Money (9 chiffres)</label>
            <input type="tel" id="pass-phone" required value="677949699"
              class="w-full p-3 rounded-xl bg-white border border-slate-300 text-sm font-mono font-bold text-slate-900">
            <span class="text-[11px] text-slate-500 mt-1 block">L'indicatif +237 est géré automatiquement.</span>
          </div>

          <div id="payment-error" class="hidden p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"></div>

          <div class="flex items-center justify-between pt-2">
            <button type="button" onclick="showBookingStep('seat')" class="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">Retour</button>
            <button type="submit" id="pay-submit-btn" class="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer">
              <i data-lucide="smartphone" class="w-4 h-4"></i>
              <span>Payer 5 000 FCFA avec CamPay</span>
            </button>
          </div>
        </form>
      </div>

      <!-- STEP 4: PENDING USSD VALIDATION (NO PRINT OR DOWNLOAD BUTTON HERE) -->
      <div id="step-pending" class="booking-step space-y-5 hidden text-center py-4">
        <div class="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border-2 border-amber-300 animate-pulse">
          <i data-lucide="loader" class="w-8 h-8 animate-spin"></i>
        </div>
        <h4 class="text-xl font-black text-slate-900 tracking-tight">Demande de Débit Transmise à CamPay !</h4>
        <p class="text-xs text-slate-600 max-w-md mx-auto">
          Un message de confirmation push a été envoyé sur votre mobile. Veuillez valider le débit avec votre code PIN secret.
        </p>

        <!-- USSD Code Instruction Card -->
        <div class="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 space-y-2 text-left">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs uppercase tracking-wider">Action Requise sur Mobile :</span>
            <span id="pending-operator-badge" class="px-2 py-0.5 rounded bg-amber-200 font-mono text-[10px] font-bold">MTN</span>
          </div>
          <p class="text-xs">Si le popup ne s'affiche pas, composez directement le code USSD ci-dessous :</p>
          <div class="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
            <span id="pending-ussd-code" class="font-mono text-base font-black text-slate-900">*126#</span>
            <span class="text-xs font-bold text-slate-500">Réf: <span id="pending-ref-badge" class="font-mono">BK-2026</span></span>
          </div>
        </div>

        <div class="p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-500">
          ⏳ Le billet électronique ne peut être téléchargé qu'après validation du débit par l'opérateur.
        </div>

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="button" onclick="checkCamPayStatus()" class="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer">
            Vérifier le Statut du Paiement
          </button>
          <button type="button" onclick="confirmDemoPayment()" class="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer" title="Validation instantanée démo">
            J'ai validé sur mon téléphone
          </button>
        </div>
      </div>

      <!-- STEP 5: SUCCESSFUL PAYMENT & BOARDING PASS -->
      <div id="step-success" class="booking-step space-y-5 hidden text-center py-4">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-xs">
          <i data-lucide="check-circle" class="w-9 h-9"></i>
        </div>
        <h4 class="text-xl font-black text-slate-900 tracking-tight">Paiement Confirmé & Billet Validé !</h4>
        <p class="text-xs text-slate-600 max-w-md mx-auto">
          Votre réservation est enregistrée de façon permanente dans notre base de données. Bon voyage avec Global Voyages !
        </p>

        <!-- Confirmed Card -->
        <div class="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-left space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">✓ Titre de Transport Payé</span>
            <span id="success-booking-ref" class="font-mono font-bold text-xs text-emerald-950">BK-2026</span>
          </div>
          <p id="success-seat-info" class="text-sm font-black text-slate-900">Siège N° 14 (VIP)</p>
        </div>

        <!-- Download & Done (PRINT BUTTON REMOVED) -->
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="button" id="download-ticket-btn" class="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>Télécharger Billet (HTML / PDF)</span>
          </button>
          <button type="button" onclick="closeBookingModal()" class="flex-1 py-3 rounded-xl bg-[#0B1E36] hover:bg-blue-900 text-white font-bold text-xs shadow-md transition cursor-pointer">
            Terminer & Voir mes Billets
          </button>
        </div>
      </div>

    </div>
  </div>
</div>

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

  function triggerHeroSearch() {
    const origin = document.getElementById('hero-from-city').value;
    const dest = document.getElementById('hero-to-city').value;
    const date = document.getElementById('hero-date').value;
    document.getElementById('booking-origin-city').value = origin;
    document.getElementById('booking-dest-city').value = dest;
    openBookingModal(null, date);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLiveMap('live-fleet-map');
  });
</script>

<?php include __DIR__ . '/includes/footer.php'; ?>
