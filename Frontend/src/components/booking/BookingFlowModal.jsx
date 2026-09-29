import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Download,
  User,
  IdCard,
  Mail
} from 'lucide-react';
import { api } from '../../api/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const BookingFlowModal = ({
  isOpen,
  onClose,
  initialTrip = null,
  initialDate = null,
  onBookingSuccess
}) => {
  const { lang, t } = useLanguage();
  const { user } = useAuth();

  // Steps: 'schedule' | 'seat' | 'payment' | 'pending' | 'success'
  const [step, setStep] = useState(initialTrip ? 'seat' : 'schedule');

  // Search / Trip filters
  const [fromCity, setFromCity] = useState('Douala');
  const [toCity, setToCity] = useState('Yaoundé');
  const [travelDate, setTravelDate] = useState(() => initialDate || new Date().toISOString().split('T')[0]);

  // Passenger Reservation Details
  const [passengerName, setPassengerName] = useState(user?.name || 'Deborah Nakamura');
  const [passengerCni, setPassengerCni] = useState('');
  const [passengerEmail, setPassengerEmail] = useState(user?.email || '');

  // Selected Trip & Seat
  const [selectedTrip, setSelectedTrip] = useState(initialTrip);
  const [selectedSeat, setSelectedSeat] = useState(14); // Default VIP seat

  // Dynamic trips from MongoDB
  const [dbTrips, setDbTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('MTN'); // 'MTN' | 'OM'
  const [phoneNumber, setPhoneNumber] = useState('677949699');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Polling ref for pending payment check
  const pollTimerRef = useRef(null);

  // Fetch real trips from MongoDB when modal opens or date changes
  useEffect(() => {
    if (!isOpen) return;

    const loadTrips = async () => {
      setLoadingTrips(true);
      try {
        const trips = await api.getTrips();
        if (trips && trips.length > 0) {
          // Format trips for booking UI
          const formatted = trips.map(t => {
            const depDate = new Date(t.departureScheduled);
            const arrDate = new Date(t.arrivalScheduled);
            const depTimeStr = depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const arrTimeStr = arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return {
              _id: t._id,
              id: t.tripNumber,
              tripNumber: t.tripNumber,
              from: t.routeId?.originStationId?.name || `${t.routeId?.originStationId?.city || 'Douala'} (Gare Centrale)`,
              to: t.routeId?.destinationStationId?.name || `${t.routeId?.destinationStationId?.city || 'Yaoundé'} (Terminal Mvan)`,
              fromCity: t.routeId?.originStationId?.city || 'Douala',
              toCity: t.routeId?.destinationStationId?.city || 'Yaoundé',
              departureTime: depTimeStr,
              arrivalTime: arrTimeStr,
              duration: '3h 30m',
              busModel: t.busNumber || 'Scania VIP First Class #LT-782-AA',
              totalSeats: 32,
              availableSeats: 18,
              occupiedSeats: [2, 3, 7, 8, 11, 15, 19, 23, 24, 27, 30],
              price: 5000,
              amenities: ['AC', 'Leather VIP', 'Wi-Fi 4G', 'USB Plug'],
              status: t.status
            };
          });
          setDbTrips(formatted);
          if (!initialTrip && formatted.length > 0) {
            setSelectedTrip(formatted[0]);
          }
        }
      } catch (err) {
        console.warn('Failed to load trips from MongoDB, using fallback:', err.message);
      } finally {
        setLoadingTrips(false);
      }
    };

    loadTrips();
  }, [isOpen, travelDate]);

  // Reset or setup initial states
  useEffect(() => {
    if (initialTrip) {
      // Map initialTrip to clean object
      const depDate = initialTrip.departureScheduled ? new Date(initialTrip.departureScheduled) : null;
      const formattedTrip = {
        _id: initialTrip._id,
        id: initialTrip.tripNumber || 'GV-1025',
        tripNumber: initialTrip.tripNumber || 'GV-1025',
        from: initialTrip.routeId?.originStationId?.name || `${fromCity} (Gare Centrale)`,
        to: initialTrip.routeId?.destinationStationId?.name || `${toCity} (Terminal Mvan)`,
        fromCity: initialTrip.routeId?.originStationId?.city || fromCity,
        toCity: initialTrip.routeId?.destinationStationId?.city || toCity,
        departureTime: depDate ? depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:30',
        arrivalTime: '10:30',
        duration: '4h 00m',
        busModel: initialTrip.busNumber || 'Scania VIP Express #LT-782-AA',
        totalSeats: 32,
        availableSeats: 16,
        occupiedSeats: [2, 4, 7, 11, 15, 20, 24, 28],
        price: 5000,
        amenities: ['AC', 'Leather VIP', 'Wi-Fi 4G']
      };
      setSelectedTrip(formattedTrip);
      setStep('seat');
    } else {
      setStep('schedule');
    }

    if (initialDate) setTravelDate(initialDate);
    setPaymentResult(null);
    setCreatedBooking(null);
    setPaymentError('');
    if (user?.name) setPassengerName(user.name);
    if (user?.email) setPassengerEmail(user.email);
  }, [isOpen, initialTrip, initialDate, user]);

  // Polling for CamPay payment confirmation during 'pending' step
  useEffect(() => {
    if (step === 'pending' && paymentResult?.reference) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await api.checkPaymentStatus(paymentResult.reference);
          if (res.status === 'SUCCESSFUL') {
            clearInterval(pollTimerRef.current);
            // Confirm booking in DB
            if (createdBooking?._id) {
              await api.confirmBooking(createdBooking._id, { campayReference: paymentResult.reference });
            }
            setPaymentResult(prev => ({ ...prev, status: 'PAID' }));
            setStep('success');
            if (onBookingSuccess) {
              onBookingSuccess({
                id: createdBooking?.bookingReference || paymentResult.reference,
                tripNumber: currentTrip.tripNumber,
                passenger: passengerName.trim(),
                origin: currentTrip.from,
                destination: currentTrip.to,
                date: travelDate,
                time: currentTrip.departureTime,
                bus: currentTrip.busModel,
                seat: getSeatLabel(selectedSeat),
                price: currentTrip.price || 5000,
                status: 'PAID'
              });
            }
          }
        } catch (e) {
          // ignore polling check errors
        }
      }, 3500);

      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      };
    }
  }, [step, paymentResult, createdBooking]);

  if (!isOpen) return null;

  // Fallback departure if dbTrips is empty
  const fallbackTrip = {
    id: 'GV-1025',
    tripNumber: 'GV-1025',
    from: `${fromCity} (Gare Centrale Akwa)`,
    to: `${toCity} (Terminal Mvan)`,
    fromCity,
    toCity,
    departureTime: '06:30',
    arrivalTime: '10:30',
    duration: '4h 00m',
    busModel: 'Scania VIP First Class #LT-782-AA',
    totalSeats: 32,
    availableSeats: 14,
    occupiedSeats: [2, 3, 7, 8, 11, 15, 18, 19, 23, 24, 27, 30, 31],
    price: 5000,
    amenities: ['AC', 'Leather VIP', 'Wi-Fi 4G', 'USB Plug'],
  };

  const currentTrip = selectedTrip || (dbTrips.length > 0 ? dbTrips[0] : fallbackTrip);
  const occupiedSet = new Set(currentTrip.occupiedSeats || [2, 5, 8, 12, 19]);

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setStep('seat');
  };

  const handleSeatClick = (seatNumber) => {
    if (occupiedSet.has(seatNumber)) return;
    setSelectedSeat(seatNumber);
  };

  // Helper for Seat Label
  const getSeatLabel = (num) => {
    const isWindow = [1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25, 28, 29, 32].includes(num);
    return isWindow 
      ? (lang === 'fr' ? `Siège ${num} (Fenêtre VIP)` : `Seat ${num} (Window VIP)`)
      : (lang === 'fr' ? `Siège ${num} (Couloir VIP)` : `Seat ${num} (Aisle VIP)`);
  };

  // Step 3: Initiate Payment with CamPay & Save Booking to MongoDB
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

      // 1. Create persistent booking in MongoDB with PENDING status
      const bookingData = {
        tripId: currentTrip._id || null,
        tripNumber: currentTrip.tripNumber || 'GV-1025',
        busModel: currentTrip.busModel || 'Scania VIP First Class',
        passengerName: passengerName.trim(),
        passengerIdNumber: passengerCni.trim() || '',
        passengerEmail: passengerEmail.trim() || '',
        passengerPhone: cleanPhone,
        origin: currentTrip.from || `${fromCity} Akwa`,
        destination: currentTrip.to || `${toCity} Mvan`,
        travelDate,
        departureTime: currentTrip.departureTime || '06:30',
        seatNumber: selectedSeat,
        seatLabel: getSeatLabel(selectedSeat),
        amount,
        paymentMethod: paymentMethod === 'OM' ? 'ORANGE_MONEY' : 'MTN_MOMO',
        paymentStatus: 'PENDING'
      };

      const newBooking = await api.createBooking(bookingData);
      setCreatedBooking(newBooking);

      // 2. Call CamPay collect endpoint
      const collectRes = await api.collectPayment({
        amount,
        phoneNumber: cleanPhone,
        bookingReference: newBooking.bookingReference,
        description: `Global Voyages Bus Ticket ${currentTrip.tripNumber} - Seat ${selectedSeat} - ${passengerName.trim()}`
      });

      const resultPayload = {
        bookingId: newBooking._id,
        bookingReference: newBooking.bookingReference,
        reference: collectRes.reference || newBooking.bookingReference,
        externalReference: collectRes.externalReference || newBooking.bookingReference,
        operator: collectRes.operator || (paymentMethod === 'OM' ? 'Orange Money' : 'MTN MoMo'),
        ussdCode: collectRes.ussdCode || (paymentMethod === 'OM' ? '#150*50#' : '*126#'),
        phone: cleanPhone,
        passenger: passengerName.trim(),
        cni: passengerCni.trim() || (lang === 'fr' ? 'Vérifié' : 'Verified'),
        email: passengerEmail.trim(),
        seatNumber: selectedSeat,
        seatLabel: getSeatLabel(selectedSeat),
        trip: currentTrip,
        travelDate,
        departureTime: currentTrip.departureTime || '06:30',
        amount,
        status: 'PENDING'
      };

      setPaymentResult(resultPayload);
      setStep('pending'); // Move to USSD approval screen (TICKET NOT ACCESSIBLE YET)

    } catch (err) {
      setPaymentError(err.message || (lang === "fr" ? "Échec d'initiation du paiement. Vérifiez le numéro." : "Payment initiation failed. Check your phone number."));
    } finally {
      setPaymentLoading(false);
    }
  };

  // Manual Check Payment Status
  const handleCheckStatus = async () => {
    if (!paymentResult?.reference) return;
    setCheckingStatus(true);
    try {
      const res = await api.checkPaymentStatus(paymentResult.reference);
      if (res.status === 'SUCCESSFUL') {
        if (createdBooking?._id) {
          await api.confirmBooking(createdBooking._id, { campayReference: paymentResult.reference });
        }
        setPaymentResult(prev => ({ ...prev, status: 'PAID' }));
        setStep('success');
        if (onBookingSuccess) {
          onBookingSuccess({
            id: createdBooking?.bookingReference || paymentResult.reference,
            tripNumber: currentTrip.tripNumber,
            passenger: passengerName.trim(),
            origin: currentTrip.from,
            destination: currentTrip.to,
            date: travelDate,
            time: currentTrip.departureTime,
            bus: currentTrip.busModel,
            seat: getSeatLabel(selectedSeat),
            price: currentTrip.price || 5000,
            status: 'PAID'
          });
        }
      } else {
        setPaymentError(lang === 'fr' ? 'Paiement toujours en attente sur votre téléphone. Composez le code USSD ci-dessous pour confirmer.' : 'Payment still pending on your phone. Please dial the USSD code below to confirm.');
      }
    } catch (err) {
      setPaymentError(err.message || 'Erreur lors de la vérification.');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Instant Validation for Test/Demo mode
  const handleConfirmTestPayment = async () => {
    setCheckingStatus(true);
    try {
      const bookingRef = createdBooking?.bookingReference || paymentResult?.bookingReference;
      const res = await api.confirmDemoPayment({
        bookingReference: bookingRef,
        reference: paymentResult?.reference
      });

      if (res.success || res.status === 'SUCCESSFUL') {
        setPaymentResult(prev => ({ ...prev, status: 'PAID' }));
        setStep('success');
        if (onBookingSuccess) {
          onBookingSuccess({
            id: bookingRef,
            tripNumber: currentTrip.tripNumber,
            passenger: passengerName.trim(),
            cni: passengerCni.trim() || (lang === 'fr' ? 'Vérifié' : 'Verified'),
            origin: currentTrip.from,
            destination: currentTrip.to,
            date: travelDate,
            time: currentTrip.departureTime,
            bus: currentTrip.busModel,
            seat: getSeatLabel(selectedSeat),
            price: currentTrip.price || 5000,
            status: 'PAID'
          });
        }
      }
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Download official boarding pass HTML (ONLY WHEN PAID!)
  const handleDownloadTicket = () => {
    if (!paymentResult || paymentResult.status !== 'PAID') return;
    const passName = paymentResult.passenger || passengerName || 'Deborah Nakamura';
    const isEn = lang === 'en';
    const refCode = createdBooking?.bookingReference || paymentResult.bookingReference || paymentResult.reference;

    const ticketHtml = `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'fr'}">
<head>
  <meta charset="UTF-8">
  <title>${isEn ? 'Boarding Pass - Global Voyages' : 'Billet de Transport - Global Voyages'} - ${refCode}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 24px; background: #f1f5f9; color: #0f172a; }
    .ticket-card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; }
    .header { background: #0B1E36; color: #ffffff; padding: 24px 30px; border-bottom: 4px solid #1d4ed8; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 20px; font-weight: 900; letter-spacing: 0.5px; }
    .logo span { color: #38bdf8; }
    .badge { background: #059669; color: #ffffff; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
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
          <div class="item-label">${isEn ? 'Booking Reference (MongoDB)' : 'Référence Réservation (MongoDB)'}</div>
          <div class="item-val" style="font-family: monospace;">${refCode}</div>
        </div>
        <div class="item">
          <div class="item-label">${isEn ? 'Fare Paid (CamPay MoMo)' : 'Tarif Acquitté (CamPay MoMo)'}</div>
          <div class="item-val" style="color: #059669;">${paymentResult.amount?.toLocaleString()} ${isEn ? 'XAF (PAID)' : 'FCFA (PAYÉ)'}</div>
        </div>
      </div>
      <div class="barcode-section">
        <div>
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
            ${isEn ? 'Gate Boarding Control Code' : 'Code de Contrôle Quai'}
          </div>
          <div class="barcode">*${refCode}-${paymentResult.seatNumber}*</div>
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
    link.download = `Ticket_GlobalVoyages_${refCode}_Seat_${paymentResult.seatNumber}.html`;
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
                {step === 'schedule' && t('booking.stepSchedule', '1. Horaires & Départs au Calendrier')}
                {step === 'seat' && t('booking.stepSeat', '2. Plan du Bus & Choix du Siège')}
                {step === 'payment' && t('booking.stepPayment', '3. Coordonnées & Paiement CamPay')}
                {step === 'pending' && (lang === 'fr' ? '4. En Attente de Validation Mobile' : '4. Awaiting Mobile PIN Approval')}
                {step === 'success' && t('booking.stepSuccess', '✓ Titre de Transport Émis')}
              </h3>
              <p className="text-[11px] text-blue-200">
                {currentTrip.fromCity || fromCity} ➔ {currentTrip.toCity || toCity} • {travelDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">

          {/* ================= STEP 1: SCHEDULE & REAL TRIPS ================= */}
          {step === 'schedule' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Dynamic Date & City selector */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      {t('book.origin', 'Ville Départ')}
                    </label>
                    <select
                      value={fromCity}
                      onChange={(e) => setFromCity(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Douala">Douala (Akwa)</option>
                      <option value="Yaoundé">Yaoundé (Mvan)</option>
                      <option value="Bafoussam">Bafoussam</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      {t('book.destination', 'Destination')}
                    </label>
                    <select
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Yaoundé">Yaoundé (Mvan)</option>
                      <option value="Douala">Douala (Akwa)</option>
                      <option value="Bafoussam">Bafoussam</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      {lang === 'fr' ? 'Date de Voyage Réelle' : 'Actual Travel Date'}
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Quick Date Pills */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="text-[11px] text-slate-500 font-bold">{lang === 'fr' ? 'Raccourcis :' : 'Quick pick:'}</span>
                  <button
                    type="button"
                    onClick={() => setTravelDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-1 rounded bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-[11px] font-bold transition cursor-pointer"
                  >
                    {lang === 'fr' ? "Aujourd'hui" : 'Today'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      setTravelDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-2.5 py-1 rounded bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-[11px] font-bold transition cursor-pointer"
                  >
                    {lang === 'fr' ? 'Demain' : 'Tomorrow'}
                  </button>
                </div>
              </div>

              {/* Departures List from MongoDB */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {lang === 'fr' ? 'Départs Programmés en Base de Données' : 'Scheduled Departures from Database'}
                  </h4>
                  <span className="text-xs text-blue-700 font-bold">
                    {travelDate}
                  </span>
                </div>

                {loadingTrips ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                    <RotateCw size={16} className="animate-spin text-blue-600" />
                    <span>{lang === 'fr' ? 'Chargement des départs réels...' : 'Loading departures from MongoDB...'}</span>
                  </div>
                ) : (
                  (dbTrips.length > 0 ? dbTrips : [fallbackTrip]).map((trip) => (
                    <div
                      key={trip.id || trip._id}
                      onClick={() => handleSelectTrip(trip)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        selectedTrip?.id === trip.id
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-blue-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          {trip.tripNumber?.slice(-4) || 'VIP'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{trip.tripNumber}</span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">VIP CLASS</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">{trip.busModel}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span className="flex items-center gap-1 font-bold text-slate-800">
                              <Clock size={12} className="text-blue-600" />
                              {trip.departureTime} ➔ {trip.arrivalTime}
                            </span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">{trip.availableSeats} {t('booking.seatsLeft', 'places disponibles')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-base font-black text-slate-900 block">{trip.price?.toLocaleString()} FCFA</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{t('booking.perPassenger', 'par voyageur')}</span>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                        >
                          {t('booking.chooseSeat', 'Choisir Siège')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 2: SEAT SELECTION ================= */}
          {step === 'seat' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('booking.selectedCoach', 'Ligne & Autocar')}</span>
                  <strong className="text-slate-900">{currentTrip.tripNumber} • {currentTrip.busModel}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('booking.dateTime', 'Date & Heure')}</span>
                  <strong className="text-blue-700">{travelDate} • {currentTrip.departureTime}</strong>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-white border-2 border-slate-300" />
                  <span className="text-slate-600">{t('booking.available', 'Disponible')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
                  <span className="text-blue-900 font-bold">{t('booking.selected', 'Sélectionné')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-slate-300 opacity-60" />
                  <span className="text-slate-400">{t('booking.occupied', 'Occupé')}</span>
                </div>
              </div>

              {/* Coach Layout */}
              <div className="max-w-md mx-auto p-5 bg-slate-100 rounded-2xl border-2 border-slate-300 shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-300 text-xs font-bold text-slate-500">
                  <span>🚗 {t('booking.frontDriver', 'Avant du Bus / Chauffeur')}</span>
                  <span>🚪 {t('booking.door', 'Porte VIP')}</span>
                </div>

                <div className="space-y-2">
                  {[...Array(8)].map((_, rowIndex) => {
                    const seatA = rowIndex * 4 + 1;
                    const seatB = rowIndex * 4 + 2;
                    const seatC = rowIndex * 4 + 3;
                    const seatD = rowIndex * 4 + 4;

                    const renderSeat = (num) => {
                      const isOccupied = occupiedSet.has(num);
                      const isSelected = selectedSeat === num;

                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => handleSeatClick(num)}
                          className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                            isOccupied
                              ? 'bg-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2 shadow-sm font-black'
                              : 'bg-white hover:bg-blue-50 text-slate-800 border border-slate-300 hover:border-blue-400'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    };

                    return (
                      <div key={rowIndex} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          {renderSeat(seatA)}
                          {renderSeat(seatB)}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">| |</div>
                        <div className="flex items-center gap-2">
                          {renderSeat(seatC)}
                          {renderSeat(seatD)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selection Summary & Navigation */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('booking.assignedSeat', 'Siège Attribué')}</span>
                  <strong className="text-blue-950 font-black text-sm">{getSeatLabel(selectedSeat)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">{t('booking.totalFare', 'Montant Total')}</span>
                  <strong className="text-emerald-700 font-black text-base">{currentTrip.price?.toLocaleString()} FCFA</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('schedule')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>{t('booking.back', 'Retour')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <span>{t('booking.continuePassenger', 'Coordonnées & Paiement')}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PASSENGER DETAILS & CAMPAY FORM ================= */}
          {step === 'payment' && (
            <div className="space-y-5 animate-fadeIn">
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* Passenger Info Inputs */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={15} className="text-blue-700" />
                    <span>{t('booking.passengerTitle', 'Informations du Passager Titulaire')}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {t('booking.fullName', 'Nom et Prénom')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                        placeholder="Ex: Deborah Nakamura"
                        className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {t('booking.idNumber', 'N° CNI ou Passeport')}
                      </label>
                      <input
                        type="text"
                        value={passengerCni}
                        onChange={(e) => setPassengerCni(e.target.value)}
                        placeholder="Ex: 110293849"
                        className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {t('booking.email', 'Adresse Email (Optionnel)')}
                    </label>
                    <input
                      type="email"
                      value={passengerEmail}
                      onChange={(e) => setPassengerEmail(e.target.value)}
                      placeholder="Ex: debora@globalvoyage.com"
                      className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Operator Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-2">
                    {t('booking.chooseOperator', 'Sélectionnez votre Opérateur Mobile Money')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MTN')}
                      className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 font-bold text-xs transition cursor-pointer ${
                        paymentMethod === 'MTN'
                          ? 'border-amber-500 bg-amber-50/80 text-amber-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-amber-600 flex items-center justify-center">
                        {paymentMethod === 'MTN' && <div className="w-2 h-2 rounded-full bg-amber-600" />}
                      </div>
                      <span>MTN Mobile Money (*126#)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('OM')}
                      className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 font-bold text-xs transition cursor-pointer ${
                        paymentMethod === 'OM'
                          ? 'border-orange-500 bg-orange-50/80 text-orange-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-orange-600 flex items-center justify-center">
                        {paymentMethod === 'OM' && <div className="w-2 h-2 rounded-full bg-orange-600" />}
                      </div>
                      <span>Orange Money (#150*50#)</span>
                    </button>
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    {t('booking.phoneLabel', 'Numéro de Téléphone Mobile Money (Cameroun)')}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="677949699"
                      className="w-full p-3 rounded-xl bg-white border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('seat')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    <span>{t('booking.back', 'Retour')}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {paymentLoading ? (
                      <RotateCw size={16} className="animate-spin" />
                    ) : (
                      <Smartphone size={16} />
                    )}
                    <span>
                      {paymentLoading
                        ? (lang === 'fr' ? 'Connexion CamPay...' : 'Connecting CamPay...')
                        : (lang === 'fr' ? `Payer ${currentTrip.price?.toLocaleString()} FCFA avec CamPay` : `Pay ${currentTrip.price?.toLocaleString()} XAF with CamPay`)}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= STEP 4: PENDING USSD VALIDATION (NO TICKET DOWNLOAD YET) ================= */}
          {step === 'pending' && paymentResult && (
            <div className="space-y-6 animate-fadeIn py-3">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs border-2 border-amber-300 animate-pulse">
                  <RotateCw size={32} className="animate-spin" />
                </div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">
                  {lang === 'fr' ? 'Demande de Débit Transmise à CamPay !' : 'Debit Request Transmitted to CamPay!'}
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {lang === 'fr'
                    ? 'Un prompt push a été envoyé sur votre téléphone. Veuillez valider avec votre code PIN secret.'
                    : 'A push prompt was sent to your phone. Please authorize with your secret PIN.'}
                </p>
              </div>

              {/* Action Box to Dial USSD */}
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-600" />
                    {lang === 'fr' ? 'Code USSD de validation opérateur :' : 'Operator USSD Validation Code:'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-mono text-[10px] font-bold">
                    {paymentResult.operator}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">
                  {lang === 'fr'
                    ? "Si le popup ne s'affiche pas automatiquement sur votre écran, composez immédiatement ce code USSD pour approuver le débit :"
                    : 'If the popup does not appear automatically on your screen, dial this USSD code immediately to authorize:'}
                </p>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200">
                  <span className="font-mono text-lg font-black text-slate-900 tracking-wider">
                    {paymentResult.ussdCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUSSD}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>{copiedCode ? (lang === 'fr' ? 'Copié !' : 'Copied!') : (lang === 'fr' ? 'Copier' : 'Copy')}</span>
                  </button>
                </div>
              </div>

              {/* Warning: Ticket blocked until payment confirmed */}
              <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl text-center text-xs text-slate-600">
                <p className="font-semibold">
                  ⏳ {lang === 'fr'
                    ? 'Le billet officiel ne peut être imprimé ou téléchargé qu’une fois le débit confirmé par votre opérateur.'
                    : 'The official ticket cannot be printed or downloaded until the charge is confirmed by your operator.'}
                </p>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Réf: <strong className="font-mono">{paymentResult.bookingReference || paymentResult.reference}</strong> • {paymentResult.phone}
                </span>
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Buttons during pending */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={checkingStatus}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCw size={15} className={checkingStatus ? 'animate-spin' : ''} />
                  <span>{lang === 'fr' ? 'Vérifier le Statut du Paiement' : 'Check Payment Status'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmTestPayment}
                  disabled={checkingStatus}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Valider immédiatement pour démonstration"
                >
                  <Check size={15} />
                  <span>{lang === 'fr' ? "J'ai validé sur mon mobile" : 'I Confirmed on My Phone'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: CONFIRMED PAYMENT & OFFICIAL TICKET ================= */}
          {step === 'success' && paymentResult && (
            <div className="space-y-6 animate-fadeIn py-2">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs border-2 border-emerald-300">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">
                  {lang === 'fr' ? 'Paiement Confirmé & Billet Validé !' : 'Payment Confirmed & Ticket Issued!'}
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {lang === 'fr'
                    ? 'Votre réservation est définitivement enregistrée dans notre base de données MongoDB. Bon voyage avec Global Voyages !'
                    : 'Your booking has been permanently recorded in our MongoDB database. Have a safe journey with Global Voyages!'}
                </p>
              </div>

              {/* Digital Boarding Pass / Ticket Card (ONLY VISIBLE ON CONFIRMED PAYMENT) */}
              <div className="p-5 bg-white border-2 border-emerald-300 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white font-mono text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  ✓ {lang === 'fr' ? 'Billet Validé & Payé' : 'Confirmed & Paid'}
                </div>

                <div className="flex items-center gap-2">
                  <Ticket size={20} className="text-blue-700" />
                  <span className="font-black text-base text-slate-900">
                    {currentTrip.from || fromCity} ➔ {currentTrip.to || toCity}
                  </span>
                </div>

                {/* Passenger Name Display */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      {t('booking.passengerReservation', 'Passager Titulaire (Réservation)')}
                    </span>
                    <strong className="text-slate-950 font-black text-sm">
                      {paymentResult.passenger || passengerName}
                    </strong>
                  </div>
                  {paymentResult.cni && paymentResult.cni !== 'Vérifié' && (
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
                  <span>Réf MongoDB: <strong className="font-mono text-slate-900">{createdBooking?.bookingReference || paymentResult.bookingReference || paymentResult.reference}</strong></span>
                  <span>{lang === 'fr' ? 'Tél:' : 'Tel:'} <strong className="font-mono text-slate-700">{paymentResult.phone}</strong></span>
                </div>
              </div>

              {/* Action Buttons: Download Ticket or Finish (PRINT BUTTON HAS BEEN REMOVED) */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadTicket}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={15} />
                  <span>{lang === 'fr' ? 'Télécharger Billet (HTML / PDF)' : 'Download Boarding Pass'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-[#0B1E36] hover:bg-blue-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check size={16} />
                  <span>{lang === 'fr' ? 'Terminer & Voir mes Billets' : 'Finish & View My Bookings'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
