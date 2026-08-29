import React, { useState, useEffect } from 'react';
import {
  Building2,
  Package,
  Plus,
  Search,
  Filter,
  Radio,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Edit3,
  Cpu,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { RegisterParcelModal } from './RegisterParcelModal';
import { AssignTrackerModal } from './AssignTrackerModal';
import { ResolveIssueModal } from './ResolveIssueModal';
import { LiveTrackingMap } from '../map/LiveTrackingMap';

export const ParcelAgentDashboard = () => {
  const { user } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('parcels'); // 'parcels' | 'issues'

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);
  const [selectedParcelForTracker, setSelectedParcelForTracker] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [inspectParcel, setInspectParcel] = useState(null);

  const fetchStationData = async () => {
    setLoading(true);
    try {
      const [parcelsData, issuesData] = await Promise.all([
        api.getParcels({ search, status: statusFilter }),
        api.getAllIssues(),
      ]);
      setParcels(parcelsData);
      setIssues(issuesData);
      if (parcelsData.length > 0 && !inspectParcel) {
        setInspectParcel(parcelsData[0]);
      }
    } catch (err) {
      console.error('Failed to load station data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStationData();
  }, [search, statusFilter]);

  const handleUpdateStatus = async (parcelId, newStatus) => {
    try {
      await api.updateParcelStatus(parcelId, { status: newStatus });
      fetchStationData();
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const stationName = user?.stationId?.name || (user?.stationId ? 'Assigned Station' : 'All Network Stations');
  const stationCity = user?.stationId?.city || 'Douala / Intercity';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Station Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
            <Building2 size={14} />
            <span>Station-Scoped Operations Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stationName} ({stationCity})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Managing parcel counter intake, loading dispatch, incoming arrivals, and IoT trackers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStationData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            <RotateCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition"
          >
            <Plus size={16} />
            <span>Register New Parcel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Station Parcels</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{parcels.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">In Transit (GPS)</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {parcels.filter((p) => p.status === 'IN_TRANSIT').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-teal-500 uppercase tracking-wider">Arrived & Pending</span>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
            {parcels.filter((p) => p.status === 'ARRIVED').length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Station Issues</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {issues.filter((i) => i.status === 'OPEN').length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('parcels')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'parcels'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Station Parcels Inventory ({parcels.length})
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'issues'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Reported Parcel Issues ({issues.length})
        </button>
      </div>

      {/* TAB 1: PARCELS LIST */}
      {activeTab === 'parcels' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search station parcels by tracking #, sender, or recipient..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="RECEIVED">Received</option>
              <option value="LOADED">Loaded on Bus</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="ARRIVED">Arrived</option>
              <option value="DELIVERED">Delivered</option>
              <option value="MISSING">Missing</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>

          {/* Table of Parcels */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Tracking Number</th>
                    <th className="py-3.5 px-4">Route</th>
                    <th className="py-3.5 px-4">Sender / Recipient</th>
                    <th className="py-3.5 px-4">Weight</th>
                    <th className="py-3.5 px-4">IoT Tracker</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Station Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        Loading station inventory...
                      </td>
                    </tr>
                  ) : parcels.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No parcels found matching this criteria.
                      </td>
                    </tr>
                  ) : (
                    parcels.map((parcel) => (
                      <tr
                        key={parcel._id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {parcel.trackingNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {parcel.originStationId?.city} → {parcel.destinationStationId?.city}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {parcel.recipientName}
                          </div>
                          <div className="text-[10px] text-slate-400">From: {parcel.senderName}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {parcel.weightKg} kg
                        </td>
                        <td className="py-3.5 px-4">
                          {parcel.trackerId ? (
                            <button
                              onClick={() => {
                                setSelectedParcelForTracker(parcel);
                                setTrackerModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 transition"
                            >
                              <Radio size={12} className="animate-pulse" />
                              <span>{parcel.trackerId.trackerCode}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedParcelForTracker(parcel);
                                setTrackerModalOpen(true);
                              }}
                              className="text-[11px] text-slate-400 hover:text-sky-500 underline"
                            >
                              + Assign Tracker
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={parcel.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Fast status actions */}
                            {parcel.status === 'REGISTERED' && (
                              <button
                                onClick={() => handleUpdateStatus(parcel._id, 'LOADED')}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px] transition"
                              >
                                Confirm Loading
                              </button>
                            )}
                            {parcel.status === 'IN_TRANSIT' && (
                              <button
                                onClick={() => handleUpdateStatus(parcel._id, 'ARRIVED')}
                                className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-bold text-[11px] transition"
                              >
                                Confirm Arrival
                              </button>
                            )}
                            {parcel.status === 'ARRIVED' && (
                              <button
                                onClick={() => handleUpdateStatus(parcel._id, 'DELIVERED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px] transition"
                              >
                                Mark Delivered
                              </button>
                            )}

                            {/* Dropdown status changer */}
                            <select
                              value={parcel.status}
                              onChange={(e) => handleUpdateStatus(parcel._id, e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-200"
                            >
                              <option value="REGISTERED">Registered</option>
                              <option value="RECEIVED">Received</option>
                              <option value="LOADED">Loaded</option>
                              <option value="IN_TRANSIT">In Transit</option>
                              <option value="ARRIVED">Arrived</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="MISSING">Missing</option>
                              <option value="DAMAGED">Damaged</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARCEL ISSUES */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Tracking #</th>
                    <th className="py-3.5 px-4">Reporter</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Reported Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No reported issues in the queue.
                      </td>
                    </tr>
                  ) : (
                    issues.map((issue) => (
                      <tr key={issue._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {issue.trackingNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold">{issue.reporterName}</div>
                          <div className="text-[10px] text-slate-400">{issue.reporterPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {issue.issueType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300">
                          {issue.description}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(issue.reportedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              issue.status === 'RESOLVED'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {issue.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setResolveModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-800 dark:text-slate-200 transition"
                          >
                            Resolve / Update
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <RegisterParcelModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onCreated={fetchStationData}
      />

      <AssignTrackerModal
        isOpen={trackerModalOpen}
        onClose={() => setTrackerModalOpen(false)}
        parcel={selectedParcelForTracker}
        onAssigned={fetchStationData}
      />

      <ResolveIssueModal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        issue={selectedIssue}
        onResolved={fetchStationData}
      />
    </div>
  );
};
