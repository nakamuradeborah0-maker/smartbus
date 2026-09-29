import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  BatteryCharging,
  Gauge,
  MapPin,
  Layers,
  Maximize2,
  Minimize2,
  Compass,
  Bus,
  Flag,
  Crosshair,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Info,
  Radio,
  Sparkles,
  Map as MapIcon,
  ShieldAlert,
  Coffee,
  Waves,
  Landmark
} from 'lucide-react';

// Carto API Key provided by user
const CARTO_API_KEY = 'cb1_43oe_1_75bd64c2f244c194ee1bc360';

// Tile Layer configurations
const TILE_LAYERS = {
  osm: {
    name: "Plan Routier (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
  voyager: {
    name: "CartoDB Voyager HD",
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`,
    attribution: "&copy; CartoDB &copy; OpenStreetMap",
    maxZoom: 19,
  },
  satellite: {
    name: "Satellite HD",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 18,
  },
  cartoDark: {
    name: "CartoDB Sombre",
    url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${CARTO_API_KEY}`,
    attribution: "&copy; CartoDB &copy; OpenStreetMap",
    maxZoom: 19,
  },
};

// Comprehensive list of key milestones & places along the Douala - Yaoundé corridor (Axe N3)
const DEFAULT_CAMEROON_WAYPOINTS = [
  {
    id: "wp-dla-central",
    name: "Gare Centrale de Douala (Akwa)",
    city: "Douala",
    lat: 4.0511,
    lng: 9.7679,
    pk: "PK 0",
    type: "departure",
    category: "Gare Routière VIP",
    description: "Grand quai d'embarquement, guichets d'enregistrement et expédition colis VIP.",
    iconType: "station",
  },
  {
    id: "wp-yassa",
    name: "Poste de Contrôle & Péage de Yassa",
    city: "Sortie Est Douala",
    lat: 4.0153,
    lng: 9.8145,
    pk: "PK 18",
    type: "checkpoint",
    category: "Péage Autoroutier",
    description: "Sortie sud-est de la ville de Douala, début officiel de la route nationale N3.",
    iconType: "shield",
  },
  {
    id: "wp-edea",
    name: "Gare Relais & Pont sur la Sanaga",
    city: "Edéa",
    lat: 3.8007,
    lng: 10.1346,
    pk: "PK 88",
    type: "station",
    category: "Escale Technique & Fleuve",
    description: "Franchissement du fleuve Sanaga, arrêt rafraîchissements et inspection pneumatique.",
    iconType: "waves",
  },
  {
    id: "wp-pouma",
    name: "Halte Gastronomique de Pouma",
    city: "Pouma",
    lat: 3.8507,
    lng: 10.5163,
    pk: "PK 132",
    type: "stop",
    category: "Halte Voyageurs & Terroir",
    description: "Halte réputée pour ses spécialités gastronomiques locales et sa pause détente.",
    iconType: "coffee",
  },
  {
    id: "wp-boumnyebel",
    name: "Carrefour Stratégique de Boumnyébel",
    city: "Boumnyébel",
    lat: 3.8678,
    lng: 10.8657,
    pk: "PK 168",
    type: "junction",
    category: "Carrefour Régional",
    description: "Point de jonction stratégique vers la région du Centre et relais sécurité routière.",
    iconType: "compass",
  },
  {
    id: "wp-matomb",
    name: "Poste de Contrôle & Pesage de Matomb",
    city: "Matomb",
    lat: 3.8840,
    lng: 11.0498,
    pk: "PK 195",
    type: "checkpoint",
    category: "Pesage & Sécurité Forestière",
    description: "Point de contrôle routier officiel et surveillance de la vitesse.",
    iconType: "shield",
  },
  {
    id: "wp-mbankomo",
    name: "Péage Urbain de Mbankomo",
    city: "Mbankomo",
    lat: 3.7840,
    lng: 11.3837,
    pk: "PK 235",
    type: "toll",
    category: "Entrée Sud-Ouest Yaoundé",
    description: "Dernière étape autoroutière avant l'entrée dans l'agglomération de la capitale.",
    iconType: "landmark",
  },
  {
    id: "wp-yde-mvan",
    name: "Gare Terminale de Yaoundé (Mvan)",
    city: "Yaoundé",
    lat: 3.8480,
    lng: 11.5021,
    pk: "PK 250",
    type: "arrival",
    category: "Terminal d'Arrivée VIP",
    description: "Débarquement des passagers, livraison des bagages et retrait express des colis.",
    iconType: "flag",
  },
];

export const LiveTrackingMap = ({
  origin,
  destination,
  currentLocation,
  locationHistory = [],
  height = "460px",
  interactive = true,
  busPlate = "LT-782-AA",
  tripTitle = "Douala ➔ Yaoundé",
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const waypointMarkersMapRef = useRef(new Map());

  // UI state
  const [activeTileKey, setActiveTileKey] = useState("osm"); // 'osm' | 'satellite' | 'voyager'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedWaypointId, setSelectedWaypointId] = useState(null);
  const [showPlacesDrawer, setShowPlacesDrawer] = useState(true);

  // Fallback coords
  const busLat = currentLocation?.latitude || 4.015338;
  const busLng = currentLocation?.longitude || 9.814519;
  const speed = currentLocation?.speed ?? 73;
  const battery = currentLocation?.batteryLevel ?? 94;

  // Build enhanced waypoints list
  const waypoints = useMemo(() => {
    return DEFAULT_CAMEROON_WAYPOINTS.map((wp) => {
      let status = "UPCOMING";
      if (wp.type === "departure") {
        status = "PASSED";
      } else if (wp.type === "arrival") {
        status = "UPCOMING";
      } else {
        const diff = busLng - wp.lng;
        if (diff > 0.08) {
          status = "PASSED";
        } else if (Math.abs(diff) <= 0.08) {
          status = "CURRENT";
        } else {
          status = "UPCOMING";
        }
      }
      return { ...wp, status };
    });
  }, [busLng]);

  // Current nearest place
  const currentNearestPlace = useMemo(() => {
    return (
      waypoints.find((w) => w.status === "CURRENT") ||
      waypoints.find((w) => w.status === "UPCOMING") ||
      waypoints[1]
    );
  }, [waypoints]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = [busLat, busLng];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 9,
        zoomControl: false,
        attributionControl: false,
      });

      tileLayerRef.current = L.tileLayer(TILE_LAYERS[activeTileKey].url, {
        attribution: TILE_LAYERS[activeTileKey].attribution,
        maxZoom: TILE_LAYERS[activeTileKey].maxZoom,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
    };
  }, []);

  // 2. Handle Tile Layer Switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(TILE_LAYERS[activeTileKey].url, {
      attribution: TILE_LAYERS[activeTileKey].attribution,
      maxZoom: TILE_LAYERS[activeTileKey].maxZoom,
    }).addTo(mapInstanceRef.current);
  }, [activeTileKey]);

  // 3. Render Markers, Waypoints, Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    polylinesRef.current.forEach((p) => map.removeLayer(p));
    polylinesRef.current = [];
    waypointMarkersMapRef.current.clear();

    const bounds = [];

    const createDivIcon = (html, className = "custom-map-icon", size = [36, 36], anchor = [18, 18]) => {
      return L.divIcon({
        html,
        className,
        iconSize: size,
        iconAnchor: anchor,
      });
    };

    // A. Render All Places / Waypoints ("Les Endroits")
    waypoints.forEach((wp) => {
      const latLng = [wp.lat, wp.lng];
      bounds.push(latLng);

      const isPassed = wp.status === "PASSED";
      const isCurrent = wp.status === "CURRENT";

      let iconColor = isPassed
        ? "bg-slate-700 text-white"
        : isCurrent
        ? "bg-blue-600 text-white animate-pulse"
        : "bg-white text-slate-800 border-slate-300";

      let iconSvg = "";
      if (wp.iconType === "station") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`;
      } else if (wp.iconType === "waves") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
      } else if (wp.iconType === "coffee") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`;
      } else if (wp.iconType === "shield") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
      } else if (wp.iconType === "landmark") {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`;
      } else {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
      }

      const wpMarkerHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer">
          <div class="w-8 h-8 rounded-full ${iconColor} border-2 border-white shadow-md flex items-center justify-center transition-transform transform group-hover:scale-110">
            ${iconSvg}
          </div>
          <div class="mt-1 px-2 py-0.5 rounded-md bg-[#0B1E36]/90 text-white text-[10px] font-bold shadow-md border border-white/20 whitespace-nowrap flex items-center gap-1">
            <span class="text-blue-300 font-mono">${wp.pk}</span>
            <span>${wp.city}</span>
          </div>
        </div>
      `;

      const marker = L.marker(latLng, {
        icon: createDivIcon(wpMarkerHtml, "custom-place-marker", [40, 52], [20, 26]),
      }).addTo(map);

      marker.bindPopup(`
        <div class="p-4 font-sans max-w-xs text-slate-900 bg-white">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isPassed ? "bg-slate-100 text-slate-600" : isCurrent ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
            }">
              ${wp.category}
            </span>
            <span class="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              ${wp.pk}
            </span>
          </div>
          <h4 class="font-black text-slate-900 text-sm mb-1">${wp.name}</h4>
          <p class="text-xs text-slate-600 mb-3 leading-relaxed">${wp.description}</p>
          <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <span class="text-slate-500 font-medium">Statut autocar :</span>
            <strong class="font-bold ${isPassed ? "text-emerald-700" : isCurrent ? "text-blue-700 animate-pulse" : "text-slate-700"}">
              ${isPassed ? "✓ Étape franchie" : isCurrent ? "📍 En approche immédiate" : "⏱️ Étape à venir"}
            </strong>
          </div>
        </div>
      `);

      marker.on("click", () => {
        setSelectedWaypointId(wp.id);
      });

      markersRef.current.push(marker);
      waypointMarkersMapRef.current.set(wp.id, marker);
    });

    // B. Render Origin Station Pin (Douala)
    const originCoords = [origin?.latitude || 4.0511, origin?.longitude || 9.7679];
    const originIconHtml = `
      <div class="relative flex flex-col items-center cursor-pointer">
        <div class="w-10 h-10 rounded-2xl bg-blue-700 border-2 border-white shadow-xl flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div class="mt-1 px-2.5 py-1 rounded-md bg-blue-950 text-white text-[11px] font-black shadow-lg border border-blue-400/50 whitespace-nowrap">
          🏁 Départ : ${origin?.name || "Douala Akwa"}
        </div>
      </div>
    `;
    const originMarker = L.marker(originCoords, {
      icon: createDivIcon(originIconHtml, "origin-pin", [50, 60], [25, 30]),
      zIndexOffset: 800,
    }).addTo(map);
    markersRef.current.push(originMarker);

    // C. Render Destination Station Pin (Yaoundé)
    const destCoords = [destination?.latitude || 3.8480, destination?.longitude || 11.5021];
    const destIconHtml = `
      <div class="relative flex flex-col items-center cursor-pointer">
        <div class="w-10 h-10 rounded-2xl bg-emerald-700 border-2 border-white shadow-xl flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
        </div>
        <div class="mt-1 px-2.5 py-1 rounded-md bg-emerald-950 text-white text-[11px] font-black shadow-lg border border-emerald-400/50 whitespace-nowrap">
          🏁 Arrivée : ${destination?.name || "Yaoundé Mvan"}
        </div>
      </div>
    `;
    const destMarker = L.marker(destCoords, {
      icon: createDivIcon(destIconHtml, "dest-pin", [50, 60], [25, 30]),
      zIndexOffset: 800,
    }).addTo(map);
    markersRef.current.push(destMarker);

    // D. Render Route Polylines (Traveled + Remaining)
    const allRoutePoints = [
      originCoords,
      ...waypoints.slice(1, -1).map((w) => [w.lat, w.lng]),
      destCoords,
    ];

    const traveledPoints = [
      originCoords,
      ...waypoints.filter((w) => w.status === "PASSED").map((w) => [w.lat, w.lng]),
      [busLat, busLng],
    ];

    const remainingPoints = [
      [busLat, busLng],
      ...waypoints.filter((w) => w.status === "UPCOMING").map((w) => [w.lat, w.lng]),
      destCoords,
    ];

    const roadOutline = L.polyline(allRoutePoints, {
      color: "#0B1E36",
      weight: 8,
      opacity: 0.35,
    }).addTo(map);
    polylinesRef.current.push(roadOutline);

    const traveledPoly = L.polyline(traveledPoints, {
      color: "#1D4ED8",
      weight: 5,
      opacity: 0.95,
    }).addTo(map);
    polylinesRef.current.push(traveledPoly);

    const remainingPoly = L.polyline(remainingPoints, {
      color: "#2563EB",
      weight: 4,
      dashArray: "8, 10",
      opacity: 0.85,
    }).addTo(map);
    polylinesRef.current.push(remainingPoly);

    // E. Render Live Bus Marker with Radar Rings
    const liveBusHtml = `
      <div class="relative flex flex-col items-center">
        <span class="absolute -top-1 w-14 h-14 rounded-full bg-blue-500 opacity-40 animate-ping"></span>
        <span class="absolute top-1 w-10 h-10 rounded-full bg-blue-400 opacity-60 animate-pulse"></span>
        
        <div class="relative w-11 h-11 rounded-full bg-[#0B1E36] border-2 border-blue-400 shadow-2xl flex items-center justify-center text-blue-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4C2.9 6 1.9 6.8 1.6 7.8L.2 12.8c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
        </div>

        <div class="mt-1 px-2.5 py-0.5 rounded-full bg-blue-900 text-white text-[10px] font-black shadow-xl border border-blue-400 whitespace-nowrap flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Autocar ${busPlate} • ${speed} km/h</span>
        </div>
      </div>
    `;

    const busMarker = L.marker([busLat, busLng], {
      icon: createDivIcon(liveBusHtml, "live-bus-pin", [60, 65], [30, 32]),
      zIndexOffset: 1200,
    }).addTo(map);

    busMarker.bindPopup(`
      <div class="p-4 font-sans max-w-xs text-slate-900 bg-white">
        <div class="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
          <span>Position GPS Flotte en Direct</span>
        </div>
        <h4 class="font-black text-slate-900 text-base">Autocar VIP #${busPlate}</h4>
        <p class="text-xs text-slate-500 mb-3">${tripTitle} • Axe National N3</p>

        <div class="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-3">
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Vitesse Actuelle</span>
            <strong class="text-sm font-black text-blue-950 font-mono">${speed} km/h</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Batterie IoT</span>
            <strong class="text-sm font-black text-emerald-700 font-mono">${battery}%</strong>
          </div>
        </div>

        <div class="text-[11px] text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center gap-2">
          <span class="text-blue-600 text-sm">📍</span>
          <span>Proche de : <strong>${currentNearestPlace.name}</strong> (${currentNearestPlace.pk})</span>
        </div>
      </div>
    `);

    markersRef.current.push(busMarker);

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [waypoints, busLat, busLng, speed, battery, busPlate, tripTitle]);

  // Handle Fullscreen resize
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Helper Actions
  const handleFocusBus = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([busLat, busLng], 14, { duration: 1.2 });
  };

  const handleFocusOrigin = () => {
    if (!mapInstanceRef.current) return;
    const originCoords = [origin?.latitude || 4.0511, origin?.longitude || 9.7679];
    mapInstanceRef.current.flyTo(originCoords, 14, { duration: 1.2 });
  };

  const handleFocusDestination = () => {
    if (!mapInstanceRef.current) return;
    const destCoords = [destination?.latitude || 3.8480, destination?.longitude || 11.5021];
    mapInstanceRef.current.flyTo(destCoords, 14, { duration: 1.2 });
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const allBounds = waypoints.map((w) => [w.lat, w.lng]);
    mapInstanceRef.current.fitBounds(allBounds, { padding: [50, 50], maxZoom: 12 });
    setSelectedWaypointId(null);
  };

  const handleSelectWaypoint = (wp) => {
    setSelectedWaypointId(wp.id);
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([wp.lat, wp.lng], 14, { duration: 1.2 });

    const marker = waypointMarkersMapRef.current.get(wp.id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 500);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900 transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : ""
      }`}
    >
      {/* ================= TOP HUD OVERLAY ================= */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Tile Layer Switcher */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-slate-200 flex items-center gap-1 text-xs">
          {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTileKey(key)}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTileKey === key
                  ? "bg-blue-700 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100 hover:text-blue-700"
              }`}
            >
              {cfg.name}
            </button>
          ))}
        </div>

        {/* Right: Live GPS Telemetry Badge */}
        <div className="pointer-events-auto bg-[#0B1E36]/95 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-xl border border-blue-500/40 flex items-center gap-3.5 text-xs font-semibold">
          <div className="flex items-center gap-2 text-blue-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] tracking-wider uppercase font-black">GPS ACTIF</span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="flex items-center gap-1.5">
            <Gauge size={15} className="text-blue-400" />
            <span className="font-mono font-bold text-white">{speed} km/h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BatteryCharging size={15} className="text-emerald-400" />
            <span className="font-mono font-bold text-white">{battery}%</span>
          </div>
          <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-300 text-[11px]">
            <MapPin size={13} className="text-amber-400" />
            <span>À prox. de : <strong className="text-white">{currentNearestPlace.city}</strong></span>
          </div>
        </div>
      </div>

      {/* ================= LEAFLET MAP CANVAS ================= */}
      <div
        ref={mapContainerRef}
        style={{ height: isFullscreen ? "calc(100vh - 140px)" : height, width: "100%" }}
        className="z-10"
      />

      {/* ================= FLOATING ACTION SHORTCUTS (BOTTOM-RIGHT) ================= */}
      <div className="absolute right-3.5 bottom-28 sm:bottom-24 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          title={isFullscreen ? "Quitter Plein Écran" : "Plein Écran"}
          className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-800 shadow-xl border border-slate-300 flex items-center justify-center transition cursor-pointer"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        {/* Center on Live Bus */}
        <button
          type="button"
          onClick={handleFocusBus}
          title="Centrer sur le Bus en direct"
          className="w-10 h-10 rounded-xl bg-blue-700 hover:bg-blue-800 text-white shadow-xl border border-blue-500 flex items-center justify-center transition cursor-pointer"
        >
          <Crosshair size={18} />
        </button>

        {/* Fit Full Route Bounds */}
        <button
          type="button"
          onClick={handleFitAll}
          title="Vue globale du trajet (Douala - Yaoundé)"
          className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-800 shadow-xl border border-slate-300 flex items-center justify-center transition cursor-pointer"
        >
          <MapIcon size={18} />
        </button>

        {/* Zoom In & Zoom Out */}
        <div className="flex flex-col bg-white rounded-xl shadow-xl border border-slate-300 overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom Avant"
            className="w-10 h-9 hover:bg-slate-100 text-slate-800 flex items-center justify-center transition border-b border-slate-200 cursor-pointer"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Arrière"
            className="w-10 h-9 hover:bg-slate-100 text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <ZoomOut size={16} />
          </button>
        </div>
      </div>

      {/* ================= PLACES & MILESTONES INTERFACE ("LES ENDROITS") ================= */}
      <div className="relative z-20 bg-white border-t border-slate-200 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Compass size={14} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Guide des Endroits & Étapes de la Ligne ({waypoints.length} étapes)
            </h4>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              • Cliquez sur une ville pour centrer la carte
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFocusOrigin}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
            >
              🚩 Douala
            </button>
            <button
              type="button"
              onClick={handleFocusDestination}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
            >
              🏁 Yaoundé
            </button>
            <button
              type="button"
              onClick={() => setShowPlacesDrawer((prev) => !prev)}
              className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition cursor-pointer"
            >
              {showPlacesDrawer ? "Masquer" : "Afficher"}
            </button>
          </div>
        </div>

        {/* Horizontal Carousel of Places */}
        {showPlacesDrawer && (
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-1 scrollbar-thin">
            {waypoints.map((wp) => {
              const isSelected = selectedWaypointId === wp.id;
              const isPassed = wp.status === "PASSED";
              const isCurrent = wp.status === "CURRENT";

              return (
                <div
                  key={wp.id}
                  onClick={() => handleSelectWaypoint(wp)}
                  className={`shrink-0 w-52 sm:w-56 p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20"
                      : isCurrent
                      ? "border-blue-400 bg-blue-50/40 shadow-xs"
                      : "border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-white border border-slate-200 text-blue-700">
                        {wp.pk}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isPassed
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCurrent
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isPassed ? '✓ Franchi' : isCurrent ? '📍 Position Bus' : '⏱️ À venir'}
                      </span>
                    </div>

                    <h5 className="font-black text-xs text-slate-900 line-clamp-1">{wp.city}</h5>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{wp.name}</p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{wp.category}</span>
                    <span className="font-bold text-blue-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                      Voir ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
