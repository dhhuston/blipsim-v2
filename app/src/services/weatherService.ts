import axios, { AxiosInstance, AxiosError } from 'axios';
import type { WeatherRequest, WeatherResponse, WeatherServiceConfig } from '../types/weather';

const DEFAULT_CONFIG: WeatherServiceConfig = {
  baseUrl: 'https://api.open-meteo.com/v1',
  timeout: 10000,
  retryAttempts: 3,
  rateLimit: 100 // requests/hour
};

function getCacheKey(req: WeatherRequest): string {
  return JSON.stringify(req);
}

// Weather data parsing utilities
export interface ParsedWeatherData {
  timestamp: string;
  temperature: number;        // Kelvin
  pressure: number;          // Pa
  humidity: number;          // Percentage (0-100)
  windSpeed: number;         // m/s
  windDirection: number;     // degrees (0-360)
  windU: number;            // U-component (m/s)
  windV: number;            // V-component (m/s)
  altitude: number;         // meters
}

export interface AltitudeInterpolatedData {
  altitude: number;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  pressure: number;
  humidity: number;
}

export class WeatherService {
  private axios: AxiosInstance;
  private config: WeatherServiceConfig;
  private weatherCache: Map<string, WeatherResponse>;
  private requestCount: number;
  private lastReset: number;

