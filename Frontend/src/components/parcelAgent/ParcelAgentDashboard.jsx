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
  Check,
  ArrowRight
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Station Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <Building2 size={16} />
            <span>Guichet d'Exploitation Gare</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            <span>{stationName}</span> <span className="text-slate-500 font-medium">({stationCity})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enregistrement des colis en gare, dispatching chargement bus, réceptions et gestion des balises IoT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStationData}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-300 transition"
          >
            <RotateCw size={14} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Enregistrer un Colis</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Colis Gare</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{parcels.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">En Transit (GPS Actif)</span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {parcels.filter((p) => p.status === 'IN_TRANSIT').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-teal-200 shadow-2xs">
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Arrivés & En Attente</span>
          <div className="text-2xl font-black text-teal-700 mt-1">
            {parcels.filter((p) => p.status === 'ARRIVED').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Réclamations Ouvertes</span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {issues.filter((i) => i.status === 'OPEN').length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 rounded-lg p-1 mb-6 w-fit border border-slate-300">
        <button
          onClick={() => setActiveTab('parcels')}
          className={`px-5 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'parcels'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          Inventaire des Colis ({parcels.length})
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-5 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'issues'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          Incidents & Litiges ({issues.length})
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
                placeholder="Rechercher par bordereau, nom expéditeur ou destinataire..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Tous les statuts</option>
              <option value="REGISTERED">Enregistré (Registered)</option>
              <option value="RECEIVED">Réceptionné (Received)</option>
              <option value="LOADED">Chargé sur Bus (Loaded)</option>
              <option value="IN_TRANSIT">En Transit (In Transit)</option>
              <option value="ARRIVED">Arrivé en Gare (Arrived)</option>
              <option value="DELIVERED">Livré au Client (Delivered)</option>
              <option value="MISSING">Alerte Perte (Missing)</option>
              <option value="DAMAGED">Endommagé (Damaged)</option>
            </select>
          </div>

          {/* Table of Parcels */}
          <div className="rounded-xl bg-white border border-slate-300 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Bordereau #</th>
                    <th className="py-3 px-4">Itinéraire</th>
                    <th className="py-3 px-4">Expéditeur / Destinataire</th>
                    <th className="py-3 px-4">Poids</th>
                    <th className="py-3 px-4">Balise IoT</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions Guichet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        Chargement de l'inventaire gare...
                      </td>
                    </tr>
                  ) : parcels.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        Aucun colis trouvé avec ces critères.
                      </td>
                    </tr>
                  ) : (
                    parcels.map((parcel) => (
                      <tr
                        key={parcel._id}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {parcel.trackingNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span>{parcel.originStationId?.city || 'Douala'}</span>
                            <ArrowRight size={13} className="text-slate-400" />
                            <span>{parcel.destinationStationId?.city || 'Yaoundé'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {parcel.recipientName}
                          </div>
                          <div className="text-[10px] text-slate-500">De : {parcel.senderName}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {parcel.weightKg} kg
                        </td>
                        <td className="py-3 px-4">
                          {parcel.trackerId ? (
                            <button
                              onClick={() => {
                                setSelectedParcelForTracker(parcel);
                                setTrackerModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-mono text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition"
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
                              className="text-[11px] text-blue-700 font-bold hover:underline"
                            >
                              + Assigner Balise
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={parcel.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Fast status actions */}
                            {parcel.status === 'REGISTERED' && (
                              <button
                                onClick={() => handleUpdateStatus(parcel._id, 'LOADED')}
                                className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] transition"
                              >
                                Confirmer Chargement
                              </button>
                            )}
                            {parcel.status === 'IN_TRANSIT' && (
                              <button
                                onClick={() => handleUpdateStatus(parcel._id, 'ARRIVED')}
                                className="px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-[11px] transition"
                              >
                                Confirmer Arrivée
                              </button>
                            )}
                            {parcel.status === 'ARRIVED' && (
                              <button
                                onClick={() => handleUpdateStatus(parcel._id, 'DELIVERED')}
                                className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] transition"
                              >
                                Remettre au Client
                              </button>
                            )}

                            {/* Dropdown status changer */}
                            <select
                              value={parcel.status}
                              onChange={(e) => handleUpdateStatus(parcel._id, e.target.value)}
                              className="px-2 py-1 rounded-md border border-slate-300 bg-white text-[11px] text-slate-800 font-medium"
                            >
                              <option value="REGISTERED">Enregistré</option>
                              <option value="RECEIVED">Réceptionné</option>
                              <option value="LOADED">Chargé</option>
                              <option value="IN_TRANSIT">En Transit</option>
                              <option value="ARRIVED">Arrivé</option>
                              <option value="DELIVERED">Livré</option>
                              <option value="MISSING">Perdu</option>
                              <option value="DAMAGED">Endommagé</option>
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
        <div className="space-y-4 animate-fadeIn">
          <div className="rounded-xl bg-white border border-slate-300 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Bordereau #</th>
                    <th className="py-3 px-4">Déclarant</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Date de Signalement</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        Aucun litige ou incident en cours.
                      </td>
                    </tr>
                  ) : (
                    issues.map((issue) => (
                      <tr key={issue._id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {issue.trackingNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{issue.reporterName}</div>
                          <div className="text-[10px] text-slate-500">{issue.reporterPhone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-amber-700">
                            {issue.issueType}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {issue.description}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(issue.reportedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              issue.status === 'RESOLVED'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-amber-50 border-amber-300 text-amber-800'
                            }`}
                          >
                            {issue.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedIssue(issue);
                              setResolveModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold text-slate-800 transition"
                          >
                            Traiter / Clôturer
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
