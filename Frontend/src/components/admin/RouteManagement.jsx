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
          <h3 className="text-base font-bold text-slate-900">Lignes & Corridors Interurbains</h3>
          <p className="text-xs text-slate-500">Gestion des liaisons routières, distances kilométriques et durées estimées</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition"
        >
          <Plus size={16} />
          <span>Ajouter une Ligne</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Chargement des lignes...</div>
        ) : routes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Aucune ligne enregistrée.</div>
        ) : (
          routes.map((r) => (
            <div
              key={r._id}
              className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-mono font-bold text-[10px] text-blue-800">
                    {r.routeCode}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(r)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                      title="Modifier"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(r._id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{r.name}</h4>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-800 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Gare Départ</span>
                    <strong>{r.originStationId?.city || 'Douala'}</strong>
                  </div>
                  <ArrowRight size={16} className="text-blue-700" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Gare Arrivée</span>
                    <strong>{r.destinationStationId?.city || 'Yaoundé'}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex justify-between font-medium">
                <span>Distance: <strong className="text-slate-900">{r.distanceKm} km</strong></span>
                <span>Durée estimée: <strong className="text-slate-900">{r.estimatedHours} h</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Route Modal */}
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
              {editingRoute ? 'Modifier la ligne' : 'Créer une nouvelle ligne'}
            </h3>

            {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">{error}</div>}

            <form onSubmit={handleSaveRoute} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Code Ligne *</label>
                <input
                  type="text"
                  required
                  value={routeCode}
                  onChange={(e) => setRouteCode(e.target.value)}
                  placeholder="ex: RT-DLA-YAO"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Libellé de la ligne *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Douala ↔ Yaoundé Express (Nationale 3)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Gare Départ *</label>
                  <select
                    value={originStationId}
                    onChange={(e) => setOriginStationId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                  >
                    {stations.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Gare Arrivée *</label>
                  <select
                    value={destinationStationId}
                    onChange={(e) => setDestinationStationId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                  >
                    {stations.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Distance (km) *</label>
                  <input
                    type="number"
                    required
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Durée estimée (h) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
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
                  Enregistrer la ligne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
