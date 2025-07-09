import { fetchWeather, handleWeatherApiError } from './weatherService';

describe('weatherService', () => {
  it('should fetch weather data for valid coordinates', async () => {
    const data = await fetchWeather({
      latitude: 40.7128,
      longitude: -74.006,
      hourly: 'temperature_2m',
    });
    expect(data).toHaveProperty('hourly');
  }, 15000);

  it('should handle API errors gracefully', async () => {
    try {
      await fetchWeather({ latitude: 0, longitude: 0, hourly: 'invalid_param' });
    } catch (error) {
      const msg = handleWeatherApiError(error);
      expect(msg).toMatch(/Weather API error|Unknown error occurred while fetching weather data/);
    }
  });
}); 