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
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Station Hub Network</h3>
          <p className="text-xs text-slate-500">Manage transit terminal hubs and geo-coordinates</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition"
        >
          <Plus size={16} />
          <span>Add Station</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">Loading stations...</div>
        ) : stations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">No stations registered.</div>
        ) : (
          stations.map((s) => (
            <div
              key={s._id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950 font-mono font-bold text-[10px] text-sky-700 dark:text-sky-300">
                    {s.stationCode}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteStation(s._id)}
                      className="p-1 rounded text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</h4>
                <div className="text-xs text-slate-500 mt-1 flex items-start gap-1.5">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{s.city} • {s.address}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
                <span>Lat: {s.latitude}</span>
                <span>Lng: {s.longitude}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
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
              {editingStation ? 'Edit Station' : 'Add New Station'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveStation} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Station Code *</label>
                <input
                  type="text"
                  required
                  value={stationCode}
                  onChange={(e) => setStationCode(e.target.value)}
                  placeholder="e.g. ST-DLA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Station Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Douala Central Station"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Douala"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Boulevard de la Liberté"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
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
                  Save Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
