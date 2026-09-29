import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Navigation,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCw,
  AlertTriangle,
  Radio,
  Truck,
  Building2,
  ArrowRight,
  Info,
  Calendar,
  Sparkles,
  Users,
  Compass,
  ChevronRight
} from 'lucide-react';
import { api } from '../../api/api';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';
import { LiveTrackingMap } from '../map/LiveTrackingMap';
import { PublicIssueModal } from './PublicIssueModal';
import { BookingFlowModal } from '../booking/BookingFlowModal';

export const PublicTrackPortal = ({ onOpenAuth }) => {
  const { lang, t } = useLanguage();
  const [trackingQuery, setTrackingQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('track'); // 'track' | 'search' | 'map'

  // Trip search state
  const [fromCity, setFromCity] = useState('Douala');
  const [toCity, setToCity] = useState('Yaoundé');
  const [searchDate, setSearchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [allTrips, setAllTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  // Booking Flow Modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedTripForBooking, setSelectedTripForBooking] = useState(null);

  const handleOpenBooking = (trip = null) => {
    setSelectedTripForBooking(trip);
    setBookingModalOpen(true);
  };

  // Load trips data for search engine
  useEffect(() => {
    const loadTrips = async () => {
      try {
        const trips = await api.getTrips();
        setAllTrips(trips);
      } catch (err) {
        console.error('Failed to load trips for public portal:', err);
      }
    };
    loadTrips();
  }, []);

  // Default initial track load for instant live demonstration
  useEffect(() => {
    handleTrack('PAR-2026-00125');
  }, []);

  const handleTrack = async (trackingNum) => {
    const num = (trackingNum || trackingQuery).trim().toUpperCase();
    if (!num) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.trackParcel(num);
      if (data.found) {
        setResult(data.parcel);
        setTrackingQuery(num);
      } else {
        setError(lang === 'fr' ? 'Colis introuvable. Vérifiez votre référence.' : 'Parcel not found. Check tracking reference.');
        setResult(null);
      }
    } catch (err) {
      setError(err.message || (lang === 'fr' ? 'Colis introuvable.' : 'Parcel not found.'));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchTrips = (e) => {
    e.preventDefault();
    setHasSearched(true);
    const matches = allTrips.filter((t) => {
      const originMatch = !fromCity || t.routeId?.originStationId?.city?.toLowerCase().includes(fromCity.toLowerCase());
      const destMatch = !toCity || t.routeId?.destinationStationId?.city?.toLowerCase().includes(toCity.toLowerCase());
      return originMatch && destMatch;
    });
    setFilteredTrips(matches.length > 0 ? matches : allTrips.slice(0, 3));
  };

  const sampleParcels = [
    { code: 'PAR-2026-00125', label: lang === 'fr' ? 'En Transit (GPS)' : 'In Transit (GPS)' },
    { code: 'PAR-2026-00126', label: lang === 'fr' ? 'Enregistré' : 'Registered' },
    { code: 'PAR-2026-00127', label: lang === 'fr' ? 'Livré' : 'Delivered' },
  ];

  return (
    <div className="w-full bg-slate-50 text-slate-900">
      {/* ================= HERO WITH REAL TERMINAL PHOTO ================= */}
      <section className="relative min-h-[480px] sm:min-h-[520px] flex items-center justify-center overflow-hidden">
        {/* Background Real Image with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/global_voyages_terminal_night.jpg"
            alt="Global Voyages Terminal"
            className="w-full h-full object-cover object-center brightness-[0.40] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-900/60" />
        </div>

        {/* Content & Docked Search Card */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold uppercase tracking-wider text-blue-200 mb-4 backdrop-blur-none">
            <Radio size={14} className="text-blue-400" />
            <span>{t('hero.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
            {t('hero.title')}
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto mb-8 font-normal leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* DOCKED SEARCH ENGINE & LIVE MAP (Minimalist solid white card) */}
          <div className={`${activeTab === 'map' ? 'max-w-5xl' : 'max-w-2xl'} mx-auto bg-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 text-left transition-all duration-300`}>
            {/* Segmented Switcher */}
            <div className="flex border-b border-slate-200 mb-5 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('track')}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'track'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package size={17} />
                <span>{t('tab.track')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'search'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Search size={17} />
                <span>{t('tab.book')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'map'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Radio size={17} className={activeTab === 'map' ? 'animate-pulse text-blue-700' : ''} />
                <span>{lang === 'fr' ? 'Carte & Endroits en Direct' : 'Live Fleet & Places Map'}</span>
              </button>
            </div>

            {/* Tab 1: Parcel Tracking */}
            {activeTab === 'track' && (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleTrack();
                  }}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={trackingQuery}
                      onChange={(e) => setTrackingQuery(e.target.value)}
                      placeholder={t('track.placeholder')}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-mono font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    {loading ? <RotateCw size={16} className="animate-spin" /> : <Navigation size={16} />}
                    <span>{t('track.btn')}</span>
                  </button>
                </form>

                {/* Quick sample chips */}
                <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                  <span className="text-[11px] font-bold text-slate-500">{t('track.quickDemo')}</span>
                  {sampleParcels.map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => handleTrack(s.code)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 font-mono text-[11px] font-bold transition"
                    >
                      {s.code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Trip Search */}
            {activeTab === 'search' && (
              <form onSubmit={handleSearchTrips} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('book.origin')}
                    </label>
                    <select
                      value={fromCity}
                      onChange={(e) => setFromCity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Douala">Douala (Akwa)</option>
                      <option value="Yaoundé">Yaoundé (Mvan)</option>
                      <option value="Bafoussam">Bafoussam</option>
                      <option value="Bamenda">Bamenda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('book.destination')}
                    </label>
                    <select
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Yaoundé">Yaoundé (Mvan)</option>
                      <option value="Douala">Douala (Akwa)</option>
                      <option value="Bafoussam">Bafoussam</option>
                      <option value="Bamenda">Bamenda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('book.date')}
                    </label>
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Liaisons directes autoroutières (N3)
                  </span>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer"
                  >
                    <Search size={15} />
                    <span>{t('book.btn')}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Live Map & Fleet Places */}
            {activeTab === 'map' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                  <div className="flex items-center gap-2 text-blue-950 font-bold">
                    <Radio size={16} className="text-blue-700 animate-pulse shrink-0" />
                    <span>Liaison Interurbaine Douala ➔ Yaoundé (Axe Lourd N3)</span>
                  </div>
                  <span className="text-[11px] text-blue-700 font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200 w-fit">
                    Autocar VIP #LT-782-AA • Télémétrie 4G
                  </span>
                </div>

                <LiveTrackingMap
                  origin={{ name: 'Gare Centrale Douala Akwa', city: 'Douala', latitude: 4.0511, longitude: 9.7679 }}
                  destination={{ name: 'Gare Terminale Yaoundé Mvan', city: 'Yaoundé', latitude: 3.8480, longitude: 11.5021 }}
                  currentLocation={{
                    latitude: 4.015338,
                    longitude: 9.814519,
                    speed: 73,
                    batteryLevel: 94,
                    locationName: 'Sortie Yassa (PK 18)'
                  }}
                  height="500px"
                  busPlate="LT-782-AA"
                  tripTitle="Douala (Akwa) ➔ Yaoundé (Mvan)"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= SEARCH RESULTS (TRIPS) ================= */}
      {activeTab === 'search' && hasSearched && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">
              {t('book.availableTrips')} ({fromCity} → {toCity})
            </h3>
            <span className="text-xs text-slate-500">{filteredTrips.length} départs</span>
          </div>

          <div className="space-y-3">
            {filteredTrips.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-300 text-slate-500 text-xs">
                {t('book.noTrips')}
              </div>
            ) : (
              filteredTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-600 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <Truck size={22} className="text-blue-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-800">#{trip.tripNumber}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">VIP AC</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                        {trip.routeId?.name || `${fromCity} ↔ ${toCity} Express`}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {trip.busNumber || 'Scania VIP'} • Départ : {new Date(trip.departureScheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-black text-slate-900">
                        5 000 <span className="text-xs text-slate-500 font-bold">{t('book.price')}</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-semibold block">48 {t('book.seats')}</span>
                    </div>

                    <button
                      onClick={() => handleOpenBooking(trip)}
                      className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      {t('book.reserve')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ================= TRACKING RESULTS SECTION ================= */}
      {activeTab === 'track' && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 -mt-8 relative z-20">
          {loading && (
            <div className="p-10 rounded-2xl bg-white border border-slate-300 shadow-md flex flex-col items-center justify-center text-center">
              <RotateCw size={32} className="animate-spin text-blue-700 mb-3" />
              <h3 className="text-sm font-bold text-slate-900">{t('track.searching')}</h3>
            </div>
          )}

          {error && !loading && (
            <div className="p-6 rounded-2xl bg-white border border-red-200 shadow-sm text-center">
              <AlertCircle size={28} className="mx-auto text-red-600 mb-2" />
              <p className="text-xs font-bold text-slate-800">{error}</p>
            </div>
          )}

          {result && !loading && (
            <div className="rounded-2xl bg-white border border-slate-300 shadow-md overflow-hidden">
              {/* Header card */}
              <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl font-black font-mono text-slate-900">
                      {result.trackingNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.trackingNumber)}
                      title="Copier le code"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
                    >
                      {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    </button>
                    <StatusBadge status={result.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {result.description ? `${result.description} • ` : ''}
                    {t('status.weight')} : {result.weightKg} kg
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTrack(result.trackingNumber)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 transition"
                  >
                    <RotateCw size={13} />
                    <span>Actualiser</span>
                  </button>
                  <button
                    onClick={() => setIssueModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 transition"
                  >
                    <AlertTriangle size={13} />
                    <span>{t('status.reportIssue')}</span>
                  </button>
                </div>
              </div>

              {/* Step Journey Board (Minimalist & High Contrast) */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200 items-center">
                  {/* Origin */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      {t('status.origin')}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {result.originStation?.name || 'Douala Akwa'}
                    </h4>
                    <p className="text-xs text-slate-500">{result.originStation?.city}</p>
                  </div>

                  {/* Trip Midpoint */}
                  <div className="text-center py-2 md:py-0 border-y md:border-y-0 md:border-x border-slate-200">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                      <Truck size={15} />
                      <span>{t('status.transit')}</span>
                    </div>
                    <div className="w-28 h-1.5 bg-slate-200 rounded-full mx-auto my-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          result.status === 'DELIVERED'
                            ? 'w-full bg-emerald-600'
                            : result.status === 'ARRIVED'
                            ? 'w-4/5 bg-blue-600'
                            : 'w-1/2 bg-blue-600'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {result.trip ? `Bus #${result.trip.busNumber || result.trip.tripNumber}` : 'Liaison directe'}
                    </span>
                  </div>

                  {/* Destination */}
                  <div className="md:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      {t('status.destination')}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {result.destinationStation?.name || 'Yaoundé Mvan'}
                    </h4>
                    <p className="text-xs text-slate-500">{result.destinationStation?.city}</p>
                  </div>
                </div>

                {/* GPS Map Container */}
                <div className="mt-6">
                  {result.hasGpsTracking ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Radio size={14} className="text-blue-700" />
                          <span>Télémétrie GPS en direct</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-blue-700">
                          {result.trackerCode}
                        </span>
                      </div>
                      <LiveTrackingMap
                        origin={result.originStation}
                        destination={result.destinationStation}
                        currentLocation={result.currentLocation}
                        locationHistory={result.locationHistory || []}
                        height="500px"
                        busPlate="LT-782-AA"
                        tripTitle={`${result.originStation?.city || 'Douala'} ➔ ${result.destinationStation?.city || 'Yaoundé'}`}
                      />
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
                      <Info size={18} className="text-slate-500 shrink-0" />
                      <span>Ce colis est validé manuellement à chaque gare de transit.</span>
                    </div>
                  )}
                </div>

                {/* Checkpoint audit timeline */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                    Historique des étapes de transport
                  </h4>
                  <div className="space-y-4">
                    {result.timeline?.map((ev, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-700 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{ev.status}</span>
                            {ev.stationCity && <span className="text-slate-500">({ev.stationCity})</span>}
                            <span className="text-[10px] text-slate-400 ml-auto">
                              {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {ev.notes && <p className="text-slate-500 mt-0.5">{ev.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ================= REAL FLEET & TERMINALS SHOWCASE ================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
            Global Voyages Cameroun
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {t('fleet.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            {t('fleet.subtitle')}
          </p>
        </div>

        {/* 2 Wide Real Photo Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: VIP Luxury Interior */}
          <div className="rounded-2xl bg-white border border-slate-300 overflow-hidden shadow-xs hover:shadow-md transition group">
            <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-900">
              <img
                src="/images/global_voyages_vip_interior.jpg"
                alt="Intérieur VIP Global Voyages"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-900/80 text-white font-bold text-xs border border-white/20">
                Flotte VIP King Long & Scania
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-black text-slate-900 mb-2">
                {t('fleet.vipTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {t('fleet.vipDesc')}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-blue-700 shrink-0" /> Sièges cuir inclinables
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-blue-700 shrink-0" /> Climatisation régulée
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-blue-700 shrink-0" /> Prises de recharge USB
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-blue-700 shrink-0" /> Suspension confort
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Modern Terminal & Fleet */}
          <div className="rounded-2xl bg-white border border-slate-300 overflow-hidden shadow-xs hover:shadow-md transition group">
            <div className="relative h-64 sm:h-72 overflow-hidden bg-slate-900">
              <img
                src="/images/global_voyages_terminal_day.jpg"
                alt="Gare Global Voyages"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-900/80 text-white font-bold text-xs border border-white/20">
                Terminaux Douala & Yaoundé
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-black text-slate-900 mb-2">
                {t('fleet.terminalsTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {t('fleet.terminalsDesc')}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-blue-700 shrink-0" /> Départs ponctuels
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-blue-700 shrink-0" /> Salles d'attente équipées
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-blue-700 shrink-0" /> Bagages sécurisés
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-blue-700 shrink-0" /> Sécurité 24/7 sur quai
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Issue Reporting Modal */}
      <PublicIssueModal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        initialTrackingNumber={result?.trackingNumber || trackingQuery}
      />

      {/* Booking Flow Modal with Coach Seat Selection & CamPay */}
      <BookingFlowModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialTrip={selectedTripForBooking}
      />
    </div>
  );
};
