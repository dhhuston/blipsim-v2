// Forecast window calculation service for weather data selection
// Based on task-12d specifications

import { 
  FlightParameters, 
  FlightDurationEstimate, 
  estimateFlightDuration, 
  getRecommendedForecastWindow 
} from '../utils/flightDuration';
import { convertToUTC, getTimezoneForLocation } from '../utils/timezoneUtils';
import { calculateAltitudeRequirements, AltitudeRequirements } from '../utils/altitudeProfile';

export interface ForecastWindowRequest {
  launchTime: string;              // ISO timestamp
  launchLocation: { lat: number; lng: number; alt?: number };
  balloonSpecs: {
    balloonVolume: number;         // m³
    payloadWeight: number;         // kg
    balloonWeight: number;         // kg
    burstAltitude: number;         // m
    ascentRate: number;            // m/s
    dragCoefficient: number;       // dimensionless
  };
  uncertaintyMargin?: number;      // Additional safety margin in minutes
  forecastResolution?: 'hourly' | '3hourly' | '6hourly';
}

export interface ForecastWindow {
  start: string;                   // ISO timestamp (UTC)
  end: string;                     // ISO timestamp (UTC)
  duration: number;                // Total window duration in hours
  resolution: 'hourly' | '3hourly' | '6hourly';
  safetyMargin: number;           // Safety margin in minutes
  flightDuration: FlightDurationEstimate;
  altitudeRequirements: AltitudeRequirements;
  timezone: string;               // IANA timezone identifier
  quality: {
    confidence: 'high' | 'medium' | 'low';
    uncertaintyFactor: number;    // 0-1 scale
    recommendations: string[];
  };
}

export interface ModelAvailability {
  model: string;                  // Model name (GFS, ECMWF, etc.)
  updateCycle: number;            // Hours between updates
  latency: number;                // Hours delay for data availability
  maxForecastHours: number;       // Maximum forecast horizon
  resolution: {
    temporal: 'hourly' | '3hourly' | '6hourly';
    spatial: number;              // Grid resolution in km
    vertical: number;             // Altitude levels
  };
}

/**
 * Calculate optimal forecast window for weather data selection
 * @param request Forecast window request parameters
 * @returns Optimized forecast window with metadata
 */
export function calculateForecastWindow(request: ForecastWindowRequest): ForecastWindow {
  try {
    // Validate request
    if (!validateForecastRequest(request)) {
      throw new Error('Invalid forecast window request parameters');
    }

    // Convert launch time to UTC and get timezone
    const timezone = getTimezoneForLocation(request.launchLocation);
    const timeConversion = convertToUTC(request.launchTime, request.launchLocation);

    // Prepare flight parameters
    const flightParams: FlightParameters = {
      balloonVolume: request.balloonSpecs.balloonVolume,
      payloadWeight: request.balloonSpecs.payloadWeight,
      balloonWeight: request.balloonSpecs.balloonWeight,
      launchAltitude: request.launchLocation.alt || 0,
      burstAltitude: request.balloonSpecs.burstAltitude,
      ascentRate: request.balloonSpecs.ascentRate,
      dragCoefficient: request.balloonSpecs.dragCoefficient
    };

    // Estimate flight duration
    const flightDuration = estimateFlightDuration(flightParams);

    // Calculate altitude requirements
    const altitudeRequirements = calculateAltitudeRequirements(
      flightParams.launchAltitude,
      flightParams.burstAltitude
    );

    // Get recommended forecast window
    const recommendedWindow = getRecommendedForecastWindow(flightDuration, timeConversion.utc);

    // Apply additional uncertainty margin if provided
    const additionalMargin = request.uncertaintyMargin || 0;
    const totalSafetyMargin = recommendedWindow.safetyMargin + additionalMargin;

    // Adjust window times with additional margin
    const adjustedStart = new Date(
      new Date(recommendedWindow.start).getTime() - additionalMargin * 60 * 1000
    ).toISOString();
    
    const adjustedEnd = new Date(
      new Date(recommendedWindow.end).getTime() + additionalMargin * 60 * 1000
    ).toISOString();

    // Determine optimal forecast resolution
    const resolution = determineOptimalResolution(
      flightDuration,
      request.forecastResolution
    );

    // Assess window quality
    const quality = assessWindowQuality(flightDuration, totalSafetyMargin, resolution);

    return {
      start: adjustedStart,
      end: adjustedEnd,
      duration: Math.ceil((new Date(adjustedEnd).getTime() - new Date(adjustedStart).getTime()) / (1000 * 60 * 60)),
      resolution,
      safetyMargin: totalSafetyMargin,
      flightDuration,
      altitudeRequirements,
      timezone,
      quality
    };
  } catch (error) {
    console.error('Forecast window calculation failed:', error);
    
    // Return conservative fallback window
    const fallbackStart = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3 hours ago
    const fallbackEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
    
    return {
      start: fallbackStart,
      end: fallbackEnd,
      duration: 27,
      resolution: '3hourly',
      safetyMargin: 180, // 3 hours
      flightDuration: {
        ascentTime: 120,
        descentTime: 60,
        totalFlightTime: 180,
        uncertaintyMargin: 60,
        confidence: 'low'
      },
      altitudeRequirements: {
        min: 0,
        max: 30000,
        intervals: [0, 5000, 10000, 15000, 20000, 25000, 30000],
        resolution: 5000,
        safetyMargin: 5000
      },
      timezone: 'UTC',
      quality: {
        confidence: 'low',
        uncertaintyFactor: 0.8,
        recommendations: ['Use fallback window due to calculation error']
      }
    };
  }
}

