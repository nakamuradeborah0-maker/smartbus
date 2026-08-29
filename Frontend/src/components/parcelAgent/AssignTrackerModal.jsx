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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Cpu size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Assign IoT Tracker</h3>
            <p className="text-xs text-slate-500 font-mono">{parcel.trackingNumber}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Select Device
            </label>
            <select
              value={selectedTrackerId}
              onChange={(e) => setSelectedTrackerId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">No IoT Tracker (Remove Tracker / Station Only)</option>
              {trackers.map((t) => (
                <option
                  key={t._id}
                  value={t._id}
                  disabled={t.status === 'ASSIGNED' && t._id !== parcel.trackerId?._id}
                >
                  {t.trackerCode} - Battery {t.batteryLevel}% ({t.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              <Radio size={14} />
              <span>{loading ? 'Saving...' : 'Update Tracker'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
