import axios, { AxiosError } from 'axios';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT = 10000; // 10 seconds

export interface WeatherParams {
  latitude: number;
  longitude: number;
  start?: string;
  end?: string;
  hourly?: string;
  [key: string]: any;
}

export async function fetchWeather(params: WeatherParams): Promise<any> {
  try {
    const response = await axios.get(OPEN_METEO_BASE_URL, {
      params,
      timeout: REQUEST_TIMEOUT,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Retry logic for network errors or timeouts
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // Optionally implement retry logic here
        throw new Error('Weather API request timed out.');
      }
      throw new Error(`Weather API error: ${error.message}`);
    }
    throw error;
  }
}

// Example error handling utility
export function handleWeatherApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return `Weather API error: ${error.message}`;
  }
  return 'Unknown error occurred while fetching weather data.';
} 