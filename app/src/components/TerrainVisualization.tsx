import React from 'react';
import { MapContainer, TileLayer, LayersControl, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const TerrainVisualization: React.FC = () => {
  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <LayersControl position="topright">
        <LayersControl.Overlay name="Elevation Contours">
          <LayerGroup>
            {/* Elevation contours layer */}
          </LayerGroup>
        </LayersControl.Overlay>
        <LayersControl.Overlay name="Terrain Features">
          <LayerGroup>
            {/* Terrain features layer */}
          </LayerGroup>
        </LayersControl.Overlay>
        <LayersControl.Overlay name="Difficulty Ratings">
          <LayerGroup>
            {/* Difficulty ratings layer */}
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  );
};

export default TerrainVisualization;
