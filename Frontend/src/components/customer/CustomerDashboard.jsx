import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Navigation,
  MapPin,
  Clock,
  AlertTriangle,
  RotateCw,
  Plus,
  ChevronRight,
  Radio,
  FileText
} from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { LiveTrackingMap } from '../map/LiveTrackingMap';
import { PublicIssueModal } from '../public/PublicIssueModal';

export const CustomerDashboard = ({ onNavigateTrack }) => {
  const { user } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  const fetchMyParcels = async () => {
    setLoading(true);
    try {
      const data = await api.getParcels({ search });
      setParcels(data);
      if (data.length > 0 && !selectedParcel) {
        setSelectedParcel(data[0]);
      }
    } catch (err) {
      console.error('Error fetching parcels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyParcels();
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
            <Package size={14} />
            <span>Customer Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Welcome back, {user?.name || 'Customer'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage and track your outgoing & incoming intercity bus parcels
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMyParcels}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            <RotateCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIssueModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition"
          >
            <AlertTriangle size={14} />
            <span>Report Parcel Issue</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Parcel List, Right = Selected Parcel Live Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: My Parcels */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my parcels by tracking # or recipient..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading your parcels...</div>
            ) : parcels.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                No parcels registered under your account yet.
              </div>
            ) : (
              parcels.map((parcel) => {
                const isSelected = selectedParcel?._id === parcel._id;
                return (
                  <div
                    key={parcel._id}
                    onClick={() => setSelectedParcel(parcel)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 shadow-md'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {parcel.trackingNumber}
                      </span>
                      <StatusBadge status={parcel.status} size="sm" />
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Route:</span>
                        <strong className="font-semibold text-slate-800 dark:text-slate-200">
                          {parcel.originStationId?.city || 'Douala'} → {parcel.destinationStationId?.city || 'Yaoundé'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Recipient:</span>
                        <span>{parcel.recipientName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tracking Device:</span>
                        <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                          {parcel.trackerId ? (
                            <span className="inline-flex items-center gap-1">
                              <Radio size={12} className="animate-pulse" />
                              <span>{parcel.trackerId.trackerCode} (IoT GPS)</span>
                            </span>
                          ) : (
                            'No GPS (Station Only)'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Parcel Details & Map */}
        <div className="lg:col-span-7">
          {selectedParcel ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-xl font-black text-slate-900 dark:text-white">
                      {selectedParcel.trackingNumber}
                    </h3>
                    <StatusBadge status={selectedParcel.status} size="md" />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Registered: {new Date(selectedParcel.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateTrack(selectedParcel.trackingNumber)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition"
                >
                  <Navigation size={14} />
                  <span>Public View</span>
                </button>
              </div>

              {/* Station Route Details */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Origin Station:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedParcel.originStationId?.name || 'Douala Station'}
                  </p>
                  <span className="text-[11px] text-slate-500">{selectedParcel.originStationId?.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Destination Station:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedParcel.destinationStationId?.name || 'Yaoundé Station'}
                  </p>
                  <span className="text-[11px] text-slate-500">{selectedParcel.destinationStationId?.city}</span>
                </div>
              </div>

              {/* Description & Weight */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Package Weight:</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedParcel.weightKg} kg</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Recipient Contact:</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedParcel.recipientPhone}</p>
                </div>
              </div>

              {/* Live Map or No-GPS Banner */}
              <div>
                {selectedParcel.trackerId ? (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                      <Radio size={14} className="text-cyan-500 animate-pulse" />
                      <span>Live GPS Telemetry (Highway Signal)</span>
                    </h4>
                    <LiveTrackingMap
                      origin={selectedParcel.originStationId}
                      destination={selectedParcel.destinationStationId}
                      currentLocation={
                        selectedParcel.trackerId.lastLatitude
                          ? {
                              latitude: selectedParcel.trackerId.lastLatitude,
                              longitude: selectedParcel.trackerId.lastLongitude,
                              speed: selectedParcel.trackerId.lastSpeed || 0,
                              batteryLevel: selectedParcel.trackerId.batteryLevel || 100,
                              locationName: 'Active Highway Axis',
                              timestamp: selectedParcel.trackerId.lastPing,
                            }
                          : null
                      }
                      height="300px"
                    />
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-start gap-3">
                    <FileText size={18} className="text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-200">No IoT Tracker Assigned</strong>
                      <span>This parcel uses standard station checkpoint verification. Check status updates directly above.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              Select a parcel from the left to view tracking status and live map.
            </div>
          )}
        </div>
      </div>

      <PublicIssueModal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        initialTrackingNumber={selectedParcel?.trackingNumber || ''}
      />
    </div>
  );
};
