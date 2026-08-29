import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Navigation,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCw,
  AlertTriangle,
  Radio,
  Truck,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../../api/api';
import { StatusBadge } from '../common/StatusBadge';
import { LiveTrackingMap } from '../map/LiveTrackingMap';
import { PublicIssueModal } from './PublicIssueModal';

export const PublicTrackPortal = ({ onOpenAuth }) => {
  const [trackingQuery, setTrackingQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  // Default initial track load for live wow effect
  useEffect(() => {
    handleTrack('PAR-2026-00125');
  }, []);

  const handleTrack = async (trackingNum) => {
    const num = (trackingNum || trackingQuery).trim().toUpperCase();
    if (!num) return;

    setLoading(true);
    setError(null);

    try {
      const data = await api.trackParcel(num);
      if (data.found) {
        setResult(data.parcel);
        setTrackingQuery(num);
      } else {
        setError('Parcel not found. Please double-check your tracking number.');
        setResult(null);
      }
    } catch (err) {
      setError(err.message || 'Parcel not found. Please verify the tracking number.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleParcels = [
    { code: 'PAR-2026-00125', label: 'In Transit (Live GPS)', route: 'Douala → Yaoundé' },
    { code: 'PAR-2026-00126', label: 'Registered', route: 'Douala → Bafoussam' },
    { code: 'PAR-2026-00127', label: 'Delivered (No GPS)', route: 'Yaoundé → Douala' },
    { code: 'PAR-2026-00128', label: 'Loaded', route: 'Douala → Bamenda' },
    { code: 'PAR-2026-00129', label: 'Arrived', route: 'Bafoussam → Douala' },
  ];

  return (
    <div className="w-full">
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-6 shadow-inner">
            <Radio size={14} className="animate-pulse text-cyan-400" />
            <span>Real-Time IoT & Station Parcel Tracking</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white">
            Track Your Intercity Bus <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Parcels in Real-Time
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Direct public tracking across Douala, Yaoundé, Bafoussam, Bamenda, and Bertoua. Enter your parcel tracking number below — no account required.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-2xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTrack();
              }}
              className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl"
            >
              <div className="relative flex-1 flex items-center">
                <Search size={20} className="absolute left-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  placeholder="Enter Tracking Number (e.g. PAR-2026-00125)..."
                  className="w-full pl-12 pr-4 py-3.5 bg-transparent text-white placeholder:text-slate-400 text-sm sm:text-base font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition disabled:opacity-50"
              >
                {loading ? <RotateCw size={18} className="animate-spin" /> : <Navigation size={18} />}
                <span>Track Parcel</span>
              </button>
            </form>

            {/* Quick Test Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="font-medium">Quick Demo Samples:</span>
              {sampleParcels.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => handleTrack(s.code)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono transition flex items-center gap-1.5"
                >
                  <span>{s.code}</span>
                  <span className="text-[10px] text-cyan-400">({s.label})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= TRACKING RESULTS SECTION ================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-16 relative z-20">
        {loading && (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center text-center">
            <RotateCw size={36} className="animate-spin text-sky-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Searching Network Database...</h3>
            <p className="text-xs text-slate-500 mt-1">Retrieving parcel status and live GPS telemetry signal</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 shadow-xl text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
              <AlertCircle size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Parcel Not Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">{error}</p>
            <button
              onClick={() => handleTrack('PAR-2026-00125')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              <RotateCw size={14} />
              <span>Load Test Parcel PAR-2026-00125</span>
            </button>
          </div>
        )}

        {result && !loading && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition">
            {/* Header banner */}
            <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tracking Number</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {result.trackingNumber}
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.trackingNumber)}
                      title="Copy Tracking Number"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <StatusBadge status={result.status} size="lg" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Registered: {new Date(result.createdAt).toLocaleDateString()} at{' '}
                  {new Date(result.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTrack(result.trackingNumber)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <RotateCw size={14} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setIssueModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                >
                  <AlertTriangle size={14} />
                  <span>Report Issue</span>
                </button>
              </div>
            </div>

            {/* Origin & Destination Journey Card */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 items-center">
                {/* Origin */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Origin Station
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {result.originStation?.name || 'Douala Station'}
                    </h4>
                    <p className="text-xs text-slate-500">{result.originStation?.city} • {result.originStation?.address}</p>
                  </div>
                </div>

                {/* Journey Bridge / Trip */}
                <div className="text-center flex flex-col items-center justify-center border-y md:border-y-0 md:border-x border-slate-200 dark:border-slate-800 py-3 md:py-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <Truck size={16} className="text-sky-500" />
                    <span>{result.trip ? `Trip #${result.trip.tripNumber}` : 'Direct Intercity Route'}</span>
                  </div>
                  <div className="w-32 h-1 bg-slate-200 dark:bg-slate-700 rounded-full my-2 relative">
                    <div
                      className={`h-full rounded-full ${
                        result.status === 'DELIVERED'
                          ? 'w-full bg-emerald-500'
                          : result.status === 'ARRIVED'
                          ? 'w-4/5 bg-teal-500'
                          : result.status === 'IN_TRANSIT'
                          ? 'w-1/2 bg-cyan-500 animate-pulse'
                          : 'w-1/4 bg-blue-500'
                      }`}
                    ></div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Weight: <strong>{result.weightKg} kg</strong>
                  </span>
                </div>

                {/* Destination */}
                <div className="flex items-start gap-3.5 md:justify-end">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md md:order-2">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="md:text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Destination Station
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {result.destinationStation?.name || 'Yaoundé Station'}
                    </h4>
                    <p className="text-xs text-slate-500">{result.destinationStation?.city} • {result.destinationStation?.address}</p>
                  </div>
                </div>
              </div>

              {/* Description pill */}
              {result.description && (
                <div className="mt-4 px-4 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Package size={16} className="text-slate-400 shrink-0" />
                  <span><strong>Contents:</strong> {result.description}</span>
                </div>
              )}

              {/* ================= LIVE GPS MAP / NO GPS NOTICE ================= */}
              <div className="mt-8">
                {result.hasGpsTracking ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping"></span>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                          Live IoT GPS Telemetry Map
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono text-[10px] font-bold">
                          {result.trackerCode || 'Active IoT Tracker'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        Signal: 4G High-Accuracy Geo-Positioning
                      </span>
                    </div>

                    <LiveTrackingMap
                      origin={result.originStation}
                      destination={result.destinationStation}
                      currentLocation={result.currentLocation}
                      locationHistory={result.locationHistory || []}
                      height="440px"
                    />
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Info size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        GPS tracking is not available for this parcel
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1 leading-relaxed">
                        This parcel is not equipped with an optional IoT tracker device. Its current status and journey progress are verified directly by our station parcel agents at each checkpoint below.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ================= AUDIT TIMELINE ================= */}
              <div className="mt-10">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  <span>Tracking Timeline & Station Checkpoints</span>
                </h4>

                <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
                  {result.timeline && result.timeline.length > 0 ? (
                    result.timeline.map((event, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-sky-500 border-4 border-white dark:border-slate-900 shadow"></div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={event.status} size="sm" />
                          {event.stationCity && (
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              at {event.stationName || event.stationCity}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 ml-auto">
                            {new Date(event.timestamp).toLocaleDateString()} •{' '}
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {event.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-1">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">Initial registration completed.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Reliable Transportation Infrastructure
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              Intercity Bus Parcel Network
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Serving Cameroon's major economic corridors with certified station agents and optional IoT live telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-5">
                <Radio size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Optional IoT/GPS Tracking</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Parcels can be assigned high-precision IoT trackers streaming GPS coordinates, road speed, and battery health every step of the highway journey.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5">
                <Building2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Station-Scoped Dispatch</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Station Parcel Agents at Douala, Yaoundé, Bafoussam, and Bamenda confirm loading, monitor arrival queues, and handle safe customer parcel delivery.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Direct Public Tracking</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Recipients and senders track packages freely without account creation or login friction, with full protection of confidential sender data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Issue Reporting Modal */}
      <PublicIssueModal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        initialTrackingNumber={result?.trackingNumber || trackingQuery}
      />
    </div>
  );
};
