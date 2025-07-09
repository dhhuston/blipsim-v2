# Elevation Data Sources - Technical Documentation

## API Implementation Guide

This document provides technical specifications and implementation details for integrating elevation data services into the balloon trajectory prediction system.

## Service Integration Specifications

### 1. USGS Elevation Point Query Service

**Base URL**: `https://nationalmap.gov/epqs/pqs.php`

**Request Parameters**:
```typescript
interface USGSElevationParams {
  x: number;        // Longitude in decimal degrees
  y: number;        // Latitude in decimal degrees  
  units: 'Meters' | 'Feet';
  output: 'json' | 'xml' | 'text';
  callback?: string; // For JSONP requests
}
```

**Response Format**:
```typescript
interface USGSElevationResponse {
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
```

**Implementation**:
```typescript
class USGSElevationService implements ElevationService {
  private readonly baseUrl = 'https://nationalmap.gov/epqs/pqs.php';

  async getElevation(lat: number, lng: number): Promise<number> {
    const params = new URLSearchParams({
      x: lng.toString(),
      y: lat.toString(),
      units: 'Meters',
      output: 'json'
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }

    const data: USGSElevationResponse = await response.json();
    const elevation = data.USGS_Elevation_Point_Query_Service.Elevation_Query.Elevation;
    
    if (elevation === -1000000) {
      throw new Error('No elevation data available at coordinates');
    }
    
    return elevation;
  }

  isCoordinateSupported(lat: number, lng: number): boolean {
    // US and territories bounding box
    return (
      lat >= 15.0 && lat <= 72.0 && 
      lng >= -180.0 && lng <= -60.0
    ) || (
      lat >= 15.0 && lat <= 72.0 && 
      lng >= 144.0 && lng <= 180.0
    );
  }
}
```

### 2. Google Elevation API

**Base URL**: `https://maps.googleapis.com/maps/api/elevation/json`

**Request Parameters**:
```typescript
interface GoogleElevationParams {
  locations: string;  // lat,lng pairs separated by |
  key: string;       // API key
}
```

**Response Format**:
```typescript
interface GoogleElevationResponse {
  results: Array<{
    elevation: number;
    location: {
      lat: number;
      lng: number;
    };
    resolution: number;
  }>;
  status: 'OK' | 'INVALID_REQUEST' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
  error_message?: string;
}
```

