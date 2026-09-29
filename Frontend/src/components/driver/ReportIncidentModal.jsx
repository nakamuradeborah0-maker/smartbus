import React, { useState } from 'react';
import { X, AlertTriangle, Send, ShieldAlert } from 'lucide-react';
import { api } from '../../api/api';
import { useLanguage } from '../../context/LanguageContext';

export const ReportIncidentModal = ({ isOpen, onClose, trip, onReported }) => {
  const { lang } = useLanguage();
  const [incidentReport, setIncidentReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !trip) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.reportTripIncident(trip._id, incidentReport);
      onReported();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to report incident.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-300 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">{lang === 'fr' ? 'Signaler un Incident / Retard' : 'Report Incident / Delay'}</h3>
            <p className="text-xs text-slate-500 font-medium">Trajet #{trip.tripNumber} ({trip.busNumber})</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {lang === 'fr' ? 'Détails de l\'incident ou perturbation' : 'Incident or delay details'}
            </label>
            <textarea
              required
              rows={4}
              value={incidentReport}
              onChange={(e) => setIncidentReport(e.target.value)}
              placeholder="ex: Fortes pluies au péage d'Edéa (+30 min), ralentissement travaux, remplacement roue..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
            >
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              <Send size={14} />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer l\'incident'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
