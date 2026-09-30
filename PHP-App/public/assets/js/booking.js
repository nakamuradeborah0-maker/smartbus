// PHP-App/public/assets/js/booking.js
let currentBookingTrip = null;
let currentBookingSeat = 14;
let currentBookingDate = new Date().toISOString().split('T')[0];
let currentBookingRef = null;
let paymentPollInterval = null;

// i18n helper from window.I18N
function t(key, fallback) {
  if (window.I18N && window.I18N[key]) {
    return window.I18N[key];
  }
  return fallback !== undefined ? fallback : key;
}

function formatTime(dtStr) {
  if (!dtStr) return '06:30';
  const parts = dtStr.split(' ');
  if (parts.length > 1) {
    return parts[1].substring(0, 5);
  }
  return dtStr.substring(11, 16) || '06:30';
}

function openBookingModal(tripData = null, selectedDate = null) {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;

  if (typeof tripData === 'string') {
    try {
      tripData = JSON.parse(tripData);
    } catch (e) {
      tripData = null;
    }
  }

  const heroDate = document.getElementById('hero-date')?.value;
  if (selectedDate) {
    currentBookingDate = selectedDate;
  } else if (heroDate) {
    currentBookingDate = heroDate;
  } else if (!currentBookingDate) {
    currentBookingDate = new Date().toISOString().split('T')[0];
  }

  const modalDateInput = document.getElementById('booking-travel-date');
  if (modalDateInput) {
    modalDateInput.value = currentBookingDate;
    modalDateInput.min = new Date().toISOString().split('T')[0];
  }

  if (tripData) {
    selectTripForSeat(tripData);
  } else {
    showBookingStep('schedule');
    loadScheduleDepartures();
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  if (paymentPollInterval) {
    clearInterval(paymentPollInterval);
    paymentPollInterval = null;
  }
}

function showBookingStep(step) {
  document.querySelectorAll('.booking-step').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById('step-' + step);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('animate-fadeIn');
  }
  if (window.lucide) lucide.createIcons();
}

function setModalDate(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const iso = d.toISOString().split('T')[0];
  currentBookingDate = iso;
  const input = document.getElementById('booking-travel-date');
  if (input) input.value = iso;
  loadScheduleDepartures();
}

function handleModalCityChange(changed = 'origin') {
  const originSelect = document.getElementById('booking-origin-city');
  const destSelect = document.getElementById('booking-dest-city');
  if (changed === 'origin') {
    destSelect.value = (originSelect.value === 'Douala') ? 'Yaoundé' : 'Douala';
  } else {
    originSelect.value = (destSelect.value === 'Douala') ? 'Yaoundé' : 'Douala';
  }
  loadScheduleDepartures();
}

