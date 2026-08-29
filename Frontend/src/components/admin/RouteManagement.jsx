import React, { useState, useEffect } from 'react';
import { Navigation, Plus, Edit2, Trash2, X, Clock, ArrowRight } from 'lucide-react';
import { api } from '../../api/api';

export const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  const [routeCode, setRouteCode] = useState('');
  const [name, setName] = useState('');
  const [originStationId, setOriginStationId] = useState('');
  const [destinationStationId, setDestinationStationId] = useState('');
  const [distanceKm, setDistanceKm] = useState('240');
  const [estimatedHours, setEstimatedHours] = useState('3.5');
  const [error, setError] = useState('');

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const [rData, sData] = await Promise.all([api.getRoutes(), api.getStations()]);
      setRoutes(rData);
      setStations(sData);
      if (sData.length > 1) {
        setOriginStationId(sData[0]._id);
        setDestinationStationId(sData[1]._id);
      }
    } catch (err) {
      console.error('Failed to load routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const openCreateModal = () => {
    setEditingRoute(null);
    setRouteCode('RT-');
    setName('');
    if (stations.length > 1) {
      setOriginStationId(stations[0]._id);
      setDestinationStationId(stations[1]._id);
    }
    setDistanceKm('240');
    setEstimatedHours('3.5');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (r) => {
    setEditingRoute(r);
    setRouteCode(r.routeCode);
    setName(r.name);
    setOriginStationId(r.originStationId?._id || r.originStationId);
    setDestinationStationId(r.destinationStationId?._id || r.destinationStationId);
    setDistanceKm(r.distanceKm.toString());
    setEstimatedHours(r.estimatedHours.toString());
    setError('');
    setModalOpen(true);
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        routeCode: routeCode.trim().toUpperCase(),
        name: name.trim(),
        originStationId,
        destinationStationId,
        distanceKm: Number(distanceKm),
        estimatedHours: Number(estimatedHours),
      };

      if (editingRoute) {
        await api.updateRoute(editingRoute._id, payload);
      } else {
        await api.createRoute(payload);
      }
      setModalOpen(false);
      fetchRoutes();
    } catch (err) {
      setError(err.message || 'Failed to save route.');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await api.deleteRoute(id);
      fetchRoutes();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Intercity Bus Routes</h3>
          <p className="text-xs text-slate-500">Manage highway connections and estimated travel duration</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition"
        >
          <Plus size={16} />
          <span>Add Route</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading routes...</div>
        ) : routes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">No routes registered.</div>
        ) : (
          routes.map((r) => (
            <div
              key={r._id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 font-mono font-bold text-[10px] text-indigo-700 dark:text-indigo-300">
                    {r.routeCode}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(r)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(r._id)}
                      className="p-1 rounded text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{r.name}</h4>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Origin</span>
                    <strong>{r.originStationId?.city || 'Douala'}</strong>
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Destination</span>
                    <strong>{r.destinationStationId?.city || 'Yaoundé'}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex justify-between font-medium">
                <span>Distance: <strong>{r.distanceKm} km</strong></span>
                <span>Est. Duration: <strong>{r.estimatedHours} hrs</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Route Modal */}
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
              {editingRoute ? 'Edit Route' : 'Add New Route'}
            </h3>

            {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700">{error}</div>}

            <form onSubmit={handleSaveRoute} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Route Code *</label>
                <input
                  type="text"
                  required
                  value={routeCode}
                  onChange={(e) => setRouteCode(e.target.value)}
                  placeholder="e.g. RT-DLA-YAO"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Route Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Douala ↔ Yaoundé Express (N3)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Origin Station *</label>
                  <select
                    value={originStationId}
                    onChange={(e) => setOriginStationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {stations.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Destination Station *</label>
                  <select
                    value={destinationStationId}
                    onChange={(e) => setDestinationStationId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {stations.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Distance (km) *</label>
                  <input
                    type="number"
                    required
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Est. Hours *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
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
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
