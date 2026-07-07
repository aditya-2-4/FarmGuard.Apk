import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ShieldAlert, History, Activity, AlertTriangle, Compass } from 'lucide-react';
import { API_URL } from '../config';


export default function LivestockMap({ token }) {
  const [livestockList, setLivestockList] = useState([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [geofenceBreaches, setGeofenceBreaches] = useState([]);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);
  const geofenceCircleRef = useRef(null);

  // Center of the farm
  const farmCenter = [38.3245, -122.6512];
  const geofenceRadiusMeters = 300; // ~300 meters

  useEffect(() => {
    fetchLivestock();
    fetchGeofenceAlerts();
    
    // Set up Leaflet map instance
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const L = window.L;
      if (!L) {
        console.error('Leaflet script not loaded on page');
        return;
      }

      // Initialize map
      const map = L.map(mapContainerRef.current).setView(farmCenter, 16);
      mapInstanceRef.current = map;

      // Add dark-mode friendly TileLayer (invert filters applied via CSS in index.css)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Draw geofence circle boundary
      const circle = L.circle(farmCenter, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.08,
        radius: geofenceRadiusMeters,
        weight: 1.5,
        dashArray: '5, 8'
      }).addTo(map);
      geofenceCircleRef.current = circle;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch list of livestock and draw markers
  useEffect(() => {
    if (livestockList.length > 0 && mapInstanceRef.current) {
      const L = window.L;
      if (!L) return;

      // Clear existing markers
      Object.keys(markersRef.current).forEach(id => {
        mapInstanceRef.current.removeLayer(markersRef.current[id]);
      });
      markersRef.current = {};

      // Draw markers for each animal
      livestockList.forEach(animal => {
        if (!animal.currentLocation) return;
        const { lat, lng } = animal.currentLocation;

        const isBreached = animal.status === 'Breached';
        const isWarning = animal.status === 'Warning (Near boundary)';
        
        const markerColor = isBreached ? '#ef4444' : isWarning ? '#fbbf24' : '#10b981';
        
        // Dynamic circular SVG marker icon
        const iconSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${markerColor}"/>
            <circle cx="12" cy="9" r="3.5" fill="black"/>
          </svg>
        `;

        const customIcon = L.divIcon({
          html: iconSvg,
          className: 'custom-leaflet-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });

        const marker = L.marker([lat, lng], { icon: customIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<strong>${animal.name}</strong><br/>Tag: ${animal.tag_id}<br/>Status: ${animal.status}`);

        markersRef.current[animal.id] = marker;
      });

      // Select first animal automatically if none selected
      if (!selectedAnimalId && livestockList.length > 0) {
        setSelectedAnimalId(livestockList[0].id);
      }
    }
  }, [livestockList]);

  // Handle selected animal change: draw path trail
  useEffect(() => {
    if (selectedAnimalId) {
      fetchLocationHistory(selectedAnimalId);
      
      // Pan map to current location of the selected animal
      const animal = livestockList.find(a => a.id === selectedAnimalId);
      if (animal && animal.currentLocation && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([animal.currentLocation.lat, animal.currentLocation.lng]);
        if (markersRef.current[selectedAnimalId]) {
          markersRef.current[selectedAnimalId].openPopup();
        }
      }
    }
  }, [selectedAnimalId, livestockList]);

  // Redraw the breadcrumb path line when history updates
  useEffect(() => {
    if (mapInstanceRef.current) {
      const L = window.L;
      if (!L) return;

      // Clear old polyline
      if (polylineRef.current) {
        mapInstanceRef.current.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      if (locationHistory.length > 0) {
        const latlngs = locationHistory.map(loc => [loc.lat, loc.lng]);
        
        // Draw path polyline
        const pathLine = L.polyline(latlngs, {
          color: '#3fa364',
          weight: 3,
          opacity: 0.8,
          dashArray: '4, 6'
        }).addTo(mapInstanceRef.current);

        polylineRef.current = pathLine;
      }
    }
  }, [locationHistory]);

  const fetchLivestock = async () => {
    try {
      const res = await fetch(`${API_URL}/api/livestock`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLivestockList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLocationHistory = async (id) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/livestock/${id}/locations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLocationHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchGeofenceAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/alerts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter alerts related to geofence breaches
        const breaches = data.filter(a => a.message.includes('Geofence') || a.message.includes('COLLAR') || a.message.includes('exited'));
        setGeofenceBreaches(breaches);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Map Panel (2/3 width) */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="bg-security-900 border border-security-800 rounded-xl p-4 shadow-xl flex-1 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-security-800">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-farm-400" />
              <span>Real-Time Geofence Map View</span>
            </h3>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-farm-500"></span> Safe</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Warning</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Breached</span>
            </div>
          </div>

          {/* Leaflet DOM container */}
          <div 
            ref={mapContainerRef} 
            className="flex-1 rounded-lg overflow-hidden border border-security-850 h-[450px]"
          />
        </div>
      </div>

      {/* Control Panel / Sidebar (1/3 width) */}
      <div className="space-y-6">
        
        {/* Tracked Animals List */}
        <div className="bg-security-900 border border-security-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-2 border-b border-security-800">
            <Activity className="w-4 h-4 text-farm-400" />
            <span>Tracked Collars</span>
          </h3>

          <div className="space-y-3">
            {livestockList.map(animal => {
              const isSelected = selectedAnimalId === animal.id;
              return (
                <button
                  key={animal.id}
                  onClick={() => setSelectedAnimalId(animal.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    isSelected 
                      ? 'bg-farm-900/20 border-farm-500 text-white shadow-inner' 
                      : 'bg-security-950/60 border-security-850 hover:bg-security-800/40 text-security-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{animal.name}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      animal.status === 'Safe'
                        ? 'bg-farm-900/60 text-farm-300'
                        : animal.status === 'Warning (Near boundary)'
                        ? 'bg-yellow-950/40 text-yellow-300'
                        : 'bg-red-950/60 text-red-300 animate-pulse'
                    }`}>
                      {animal.status}
                    </span>
                  </div>
                  <p className="text-xs text-security-400 mt-1">Collar Tag: {animal.tag_id}</p>
                  
                  {animal.currentLocation && (
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-security-400">
                      <MapPin className="w-3.5 h-3.5 text-farm-400" />
                      <span>{animal.currentLocation.lat.toFixed(5)}, {animal.currentLocation.lng.toFixed(5)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Geofence Boundary Alarm history */}
        <div className="bg-security-900 border border-security-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 pb-2 border-b border-security-800">
            <History className="w-4 h-4 text-farm-400" />
            <span>Boundary Warning Logs</span>
          </h3>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {geofenceBreaches.map(alert => (
              <div 
                key={alert.id}
                className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-red-200">{alert.message}</p>
                  <p className="text-[10px] text-security-400 mt-1">{formatTime(alert.timestamp)}</p>
                </div>
              </div>
            ))}
            {geofenceBreaches.length === 0 && (
              <div className="text-center py-6 text-security-500 text-xs">No geofence breach events recorded.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
