import React, { useRef, useEffect } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { TrajectoryPoint } from '../types/SystemOutputs';

interface Location {
  lat: number;
  lng: number;
  alt?: number;
}

export interface MapComponentProps {
  center: [number, number];  // [lat, lng]
  zoom: number;              // 1-18
  launchLocation?: Location;
  trajectory?: TrajectoryPoint[];
  onMapClick?: (lat: number, lng: number) => void;
}

// Custom icons for different trajectory points
const launchIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDkuNzRMMTIgMTZMMTAuOTEgOS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0iIzRDRkY1MCIvPgo8L3N2Zz4K',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const burstIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNGRjU3MjIiLz4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDkuNzRMMTIgMTZMMTAuOTEgOS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const landingIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDkuNzRMMTIgMTZMMTAuOTEgOS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0iI0ZGNzAwNzAiLz4KPC9zdmc+Cg==',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const altitudeIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNiIgY3k9IjYiIHI9IjQiIGZpbGw9IiMzRjUxQjUiLz4KPC9zdmc+Cg==',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -6]
});

const MapClickHandler: React.FC<{ onMapClick?: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

// Component to auto-fit map bounds to trajectory
const MapBoundsFitter: React.FC<{ trajectory?: TrajectoryPoint[] }> = ({ trajectory }) => {
  const map = useMap();
  
  useEffect(() => {
    if (trajectory && trajectory.length > 0) {
      const bounds = L.latLngBounds(
        trajectory.map(pt => [pt.latitude, pt.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [trajectory, map]);
  
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom,
  launchLocation,
  trajectory,
  onMapClick
}) => {
  // Polyline points for trajectory
  const polylinePositions = trajectory
    ? trajectory.map((pt) => [pt.latitude, pt.longitude] as [number, number])
    : [];

  // Find burst point (highest altitude)
  const burstPoint = trajectory && trajectory.length > 0 
    ? trajectory.reduce((max, pt) => 
        pt.altitude > max.altitude ? pt : max
      )
    : undefined;

  // Find landing point (last point)
  const landingPoint = trajectory?.[trajectory.length - 1];

  // Create altitude markers at significant points (every 5000m altitude change)
  const altitudeMarkers = trajectory?.filter((pt, index) => {
    if (index === 0) return true; // Always include first point
    const prevPoint = trajectory[index - 1];
    const altitudeDiff = Math.abs(pt.altitude - prevPoint.altitude);
    return altitudeDiff >= 5000; // Mark every 5km altitude change
  }) || [];

  return (
    <Paper elevation={3} sx={{ p: 2, m: 2, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Balloon Trajectory Map
      </Typography>
      <Box sx={{ height: 300, width: '100%', position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Launch marker */}
          {launchLocation && (
            <Marker
              position={[launchLocation.lat, launchLocation.lng]}
              icon={launchIcon}
            >
              <Popup>
                <Typography variant="subtitle1">Launch Location</Typography>
                <Typography variant="body2">
                  Lat: {launchLocation.lat.toFixed(5)}, Lng: {launchLocation.lng.toFixed(5)}
                </Typography>
                {launchLocation.alt !== undefined && (
                  <Typography variant="body2">Alt: {launchLocation.alt} m</Typography>
                )}
              </Popup>
            </Marker>
          )}

          {/* Trajectory polyline */}
          {polylinePositions.length > 1 && (
            <Polyline 
              positions={polylinePositions} 
              color="blue" 
              weight={3}
              opacity={0.8}
            />
          )}

          {/* Burst point marker */}
          {burstPoint && (
            <Marker
              position={[burstPoint.latitude, burstPoint.longitude]}
              icon={burstIcon}
            >
              <Popup>
                <Typography variant="subtitle1">Burst Point</Typography>
                <Typography variant="body2">
                  Lat: {burstPoint.latitude.toFixed(5)}, Lng: {burstPoint.longitude.toFixed(5)}
                </Typography>
                <Typography variant="body2">Alt: {burstPoint.altitude} m</Typography>
                <Typography variant="body2">Time: {new Date(burstPoint.timestamp).toLocaleTimeString()}</Typography>
              </Popup>
            </Marker>
          )}

          {/* Landing point marker */}
          {landingPoint && landingPoint !== burstPoint && (
            <Marker
              position={[landingPoint.latitude, landingPoint.longitude]}
              icon={landingIcon}
            >
              <Popup>
                <Typography variant="subtitle1">Landing Point</Typography>
                <Typography variant="body2">
                  Lat: {landingPoint.latitude.toFixed(5)}, Lng: {landingPoint.longitude.toFixed(5)}
                </Typography>
                <Typography variant="body2">Alt: {landingPoint.altitude} m</Typography>
                <Typography variant="body2">Time: {new Date(landingPoint.timestamp).toLocaleTimeString()}</Typography>
              </Popup>
            </Marker>
          )}

          {/* Altitude markers */}
          {altitudeMarkers.map((point, index) => (
            <Marker
              key={`alt-${index}`}
              position={[point.latitude, point.longitude]}
              icon={altitudeIcon}
            >
              <Popup>
                <Typography variant="body2">Altitude: {point.altitude} m</Typography>
                <Typography variant="body2">Time: {new Date(point.timestamp).toLocaleTimeString()}</Typography>
              </Popup>
            </Marker>
          ))}

          {/* Landing zone circle (if landing point exists) */}
          {landingPoint && (
            <Circle
              center={[landingPoint.latitude, landingPoint.longitude]}
              radius={1000} // 1km radius
              color="red"
              fillColor="red"
              fillOpacity={0.2}
            />
          )}

          <MapClickHandler onMapClick={onMapClick} />
          <MapBoundsFitter trajectory={trajectory} />
        </MapContainer>
      </Box>
    </Paper>
  );
};

export default MapComponent; 