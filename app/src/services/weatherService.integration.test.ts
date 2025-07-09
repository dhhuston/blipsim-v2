import { WeatherService } from './weatherService';
import type { WeatherRequest } from '../types/weather';

describe('WeatherService Real API Integration', () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = new WeatherService();
  });

  test('should fetch real weather data from Open-Meteo API', async () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const request: WeatherRequest = {
      latitude: 40.7128,
      longitude: -74.0060,
      start_date: dateStr,
      end_date: dateStr,
      hourly: ['temperature_2m', 'wind_speed_10m', 'wind_direction_10m'],
      timezone: 'America/New_York'
    };

    try {
      const response = await weatherService.fetchWeather(request);
      
      expect(response).toBeDefined();
      expect(response.latitude).toBeCloseTo(40.7128, 1);
      expect(response.longitude).toBeCloseTo(-74.0060, 1);
      expect(response.timezone).toBe('America/New_York');
      expect(response.hourly).toBeDefined();
      expect(response.hourly.time).toBeDefined();
      expect(response.hourly.temperature_2m).toBeDefined();
      expect(response.hourly.wind_speed_10m).toBeDefined();
      expect(response.hourly.wind_direction_10m).toBeDefined();
      expect(response.hourly.time.length).toBeGreaterThan(0);
      
      console.log('✅ Successfully connected to Open-Meteo API!');
      console.log(`Received ${response.hourly.time.length} hourly data points`);
      console.log(`Temperature range: ${Math.min(...response.hourly.temperature_2m)}°C to ${Math.max(...response.hourly.temperature_2m)}°C`);
      console.log(`Wind speed range: ${Math.min(...response.hourly.wind_speed_10m)} km/h to ${Math.max(...response.hourly.wind_speed_10m)} km/h`);
    } catch (error) {
      console.error('❌ Open-Meteo API connection failed:', error);
      console.error('Request parameters:', JSON.stringify(request, null, 2));
      throw error;
    }
  }, 15000); // 15 second timeout for real API call
}); 