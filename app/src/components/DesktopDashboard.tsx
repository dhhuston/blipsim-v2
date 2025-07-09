import React from 'react';
import './DesktopDashboard.css';

const DesktopDashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <div className="map-panel">Map Panel</div>
      <div className="controls-panel">Controls Panel</div>
      <div className="telemetry-panel">Telemetry Panel</div>
    </div>
  );
};

export default DesktopDashboard;
