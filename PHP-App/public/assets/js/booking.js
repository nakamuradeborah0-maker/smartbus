// PHP-App/public/assets/js/booking.js
let currentBookingTrip = null;
let currentBookingSeat = 14;
let currentBookingDate = new Date().toISOString().split('T')[0];
let currentBookingRef = null;
let paymentPollInterval = null;

function openBookingModal(tripData = null, selectedDate = null) {
  const modal = document.getElementById('booking-modal');
  if (!modal) return;

  if (selectedDate) {
    currentBookingDate = selectedDate;
  }
  document.getElementById('booking-travel-date').value = currentBookingDate;

  if (tripData) {
    currentBookingTrip = tripData;
    showBookingStep('seat');
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

async function loadScheduleDepartures() {
  const container = document.getElementById('schedule-departures-list');
  if (!container) return;
  container.innerHTML = '<div class="p-6 text-center text-xs text-slate-500">Chargement des départs réels...</div>';

  try {
    const origin = document.getElementById('booking-origin-city').value;
    const dest = document.getElementById('booking-dest-city').value;
    const date = document.getElementById('booking-travel-date').value;

    const res = await fetch(`/api/trips.php?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&date=${date}`);
    const trips = await res.json();

    if (!trips || trips.length === 0) {
      container.innerHTML = '<div class="p-6 text-center text-xs text-slate-400 border border-slate-200 rounded-xl">Aucun départ prévu sur cette liaison à cette date.</div>';
      return;
    }

    container.innerHTML = trips.map(t => `
      <div onclick="selectTripForSeat(${JSON.stringify(t).replace(/"/g, '&quot;')})" class="p-4 rounded-xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/40 transition cursor-pointer flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">VIP</div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold text-slate-900">${t.trip_number}</span>
              <span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">CONFIRMÉ</span>
            </div>
            <p class="text-xs font-semibold text-slate-700">${t.bus_number}</p>
            <p class="text-[11px] text-slate-500">Départ: <strong>${new Date(t.departure_scheduled).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</strong> • ${t.origin_city} ➔ ${t.destination_city}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-base font-black text-slate-900 block">${t.price.toLocaleString()} FCFA</span>
          <button type="button" class="mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition">Choisir Siège</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<div class="p-4 text-xs text-red-600">Erreur de chargement des départs.</div>';
  }
}

function selectTripForSeat(trip) {
  currentBookingTrip = trip;
  document.getElementById('seat-trip-info').textContent = `${trip.trip_number} • ${trip.bus_number}`;
  document.getElementById('seat-date-info').textContent = `${currentBookingDate} • ${new Date(trip.departure_scheduled).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
  renderSeatLayout();
  showBookingStep('seat');
}

function renderSeatLayout() {
  const container = document.getElementById('seat-layout-grid');
  if (!container) return;

  const occupied = [2, 3, 7, 11, 15, 19, 23, 27, 30]; // defaults
  let html = '';

  for (let row = 0; row < 8; row++) {
    const s1 = row * 4 + 1;
    const s2 = row * 4 + 2;
    const s3 = row * 4 + 3;
    const s4 = row * 4 + 4;

    const btn = (num) => {
      const isOcc = occupied.includes(num);
      const isSel = currentBookingSeat === num;
      return `
        <button type="button" ${isOcc ? 'disabled' : ''} onclick="chooseSeat(${num})"
          class="w-9 h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center seat-btn
          ${isOcc ? 'occupied' : (isSel ? 'selected' : 'bg-white hover:bg-blue-50 text-slate-800 border border-slate-300')}">
          ${num}
        </button>
      `;
    };

    html += `
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">${btn(s1)}${btn(s2)}</div>
        <div class="text-[9px] text-slate-400 font-mono">| |</div>
        <div class="flex items-center gap-2">${btn(s3)}${btn(s4)}</div>
      </div>
    `;
  }
  container.innerHTML = html;
  document.getElementById('selected-seat-display').textContent = `Siège N° ${currentBookingSeat} (VIP)`;
}

function chooseSeat(seatNum) {
  currentBookingSeat = seatNum;
  renderSeatLayout();
}

async function submitPaymentForm(event) {
  event.preventDefault();
  const errorBox = document.getElementById('payment-error');
  errorBox.classList.add('hidden');
  const btn = document.getElementById('pay-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Connexion CamPay...</span>';
  if (window.lucide) lucide.createIcons();

  const name = document.getElementById('pass-name').value.trim();
  const phone = document.getElementById('pass-phone').value.trim();
  const cni = document.getElementById('pass-cni').value.trim();
  const email = document.getElementById('pass-email').value.trim();
  const operator = document.querySelector('input[name="operator"]:checked')?.value || 'MTN';

  try {
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
        origin: currentBookingTrip?.origin_name || 'Douala (Gare Centrale Akwa)',
        destination: currentBookingTrip?.destination_name || 'Yaoundé (Terminal Mvan)',
        travel_date: currentBookingDate,
        departure_time: currentBookingTrip?.departure_scheduled ? new Date(currentBookingTrip.departure_scheduled).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '06:30',
        seat_number: currentBookingSeat,
        amount: currentBookingTrip?.price || 5000,
        payment_method: operator === 'OM' ? 'ORANGE_MONEY' : 'MTN_MOMO'
      })
    });

    const booking = await bookRes.json();
    if (!bookRes.ok || !booking.booking_reference) {
      throw new Error(booking.error || 'Erreur d\'enregistrement de la réservation.');
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
      throw new Error(payment.error || 'Échec d\'initiation du paiement CamPay.');
    }

    // 3. Move to pending USSD step (TICKET NOT DOWNLOADABLE YET)
    document.getElementById('pending-ussd-code').textContent = payment.ussd_code || (operator === 'OM' ? '#150*50#' : '*126#');
    document.getElementById('pending-operator-badge').textContent = payment.operator || operator;
    document.getElementById('pending-ref-badge').textContent = currentBookingRef;

    showBookingStep('pending');

    // 4. Start polling CamPay status
    paymentPollInterval = setInterval(() => checkCamPayStatus(payment.reference), 3500);

  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="smartphone" class="w-4 h-4"></i><span>Payer avec CamPay</span>';
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
  document.getElementById('success-seat-info').textContent = `Siège N° ${currentBookingSeat} (VIP)`;
  document.getElementById('download-ticket-btn').onclick = () => {
    window.location.href = `/customer/ticket.php?ref=${encodeURIComponent(currentBookingRef)}`;
  };
  showBookingStep('success');
}
