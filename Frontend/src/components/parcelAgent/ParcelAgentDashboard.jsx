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
  ArrowRight,
  Eye,
  Navigation
} from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';
import { RegisterParcelModal } from './RegisterParcelModal';
import { AssignTrackerModal } from './AssignTrackerModal';
import { ResolveIssueModal } from './ResolveIssueModal';
import { LiveTrackingMap } from '../map/LiveTrackingMap';

export const ParcelAgentDashboard = () => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [parcels, setParcels] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('parcels'); // 'parcels' | 'map' | 'issues'

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

  const stationName = user?.stationId?.name || (user?.stationId ? (lang === 'fr' ? 'Gare Assignée' : 'Assigned Terminal') : (lang === 'fr' ? 'Toutes les Gares Réseau' : 'All Network Stations'));
  const stationCity = user?.stationId?.city || 'Douala / Intercity';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Station Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <Building2 size={16} />
            <span>{t('agent.title', 'Console Agent de Fret & Colis')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            <span>{stationName}</span> <span className="text-slate-500 font-medium">({stationCity})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('agent.subtitle', 'Gestion des réceptions, affectation des balises IoT et résolution des réclamations.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStationData}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-300 transition cursor-pointer"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{lang === 'fr' ? 'Actualiser' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus size={16} />
            <span>{t('agent.registerParcel', 'Enregistrer un Colis')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-xl bg-white border border-slate-300 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {lang === 'fr' ? 'Total Colis Gare' : 'Total Station Cargo'}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{parcels.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
            {lang === 'fr' ? 'En Transit (GPS Actif)' : 'In Transit (Live GPS)'}
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {parcels.filter((p) => p.status === 'IN_TRANSIT').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-teal-200 shadow-2xs">
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
            {lang === 'fr' ? 'Arrivés & En Attente' : 'Arrived & Awaiting Pickup'}
          </span>
          <div className="text-2xl font-black text-teal-700 mt-1">
            {parcels.filter((p) => p.status === 'ARRIVED').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            {lang === 'fr' ? 'Réclamations Ouvertes' : 'Open Claims'}
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {issues.filter((i) => i.status === 'OPEN').length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 rounded-lg p-1 mb-6 w-fit border border-slate-300">
        <button
          onClick={() => setActiveTab('parcels')}
          className={`px-5 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'parcels'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          <Package size={15} />
          <span>{t('agent.tabParcels', 'Inventaire des Colis')} ({parcels.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-5 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'map'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          <Radio size={15} className={activeTab === 'map' ? 'animate-pulse text-blue-700' : ''} />
          <span>{lang === 'fr' ? 'Carte de Suivi en Direct' : 'Live Fleet Tracking Map'}</span>
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-5 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'issues'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:text-blue-700 hover:bg-white/60'
          }`}
        >
          <AlertTriangle size={15} />
          <span>{t('agent.tabIssues', 'Incidents & Litiges')} ({issues.length})</span>
        </button>
      </div>

      {/* TAB 1: PARCELS LIST */}
      {activeTab === 'parcels' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('agent.searchPlaceholder', 'Rechercher par bordereau, nom expéditeur ou destinataire...')}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">{lang === 'fr' ? 'Tous les statuts' : 'All Statuses'}</option>
              <option value="REGISTERED">{lang === 'fr' ? 'Enregistré' : 'Registered'}</option>
              <option value="RECEIVED">{lang === 'fr' ? 'Réceptionné' : 'Received'}</option>
              <option value="LOADED">{lang === 'fr' ? 'Chargé' : 'Loaded'}</option>
              <option value="IN_TRANSIT">{lang === 'fr' ? 'En Transit' : 'In Transit'}</option>
              <option value="ARRIVED">{lang === 'fr' ? 'Arrivé en Gare' : 'Arrived'}</option>
              <option value="DELIVERED">{lang === 'fr' ? 'Livré au Client' : 'Delivered'}</option>
              <option value="MISSING">{lang === 'fr' ? 'Alerte Perte' : 'Missing Alert'}</option>
              <option value="DAMAGED">{lang === 'fr' ? 'Endommagé' : 'Damaged'}</option>
            </select>
          </div>

          {/* Table of Parcels */}
          <div className="rounded-xl bg-white border border-slate-300 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Bordereau #' : 'Tracking #'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Itinéraire' : 'Route'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Expéditeur / Destinataire' : 'Sender / Recipient'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Poids' : 'Weight'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Balise IoT' : 'IoT Tracker'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{lang === 'fr' ? 'Actions Guichet' : 'Terminal Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        {lang === "fr" ? "Chargement de l'inventaire gare..." : "Loading station inventory..."}
                      </td>
                    </tr>
                  ) : parcels.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        {lang === 'fr' ? 'Aucun colis trouvé avec ces critères.' : 'No cargo found matching criteria.'}
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
                          <div className="text-[10px] text-slate-500">
                            {lang === 'fr' ? 'De :' : 'From:'} {parcel.senderName}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {parcel.weightKg} kg
                        </td>
                        <td className="py-3 px-4">
                          {parcel.trackerId ? (
                            <button
                              onClick={() => {
                                setInspectParcel(parcel);
                                setActiveTab('map');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-mono text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                              title={lang === 'fr' ? "Voir sur carte" : "View on map"}
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
                              className="text-[11px] text-blue-700 font-bold hover:underline cursor-pointer"
                            >
                              + {lang === 'fr' ? 'Assigner Balise' : 'Assign Tracker'}
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
                                className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] transition cursor-pointer"
                              >
                                {lang === 'fr' ? 'Confirmer Chargement' : 'Confirm Load'}
                              </button>
                            )}
                            {parcel.status === 'IN_TRANSIT' && (
                              <button
                                onClick={() => handleUpdateStatus(parcel._id, 'ARRIVED')}
                                className="px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-[11px] transition cursor-pointer"
                              >
                                {lang === 'fr' ? 'Confirmer Arrivée' : 'Confirm Arrival'}
                              </button>
                            )}
                            {parcel.status === 'ARRIVED' && (
                              <button
                                onClick={() => handleUpdateStatus(parcel._id, 'DELIVERED')}
                                className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] transition cursor-pointer"
                              >
                                {lang === 'fr' ? 'Remettre au Client' : 'Deliver to Client'}
                              </button>
                            )}

                            {/* Dropdown status changer */}
                            <select
                              value={parcel.status}
                              onChange={(e) => handleUpdateStatus(parcel._id, e.target.value)}
                              className="px-2 py-1 rounded-md border border-slate-300 bg-white text-[11px] text-slate-800 font-medium"
                            >
                              <option value="REGISTERED">{lang === 'fr' ? 'Enregistré' : 'Registered'}</option>
                              <option value="RECEIVED">{lang === 'fr' ? 'Réceptionné' : 'Received'}</option>
                              <option value="LOADED">{lang === 'fr' ? 'Chargé' : 'Loaded'}</option>
                              <option value="IN_TRANSIT">{lang === 'fr' ? 'En Transit' : 'In Transit'}</option>
                              <option value="ARRIVED">{lang === 'fr' ? 'Arrivé' : 'Arrived'}</option>
                              <option value="DELIVERED">{lang === 'fr' ? 'Livré' : 'Delivered'}</option>
                              <option value="MISSING">{lang === 'fr' ? 'Perdu' : 'Missing'}</option>
                              <option value="DAMAGED">{lang === 'fr' ? 'Endommagé' : 'Damaged'}</option>
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

      {/* TAB 2: LIVE MAP INSPECTION */}
      {activeTab === 'map' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-blue-700 animate-pulse" />
              <div>
                <strong className="text-blue-950 font-bold block">
                  {lang === 'fr' ? 'Supervision Cartographique en Gare' : 'Station Live Map Supervision'}
                </strong>
                <span className="text-blue-700 text-[11px]">
                  {inspectParcel
                    ? `${inspectParcel.trackingNumber} (${inspectParcel.originStationId?.city || 'Douala'} ➔ ${inspectParcel.destinationStationId?.city || 'Yaoundé'})`
                    : (lang === 'fr' ? 'Sélectionnez un colis pour afficher la télémétrie' : 'Select a cargo item to view direct telemetry')}
                </span>
              </div>
            </div>
            {inspectParcel?.trackerId && (
              <span className="font-mono text-xs font-bold bg-white text-blue-700 border border-blue-300 px-3 py-1 rounded-md">
                IoT #{inspectParcel.trackerId.trackerCode}
              </span>
            )}
          </div>

          <LiveTrackingMap
            origin={inspectParcel?.originStationId || { name: 'Douala Akwa', city: 'Douala', latitude: 4.0511, longitude: 9.7679 }}
            destination={inspectParcel?.destinationStationId || { name: 'Yaoundé Mvan', city: 'Yaoundé', latitude: 3.8480, longitude: 11.5021 }}
            currentLocation={{
              latitude: inspectParcel?.trackerId?.lastLatitude || 4.015338,
              longitude: inspectParcel?.trackerId?.lastLongitude || 9.814519,
              speed: inspectParcel?.trackerId?.lastSpeed || 73,
              batteryLevel: inspectParcel?.trackerId?.batteryLevel || 94,
              locationName: 'Sortie Yassa (PK 18)'
            }}
            height="520px"
            busPlate="LT-782-AA"
            tripTitle={`${inspectParcel?.originStationId?.city || 'Douala'} ➔ ${inspectParcel?.destinationStationId?.city || 'Yaoundé'}`}
          />
        </div>
      )}

      {/* TAB 3: PARCEL ISSUES */}
      {activeTab === 'issues' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="rounded-xl bg-white border border-slate-300 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Bordereau #' : 'Tracking #'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Déclarant' : 'Reporter'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Catégorie' : 'Category'}</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Date de Signalement' : 'Reported Date'}</th>
                    <th className="py-3 px-4">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        {lang === 'fr' ? 'Aucun litige ou incident en cours.' : 'No active claims or disputes.'}
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
                            className="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold text-slate-800 transition cursor-pointer"
                          >
                            {lang === 'fr' ? 'Traiter / Clôturer' : 'Process / Resolve'}
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
