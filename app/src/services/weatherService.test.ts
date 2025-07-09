import { WeatherService, ParsedWeatherData, AltitudeInterpolatedData } from './weatherService';
import type { WeatherResponse } from '../types/weather';

// Mock axios
const mockAxiosInstance = {
  get: jest.fn()
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn()
}));

describe('WeatherService - Data Parsing', () => {
  let weatherService: WeatherService;
  let mockAxios: any;

  beforeEach(() => {
    weatherService = new WeatherService();
    mockAxios = require('axios');
  });

  describe('Wind Component Parsing', () => {
    test('should parse wind components correctly for north wind', () => {
      const result = (weatherService as any).parseWindComponents(10, 0);
      expect(result.windU).toBeCloseTo(0, 2);
      expect(result.windV).toBeCloseTo(-10, 2);
    });

    test('should parse wind components correctly for east wind', () => {
      const result = (weatherService as any).parseWindComponents(10, 90);
      expect(result.windU).toBeCloseTo(-10, 2);
      expect(result.windV).toBeCloseTo(0, 2);
    });

    test('should parse wind components correctly for south wind', () => {
      const result = (weatherService as any).parseWindComponents(10, 180);
      expect(result.windU).toBeCloseTo(0, 2);
      expect(result.windV).toBeCloseTo(10, 2);
    });

    test('should parse wind components correctly for west wind', () => {
      const result = (weatherService as any).parseWindComponents(10, 270);
      expect(result.windU).toBeCloseTo(10, 2);
      expect(result.windV).toBeCloseTo(0, 2);
    });

    test('should parse wind components correctly for northeast wind', () => {
      const result = (weatherService as any).parseWindComponents(10, 45);
      expect(result.windU).toBeCloseTo(-7.07, 2);
      expect(result.windV).toBeCloseTo(-7.07, 2);
    });
  });

  describe('Unit Conversions', () => {
    test('should convert temperature from Celsius to Kelvin', () => {
      const result = (weatherService as any).convertTemperatureToKelvin(25);
      expect(result).toBe(298.15);
    });

    test('should convert temperature from Celsius to Kelvin for negative values', () => {
      const result = (weatherService as any).convertTemperatureToKelvin(-10);
      expect(result).toBe(263.15);
    });

    test('should convert pressure from hPa to Pa', () => {
      const result = (weatherService as any).convertPressureToPa(1013.25);
      expect(result).toBe(101325);
    });

    test('should convert pressure from hPa to Pa for low values', () => {
      const result = (weatherService as any).convertPressureToPa(500);
      expect(result).toBe(50000);
    });
  });

  describe('Weather Data Parsing', () => {
    const mockWeatherResponse: WeatherResponse = {
      latitude: 40.7128,
      longitude: -74.0060,
      timezone: 'America/New_York',
      hourly: {
        time: ['2023-01-01T00:00:00', '2023-01-01T01:00:00', '2023-01-01T02:00:00'],
        temperature_2m: [25, 24, 23],
        wind_speed_10m: [10, 12, 8],
        wind_direction_10m: [90, 95, 85],
        pressure_msl: [1013.25, 1012.5, 1014.0],
        relative_humidity_2m: [60, 65, 55]
      }
    };

    test('should parse weather data correctly', () => {
      const result = weatherService.parseWeatherData(mockWeatherResponse);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        timestamp: '2023-01-01T00:00:00',
        temperature: 298.15, // 25°C + 273.15
        pressure: 101325, // 1013.25 hPa * 100
        humidity: 60,
        windSpeed: 10,
        windDirection: 90,
        windU: -10, // -10 * sin(90°)
        altitude: 10
      });
      expect(result[0].windV).toBeCloseTo(0, 10); // Handle floating point precision
    });

    test('should handle missing data gracefully', () => {
      const responseWithMissingData: WeatherResponse = {
        ...mockWeatherResponse,
        hourly: {
          ...mockWeatherResponse.hourly,
          temperature_2m: [25, null as any, 23],
          wind_speed_10m: [10, 12, null as any],
          wind_direction_10m: [90, 95, 85],
          pressure_msl: [1013.25, 1012.5, 1014.0],
          relative_humidity_2m: [60, 65, 55]
        }
      };

      const result = weatherService.parseWeatherData(responseWithMissingData);
      expect(result).toHaveLength(1); // Only the first entry should be included
    });

    test('should throw error for invalid response', () => {
      const invalidResponse = {
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: 'America/New_York'
        // Missing hourly data
      } as WeatherResponse;

      expect(() => weatherService.parseWeatherData(invalidResponse)).toThrow('Invalid weather response: missing hourly data');
    });

    test('should throw error for response with missing time array', () => {
      const invalidResponse: WeatherResponse = {
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: 'America/New_York',
        hourly: {
          time: [],
          temperature_2m: [25],
          wind_speed_10m: [10],
          wind_direction_10m: [90],
          pressure_msl: [1013.25],
          relative_humidity_2m: [60]
        }
      };

      expect(() => weatherService.parseWeatherData(invalidResponse)).toThrow('Invalid weather response: missing hourly data');
    });
  });

  describe('Altitude Interpolation', () => {
    const mockSurfaceData: ParsedWeatherData = {
      timestamp: '2023-01-01T00:00:00',
      temperature: 298.15, // 25°C
      pressure: 101325, // 1013.25 hPa
      humidity: 60,
      windSpeed: 10,
      windDirection: 90,
      windU: -10,
      windV: 0,
      altitude: 10
    };

    test('should interpolate weather data for higher altitude', () => {
      const result = weatherService.interpolateForAltitude(mockSurfaceData, 1000);
      
      expect(result.altitude).toBe(1000);
      expect(result.temperature).toBeLessThan(mockSurfaceData.temperature); // Should be colder
      expect(result.pressure).toBeLessThan(mockSurfaceData.pressure); // Should be lower pressure
      expect(result.humidity).toBeLessThan(mockSurfaceData.humidity); // Should be drier
      expect(result.windSpeed).toBeGreaterThan(mockSurfaceData.windSpeed); // Should be windier
      expect(result.windDirection).toBeCloseTo(mockSurfaceData.windDirection, 1);
    });

    test('should interpolate weather data for lower altitude', () => {
      const result = weatherService.interpolateForAltitude(mockSurfaceData, 5);
      
      expect(result.altitude).toBe(5);
      expect(result.temperature).toBeGreaterThan(mockSurfaceData.temperature); // Should be warmer
      expect(result.pressure).toBeGreaterThan(mockSurfaceData.pressure); // Should be higher pressure
      expect(result.humidity).toBeGreaterThan(mockSurfaceData.humidity); // Should be more humid
      expect(result.windSpeed).toBeLessThan(mockSurfaceData.windSpeed); // Should be less windy
    });

    test('should handle wind direction changes at high altitude', () => {
      const result = weatherService.interpolateForAltitude(mockSurfaceData, 5000);
      
      expect(result.altitude).toBe(5000);
      expect(result.windDirection).toBeGreaterThan(mockSurfaceData.windDirection);
      expect(result.windDirection).toBeLessThanOrEqual(360);
    });

    test('should maintain humidity bounds', () => {
      const result = weatherService.interpolateForAltitude(mockSurfaceData, 10000);
      
      expect(result.humidity).toBeGreaterThanOrEqual(0);
      expect(result.humidity).toBeLessThanOrEqual(100);
    });
  });

  describe('Fetch and Parse Weather', () => {
    const mockWeatherResponse: WeatherResponse = {
      latitude: 40.7128,
      longitude: -74.0060,
      timezone: 'America/New_York',
      hourly: {
        time: ['2023-01-01T00:00:00'],
        temperature_2m: [25],
        wind_speed_10m: [10],
        wind_direction_10m: [90],
        pressure_msl: [1013.25],
        relative_humidity_2m: [60]
      }
    };

    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockWeatherResponse });
    });

    test('should fetch and parse weather data without altitude interpolation', async () => {
      const request = {
        latitude: 40.7128,
        longitude: -74.0060,
        start_date: '2023-01-01',
        end_date: '2023-01-01',
        hourly: ['temperature_2m', 'wind_speed_10m', 'wind_direction_10m', 'pressure_msl', 'relative_humidity_2m'],
        timezone: 'America/New_York'
      };

      const result = await weatherService.fetchAndParseWeather(request);
      
      expect(result.surfaceData).toHaveLength(1);
      expect(result.altitudeData).toHaveLength(0);
      expect(result.surfaceData[0].temperature).toBe(298.15);
      expect(result.surfaceData[0].pressure).toBe(101325);
    });

    test('should fetch and parse weather data with altitude interpolation', async () => {
      const request = {
        latitude: 40.7128,
        longitude: -74.0060,
        start_date: '2023-01-01',
        end_date: '2023-01-01',
        hourly: ['temperature_2m', 'wind_speed_10m', 'wind_direction_10m', 'pressure_msl', 'relative_humidity_2m'],
        timezone: 'America/New_York'
      };

      const targetAltitudes = [1000, 2000, 5000];
      const result = await weatherService.fetchAndParseWeather(request, targetAltitudes);
      
      expect(result.surfaceData).toHaveLength(1);
      expect(result.altitudeData).toHaveLength(1);
      expect(result.altitudeData[0]).toHaveLength(3);
      
      // Check that altitude data is properly interpolated
      result.altitudeData[0].forEach((altData, index) => {
        expect(altData.altitude).toBe(targetAltitudes[index]);
        expect(altData.temperature).toBeLessThan(result.surfaceData[0].temperature);
        expect(altData.pressure).toBeLessThan(result.surfaceData[0].pressure);
      });
    });

    test('should handle API errors gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));
      
      const request = {
        latitude: 40.7128,
        longitude: -74.0060,
        start_date: '2023-01-01',
        end_date: '2023-01-01',
        hourly: ['temperature_2m', 'wind_speed_10m', 'wind_direction_10m', 'pressure_msl', 'relative_humidity_2m'],
        timezone: 'America/New_York'
      };

      await expect(weatherService.fetchAndParseWeather(request)).rejects.toThrow('Weather API request failed: API Error');
    });
  });
}); 