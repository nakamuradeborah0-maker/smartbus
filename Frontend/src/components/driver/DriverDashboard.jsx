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
  Radio
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Driver Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            <Truck size={14} />
            <span>Driver Trip Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Captain {user?.name || 'Paul'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Assigned intercity journeys, live departure confirmations, and arrival reporting
          </p>
        </div>

        <button
          onClick={fetchTrips}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition self-start md:self-auto"
        >
          <RotateCw size={14} />
          <span>Refresh Trips</span>
        </button>
      </div>

      {/* Trips Grid */}
      <div className="mt-8 space-y-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar size={18} className="text-slate-400" />
          <span>Your Assigned Journeys ({trips.length})</span>
        </h3>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading assigned journeys...</div>
        ) : trips.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No active trips assigned to your profile today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips.map((trip) => {
              const origin = trip.routeId?.originStationId?.name || 'Douala Station';
              const dest = trip.routeId?.destinationStationId?.name || 'Yaoundé Station';
              const isDeparted = trip.status === 'DEPARTED' || trip.status === 'IN_TRANSIT';
              const isArrived = trip.status === 'ARRIVED';

              return (
                <div
                  key={trip._id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Trip Number
                        </span>
                        <div className="font-mono text-lg font-black text-slate-900 dark:text-white">
                          #{trip.tripNumber}
                        </div>
                      </div>
                      <StatusBadge status={trip.status} size="md" />
                    </div>

                    {/* Bus & Route */}
                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Bus Vehicle:</span>
                        <strong className="font-semibold text-slate-800 dark:text-slate-200">{trip.busNumber}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Route:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">
                          {origin} → {dest}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Scheduled Departure:</span>
                        <span>{new Date(trip.departureScheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Scheduled Arrival:</span>
                        <span>{new Date(trip.arrivalScheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Incident Note if any */}
                    {trip.incidentReport && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                        <strong>Logged Incident:</strong> {trip.incidentReport}
                      </div>
                    )}
                  </div>

                  {/* Driver Operational Actions */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    {!isDeparted && !isArrived && (
                      <button
                        onClick={() => handleDeparture(trip._id)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                      >
                        <Navigation size={14} />
                        <span>Confirm Departure</span>
                      </button>
                    )}

                    {isDeparted && !isArrived && (
                      <button
                        onClick={() => handleArrival(trip._id)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        <span>Confirm Arrival</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedTrip(trip);
                        setIncidentModalOpen(true);
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-semibold text-xs transition"
                    >
                      <AlertTriangle size={14} />
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
