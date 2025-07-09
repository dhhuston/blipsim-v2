import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ElevationRequest,
  BatchElevationRequest,
  ElevationResponse,
  BatchElevationResponse,
  ElevationServiceConfig,
  ElevationProvider,
  ElevationCacheEntry,
  ElevationCacheKey,
  USGSElevationResponse,
  GoogleElevationResponse,
  OpenMeteoElevationResponse
} from '../types/elevation';
import {
  ElevationServiceError,
  ElevationNetworkError,
  ElevationRateLimitError,
  ElevationDataError
} from '../types/elevation';

const DEFAULT_CONFIG: ElevationServiceConfig = {
  timeout: 10000,
  retryAttempts: 3,
  rateLimit: 100, // requests/hour per service
  cacheEnabled: true,
  cacheMaxSize: 10000,
  cacheTtl: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * USGS Elevation Point Query Service Provider
 * - Coverage: United States and territories
 * - Resolution: 1/3 arc-second (~10m), 1 arc-second (~30m)
 * - Free with no usage limits
 */
class USGSElevationProvider implements ElevationProvider {
  name = 'USGS';
  private axios: AxiosInstance;
  private requestCount = 0;
  private lastReset = Date.now();

  constructor(config: ElevationServiceConfig) {
    this.axios = axios.create({
      baseURL: 'https://nationalmap.gov/epqs',
      timeout: config.timeout
    });
  }

  isAvailableForLocation(lat: number, lng: number): boolean {
    // USGS covers US territories (roughly)
    return lat >= 15 && lat <= 72 && lng >= -180 && lng <= -60;
  }

  getRateLimit(): number {
    return 1000; // USGS has no documented rate limit, use conservative estimate
  }

  async getElevation(request: ElevationRequest): Promise<ElevationResponse> {
    const { latitude, longitude } = request;
    
    try {
      const response = await this.axios.get<USGSElevationResponse>('/pqs.php', {
        params: {
          x: longitude,
          y: latitude,
          units: 'Meters',
          output: 'json'
        }
      });

      const elevationData = response.data.USGS_Elevation_Point_Query_Service.Elevation_Query;
      
      if (elevationData.Elevation === -1000000) {
        throw new ElevationDataError('USGS', { lat: latitude, lng: longitude }, 'No elevation data available');
      }

      return {
        latitude,
        longitude,
        elevation: elevationData.Elevation,
        dataSource: 'USGS',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Let retryable errors bubble up as-is for main service retry logic
        if (error.code === 'ECONNABORTED' || error.response?.status === 429 || error.response?.status === 503) {
          throw error;
        }
        // Wrap other network errors
        throw new ElevationNetworkError('USGS', { lat: latitude, lng: longitude }, error);
      }
      throw error;
    }
  }
}

/**
 * Google Elevation API Provider
 * - Coverage: Global
 * - Resolution: Variable (~30m to 1km)
 * - Commercial pricing after free tier
 */
class GoogleElevationProvider implements ElevationProvider {
  name = 'Google';
  private axios: AxiosInstance;
  private apiKey: string;
  private requestCount = 0;
  private lastReset = Date.now();

  constructor(config: ElevationServiceConfig, apiKey: string) {
    this.apiKey = apiKey;
    this.axios = axios.create({
      baseURL: 'https://maps.googleapis.com/maps/api/elevation',
      timeout: config.timeout
    });
  }

  isAvailableForLocation(lat: number, lng: number): boolean {
    // Google has global coverage
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  getRateLimit(): number {
    return 100; // Conservative estimate based on typical Google API limits
  }

  async getElevation(request: ElevationRequest): Promise<ElevationResponse> {
    const { latitude, longitude } = request;
    
    try {
      const response = await this.axios.get<GoogleElevationResponse>('/json', {
        params: {
          locations: `${latitude},${longitude}`,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new ElevationDataError('Google', { lat: latitude, lng: longitude }, response.data.status);
      }

      const result = response.data.results[0];
      
      return {
        latitude,
        longitude,
        elevation: result.elevation,
        resolution: result.resolution,
        dataSource: 'Google',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new ElevationRateLimitError('Google');
        }
        // Let retryable errors bubble up as-is for main service retry logic
        if (error.code === 'ECONNABORTED' || error.response?.status === 503) {
          throw error;
        }
        throw new ElevationNetworkError('Google', { lat: latitude, lng: longitude }, error);
      }
      throw error;
    }
  }

  async getBatchElevation(request: BatchElevationRequest): Promise<BatchElevationResponse> {
    const coordinates = request.coordinates;
    
    if (coordinates.length > 512) {
      throw new ElevationDataError('Google', { lat: 0, lng: 0 }, 'Too many coordinates for batch request (max 512)');
    }

    try {
      const locations = coordinates.map(coord => `${coord.latitude},${coord.longitude}`).join('|');
      
      const response = await this.axios.get<GoogleElevationResponse>('/json', {
        params: {
          locations,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new ElevationDataError('Google', { lat: 0, lng: 0 }, response.data.status);
      }

      const results: ElevationResponse[] = response.data.results.map((result, index) => ({
        latitude: coordinates[index].latitude,
        longitude: coordinates[index].longitude,
        elevation: result.elevation,
        resolution: result.resolution,
        dataSource: 'Google',
        timestamp: new Date().toISOString()
      }));

      return {
        results,
        status: 'OK'
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new ElevationRateLimitError('Google');
        }
        // Let retryable errors bubble up as-is for main service retry logic  
        if (error.code === 'ECONNABORTED' || error.response?.status === 503) {
          throw error;
        }
        throw new ElevationNetworkError('Google', { lat: 0, lng: 0 }, error);
      }
      throw error;
    }
  }
}

/**
 * Open-Meteo Elevation API Provider
 * - Coverage: Global
 * - Resolution: ~90m (SRTM-based)
 * - Free with no API key required
 */
class OpenMeteoElevationProvider implements ElevationProvider {
  name = 'Open-Meteo';
  private axios: AxiosInstance;
  private requestCount = 0;
  private lastReset = Date.now();

  constructor(config: ElevationServiceConfig) {
    this.axios = axios.create({
      baseURL: 'https://api.open-meteo.com/v1',
      timeout: config.timeout
    });
  }

  isAvailableForLocation(lat: number, lng: number): boolean {
    // Open-Meteo has global coverage
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  getRateLimit(): number {
    return 1000; // Open-Meteo is generous with rate limits
  }

  async getElevation(request: ElevationRequest): Promise<ElevationResponse> {
    const { latitude, longitude } = request;
    
    try {
      const response = await this.axios.get<OpenMeteoElevationResponse>('/elevation', {
        params: {
          latitude,
          longitude
        }
      });

      return {
        latitude,
        longitude,
        elevation: response.data.elevation[0],
        dataSource: 'Open-Meteo',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Let retryable errors bubble up as-is for main service retry logic
        if (error.code === 'ECONNABORTED' || error.response?.status === 429 || error.response?.status === 503) {
          throw error;
        }
        throw new ElevationNetworkError('Open-Meteo', { lat: latitude, lng: longitude }, error);
      }
      throw error;
    }
  }
}

/**
 * Main Elevation Service with multiple providers and caching
 */
export class ElevationService {
  private config: ElevationServiceConfig;
  private providers: ElevationProvider[];
  private cache: Map<string, ElevationCacheEntry>;
  private logger: Console;

  constructor(config?: Partial<ElevationServiceConfig>, googleApiKey?: string) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.logger = console;

    // Initialize providers based on availability
    this.providers = [
      new USGSElevationProvider(this.config),
      new OpenMeteoElevationProvider(this.config)
    ];

    // Add Google provider if API key is provided
    if (googleApiKey) {
      this.providers.splice(1, 0, new GoogleElevationProvider(this.config, googleApiKey));
    }
  }

  private getCacheKey(lat: number, lng: number, precision: number = 4): string {
    const roundedLat = Math.round(lat * Math.pow(10, precision)) / Math.pow(10, precision);
    const roundedLng = Math.round(lng * Math.pow(10, precision)) / Math.pow(10, precision);
    return `${roundedLat},${roundedLng}`;
  }

  private getFromCache(lat: number, lng: number): ElevationResponse | null {
    if (!this.config.cacheEnabled) return null;

    const key = this.getCacheKey(lat, lng);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache(lat: number, lng: number, data: ElevationResponse): void {
    if (!this.config.cacheEnabled) return;

    // Clean up cache if it's getting too large
    if (this.cache.size >= this.config.cacheMaxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const key = this.getCacheKey(lat, lng);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTtl
    });
  }

  private selectProvider(lat: number, lng: number): ElevationProvider[] {
    // Return providers sorted by preference for the given location
    const availableProviders = this.providers.filter(provider => 
      provider.isAvailableForLocation(lat, lng)
    );

    // For US locations, prefer USGS first
    if (lat >= 15 && lat <= 72 && lng >= -180 && lng <= -60) {
      return availableProviders.sort((a, b) => {
        if (a.name === 'USGS') return -1;
        if (b.name === 'USGS') return 1;
        if (a.name === 'Google') return -1;
        if (b.name === 'Google') return 1;
        return 0;
      });
    }

    // For global locations, prefer Google then Open-Meteo
    return availableProviders.sort((a, b) => {
      if (a.name === 'Google') return -1;
      if (b.name === 'Google') return 1;
      return 0;
    });
  }

  async getElevation(request: ElevationRequest): Promise<ElevationResponse> {
    const { latitude, longitude } = request;

    // Check cache first
    const cached = this.getFromCache(latitude, longitude);
    if (cached) {
      return cached;
    }

    const providers = this.selectProvider(latitude, longitude);
    let lastError: Error | null = null;

    for (const provider of providers) {
      let attempt = 0;
      
      while (attempt < this.config.retryAttempts) {
        try {
          const result = await provider.getElevation(request);
          this.setCache(latitude, longitude, result);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (error instanceof ElevationRateLimitError) {
            this.logger.warn(`Rate limit exceeded for ${provider.name}, trying next provider`);
            break; // Don't retry on rate limit, try next provider
          }
          
          // Check for retryable conditions (similar to weather service)
          if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED' || error.response?.status === 429 || error.response?.status === 503) {
              // Retry on timeout, rate limit, or service unavailable
              attempt++;
              if (attempt < this.config.retryAttempts) {
                const delay = 500 * attempt;
                this.logger.warn(`${provider.name} ${error.code || error.response?.status} error, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            }
          }
          
          // For other errors, try next provider
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.warn(`${provider.name} elevation service failed:`, errorMessage);
          break;
        }
      }
    }

    throw new ElevationServiceError(
      `All elevation services failed for coordinates ${latitude}, ${longitude}`,
      'ElevationService',
      { lat: latitude, lng: longitude },
      lastError || undefined
    );
  }

  async getBatchElevation(request: BatchElevationRequest): Promise<BatchElevationResponse> {
    const { coordinates } = request;
    
    // For batch requests, try to use Google's batch API if available
    const googleProvider = this.providers.find(p => p.name === 'Google') as GoogleElevationProvider | undefined;
    
    if (googleProvider && googleProvider.getBatchElevation && coordinates.length <= 512) {
      try {
        return await googleProvider.getBatchElevation(request);
      } catch (error) {
        this.logger.warn('Google batch elevation failed, falling back to individual requests');
      }
    }

    // Fallback to individual requests
    const results: ElevationResponse[] = [];
    const failedCoordinates: Array<{
      latitude: number;
      longitude: number;
      error: string;
    }> = [];

    // Process requests with some concurrency control
    const batchSize = 5; // Limit concurrent requests
    
    for (let i = 0; i < coordinates.length; i += batchSize) {
      const batch = coordinates.slice(i, i + batchSize);
      const promises = batch.map(async coord => {
        try {
          return await this.getElevation(coord);
        } catch (error) {
          failedCoordinates.push({
            latitude: coord.latitude,
            longitude: coord.longitude,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return null;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter((result): result is ElevationResponse => result !== null));
    }

    const status = failedCoordinates.length === 0 ? 'OK' : 
                  results.length === 0 ? 'ERROR' : 'PARTIAL';

    return {
      results,
      status,
      failedCoordinates: failedCoordinates.length > 0 ? failedCoordinates : undefined
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cacheMaxSize
    };
  }

  getAvailableProviders(): string[] {
    return this.providers.map(p => p.name);
  }
}

// Export default instance
export const elevationService = new ElevationService();

// Export individual provider classes for testing and custom configuration
export { USGSElevationProvider, GoogleElevationProvider, OpenMeteoElevationProvider };
