// PHP-App/public/assets/js/map.js
const CARTO_API_KEY = 'cb1_43oe_1_75bd64c2f244c194ee1bc360';

function initLiveMap(containerId = 'live-fleet-map', options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Base map layers (Carto requires ?key=YOUR_API_KEY)
  const voyagerLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`, {
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19
  });

  const darkLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`, {
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19
  });

  const positronLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`, {
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19
  });

  const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18
  });

  const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  });

  // Douala to Yaounde highway center
  const map = L.map(containerId, {
    center: [3.95, 10.6],
    zoom: 8,
    layers: [voyagerLayer]
  });

  // Layer control switcher
  const baseMaps = {
    "Voyager (Carto HD)": voyagerLayer,
    "Mode Nuit (Carto)": darkLayer,
    "Clair (Carto Positron)": positronLayer,
    "Satellite (Esri)": satLayer,
    "Standard (OSM)": osmLayer
  };
  L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

  // Highway milestones
  const milestones = [
    { name: "Douala Gare Centrale Akwa", lat: 4.0511, lng: 9.7679, city: "Douala", isTerminal: true },
    { name: "Yassa Checkpoint", lat: 4.0150, lng: 9.8400, city: "Douala Sortie" },
    { name: "Edéa Pont Sanaga", lat: 3.8000, lng: 10.1333, city: "Edéa" },
    { name: "Pouma Relais", lat: 3.8500, lng: 10.5167, city: "Pouma" },
    { name: "Boumnyébel Escale", lat: 3.8667, lng: 10.8667, city: "Boumnyébel" },
    { name: "Matomb Descente", lat: 3.8833, lng: 11.0833, city: "Matomb" },
    { name: "Mbankomo Entrée", lat: 3.7800, lng: 11.3800, city: "Mbankomo" },
    { name: "Yaoundé Terminal Mvan", lat: 3.8480, lng: 11.5021, city: "Yaoundé", isTerminal: true }
  ];

  // Draw Route Polyline
  const latlngs = milestones.map(m => [m.lat, m.lng]);
  L.polyline(latlngs, { color: '#1d4ed8', weight: 4, opacity: 0.8, dashArray: '8, 8' }).addTo(map);

  // Add station markers
  milestones.forEach((m, idx) => {
    const isTerm = m.isTerminal;
    const marker = L.circleMarker([m.lat, m.lng], {
      radius: isTerm ? 9 : 5,
      fillColor: isTerm ? '#1d4ed8' : '#38bdf8',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1
    }).addTo(map);

    marker.bindPopup(`<strong>${m.name}</strong><br><span style="font-size:11px; color:#64748b;">${m.city}</span>`);
  });

  // Animated live bus marker along Douala - Yaounde
  const busIcon = L.divIcon({
    className: 'custom-bus-marker',
    html: `<div class="bus-pulsing-icon"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  const busMarker = L.marker([3.8667, 10.8667], { icon: busIcon }).addTo(map);
  busMarker.bindPopup(`<strong>Autocar VIP #LT-782-AA</strong><br><span style="color:#059669; font-weight:bold;">En Transit (74 km/h)</span><br>Liaison Douala ➔ Yaoundé`);

  // Periodic Telemetry fetch
  setInterval(async () => {
    try {
      const res = await fetch('/api/iot-ping.php');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          busMarker.setLatLng([data.latitude, data.longitude]);
          const hudSpeed = document.getElementById('hud-speed');
          const hudStop = document.getElementById('hud-stop');
          if (hudSpeed) hudSpeed.textContent = data.speed + ' km/h';
          if (hudStop) hudStop.textContent = data.current_stop;
        }
      }
    } catch (e) {}
  }, 10000);

  setTimeout(() => map.invalidateSize(), 300);
  return map;
}
