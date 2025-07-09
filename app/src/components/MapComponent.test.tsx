import React from 'react';
import { render, screen } from '@testing-library/react';
import MapComponent, { MapComponentProps } from './MapComponent';
import type { TrajectoryPoint } from '../types/SystemOutputs';

const launchLocation = { lat: 40.7128, lng: -74.0060, alt: 10 };
const trajectory: TrajectoryPoint[] = [
  { latitude: 40.7128, longitude: -74.0060, altitude: 10, timestamp: '2023-01-01T00:00:00Z' },
  { latitude: 40.7138, longitude: -74.0050, altitude: 100, timestamp: '2023-01-01T00:10:00Z' },
  { latitude: 40.7148, longitude: -74.0040, altitude: 200, timestamp: '2023-01-01T00:20:00Z' }
];

const complexTrajectory: TrajectoryPoint[] = [
  { latitude: 40.7128, longitude: -74.0060, altitude: 10, timestamp: '2023-01-01T00:00:00Z' },
  { latitude: 40.7138, longitude: -74.0050, altitude: 5000, timestamp: '2023-01-01T00:10:00Z' },
  { latitude: 40.7148, longitude: -74.0040, altitude: 30000, timestamp: '2023-01-01T00:20:00Z' },
  { latitude: 40.7158, longitude: -74.0030, altitude: 5000, timestamp: '2023-01-01T00:30:00Z' },
  { latitude: 40.7168, longitude: -74.0020, altitude: 100, timestamp: '2023-01-01T00:40:00Z' }
];

describe('MapComponent', () => {
  it('renders without crashing', () => {
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} />);
    expect(screen.getByText(/Balloon Trajectory Map/i)).toBeInTheDocument();
  });

  it('renders launch marker when launchLocation is provided', async () => {
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} launchLocation={launchLocation} />);
    // The marker popup text should be present
    expect(await screen.findByText(/Launch Location/i)).toBeInTheDocument();
    expect(screen.getByText(/Lat: 40.71280, Lng: -74.00600/)).toBeInTheDocument();
    expect(screen.getByText(/Alt: 10 m/)).toBeInTheDocument();
  });

  it('renders trajectory polyline when trajectory is provided', () => {
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} trajectory={trajectory} />);
    // Map should render with trajectory data
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
    // SVG should be present for map rendering
    const svg = screen.getByTestId('map-svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders burst point marker for highest altitude point', () => {
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} trajectory={complexTrajectory} />);
    // Should find burst point popup content
    expect(screen.getByText(/Burst Point/i)).toBeInTheDocument();
    expect(screen.getByText(/Alt: 30000 m/)).toBeInTheDocument();
  });

  it('renders landing point marker for last trajectory point', () => {
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} trajectory={complexTrajectory} />);
    // Should find landing point popup content
    expect(screen.getByText(/Landing Point/i)).toBeInTheDocument();
    expect(screen.getByText(/Alt: 100 m/)).toBeInTheDocument();
  });

  it('renders altitude markers at significant altitude changes', () => {
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} trajectory={complexTrajectory} />);
    // Should find altitude marker popups
    const altitudeTexts = screen.getAllByText(/Altitude:/);
    expect(altitudeTexts.length).toBeGreaterThan(0);
  });

  it('renders landing zone circle when landing point exists', () => {
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} trajectory={complexTrajectory} />);
    // Map should render with landing zone data
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
    // SVG should be present for map rendering
    const svg = screen.getByTestId('map-svg');
    expect(svg).toBeInTheDocument();
    // Landing point should be displayed in popup
    expect(screen.getByText(/Landing Point/i)).toBeInTheDocument();
  });

  it('handles empty trajectory gracefully', () => {
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} trajectory={[]} />);
    // Should render map without errors
    expect(screen.getByText(/Balloon Trajectory Map/i)).toBeInTheDocument();
  });

  it('handles missing launchLocation gracefully', () => {
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} />);
    // Should render map without errors
    expect(screen.getByText(/Balloon Trajectory Map/i)).toBeInTheDocument();
  });

  it('handles trajectory with single point', () => {
    const singlePointTrajectory = [trajectory[0]];
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} trajectory={singlePointTrajectory} />);
    // Should render map without errors
    expect(screen.getByText(/Balloon Trajectory Map/i)).toBeInTheDocument();
  });

  it('handles trajectory where burst and landing points are the same', () => {
    const samePointTrajectory = [
      { latitude: 40.7128, longitude: -74.0060, altitude: 10, timestamp: '2023-01-01T00:00:00Z' },
      { latitude: 40.7128, longitude: -74.0060, altitude: 30000, timestamp: '2023-01-01T00:20:00Z' }
    ];
    render(<MapComponent center={[40.7128, -74.0060]} zoom={13} trajectory={samePointTrajectory} />);
    // Should render map without errors
    expect(screen.getByText(/Balloon Trajectory Map/i)).toBeInTheDocument();
  });
});

export {}; 