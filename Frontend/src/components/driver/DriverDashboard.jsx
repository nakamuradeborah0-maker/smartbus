import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  Navigation,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Radio,
  ArrowRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';
import { ReportIncidentModal } from './ReportIncidentModal';
import { LiveTrackingMap } from '../map/LiveTrackingMap';

export const DriverDashboard = () => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('trips'); // 'trips' | 'navigation'

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const data = await api.getTrips();
      setTrips(data);
      if (data.length > 0 && !selectedTrip) {
        setSelectedTrip(data[0]);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDeparture = async (tripId) => {
    setActionLoading(true);
    try {
      const res = await api.confirmDeparture(tripId);
      alert(res.message || (lang === 'fr' ? 'Départ confirmé ! Colis et passagers en route.' : 'Departure confirmed! Loaded parcels and passengers in transit.'));
      fetchTrips();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrival = async (tripId) => {
    setActionLoading(true);
    try {
      const res = await api.confirmArrival(tripId);
      alert(res.message || (lang === 'fr' ? 'Arrivée confirmée ! Colis réceptionnés en gare.' : 'Arrival confirmed! Parcels marked as arrived at station.'));
      fetchTrips();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Driver Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <Truck size={16} />
            <span>{t('driver.title', 'Console de Bord Chauffeur')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('driver.captain', 'Capitaine')} <span className="text-blue-700">{user?.name || 'Paul'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('driver.desc', 'Liaisons routières assignées, validation des départs/arrivées et signalement d\'incidents.')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIncidentModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-bold text-amber-800 transition cursor-pointer"
          >
            <AlertTriangle size={15} />
            <span>{t('driver.reportIncident', 'Signaler un Incident')}</span>
          </button>
          <button
            onClick={fetchTrips}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{t('driver.refresh', 'Actualiser les Voyages')}</span>
          </button>
        </div>
      </div>

      {/* View Switcher: Trips List vs Live Navigation Map */}
      <div className="flex bg-slate-200/80 rounded-lg p-1 mb-6 w-fit border border-slate-300">
        <button
          onClick={() => setActiveTab('trips')}
          className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'trips'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          <Calendar size={15} />
          <span>{t('driver.assignedTrips', 'Vos Liaisons Assignées')} ({trips.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('navigation')}
          className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'navigation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          <Radio size={15} className={activeTab === 'navigation' ? 'animate-pulse' : ''} />
          <span>{t('driver.routeMap', 'Carte de Navigation & Itinéraire en Direct')}</span>
        </button>
      </div>

      {/* TAB 1: Assigned Trips */}
      {activeTab === 'trips' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs">
              {lang === 'fr' ? 'Chargement de vos voyages assignés...' : 'Loading assigned trips...'}
            </div>
          ) : trips.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              {t('driver.noTrips', 'Aucune liaison assignée pour le moment.')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trips.map((trip) => {
                const isSelected = selectedTrip?._id === trip._id;
                const isInTransit = trip.status === 'IN_TRANSIT';
                const isCompleted = trip.status === 'ARRIVED' || trip.status === 'COMPLETED';

                return (
                  <div
                    key={trip._id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-6 rounded-2xl bg-white border-2 transition shadow-xs flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 shadow-md ring-2 ring-blue-100'
                        : 'border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            #{trip.tripNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {trip.busNumber || 'Scania VIP'}
                          </span>
                        </div>
                        <StatusBadge status={trip.status} size="sm" />
                      </div>

                      <div className="text-lg font-black text-slate-900 flex items-center gap-2 mb-2">
                        <span>{trip.originStation?.name || trip.originStation?.city || 'Douala (Akwa)'}</span>
                        <ArrowRight size={18} className="text-blue-600 shrink-0" />
                        <span>{trip.destinationStation?.name || trip.destinationStation?.city || 'Yaoundé (Mvan)'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            {lang === 'fr' ? 'Départ Prévu' : 'Scheduled Departure'}
                          </span>
                          <strong className="text-slate-900 font-bold">
                            {new Date(trip.departureScheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            {lang === 'fr' ? 'Colis Embarqués' : 'Loaded Parcels'}
                          </span>
                          <strong className="text-blue-700 font-bold">
                            {trip.loadedParcels?.length || 0} {lang === 'fr' ? 'colis' : 'parcels'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrip(trip);
                          setActiveTab('navigation');
                        }}
                        className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs transition flex items-center gap-1.5"
                      >
                        <Navigation size={14} />
                        <span>{lang === 'fr' ? 'Voir sur Carte' : 'View on Map'}</span>
                      </button>

                      {trip.status === 'SCHEDULED' && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeparture(trip._id);
                          }}
                          className="flex-1 py-2 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          <span>{t('driver.confirmDeparture', 'Confirmer le Départ')}</span>
                        </button>
                      )}

                      {isInTransit && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArrival(trip._id);
                          }}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          <span>{t('driver.confirmArrival', 'Confirmer l\'Arrivée')}</span>
                        </button>
                      )}

                      {isCompleted && (
                        <div className="flex-1 text-center py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                          ✓ {t('driver.completed', 'Voyage Terminé')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Live Navigation Map */}
      {activeTab === 'navigation' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-blue-700 animate-pulse" />
              <div>
                <strong className="text-blue-950 font-bold block">
                  {selectedTrip?.originStation?.city || 'Douala'} ➔ {selectedTrip?.destinationStation?.city || 'Yaoundé'} ({selectedTrip?.tripNumber || 'GV-1025'})
                </strong>
                <span className="text-blue-700 text-[11px]">
                  {lang === 'fr'
                    ? 'Guidage en temps réel sur la route nationale N3 • Balise GPS active'
                    : 'Real-time guidance along national highway N3 • Live GPS telemetry'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIncidentModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition cursor-pointer self-start sm:self-auto"
            >
              {t('driver.reportIncident', 'Signaler un Incident')}
            </button>
          </div>

          <LiveTrackingMap
            origin={selectedTrip?.originStation || { name: 'Douala Akwa', city: 'Douala', latitude: 4.0511, longitude: 9.7679 }}
            destination={selectedTrip?.destinationStation || { name: 'Yaoundé Mvan', city: 'Yaoundé', latitude: 3.8480, longitude: 11.5021 }}
            currentLocation={{
              latitude: 4.015338,
              longitude: 9.814519,
              speed: 73,
              batteryLevel: 94,
              locationName: 'Sortie Yassa (PK 18)'
            }}
            height="520px"
            busPlate={selectedTrip?.busNumber || 'LT-782-AA'}
            tripTitle={`${selectedTrip?.originStation?.city || 'Douala'} ➔ ${selectedTrip?.destinationStation?.city || 'Yaoundé'}`}
          />
        </div>
      )}

      {/* Incident reporting modal */}
      <ReportIncidentModal
        isOpen={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        tripId={selectedTrip?._id || (trips[0]?._id ?? '')}
      />
    </div>
  );
};
