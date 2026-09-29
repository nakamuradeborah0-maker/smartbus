import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Package,
  Layers as LayersIcon,
  Maximize2,
  Crosshair,
  Compass
} from 'lucide-react';
import { api } from '../../api/api';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../common/StatusBadge';

const CARTO_API_KEY = 'cb1_43oe_1_75bd64c2f244c194ee1bc360';

export const GlobalParcelMonitor = () => {
  const { lang } = useLanguage();
  const [parcels, setParcels] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [activeTileKey, setActiveTileKey] = useState('voyager'); // 'voyager' | 'cartoDark' | 'osm' | 'satellite'

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef([]);

  const TILE_LAYERS = useMemo(() => ({
    voyager: {
      name: "CartoDB Voyager HD",
      url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`,
      attribution: "&copy; CartoDB &copy; OpenStreetMap",
      maxZoom: 19,
    },
    cartoDark: {
      name: lang === 'fr' ? "CartoDB Sombre" : "CartoDB Dark",
      url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`,
      attribution: "&copy; CartoDB &copy; OpenStreetMap",
      maxZoom: 19,
    },
    osm: {
      name: lang === 'fr' ? "Plan Routier (OSM)" : "Road Map (OSM)",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    },
    satellite: {
      name: "Satellite HD",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri, Maxar, Earthstar Geographics",
      maxZoom: 18,
    }
  }), [lang]);

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

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [4.7, 10.8], // Central Cameroon view
        zoom: 7,
        zoomControl: false,
      });

      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

      const initialCfg = TILE_LAYERS[activeTileKey];
      const initialLayer = L.tileLayer(initialCfg.url, {
        attribution: initialCfg.attribution,
        maxZoom: initialCfg.maxZoom,
      }).addTo(map);

      tileLayerRef.current = initialLayer;
      mapInstanceRef.current = map;
    }

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  // 2. Tile layer switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const tileCfg = TILE_LAYERS[activeTileKey];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(tileCfg.url, {
      attribution: tileCfg.attribution,
      maxZoom: tileCfg.maxZoom,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [activeTileKey, TILE_LAYERS]);

  // 3. Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const bounds = [];

    const createIcon = (html, size = [34, 34], anchor = [17, 17]) =>
      L.divIcon({
        html,
        className: 'custom-admin-marker',
        iconSize: size,
        iconAnchor: anchor,
      });

    // 1. Plot Station Markers
    stations.forEach((st) => {
      if (!st.latitude || !st.longitude) return;
      bounds.push([st.latitude, st.longitude]);

      const iconHtml = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-[#0B1E36] border-2 border-white shadow-md text-white font-bold text-xs hover:scale-110 transition cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `;

      const m = L.marker([st.latitude, st.longitude], { icon: createIcon(iconHtml) })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 font-sans min-w-[160px]">
            <span class="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">${st.stationCode}</span>
            <h4 class="font-bold text-slate-900 text-xs mt-1">${st.name}</h4>
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
        <div class="relative flex items-center justify-center cursor-pointer">
          ${isInTransit ? '<span class="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-blue-500 opacity-50"></span>' : ''}
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#0B1E36] border-2 border-blue-400 shadow-xl text-blue-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          </div>
        </div>
      `;

      const m = L.marker([lat, lng], { icon: createIcon(iconHtml), zIndexOffset: 500 })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 font-sans min-w-[190px]">
            <div class="flex items-center gap-1.5 text-blue-700 font-bold text-[10px] uppercase">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
              <span>${lang === 'fr' ? 'Signal IoT en direct' : 'Live IoT Signal'}</span>
            </div>
            <h4 class="font-mono font-bold text-slate-900 text-xs mt-1">${p.trackingNumber}</h4>
            <div class="text-[10px] text-slate-600 mt-1">
              ${p.originStationId?.city || 'Douala'} → ${p.destinationStationId?.city || 'Yaoundé'}
            </div>
            <div class="mt-1.5 pt-1.5 border-t border-slate-200 text-[10px] flex justify-between text-slate-700 font-medium">
              <span>${lang === 'fr' ? 'Vitesse:' : 'Speed:'} <strong>${p.trackerId.lastSpeed || 0} km/h</strong></span>
              <span>${lang === 'fr' ? 'Bat:' : 'Bat:'} <strong class="text-emerald-700">${p.trackerId.batteryLevel || 100}%</strong></span>
            </div>
          </div>
        `);

      m.on('click', () => setSelectedParcel(p));
      markersRef.current.push(m);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
    }
  }, [stations, parcels, lang]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0B1E36] text-white shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm">
              {lang === 'fr' ? 'Télémétrie Flotte & Colis en Direct' : 'Live Fleet & Cargo Telemetry'}
            </h3>
            <p className="text-xs text-slate-300">
              {lang === 'fr'
                ? 'Flux GPS synchronisé en continu sur le corridor interurbain national'
                : 'Continuous GPS telemetry stream across national intercity transport corridors'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tile Layer Selector */}
          <div className="bg-slate-800/80 rounded-lg p-1 border border-slate-700 flex items-center gap-1 text-xs">
            {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTileKey(key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  activeTileKey === key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {cfg.name}
              </button>
            ))}
          </div>

          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-bold text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>
              {parcels.filter((p) => p.trackerId).length} {lang === 'fr' ? 'Balises GPS Actives' : 'Active GPS Trackers'}
            </span>
          </span>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition cursor-pointer"
            title={lang === 'fr' ? "Rafraîchir" : "Refresh"}
          >
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-slate-100">
        <div ref={mapContainerRef} style={{ height: '540px', width: '100%' }} />

        {/* Floating summary drawer */}
        {selectedParcel && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-20 p-5 rounded-xl bg-white border border-slate-300 shadow-2xl animate-fadeIn text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2.5">
              <span className="font-mono font-bold text-sm text-slate-900">
                {selectedParcel.trackingNumber}
              </span>
              <StatusBadge status={selectedParcel.status} size="sm" />
            </div>

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{lang === 'fr' ? 'Itinéraire:' : 'Route:'}</span>
                <strong className="text-slate-900">
                  {selectedParcel.originStationId?.city} → {selectedParcel.destinationStationId?.city}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{lang === 'fr' ? 'Balise IoT:' : 'IoT Tracker:'}</span>
                <span className="font-mono text-blue-800 font-bold">{selectedParcel.trackerId?.trackerCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{lang === 'fr' ? 'Vitesse mesurée:' : 'Measured Speed:'}</span>
                <span className="font-bold text-slate-800">{selectedParcel.trackerId?.lastSpeed || 0} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">{lang === 'fr' ? 'Niveau batterie:' : 'Battery Level:'}</span>
                <span className="font-bold text-emerald-700">{selectedParcel.trackerId?.batteryLevel || 100}%</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedParcel(null)}
              className="mt-3.5 w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold transition cursor-pointer"
            >
              {lang === 'fr' ? 'Fermer les détails' : 'Close Details'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
