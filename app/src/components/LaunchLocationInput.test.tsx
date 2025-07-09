import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LaunchLocationInput, { LaunchLocationInputProps } from './LaunchLocationInput';

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  useMapEvents: () => ({})
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn()
};
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// Mock fetch for geocoding
global.fetch = jest.fn();

describe('LaunchLocationInput', () => {
  const mockOnChange = jest.fn();
  const mockOnMapClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGeolocation.getCurrentPosition.mockClear();
  });

  it('renders without crashing', () => {
    render(<LaunchLocationInput />);
    expect(screen.getByRole('heading', { name: /Launch Location/i })).toBeInTheDocument();
  });

  it('renders coordinate input fields', () => {
    render(<LaunchLocationInput />);
    expect(screen.getByLabelText(/Latitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Longitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Altitude/i)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<LaunchLocationInput />);
    expect(screen.getByText(/Use Current Location/i)).toBeInTheDocument();
    expect(screen.getByText(/Show Map/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear/i)).toBeInTheDocument();
  });

  it('validates latitude input', async () => {
    render(<LaunchLocationInput onChange={mockOnChange} />);
    const latInput = screen.getByLabelText(/Latitude/i);
    
    // Test invalid latitude
    await userEvent.type(latInput, '100');
    expect(screen.getByText(/Latitude must be between -90 and 90/i)).toBeInTheDocument();
    
    // Test valid latitude
    await userEvent.clear(latInput);
    await userEvent.type(latInput, '40.7128');
    expect(screen.queryByText(/Latitude must be between -90 and 90/i)).not.toBeInTheDocument();
  });

  it('validates longitude input', async () => {
    render(<LaunchLocationInput onChange={mockOnChange} />);
    const lngInput = screen.getByLabelText(/Longitude/i);
    
    // Test invalid longitude
    await userEvent.type(lngInput, '200');
    expect(screen.getByText(/Longitude must be between -180 and 180/i)).toBeInTheDocument();
    
    // Test valid longitude
    await userEvent.clear(lngInput);
    await userEvent.type(lngInput, '-74.0060');
    expect(screen.queryByText(/Longitude must be between -180 and 180/i)).not.toBeInTheDocument();
  });

  it('validates altitude input', async () => {
    render(<LaunchLocationInput onChange={mockOnChange} />);
    const altInput = screen.getByLabelText(/Altitude/i);
    
    // Test invalid altitude
    await userEvent.type(altInput, '10000');
    expect(screen.getByText(/Altitude must be between 0 and 8848 meters/i)).toBeInTheDocument();
    
    // Test valid altitude
    await userEvent.clear(altInput);
    await userEvent.type(altInput, '100');
    expect(screen.queryByText(/Altitude must be between 0 and 8848 meters/i)).not.toBeInTheDocument();
  });

  it('calls onChange with valid coordinates', async () => {
    render(<LaunchLocationInput onChange={mockOnChange} />);
    
    await userEvent.type(screen.getByLabelText(/Latitude/i), '40.7128');
    await userEvent.type(screen.getByLabelText(/Longitude/i), '-74.0060');
    await userEvent.type(screen.getByLabelText(/Altitude/i), '100');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      lat: 40.7128,
      lng: -74.0060,
      alt: 100
    });
  });

  it('handles current location button click', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    };
    
    mockGeolocation.getCurrentPosition.mockImplementation((success) => success(mockPosition));
    
    render(<LaunchLocationInput onChange={mockOnChange} />);
    
    const currentLocationButton = screen.getByText(/Use Current Location/i);
    await userEvent.click(currentLocationButton);
    
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    expect(mockOnChange).toHaveBeenCalledWith({
      lat: 40.7128,
      lng: -74.0060,
      alt: 0
    });
  });

  it('handles geolocation error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => 
      error({ code: 1, message: 'Permission denied' })
    );
    
    render(<LaunchLocationInput />);
    
    const currentLocationButton = screen.getByText(/Use Current Location/i);
    await userEvent.click(currentLocationButton);
    
    expect(screen.getByText(/Unable to get current location/i)).toBeInTheDocument();
  });

  it('toggles map visibility', async () => {
    render(<LaunchLocationInput />);
    
    const mapButton = screen.getByText(/Show Map/i);
    await userEvent.click(mapButton);
    
    expect(screen.getByText(/Hide Map/i)).toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    
    await userEvent.click(screen.getByText(/Hide Map/i));
    expect(screen.getByText(/Show Map/i)).toBeInTheDocument();
  });

  it('clears all inputs when clear button is clicked', async () => {
    render(<LaunchLocationInput />);
    
    await userEvent.type(screen.getByLabelText(/Latitude/i), '40.7128');
    await userEvent.type(screen.getByLabelText(/Longitude/i), '-74.0060');
    await userEvent.type(screen.getByLabelText(/Altitude/i), '100');
    
    const clearButton = screen.getByText(/Clear/i);
    await userEvent.click(clearButton);
    
    // Check that inputs are cleared by checking their values are empty strings
    const latInput = screen.getByLabelText(/Latitude/i) as HTMLInputElement;
    const lngInput = screen.getByLabelText(/Longitude/i) as HTMLInputElement;
    const altInput = screen.getByLabelText(/Altitude/i) as HTMLInputElement;
    
    expect(latInput.value).toBe('');
    expect(lngInput.value).toBe('');
    expect(altInput.value).toBe('');
  });

  it('displays address search field', () => {
    render(<LaunchLocationInput />);
    expect(screen.getByLabelText(/Search for location/i)).toBeInTheDocument();
  });

  it('handles address search with geocoding API', async () => {
    const mockGeocodingResponse = {
      results: [
        {
          name: 'New York, NY',
          latitude: 40.7128,
          longitude: -74.0060,
          elevation: 10,
          country: 'United States',
          admin1: 'New York',
          type: 'City'
        }
      ]
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeocodingResponse
    });
    
    render(<LaunchLocationInput onChange={mockOnChange} />);
    
    const searchInput = screen.getByLabelText(/Search for location/i);
    await userEvent.type(searchInput, 'New York');
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('geocoding-api.open-meteo.com')
      );
    });
  });

  it('handles geocoding API error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    render(<LaunchLocationInput />);
    
    const searchInput = screen.getByLabelText(/Search for location/i);
    await userEvent.type(searchInput, 'Invalid Location');
    
    // Should not crash and should handle error gracefully
    expect(screen.getByLabelText(/Search for location/i)).toBeInTheDocument();
  });

  it('initializes with provided value', () => {
    const initialValue = { lat: 40.7128, lng: -74.0060, alt: 100 };
    render(<LaunchLocationInput value={initialValue} />);
    
    const latInput = screen.getByLabelText(/Latitude/i) as HTMLInputElement;
    const lngInput = screen.getByLabelText(/Longitude/i) as HTMLInputElement;
    const altInput = screen.getByLabelText(/Altitude/i) as HTMLInputElement;
    
    expect(latInput.value).toBe('40.7128');
    // Accept both '-74.006' and '-74.0060' for precision flexibility
    expect(['-74.006', '-74.0060']).toContain(lngInput.value);
    expect(altInput.value).toBe('100');
  });

  it('handles empty value gracefully', () => {
    render(<LaunchLocationInput value={undefined} />);
    
    const latInput = screen.getByLabelText(/Latitude/i) as HTMLInputElement;
    const lngInput = screen.getByLabelText(/Longitude/i) as HTMLInputElement;
    const altInput = screen.getByLabelText(/Altitude/i) as HTMLInputElement;
    
    expect(latInput.value).toBe('');
    expect(lngInput.value).toBe('');
    expect(altInput.value).toBe('');
  });
});

export {}; 