/**
 * Determine optimal forecast resolution based on flight characteristics
 */
function determineOptimalResolution(
  flightDuration: FlightDurationEstimate,
  requestedResolution?: 'hourly' | '3hourly' | '6hourly'
): 'hourly' | '3hourly' | '6hourly' {
  // Use requested resolution if provided and appropriate
  if (requestedResolution) {
    return requestedResolution;
  }

  // Choose resolution based on flight duration and confidence
  if (flightDuration.totalFlightTime <= 120 && flightDuration.confidence === 'high') {
    return 'hourly'; // Short flights need high temporal resolution
  } else if (flightDuration.totalFlightTime <= 360) {
    return '3hourly'; // Medium flights use 3-hourly
  } else {
    return '6hourly'; // Long flights can use 6-hourly
  }
}

/**
 * Assess the quality of the forecast window
 */
function assessWindowQuality(
  flightDuration: FlightDurationEstimate,
  safetyMargin: number,
  resolution: 'hourly' | '3hourly' | '6hourly'
): {
  confidence: 'high' | 'medium' | 'low';
  uncertaintyFactor: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let confidence: 'high' | 'medium' | 'low' = flightDuration.confidence;
  let uncertaintyFactor = flightDuration.uncertaintyMargin / flightDuration.totalFlightTime;

  // Adjust confidence based on safety margin
  const marginRatio = safetyMargin / flightDuration.totalFlightTime;
  if (marginRatio < 0.2) {
    confidence = 'low';
    uncertaintyFactor += 0.2;
    recommendations.push('Consider increasing safety margin for better forecast coverage');
  } else if (marginRatio > 0.8) {
    recommendations.push('Large safety margin may include irrelevant weather data');
  }

  // Adjust confidence based on resolution
  const resolutionMinutes = resolution === 'hourly' ? 60 : resolution === '3hourly' ? 180 : 360;
  if (resolutionMinutes > flightDuration.totalFlightTime / 4) {
    confidence = confidence === 'high' ? 'medium' : 'low';
    uncertaintyFactor += 0.1;
    recommendations.push('Consider higher temporal resolution for short flight duration');
  }

  // Cap uncertainty factor
  uncertaintyFactor = Math.min(1.0, uncertaintyFactor);

  // Downgrade confidence if uncertainty is too high
  if (uncertaintyFactor > 0.7) {
    confidence = 'low';
    recommendations.push('High uncertainty detected - consider validating balloon specifications');
  } else if (uncertaintyFactor > 0.4 && confidence === 'high') {
    confidence = 'medium';
  }

  return {
    confidence,
    uncertaintyFactor,
    recommendations
  };
}

/**
 * Get available weather models and their characteristics
 */
export function getAvailableWeatherModels(): ModelAvailability[] {
  return [
    {
      model: 'GFS',
      updateCycle: 6,
      latency: 4,
      maxForecastHours: 384,
      resolution: {
        temporal: '3hourly',
        spatial: 25,
        vertical: 31
      }
    },
    {
      model: 'ECMWF',
      updateCycle: 12,
      latency: 6,
      maxForecastHours: 240,
      resolution: {
        temporal: '6hourly',
        spatial: 18,
        vertical: 37
      }
    },
    {
      model: 'NAM',
      updateCycle: 6,
      latency: 2,
      maxForecastHours: 84,
      resolution: {
        temporal: 'hourly',
        spatial: 12,
        vertical: 40
      }
    },
    {
      model: 'Open-Meteo',
      updateCycle: 1,
      latency: 1,
      maxForecastHours: 240,
      resolution: {
        temporal: 'hourly',
        spatial: 11,
        vertical: 25
      }
    }
  ];
}

/**
 * Select best weather model for forecast window
 */
