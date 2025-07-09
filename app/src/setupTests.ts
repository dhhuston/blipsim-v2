// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: jest.fn(({ children }) => {
    // Create a container with an SVG element to simulate leaflet map rendering
    return React.createElement('div', { 'data-testid': 'map-container' }, [
      React.createElement('svg', { key: 'map-svg', 'data-testid': 'map-svg' }),
      children
    ]);
  }),
  TileLayer: jest.fn(() => null),
  Marker: jest.fn(({ children }) => children),
  Popup: jest.fn(({ children }) => children),
  Polyline: jest.fn(() => {
    // Create a path element in the document to simulate polyline rendering
    const svg = document.querySelector('svg');
    if (svg) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M0,0 L100,100');
      path.setAttribute('data-testid', 'trajectory-path');
      svg.appendChild(path);
    }
    return null;
  }),
  Circle: jest.fn(() => {
    // Create a circle element in the document to simulate circle rendering
    const svg = document.querySelector('svg');
    if (svg) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '50');
      circle.setAttribute('r', '25');
      circle.setAttribute('data-testid', 'landing-circle');
      svg.appendChild(circle);
    }
    return null;
  }),
  useMapEvents: jest.fn(() => null),
  useMap: jest.fn(() => ({
    getZoom: jest.fn(() => 10),
    getCenter: jest.fn(() => ({ lat: 0, lng: 0 })),
    setView: jest.fn(),
    fitBounds: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
}));

// Mock leaflet
jest.mock('leaflet', () => ({
  icon: jest.fn(() => ({
    iconUrl: 'mock-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })),
  Icon: jest.fn().mockImplementation((options) => ({
    options,
    iconUrl: options?.iconUrl || 'mock-icon.png',
    iconSize: options?.iconSize || [25, 41],
    iconAnchor: options?.iconAnchor || [12, 41],
    popupAnchor: options?.popupAnchor || [1, -34],
  })),
  latLngBounds: jest.fn((coordinates) => ({
    coordinates,
    extend: jest.fn(),
    isValid: jest.fn(() => true),
    toBBoxString: jest.fn(() => '0,0,1,1'),
    getCenter: jest.fn(() => ({ lat: 0, lng: 0 })),
  })),
}));
