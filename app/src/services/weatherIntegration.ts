import { WeatherService, ParsedWeatherData, AltitudeInterpolatedData } from './weatherService';
import type { WeatherRequest, WeatherResponse } from '../types/weather';

// Weather integration types
export interface WeatherConditions {
  timestamp: string;
  altitude: number;
  temperature: number;    // Celsius
  pressure: number;       // hPa
  humidity: number;       // %
  windSpeed: number;      // m/s
  windDirection: number;  // degrees
  uncertainty: number;    // confidence level 0-1
}

export interface EnhancedPredictionInput {
  launchLocation: { lat: number; lng: number; alt?: number };
  launchTime: string;
  balloonSpecs: {
    burstAltitude: number;
    ascentRate: number;
    payloadWeight: number;
    dragCoefficient: number;
  };
  weatherConditions: WeatherConditions[];
}

export interface WeatherIntegratedPrediction {
  trajectory: Array<{
    timestamp: string;
    latitude: number;
    longitude: number;
    altitude: number;
    windSpeed: number;
    windDirection: number;
  }>;
  burstSite: {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: string;
  };
  landingSite: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  weatherImpact: {
    windDrift: number;      // km
    altitudeEffect: number; // m
    uncertaintyRadius: number; // km
  };
  forecastQuality: 'high' | 'medium' | 'low';
}

export interface WeatherIntegrationConfig {
  weatherService: WeatherService;
  targetAltitudes?: number[];
  interpolationEnabled?: boolean;
  cacheEnabled?: boolean;
}

export class WeatherIntegrationService {
  private weatherService: WeatherService;
  private targetAltitudes: number[];
  private interpolationEnabled: boolean;
  private cacheEnabled: boolean;
  private weatherCache: Map<string, WeatherConditions[]>;

  constructor(config: WeatherIntegrationConfig) {
    this.weatherService = config.weatherService;
    this.targetAltitudes = config.targetAltitudes || [1000, 5000, 10000, 15000, 20000, 25000, 30000];
    this.interpolationEnabled = config.interpolationEnabled ?? true;
    this.cacheEnabled = config.cacheEnabled ?? true;
    this.weatherCache = new Map();
  }

