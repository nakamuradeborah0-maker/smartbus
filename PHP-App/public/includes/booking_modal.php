<?php
// PHP-App/public/includes/booking_modal.php
require_once __DIR__ . '/../../src/Language.php';
$today = date('Y-m-d');
?>
<!-- REUSABLE INTERACTIVE BOOKING FLOW MODAL -->
<div id="booking-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
  <div class="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-300 shadow-2xl overflow-hidden my-auto">
    <!-- Header -->
    <div class="bg-[#0B1E36] text-white px-6 py-4 flex items-center justify-between border-b-2 border-blue-600">
      <div class="flex items-center gap-3">
        <img src="<?= BASE_URL ?>/assets/images/global_voyages_logo.jpg" alt="Global Voyages" class="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-xs shrink-0">
        <div>
          <h3 class="text-base font-black tracking-tight text-white"><?= t('booking.title', 'Réservation de Billet VIP') ?></h3>
          <p class="text-[11px] text-sky-200"><?= t('booking.subtitle', 'Global Voyages VIP Intercity Express') ?></p>
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
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1"><?= t('search.origin', 'Gare Départ') ?></label>
              <select id="booking-origin-city" onchange="handleModalCityChange('origin')" class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900">
                <option value="Douala">Douala (Akwa)</option>
                <option value="Yaoundé">Yaoundé (Mvan)</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1"><?= t('search.destination', 'Destination') ?></label>
              <select id="booking-dest-city" onchange="handleModalCityChange('dest')" class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900">
                <option value="Yaoundé">Yaoundé (Mvan)</option>
                <option value="Douala">Douala (Akwa)</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1"><?= t('search.date', 'Date de Voyage') ?></label>
              <input type="date" id="booking-travel-date" value="<?= $today ?>" min="<?= $today ?>" onchange="loadScheduleDepartures()"
                class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900">
              <div class="flex items-center gap-1.5 mt-1.5">
                <button type="button" onclick="setModalDate(0)" class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold hover:bg-blue-200"><?= t('search.today', "Aujourd'hui") ?></button>
                <button type="button" onclick="setModalDate(1)" class="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold hover:bg-slate-300"><?= t('search.tomorrow', 'Demain') ?></button>
                <button type="button" onclick="setModalDate(2)" class="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold hover:bg-slate-300">+2 j</button>
              </div>
            </div>
          </div>
        </div>

        <div id="schedule-departures-list" class="space-y-2"></div>
      </div>

      <!-- STEP 2: SEAT SELECTION -->
      <div id="step-seat" class="booking-step space-y-5 hidden">
        <div class="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold"><?= t('search.departuresTitle', 'Autocar & Ligne') ?></span>
            <strong id="seat-trip-info" class="text-slate-900">GV-1025 • Scania VIP</strong>
          </div>
          <div class="text-right">
            <span class="text-slate-500 block text-[10px] uppercase font-bold"><?= t('search.date', 'Date & Départ') ?></span>
            <strong id="seat-date-info" class="text-blue-700"><?= $today ?> • 06:30</strong>
          </div>
        </div>

        <!-- Coach Layout -->
        <div class="max-w-md mx-auto p-5 bg-slate-100 rounded-2xl border-2 border-slate-300 shadow-inner">
          <div class="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-300 text-xs font-bold text-slate-500">
            <span><?= t('booking.busFront', '🚗 Avant du Bus / Chauffeur') ?></span>
            <span><?= t('booking.vipDoor', '🚪 Porte VIP') ?></span>
          </div>
          <div id="seat-layout-grid" class="space-y-2"></div>
        </div>

        <div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs">
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold"><?= t('booking.selectedSeat', 'Siège Sélectionné') ?></span>
            <strong id="selected-seat-display" class="text-blue-950 font-black text-sm"><?= sprintf(t('booking.seatVIP', 'Siège N° %s (VIP)'), '14') ?></strong>
          </div>
          <div class="text-right">
            <span class="text-slate-500 block text-[10px] uppercase font-bold"><?= t('booking.ticketPrice', 'Tarif Billet') ?></span>
            <strong class="text-emerald-700 font-black text-base">5 000 <?= t('search.price', 'FCFA') ?></strong>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <button type="button" onclick="showBookingStep('schedule')" class="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
            <?= t('booking.back', 'Retour') ?>
          </button>
          <button type="button" onclick="showBookingStep('payment')" class="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition cursor-pointer">
            <?= t('booking.continueToPay', 'Continuer vers Paiement ➔') ?>
          </button>
        </div>
      </div>

      <!-- STEP 3: PASSENGER & CAMPAY FORM -->
      <div id="step-payment" class="booking-step space-y-4 hidden">
        <form onsubmit="submitPaymentForm(event)" class="space-y-4">
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider"><?= t('booking.passengerInfo', 'Coordonnées du Passager Titulaire') ?></h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1"><?= t('booking.passengerName', 'Nom et Prénom *') ?></label>
                <input type="text" id="pass-name" required value="Deborah Nakamura" class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1"><?= t('booking.passengerId', 'N° CNI ou Passeport') ?></label>
                <input type="text" id="pass-cni" value="110293849" class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900">
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1"><?= t('booking.email', 'Adresse Email (Optionnel)') ?></label>
              <input type="email" id="pass-email" value="debora@globalvoyage.com" class="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900">
            </div>
          </div>

          <!-- Operator Choices -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-2"><?= t('booking.operator', 'Opérateur Mobile Money') ?></label>
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
            <label class="block text-[11px] font-bold text-slate-700 uppercase mb-1"><?= t('booking.phone', 'Numéro Mobile Money (9 chiffres)') ?></label>
            <input type="tel" id="pass-phone" required value="677949699"
              class="w-full p-3 rounded-xl bg-white border border-slate-300 text-sm font-mono font-bold text-slate-900">
            <span class="text-[11px] text-slate-500 mt-1 block"><?= t('booking.phoneHelp', "L'indicatif +237 est géré automatiquement.") ?></span>
          </div>

          <div id="payment-error" class="hidden p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"></div>

          <div class="flex items-center justify-between pt-2">
            <button type="button" onclick="showBookingStep('seat')" class="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
              <?= t('booking.back', 'Retour') ?>
            </button>
            <button type="submit" id="pay-submit-btn" class="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer">
              <i data-lucide="smartphone" class="w-4 h-4"></i>
              <span><?= sprintf(t('booking.payBtn', 'Payer 5 000 %s avec CamPay'), t('search.price', 'FCFA')) ?></span>
            </button>
          </div>
        </form>
      </div>

      <!-- STEP 4: PENDING USSD VALIDATION -->
      <div id="step-pending" class="booking-step space-y-5 hidden text-center py-4">
        <div class="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border-2 border-amber-300 animate-pulse">
          <i data-lucide="loader" class="w-8 h-8 animate-spin"></i>
        </div>
        <h4 class="text-xl font-black text-slate-900 tracking-tight"><?= t('booking.pendingTitle', 'Demande de Débit Transmise à CamPay !') ?></h4>
        <p class="text-xs text-slate-600 max-w-md mx-auto">
          <?= t('booking.pendingDesc', 'Un message de confirmation push a été envoyé sur votre mobile. Veuillez valider le débit avec votre code PIN secret.') ?>
        </p>

        <!-- USSD Code Instruction Card -->
        <div class="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 space-y-2 text-left">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs uppercase tracking-wider"><?= t('booking.actionRequired', 'Action Requise sur Mobile :') ?></span>
            <span id="pending-operator-badge" class="px-2 py-0.5 rounded bg-amber-200 font-mono text-[10px] font-bold">MTN</span>
          </div>
          <p class="text-xs"><?= t('booking.ussdHelp', "Si le popup ne s'affiche pas, composez directement le code USSD ci-dessous :") ?></p>
          <div class="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
            <span id="pending-ussd-code" class="font-mono text-base font-black text-slate-900">*126#</span>
            <span class="text-xs font-bold text-slate-500">Réf: <span id="pending-ref-badge" class="font-mono">BK-2026</span></span>
          </div>
        </div>

        <div class="p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-500">
          <?= t('booking.ticketBlockedHelp', "⏳ Le billet électronique ne peut être téléchargé qu'après validation du débit par l'opérateur.") ?>
        </div>

        <!-- Live Automated Mobile Payment Detection Banner -->
        <div class="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center gap-3 text-xs font-bold shadow-inner">
          <i data-lucide="loader" class="w-4 h-4 animate-spin text-blue-600 shrink-0"></i>
          <span id="pending-status-text"><?= t('booking.autoDetecting', 'Détection automatique du paiement mobile en cours...') ?></span>
        </div>

        <div class="pt-1">
          <button type="button" onclick="checkCamPayStatus()" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition cursor-pointer flex items-center justify-center gap-2">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-slate-500"></i>
            <span><?= t('booking.checkStatus', 'Vérifier le Statut du Paiement') ?></span>
          </button>
        </div>
      </div>

      <!-- STEP 5: SUCCESSFUL PAYMENT & BOARDING PASS -->
      <div id="step-success" class="booking-step space-y-5 hidden text-center py-4">
        <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-xs">
          <i data-lucide="check-circle" class="w-9 h-9"></i>
        </div>
        <h4 class="text-xl font-black text-slate-900 tracking-tight"><?= t('booking.successTitle', 'Paiement Confirmé & Billet Validé !') ?></h4>
        <p class="text-xs text-slate-600 max-w-md mx-auto">
          <?= t('booking.successDesc', 'Votre réservation est enregistrée de façon permanente dans notre base de données. Bon voyage avec Global Voyages !') ?>
        </p>

        <!-- Confirmed Card -->
        <div class="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-left space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider"><?= t('booking.paidTicket', '✓ Titre de Transport Payé') ?></span>
            <span id="success-booking-ref" class="font-mono font-bold text-xs text-emerald-950">BK-2026</span>
          </div>
          <p id="success-seat-info" class="text-sm font-black text-slate-900"><?= sprintf(t('booking.seatVIP', 'Siège N° %s (VIP)'), '14') ?></p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="button" id="download-ticket-btn" class="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span><?= t('booking.downloadTicket', 'Télécharger Billet (HTML / PDF)') ?></span>
          </button>
          <button type="button" onclick="closeBookingModal()" class="flex-1 py-3 rounded-xl bg-[#0B1E36] hover:bg-blue-900 text-white font-bold text-xs shadow-md transition cursor-pointer">
            <?= t('booking.close', 'Terminer & Voir mes Billets') ?>
          </button>
        </div>
      </div>

    </div>
  </div>
</div>
<!-- Scripts for Booking Flow -->
<script src="<?= BASE_URL ?>/assets/js/booking.js"></script>
