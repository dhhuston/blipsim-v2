import { WeatherIntegrationService, WeatherConditions } from './weatherIntegration';
import { WeatherService } from './weatherService';

// Mock the weather service
jest.mock('./weatherService');

describe('WeatherIntegrationService', () => {
  let weatherIntegration: WeatherIntegrationService;
  let mockWeatherService: jest.Mocked<WeatherService>;

  const mockWeatherData = {
    surfaceData: [
      {
        timestamp: '2024-01-15T12:00:00Z',
        temperature: 288.15, // 15°C
        pressure: 101325, // 1013.25 hPa
        humidity: 60,
        windSpeed: 5,
        windDirection: 180,
        windU: 0,
        windV: -5,
        altitude: 10
      },
      {
        timestamp: '2024-01-15T13:00:00Z',
        temperature: 289.15, // 16°C
        pressure: 101225, // 1012.25 hPa
        humidity: 65,
        windSpeed: 6,
        windDirection: 185,
        windU: 0.5,
        windV: -6,
        altitude: 10
      }
    ],
    altitudeData: [
      [
        {
          altitude: 1000,
          windSpeed: 8,
          windDirection: 190,
          temperature: 281.15, // 8°C
          pressure: 89875, // 898.75 hPa
          humidity: 50
        },
        {
          altitude: 5000,
          windSpeed: 12,
          windDirection: 200,
          temperature: 268.15, // -5°C
          pressure: 54048, // 540.48 hPa
          humidity: 40
        }
      ],
      [
        {
          altitude: 1000,
          windSpeed: 9,
          windDirection: 195,
          temperature: 282.15, // 9°C
          pressure: 89775, // 897.75 hPa
          humidity: 55
        },
        {
          altitude: 5000,
          windSpeed: 13,
          windDirection: 205,
          temperature: 269.15, // -4°C
          pressure: 53948, // 539.48 hPa
          humidity: 45
        }
      ]
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock weather service
    mockWeatherService = {
      fetchAndParseWeather: jest.fn().mockResolvedValue(mockWeatherData)
    } as any;

    weatherIntegration = new WeatherIntegrationService({
      weatherService: mockWeatherService,
      targetAltitudes: [1000, 5000],
      interpolationEnabled: true,
      cacheEnabled: true
    });
  });

  describe('integrateWeatherData', () => {
    it('should fetch and process weather data successfully', async () => {
      const launchLocation = { lat: 40.7128, lng: -74.0060, alt: 10 };
      const launchTime = '2024-01-15T12:00:00Z';
      const flightDuration = 120; // 2 hours

      const result = await weatherIntegration.integrateWeatherData(
        launchLocation,
        launchTime,
        flightDuration
      );

      expect(mockWeatherService.fetchAndParseWeather).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 40.7128,
          longitude: -74.0060,
          hourly: ['temperature_2m', 'wind_speed_10m', 'wind_direction_10m', 'pressure_msl', 'relative_humidity_2m'],
          start_date: '2024-01-15',
          end_date: '2024-01-15',
          timezone: 'auto'
        }),
        [1000, 5000]
      );

      expect(result).toHaveLength(6); // 2 surface + 4 altitude points
      expect(result[0]).toMatchObject({
        timestamp: '2024-01-15T12:00:00Z',
        altitude: 10,
        temperature: 15, // Converted to Celsius
        pressure: 1013.25, // Converted to hPa
        humidity: 60,
        windSpeed: 5,
        windDirection: 180,
        uncertainty: 0.1
      });
    });

    it('should handle weather service errors gracefully', async () => {
      mockWeatherService.fetchAndParseWeather.mockRejectedValue(
        new Error('Weather API unavailable')
      );

      const launchLocation = { lat: 40.7128, lng: -74.0060 };
      const launchTime = '2024-01-15T12:00:00Z';

      await expect(
        weatherIntegration.integrateWeatherData(launchLocation, launchTime)
      ).rejects.toThrow('Weather integration failed: Weather API unavailable');
    });

    it('should use cached data when available', async () => {
      const launchLocation = { lat: 40.7128, lng: -74.0060 };
      const launchTime = '2024-01-15T12:00:00Z';
      const flightDuration = 120;

      // First call to populate cache
      await weatherIntegration.integrateWeatherData(launchLocation, launchTime, flightDuration);
      
      // Second call should use cache
      const cachedResult = weatherIntegration.getCachedWeatherData(
        launchLocation,
        launchTime,
        flightDuration
      );

      expect(cachedResult).toBeTruthy();
      expect(cachedResult).toHaveLength(6);
    });
  });

  describe('calculateWindEffects', () => {
    it('should calculate wind effects on trajectory', () => {
      const weatherConditions: WeatherConditions[] = [
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 1000,
          temperature: 15,
          pressure: 1013.25,
          humidity: 60,
          windSpeed: 5,
          windDirection: 180,
          uncertainty: 0.1
        },
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 5000,
          temperature: -5,
          pressure: 540.48,
          humidity: 40,
          windSpeed: 12,
          windDirection: 200,
          uncertainty: 0.2
        }
      ];

      const trajectory = [
        { altitude: 1000, timestamp: '2024-01-15T12:00:00Z' },
        { altitude: 5000, timestamp: '2024-01-15T12:00:00Z' }
      ];

      const result = weatherIntegration.calculateWindEffects(trajectory, weatherConditions);

      expect(result).toMatchObject({
        windDrift: expect.any(Number),
        altitudeEffect: expect.any(Number),
        uncertaintyRadius: expect.any(Number)
      });

      expect(result.windDrift).toBeGreaterThan(0);
      expect(result.altitudeEffect).toBeGreaterThanOrEqual(0);
      expect(result.uncertaintyRadius).toBeGreaterThan(0);
    });

    it('should handle missing weather data gracefully', () => {
      const weatherConditions: WeatherConditions[] = [];
      const trajectory = [
        { altitude: 1000, timestamp: '2024-01-15T12:00:00Z' }
      ];

      const result = weatherIntegration.calculateWindEffects(trajectory, weatherConditions);

      expect(result).toMatchObject({
        windDrift: 0,
        altitudeEffect: 0,
        uncertaintyRadius: 0
      });
    });
  });

  describe('validateWeatherData', () => {
    it('should validate high quality weather data', () => {
      const weatherConditions: WeatherConditions[] = [
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 1000,
          temperature: 15,
          pressure: 1013.25,
          humidity: 60,
          windSpeed: 5,
          windDirection: 180,
          uncertainty: 0.1
        }
      ];

      const result = weatherIntegration.validateWeatherData(weatherConditions);

      expect(result).toMatchObject({
        isValid: true,
        quality: 'high',
        issues: []
      });
    });

    it('should detect invalid weather data', () => {
      const weatherConditions: WeatherConditions[] = [
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 1000,
          temperature: 500, // Invalid temperature
          pressure: -100, // Invalid pressure
          humidity: 150, // Invalid humidity
          windSpeed: -5, // Invalid wind speed
          windDirection: 400, // Invalid wind direction
          uncertainty: 2 // Invalid uncertainty
        }
      ];

      const result = weatherIntegration.validateWeatherData(weatherConditions);

      expect(result.isValid).toBe(false);
      expect(result.quality).toBe('low');
      expect(result.issues).toHaveLength(5);
      expect(result.issues[0]).toContain('Invalid temperature');
      expect(result.issues[1]).toContain('Invalid pressure');
    });

    it('should assess medium quality data', () => {
      const weatherConditions: WeatherConditions[] = [
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 1000,
          temperature: 15,
          pressure: 1013.25,
          humidity: 60,
          windSpeed: 5,
          windDirection: 180,
          uncertainty: 0.1
        },
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 5000,
          temperature: 500, // Invalid temperature
          pressure: 540.48,
          humidity: 40,
          windSpeed: 12,
          windDirection: 200,
          uncertainty: 0.2
        }
      ];

      const result = weatherIntegration.validateWeatherData(weatherConditions);

      expect(result.isValid).toBe(false);
      expect(result.quality).toBe('medium');
      expect(result.issues).toHaveLength(1);
    });
  });

  describe('interpolateWeatherConditions', () => {
    it('should interpolate weather conditions for specific altitude and time', () => {
      const weatherConditions: WeatherConditions[] = [
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 1000,
          temperature: 15,
          pressure: 1013.25,
          humidity: 60,
          windSpeed: 5,
          windDirection: 180,
          uncertainty: 0.1
        },
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 5000,
          temperature: -5,
          pressure: 540.48,
          humidity: 40,
          windSpeed: 12,
          windDirection: 200,
          uncertainty: 0.2
        }
      ];

      const result = weatherIntegration.interpolateWeatherConditions(
        3000, // Target altitude
        '2024-01-15T12:00:00Z',
        weatherConditions
      );

      expect(result).toBeTruthy();
      expect(result!.altitude).toBe(3000);
      expect(result!.timestamp).toBe('2024-01-15T12:00:00Z');
      expect(result!.temperature).toBeGreaterThan(-5);
      expect(result!.temperature).toBeLessThan(15);
      expect(result!.windSpeed).toBeGreaterThan(5);
      expect(result!.windSpeed).toBeLessThan(12);
    });

    it('should return null for missing data', () => {
      const weatherConditions: WeatherConditions[] = [
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 1000,
          temperature: 15,
          pressure: 1013.25,
          humidity: 60,
          windSpeed: 5,
          windDirection: 180,
          uncertainty: 0.1
        }
      ];

      const result = weatherIntegration.interpolateWeatherConditions(
        3000,
        '2024-01-15T13:00:00Z', // Different timestamp
        weatherConditions
      );

      expect(result).toBeNull();
    });

    it('should handle angle interpolation correctly', () => {
      const weatherConditions: WeatherConditions[] = [
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 1000,
          temperature: 15,
          pressure: 1013.25,
          humidity: 60,
          windSpeed: 5,
          windDirection: 350, // Near 360°
          uncertainty: 0.1
        },
        {
          timestamp: '2024-01-15T12:00:00Z',
          altitude: 5000,
          temperature: -5,
          pressure: 540.48,
          humidity: 40,
          windSpeed: 12,
          windDirection: 10, // Near 0°
          uncertainty: 0.2
        }
      ];

      const result = weatherIntegration.interpolateWeatherConditions(
        3000,
        '2024-01-15T12:00:00Z',
        weatherConditions
      );

      expect(result).toBeTruthy();
      expect(result!.windDirection).toBeGreaterThanOrEqual(0);
      expect(result!.windDirection).toBeLessThan(360);
    });
  });

  describe('caching', () => {
    it('should cache weather data when enabled', () => {
      const launchLocation = { lat: 40.7128, lng: -74.0060 };
      const launchTime = '2024-01-15T12:00:00Z';
      const flightDuration = 120;

      // Initially no cached data
      let cachedData = weatherIntegration.getCachedWeatherData(
        launchLocation,
        launchTime,
        flightDuration
      );
      expect(cachedData).toBeNull();

      // After integration, data should be cached
      return weatherIntegration.integrateWeatherData(launchLocation, launchTime, flightDuration)
        .then(() => {
          cachedData = weatherIntegration.getCachedWeatherData(
            launchLocation,
            launchTime,
            flightDuration
          );
          expect(cachedData).toBeTruthy();
          expect(cachedData).toHaveLength(6);
        });
    });

    it('should clear cache when requested', () => {
      const launchLocation = { lat: 40.7128, lng: -74.0060 };
      const launchTime = '2024-01-15T12:00:00Z';
      const flightDuration = 120;

      return weatherIntegration.integrateWeatherData(launchLocation, launchTime, flightDuration)
        .then(() => {
          // Verify data is cached
          let cachedData = weatherIntegration.getCachedWeatherData(
            launchLocation,
            launchTime,
            flightDuration
          );
          expect(cachedData).toBeTruthy();

          // Clear cache
          weatherIntegration.clearCache();

          // Verify cache is cleared
          cachedData = weatherIntegration.getCachedWeatherData(
            launchLocation,
            launchTime,
            flightDuration
          );
          expect(cachedData).toBeNull();
        });
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customIntegration = new WeatherIntegrationService({
        weatherService: mockWeatherService,
        targetAltitudes: [2000, 10000],
        interpolationEnabled: false,
        cacheEnabled: false
      });

      expect(customIntegration).toBeInstanceOf(WeatherIntegrationService);
    });

    it('should use default configuration when not specified', () => {
      const defaultIntegration = new WeatherIntegrationService({
        weatherService: mockWeatherService
      });

      expect(defaultIntegration).toBeInstanceOf(WeatherIntegrationService);
    });
  });
}); 