async function loadScheduleDepartures() {
  const container = document.getElementById('schedule-departures-list');
  if (!container) return;
  
  const loadingText = t('booking.loadingDepartures', 'Recherche des départs en temps réel...');
  container.innerHTML = `<div class="p-8 text-center text-xs text-slate-500"><i data-lucide="loader" class="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600"></i>${loadingText}</div>`;
  if (window.lucide) lucide.createIcons();

  try {
    const originSelect = document.getElementById('booking-origin-city');
    const destSelect = document.getElementById('booking-dest-city');
    const dateInput = document.getElementById('booking-travel-date');

    let origin = originSelect?.value || 'Douala';
    let dest = destSelect?.value || 'Yaoundé';
    let date = dateInput?.value || currentBookingDate;

    // Auto fix if same origin and dest
    if (origin === dest) {
      if (origin === 'Douala') dest = 'Yaoundé';
      else dest = 'Douala';
      if (destSelect) destSelect.value = dest;
    }

    currentBookingDate = date;

    const res = await fetch(`/api/trips.php?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&date=${date}`);
    const trips = await res.json();

    if (!trips || trips.length === 0) {
      const noDepText = t('booking.noDepartures', 'Aucun départ programmé sur cette ligne pour le %s.').replace('%s', date);
      const seeTomorrowText = t('booking.seeTomorrow', 'Voir les départs de demain');
      container.innerHTML = `
        <div class="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <p class="text-xs font-bold text-slate-700">${noDepText}</p>
          <button type="button" onclick="setModalDate(1)" class="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">${seeTomorrowText}</button>
        </div>
      `;
      return;
    }

    const confirmedLabel = t('booking.confirmed', 'CONFIRMÉ');
    const departureLabel = t('search.departure', 'Départ :');
    const chooseSeatLabel = t('booking.chooseSeat', 'Choisir Siège ➔');
    window.SCHEDULE_TRIPS = trips;

    container.innerHTML = trips.map(t => {
      const depTime = formatTime(t.departure_scheduled);
      return `
        <div onclick="selectTripById(${t.id})" class="p-4 rounded-xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition cursor-pointer flex items-center justify-between gap-3 group shadow-xs">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-blue-100 group-hover:bg-blue-600 group-hover:text-white text-blue-700 font-mono font-black text-xs flex items-center justify-center shrink-0 transition">
              VIP
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-black text-slate-900">${t.trip_number}</span>
                <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">${confirmedLabel}</span>
              </div>
              <p class="text-xs font-bold text-slate-800 mt-0.5">${t.bus_number}</p>
              <p class="text-[11px] text-slate-500">
                ${departureLabel} <strong class="text-blue-700 font-bold">${depTime}</strong> • ${t.origin_city} ➔ ${t.destination_city}
              </p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="text-base font-black text-slate-900 block">${Number(t.price).toLocaleString()} ${currencyLabel}</span>
            <button type="button" class="mt-1 px-3 py-1 bg-blue-700 group-hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-xs transition">
              ${chooseSeatLabel}
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    container.innerHTML = '<div class="p-4 text-xs text-red-600 bg-red-50 rounded-xl">Error loading departures / Erreur de chargement des départs.</div>';
  }
}

function selectTripById(id) {
  const trip = (window.SCHEDULE_TRIPS || []).find(x => Number(x.id) === Number(id));
  if (trip) {
    selectTripForSeat(trip);
  }
}

async function selectTripForSeat(trip) {
  currentBookingTrip = trip;
  const depTime = formatTime(trip.departure_scheduled);
  const tripInfoEl = document.getElementById('seat-trip-info');
  const dateInfoEl = document.getElementById('seat-date-info');
  if (tripInfoEl) tripInfoEl.textContent = `${trip.trip_number} • ${trip.bus_number}`;
  if (dateInfoEl) dateInfoEl.textContent = `${currentBookingDate} • ${depTime}`;
  
  // Render layout and show step
  await renderSeatLayout();
  showBookingStep('seat');
}

async function renderSeatLayout() {
  const container = document.getElementById('seat-layout-grid');
  if (!container) return;

  // Fetch real occupied seats from server
  let occupied = [2, 3, 7, 11, 15, 19, 23, 27, 30];
  try {
    const res = await fetch(`/api/bookings.php?trip_id=${currentBookingTrip?.id || 1}&travel_date=${currentBookingDate}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const booked = data.map(b => Number(b.seat_number));
        occupied = Array.from(new Set([...occupied, ...booked]));
      }
    }
  } catch (e) {}

  // If current seat is occupied, auto switch to first free
  if (occupied.includes(currentBookingSeat)) {
    for (let i = 1; i <= 32; i++) {
      if (!occupied.includes(i)) {
        currentBookingSeat = i;
        break;
      }
    }
  }

  const aisleLabel = t('booking.aisle', 'ALLÉE');
  const seatOccupiedLabel = t('booking.seatOccupied', 'Siège Occupé');
  const seatFreeTemplate = t('booking.seatFree', 'Siège %s Libre');

  let html = '';
  for (let row = 0; row < 8; row++) {
    const s1 = row * 4 + 1;
    const s2 = row * 4 + 2;
    const s3 = row * 4 + 3;
    const s4 = row * 4 + 4;

    const btn = (num) => {
      const isOcc = occupied.includes(num);
      const isSel = currentBookingSeat === num;
      const title = isOcc ? seatOccupiedLabel : seatFreeTemplate.replace('%s', num);
      return `
        <button type="button" ${isOcc ? 'disabled' : ''} onclick="chooseSeat(${num})"
          title="${title}"
          class="w-9 h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center seat-btn
          ${isOcc ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300' : (isSel ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-400 font-black' : 'bg-white hover:bg-blue-50 text-slate-800 border border-slate-300')}">
          ${num}
        </button>
      `;
    };

    html += `
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">${btn(s1)}${btn(s2)}</div>
        <div class="text-[9px] text-slate-400 font-mono tracking-widest font-bold">${aisleLabel}</div>
        <div class="flex items-center gap-2">${btn(s3)}${btn(s4)}</div>
      </div>
    `;
  }
  container.innerHTML = html;
  updateSeatDisplay();
}

function updateSeatDisplay() {
  const displayEl = document.getElementById('selected-seat-display');
  if (displayEl) {
    displayEl.textContent = t('booking.seatVIP', 'Siège N° %s (VIP)').replace('%s', currentBookingSeat);
  }
}

function chooseSeat(seatNum) {
  currentBookingSeat = seatNum;
  updateSeatDisplay();
  // Update UI selection classes without full re-render
  document.querySelectorAll('.seat-btn').forEach(btn => {
    if (!btn.disabled) {
      if (btn.textContent.trim() === String(seatNum)) {
        btn.className = 'w-9 h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center seat-btn bg-blue-700 text-white shadow-sm ring-2 ring-blue-400 font-black';
      } else {
        btn.className = 'w-9 h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center seat-btn bg-white hover:bg-blue-50 text-slate-800 border border-slate-300';
      }
    }
  });
}

