import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../api/api';
import { useLanguage } from '../../context/LanguageContext';

export const PublicIssueModal = ({ isOpen, onClose, initialTrackingNumber = '' }) => {
  const { lang } = useLanguage();
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [issueType, setIssueType] = useState('DELAYED');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.submitPublicIssue({
        trackingNumber: trackingNumber.trim().toUpperCase(),
        reporterName,
        reporterPhone,
        issueType,
        description,
      });

      setSuccessMsg(res.message || 'Issue report submitted successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setDescription('');
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit issue report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-xl bg-white border border-slate-300 p-6 sm:p-8 shadow-2xl text-slate-900">
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
            <h3 className="text-lg font-bold text-slate-900">{lang === 'fr' ? 'Signaler un Incident sur un Colis' : 'Report an Issue with a Parcel'}</h3>
            <p className="text-xs text-slate-500">{lang === 'fr' ? 'Ouverture d\'un dossier de réclamation auprès du chef de gare' : 'Open a claim / support ticket with the terminal master'}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {lang === 'fr' ? 'Numéro de Suivi *' : 'Tracking Number *'}
            </label>
            <input
              type="text"
              required
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Ex: PAR-2026-00125"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Votre Nom Complet *
              </label>
              <input
                type="text"
                required
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Nom & Prénom"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Téléphone de Contact *
              </label>
              <input
                type="tel"
                required
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="+237 6..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Catégorie de Réclamation *
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="DELAYED">Retard anormal d'acheminement</option>
              <option value="MISSING">Colis introuvable ou perdu</option>
              <option value="DAMAGED">Colis endommagé ou avarié</option>
              <option value="WRONG_LOCATION">Acheminé à la mauvaise gare</option>
              <option value="OTHER">Autre demande d'assistance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description Détaillée *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisez les circonstances de l'incident..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              <Send size={15} />
              <span>{loading ? 'Transmission...' : 'Envoyer la Réclamation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
