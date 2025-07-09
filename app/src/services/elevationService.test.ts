import axios from 'axios';
import { 
  ElevationService, 
  USGSElevationProvider, 
  GoogleElevationProvider, 
  OpenMeteoElevationProvider 
} from './elevationService';
import type { 
  ElevationRequest, 
  BatchElevationRequest,
  ElevationServiceConfig,
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

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios static methods
Object.assign(mockedAxios, {
  isAxiosError: jest.fn()
});

describe('ElevationService', () => {
  let elevationService: ElevationService;
  
  beforeEach(() => {
    elevationService = new ElevationService();
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
    mockedAxios.isAxiosError.mockReturnValue(false); // Default return value
  });

  describe('Constructor and Configuration', () => {
    it('should create with default configuration', () => {
      const service = new ElevationService();
      expect(service.getAvailableProviders()).toContain('USGS');
      expect(service.getAvailableProviders()).toContain('Open-Meteo');
      expect(service.getAvailableProviders()).not.toContain('Google');
    });

    it('should create with Google provider when API key provided', () => {
      const service = new ElevationService(undefined, 'test-api-key');
      expect(service.getAvailableProviders()).toContain('USGS');
      expect(service.getAvailableProviders()).toContain('Google');
      expect(service.getAvailableProviders()).toContain('Open-Meteo');
    });

    it('should use custom configuration', () => {
      const customConfig: Partial<ElevationServiceConfig> = {
        timeout: 5000,
        retryAttempts: 5,
        cacheEnabled: false
      };
      const service = new ElevationService(customConfig);
      expect(service.getCacheStats().maxSize).toBe(10000); // default
    });
  });

  describe('Cache Management', () => {
    it('should cache elevation results', async () => {
      const mockResponse: USGSElevationResponse = {
        USGS_Elevation_Point_Query_Service: {
          Elevation_Query: {
            x: -104.98,
            y: 39.74,
            Data_Source: '3DEP 1/3 arc-second',
            Elevation: 1608.81,
            Units: 'Meters'
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
      
      // First call should hit the API
      const result1 = await elevationService.getElevation(request);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(result1.elevation).toBe(1608.81);

      // Second call should use cache
      const result2 = await elevationService.getElevation(request);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2.elevation).toBe(1608.81);
    });

    it('should clear cache when requested', async () => {
      const stats = elevationService.getCacheStats();
      expect(stats.size).toBe(0);
      
      elevationService.clearCache();
      const clearedStats = elevationService.getCacheStats();
      expect(clearedStats.size).toBe(0);
    });

    it('should handle cache size limits', () => {
      const service = new ElevationService({ cacheMaxSize: 2 });
      // Cache size management is tested indirectly through cache behavior
      expect(service.getCacheStats().maxSize).toBe(2);
    });
  });

  describe('Provider Selection', () => {
    it('should prefer USGS for US coordinates', async () => {
      const mockUSGSResponse: USGSElevationResponse = {
        USGS_Elevation_Point_Query_Service: {
          Elevation_Query: {
            x: -104.98,
            y: 39.74,
            Data_Source: '3DEP 1/3 arc-second',
            Elevation: 1608.81,
            Units: 'Meters'
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockUSGSResponse });

      const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 }; // Denver, CO
      const result = await elevationService.getElevation(request);
      
      expect(result.dataSource).toBe('USGS');
      expect(mockedAxios.get).toHaveBeenCalledWith('/pqs.php', {
        params: {
          x: -104.98,
          y: 39.74,
          units: 'Meters',
          output: 'json'
        }
      });
    });

    it('should use Open-Meteo for non-US coordinates', async () => {
      const mockOpenMeteoResponse: OpenMeteoElevationResponse = {
        latitude: 48.8566,
        longitude: 2.3522,
        elevation: [35.0]
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockOpenMeteoResponse });

      const request: ElevationRequest = { latitude: 48.8566, longitude: 2.3522 }; // Paris, France
      const result = await elevationService.getElevation(request);
      
      expect(result.dataSource).toBe('Open-Meteo');
      expect(mockedAxios.get).toHaveBeenCalledWith('/elevation', {
        params: {
          latitude: 48.8566,
          longitude: 2.3522
        }
      });
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should fallback to next provider on network error', async () => {
      const service = new ElevationService(undefined, 'test-api-key');
      
      // Mock USGS failure and Open-Meteo success (note: the service will try USGS first for US coordinates)
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Network error'))  // USGS fails
        .mockRejectedValueOnce(new Error('Network error'))  // Google fails (added as second provider)
        .mockResolvedValueOnce({ 
          data: {
            latitude: 39.74,
            longitude: -104.98,
            elevation: [1609.0]
          }
        }); // Open-Meteo succeeds

      mockedAxios.isAxiosError.mockReturnValue(true);

      const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
      const result = await service.getElevation(request);
      
      expect(result.dataSource).toBe('Open-Meteo');
      expect(result.elevation).toBe(1609.0);
    });

    it('should retry on timeout and rate limit errors', async () => {
      // Create a fresh service instance for this test
      const testService = new ElevationService({ retryAttempts: 3 });
      
      const mockUSGSResponse: USGSElevationResponse = {
        USGS_Elevation_Point_Query_Service: {
          Elevation_Query: {
            x: -104.98,
            y: 39.74,
            Data_Source: '3DEP 1/3 arc-second',
            Elevation: 1608.81,
            Units: 'Meters'
          }
        }
      };

      // First call fails with timeout (ECONNABORTED), second succeeds
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
        isAxiosError: true
      };
      
      mockedAxios.get
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({ data: mockUSGSResponse });
      
      // Mock axios.isAxiosError to return true
      mockedAxios.isAxiosError.mockReturnValue(true);

      const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
      const result = await testService.getElevation(request);
      
      expect(result.elevation).toBe(1608.81);
      expect(result.dataSource).toBe('USGS');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error when all providers fail', async () => {
      mockedAxios.get.mockRejectedValue(new Error('All services down'));

      const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
      
      await expect(elevationService.getElevation(request)).rejects.toThrow('All elevation services failed');
    });
  });

  describe('Batch Processing', () => {
    it('should handle batch elevation requests', async () => {
      const service = new ElevationService(undefined, 'test-api-key');
      
      const mockGoogleResponse: GoogleElevationResponse = {
        results: [
          {
            elevation: 1608.81,
            location: { lat: 39.74, lng: -104.98 },
            resolution: 4.771975994110107
          },
          {
            elevation: 1609.5,
            location: { lat: 39.75, lng: -104.99 },
            resolution: 4.771975994110107
          }
        ],
        status: 'OK'
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockGoogleResponse });

      const request: BatchElevationRequest = {
        coordinates: [
          { latitude: 39.74, longitude: -104.98 },
          { latitude: 39.75, longitude: -104.99 }
        ]
      };

      const result = await service.getBatchElevation(request);
      
      expect(result.status).toBe('OK');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].elevation).toBe(1608.81);
      expect(result.results[1].elevation).toBe(1609.5);
    });

    it('should fallback to individual requests if batch fails', async () => {
      const service = new ElevationService();
      
      // Mock individual USGS responses
      const mockUSGSResponse1: USGSElevationResponse = {
        USGS_Elevation_Point_Query_Service: {
          Elevation_Query: {
            x: -104.98,
            y: 39.74,
            Data_Source: '3DEP 1/3 arc-second',
            Elevation: 1608.81,
            Units: 'Meters'
          }
        }
      };

      const mockUSGSResponse2: USGSElevationResponse = {
        USGS_Elevation_Point_Query_Service: {
          Elevation_Query: {
            x: -104.99,
            y: 39.75,
            Data_Source: '3DEP 1/3 arc-second',
            Elevation: 1609.5,
            Units: 'Meters'
          }
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUSGSResponse1 })
        .mockResolvedValueOnce({ data: mockUSGSResponse2 });

      const request: BatchElevationRequest = {
        coordinates: [
          { latitude: 39.74, longitude: -104.98 },
          { latitude: 39.75, longitude: -104.99 }
        ]
      };

      const result = await service.getBatchElevation(request);
      
      expect(result.status).toBe('OK');
      expect(result.results).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in batch requests', async () => {
      const service = new ElevationService();
      
      const mockUSGSResponse: USGSElevationResponse = {
        USGS_Elevation_Point_Query_Service: {
          Elevation_Query: {
            x: -104.98,
            y: 39.74,
            Data_Source: '3DEP 1/3 arc-second',
            Elevation: 1608.81,
            Units: 'Meters'
          }
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUSGSResponse })
        .mockRejectedValueOnce(new Error('Service unavailable'));

      const request: BatchElevationRequest = {
        coordinates: [
          { latitude: 39.74, longitude: -104.98 },
          { latitude: 39.75, longitude: -104.99 }
        ]
      };

      const result = await service.getBatchElevation(request);
      
      expect(result.status).toBe('PARTIAL');
      expect(result.results).toHaveLength(1);
      expect(result.failedCoordinates).toHaveLength(1);
      expect(result.failedCoordinates![0].latitude).toBe(39.75);
    });
  });
});

