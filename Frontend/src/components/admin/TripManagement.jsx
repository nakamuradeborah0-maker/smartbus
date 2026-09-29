import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Calendar, Clock, X, User } from 'lucide-react';
import { api } from '../../api/api';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';

export const TripManagement = () => {
  const { lang } = useLanguage();
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
          <h3 className="text-base font-bold text-slate-900">{lang === 'fr' ? 'Horaires & Trajets de Bus' : 'Bus Departures & Schedules'}</h3>
          <p className="text-xs text-slate-500">{lang === 'fr' ? 'Planification des départs, affectation des chauffeurs et gestion de flotte' : 'Departure planning, driver assignment and fleet management'}</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition"
        >
          <Plus size={16} />
          <span>{lang === 'fr' ? 'Programmer un Trajet' : 'Schedule Trip'}</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-300">
              <tr>
                <th className="py-3 px-4">N° Trajet</th>
                <th className="py-3 px-4">Ligne & Destination</th>
                <th className="py-3 px-4">Véhicule Bus</th>
                <th className="py-3 px-4">Conducteur</th>
                <th className="py-3 px-4">Heure Départ</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">{lang === 'fr' ? 'Chargement des trajets...' : 'Loading trips...'}</td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">{lang === 'fr' ? 'Aucun trajet programmé.' : 'No scheduled trips.'}</td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-800">
                      #{t.tripNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {t.routeId?.originStationId?.city} → {t.routeId?.destinationStationId?.city}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{t.busNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{t.driverId?.name}</div>
                      <div className="text-[10px] text-slate-400">{t.driverId?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(t.departureScheduled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteTrip(t._id)}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                        title="Supprimer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-300 p-6 sm:p-8 shadow-2xl text-xs">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-4">
              Programmer un Trajet de Bus
            </h3>

            {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">{error}</div>}

            <form onSubmit={handleCreateTrip} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Ligne *</label>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                >
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.distanceKm} km)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Conducteur affecté *</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                >
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Immatriculation & Modèle Bus *</label>
                <input
                  type="text"
                  required
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  placeholder="ex: LT-782-AA (Scania VIP)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Heure Départ *</label>
                  <input
                    type="datetime-local"
                    required
                    value={departureScheduled}
                    onChange={(e) => setDepartureScheduled(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Heure Arrivée *</label>
                  <input
                    type="datetime-local"
                    required
                    value={arrivalScheduled}
                    onChange={(e) => setArrivalScheduled(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-xs transition"
                >
                  Créer le trajet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
