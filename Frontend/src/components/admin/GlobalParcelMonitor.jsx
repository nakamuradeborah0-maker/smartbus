import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Radio,
  RotateCw,
  Search,
  MapPin,
  Truck,
  Gauge,
  BatteryCharging,
  Layers,
  CheckCircle2,
  Package
} from 'lucide-react';
import { api } from '../../api/api';
import { StatusBadge } from '../common/StatusBadge';

export const GlobalParcelMonitor = () => {
  const [parcels, setParcels] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const fetchData = async () => {
    try {
      const [parcelsRes, stationsRes] = await Promise.all([
        api.getParcels(),
        api.getStations(),
      ]);
      setParcels(parcelsRes);
      setStations(stationsRes);
    } catch (err) {
      console.error('Failed to load global monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Initialize and update map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [4.7, 10.8], // Central Cameroon view
        zoom: 7,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const bounds = [];

    // Helper for custom DivIcons
    const createIcon = (html) =>
      L.divIcon({
        html,
        className: 'custom-admin-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

    // 1. Plot Station Markers
    stations.forEach((st) => {
      if (!st.latitude || !st.longitude) return;
      bounds.push([st.latitude, st.longitude]);

      const iconHtml = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border-2 border-white shadow-lg text-white font-bold text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `;

      const m = L.marker([st.latitude, st.longitude], { icon: createIcon(iconHtml) })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 font-sans">
            <span class="text-[10px] font-bold uppercase text-sky-600">${st.stationCode}</span>
            <h4 class="font-bold text-slate-900 text-xs mt-0.5">${st.name}</h4>
            <p class="text-[11px] text-slate-500">${st.city}</p>
          </div>
        `);
      markersRef.current.push(m);
    });

    // 2. Plot Active Moving Parcels with IoT Trackers
    const trackedParcels = parcels.filter(
      (p) => p.trackerId && p.trackerId.lastLatitude && p.trackerId.lastLongitude
    );

    trackedParcels.forEach((p) => {
      const lat = p.trackerId.lastLatitude;
      const lng = p.trackerId.lastLongitude;
      bounds.push([lat, lng]);

      const isInTransit = p.status === 'IN_TRANSIT';
      const iconHtml = `
        <div class="relative flex items-center justify-center">
          ${isInTransit ? '<span class="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-cyan-400 opacity-60"></span>' : ''}
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-950 border-2 border-cyan-400 shadow-xl text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          </div>
        </div>
      `;

      const m = L.marker([lat, lng], { icon: createIcon(iconHtml), zIndexOffset: 500 })
        .addTo(map)
        .bindPopup(`
          <div class="p-1.5 font-sans min-w-[160px]">
            <div class="flex items-center gap-1 text-cyan-600 font-bold text-[10px] uppercase">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span> Live IoT Signal
            </div>
            <h4 class="font-mono font-bold text-slate-900 text-xs mt-0.5">${p.trackingNumber}</h4>
            <div class="text-[10px] text-slate-500 mt-1">
              ${p.originStationId?.city || 'Douala'} → ${p.destinationStationId?.city || 'Yaoundé'}
            </div>
            <div class="mt-1 pt-1 border-t border-slate-200 text-[10px] flex justify-between text-slate-700 font-medium">
              <span>Speed: ${p.trackerId.lastSpeed || 0} km/h</span>
              <span>Bat: ${p.trackerId.batteryLevel || 100}%</span>
            </div>
          </div>
        `);

      m.on('click', () => setSelectedParcel(p));
      markersRef.current.push(m);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
    }
  }, [stations, parcels]);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm">National Fleet & Parcel Telemetry</h3>
            <p className="text-xs text-slate-400">
              Live automated GPS telemetry streaming across Cameroon transport network
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>{parcels.filter((p) => p.trackerId).length} Active GPS Trackers</span>
          </span>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
        <div ref={mapContainerRef} style={{ height: '540px', width: '100%' }} />

        {/* Floating summary drawer */}
        {selectedParcel && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-20 p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-fadeIn text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {selectedParcel.trackingNumber}
              </span>
              <StatusBadge status={selectedParcel.status} size="sm" />
            </div>

            <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Route:</span>
                <strong className="text-slate-900 dark:text-white">
                  {selectedParcel.originStationId?.city} → {selectedParcel.destinationStationId?.city}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tracker Device:</span>
                <span className="font-mono text-cyan-600 font-bold">{selectedParcel.trackerId?.trackerCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Live Speed:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedParcel.trackerId?.lastSpeed || 0} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Battery Level:</span>
                <span className="font-bold text-emerald-600">{selectedParcel.trackerId?.batteryLevel || 100}%</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedParcel(null)}
              className="mt-3 w-full py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
            >
              Close Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
