import React, { useState, useEffect } from 'react';
import {
  Shield,
  Radio,
  Users,
  Building2,
  Navigation,
  Truck,
  AlertTriangle,
  RotateCw,
  Layers,
  CheckCircle2,
  Package
} from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { GlobalParcelMonitor } from './GlobalParcelMonitor';
import { UserManagement } from './UserManagement';
import { StationManagement } from './StationManagement';
import { RouteManagement } from './RouteManagement';
import { TripManagement } from './TripManagement';
import { ResolveIssueModal } from '../parcelAgent/ResolveIssueModal';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'users' | 'stations' | 'routes' | 'trips' | 'issues'
  const [stats, setStats] = useState({
    totalParcels: 0,
    inTransitGps: 0,
    activeTrips: 0,
    totalStations: 0,
    openIssues: 0,
  });
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);

  const fetchGlobalMetrics = async () => {
    try {
      const [parcels, trips, stations, allIssues] = await Promise.all([
        api.getParcels(),
        api.getTrips(),
        api.getStations(),
        api.getAllIssues(),
      ]);

      setIssues(allIssues);
      setStats({
        totalParcels: parcels.length,
        inTransitGps: parcels.filter((p) => p.status === 'IN_TRANSIT' && p.trackerId).length,
        activeTrips: trips.filter((t) => t.status === 'IN_TRANSIT' || t.status === 'SCHEDULED').length,
        totalStations: stations.length,
        openIssues: allIssues.filter((i) => i.status === 'OPEN').length,
      });
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    }
  };

  useEffect(() => {
    fetchGlobalMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <Shield size={14} />
            <span>Administrator Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Global Transit & Logistics Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized governance of user roles, station hubs, routes, bus schedules, and nationwide GPS parcel tracking
          </p>
        </div>

        <button
          onClick={fetchGlobalMetrics}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition self-start md:self-auto"
        >
          <RotateCw size={14} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Global KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Parcels</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.totalParcels}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-cyan-500 uppercase tracking-wider">In Transit (GPS)</span>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1 flex items-center gap-2">
            <span>{stats.inTransitGps}</span>
            <Radio size={16} className="animate-pulse text-cyan-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Active Trips</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.activeTrips}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Station Hubs</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stats.totalStations}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Open Inquiries</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.openIssues}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'monitor'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Radio size={14} />
          <span>Live GPS Fleet Map</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'users'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users size={14} />
          <span>Manage Users</span>
        </button>

        <button
          onClick={() => setActiveTab('stations')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'stations'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Building2 size={14} />
          <span>Manage Stations</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'routes'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Navigation size={14} />
          <span>Manage Routes</span>
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'trips'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Truck size={14} />
          <span>Manage Trips</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'issues'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <AlertTriangle size={14} />
          <span>Global Issues ({issues.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'monitor' && <GlobalParcelMonitor />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'stations' && <StationManagement />}
        {activeTab === 'routes' && <RouteManagement />}
        {activeTab === 'trips' && <TripManagement />}
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
                      <th className="py-3.5 px-4">Reported</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {issues.map((i) => (
                      <tr key={i._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {i.trackingNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {i.reporterName} ({i.reporterPhone})
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">
                          {i.issueType}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {i.description}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(i.reportedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              i.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {i.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedIssue(i);
                              setResolveModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-semibold"
                          >
                            Resolve / Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <ResolveIssueModal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        issue={selectedIssue}
        onResolved={fetchGlobalMetrics}
      />
    </div>
  );
};
