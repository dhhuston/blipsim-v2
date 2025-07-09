import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Collapse,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip
} from '@mui/material';
import { MyLocation, Map, Search, Clear } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface Location {
  lat: number;
  lng: number;
  alt?: number;
}

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country?: string;
  admin1?: string;
  type?: string;
}

export interface LaunchLocationInputProps {
  value?: Location;
  onChange?: (location: Location) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

// Custom icon for map marker
const markerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDkuNzRMMTIgMTZMMTAuOTEgOS43NEw0IDlMMTAuOTEgOC4yNkwxMiAyWiIgZmlsbD0iIzRDRkY1MCIvPgo8L3N2Zz4K',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

// Map click handler component
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

// Geocoding service
class GeocodingService {
  private static readonly BASE_URL = 'https://geocoding-api.open-meteo.com/v1';
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  static async searchLocations(query: string): Promise<GeocodingResult[]> {
    if (!query.trim()) return [];

    try {
      // Try Open-Meteo first (better for places, landmarks)
      const openMeteoResults = await this.searchOpenMeteo(query);
      if (openMeteoResults.length > 0) {
        return openMeteoResults;
      }

      // Fallback to Nominatim (better for street addresses)
      return await this.searchNominatim(query);
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }

  private static async searchOpenMeteo(query: string): Promise<GeocodingResult[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
      );
      
      if (!response || !response.ok) {
        throw new Error('Open-Meteo geocoding failed');
      }
      
      const data = await response.json();
      return (data.results || []).map((result: any) => ({
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        elevation: result.elevation,
        country: result.country,
        admin1: result.admin1,
        type: this.getLocationType(result.country_code, result.admin1)
      }));
    } catch (error) {
      console.error('Open-Meteo geocoding error:', error);
      return [];
    }
  }

