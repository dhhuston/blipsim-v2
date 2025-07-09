// Unified prediction engine orchestrator for balloon trajectory calculation
// Based on task-11g specifications

import { calculateAscent, AscentInput, AscentResult } from './ascent';
import { calculateAtmosphericDensity } from './atmospheric';
import { WeatherIntegrationService, WeatherConditions } from '../services/weatherIntegration';

export interface PredictionInput {
  ascent: AscentInput;
  launchLocation: { lat: number; lng: number; alt?: number };
  launchTime: string;
  weatherIntegration?: WeatherIntegrationService;
  // Future: descent, wind drift, etc.
}

export interface PredictionResult {
  ascent: AscentResult;
  weatherImpact: {
    windDrift: number;
    altitudeEffect: number;
    uncertaintyRadius: number;
  };
  weatherQuality: 'high' | 'medium' | 'low';
  // Future: descent, wind drift, etc.
  totalDuration: number;
  totalDistance: number;
}

/**
 * Main prediction engine that orchestrates all trajectory calculations
 * @param input Prediction input parameters
 * @returns Complete prediction result
 */
export async function calculatePrediction(input: PredictionInput): Promise<PredictionResult> {
  // Validate inputs
  if (!input.ascent) {
    throw new Error('Ascent input is required');
  }

  if (!input.launchLocation || !input.launchTime) {
    throw new Error('Launch location and time are required for weather integration');
  }

  // Get weather integration service
  const weatherIntegration = input.weatherIntegration || new WeatherIntegrationService({
    weatherService: new (await import('../services/weatherService')).WeatherService()
  });

  try {
    // Fetch weather data for the prediction
    const weatherConditions = await weatherIntegration.integrateWeatherData(
      input.launchLocation,
      input.launchTime,
      1440 // Default 24-hour flight duration
    );

    // Validate weather data quality
    const weatherValidation = weatherIntegration.validateWeatherData(weatherConditions);
    if (!weatherValidation.isValid) {
      console.warn('Weather data quality issues detected:', weatherValidation.issues);
    }

    // Enhance ascent input with weather data
    const enhancedAscentInput = enhanceAscentInputWithWeather(input.ascent, weatherConditions);

    // Calculate ascent phase with weather integration
    const ascentResult = calculateAscent(enhancedAscentInput);

    // Calculate weather impact on trajectory
    const trajectory = ascentResult.trajectory.map(point => ({
      altitude: point.alt,
      timestamp: point.timestamp
    }));

    const weatherImpact = weatherIntegration.calculateWindEffects(trajectory, weatherConditions);

    // Calculate total metrics
    const totalDuration = ascentResult.ascentDuration;
    const totalDistance = ascentResult.windDrift;

    return {
      ascent: ascentResult,
      weatherImpact,
      weatherQuality: weatherValidation.quality,
      totalDuration,
      totalDistance
    };
  } catch (error) {
    console.error('Weather integration failed, falling back to basic prediction:', error);
    
    // Fallback to basic prediction without weather data
    const ascentResult = calculateAscent(input.ascent);
    
    return {
      ascent: ascentResult,
      weatherImpact: {
        windDrift: 0,
        altitudeEffect: 0,
        uncertaintyRadius: 0
      },
      weatherQuality: 'low',
      totalDuration: ascentResult.ascentDuration,
      totalDistance: ascentResult.windDrift
    };
  }
}

/**
 * Enhance ascent input with weather data
 */
function enhanceAscentInputWithWeather(
  ascentInput: AscentInput,
  weatherConditions: WeatherConditions[]
): AscentInput {
  // Find weather conditions at launch altitude
  const launchWeather = weatherConditions.find(
    condition => condition.altitude === ascentInput.launchAltitude
  ) || weatherConditions[0];

  if (launchWeather) {
    return {
      ...ascentInput,
      windSpeed: launchWeather.windSpeed,
      windDirection: launchWeather.windDirection,
      atmosphericDensity: calculateAtmosphericDensity(ascentInput.launchAltitude)
    };
  }

  return ascentInput;
}

/**
 * Validate prediction input parameters
 * @param input Prediction input to validate
 * @returns True if valid, false otherwise
 */
export function validatePredictionInput(input: PredictionInput): boolean {
  if (!input.ascent) {
    return false;
  }

  if (!input.launchLocation || !input.launchTime) {
    return false;
  }

  // Validate launch location
  const { lat, lng } = input.launchLocation;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }

  // Validate launch time
  if (isNaN(Date.parse(input.launchTime))) {
    return false;
  }

  // Validate ascent inputs
  const { ascent } = input;
  return (
    ascent.balloonVolume > 0 &&
    ascent.payloadWeight > 0 &&
    ascent.launchAltitude >= 0 &&
    ascent.burstAltitude > ascent.launchAltitude &&
    ascent.ascentRate > 0 &&
    ascent.atmosphericDensity > 0 &&
    ascent.windSpeed >= 0 &&
    ascent.windDirection >= 0 &&
    ascent.windDirection <= 360
  );
}

/**
 * Get atmospheric conditions for prediction
 * @param altitude Altitude in meters
 * @returns Atmospheric conditions
 */
export function getAtmosphericConditions(altitude: number) {
  return {
    density: calculateAtmosphericDensity(altitude),
    altitude
  };
}

/**
 * Calculate weather-aware atmospheric conditions
 * @param altitude Altitude in meters
 * @param weatherConditions Weather conditions array
 * @param timestamp Timestamp for weather lookup
 * @returns Enhanced atmospheric conditions
 */
export function getWeatherAwareAtmosphericConditions(
  altitude: number,
  weatherConditions: WeatherConditions[],
  timestamp: string
) {
  const weatherAtAltitude = weatherConditions.find(
    condition => condition.altitude === altitude && condition.timestamp === timestamp
  );

  if (weatherAtAltitude) {
    return {
      density: calculateAtmosphericDensity(altitude),
      temperature: weatherAtAltitude.temperature,
      pressure: weatherAtAltitude.pressure,
      humidity: weatherAtAltitude.humidity,
      windSpeed: weatherAtAltitude.windSpeed,
      windDirection: weatherAtAltitude.windDirection,
      altitude
    };
  }

  // Fallback to standard atmospheric model
  return {
    density: calculateAtmosphericDensity(altitude),
    altitude
  };
} 