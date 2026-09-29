import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Radio, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export const RegisterParcelModal = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [trackers, setTrackers] = useState([]);
  const [trips, setTrips] = useState([]);

  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [originStationId, setOriginStationId] = useState('');
  const [destinationStationId, setDestinationStationId] = useState('');
  const [weightKg, setWeightKg] = useState('5.0');
  const [declaredValue, setDeclaredValue] = useState('50000');
  const [description, setDescription] = useState('');
  const [trackerId, setTrackerId] = useState('');
  const [tripId, setTripId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadMeta = async () => {
      try {
        const [stRes, trkRes, tripRes] = await Promise.all([
          api.getStations(),
          api.getTrackers(),
          api.getTrips(),
        ]);
        setStations(stRes);
        setTrackers(trkRes.filter((t) => t.status === 'AVAILABLE'));
        setTrips(tripRes);

        // Default origin to agent's station
        if (user?.stationId) {
          const userStationId = user.stationId._id || user.stationId;
          setOriginStationId(userStationId);
          // Default destination to another station
          const other = stRes.find((s) => s._id !== userStationId);
          if (other) setDestinationStationId(other._id);
        } else if (stRes.length > 1) {
          setOriginStationId(stRes[0]._id);
          setDestinationStationId(stRes[1]._id);
        }
      } catch (err) {
        console.error('Failed to load form meta:', err);
      }
    };

    loadMeta();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        senderName,
        senderPhone,
        senderEmail,
        recipientName,
        recipientPhone,
        recipientAddress,
        originStationId,
        destinationStationId,
        weightKg: Number(weightKg),
        declaredValue: Number(declaredValue),
        description,
        trackerId: trackerId || null,
        tripId: tripId || null,
      };

      const newParcel = await api.createParcel(payload);
      setSuccess(`Parcel ${newParcel.trackingNumber} registered successfully!`);
      setTimeout(() => {
        onCreated();
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to register parcel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white border border-slate-300 p-6 sm:p-8 shadow-2xl text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <PackagePlus size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Enregistrer un Nouveau Colis</h3>
            <p className="text-xs text-slate-500">Prise en charge guichet avec tarification et assignation de balise IoT</p>
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
          {/* Sender & Recipient Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Informations Expéditeur
              </span>
              <div>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Nom & Prénom de l'expéditeur *"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="Téléphone expéditeur *"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="Email expéditeur (Facultatif)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Informations Destinataire
              </span>
              <div>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nom & Prénom destinataire *"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Téléphone destinataire *"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Adresse de remise / Quartier"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Stations & Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Gare de Départ *
              </label>
              <select
                value={originStationId}
                onChange={(e) => setOriginStationId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {stations.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Gare de Destination *
              </label>
              <select
                value={destinationStationId}
                onChange={(e) => setDestinationStationId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                {stations.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Weight & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Poids (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Valeur Déclarée (FCFA)
              </label>
              <input
                type="number"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description du Contenu
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pièces mécaniques, documents, vêtements, matériel informatique..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* IoT GPS Tracker Assignment (OPTIONAL) */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-1.5">
              <Radio size={16} className="text-blue-700" />
              <label className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Dispositif IoT Télémétrique GPS (Optionnel)
              </label>
            </div>
            <p className="text-[11px] text-blue-800 mb-2">
              Associez une balise active pour fournir le suivi satellite en direct sur autoroute.
            </p>
            <select
              value={trackerId}
              onChange={(e) => setTrackerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600"
            >
              <option value="">Aucune balise IoT (Suivi classique par étapes de gare)</option>
              {trackers.map((trk) => (
                <option key={trk._id} value={trk._id}>
                  {trk.trackerCode} - Batterie {trk.batteryLevel}% ({trk.deviceModel})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Send size={14} />
              <span>{loading ? 'Création en cours...' : 'Valider l\'Enregistrement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
