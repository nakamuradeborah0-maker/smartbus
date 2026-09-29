import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Navigation,
  MapPin,
  Clock,
  AlertTriangle,
  RotateCw,
  Plus,
  Radio,
  FileText,
  Ticket,
  CreditCard,
  Smartphone,
  CheckCircle2,
  X,
  Users,
  ShieldCheck,
  ChevronRight,
  Bus,
  Download,
  User
} from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';
import { LiveTrackingMap } from '../map/LiveTrackingMap';
import { PublicIssueModal } from '../public/PublicIssueModal';
import { BookingFlowModal } from '../booking/BookingFlowModal';

export const CustomerDashboard = ({ onNavigateTrack }) => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('parcels'); // 'parcels' | 'bookings'
  
  // Parcel state
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  // Trips state
  const [availableTrips, setAvailableTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);

  // Booking Flow & User Tickets state (with Coach Seat Selection & CamPay)
  const [bookingFlowOpen, setBookingFlowOpen] = useState(false);
  const [selectedTripForBooking, setSelectedTripForBooking] = useState(null);
  const [myTickets, setMyTickets] = useState([
    {
      id: 'RES-99823',
      tripNumber: 'GV-1025',
      passenger: 'Deborah Nakamura',
      origin: 'Douala (Gare Centrale Akwa)',
      destination: 'Yaoundé (Terminal Mvan)',
      date: '12 Octobre 2026',
      time: '06:30',
      bus: 'Scania VIP First Class',
      seat: 'Siège N° 14 (Fenêtre VIP)',
      price: 5000,
      status: 'PAID'
    }
  ]);

  const handleDownloadCustomerTicket = (ticket) => {
    const passName = ticket.passenger || user?.name || 'Deborah Nakamura';
    const ticketHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Billet de Transport - Global Voyages - ${ticket.id}</title>
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
      <div class="badge">TITRE CONFIRMÉ & VALIDÉ</div>
    </div>
    <div class="body">
      <div class="route-banner">
        <div class="station">
          <p>Gare de Départ</p>
          <h3>${ticket.origin}</h3>
        </div>
        <div class="arrow">➔</div>
        <div class="station" style="text-align: right;">
          <p>Gare de Destination</p>
          <h3>${ticket.destination}</h3>
        </div>
      </div>
      <div class="grid">
        <div class="item">
          <div class="item-label">Nom du Voyageur / Passager</div>
          <div class="item-val">${passName}</div>
        </div>
        <div class="item">
          <div class="item-label">Siège Réservé</div>
          <div class="item-val seat-val">${ticket.seat || 'Siège N° 14 (VIP)'}</div>
        </div>
        <div class="item">
          <div class="item-label">Date & Heure de Départ</div>
          <div class="item-val">${ticket.date} • ${ticket.time}</div>
        </div>
        <div class="item">
          <div class="item-label">Autocar & Ligne</div>
          <div class="item-val">${ticket.tripNumber} (${ticket.bus || 'Scania VIP First Class'})</div>
        </div>
        <div class="item">
          <div class="item-label">Référence Réservation</div>
          <div class="item-val" style="font-family: monospace;">${ticket.id}</div>
        </div>
        <div class="item">
          <div class="item-label">Tarif Acquitté (CamPay)</div>
          <div class="item-val" style="color: #059669;">${ticket.price?.toLocaleString()} FCFA (PAYÉ)</div>
        </div>
      </div>
      <div class="barcode-section">
        <div>
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Code de Contrôle Embarquement</div>
          <div class="barcode">*${ticket.id}*</div>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; padding: 6px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #065f46; font-size: 11px; font-weight: bold;">
            ✓ Titre Validé
          </span>
        </div>
      </div>
    </div>
    <div class="footer">
      <span>Présentez ce billet électronique à l'embarquement avec votre pièce d'identité.</span>
      <span>Global Voyages Cameroun • Service VIP Interurbain</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([ticketHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Billet_GlobalVoyages_${ticket.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchMyParcels = async () => {
    setLoading(true);
    try {
      const data = await api.getParcels({ search });
      setParcels(data);
      if (data.length > 0 && !selectedParcel) {
        setSelectedParcel(data[0]);
      }
    } catch (err) {
      console.error('Error fetching parcels:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    setTripsLoading(true);
    try {
      const trips = await api.getTrips();
      setAvailableTrips(trips);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setTripsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'parcels') {
      fetchMyParcels();
    } else if (activeTab === 'bookings') {
      fetchTrips();
    }
  }, [search, activeTab]);

  const handleOpenBooking = (trip = null) => {
    setSelectedTripForBooking(trip);
    setBookingFlowOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <Package size={16} />
            <span>{t('customer.badge', 'Portail Voyageur & Expéditeur')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('customer.welcome', 'Bienvenue,')} <span className="text-blue-700">{user?.name || (lang === 'fr' ? 'Voyageur' : 'Passenger')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('customer.subtitle', 'Gérez vos réservations de tickets de bus et suivez l\'acheminement de vos colis en gare.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIssueModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-300 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
          >
            <AlertTriangle size={16} />
            <span>{t('customer.reportIssue', 'Signaler un Problème')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 rounded-lg p-1 mb-8 w-fit border border-slate-300">
        <button
          onClick={() => setActiveTab('parcels')}
          className={`px-5 py-2.5 rounded-md text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'parcels' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-700 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          <Package size={16} />
          <span>{t('customer.tabParcels', 'Mes Colis Expédiés / Reçus')}</span>
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-5 py-2.5 rounded-md text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'bookings' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'text-slate-700 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          <Ticket size={16} />
          <span>{t('customer.tabBookings', 'Mes Réservations & Billets')}</span>
        </button>
      </div>

      {/* Parcels Tab */}
      {activeTab === 'parcels' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Left Column: My Parcels */}
          <div className="lg:col-span-4 space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('customer.searchPlaceholder', 'Rechercher par bordereau...')}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                  {t('customer.loadingParcels', 'Chargement de vos colis...')}
                </div>
              ) : parcels.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
                  {t('customer.noParcels', 'Aucun colis enregistré sous votre compte pour l\'instant.')}
                </div>
              ) : (
                parcels.map((parcel) => {
                  const isSelected = selectedParcel?._id === parcel._id;
                  return (
                    <div
                      key={parcel._id}
                      onClick={() => setSelectedParcel(parcel)}
                      className={`p-4 rounded-xl cursor-pointer transition border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {parcel.trackingNumber}
                        </span>
                        <StatusBadge status={parcel.status} size="sm" />
                      </div>
                      <div className="text-xs text-slate-600 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span>{t('customer.trip', 'Trajet :')}</span>
                          <strong className="font-semibold text-slate-800">
                            {parcel.originStationId?.city || 'Douala'} → {parcel.destinationStationId?.city || 'Yaoundé'}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{t('customer.device', 'Dispositif :')}</span>
                          <span className="font-mono text-[11px] text-blue-700 font-bold">
                            {parcel.trackerId ? t('customer.iotActive', 'Balise IoT GPS Active') : t('customer.stationCheck', 'Contrôle en Gare')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-8">
            {selectedParcel ? (
              <div className="p-6 sm:p-8 rounded-xl bg-white border border-slate-300 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-mono text-2xl font-black text-slate-900">
                        {selectedParcel.trackingNumber}
                      </h3>
                      <StatusBadge status={selectedParcel.status} size="md" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('customer.registeredOn', 'Enregistré le')} {new Date(selectedParcel.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTrack(selectedParcel.trackingNumber)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
                  >
                    <Navigation size={16} />
                    <span>{t('customer.publicView', 'Vue Suivi Public')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-semibold uppercase text-[10px]">{t('customer.originStation', 'Gare de Départ')}</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {selectedParcel.originStationId?.name || 'Gare Centrale Douala (Akwa)'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-semibold uppercase text-[10px]">{t('customer.destStation', 'Gare d\'Arrivée')}</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {selectedParcel.destinationStationId?.name || 'Terminal Yaoundé (Mvan)'}
                    </p>
                  </div>
                </div>

                <div>
                  {selectedParcel.trackerId ? (
                    <div className="overflow-hidden rounded-xl border border-slate-300">
                      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{t('customer.gpsSignal', 'Signal GPS Télétransmis')}</span>
                        <span className="text-slate-500">{t('customer.battery', 'Batterie :')} <strong>{selectedParcel.trackerId.batteryLevel || 100}%</strong></span>
                      </div>
                      <LiveTrackingMap
                        origin={selectedParcel.originStationId}
                        destination={selectedParcel.destinationStationId}
                        currentLocation={{
                          latitude: selectedParcel.trackerId.lastLatitude,
                          longitude: selectedParcel.trackerId.lastLongitude,
                          speed: selectedParcel.trackerId.lastSpeed || 0,
                          batteryLevel: selectedParcel.trackerId.batteryLevel || 100,
                          timestamp: selectedParcel.trackerId.lastPing,
                        }}
                        height="460px"
                        busPlate="LT-782-AA"
                        tripTitle={`${selectedParcel.originStationId?.name || 'Douala'} ➔ ${selectedParcel.destinationStationId?.name || 'Yaoundé'}`}
                      />
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                        <FileText size={20} className="text-slate-500" />
                      </div>
                      <p>{t('customer.noIotDesc', 'Ce colis est acheminé avec validation physique à chaque checkpoint de gare.')}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-400 text-sm flex flex-col items-center">
                <Package size={48} className="mb-4 opacity-20" />
                {t('customer.selectParcelPrompt', 'Sélectionnez un colis dans la liste pour consulter les détails d\'acheminement.')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bookings & Bus Fleet Tab */}
      {activeTab === 'bookings' && (
        <div className="animate-fadeIn space-y-8">
          {/* Fleet Showcase Hero in Dashboard */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white shadow-md border border-slate-300">
            <div className="absolute inset-0">
              <img 
                src="/images/global_voyages_vip_interior.jpg" 
                alt="Global Voyages VIP Interior" 
                className="w-full h-full object-cover object-center opacity-40 brightness-75" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1E36] via-[#0B1E36]/90 to-transparent" />
            </div>

            <div className="relative p-6 sm:p-10 max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck size={14} />
                Flotte Confort VIP
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Voyagez en Première Classe Interurbaine
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Fauteuils en cuir inclinables, climatisation régulée et wifi à bord sur toutes nos liaisons quotidiennes directes.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => handleOpenBooking(null)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Plus size={16} />
                  <span>{t('customer.bookNewTicket', 'Réserver un Billet')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* User's existing active tickets */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Ticket size={18} className="text-blue-600" />
              <span>{t('customer.tripsTitle', 'Mes Billets & Départs Disponibles')}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTickets.map((ticket) => (
                <div key={ticket.id} className="p-6 rounded-xl bg-white border border-slate-300 shadow-sm relative overflow-hidden group hover:border-blue-400 transition">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition">
                    <Ticket size={80} />
                  </div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 size={16} />
                      <span>{t('customer.confirmedTicket', 'Billet Confirmé & Payé')}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-500">#{ticket.id}</span>
                  </div>

                  <div className="mb-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Voyageur / Titulaire</span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                      <User size={13} className="text-blue-600" />
                      <span>{ticket.passenger || 'Deborah Nakamura'}</span>
                    </div>
                  </div>

                  <h4 className="text-xl font-black text-slate-900 mb-1">
                    {ticket.origin} → {ticket.destination}
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    {ticket.date} • {ticket.time} • {ticket.bus || 'VIP Confort'}
                  </p>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs mb-4">
                    <span>💺</span>
                    <span>{ticket.seat || 'Siège N° 14 (Fenêtre VIP)'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="font-mono text-xs font-semibold text-slate-500">{ticket.tripNumber || 'GV-1025'}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-blue-900 text-sm">{ticket.price?.toLocaleString()} FCFA</span>
                      <button
                        type="button"
                        onClick={() => handleDownloadCustomerTicket(ticket)}
                        title="Télécharger le billet"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <Download size={13} />
                        <span className="text-[10px] font-bold">PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Quick Book Callout */}
              <div 
                className="p-6 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-center text-slate-500 hover:bg-slate-50 hover:border-blue-400 transition cursor-pointer" 
                onClick={() => handleOpenBooking(null)}
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Plus size={24} />
                </div>
                <span className="font-bold text-slate-900 text-sm">{t('customer.buyNewPrompt', 'Acheter un nouveau billet')}</span>
                <span className="text-xs text-slate-400 mt-1 max-w-xs">{t('customer.buyNewDesc', 'Voyagez confortablement sur les lignes Global Voyages')}</span>
              </div>
            </div>
          </div>

          {/* Live Scheduled Trips from DB */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Bus size={18} className="text-blue-600" />
                <span>{t('customer.availableTrips', 'Liaisons Programmées en Temps Réel')}</span>
              </h3>
              <span className="text-xs text-slate-500">
                {availableTrips.length} {lang === 'fr' ? 'départs configurés' : 'scheduled routes'}
              </span>
            </div>

            {tripsLoading ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                {t('customer.loadingParcels', 'Chargement des départs...')}
              </div>
            ) : availableTrips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTrips.map((trip) => (
                  <div 
                    key={trip._id} 
                    className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{trip.tripNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          {trip.status === 'scheduled' ? (lang === 'fr' ? 'Programmé' : 'Scheduled') : trip.status}
                        </span>
                      </div>

                      <div className="text-base font-black text-slate-900 flex items-center gap-2 mb-1">
                        <span>{trip.originStationId?.name || trip.originStationId?.city || 'Douala'}</span>
                        <ChevronRight size={16} className="text-slate-400" />
                        <span>{trip.destinationStationId?.name || trip.destinationStationId?.city || 'Yaoundé'}</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 my-3">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-400" />
                          <span>{t('customer.departure', 'Départ :')} {new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-slate-400" />
                          <span>{trip.availableSeats} {t('customer.seatsLeft', 'places dispo')}</span>
                        </div>
                        {trip.busId?.plateNumber && (
                          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                            <span>{t('customer.busNumber', 'Autocar N°')} {trip.busId.plateNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-2">
                      <span className="text-lg font-black text-blue-900">{trip.price?.toLocaleString()} FCFA</span>
                      <button
                        onClick={() => handleOpenBooking(trip)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        {t('book.reserve', 'Réserver')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Complete Interactive Booking & Seat Picker & CamPay Modal */}
      <BookingFlowModal
        isOpen={bookingFlowOpen}
        onClose={() => setBookingFlowOpen(false)}
        initialTrip={selectedTripForBooking}
        onBookingSuccess={(newTicket) => {
          setMyTickets((prev) => [newTicket, ...prev]);
        }}
      />

      <PublicIssueModal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        initialTrackingNumber={selectedParcel?.trackingNumber || ''}
      />
    </div>
  );
};
