// Weather type definitions for Open-Meteo API integration

export interface WeatherRequest {
  latitude: number;
  longitude: number;
  start_date: string;    // YYYY-MM-DD
  end_date: string;      // YYYY-MM-DD
  hourly: string[];      // ['temperature_2m', 'wind_speed_10m', 'wind_direction_10m']
  timezone: string;      // 'auto' or specific timezone
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: string[];
    temperature_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    pressure_msl: number[];
    relative_humidity_2m: number[];
  };
}

export interface WeatherServiceConfig {
  baseUrl: string;       // 'https://api.open-meteo.com/v1'
  timeout: number;       // 10000ms
  retryAttempts: number; // 3
  rateLimit: number;     // 100 requests/hour
} 