  constructor(config?: Partial<WeatherServiceConfig>, axiosInstance?: AxiosInstance) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.axios = axiosInstance || axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout
    });
    this.weatherCache = new Map();
    this.requestCount = 0;
    this.lastReset = Date.now();
  }

  private checkRateLimit() {
    const now = Date.now();
    if (now - this.lastReset > 60 * 60 * 1000) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    if (this.requestCount >= this.config.rateLimit) {
      throw new Error('Weather API rate limit exceeded');
    }
    this.requestCount++;
  }

  async fetchWeather(req: WeatherRequest): Promise<WeatherResponse> {
    const cacheKey = getCacheKey(req);
    if (this.weatherCache.has(cacheKey)) {
      return this.weatherCache.get(cacheKey)!;
    }
    this.checkRateLimit();
    let attempt = 0;
    let lastError: any = null;
    // Convert hourly array to comma-separated string if needed
    const params = { ...req, hourly: Array.isArray(req.hourly) ? req.hourly.join(',') : req.hourly };
    while (attempt < this.config.retryAttempts) {
      try {
        const response = await this.axios.get<WeatherResponse>('/forecast', {
          params
        });
        this.weatherCache.set(cacheKey, response.data);
        return response.data;
      } catch (err) {
        lastError = err;
        if (axios.isAxiosError(err)) {
          if (err.code === 'ECONNABORTED' || err.response?.status === 429 || err.response?.status === 503) {
            // Retry on timeout, rate limit, or service unavailable
            attempt++;
            await new Promise(res => setTimeout(res, 500 * attempt));
            continue;
          }
        }
        break; // Non-retryable error
      }
    }
    // Fallback: return empty data structure or throw
    if (lastError) {
      throw new Error(`Weather API request failed: ${lastError.message}`);
    }
    throw new Error('Unknown weather API error');
  }

  /**
   * Parse wind U/V components from wind speed and direction
   */
  private parseWindComponents(windSpeed: number, windDirection: number): { windU: number; windV: number } {
    // Convert direction to radians (meteorological convention: 0° = North, 90° = East)
    const directionRad = (windDirection * Math.PI) / 180;
    
    // Calculate U and V components
    // U = -windSpeed * sin(direction) (positive = west to east)
    // V = -windSpeed * cos(direction) (positive = south to north)
    const windU = -windSpeed * Math.sin(directionRad);
    const windV = -windSpeed * Math.cos(directionRad);
    
    return { windU, windV };
  }

  /**
   * Convert temperature from Celsius to Kelvin
   */
  private convertTemperatureToKelvin(celsius: number): number {
    return celsius + 273.15;
  }

  /**
   * Convert pressure from hPa to Pa
   */
  private convertPressureToPa(hPa: number): number {
    return hPa * 100;
  }

  /**
   * Parse raw weather response into structured data
   */
  parseWeatherData(response: WeatherResponse): ParsedWeatherData[] {
    const parsedData: ParsedWeatherData[] = [];
    
    if (!response.hourly || !response.hourly.time || response.hourly.time.length === 0) {
      throw new Error('Invalid weather response: missing hourly data');
    }

    const { time, temperature_2m, wind_speed_10m, wind_direction_10m, pressure_msl, relative_humidity_2m } = response.hourly;
    
    for (let i = 0; i < time.length; i++) {
      // Skip entries with missing data
      if (temperature_2m[i] === null || wind_speed_10m[i] === null || 
          wind_direction_10m[i] === null || pressure_msl[i] === null || 
          relative_humidity_2m[i] === null) {
        continue;
      }

      const windComponents = this.parseWindComponents(wind_speed_10m[i], wind_direction_10m[i]);
      
      const parsedPoint: ParsedWeatherData = {
        timestamp: time[i],
        temperature: this.convertTemperatureToKelvin(temperature_2m[i]),
        pressure: this.convertPressureToPa(pressure_msl[i]),
        humidity: relative_humidity_2m[i],
        windSpeed: wind_speed_10m[i],
        windDirection: wind_direction_10m[i],
        windU: windComponents.windU,
        windV: windComponents.windV,
        altitude: 10 // Surface level (10m)
      };
      
      parsedData.push(parsedPoint);
    }
    
    return parsedData;
  }

  /**
   * Interpolate weather data for specific altitude
   * Uses standard atmospheric model for temperature and pressure
   */
  interpolateForAltitude(
    surfaceData: ParsedWeatherData, 
    targetAltitude: number
  ): AltitudeInterpolatedData {
    // Standard atmospheric model constants
    const GRAVITY = 9.80665; // m/s²
    const MOLAR_MASS_AIR = 0.0289644; // kg/mol
    const UNIVERSAL_GAS_CONSTANT = 8.31432; // J/(mol·K)
    const LAPSE_RATE = 0.0065; // K/m (temperature decrease with altitude)
    
    const surfaceAltitude = surfaceData.altitude;
    const altitudeDifference = targetAltitude - surfaceAltitude;
    
    // Interpolate temperature using lapse rate
    const temperatureAtAltitude = surfaceData.temperature - (LAPSE_RATE * altitudeDifference);
    
    // Calculate pressure using barometric formula
    const pressureAtAltitude = surfaceData.pressure * 
      Math.exp(-(GRAVITY * MOLAR_MASS_AIR * altitudeDifference) / 
               (UNIVERSAL_GAS_CONSTANT * surfaceData.temperature));
    
    // Humidity decreases with altitude (simplified model)
    const humidityAtAltitude = Math.max(0, surfaceData.humidity - (altitudeDifference * 0.1));
    
    // Wind speed increases with altitude (wind shear model)
    const windSpeedAtAltitude = surfaceData.windSpeed * 
      Math.pow(targetAltitude / surfaceAltitude, 0.143); // 1/7 power law
    
    // Wind direction changes with altitude (simplified model)
    let windDirectionAtAltitude = surfaceData.windDirection;
    if (altitudeDifference > 1000) {
      // Add some variation for higher altitudes
      windDirectionAtAltitude = (windDirectionAtAltitude + (altitudeDifference / 1000) * 5) % 360;
    }
    
    return {
      altitude: targetAltitude,
      windSpeed: windSpeedAtAltitude,
      windDirection: windDirectionAtAltitude,
      temperature: temperatureAtAltitude,
      pressure: pressureAtAltitude,
      humidity: humidityAtAltitude
    };
  }

  /**
   * Fetch and parse weather data with altitude interpolation
   */
  async fetchAndParseWeather(req: WeatherRequest, targetAltitudes?: number[]): Promise<{
    surfaceData: ParsedWeatherData[];
    altitudeData: AltitudeInterpolatedData[][];
  }> {
    const rawResponse = await this.fetchWeather(req);
    const surfaceData = this.parseWeatherData(rawResponse);
    
    let altitudeData: AltitudeInterpolatedData[][] = [];
    
    if (targetAltitudes && targetAltitudes.length > 0) {
      altitudeData = surfaceData.map(surfacePoint => 
        targetAltitudes.map(altitude => 
          this.interpolateForAltitude(surfacePoint, altitude)
        )
      );
    }
    
    return {
      surfaceData,
      altitudeData
    };
  }
}

// Default export uses the default axios instance
export default new WeatherService(); 