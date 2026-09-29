import React, { useState, useEffect } from 'react';
import { X, Radio, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { api } from '../../api/api';

export const AssignTrackerModal = ({ isOpen, onClose, parcel, onAssigned }) => {
  const [trackers, setTrackers] = useState([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState(parcel?.trackerId?._id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadTrackers = async () => {
      try {
        const list = await api.getTrackers();
        setTrackers(list);
        setSelectedTrackerId(parcel?.trackerId?._id || '');
      } catch (err) {
        console.error('Failed to load trackers:', err);
      }
    };

    loadTrackers();
  }, [isOpen, parcel]);

  if (!isOpen || !parcel) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.assignTracker(parcel._id, selectedTrackerId || null);
      setSuccess('IoT Tracker configuration updated successfully!');
      setTimeout(() => {
        onAssigned();
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update tracker assignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-xl bg-white border border-slate-300 p-6 sm:p-8 shadow-2xl text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Cpu size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Assigner une Balise IoT GPS</h3>
            <p className="text-xs text-slate-500 font-mono font-bold">{parcel.trackingNumber}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Sélectionner le Traceur
            </label>
            <select
              value={selectedTrackerId}
              onChange={(e) => setSelectedTrackerId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Aucune balise IoT (Retirer ou mode étape de gare standard)</option>
              {trackers.map((t) => (
                <option
                  key={t._id}
                  value={t._id}
                  disabled={t.status === 'ASSIGNED' && t._id !== parcel.trackerId?._id}
                >
                  {t.trackerCode} - Batterie {t.batteryLevel}% ({t.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Radio size={14} />
              <span>{loading ? 'Enregistrement...' : 'Confirmer l\'Assignation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
