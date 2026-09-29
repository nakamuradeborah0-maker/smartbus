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
  ArrowRight
} from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { ReportIncidentModal } from './ReportIncidentModal';

export const DriverDashboard = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const data = await api.getTrips();
      setTrips(data);
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
      alert(res.message || 'Departure confirmed! Loaded parcels are now in transit.');
      fetchTrips();
    } catch (err) {
      alert(`Error confirming departure: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArrival = async (tripId) => {
    setActionLoading(true);
    try {
      const res = await api.confirmArrival(tripId);
      alert(res.message || 'Arrival confirmed! Parcels marked as arrived at station.');
      fetchTrips();
    } catch (err) {
      alert(`Error confirming arrival: ${err.message}`);
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
            <span>Console de Bord Chauffeur</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Capitaine <span className="text-blue-700">{user?.name || 'Paul'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Liaisons routières assignées, validation des départs/arrivées et signalement d'incidents.
          </p>
        </div>

        <button
          onClick={fetchTrips}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 transition self-start md:self-auto cursor-pointer"
        >
          <RotateCw size={14} />
          <span>Actualiser les Voyages</span>
        </button>
      </div>

      {/* Trips Grid */}
      <div className="mt-6 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Calendar size={16} className="text-blue-700" />
          <span>Vos Liaisons Assignées ({trips.length})</span>
        </h3>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">Chargement des trajets en cours...</div>
        ) : trips.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-xs text-slate-500">
            Aucun voyage assigné pour aujourd'hui.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.map((trip) => {
              const origin = trip.routeId?.originStationId?.name || 'Gare Centrale Douala';
              const dest = trip.routeId?.destinationStationId?.name || 'Gare Yaoundé Mvan';
              const isDeparted = trip.status === 'DEPARTED' || trip.status === 'IN_TRANSIT';
              const isArrived = trip.status === 'ARRIVED';

              return (
                <div
                  key={trip._id}
                  className="p-6 rounded-xl bg-white border border-slate-300 shadow-2xs space-y-5 flex flex-col justify-between transition hover:shadow-sm"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          Numéro de Liaison
                        </span>
                        <div className="font-mono text-xl font-black text-slate-900 mt-0.5">
                          #{trip.tripNumber}
                        </div>
                      </div>
                      <StatusBadge status={trip.status} size="md" />
                    </div>

                    {/* Bus & Route */}
                    <div className="mt-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 font-semibold">Véhicule Bus :</span>
                        <strong className="font-bold text-slate-900">{trip.busNumber}</strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 font-semibold">Itinéraire :</span>
                        <span className="font-bold text-blue-700 flex items-center gap-1.5">
                          {origin} <ArrowRight size={13} className="text-slate-400" /> {dest}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-slate-500">Départ Prévu :</span>
                        <span className="font-bold text-slate-800">{new Date(trip.departureScheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-slate-500">Arrivée Estimée :</span>
                        <span className="font-bold text-slate-800">{new Date(trip.arrivalScheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Incident Note if any */}
                    {trip.incidentReport && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-800">
                        <strong>Incident Consigné :</strong> {trip.incidentReport}
                      </div>
                    )}
                  </div>

                  {/* Driver Operational Actions */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
                    {!isDeparted && !isArrived && (
                      <button
                        onClick={() => handleDeparture(trip._id)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <Navigation size={14} />
                        <span>Confirmer le Départ du Bus</span>
                      </button>
                    )}

                    {isDeparted && !isArrived && (
                      <button
                        onClick={() => handleArrival(trip._id)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 size={14} />
                        <span>Confirmer l'Arrivée en Gare</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedTrip(trip);
                        setIncidentModalOpen(true);
                      }}
                      title="Signaler un incident sur ce trajet"
                      className="px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 font-bold text-xs transition cursor-pointer"
                    >
                      <AlertTriangle size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReportIncidentModal
        isOpen={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        trip={selectedTrip}
        onReported={fetchTrips}
      />
    </div>
  );
};
