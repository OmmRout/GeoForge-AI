import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TelemetryFrame, DetectionSummary, Waypoint } from '../types';
import { Navigation, Target, AlertTriangle, Crosshair, Flame, Layers } from 'lucide-react';
import { formatCoords } from '../utils/formatters';

// Custom SVG Leaflet Icons to prevent broken PNG marker asset issues
const createDroneIcon = (heading: number) => {
  return L.divIcon({
    className: 'custom-drone-icon',
    html: `
      <div style="transform: rotate(${heading}deg); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; position: relative;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; border: 2px solid rgba(6, 182, 212, 0.4); animation: pulse-radar 2s infinite;"></div>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#06B6D4" stroke="#080C14" stroke-width="1.5">
          <polygon points="12 2 19 21 12 17 5 21 12 2"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const createTargetIcon = (category: string, threat: string) => {
  const color = threat === 'CRITICAL' ? '#EF4444' : threat === 'HIGH' ? '#F59E0B' : '#06B6D4';
  return L.divIcon({
    className: 'custom-target-icon',
    html: `
      <div style="width: 24px; height: 24px; border-radius: 50%; background: ${color}33; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${color}88;">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createWaypointIcon = (id: number, reached: boolean) => {
  const bg = reached ? '#10B981' : '#64748B';
  return L.divIcon({
    className: 'custom-wp-icon',
    html: `
      <div style="width: 20px; height: 20px; border-radius: 4px; background: #0F172A; border: 1.5px solid ${bg}; color: ${bg}; font-family: monospace; font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center;">
        ${id}
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Component to smoothly pan the map when drone moves
function MapRecenter({ lat, lon, active }: { lat: number; lon: number; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active) {
      map.panTo([lat, lon], { animate: true, duration: 1 });
    }
  }, [lat, lon, active, map]);
  return null;
}

interface TacticalMapProps {
  telemetry: TelemetryFrame | null;
  detections: DetectionSummary | null;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({ telemetry, detections }) => {
  const [autoCenter, setAutoCenter] = useState<boolean>(true);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'topo' | 'osm'>('satellite');
  const [trail, setTrail] = useState<[number, number][]>([]);

  // Default coordinate if telemetry not ready
  const currentLat = telemetry?.gps.latitude || 32.3716;
  const currentLon = telemetry?.gps.longitude || 77.2466;
  const heading = telemetry?.attitude.heading_deg || 0;

  useEffect(() => {
    if (telemetry) {
      setTrail((prev) => {
        const next = [...prev, [telemetry.gps.latitude, telemetry.gps.longitude] as [number, number]];
        return next.slice(-40); // keep last 40 points
      });
    }
  }, [telemetry?.gps.latitude, telemetry?.gps.longitude]);

  // Predefined operational waypoints
  const waypoints: Waypoint[] = [
    { id: 1, name: 'WP-1 Base Camp', latitude: 32.3716, longitude: 77.2466, altitude_m: 120, action: 'LAUNCH', reached: true },
    { id: 2, name: 'WP-2 East Ridge Crest', latitude: 32.3748, longitude: 77.2510, altitude_m: 160, action: 'SURVEIL', reached: true },
    { id: 3, name: 'WP-3 Glacier Moraine', latitude: 32.3792, longitude: 77.2538, altitude_m: 180, action: 'SCAN', reached: false },
    { id: 4, name: 'WP-4 Escarpment Hazard', latitude: 32.3820, longitude: 77.2490, altitude_m: 210, action: 'STANDOFF', reached: false },
    { id: 5, name: 'WP-5 South Pass', latitude: 32.3760, longitude: 77.2425, altitude_m: 150, action: 'PATROL', reached: false }
  ];

  const wpCoords: [number, number][] = waypoints.map(w => [w.latitude, w.longitude]);

  // Operational Geofence Boundary Polygon
  const geofencePolygon: [number, number][] = [
    [32.368, 77.238],
    [32.386, 77.242],
    [32.388, 77.260],
    [32.370, 77.262],
  ];

  // 100% Free Public Tile Providers with NO API Key & NO Watermarks
  const getTileConfig = () => {
    switch (mapLayer) {
      case 'topo':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri &mdash; National Geographic, DeLorme, NAVTEQ, USGS'
        };
      case 'osm':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors'
        };
      case 'satellite':
      default:
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; Esri, Maxar, Earthstar Geographics'
        };
    }
  };

  const tileConfig = getTileConfig();

  const cycleLayer = () => {
    if (mapLayer === 'satellite') setMapLayer('topo');
    else if (mapLayer === 'topo') setMapLayer('osm');
    else setMapLayer('satellite');
  };

  return (
    <div className="tactical-card rounded-xl border border-slate-800 flex flex-col h-full overflow-hidden relative min-h-[300px]">
      {/* Map Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs z-10">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span className="font-mono-hud font-semibold text-slate-200">TACTICAL GPS GEO-MAP</span>
          <span className="text-[10px] font-mono-hud text-slate-400 hidden sm:inline">
            ROHTANG CORRIDOR (HIMALAYAS)
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={cycleLayer}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono-hud bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer transition shadow-sm"
            title="Cycle between Satellite, Topo, and OpenStreetMap"
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            <span className="capitalize">{mapLayer === 'satellite' ? '🛰️ Satellite' : mapLayer === 'topo' ? '🏔️ Topo Terrain' : '🗺️ OpenStreetMap'}</span>
          </button>

          <button
            onClick={() => setAutoCenter(!autoCenter)}
            className={`px-2 py-1 rounded text-[11px] font-mono-hud transition cursor-pointer ${
              autoCenter ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Auto-Follow: {autoCenter ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Leaflet Map */}
      <div className="relative flex-1 w-full h-full min-h-[280px]">
        <MapContainer
          key={mapLayer}
          center={[currentLat, currentLon]}
          zoom={15}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution={tileConfig.attribution}
            url={tileConfig.url}
          />

          <MapRecenter lat={currentLat} lon={currentLon} active={autoCenter} />

          {/* Geofence Boundary */}
          <Polygon
            positions={geofencePolygon}
            pathOptions={{
              color: '#06B6D4',
              weight: 1.5,
              dashArray: '6, 6',
              fillColor: '#06B6D4',
              fillOpacity: 0.05
            }}
          />

          {/* Planned Flight Path */}
          <Polyline
            positions={wpCoords}
            pathOptions={{
              color: '#38BDF8',
              weight: 2,
              dashArray: '4, 4',
              opacity: 0.6
            }}
          />

          {/* Real-time Drone Flight Trail */}
          <Polyline
            positions={trail}
            pathOptions={{
              color: '#06B6D4',
              weight: 3,
              opacity: 0.9
            }}
          />

          {/* Drone Location Marker */}
          <Marker
            position={[currentLat, currentLon]}
            icon={createDroneIcon(heading)}
          >
            <Popup>
              <div className="text-xs p-1 font-mono-hud text-slate-900">
                <strong>{telemetry?.drone_name || 'GF-FALCON-01'}</strong><br />
                Alt: {telemetry?.gps.altitude_agl_m.toFixed(0)}m AGL<br />
                Speed: {telemetry?.speed_kmh.toFixed(1)} km/h<br />
                Coords: {formatCoords(currentLat, currentLon)}
              </div>
            </Popup>
          </Marker>

          {/* Waypoint Markers */}
          {waypoints.map((wp) => (
            <Marker
              key={wp.id}
              position={[wp.latitude, wp.longitude]}
              icon={createWaypointIcon(wp.id, wp.reached)}
            >
              <Popup>
                <div className="text-xs font-mono-hud text-slate-900">
                  <strong>{wp.name}</strong><br />
                  Target Alt: {wp.altitude_m}m<br />
                  Status: {wp.reached ? 'REACHED' : 'PENDING'}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* AI Detected Targets on Map */}
          {detections?.detections.map((tgt) => {
            if (!tgt.estimated_gps_lat || !tgt.estimated_gps_lon) return null;
            return (
              <Marker
                key={tgt.id}
                position={[tgt.estimated_gps_lat, tgt.estimated_gps_lon]}
                icon={createTargetIcon(tgt.category, tgt.threat_level)}
              >
                <Popup>
                  <div className="text-xs font-mono-hud text-slate-900">
                    <strong>{tgt.label}</strong><br />
                    Threat: <span className="text-red-600 font-bold">{tgt.threat_level}</span><br />
                    Distance: {tgt.distance_estimate_m}m<br />
                    Conf: {(tgt.confidence * 100).toFixed(0)}%
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Tactical Legend Box */}
        <div className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono-hud text-slate-300 z-[1000] space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>Drone / Live Trail</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Critical Target (SAR / Fire)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Hazard Fissure / Geological</span>
          </div>
        </div>
      </div>
    </div>
  );
};