  /**
   * Main integration function that processes weather data for prediction algorithms
   */
  async integrateWeatherData(
    launchLocation: { lat: number; lng: number; alt?: number },
    launchTime: string,
    flightDuration: number = 1440 // Default 24 hours in minutes
  ): Promise<WeatherConditions[]> {
    try {
      // Calculate weather window
      const weatherWindow = this.calculateWeatherWindow(launchTime, flightDuration);
      
      // Fetch weather data
      const weatherRequest: WeatherRequest = {
        latitude: launchLocation.lat,
        longitude: launchLocation.lng,
        hourly: ['temperature_2m', 'wind_speed_10m', 'wind_direction_10m', 'pressure_msl', 'relative_humidity_2m'],
        start_date: weatherWindow.start,
        end_date: weatherWindow.end,
        timezone: 'auto'
      };

      const weatherData = await this.weatherService.fetchAndParseWeather(
        weatherRequest,
        this.targetAltitudes
      );

      // Process and interpolate weather conditions
      const processedConditions = this.processAtmosphericConditions(weatherData);
      
      // Cache the results if enabled
      if (this.cacheEnabled) {
        const cacheKey = this.generateCacheKey(launchLocation, launchTime, flightDuration);
        this.weatherCache.set(cacheKey, processedConditions);
      }

      return processedConditions;
    } catch (error) {
      console.error('Weather integration failed:', error);
      throw new Error(`Weather integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate wind effects on trajectory
   */
  calculateWindEffects(
    trajectory: Array<{ altitude: number; timestamp: string }>,
    weatherConditions: WeatherConditions[]
  ): {
    windDrift: number;
    altitudeEffect: number;
    uncertaintyRadius: number;
  } {
    let totalWindDrift = 0;
    let altitudeVariance = 0;
    let uncertaintySum = 0;
    let validPoints = 0;

    if (!trajectory.length || !weatherConditions.length) {
      return {
        windDrift: 0,
        altitudeEffect: 0,
        uncertaintyRadius: 0
      };
    }

    for (const point of trajectory) {
      const weatherAtPoint = this.interpolateWeatherConditions(
        point.altitude,
        point.timestamp,
        weatherConditions
      );

      if (weatherAtPoint) {
        // Calculate wind drift contribution
        const windDriftContribution = weatherAtPoint.windSpeed * 0.1; // Simplified model
        totalWindDrift += windDriftContribution || 0;

        // Calculate altitude effect from temperature (temperature in Celsius)
        const temperature = isNaN(weatherAtPoint.temperature) ? 15 : weatherAtPoint.temperature;
        const temperatureEffect = (temperature - 15) * 0.01; // 15°C baseline
        altitudeVariance += Math.abs(temperatureEffect);

        // Accumulate uncertainty
        const uncertainty = isNaN(weatherAtPoint.uncertainty) ? 0.1 : weatherAtPoint.uncertainty;
        uncertaintySum += uncertainty;
        validPoints++;
      }
    }

    if (validPoints === 0) {
      return {
        windDrift: 0,
        altitudeEffect: 0,
        uncertaintyRadius: 0
      };
    }

    const averageUncertainty = uncertaintySum / validPoints;
    const uncertaintyRadius = averageUncertainty * 5; // Convert to km
    const safeAltitudeVariance = altitudeVariance / validPoints;

    return {
      windDrift: totalWindDrift,
      altitudeEffect: safeAltitudeVariance,
      uncertaintyRadius
    };
  }

  /**
   * Validate weather data quality
   */
  validateWeatherData(weatherConditions: WeatherConditions[]): {
    isValid: boolean;
    quality: 'high' | 'medium' | 'low';
    issues: string[];
  } {
    const issues: string[] = [];
    let dataPoints = 0;
    let validPoints = 0;

    for (const condition of weatherConditions) {
      dataPoints++;
      // Check for missing or invalid data (temperature in Celsius)
      if (condition.temperature < -100 || condition.temperature > 100) {
        issues.push(`Invalid temperature: ${condition.temperature}°C at ${condition.altitude}m`);
      }
      if (condition.pressure < 0 || condition.pressure > 200000) {
        issues.push(`Invalid pressure: ${condition.pressure}Pa at ${condition.altitude}m`);
      }
      if (condition.windSpeed < 0 || condition.windSpeed > 100) {
        issues.push(`Invalid wind speed: ${condition.windSpeed}m/s at ${condition.altitude}m`);
      }
      if (condition.humidity < 0 || condition.humidity > 100) {
        issues.push(`Invalid humidity: ${condition.humidity}% at ${condition.altitude}m`);
      }
      if (condition.uncertainty < 0 || condition.uncertainty > 1) {
        issues.push(`Invalid uncertainty: ${condition.uncertainty} at ${condition.altitude}m`);
      }

      if (issues.length === 0) {
        validPoints++;
      }
    }

    const validityRatio = dataPoints > 0 ? validPoints / dataPoints : 0;
    const isValid = validityRatio > 0.8;

    let quality: 'high' | 'medium' | 'low';
    if (validityRatio > 0.95) {
      quality = 'high';
    } else if (validityRatio >= 0.5) { // Adjusted threshold for medium
      quality = 'medium';
    } else {
      quality = 'low';
    }

    return { isValid, quality, issues };
  }

  /**
   * Interpolate weather conditions for specific altitude and time
   */
  interpolateWeatherConditions(
    altitude: number,
    timestamp: string,
    weatherConditions: WeatherConditions[]
  ): WeatherConditions | null {
    if (!this.interpolationEnabled || weatherConditions.length === 0) {
      return weatherConditions.find(c => 
        c.altitude === altitude && c.timestamp === timestamp
      ) || null;
    }

    // Find nearest conditions for interpolation
    const timeMatches = weatherConditions.filter(c => c.timestamp === timestamp);
    if (timeMatches.length === 0) {
      return null;
    }

    // Find altitude bounds
    const altitudes = timeMatches.map(c => c.altitude).sort((a, b) => a - b);
    const lowerAltitude = altitudes.find(a => a <= altitude) || altitudes[0];
    const upperAltitude = altitudes.find(a => a >= altitude) || altitudes[altitudes.length - 1];

    const lowerCondition = timeMatches.find(c => c.altitude === lowerAltitude);
    const upperCondition = timeMatches.find(c => c.altitude === upperAltitude);

    if (!lowerCondition || !upperCondition) {
      return lowerCondition || upperCondition || null;
    }

    // Linear interpolation
    let altitudeRatio = 0;
    if (upperAltitude !== lowerAltitude) {
      altitudeRatio = (altitude - lowerAltitude) / (upperAltitude - lowerAltitude);
    }
    
    return {
      timestamp,
      altitude,
      temperature: this.interpolate(lowerCondition.temperature, upperCondition.temperature, altitudeRatio),
      pressure: this.interpolate(lowerCondition.pressure, upperCondition.pressure, altitudeRatio),
      humidity: this.interpolate(lowerCondition.humidity, upperCondition.humidity, altitudeRatio),
      windSpeed: this.interpolate(lowerCondition.windSpeed, upperCondition.windSpeed, altitudeRatio),
      windDirection: this.interpolateAngle(lowerCondition.windDirection, upperCondition.windDirection, altitudeRatio),
      uncertainty: this.interpolate(lowerCondition.uncertainty, upperCondition.uncertainty, altitudeRatio)
    };
  }

  /**
   * Process atmospheric conditions from raw weather data
   */
  private processAtmosphericConditions(weatherData: {
    surfaceData: ParsedWeatherData[];
    altitudeData: AltitudeInterpolatedData[][];
  }): WeatherConditions[] {
    const conditions: WeatherConditions[] = [];

    // Process surface data
    for (const surfacePoint of weatherData.surfaceData) {
      conditions.push({
        timestamp: surfacePoint.timestamp,
        altitude: surfacePoint.altitude,
        temperature: surfacePoint.temperature - 273.15, // Convert to Celsius
        pressure: surfacePoint.pressure / 100, // Convert to hPa
        humidity: surfacePoint.humidity,
        windSpeed: surfacePoint.windSpeed,
        windDirection: surfacePoint.windDirection,
        uncertainty: 0.1 // Default uncertainty for surface data
      });
    }

    // Process altitude data
    for (let i = 0; i < weatherData.altitudeData.length; i++) {
      const altitudePoints = weatherData.altitudeData[i];
      const surfacePoint = weatherData.surfaceData[i];

      for (const altitudePoint of altitudePoints) {
        conditions.push({
          timestamp: surfacePoint.timestamp,
          altitude: altitudePoint.altitude,
          temperature: altitudePoint.temperature - 273.15, // Convert to Celsius
          pressure: altitudePoint.pressure / 100, // Convert to hPa
          humidity: altitudePoint.humidity,
          windSpeed: altitudePoint.windSpeed,
          windDirection: altitudePoint.windDirection,
          uncertainty: 0.2 // Higher uncertainty for interpolated altitude data
        });
      }
    }

    return conditions;
  }

  /**
   * Calculate weather window based on launch time and flight duration
   */
  private calculateWeatherWindow(launchTime: string, flightDuration: number): {
    start: string;
    end: string;
  } {
    const launchDate = new Date(launchTime);
    const startDate = new Date(launchDate.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
    const endDate = new Date(launchDate.getTime() + flightDuration * 60 * 1000 + 2 * 60 * 60 * 1000); // Flight duration + 2 hours after

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }

  /**
   * Generate cache key for weather data
   */
  private generateCacheKey(
    location: { lat: number; lng: number; alt?: number },
    launchTime: string,
    flightDuration: number
  ): string {
    return `${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_${launchTime}_${flightDuration}`;
  }

  /**
   * Linear interpolation helper
   */
  private interpolate(start: number, end: number, ratio: number): number {
    // Handle edge cases
    if (isNaN(start) || isNaN(end) || isNaN(ratio)) {
      return isNaN(start) ? (isNaN(end) ? 0 : end) : start;
    }
    
    // Clamp ratio to prevent extrapolation
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    
    return start + (end - start) * clampedRatio;
  }

  /**
   * Angle interpolation helper (handles 0-360 degree wrap)
   */
  private interpolateAngle(start: number, end: number, ratio: number): number {
    let diff = end - start;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    const result = start + diff * ratio;
    return ((result % 360) + 360) % 360;
  }

  /**
   * Get cached weather data if available
   */
  getCachedWeatherData(
    location: { lat: number; lng: number; alt?: number },
    launchTime: string,
    flightDuration: number
  ): WeatherConditions[] | null {
    if (!this.cacheEnabled) return null;
    
    const cacheKey = this.generateCacheKey(location, launchTime, flightDuration);
    return this.weatherCache.get(cacheKey) || null;
  }

  /**
   * Clear weather cache
   */
  clearCache(): void {
    this.weatherCache.clear();
  }
}

// Default export with default weather service
export default new WeatherIntegrationService({
  weatherService: new WeatherService(),
  targetAltitudes: [1000, 5000, 10000, 15000, 20000, 25000, 30000],
  interpolationEnabled: true,
  cacheEnabled: true
}); 