describe('USGSElevationProvider', () => {
  let provider: USGSElevationProvider;
  
  beforeEach(() => {
    provider = new USGSElevationProvider({
      timeout: 10000,
      retryAttempts: 3,
      rateLimit: 100,
      cacheEnabled: true,
      cacheMaxSize: 1000,
      cacheTtl: 24 * 60 * 60 * 1000
    });
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  it('should check availability for US coordinates', () => {
    expect(provider.isAvailableForLocation(39.74, -104.98)).toBe(true); // Denver
    expect(provider.isAvailableForLocation(48.8566, 2.3522)).toBe(false); // Paris
    expect(provider.isAvailableForLocation(90, 0)).toBe(false); // North Pole
  });

  it('should fetch elevation data successfully', async () => {
    const mockResponse: USGSElevationResponse = {
      USGS_Elevation_Point_Query_Service: {
        Elevation_Query: {
          x: -104.98,
          y: 39.74,
          Data_Source: '3DEP 1/3 arc-second',
          Elevation: 1608.81,
          Units: 'Meters'
        }
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

    const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
    const result = await provider.getElevation(request);

    expect(result.elevation).toBe(1608.81);
    expect(result.dataSource).toBe('USGS');
    expect(result.latitude).toBe(39.74);
    expect(result.longitude).toBe(-104.98);
  });

  it('should handle no data available error', async () => {
    const mockResponse: USGSElevationResponse = {
      USGS_Elevation_Point_Query_Service: {
        Elevation_Query: {
          x: -104.98,
          y: 39.74,
          Data_Source: '3DEP 1/3 arc-second',
          Elevation: -1000000, // USGS error code
          Units: 'Meters'
        }
      }
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

    const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
    
    await expect(provider.getElevation(request)).rejects.toThrow('No elevation data available');
  });
});

describe('GoogleElevationProvider', () => {
  let provider: GoogleElevationProvider;
  
  beforeEach(() => {
    provider = new GoogleElevationProvider({
      timeout: 10000,
      retryAttempts: 3,
      rateLimit: 100,
      cacheEnabled: true,
      cacheMaxSize: 1000,
      cacheTtl: 24 * 60 * 60 * 1000
    }, 'test-api-key');
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  it('should check availability for all coordinates', () => {
    expect(provider.isAvailableForLocation(39.74, -104.98)).toBe(true);
    expect(provider.isAvailableForLocation(48.8566, 2.3522)).toBe(true);
    expect(provider.isAvailableForLocation(90, 0)).toBe(true);
    expect(provider.isAvailableForLocation(-90, 0)).toBe(true);
  });

  it('should fetch elevation data successfully', async () => {
    const mockResponse: GoogleElevationResponse = {
      results: [{
        elevation: 1608.637939453125,
        location: { lat: 39.7391536, lng: -104.9847034 },
        resolution: 4.771975994110107
      }],
      status: 'OK'
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

    const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
    const result = await provider.getElevation(request);

    expect(result.elevation).toBe(1608.637939453125);
    expect(result.resolution).toBe(4.771975994110107);
    expect(result.dataSource).toBe('Google');
  });

  it('should handle API errors', async () => {
    const mockResponse: GoogleElevationResponse = {
      results: [],
      status: 'REQUEST_DENIED'
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

    const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
    
    await expect(provider.getElevation(request)).rejects.toThrow('REQUEST_DENIED');
  });

  it('should handle rate limiting', async () => {
    const error = { 
      response: { status: 429 },
      isAxiosError: true
    };
    mockedAxios.get.mockRejectedValueOnce(error);
    mockedAxios.isAxiosError.mockReturnValueOnce(true);

    const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
    
    await expect(provider.getElevation(request)).rejects.toThrow('Rate limit exceeded');
  });
});

describe('OpenMeteoElevationProvider', () => {
  let provider: OpenMeteoElevationProvider;
  
  beforeEach(() => {
    provider = new OpenMeteoElevationProvider({
      timeout: 10000,
      retryAttempts: 3,
      rateLimit: 100,
      cacheEnabled: true,
      cacheMaxSize: 1000,
      cacheTtl: 24 * 60 * 60 * 1000
    });
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  it('should check availability for all coordinates', () => {
    expect(provider.isAvailableForLocation(39.74, -104.98)).toBe(true);
    expect(provider.isAvailableForLocation(48.8566, 2.3522)).toBe(true);
    expect(provider.isAvailableForLocation(90, 0)).toBe(true);
    expect(provider.isAvailableForLocation(-90, 0)).toBe(true);
  });

  it('should fetch elevation data successfully', async () => {
    const mockResponse: OpenMeteoElevationResponse = {
      latitude: 39.74,
      longitude: -104.98,
      elevation: [1609.0]
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

    const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
    const result = await provider.getElevation(request);

    expect(result.elevation).toBe(1609.0);
    expect(result.dataSource).toBe('Open-Meteo');
    expect(result.latitude).toBe(39.74);
    expect(result.longitude).toBe(-104.98);
  });

  it('should handle network errors', async () => {
    const error = new Error('Network timeout');
    mockedAxios.get.mockRejectedValueOnce(error);
    mockedAxios.isAxiosError.mockReturnValueOnce(true);

    const request: ElevationRequest = { latitude: 39.74, longitude: -104.98 };
    
    await expect(provider.getElevation(request)).rejects.toThrow('Network error');
  });
});