async function submitPaymentForm(event) {
  event.preventDefault();
  const errorBox = document.getElementById('payment-error');
  errorBox.classList.add('hidden');
  const btn = document.getElementById('pay-submit-btn');
  btn.disabled = true;
  
  const connectingLabel = t('booking.connectingCampay', 'Connexion CamPay...');
  btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>${connectingLabel}</span>`;
  if (window.lucide) lucide.createIcons();

  const name = document.getElementById('pass-name').value.trim();
  const phone = document.getElementById('pass-phone').value.trim();
  const cni = document.getElementById('pass-cni').value.trim();
  const email = document.getElementById('pass-email').value.trim();
  const operator = document.querySelector('input[name="operator"]:checked')?.value || 'MTN';

  try {
    const depTime = formatTime(currentBookingTrip?.departure_scheduled);

    // 1. Create booking in DB
    const bookRes = await fetch('/api/bookings.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trip_id: currentBookingTrip?.id || 1,
        trip_number: currentBookingTrip?.trip_number || 'GV-1025',
        bus_model: currentBookingTrip?.bus_number || 'Scania VIP First Class',
        passenger_name: name,
        passenger_id_number: cni,
        passenger_email: email,
        passenger_phone: phone,
        origin: currentBookingTrip?.origin_name || (currentBookingTrip?.origin_city + ' (Gare Centrale)'),
        destination: currentBookingTrip?.destination_name || (currentBookingTrip?.destination_city + ' (Terminal)'),
        travel_date: currentBookingDate,
        departure_time: depTime,
        seat_number: currentBookingSeat,
        amount: currentBookingTrip?.price || 5000,
        payment_method: operator === 'OM' ? 'ORANGE_MONEY' : 'MTN_MOMO'
      })
    });

    const booking = await bookRes.json();
    if (!bookRes.ok || !booking.booking_reference) {
      throw new Error(booking.error || "Erreur d'enregistrement de la réservation.");
    }

    currentBookingRef = booking.booking_reference;

    // 2. Call CamPay collect
    const payRes = await fetch('/api/payment.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: currentBookingTrip?.price || 5000,
        phoneNumber: phone,
        bookingReference: currentBookingRef
      })
    });

    const payment = await payRes.json();
    if (!payRes.ok || !payment.reference) {
      throw new Error(payment.error || "Échec d'initiation du paiement CamPay.");
    }

    // 3. Move to pending USSD step (TICKET STRICTLY BLOCKED BEFORE APPROVAL)
    document.getElementById('pending-ussd-code').textContent = payment.ussd_code || (operator === 'OM' ? '#150*50#' : '*126#');
    document.getElementById('pending-operator-badge').textContent = payment.operator || operator;
    document.getElementById('pending-ref-badge').textContent = currentBookingRef;

    showBookingStep('pending');

    // 4. Start polling CamPay status every 3.5s
    paymentPollInterval = setInterval(() => checkCamPayStatus(payment.reference), 3500);

  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="smartphone" class="w-4 h-4"></i><span>${t('booking.payBtn', 'Payer avec CamPay')}</span>`;
    if (window.lucide) lucide.createIcons();
  }
}

async function checkCamPayStatus(ref = null) {
  const reference = ref || currentBookingRef;
  if (!reference) return;

  try {
    const res = await fetch(`/api/payment-status.php?reference=${encodeURIComponent(reference)}`);
    const data = await res.json();

    if (data.status === 'SUCCESSFUL') {
      if (paymentPollInterval) clearInterval(paymentPollInterval);
      showSuccessTicket();
    }
  } catch (e) {}
}

async function confirmDemoPayment() {
  if (!currentBookingRef) return;
  try {
    const res = await fetch('/api/payment-demo-confirm.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: currentBookingRef })
    });
    const data = await res.json();
    if (data.success || data.status === 'SUCCESSFUL') {
      if (paymentPollInterval) clearInterval(paymentPollInterval);
      showSuccessTicket();
    }
  } catch (e) {}
}

function showSuccessTicket() {
  document.getElementById('success-booking-ref').textContent = currentBookingRef;
  document.getElementById('success-seat-info').textContent = t('booking.seatVIP', 'Siège N° %s (VIP)').replace('%s', currentBookingSeat);
  const dlBtn = document.getElementById('download-ticket-btn');
  if (dlBtn) {
    dlBtn.onclick = () => {
      window.open(`/customer/ticket.php?ref=${encodeURIComponent(currentBookingRef)}`, '_blank');
    };
  }
  showBookingStep('success');
}

function resumeBookingPayment(ref, phone, operator, seat, bus) {
  currentBookingRef = ref;
  currentBookingSeat = seat || 14;
  const modal = document.getElementById('booking-modal');
  if (!modal) {
    window.location.href = `/customer/ticket.php?ref=${encodeURIComponent(ref)}`;
    return;
  }

  const ussd = (operator === 'ORANGE_MONEY' || operator === 'OM') ? '#150*50#' : '*126#';
  const opName = (operator === 'ORANGE_MONEY' || operator === 'OM') ? 'Orange Money' : 'MTN MoMo';

  const ussdEl = document.getElementById('pending-ussd-code');
  const badgeEl = document.getElementById('pending-operator-badge');
  const refEl = document.getElementById('pending-ref-badge');

  if (ussdEl) ussdEl.textContent = ussd;
  if (badgeEl) badgeEl.textContent = opName;
  if (refEl) refEl.textContent = ref;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  showBookingStep('pending');
}

