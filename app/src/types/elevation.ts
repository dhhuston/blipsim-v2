// Elevation type definitions for terrain data integration

export interface ElevationRequest {
  latitude: number;
  longitude: number;
}

export interface BatchElevationRequest {
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
}

export interface ElevationResponse {
  latitude: number;
  longitude: number;
  elevation: number;      // meters above sea level
  resolution?: number;    // horizontal resolution in meters
  dataSource?: string;    // e.g., 'USGS', 'Google', 'Open-Meteo'
  timestamp?: string;     // when data was retrieved
}

export interface BatchElevationResponse {
  results: ElevationResponse[];
  status: 'OK' | 'PARTIAL' | 'ERROR';
  failedCoordinates?: Array<{
    latitude: number;
    longitude: number;
    error: string;
  }>;
}

export interface ElevationServiceConfig {
  timeout: number;        // 10000ms
  retryAttempts: number;  // 3
  rateLimit: number;      // requests per hour
  cacheEnabled: boolean;  // true
  cacheMaxSize: number;   // 10000 entries
  cacheTtl: number;       // 24 hours in ms
}

// Service-specific interfaces

export interface USGSElevationResponse {
  USGS_Elevation_Point_Query_Service: {
    Elevation_Query: {
      x: number;
      y: number;
      Data_Source: string;
      Elevation: number;
      Units: string;
    };
  };
}

export interface GoogleElevationResponse {
  results: Array<{
    elevation: number;
    location: {
      lat: number;
      lng: number;
    };
    resolution: number;
  }>;
  status: string;
}

export interface OpenMeteoElevationResponse {
  latitude: number;
  longitude: number;
  elevation: number[];
}

// Cache interfaces
export interface ElevationCacheEntry {
  data: ElevationResponse;
  timestamp: number;
  ttl: number;
}

export interface ElevationCacheKey {
  lat: number;
  lng: number;
  precision: number; // decimal places for coordinate rounding
}

// Error types
export class ElevationServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly coordinates?: { lat: number; lng: number },
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ElevationServiceError';
  }
}

export class ElevationNetworkError extends ElevationServiceError {
  constructor(service: string, coordinates?: { lat: number; lng: number }, originalError?: Error) {
    super(`Network error accessing ${service} elevation service`, service, coordinates, originalError);
    this.name = 'ElevationNetworkError';
  }
}

export class ElevationRateLimitError extends ElevationServiceError {
  constructor(service: string) {
    super(`Rate limit exceeded for ${service} elevation service`, service);
    this.name = 'ElevationRateLimitError';
  }
}

export class ElevationDataError extends ElevationServiceError {
  constructor(service: string, coordinates: { lat: number; lng: number }, message: string) {
    super(`Data error from ${service}: ${message}`, service, coordinates);
    this.name = 'ElevationDataError';
  }
}

// Service provider interface
export interface ElevationProvider {
  name: string;
  getElevation(request: ElevationRequest): Promise<ElevationResponse>;
  getBatchElevation?(request: BatchElevationRequest): Promise<BatchElevationResponse>;
  isAvailableForLocation(lat: number, lng: number): boolean;
  getRateLimit(): number;
}
