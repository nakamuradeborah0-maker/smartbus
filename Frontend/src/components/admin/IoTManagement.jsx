import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Search,
  Plus,
  Radio,
  Battery,
  Activity,
  X,
  Wifi,
  MapPin,
  Zap,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Signal,
  Clock
} from 'lucide-react';
import { api } from '../../api/api';

const StatusConfig = {
  AVAILABLE: {
    label: 'Disponible',
    classes: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
    dot: 'bg-emerald-600',
    icon: CheckCircle2
  },
  IN_USE: {
    label: 'En Mission',
    classes: 'bg-blue-50 text-blue-800 border border-blue-300',
    dot: 'bg-blue-600 animate-pulse',
    icon: Radio
  },
  OFFLINE: {
    label: 'Hors Ligne',
    classes: 'bg-rose-50 text-rose-800 border border-rose-300',
    dot: 'bg-rose-600',
    icon: AlertCircle
  }
};

const BatteryBar = ({ level }) => {
  const color = level < 20 ? 'bg-red-500' : level < 50 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <Battery size={14} className={level < 20 ? 'text-red-500' : level < 50 ? 'text-amber-500' : 'text-emerald-500'} />
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${level}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-8 text-right">{level}%</span>
    </div>
  );
};

export const IoTManagement = () => {
  const [trackers, setTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [trackerCode, setTrackerCode] = useState('');
  const [deviceModel, setDeviceModel] = useState('GV-GPS-4G-v2');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchTrackers = async () => {
    setLoading(true);
    try {
      const res = await api.getTrackers();
      setTrackers(res);
    } catch (err) {
      console.error('Failed to load trackers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackers();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchTrackers, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTracker = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      await api.createTracker({ trackerCode, deviceModel });
      setModalOpen(false);
      setTrackerCode('');
      fetchTrackers();
    } catch (err) {
      setModalError(err.message || 'Failed to create tracker.');
    } finally {
      setModalLoading(false);
    }
  };

  const filtered = trackers
    .filter((t) => t.trackerCode.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => statusFilter === 'ALL' || t.status === statusFilter);

  const stats = {
    total: trackers.length,
    available: trackers.filter((t) => t.status === 'AVAILABLE').length,
    inUse: trackers.filter((t) => t.status === 'IN_USE').length,
    offline: trackers.filter((t) => t.status === 'OFFLINE').length,
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Balises', value: stats.total, icon: Cpu, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Disponibles', value: stats.available, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'En Mission (Direct)', value: stats.inUse, icon: Radio, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Hors Ligne', value: stats.offline, icon: AlertCircle, color: 'text-rose-700', bg: 'bg-rose-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="p-4 rounded-xl bg-white border border-slate-300 shadow-xs flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl ${bg} border border-slate-200 flex items-center justify-center shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{value}</div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code balise (ex: GV-TRK-...)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs transition"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'ALL', label: 'Tous' },
            { id: 'AVAILABLE', label: 'Disponibles' },
            { id: 'IN_USE', label: 'En Mission' },
            { id: 'OFFLINE', label: 'Hors Ligne' }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === s.id
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchTrackers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
            title="Rafraîchir"
          >
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setModalOpen(true); setModalError(''); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition"
          >
            <Plus size={16} />
            <span>Enregistrer une Balise</span>
          </button>
        </div>
      </div>

      {/* Tracker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading && trackers.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl bg-white border border-slate-300 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-2 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-slate-200 rounded" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 bg-slate-200 rounded-xl" />
                <div className="h-8 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-slate-300 rounded-xl">
            <Cpu size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-700 font-bold text-sm">Aucun équipement IoT trouvé</p>
            <p className="text-xs text-slate-400 mt-1">Ajustez vos filtres ou associez une nouvelle balise</p>
          </div>
        ) : (
          filtered.map((tracker) => {
            const cfg = StatusConfig[tracker.status] || StatusConfig.OFFLINE;
            const hasGps = tracker.lastLatitude && tracker.lastLongitude;
            const lastPingRelative = tracker.lastPing
              ? (() => {
                  const diff = Math.floor((Date.now() - new Date(tracker.lastPing)) / 1000);
                  if (diff < 60) return `il y a ${diff}s`;
                  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}m`;
                  return `il y a ${Math.floor(diff / 3600)}h`;
                })()
              : 'Jamais';

            return (
              <div
                key={tracker._id}
                className="p-5 rounded-xl bg-white border border-slate-300 flex flex-col gap-4 shadow-xs hover:shadow-md transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <Cpu size={20} className="text-blue-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 font-mono tracking-tight text-sm">
                        {tracker.trackerCode}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {tracker.deviceModel}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cfg.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                {/* Battery */}
                <BatteryBar level={tracker.batteryLevel ?? 100} />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <Clock size={14} className="text-slate-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dernier signal</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">{lastPingRelative}</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <Activity size={14} className={tracker.status === 'IN_USE' ? 'text-blue-700' : 'text-slate-400'} />
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vitesse</div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        {tracker.lastSpeed != null ? `${tracker.lastSpeed} km/h` : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* GPS */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono border ${
                  hasGps
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>
                  {hasGps ? <Signal size={14} className="shrink-0 text-blue-700" /> : <MapPin size={14} className="shrink-0" />}
                  <span className="truncate">
                    {hasGps
                      ? `${tracker.lastLatitude.toFixed(5)}, ${tracker.lastLongitude.toFixed(5)}`
                      : 'Pas de fix satellite'
                    }
                  </span>
                  {hasGps && (
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-700 shrink-0">
                      <Zap size={10} />
                      DIRECT
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Register Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-300 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <Cpu size={24} className="text-blue-700" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Enregistrer une Balise IoT</h3>
                <p className="text-xs text-slate-500 mt-0.5">Associer un nouvel équipement GPS au réseau</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTracker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Code Balise <span className="text-slate-400 normal-case font-normal">(facultatif — généré auto si vide)</span>
                </label>
                <input
                  type="text"
                  value={trackerCode}
                  onChange={(e) => setTrackerCode(e.target.value.toUpperCase())}
                  placeholder="ex: GV-TRK-0042"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Modèle d'Équipement
                </label>
                <select
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-xs transition text-sm"
                >
                  <option value="GV-GPS-4G-v2">GV-GPS-4G-v2 (Standard 4G LTE)</option>
                  <option value="GV-LORA-TRACKER-1">GV-LORA-TRACKER-1 (Longue portée LoRa)</option>
                  <option value="GV-MINI-BLE">GV-MINI-BLE (Compact Bluetooth)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 font-bold transition text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {modalLoading ? <RotateCw size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>{modalLoading ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
