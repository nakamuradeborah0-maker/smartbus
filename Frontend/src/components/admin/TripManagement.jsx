import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Calendar, Clock, X, User } from 'lucide-react';
import { api } from '../../api/api';
import { StatusBadge } from '../common/StatusBadge';

export const TripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [routeId, setRouteId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [busNumber, setBusNumber] = useState('LT-782-AA (Scania VIP)');
  const [departureScheduled, setDepartureScheduled] = useState('');
  const [arrivalScheduled, setArrivalScheduled] = useState('');
  const [error, setError] = useState('');

  const fetchTripsData = async () => {
    setLoading(true);
    try {
      const [tData, rData, uData] = await Promise.all([
        api.getTrips(),
        api.getRoutes(),
        api.getUsers({ role: 'DRIVER' }),
      ]);
      setTrips(tData);
      setRoutes(rData);
      setDrivers(uData);

      if (rData.length > 0) setRouteId(rData[0]._id);
      if (uData.length > 0) setDriverId(uData[0]._id);

      // Default schedule times
      const now = new Date();
      const dep = new Date(now.getTime() + 2 * 3600 * 1000).toISOString().slice(0, 16);
      const arr = new Date(now.getTime() + 6 * 3600 * 1000).toISOString().slice(0, 16);
      setDepartureScheduled(dep);
      setArrivalScheduled(arr);
    } catch (err) {
      console.error('Failed to load trips data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsData();
  }, []);

  const openCreateModal = () => {
    setError('');
    setModalOpen(true);
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.createTrip({
        routeId,
        driverId,
        busNumber,
        departureScheduled,
        arrivalScheduled,
      });
      setModalOpen(false);
      fetchTripsData();
    } catch (err) {
      setError(err.message || 'Failed to create trip.');
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip schedule?')) return;
    try {
      await api.deleteTrip(id);
      fetchTripsData();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Scheduled Bus Trips</h3>
          <p className="text-xs text-slate-500">Dispatch departures, driver allocations, and fleet assignments</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition"
        >
          <Plus size={16} />
          <span>Schedule Trip</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Trip #</th>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-4">Bus Vehicle</th>
                <th className="py-3.5 px-4">Driver</th>
                <th className="py-3.5 px-4">Departure</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading trips...</td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No scheduled trips.</td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      #{t.tripNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {t.routeId?.originStationId?.city} → {t.routeId?.destinationStationId?.city}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{t.busNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{t.driverId?.name}</div>
                      <div className="text-[10px] text-slate-400">{t.driverId?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(t.departureScheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteTrip(t._id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Trip Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl text-xs">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">
              Schedule Intercity Bus Trip
            </h3>

            {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700">{error}</div>}

            <form onSubmit={handleCreateTrip} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Route *</label>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.distanceKm} km)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Assigned Driver *</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Bus Vehicle Details *</label>
                <input
                  type="text"
                  required
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  placeholder="e.g. LT-782-AA (Scania VIP)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Departure Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={departureScheduled}
                    onChange={(e) => setDepartureScheduled(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Arrival Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={arrivalScheduled}
                    onChange={(e) => setArrivalScheduled(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-md"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