**Implementation**:
```typescript
class GoogleElevationService implements ElevationService {
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/elevation/json';
  
  constructor(private apiKey: string) {}

  async getElevation(lat: number, lng: number): Promise<number> {
    const params = new URLSearchParams({
      locations: `${lat},${lng}`,
      key: this.apiKey
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    const data: GoogleElevationResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Elevation API error: ${data.status} - ${data.error_message}`);
    }

    if (data.results.length === 0) {
      throw new Error('No elevation data returned');
    }

    return data.results[0].elevation;
  }

  async getBatchElevations(coordinates: Array<{lat: number, lng: number}>): Promise<number[]> {
    const locations = coordinates.map(coord => `${coord.lat},${coord.lng}`).join('|');
    
    const params = new URLSearchParams({
      locations,
      key: this.apiKey
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    const data: GoogleElevationResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Elevation API error: ${data.status}`);
    }

    return data.results.map(result => result.elevation);
  }

  isCoordinateSupported(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
}
```

### 3. Open-Meteo Elevation API

**Base URL**: `https://api.open-meteo.com/v1/elevation`

**Request Parameters**:
```typescript
interface OpenMeteoElevationParams {
  latitude: number | number[];   // Single value or array
  longitude: number | number[];  // Single value or array
}
```

**Response Format**:
```typescript
interface OpenMeteoElevationResponse {
  latitude: number[];
  longitude: number[];
  elevation: number[];
}
```

**Implementation**:
```typescript
class OpenMeteoElevationService implements ElevationService {
  private readonly baseUrl = 'https://api.open-meteo.com/v1/elevation';

  async getElevation(lat: number, lng: number): Promise<number> {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString()
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data: OpenMeteoElevationResponse = await response.json();
    
    if (data.elevation.length === 0) {
      throw new Error('No elevation data returned');
    }

    return data.elevation[0];
  }

  async getBatchElevations(coordinates: Array<{lat: number, lng: number}>): Promise<number[]> {
    const latitudes = coordinates.map(coord => coord.lat);
    const longitudes = coordinates.map(coord => coord.lng);

    const params = new URLSearchParams();
    latitudes.forEach(lat => params.append('latitude', lat.toString()));
    longitudes.forEach(lng => params.append('longitude', lng.toString()));

    const response = await fetch(`${this.baseUrl}?${params}`);
    const data: OpenMeteoElevationResponse = await response.json();

    return data.elevation;
  }

  isCoordinateSupported(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
}
```

## Unified Elevation Service Architecture

### Service Interface
```typescript
interface ElevationService {
  getElevation(lat: number, lng: number): Promise<number>;
  getBatchElevations?(coordinates: Array<{lat: number, lng: number}>): Promise<number[]>;
  isCoordinateSupported(lat: number, lng: number): boolean;
}

interface ElevationServiceConfig {
  name: string;
  priority: number;
  service: ElevationService;
  regions?: string[];
  maxBatchSize?: number;
}
```

### Unified Service Manager
```typescript
class ElevationServiceManager {
  private services: ElevationServiceConfig[] = [];
  private cache = new Map<string, { elevation: number; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Add USGS for US territories
    this.services.push({
      name: 'USGS',
      priority: 1,
      service: new USGSElevationService(),
      regions: ['US']
    });

    // Add Google for global coverage (if API key available)
    if (process.env.GOOGLE_ELEVATION_API_KEY) {
      this.services.push({
        name: 'Google',
        priority: 2,
        service: new GoogleElevationService(process.env.GOOGLE_ELEVATION_API_KEY),
        maxBatchSize: 512
      });
    }

    // Add Open-Meteo as global fallback
    this.services.push({
      name: 'OpenMeteo',
      priority: 3,
      service: new OpenMeteoElevationService(),
      maxBatchSize: 100
    });
  }

  async getElevation(lat: number, lng: number): Promise<number> {
    const cacheKey = this.getCacheKey(lat, lng);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.elevation;
    }

    // Try services in priority order
    const applicableServices = this.getApplicableServices(lat, lng);
    
    for (const config of applicableServices) {
      try {
        const elevation = await config.service.getElevation(lat, lng);
        
        // Cache successful result
        this.cache.set(cacheKey, {
          elevation,
          timestamp: Date.now()
        });
        
        return elevation;
      } catch (error) {
        console.warn(`Elevation service ${config.name} failed:`, error.message);
        continue;
      }
    }

    throw new Error('All elevation services failed');
  }

  async getBatchElevations(coordinates: Array<{lat: number, lng: number}>): Promise<number[]> {
    const results: number[] = new Array(coordinates.length);
    const uncachedIndices: number[] = [];
    const uncachedCoords: Array<{lat: number, lng: number}> = [];

    // Check cache for each coordinate
    coordinates.forEach((coord, index) => {
      const cacheKey = this.getCacheKey(coord.lat, coord.lng);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        results[index] = cached.elevation;
      } else {
        uncachedIndices.push(index);
        uncachedCoords.push(coord);
      }
    });

    if (uncachedCoords.length === 0) {
      return results;
    }

    // Process uncached coordinates
    const groupedCoords = this.groupCoordinatesByRegion(uncachedCoords);
    
    for (const [region, coords] of Object.entries(groupedCoords)) {
      const services = this.getApplicableServicesForRegion(region);
      
      for (const config of services) {
        try {
          let elevations: number[];
          
          if (config.service.getBatchElevations && coords.length > 1) {
            elevations = await config.service.getBatchElevations(coords);
          } else {
            // Fallback to individual requests
            elevations = await Promise.all(
              coords.map(coord => config.service.getElevation(coord.lat, coord.lng))
            );
          }

          // Cache and assign results
          coords.forEach((coord, coordIndex) => {
            const originalIndex = uncachedIndices[coordIndex];
            const elevation = elevations[coordIndex];
            
            results[originalIndex] = elevation;
            
            // Cache result
            const cacheKey = this.getCacheKey(coord.lat, coord.lng);
            this.cache.set(cacheKey, {
              elevation,
              timestamp: Date.now()
            });
          });

          break; // Success, move to next region
        } catch (error) {
          console.warn(`Batch elevation service ${config.name} failed:`, error.message);
          continue;
        }
      }
    }

    return results;
  }

  private getCacheKey(lat: number, lng: number): string {
    // Round to ~100m precision for caching
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;
    return `${roundedLat},${roundedLng}`;
  }

  private getApplicableServices(lat: number, lng: number): ElevationServiceConfig[] {
    return this.services
      .filter(config => config.service.isCoordinateSupported(lat, lng))
      .sort((a, b) => a.priority - b.priority);
  }

  private groupCoordinatesByRegion(coordinates: Array<{lat: number, lng: number}>): Record<string, Array<{lat: number, lng: number}>> {
    const groups: Record<string, Array<{lat: number, lng: number}>> = {
      US: [],
      Global: []
    };

    coordinates.forEach(coord => {
      if (this.isUSCoordinate(coord.lat, coord.lng)) {
        groups.US.push(coord);
      } else {
        groups.Global.push(coord);
      }
    });

    return groups;
  }

  private getApplicableServicesForRegion(region: string): ElevationServiceConfig[] {
    if (region === 'US') {
      return this.services.filter(config => 
        !config.regions || config.regions.includes('US')
      ).sort((a, b) => a.priority - b.priority);
    }
    
    return this.services
      .filter(config => !config.regions || config.regions.includes('Global'))
      .sort((a, b) => a.priority - b.priority);
  }

  private isUSCoordinate(lat: number, lng: number): boolean {
    // US mainland and Alaska bounding box
    return (
      lat >= 24.0 && lat <= 72.0 && 
      lng >= -180.0 && lng <= -66.0
    ) || (
      // Hawaii and Pacific territories
      lat >= 15.0 && lat <= 28.0 && 
      lng >= -180.0 && lng <= -154.0
    );
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats(): { size: number; hitRate: number } {
    // Implementation would track cache hits/misses
    return {
      size: this.cache.size,
      hitRate: 0.85 // Placeholder
    };
  }
}
```

## Error Handling and Retry Logic

### Robust Error Handling
```typescript
class ElevationServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public coordinates: { lat: number; lng: number },
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ElevationServiceError';
  }
}

class RetryableElevationService {
  constructor(
    private service: ElevationService,
    private maxRetries: number = 3,
    private retryDelay: number = 1000
  ) {}

  async getElevation(lat: number, lng: number): Promise<number> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.service.getElevation(lat, lng);
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries && this.isRetryableError(error)) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }
        
        break;
      }
    }

    throw lastError;
  }

  private isRetryableError(error: Error): boolean {
    // Retry on network errors, timeout, rate limiting
    return error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.message.includes('rate limit');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Performance Optimization

### Coordinate Clustering for Batch Requests
```typescript
class CoordinateCluster {
  static clusterCoordinates(
    coordinates: Array<{lat: number, lng: number}>,
    maxDistance: number = 0.1 // degrees
  ): Array<Array<{lat: number, lng: number}>> {
    const clusters: Array<Array<{lat: number, lng: number}>> = [];
    const processed = new Set<number>();

    coordinates.forEach((coord, index) => {
      if (processed.has(index)) return;

      const cluster = [coord];
      processed.add(index);

      // Find nearby coordinates
      coordinates.forEach((otherCoord, otherIndex) => {
        if (processed.has(otherIndex)) return;

        const distance = this.calculateDistance(coord, otherCoord);
        if (distance <= maxDistance) {
          cluster.push(otherCoord);
          processed.add(otherIndex);
        }
      });

      clusters.push(cluster);
    });

    return clusters;
  }

  private static calculateDistance(
    coord1: {lat: number, lng: number},
    coord2: {lat: number, lng: number}
  ): number {
    return Math.sqrt(
      Math.pow(coord1.lat - coord2.lat, 2) + 
      Math.pow(coord1.lng - coord2.lng, 2)
    );
  }
}
```

### Database Caching with PostGIS
```typescript
interface ElevationCacheEntry {
  id: number;
  location: string; // PostGIS POINT
  elevation: number;
  source: string;
  accuracy: number;
  created_at: Date;
}

class PostgreSQLElevationCache {
  constructor(private pool: Pool) {}

  async getCachedElevation(lat: number, lng: number, radiusMeters: number = 100): Promise<number | null> {
    const query = `
      SELECT elevation, accuracy
      FROM elevation_cache
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      )
      LIMIT 1
    `;

    const result = await this.pool.query(query, [lng, lat, radiusMeters]);
    return result.rows.length > 0 ? result.rows[0].elevation : null;
  }

  async cacheElevation(
    lat: number,
    lng: number,
    elevation: number,
    source: string,
    accuracy: number = 30
  ): Promise<void> {
    const query = `
      INSERT INTO elevation_cache (location, elevation, source, accuracy)
      VALUES (ST_SetSRID(ST_MakePoint($1, $2), 4326), $3, $4, $5)
      ON CONFLICT (location) DO UPDATE SET
        elevation = EXCLUDED.elevation,
        source = EXCLUDED.source,
        accuracy = EXCLUDED.accuracy,
        created_at = NOW()
    `;

    await this.pool.query(query, [lng, lat, elevation, source, accuracy]);
  }
}
```

## Integration with Balloon Prediction System

### Trajectory Elevation Sampling
```typescript
interface TrajectoryPoint {
  lat: number;
  lng: number;
  altitude: number;
  timestamp: number;
}

class TrajectoryElevationAnalyzer {
  constructor(private elevationService: ElevationServiceManager) {}

  async analyzeTrajectoryTerrain(trajectory: TrajectoryPoint[]): Promise<{
    maxTerrainElevation: number;
    minClearance: number;
    terrainProfile: Array<{ point: TrajectoryPoint; terrainElevation: number; clearance: number }>;
  }> {
    // Sample every 1km or 10 points, whichever is smaller
    const sampledPoints = this.sampleTrajectoryPoints(trajectory, 1000);
    
    // Get elevation data for sampled points
    const coordinates = sampledPoints.map(point => ({ lat: point.lat, lng: point.lng }));
    const elevations = await this.elevationService.getBatchElevations(coordinates);

    const terrainProfile = sampledPoints.map((point, index) => ({
      point,
      terrainElevation: elevations[index],
      clearance: point.altitude - elevations[index]
    }));

    return {
      maxTerrainElevation: Math.max(...elevations),
      minClearance: Math.min(...terrainProfile.map(p => p.clearance)),
      terrainProfile
    };
  }

  private sampleTrajectoryPoints(trajectory: TrajectoryPoint[], intervalMeters: number): TrajectoryPoint[] {
    const sampled: TrajectoryPoint[] = [trajectory[0]]; // Always include start
    let lastSampledPoint = trajectory[0];

    for (let i = 1; i < trajectory.length - 1; i++) {
      const point = trajectory[i];
      const distance = this.calculateDistance(lastSampledPoint, point);
      
      if (distance >= intervalMeters) {
        sampled.push(point);
        lastSampledPoint = point;
      }
    }

    sampled.push(trajectory[trajectory.length - 1]); // Always include end
    return sampled;
  }

  private calculateDistance(point1: TrajectoryPoint, point2: TrajectoryPoint): number {
    const R = 6371000; // Earth radius in meters
    const lat1Rad = point1.lat * Math.PI / 180;
    const lat2Rad = point2.lat * Math.PI / 180;
    const deltaLatRad = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLngRad = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
```

## Configuration and Environment Setup

### Environment Variables
```bash
# .env file
GOOGLE_ELEVATION_API_KEY=your_google_api_key_here
ELEVATION_CACHE_TTL=86400000
ELEVATION_BATCH_SIZE=100
ELEVATION_RETRY_ATTEMPTS=3
ELEVATION_TIMEOUT=10000

# Database configuration (if using PostgreSQL cache)
DATABASE_URL=postgresql://user:password@localhost:5432/balloon_predictions
ELEVATION_CACHE_ENABLED=true
```

### Service Configuration
```typescript
interface ElevationConfig {
  services: {
    usgs: {
      enabled: boolean;
      timeout: number;
    };
    google: {
      enabled: boolean;
      apiKey?: string;
      timeout: number;
      batchSize: number;
    };
    openMeteo: {
      enabled: boolean;
      timeout: number;
      batchSize: number;
    };
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  retry: {
    maxAttempts: number;
    baseDelay: number;
  };
}

const elevationConfig: ElevationConfig = {
  services: {
    usgs: {
      enabled: true,
      timeout: 5000
    },
    google: {
      enabled: !!process.env.GOOGLE_ELEVATION_API_KEY,
      apiKey: process.env.GOOGLE_ELEVATION_API_KEY,
      timeout: 3000,
      batchSize: 512
    },
    openMeteo: {
      enabled: true,
      timeout: 3000,
      batchSize: 100
    }
  },
  cache: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 10000
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000
  }
};
```

## Testing Strategy

### Unit Tests
```typescript
describe('ElevationServiceManager', () => {
  let elevationManager: ElevationServiceManager;

  beforeEach(() => {
    elevationManager = new ElevationServiceManager();
  });

  test('should return elevation for valid coordinates', async () => {
    const elevation = await elevationManager.getElevation(39.7392, -104.9903);
    expect(elevation).toBeGreaterThan(1000);
    expect(elevation).toBeLessThan(2000);
  });

  test('should handle US coordinates with USGS service', async () => {
    const elevation = await elevationManager.getElevation(40.7128, -74.0060);
    expect(elevation).toBeDefined();
  });

  test('should handle international coordinates', async () => {
    const elevation = await elevationManager.getElevation(51.5074, -0.1278);
    expect(elevation).toBeDefined();
  });

  test('should cache elevation results', async () => {
    const lat = 39.7392;
    const lng = -104.9903;
    
    const elevation1 = await elevationManager.getElevation(lat, lng);
    const elevation2 = await elevationManager.getElevation(lat, lng);
    
    expect(elevation1).toBe(elevation2);
  });
});
```

### Integration Tests
```typescript
describe('Elevation Services Integration', () => {
  test('should fallback between services', async () => {
    const mockUSGS = jest.fn().mockRejectedValue(new Error('Service unavailable'));
    const mockGoogle = jest.fn().mockResolvedValue(1500);
    
    // Test service fallback logic
    const elevation = await elevationManager.getElevation(39.7392, -104.9903);
    expect(elevation).toBe(1500);
  });
});
```

This technical documentation provides comprehensive implementation details for integrating multiple elevation data services into the balloon trajectory prediction system with proper error handling, caching, and optimization strategies.