  private static async searchNominatim(query: string): Promise<GeocodingResult[]> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`
      );
      
      if (!response || !response.ok) {
        throw new Error('Nominatim geocoding failed');
      }
      
      const data = await response.json();
      return data.map((result: any) => ({
        name: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        elevation: result.elevation,
        country: result.address?.country,
        admin1: result.address?.state,
        type: this.getLocationType(result.address?.country_code, result.address?.state)
      }));
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      return [];
    }
  }

  private static getLocationType(countryCode?: string, admin1?: string): string {
    if (!countryCode) return 'Location';
    
    // Enhanced location type detection
    const types: { [key: string]: string } = {
      'airport': 'Airport',
      'university': 'University',
      'hospital': 'Hospital',
      'museum': 'Museum',
      'park': 'Park',
      'bridge': 'Bridge',
      'monument': 'Monument',
      'stadium': 'Stadium',
      'shopping': 'Shopping Center',
      'hotel': 'Hotel',
      'restaurant': 'Restaurant',
      'school': 'School',
      'church': 'Church',
      'temple': 'Temple',
      'mosque': 'Mosque',
      'synagogue': 'Synagogue',
      'library': 'Library',
      'theater': 'Theater',
      'cinema': 'Cinema',
      'gallery': 'Gallery',
      'zoo': 'Zoo',
      'aquarium': 'Aquarium',
      'beach': 'Beach',
      'mountain': 'Mountain',
      'lake': 'Lake',
      'river': 'River',
      'forest': 'Forest',
      'desert': 'Desert',
      'island': 'Island',
      'peninsula': 'Peninsula',
      'bay': 'Bay',
      'harbor': 'Harbor',
      'port': 'Port',
      'station': 'Station',
      'terminal': 'Terminal',
      'plaza': 'Plaza',
      'square': 'Square',
      'avenue': 'Avenue',
      'street': 'Street',
      'road': 'Road',
      'highway': 'Highway',
      'freeway': 'Freeway',
      'boulevard': 'Boulevard',
      'drive': 'Drive',
      'lane': 'Lane',
      'court': 'Court',
      'place': 'Place',
      'circle': 'Circle',
      'way': 'Way',
      'terrace': 'Terrace',
      'alley': 'Alley',
      'path': 'Path',
      'trail': 'Trail'
    };

    // Check for specific location types in the name
    const name = admin1?.toLowerCase() || '';
    for (const [key, value] of Object.entries(types)) {
      if (name.includes(key)) {
        return value;
      }
    }

    return 'Location';
  }
}

const LaunchLocationInput: React.FC<LaunchLocationInputProps> = ({
  value,
  onChange,
  onMapClick
}) => {
  const [latitude, setLatitude] = useState(value?.lat?.toString() || '');
  const [longitude, setLongitude] = useState(value?.lng?.toString() || '');
  const [altitude, setAltitude] = useState(value?.alt?.toString() || '');
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validation functions
  const validateLatitude = (lat: string): string => {
    const num = parseFloat(lat);
    if (isNaN(num)) return 'Latitude must be a number';
    if (num < -90 || num > 90) return 'Latitude must be between -90 and 90';
    return '';
  };

  const validateLongitude = (lng: string): string => {
    const num = parseFloat(lng);
    if (isNaN(num)) return 'Longitude must be a number';
    if (num < -180 || num > 180) return 'Longitude must be between -180 and 180';
    return '';
  };

  const validateAltitude = (alt: string): string => {
    const num = parseFloat(alt);
    if (isNaN(num)) return 'Altitude must be a number';
    if (num < 0 || num > 8848) return 'Altitude must be between 0 and 8848 meters';
    return '';
  };

  // Update parent when coordinates change
  useEffect(() => {
    const latError = validateLatitude(latitude);
    const lngError = validateLongitude(longitude);
    const altError = validateAltitude(altitude);

    setErrors({
      latitude: latError,
      longitude: lngError,
      altitude: altError
    });

    if (!latError && !lngError && !altError && onChange) {
      onChange({
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        alt: altitude ? parseFloat(altitude) : undefined
      });
    }
  }, [latitude, longitude, altitude]); // Removed onChange from deps to prevent infinite loop

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    if (onMapClick) {
      onMapClick(lat, lng);
    }
  };

  // Handle current location
  const handleCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
          setAltitude('0'); // Default to sea level
        },
        (error) => {
          console.error('Geolocation error:', error);
          setErrors(prev => ({ ...prev, general: 'Unable to get current location' }));
        }
      );
    } else {
      setErrors(prev => ({ ...prev, general: 'Geolocation not supported' }));
    }
  }, []);

  // Handle address search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await GeocodingService.searchLocations(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setErrors(prev => ({ ...prev, search: 'Search failed. Please try again.' }));
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle location selection from search
  const handleLocationSelect = useCallback((result: GeocodingResult | string | null) => {
    if (result && typeof result === 'object') {
      setLatitude(result.latitude.toFixed(6));
      setLongitude(result.longitude.toFixed(6));
      setAltitude(result.elevation?.toString() || '0');
      setSearchQuery(result.name);
      setSearchResults([]);
    }
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Launch Location
      </Typography>

      {/* Address Search */}
      <Box sx={{ mb: 3 }}>
        <Autocomplete
          freeSolo
          options={searchResults}
          getOptionLabel={(option) => 
            typeof option === 'string' ? option : option.name
          }
          inputValue={searchQuery}
          onInputChange={(_, newValue) => handleSearch(newValue)}
          onChange={(_, newValue) => handleLocationSelect(newValue)}
          loading={isSearching}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search for location"
              placeholder="Enter city, address, landmark, or airport..."
              variant="outlined"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box>
                <Typography variant="body1">{option.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.country && `${option.country}${option.admin1 ? `, ${option.admin1}` : ''}`}
                </Typography>
              </Box>
              {option.type && (
                <Chip 
                  label={option.type} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>
          )}
        />
      </Box>

      {/* Coordinate Inputs */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
        <TextField
          label="Latitude"
          type="number"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          error={!!errors.latitude}
          helperText={errors.latitude || 'Range: -90 to 90'}
          fullWidth
          inputProps={{ step: 0.000001, min: -90, max: 90 }}
        />
        <TextField
          label="Longitude"
          type="number"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          error={!!errors.longitude}
          helperText={errors.longitude || 'Range: -180 to 180'}
          fullWidth
          inputProps={{ step: 0.000001, min: -180, max: 180 }}
        />
        <TextField
          label="Altitude (m)"
          type="number"
          value={altitude}
          onChange={(e) => setAltitude(e.target.value)}
          error={!!errors.altitude}
          helperText={errors.altitude || 'Range: 0 to 8848'}
          fullWidth
          inputProps={{ step: 1, min: 0, max: 8848 }}
        />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<MyLocation />}
          onClick={handleCurrentLocation}
          sx={{ mr: 1 }}
        >
          Use Current Location
        </Button>
        <Button
          variant="outlined"
          startIcon={<Map />}
          onClick={() => setShowMap(!showMap)}
          sx={{ mr: 1 }}
        >
          {showMap ? 'Hide Map' : 'Show Map'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Clear />}
          onClick={() => {
            setLatitude('');
            setLongitude('');
            setAltitude('');
            setSearchQuery('');
          }}
        >
          Clear
        </Button>
      </Box>

      {/* Error Display */}
      {errors.general && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      )}

      {/* Interactive Map */}
      <Collapse in={showMap}>
        <Box sx={{ height: 300, width: '100%', mb: 2 }}>
          <MapContainer
            center={[parseFloat(latitude) || 40.7128, parseFloat(longitude) || -74.0060]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {latitude && longitude && (
              <Marker
                position={[parseFloat(latitude), parseFloat(longitude)]}
                icon={markerIcon}
              />
            )}
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        </Box>
      </Collapse>

      {/* Instructions */}
      <Typography variant="body2" color="text.secondary">
        Set your launch location using coordinates, search for a place, use your current location, or click on the map.
      </Typography>
    </Paper>
  );
};

export default LaunchLocationInput; 