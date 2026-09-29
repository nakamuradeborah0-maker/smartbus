import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Smartphone,
  RotateCw,
  ArrowLeft,
  Ticket,
  Bus,
  Check,
  AlertCircle,
  Copy,
  Printer,
  Sparkles,
  Download,
  User,
  IdCard,
  Mail
} from 'lucide-react';
import { api } from '../../api/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const BookingFlowModal = ({ isOpen, onClose, initialTrip = null, onBookingSuccess }) => {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  
  // Steps: 'schedule' | 'seat' | 'payment' | 'success'
  const [step, setStep] = useState(initialTrip ? 'seat' : 'schedule');

  // Search / Trip filters
  const [fromCity, setFromCity] = useState('Douala');
  const [toCity, setToCity] = useState('Yaoundé');
  const [travelDate, setTravelDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Passenger Reservation Details
  const [passengerName, setPassengerName] = useState(user?.name || 'Deborah Nakamura');
  const [passengerCni, setPassengerCni] = useState('');
  const [passengerEmail, setPassengerEmail] = useState(user?.email || '');

  // Selected Trip & Seat
  const [selectedTrip, setSelectedTrip] = useState(initialTrip);
  const [selectedSeat, setSelectedSeat] = useState(14); // Default VIP seat

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('MTN'); // 'MTN' | 'OM'
  const [phoneNumber, setPhoneNumber] = useState('677949699');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Available departures mock/real data
  const defaultDepartures = [
    {
      id: 'DEP-01',
      tripNumber: 'GV-1025',
      from: 'Douala (Gare Centrale Akwa)',
      to: 'Yaoundé (Terminal Mvan)',
      departureTime: '06:30',
      arrivalTime: '10:30',
      duration: '4h 00m',
      busModel: 'Scania VIP First Class #LT-782-AA',
      totalSeats: 32,
      availableSeats: 14,
      occupiedSeats: [2, 3, 7, 8, 11, 15, 18, 19, 23, 24, 27, 30, 31],
      price: 5000,
      amenities: ['AC', 'Leather', 'Wi-Fi', 'USB Plug'],
    },
    {
      id: 'DEP-02',
      tripNumber: 'GV-1026',
      from: 'Douala (Gare Centrale Akwa)',
      to: 'Yaoundé (Terminal Mvan)',
      departureTime: '09:00',
      arrivalTime: '13:00',
      duration: '4h 00m',
      busModel: 'Mercedes Comfort Executive #CE-341-BA',
      totalSeats: 32,
      availableSeats: 22,
      occupiedSeats: [1, 4, 9, 12, 16, 20, 25],
      price: 5000,
      amenities: ['AC', 'Leather', 'Wi-Fi'],
    },
    {
      id: 'DEP-03',
      tripNumber: 'GV-1028',
      from: 'Douala (Gare Centrale Akwa)',
      to: 'Yaoundé (Terminal Mvan)',
      departureTime: '14:00',
      arrivalTime: '18:00',
      duration: '4h 00m',
      busModel: 'Scania VIP Lounge Express #LT-890-BB',
      totalSeats: 32,
      availableSeats: 8,
      occupiedSeats: [3, 5, 6, 10, 13, 14, 17, 21, 22, 26, 28, 29, 32],
      price: 5000,
      amenities: ['AC', 'Snack', 'Wi-Fi', 'USB Plug'],
    },
  ];

  useEffect(() => {
    if (initialTrip) {
      setSelectedTrip(initialTrip);
      setStep('seat');
    } else {
      setSelectedTrip(defaultDepartures[0]);
      setStep('schedule');
    }
    setPaymentResult(null);
    setPaymentError('');
    if (user?.name) setPassengerName(user.name);
    if (user?.email) setPassengerEmail(user.email);
  }, [isOpen, initialTrip, user]);

  if (!isOpen) return null;

  const currentTrip = selectedTrip || defaultDepartures[0];
  const occupiedSet = new Set(currentTrip.occupiedSeats || [2, 5, 8, 12]);

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setStep('seat');
  };

  const handleSeatClick = (seatNumber) => {
    if (occupiedSet.has(seatNumber)) return;
    setSelectedSeat(seatNumber);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setPaymentError('');

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.length < 9) {
        throw new Error(
          lang === 'fr'
            ? 'Numéro de téléphone invalide (au moins 9 chiffres requis, ex: 677949699).'
            : 'Invalid phone number (must be at least 9 digits, e.g. 677949699).'
        );
      }

      if (!passengerName.trim()) {
        throw new Error(
          lang === 'fr'
            ? 'Veuillez saisir le nom complet du passager titulaire.'
            : 'Please enter the full passenger name.'
        );
      }

      const amount = currentTrip.price || 5000;
      const res = await api.collectPayment({
        amount,
        phoneNumber: cleanPhone,
        description: `Global Voyages Ticket ${currentTrip.tripNumber} - Seat ${selectedSeat} - ${passengerName.trim()}`
      });

      const resultPayload = {
        success: true,
        reference: res.reference || `RES-${Date.now().toString().slice(-6)}`,
        externalReference: res.externalReference || `GV-${Date.now()}`,
        operator: res.operator || (paymentMethod === 'OM' ? 'Orange Money' : 'MTN MoMo'),
        ussdCode: res.ussdCode || (paymentMethod === 'OM' ? '#150*50#' : '*126#'),
        phone: cleanPhone,
        passenger: passengerName.trim(),
        cni: passengerCni.trim() || (lang === 'fr' ? 'Vérifié' : 'Verified'),
        email: passengerEmail.trim(),
        seatNumber: selectedSeat,
        trip: currentTrip,
        travelDate,
        amount
      };

      setPaymentResult(resultPayload);
      setStep('success'); // Persistent success screen

      if (onBookingSuccess) {
        onBookingSuccess({
          id: resultPayload.reference,
          tripNumber: currentTrip.tripNumber,
          passenger: passengerName.trim(),
          cni: passengerCni.trim() || (lang === 'fr' ? 'Vérifié' : 'Verified'),
          origin: currentTrip.from || `${fromCity} Akwa`,
          destination: currentTrip.to || `${toCity} Mvan`,
          date: travelDate,
          time: currentTrip.departureTime,
          bus: currentTrip.busModel,
          seat: lang === 'fr' ? `Siège N° ${selectedSeat} (VIP)` : `Seat No. ${selectedSeat} (VIP)`,
          price: amount,
          status: 'PAID'
        });
      }

    } catch (err) {
      setPaymentError(err.message || (lang === "fr" ? "Échec d'initiation du paiement. Vérifiez le numéro." : "Payment initiation failed. Check your phone number."));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownloadTicket = () => {
    if (!paymentResult) return;
    const passName = paymentResult.passenger || passengerName || 'Deborah Nakamura';
    const isEn = lang === 'en';

    const ticketHtml = `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'fr'}">
<head>
  <meta charset="UTF-8">
  <title>${isEn ? 'Boarding Pass - Global Voyages' : 'Billet de Transport - Global Voyages'} - ${paymentResult.reference}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 24px; background: #f1f5f9; color: #0f172a; }
    .ticket-card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; }
    .header { background: #0B1E36; color: #ffffff; padding: 24px 30px; border-bottom: 4px solid #1d4ed8; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 20px; font-weight: 900; letter-spacing: 0.5px; }
    .logo span { color: #38bdf8; }
    .badge { background: #1d4ed8; color: #ffffff; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .body { padding: 30px; }
    .route-banner { display: flex; justify-content: space-between; align-items: center; background: #eff6ff; padding: 18px 22px; border-radius: 12px; border: 1px solid #bfdbfe; margin-bottom: 24px; }
    .station h3 { margin: 0; font-size: 18px; font-weight: 800; color: #1e3a8a; }
    .station p { margin: 3px 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; }
    .arrow { font-size: 24px; color: #1d4ed8; font-weight: bold; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .item { padding: 12px 16px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
    .item-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .item-val { font-size: 15px; font-weight: 800; color: #0f172a; }
    .seat-val { color: #1d4ed8; font-size: 17px; }
    .barcode-section { border-top: 2px dashed #cbd5e1; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
    .barcode { font-family: monospace; letter-spacing: 5px; font-size: 18px; font-weight: bold; color: #334155; }
    .footer { background: #f8fafc; padding: 16px 30px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; }
    @media print { body { background: none; padding: 0; } .ticket-card { box-shadow: none; border: 1px solid #000; } }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <div class="logo">GLOBAL <span>VOYAGES</span> VIP</div>
      <div class="badge">${isEn ? 'CONFIRMED & VALIDATED TICKET' : 'TITRE CONFIRMÉ & VALIDÉ'}</div>
    </div>
    <div class="body">
      <div class="route-banner">
        <div class="station">
          <p>${isEn ? 'Departure Station' : 'Gare de Départ'}</p>
          <h3>${currentTrip.from || fromCity}</h3>
        </div>
        <div class="arrow">➔</div>
        <div class="station" style="text-align: right;">
          <p>${isEn ? 'Arrival Station' : 'Gare de Destination'}</p>
          <h3>${currentTrip.to || toCity}</h3>
        </div>
      </div>
      <div class="grid">
        <div class="item">
          <div class="item-label">${isEn ? 'Full Passenger Name' : 'Nom du Voyageur / Passager'}</div>
          <div class="item-val">${passName}</div>
        </div>
        <div class="item">
          <div class="item-label">${isEn ? 'Reserved Seat' : 'Siège Réservé'}</div>
          <div class="item-val seat-val">${isEn ? `Seat No. ${paymentResult.seatNumber} (VIP)` : `Siège N° ${paymentResult.seatNumber} (VIP)`}</div>
        </div>
        <div class="item">
          <div class="item-label">${isEn ? 'Departure Date & Time' : 'Date & Heure de Départ'}</div>
          <div class="item-val">${paymentResult.travelDate} • ${currentTrip.departureTime}</div>
        </div>
        <div class="item">
          <div class="item-label">${isEn ? 'Coach & Fleet' : 'Autocar & Ligne'}</div>
          <div class="item-val">${currentTrip.tripNumber} (${currentTrip.busModel})</div>
        </div>
        <div class="item">
          <div class="item-label">${isEn ? 'Booking Reference' : 'Référence Réservation'}</div>
          <div class="item-val" style="font-family: monospace;">${paymentResult.reference}</div>
        </div>
        <div class="item">
          <div class="item-label">${isEn ? 'Fare Paid (CamPay)' : 'Tarif Acquitté (CamPay)'}</div>
          <div class="item-val" style="color: #059669;">${paymentResult.amount?.toLocaleString()} ${isEn ? 'XAF (PAID)' : 'FCFA (PAYÉ)'}</div>
        </div>
      </div>
      <div class="barcode-section">
        <div>
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
            ${isEn ? 'Gate Boarding Control Code' : 'Code de Contrôle Quai'}
          </div>
          <div class="barcode">*${paymentResult.reference}-${paymentResult.seatNumber}*</div>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; padding: 6px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #065f46; font-size: 11px; font-weight: bold;">
            ✓ ${isEn ? 'Validated CamPay MoMo' : 'Validé CamPay MoMo'} (${paymentResult.phone})
          </span>
        </div>
      </div>
    </div>
    <div class="footer">
      <span>${isEn ? 'Please present this electronic boarding pass along with your ID at the gate.' : 'Présentez ce billet électronique à l\'embarquement avec votre pièce d\'identité.'}</span>
      <span>Global Voyages Cameroon • VIP Intercity Express</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([ticketHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ticket_GlobalVoyages_${paymentResult.reference}_Seat_${paymentResult.seatNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyUSSD = () => {
    if (paymentResult?.ussdCode) {
      navigator.clipboard.writeText(paymentResult.ussdCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Helper for Seat Label
  const getSeatLabel = (num) => {
    const isWindow = [1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25, 28, 29, 32].includes(num);
    return isWindow 
      ? (lang === 'fr' ? `Siège ${num} (Fenêtre VIP)` : `Seat ${num} (Window VIP)`)
      : (lang === 'fr' ? `Siège ${num} (Couloir VIP)` : `Seat ${num} (Aisle VIP)`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-300 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#0B1E36] text-white px-6 py-4 flex items-center justify-between border-b-2 border-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Bus size={20} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">
                {step === 'schedule' && t('booking.stepSchedule', '1. Horaires & Disponibilités')}
                {step === 'seat' && t('booking.stepSeat', '2. Plan du Bus & Choix du Siège')}
                {step === 'payment' && t('booking.stepPayment', '3. Paiement Sécurisé Mobile Money')}
                {step === 'success' && t('booking.stepSuccess', '✓ Titre de Transport Émis')}
              </h3>
              <p className="text-[11px] text-blue-200">
                {currentTrip.from || fromCity} ➔ {currentTrip.to || toCity} • {travelDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={lang === 'fr' ? "Fermer" : "Close"}
          >
            <X size={20} />
          </button>
        </div>

        {/* Multi-step progress indicator */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-500">
          <span className={`flex items-center gap-1.5 ${step === 'schedule' ? 'text-blue-700 font-black' : step !== 'schedule' ? 'text-emerald-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'schedule' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>1</span>
            {t('booking.step1', 'Horaires')}
          </span>
          <ChevronRight size={14} className="text-slate-300" />
          <span className={`flex items-center gap-1.5 ${step === 'seat' ? 'text-blue-700 font-black' : ['payment', 'success'].includes(step) ? 'text-emerald-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'seat' ? 'bg-blue-600 text-white' : ['payment', 'success'].includes(step) ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>2</span>
            {t('booking.step2', 'Choix du Siège')}
          </span>
          <ChevronRight size={14} className="text-slate-300" />
          <span className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-blue-700 font-black' : step === 'success' ? 'text-emerald-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'payment' ? 'bg-blue-600 text-white' : step === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>3</span>
            {t('booking.step3', 'Paiement')}
          </span>
          <ChevronRight size={14} className="text-slate-300" />
          <span className={`flex items-center gap-1.5 ${step === 'success' ? 'text-emerald-700 font-black' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>4</span>
            {t('booking.step4', 'Billet')}
          </span>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* ================= STEP 1: SCHEDULE & AVAILABILITY ================= */}
          {step === 'schedule' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Route & Date Selector */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {t('booking.origin', 'Gare de Départ')}
                  </label>
                  <select
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900"
                  >
                    <option value="Douala">Douala (Akwa)</option>
                    <option value="Yaoundé">Yaoundé (Mvan)</option>
                    <option value="Bafoussam">Bafoussam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {t('booking.destination', 'Gare d\'Arrivée')}
                  </label>
                  <select
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900"
                  >
                    <option value="Yaoundé">Yaoundé (Mvan)</option>
                    <option value="Douala">Douala (Akwa)</option>
                    <option value="Bafoussam">Bafoussam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {t('booking.date', 'Date de Voyage')}
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Departures List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                    {t('booking.availableDepartures', 'Départs disponibles ce jour :')}
                  </h4>
                  <span className="text-slate-500 font-medium">
                    {defaultDepartures.length} {t('booking.scheduledTrips', 'voyages programmés')}
                  </span>
                </div>

                {defaultDepartures.map((dep) => (
                  <div
                    key={dep.id}
                    onClick={() => handleSelectTrip(dep)}
                    className="p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-600 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {dep.tripNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {dep.busModel}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-bold text-slate-900">
                          <Clock size={14} className="text-blue-600" />
                          <span>{dep.departureTime}</span>
                        </div>
                        <span>➔</span>
                        <span>{dep.arrivalTime} ({dep.duration})</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Users size={13} className="text-emerald-600" />
                        <span className="font-semibold text-emerald-700">
                          {dep.availableSeats} {t('booking.seatsAvailable', 'places disponibles')}
                        </span>
                        <span>•</span>
                        <span>{dep.amenities.join(' • ')}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <span className="text-lg font-black text-blue-900">{dep.price.toLocaleString()} FCFA</span>
                      <button
                        type="button"
                        onClick={() => handleSelectTrip(dep)}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 group-hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        {t('booking.selectDeparture', 'Choisir ce départ')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 2: INTERACTIVE BUS SEAT MAP ================= */}
          {step === 'seat' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Selected Trip Quick Banner */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-blue-950 flex items-center gap-2">
                    <span>{currentTrip.tripNumber}</span>
                    <span>•</span>
                    <span>{currentTrip.departureTime} ({currentTrip.from || fromCity} ➔ {currentTrip.to || toCity})</span>
                  </div>
                  <span className="text-blue-700 text-[11px]">
                    {currentTrip.busModel} • {t('booking.fare', 'Tarif :')} {currentTrip.price?.toLocaleString()} FCFA
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('schedule')}
                  className="px-2.5 py-1 bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-md font-bold text-[11px] transition cursor-pointer"
                >
                  {t('booking.changeDeparture', 'Changer départ')}
                </button>
              </div>

              {/* Seat Legend */}
              <div className="flex items-center justify-center gap-6 py-2 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white" />
                  <span className="text-slate-600">{t('booking.available', 'Libre')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    <Check size={12} />
                  </div>
                  <span className="text-blue-700 font-bold">{t('booking.selected', 'Sélectionné')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-slate-300 text-slate-500 flex items-center justify-center text-[10px] cursor-not-allowed">
                    ✕
                  </div>
                  <span className="text-slate-400">{t('booking.occupied', 'Occupé')}</span>
                </div>
              </div>

              {/* Bus Exterior & Seating Grid */}
              <div className="relative max-w-sm mx-auto p-6 bg-slate-100 border-2 border-slate-300 rounded-3xl shadow-inner">
                {/* Driver Cockpit Front */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b-2 border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 bg-slate-200 px-3 py-1 rounded-md text-slate-700">
                    <span className="text-base">🛞</span>
                    <span>{t('booking.driverCabin', 'Poste Chauffeur')}</span>
                  </div>
                  <div className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded">
                    {t('booking.door', 'Porte d\'accès')}
                  </div>
                </div>

                {/* 32 Seats (8 Rows x 4 Columns with central aisle) */}
                <div className="space-y-2.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((rowIdx) => {
                    const seatA = (rowIdx - 1) * 4 + 1;
                    const seatB = (rowIdx - 1) * 4 + 2;
                    const seatC = (rowIdx - 1) * 4 + 3;
                    const seatD = (rowIdx - 1) * 4 + 4;

                    const renderSeat = (num) => {
                      const isOccupied = occupiedSet.has(num);
                      const isSelected = selectedSeat === num;

                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => handleSeatClick(num)}
                          title={isOccupied ? (lang === 'fr' ? 'Siège déjà réservé' : 'Seat already reserved') : getSeatLabel(num)}
                          className={`w-10 h-10 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center relative cursor-pointer ${
                            isOccupied
                              ? 'bg-slate-300 text-slate-500 border border-slate-400 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-600 text-white border-2 border-blue-700 shadow-md ring-2 ring-blue-300 transform scale-105'
                              : 'bg-white hover:bg-blue-50 text-slate-800 border-2 border-slate-300 hover:border-blue-500 shadow-2xs'
                          }`}
                        >
                          <span className="text-[11px] leading-none">{num}</span>
                          {isSelected && <Check size={10} className="absolute bottom-1" />}
                        </button>
                      );
                    };

                    return (
                      <div key={rowIdx} className="flex items-center justify-between">
                        {/* Left Side (Window & Aisle) */}
                        <div className="flex gap-2">
                          {renderSeat(seatA)}
                          {renderSeat(seatB)}
                        </div>

                        {/* Central Walk Aisle */}
                        <div className="w-8 text-center text-[10px] text-slate-400 font-mono select-none">
                          R{rowIdx}
                        </div>

                        {/* Right Side (Aisle & Window) */}
                        <div className="flex gap-2">
                          {renderSeat(seatC)}
                          {renderSeat(seatD)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Back of bus */}
                <div className="pt-4 mt-4 border-t-2 border-slate-200 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {t('booking.busRear', 'Arrière du Car VIP')}
                </div>
              </div>

              {/* Chosen Seat Summary & Next Button */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                    {t('booking.yourSelection', 'Votre sélection :')}
                  </span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {getSeatLabel(selectedSeat)}
                  </div>
                  <span className="text-xs text-slate-600">
                    {t('booking.firstClassFare', 'Tarif unique première classe :')} <strong>{currentTrip.price?.toLocaleString()} FCFA</strong>
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setStep('schedule')}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
                  >
                    {t('booking.back', 'Retour')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{t('booking.continuePayment', 'Continuer vers le Paiement')}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PASSENGER DETAILS & CAMPAY PAYMENT ================= */}
          {step === 'payment' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Order Recap */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-900">
                  <span>{currentTrip.tripNumber} ({currentTrip.from || fromCity} ➔ {currentTrip.to || toCity})</span>
                  <span className="text-blue-700 text-sm font-black">{currentTrip.price?.toLocaleString()} FCFA</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>Date : <strong className="text-slate-800">{travelDate}</strong></div>
                  <div>{lang === 'fr' ? 'Départ :' : 'Departure:'} <strong className="text-slate-800">{currentTrip.departureTime}</strong></div>
                  <div>{lang === 'fr' ? 'Siège réservé :' : 'Reserved Seat:'} <strong className="text-blue-800">{getSeatLabel(selectedSeat)}</strong></div>
                  <div>{lang === 'fr' ? 'Autocar :' : 'Coach:'} <strong className="text-slate-800">{currentTrip.busModel}</strong></div>
                </div>
              </div>

              {/* Payment Form */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* Passenger Reservation Details Inputs */}
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <User size={15} className="text-blue-700" />
                    <span>{t('booking.passengerDetails', 'Informations Réservation & Passager')}</span>
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('booking.passengerName', 'Nom & Prénom du Voyageur')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder={t('booking.passengerNamePlaceholder', 'ex: Deborah Nakamura')}
                      className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('booking.cniLabel', 'Numéro CNI / Passeport')}
                      </label>
                      <input
                        type="text"
                        value={passengerCni}
                        onChange={(e) => setPassengerCni(e.target.value)}
                        placeholder={t('booking.cniPlaceholder', 'ex: 110293847')}
                        className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t('booking.emailLabel', 'Email (Billet PDF)')}
                      </label>
                      <input
                        type="email"
                        value={passengerEmail}
                        onChange={(e) => setPassengerEmail(e.target.value)}
                        placeholder={t('booking.emailPlaceholder', 'ex: deborah@example.com')}
                        className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Operator Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    {t('booking.operatorLabel', 'Choisissez votre Opérateur Mobile Money')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MTN')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'MTN'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-900 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone size={24} className="text-yellow-600" />
                      <span className="text-xs">MTN MoMo (*126#)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('OM')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-1.5 transition cursor-pointer ${
                        paymentMethod === 'OM'
                          ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone size={24} className="text-orange-600" />
                      <span className="text-xs">Orange Money (#150#)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {t('booking.phoneLabel', 'Numéro de Téléphone Mobile Money')}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="677949699"
                      className="w-full p-3 rounded-xl bg-white border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {t('booking.phoneHint', "Entrez vos 9 chiffres (ex: 677 94 96 99). L'indicatif +237 est géré automatiquement.")}
                  </span>
                </div>

                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('seat')}
                    className="flex-1 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    {t('booking.changeSeat', 'Modifier le Siège')}
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="flex-2 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {paymentLoading ? <RotateCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    <span>
                      {paymentLoading
                        ? t('booking.sendingPush', 'Envoi de la demande CamPay...')
                        : `${t('booking.confirmAndPay', 'Valider & Payer')} ${currentTrip.price?.toLocaleString()} FCFA`}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= STEP 4: PERSISTENT CONFIRMATION & USSD SCREEN ================= */}
          {step === 'success' && paymentResult && (
            <div className="space-y-6 animate-fadeIn py-2">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs border-2 border-emerald-300">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">
                  {t('booking.pushSent', 'Demande de Paiement Transmise !')}
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {t('booking.pushDesc', 'Un message push a été envoyé sur votre téléphone. Veuillez valider le débit avec votre code PIN secret.')}
                </p>
              </div>

              {/* Action Box to Dial USSD */}
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-600" />
                    {t('booking.actionRequired', 'Action requise sur votre mobile :')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono text-[10px] font-bold">
                    {paymentResult.operator}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">
                  {t('booking.ussdHint', "Si vous n'avez pas reçu de popup automatique, composez directement le code USSD ci-dessous pour confirmer :")}
                </p>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-200">
                  <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                    {paymentResult.ussdCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUSSD}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>{copiedCode ? t('booking.copied', 'Copié !') : t('booking.copy', 'Copier')}</span>
                  </button>
                </div>
              </div>

              {/* Digital Boarding Pass / Ticket Card */}
              <div className="p-5 bg-white border-2 border-blue-200 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white font-mono text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  {t('booking.ticketReserved', 'Billet Réservé')}
                </div>

                <div className="flex items-center gap-2">
                  <Ticket size={20} className="text-blue-700" />
                  <span className="font-black text-base text-slate-900">
                    {currentTrip.from || fromCity} ➔ {currentTrip.to || toCity}
                  </span>
                </div>

                {/* Passenger Name Display */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      {t('booking.passengerReservation', 'Passager Titulaire (Réservation)')}
                    </span>
                    <strong className="text-blue-950 font-black text-sm">
                      {paymentResult.passenger || passengerName || 'Deborah Nakamura'}
                    </strong>
                  </div>
                  {paymentResult.cni && paymentResult.cni !== 'Vérifié' && paymentResult.cni !== 'Verified' && (
                    <span className="text-[11px] text-slate-600 font-mono">CNI: {paymentResult.cni}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('booking.trip', 'Voyage')}</span>
                    <strong className="text-slate-900 font-mono">{currentTrip.tripNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('booking.dateTime', 'Date & Heure')}</span>
                    <strong className="text-slate-900">{travelDate} • {currentTrip.departureTime}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('booking.assignedSeat', 'Siège Attribué')}</span>
                    <strong className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      N° {paymentResult.seatNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('booking.amount', 'Montant')}</span>
                    <strong className="text-emerald-700 font-black">{paymentResult.amount?.toLocaleString()} FCFA</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Réf: <strong className="font-mono text-slate-700">{paymentResult.reference}</strong></span>
                  <span>{lang === 'fr' ? 'Tél:' : 'Tel:'} <strong className="font-mono text-slate-700">{paymentResult.phone}</strong></span>
                </div>
              </div>

              {/* Action Buttons: Close when user is ready! */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadTicket}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={15} />
                  <span>{t('booking.downloadTicket', 'Télécharger Billet')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} />
                  <span>{t('booking.print', 'Imprimer')}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check size={16} />
                  <span>{t('booking.done', 'Terminer & Voir Billets')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
