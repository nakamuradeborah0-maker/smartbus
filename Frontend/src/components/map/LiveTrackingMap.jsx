import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, BatteryCharging, Gauge, MapPin } from 'lucide-react';

export const LiveTrackingMap = ({
  origin,
  destination,
  currentLocation,
  locationHistory = [],
  height = '420px',
  interactive = true,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map
    if (!mapInstanceRef.current) {
      const defaultCenter = currentLocation
        ? [currentLocation.latitude, currentLocation.longitude]
        : origin?.latitude && origin?.longitude
        ? [origin.latitude, origin.longitude]
        : [4.0511, 9.7679]; // Douala default

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 8,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
      });

      // CartoDB Voyager modern clean tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CartoDB</a> &copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    const bounds = [];

    // Helper to create custom HTML DivIcon
    const createCustomIcon = (htmlContent, className = 'custom-map-icon') => {
      return L.divIcon({
        html: htmlContent,
        className,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    };

    // 1. Origin Marker
    if (origin && origin.latitude && origin.longitude) {
      const originLatLng = [origin.latitude, origin.longitude];
      bounds.push(originLatLng);

      const originIconHtml = `
        <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 border-2 border-white shadow-lg text-white font-bold text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `;

      const originMarker = L.marker(originLatLng, { icon: createCustomIcon(originIconHtml) })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 font-sans">
            <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Origin Station</span>
            <h4 class="font-bold text-slate-900 text-sm mt-0.5">${origin.name || origin.city}</h4>
            <p class="text-xs text-slate-500">${origin.address || ''}</p>
          </div>
        `);

      markersRef.current.push(originMarker);
    }

    // 2. Destination Marker
    if (destination && destination.latitude && destination.longitude) {
      const destLatLng = [destination.latitude, destination.longitude];
      bounds.push(destLatLng);

      const destIconHtml = `
        <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 border-2 border-white shadow-lg text-white font-bold text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
      `;

      const destMarker = L.marker(destLatLng, { icon: createCustomIcon(destIconHtml) })
        .addTo(map)
        .bindPopup(`
          <div class="p-1 font-sans">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">Destination Station</span>
            <h4 class="font-bold text-slate-900 text-sm mt-0.5">${destination.name || destination.city}</h4>
            <p class="text-xs text-slate-500">${destination.address || ''}</p>
          </div>
        `);

      markersRef.current.push(destMarker);
    }

    // 3. Route Polyline
    const pathCoordinates = [];
    if (origin?.latitude && origin?.longitude) {
      pathCoordinates.push([origin.latitude, origin.longitude]);
    }
    if (locationHistory && locationHistory.length > 0) {
      locationHistory.forEach((loc) => {
        pathCoordinates.push([loc.latitude, loc.longitude]);
        bounds.push([loc.latitude, loc.longitude]);
      });
    }
    if (currentLocation?.latitude && currentLocation?.longitude) {
      pathCoordinates.push([currentLocation.latitude, currentLocation.longitude]);
      bounds.push([currentLocation.latitude, currentLocation.longitude]);
    }
    if (destination?.latitude && destination?.longitude) {
      pathCoordinates.push([destination.latitude, destination.longitude]);
    }

    if (pathCoordinates.length >= 2) {
      polylineRef.current = L.polyline(pathCoordinates, {
        color: '#4f46e5',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);
    }

    // 4. Current Live GPS Marker
    if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
      const liveLatLng = [currentLocation.latitude, currentLocation.longitude];

      const liveIconHtml = `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-11 w-11 animate-ping rounded-full bg-cyan-400 opacity-60"></span>
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-950 border-2 border-cyan-400 shadow-2xl text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          </div>
        </div>
      `;

      const liveMarker = L.marker(liveLatLng, {
        icon: createCustomIcon(liveIconHtml, 'live-gps-icon'),
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(`
          <div class="p-1.5 font-sans">
            <div class="flex items-center gap-1.5 text-cyan-700 font-bold text-xs uppercase tracking-wider">
              <span class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span> Live IoT Signal
            </div>
            <h4 class="font-bold text-slate-900 text-sm mt-1">${currentLocation.locationName || 'In Transit'}</h4>
            <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span class="text-slate-500">Speed:</span>
                <strong class="text-slate-800 ml-1">${currentLocation.speed || 0} km/h</strong>
              </div>
              <div>
                <span class="text-slate-500">Battery:</span>
                <strong class="text-slate-800 ml-1">${currentLocation.batteryLevel || 100}%</strong>
              </div>
            </div>
            <div class="text-[10px] text-slate-400 mt-1">
              Updated: ${new Date(currentLocation.timestamp || Date.now()).toLocaleTimeString()}
            </div>
          </div>
        `);

      markersRef.current.push(liveMarker);
      liveMarker.openPopup();
    }

    // Auto-fit bounds
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }

    return () => {
      // Cleanup on unmount handled by ref
    };
  }, [origin, destination, currentLocation, locationHistory]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-10" />

      {currentLocation && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium">
          <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping"></span>
            <span>LIVE GPS</span>
          </div>
          <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex items-center gap-1">
            <Gauge size={14} className="text-slate-400" />
            <span>{currentLocation.speed || 0} km/h</span>
          </div>
          <div className="flex items-center gap-1">
            <BatteryCharging size={14} className="text-emerald-500" />
            <span>{currentLocation.batteryLevel || 100}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
