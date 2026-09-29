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
  Package,
  Cpu
} from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { GlobalParcelMonitor } from './GlobalParcelMonitor';
import { UserManagement } from './UserManagement';
import { StationManagement } from './StationManagement';
import { RouteManagement } from './RouteManagement';
import { TripManagement } from './TripManagement';
import { IoTManagement } from './IoTManagement';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <Shield size={16} />
            <span>Portail d'Administration Réseau & Flotte</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Supervision Nationale & Logistique
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Gouvernance centralisée des gares routières, trajets de bus, comptes utilisateurs et télémétrie GPS en direct
          </p>
        </div>

        <button
          onClick={fetchGlobalMetrics}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 transition shadow-xs self-start md:self-auto"
        >
          <RotateCw size={14} />
          <span>Actualiser les données</span>
        </button>
      </div>

      {/* Global KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 my-6">
        <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Colis Enregistrés</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalParcels}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">En Transit (Balises GPS)</span>
          <div className="text-2xl font-black text-blue-700 mt-1 flex items-center gap-2">
            <span>{stats.inTransitGps}</span>
            <Radio size={16} className="animate-pulse text-blue-600" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Trajets Actifs</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.activeTrips}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-xs">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Gares & Hubs</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalStations}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Signalements / Réclamations</span>
          <div className="text-2xl font-black text-rose-700 mt-1">{stats.openIssues}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'monitor'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Radio size={14} />
          <span>Carte GPS Réseau Flotte</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'users'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users size={14} />
          <span>Gestion des Utilisateurs</span>
        </button>

        <button
          onClick={() => setActiveTab('stations')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'stations'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 size={14} />
          <span>Gares Routières</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'routes'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Navigation size={14} />
          <span>Lignes & Itinéraires</span>
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'trips'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Truck size={14} />
          <span>Départs & Trajets Bus</span>
        </button>

        <button
          onClick={() => setActiveTab('iot')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'iot'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Cpu size={14} />
          <span>Balises IoT GPS</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`flex items-center gap-1.5 pb-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'issues'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle size={14} />
          <span>Incidents Nationaux ({issues.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'monitor' && <GlobalParcelMonitor />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'stations' && <StationManagement />}
        {activeTab === 'routes' && <RouteManagement />}
        {activeTab === 'trips' && <TripManagement />}
        {activeTab === 'iot' && <IoTManagement />}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-300">
                    <tr>
                      <th className="py-3 px-4">N° Suivi Colis</th>
                      <th className="py-3 px-4">Déclarant</th>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Date signalement</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {issues.map((i) => (
                      <tr key={i._id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-800">
                          {i.trackingNumber}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {i.reporterName} ({i.reporterPhone})
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-700">
                          {i.issueType}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {i.description}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(i.reportedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              i.status === 'RESOLVED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {i.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedIssue(i);
                              setResolveModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-slate-800 transition"
                          >
                            Résoudre / Mettre à jour
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
