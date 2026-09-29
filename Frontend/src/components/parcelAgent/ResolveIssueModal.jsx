import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Send, ShieldAlert } from 'lucide-react';
import { api } from '../../api/api';
import { useLanguage } from '../../context/LanguageContext';

export const ResolveIssueModal = ({ isOpen, onClose, issue, onResolved }) => {
  const { lang } = useLanguage();
  const [status, setStatus] = useState(issue?.status || 'RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.updateIssue(issue._id, {
        status,
        resolutionNotes,
      });
      onResolved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update issue.');
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
          <div className="w-11 h-11 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{lang === 'fr' ? 'Traitement de la Réclamation' : 'Resolve Parcel Claim'}</h3>
            <p className="text-xs text-slate-500 font-mono font-bold">{issue.trackingNumber}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Déclarant :</span>
            <strong className="text-slate-800">{issue.reporterName} ({issue.reporterPhone})</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Motif :</span>
            <span className="font-bold text-amber-700">{issue.issueType}</span>
          </div>
          <p className="text-slate-700 pt-1 border-t border-slate-200 italic">
            "{issue.description}"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Statut de Résolution Guichet
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="UNDER_INVESTIGATION">En cours d'enquête en gare</option>
              <option value="RESOLVED">Résolu (Litige clôturé avec succès)</option>
              <option value="REJECTED">Rejeté / Demande non conforme</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Observations de l'Agent de Gare *
            </label>
            <textarea
              required
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Mesures prises, colis remis ou explication apportée..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer la Résolution'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
