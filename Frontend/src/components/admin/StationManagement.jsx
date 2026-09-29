import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, MapPin, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../api/api';

export const StationManagement = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);

  const [stationCode, setStationCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('4.0511');
  const [longitude, setLongitude] = useState('9.7679');
  const [error, setError] = useState('');

  const fetchStations = async () => {
    setLoading(true);
    try {
      const data = await api.getStations();
      setStations(data);
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const openCreateModal = () => {
    setEditingStation(null);
    setStationCode('ST-');
    setName('');
    setCity('');
    setAddress('');
    setPhone('');
    setLatitude('4.0511');
    setLongitude('9.7679');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingStation(s);
    setStationCode(s.stationCode);
    setName(s.name);
    setCity(s.city);
    setAddress(s.address);
    setPhone(s.phone || '');
    setLatitude(s.latitude.toString());
    setLongitude(s.longitude.toString());
    setError('');
    setModalOpen(true);
  };

  const handleSaveStation = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        stationCode: stationCode.trim().toUpperCase(),
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
      };

      if (editingStation) {
        await api.updateStation(editingStation._id, payload);
      } else {
        await api.createStation(payload);
      }
      setModalOpen(false);
      fetchStations();
    } catch (err) {
      setError(err.message || 'Failed to save station.');
    }
  };

  const handleDeleteStation = async (id) => {
    if (!window.confirm('Are you sure you want to remove this station?')) return;
    try {
      await api.deleteStation(id);
      fetchStations();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Réseau des Gares & Terminaux</h3>
          <p className="text-xs text-slate-500">Gestion des hubs logistiques, adresses physiques et coordonnées GPS</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition"
        >
          <Plus size={16} />
          <span>Ajouter une Gare</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Chargement des gares...</div>
        ) : stations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Aucune gare enregistrée.</div>
        ) : (
          stations.map((s) => (
            <div
              key={s._id}
              className="p-5 rounded-xl bg-white border border-slate-300 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-mono font-bold text-[10px] text-blue-800">
                    {s.stationCode}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                      title="Modifier"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteStation(s._id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                <div className="text-xs text-slate-500 mt-1 flex items-start gap-1.5">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{s.city} • {s.address}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex justify-between">
                <span>Lat: {s.latitude}</span>
                <span>Lng: {s.longitude}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
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
              {editingStation ? 'Modifier la gare' : 'Ajouter une nouvelle gare'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveStation} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Code Gare *</label>
                <input
                  type="text"
                  required
                  value={stationCode}
                  onChange={(e) => setStationCode(e.target.value)}
                  placeholder="ex: ST-DLA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Nom de la gare *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Gare Centrale Douala Akwa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Ville *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="ex: Douala"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Adresse / Quartier *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Boulevard de la Liberté"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase">Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs"
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
                  Enregistrer la gare
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