export function selectOptimalWeatherModel(
  forecastWindow: ForecastWindow,
  availableModels: ModelAvailability[] = getAvailableWeatherModels()
): {
  selectedModel: ModelAvailability;
  reasoning: string[];
  alternatives: ModelAvailability[];
} {
  const reasoning: string[] = [];
  const alternatives: ModelAvailability[] = [];

  // Filter models that can provide the required forecast horizon
  const suitableModels = availableModels.filter(model => {
    const hoursNeeded = forecastWindow.duration;
    const isCapable = model.maxForecastHours >= hoursNeeded;
    
    if (!isCapable) {
      reasoning.push(`${model.model} excluded: insufficient forecast horizon (${model.maxForecastHours}h < ${hoursNeeded}h needed)`);
    }
    
    return isCapable;
  });

  if (suitableModels.length === 0) {
    throw new Error('No weather models can provide the required forecast horizon');
  }

  // Score models based on multiple criteria
  const scoredModels = suitableModels.map(model => {
    let score = 0;
    const modelReasons: string[] = [];

    // Temporal resolution score (higher resolution = better)
    if (model.resolution.temporal === forecastWindow.resolution) {
      score += 3;
      modelReasons.push('Perfect temporal resolution match');
    } else if (
      (model.resolution.temporal === 'hourly' && forecastWindow.resolution === '3hourly') ||
      (model.resolution.temporal === '3hourly' && forecastWindow.resolution === '6hourly')
    ) {
      score += 2;
      modelReasons.push('Higher temporal resolution available');
    } else {
      score += 1;
      modelReasons.push('Temporal resolution acceptable');
    }

    // Latency score (lower latency = better)
    if (model.latency <= 2) {
      score += 2;
      modelReasons.push('Low data latency');
    } else if (model.latency <= 4) {
      score += 1;
      modelReasons.push('Moderate data latency');
    } else {
      modelReasons.push('High data latency');
    }

    // Update frequency score (more frequent = better for short forecasts)
    if (forecastWindow.duration <= 12 && model.updateCycle <= 6) {
      score += 2;
      modelReasons.push('Frequent updates for short forecast');
    } else if (model.updateCycle <= 12) {
      score += 1;
      modelReasons.push('Regular update cycle');
    }

    // Spatial resolution bonus
    if (model.resolution.spatial <= 15) {
      score += 1;
      modelReasons.push('High spatial resolution');
    }

    return { model, score, reasons: modelReasons };
  });

  // Sort by score (highest first)
  scoredModels.sort((a, b) => b.score - a.score);

  const selectedModel = scoredModels[0].model;
  reasoning.push(...scoredModels[0].reasons);

  // Add alternatives
  alternatives.push(...scoredModels.slice(1).map(sm => sm.model));

  return {
    selectedModel,
    reasoning,
    alternatives
  };
}

/**
 * Validate forecast window request parameters
 */
function validateForecastRequest(request: ForecastWindowRequest): boolean {
  if (!request.launchTime || isNaN(Date.parse(request.launchTime))) {
    return false;
  }

  if (!request.launchLocation || 
      request.launchLocation.lat < -90 || request.launchLocation.lat > 90 ||
      request.launchLocation.lng < -180 || request.launchLocation.lng > 180) {
    return false;
  }

  const specs = request.balloonSpecs;
  if (!specs ||
      specs.balloonVolume <= 0 ||
      specs.payloadWeight <= 0 ||
      specs.balloonWeight <= 0 ||
      specs.burstAltitude <= (request.launchLocation.alt || 0) ||
      specs.ascentRate <= 0 ||
      specs.dragCoefficient <= 0) {
    return false;
  }

  return true;
}

/**
 * Handle forecast window updates when weather model data becomes available
 */
export function updateForecastWindow(
  originalWindow: ForecastWindow,
  modelUpdateTime: string
): {
  shouldUpdate: boolean;
  updatedWindow?: ForecastWindow;
  updateReason: string;
} {
  const updateTime = new Date(modelUpdateTime);
  const windowStart = new Date(originalWindow.start);
  const windowEnd = new Date(originalWindow.end);
  const currentTime = new Date();

  // Don't update if we're past the launch time
  if (currentTime >= windowStart) {
    return {
      shouldUpdate: false,
      updateReason: 'Launch time has passed - no update needed'
    };
  }

  // Update if new model data is available and improves forecast accuracy
  const timeTillLaunch = (windowStart.getTime() - currentTime.getTime()) / (1000 * 60 * 60); // hours
  
  if (timeTillLaunch > 24 && updateTime > windowStart) {
    return {
      shouldUpdate: true,
      updateReason: 'New model data available - updating for improved accuracy'
    };
  }

  return {
    shouldUpdate: false,
    updateReason: 'No beneficial update available'
  };
} 