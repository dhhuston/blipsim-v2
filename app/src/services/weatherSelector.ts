// Main weather selection logic for time-based weather data selection
// Based on task-12d specifications - integrates all weather selection components

import { 
  calculateForecastWindow, 
  selectOptimalWeatherModel,
  ForecastWindowRequest,
  ForecastWindow,
  ModelAvailability
} from './forecastWindow';
import { 
  interpolateTemporalData, 
  interpolateTimeSeriesData,
  TemporalDataPoint,
  InterpolationRequest,
  InterpolationResult
} from './temporalInterpolation';
import { 
  assessWeatherQuality,
  WeatherQualityAssessment,
  QualityRequest
} from './weatherQuality';
import { convertToUTC, synchronizeWeatherTimestamps } from '../utils/timezoneUtils';
import { calculateAltitudeRequirements } from '../utils/altitudeProfile';
import { estimateFlightDuration } from '../utils/flightDuration';

// Re-export types for convenience
export type { 
  ForecastWindow, 
  TemporalDataPoint, 
  InterpolationResult, 
  WeatherQualityAssessment 
};

export interface WeatherSelectionRequest {
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
  preferences?: {
    forecastResolution?: 'hourly' | '3hourly' | '6hourly';
    uncertaintyMargin?: number;    // Additional safety margin (minutes)
    interpolationMethod?: 'linear' | 'cubic' | 'spline';
    preferredModel?: string;       // Preferred weather model
    qualityThreshold?: number;     // Minimum acceptable quality (0-1)
  };
}

export interface WeatherSelectionResult {
  success: boolean;
  forecastWindow: ForecastWindow;
  selectedModel: {
    model: ModelAvailability;
    reasoning: string[];
    alternatives: ModelAvailability[];
  };
  weatherData: {
    surfaceData: TemporalDataPoint[];
    altitudeData: TemporalDataPoint[];
    interpolatedData: InterpolationResult[];
  };
  qualityAssessment: WeatherQualityAssessment;
  timeline: {
    dataFreshness: string;         // How fresh is the data
    validityPeriod: string;        // How long is data valid
    nextUpdate: string;            // When next update expected
  };
  performance: {
    selectionTime: number;         // ms
    dataPoints: number;
    cacheHitRate: number;         // 0-1
  };
  warnings: string[];
  recommendations: string[];
}

export interface TimeRange {
  start: string;                   // ISO timestamp
  end: string;                     // ISO timestamp
}

/**
 * Main function to select optimal weather data based on timing and flight parameters
 * @param request Weather selection request
 * @returns Complete weather selection result with quality assessment
 */
export async function selectWeatherData(request: WeatherSelectionRequest): Promise<WeatherSelectionResult> {
  const startTime = performance.now();
  const warnings: string[] = [];
  const recommendations: string[] = [];

  try {
    // Validate request
    if (!validateSelectionRequest(request)) {
      throw new Error('Invalid weather selection request');
    }

    // Step 1: Calculate optimal forecast window
    const forecastRequest: ForecastWindowRequest = {
      launchTime: request.launchTime,
      launchLocation: request.launchLocation,
      balloonSpecs: request.balloonSpecs,
      uncertaintyMargin: request.preferences?.uncertaintyMargin,
      forecastResolution: request.preferences?.forecastResolution
    };

    const forecastWindow = calculateForecastWindow(forecastRequest);
    
    if (forecastWindow.quality.uncertaintyFactor > (1 - (request.preferences?.qualityThreshold || 0.3))) {
      warnings.push('Forecast window quality below threshold');
      recommendations.push('Consider adjusting launch time or increasing safety margins');
    }

    // Step 2: Select optimal weather model
    const modelSelection = selectOptimalWeatherModel(forecastWindow);
    
    // Override with preferred model if specified and suitable
    if (request.preferences?.preferredModel) {
      const preferredModelSuitable = modelSelection.alternatives.find(
        m => m.model === request.preferences?.preferredModel
      ) || (modelSelection.selectedModel.model === request.preferences?.preferredModel ? modelSelection.selectedModel : null);
      
      if (preferredModelSuitable) {
        modelSelection.selectedModel = preferredModelSuitable;
        modelSelection.reasoning.unshift('User preferred model selected');
      } else {
        warnings.push(`Preferred model '${request.preferences.preferredModel}' not suitable for this forecast window`);
      }
    }

         // Step 3: Generate synthetic weather data (in real implementation, this would fetch from APIs)
     const rawWeatherData = await generateWeatherData(forecastWindow, modelSelection.selectedModel);

     // Step 4: Perform temporal interpolation for flight trajectory
     const interpolatedData = await performFlightTrajectoryInterpolation(
       request,
       forecastWindow,
       rawWeatherData,
       request.preferences?.interpolationMethod || 'linear'
     );

     // Combine raw and interpolated data
     const weatherData = {
       ...rawWeatherData,
       interpolatedData
     };

    // Step 5: Assess overall data quality
    const qualityAssessment = await assessDataQuality(
      request,
      forecastWindow,
      modelSelection.selectedModel,
      interpolatedData
    );

    // Step 6: Generate timeline information
    const timeline = generateTimeline(forecastWindow, modelSelection.selectedModel);

    // Step 7: Calculate performance metrics
    const endTime = performance.now();
    const performance_metrics = {
      selectionTime: endTime - startTime,
      dataPoints: weatherData.surfaceData.length + weatherData.altitudeData.length,
      cacheHitRate: 0.0 // Would be calculated from actual cache usage
    };

    // Add final recommendations
    if (qualityAssessment.overall === 'excellent') {
      recommendations.push('Weather data quality is excellent for balloon prediction');
    } else if (qualityAssessment.overall === 'poor') {
      recommendations.push('Consider postponing launch due to poor weather data quality');
    }

         return {
       success: true,
       forecastWindow,
       selectedModel: {
         model: modelSelection.selectedModel,
         reasoning: modelSelection.reasoning,
         alternatives: modelSelection.alternatives
       },
      weatherData,
      qualityAssessment,
      timeline,
      performance: performance_metrics,
      warnings,
      recommendations: [...recommendations, ...forecastWindow.quality.recommendations, ...qualityAssessment.recommendations]
    };

  } catch (error) {
    console.error('Weather selection failed:', error);
    
    const endTime = performance.now();
    
    // Return error result with fallback data
    return {
      success: false,
      forecastWindow: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 24,
        resolution: '3hourly',
        safetyMargin: 180,
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
          intervals: [0, 10000, 20000, 30000],
          resolution: 10000,
          safetyMargin: 5000
        },
        timezone: 'UTC',
        quality: {
          confidence: 'low',
          uncertaintyFactor: 0.8,
          recommendations: ['Error in weather selection - use fallback data']
        }
      },
      selectedModel: {
        model: {
          model: 'Fallback',
          updateCycle: 12,
          latency: 6,
          maxForecastHours: 72,
          resolution: { temporal: '6hourly', spatial: 50, vertical: 20 }
        },
        reasoning: ['Error fallback'],
        alternatives: []
      },
      weatherData: {
        surfaceData: [],
        altitudeData: [],
        interpolatedData: []
      },
      qualityAssessment: {
        overall: 'poor',
        temporal: 'low',
        spatial: 'low',
        confidence: 0.1,
        uncertainty: 0.9,
        reliability: { forecastAge: 0, forecastHorizon: 0, modelConfidence: 0.1, ensembleSpread: 1.0 },
        issues: ['Weather selection failed'],
        recommendations: ['Use alternative weather sources']
      },
      timeline: {
        dataFreshness: 'Unknown',
        validityPeriod: 'Unknown',
        nextUpdate: 'Unknown'
      },
      performance: {
        selectionTime: endTime - startTime,
        dataPoints: 0,
        cacheHitRate: 0
      },
      warnings: [`Weather selection error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Use alternative weather data sources', 'Consider postponing launch']
    };
  }
}

/**
 * Generate synthetic weather data for testing (replace with real API calls)
 */
async function generateWeatherData(
  forecastWindow: ForecastWindow,
  model: ModelAvailability
): Promise<{
  surfaceData: TemporalDataPoint[];
  altitudeData: TemporalDataPoint[];
}> {
  const surfaceData: TemporalDataPoint[] = [];
  const altitudeData: TemporalDataPoint[] = [];

  // Generate time series
  const startTime = new Date(forecastWindow.start);
  const endTime = new Date(forecastWindow.end);
  const timeStep = model.resolution.temporal === 'hourly' ? 1 : 
                   model.resolution.temporal === '3hourly' ? 3 : 6;

  for (let time = startTime.getTime(); time <= endTime.getTime(); time += timeStep * 60 * 60 * 1000) {
    const timestamp = new Date(time).toISOString();
    
    // Generate surface data (simplified)
    surfaceData.push({
      timestamp,
      values: {
        temperature: 15 + Math.sin(time / (24 * 60 * 60 * 1000)) * 10, // Daily temperature cycle
        pressure: 1013.25 - Math.random() * 50,
        humidity: 50 + Math.random() * 40,
        windSpeed: 5 + Math.random() * 15,
        windDirection: Math.random() * 360,
        windU: 0, // Will be calculated
        windV: 0  // Will be calculated
      },
      altitude: 10,
      quality: 0.8 + Math.random() * 0.2
    });

    // Generate altitude data
    for (const altitude of forecastWindow.altitudeRequirements.intervals) {
      if (altitude > 10) { // Skip surface level
        altitudeData.push({
          timestamp,
          values: {
            temperature: 15 - (altitude / 1000) * 6.5, // Standard lapse rate
            pressure: 1013.25 * Math.pow(1 - 0.0065 * altitude / 288.15, 5.255),
            humidity: Math.max(0, 80 - (altitude / 1000) * 10),
            windSpeed: 5 + Math.random() * 20 + (altitude / 1000) * 2, // Wind increases with altitude
            windDirection: Math.random() * 360,
            windU: 0, // Will be calculated
            windV: 0  // Will be calculated
          },
          altitude,
          quality: Math.max(0.3, 0.9 - (altitude / 50000)) // Quality decreases with altitude
        });
      }
    }
  }

  // Calculate wind components
  for (const point of [...surfaceData, ...altitudeData]) {
    const dirRad = (point.values.windDirection * Math.PI) / 180;
    point.values.windU = -point.values.windSpeed * Math.sin(dirRad);
    point.values.windV = -point.values.windSpeed * Math.cos(dirRad);
  }

  return { surfaceData, altitudeData };
}

/**
 * Perform temporal interpolation for the flight trajectory
 */
async function performFlightTrajectoryInterpolation(
  request: WeatherSelectionRequest,
  forecastWindow: ForecastWindow,
  weatherData: { surfaceData: TemporalDataPoint[]; altitudeData: TemporalDataPoint[] },
  method: 'linear' | 'cubic' | 'spline'
): Promise<InterpolationResult[]> {
  // Generate flight trajectory timestamps
  const launchTime = new Date(request.launchTime);
  const flightDuration = forecastWindow.flightDuration.totalFlightTime;
  const trajectoryTimestamps: string[] = [];

  // Create timestamps every 10 minutes during flight
  for (let i = 0; i <= flightDuration; i += 10) {
    const time = new Date(launchTime.getTime() + i * 60 * 1000);
    trajectoryTimestamps.push(time.toISOString());
  }

  // Combine all weather data
  const allWeatherData = [...weatherData.surfaceData, ...weatherData.altitudeData];

  // Interpolate for each trajectory point
  const interpolationResults: InterpolationResult[] = [];
  
  for (const timestamp of trajectoryTimestamps) {
    // Calculate altitude for this timestamp (simple ascent model)
    const minutesFromLaunch = (new Date(timestamp).getTime() - launchTime.getTime()) / (1000 * 60);
    const ascentTime = forecastWindow.flightDuration.ascentTime;
    
    let altitude: number;
    if (minutesFromLaunch <= ascentTime) {
      // Ascent phase
      const ascentRatio = minutesFromLaunch / ascentTime;
      altitude = request.launchLocation.alt || 0 + 
                (request.balloonSpecs.burstAltitude - (request.launchLocation.alt || 0)) * ascentRatio;
    } else {
      // Descent phase
      const descentTime = flightDuration - ascentTime;
      const descentRatio = (minutesFromLaunch - ascentTime) / descentTime;
      altitude = request.balloonSpecs.burstAltitude - 
                (request.balloonSpecs.burstAltitude - (request.launchLocation.alt || 0)) * descentRatio;
    }

    // Interpolate weather data for this time and altitude
    const interpolationRequest: InterpolationRequest = {
      targetTime: timestamp,
      targetAltitude: altitude,
      dataPoints: allWeatherData,
      method,
      tolerance: {
        temporal: 180, // 3 hours
        spatial: 2000  // 2km
      }
    };

    const result = interpolateTemporalData(interpolationRequest);
    interpolationResults.push(result);
  }

  return interpolationResults;
}

/**
 * Assess overall data quality
 */
async function assessDataQuality(
  request: WeatherSelectionRequest,
  forecastWindow: ForecastWindow,
  model: ModelAvailability,
  interpolatedData: InterpolationResult[]
): Promise<WeatherQualityAssessment> {
  const qualityRequest: QualityRequest = {
    forecastTime: forecastWindow.start,
    targetTime: request.launchTime,
    location: request.launchLocation,
    altitudeRange: {
      min: forecastWindow.altitudeRequirements.min,
      max: forecastWindow.altitudeRequirements.max
    },
    modelUsed: model.model,
    ensembleData: {
      memberCount: 15, // Simulated ensemble size
      spread: 0.3      // Simulated ensemble spread
    },
    historicalAccuracy: {
      recent: 0.85,    // Simulated recent accuracy
      seasonal: 0.80   // Simulated seasonal accuracy
    }
  };

  return assessWeatherQuality(qualityRequest);
}

/**
 * Generate timeline information
 */
function generateTimeline(
  forecastWindow: ForecastWindow,
  model: ModelAvailability
): {
  dataFreshness: string;
  validityPeriod: string;
  nextUpdate: string;
} {
  const now = new Date();
  const forecastStart = new Date(forecastWindow.start);
  
  // Calculate data freshness
  const ageHours = (now.getTime() - forecastStart.getTime()) / (1000 * 60 * 60);
  let dataFreshness: string;
  if (ageHours < 1) {
    dataFreshness = 'Very fresh (< 1 hour old)';
  } else if (ageHours < 6) {
    dataFreshness = `Fresh (${Math.round(ageHours)} hours old)`;
  } else if (ageHours < 24) {
    dataFreshness = `Moderate (${Math.round(ageHours)} hours old)`;
  } else {
    dataFreshness = `Old (${Math.round(ageHours / 24)} days old)`;
  }

  // Calculate validity period
  const validityEnd = new Date(forecastStart.getTime() + model.maxForecastHours * 60 * 60 * 1000);
  const validityHours = Math.max(0, (validityEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
  const validityPeriod = `Valid for ${Math.round(validityHours)} more hours`;

  // Calculate next update
  const lastUpdate = new Date(Math.floor(now.getTime() / (model.updateCycle * 60 * 60 * 1000)) * model.updateCycle * 60 * 60 * 1000);
  const nextUpdate = new Date(lastUpdate.getTime() + model.updateCycle * 60 * 60 * 1000);
  const hoursToUpdate = (nextUpdate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const nextUpdateStr = `Next update in ${Math.round(hoursToUpdate)} hours`;

  return {
    dataFreshness,
    validityPeriod,
    nextUpdate: nextUpdateStr
  };
}

/**
 * Validate weather selection request
 */
function validateSelectionRequest(request: WeatherSelectionRequest): boolean {
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
 * Calculate weather window for external use
 * @param launchTime Launch time
 * @param flightDuration Flight duration in minutes
 * @returns Time range for weather data
 */
export function calculateWeatherWindow(launchTime: string, flightDuration: number): TimeRange {
  const launch = new Date(launchTime);
  const start = new Date(launch.getTime() - 2 * 60 * 60 * 1000); // 2 hours before
  const end = new Date(launch.getTime() + (flightDuration + 60) * 60 * 1000); // Flight + 1 hour after

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

/**
 * Optimize weather data selection for real-time use
 * @param request Weather selection request
 * @returns Optimized selection result
 */
export async function optimizeDataSelection(request: WeatherSelectionRequest): Promise<WeatherSelectionResult> {
  // For real-time optimization, we could:
  // 1. Use cached data when possible
  // 2. Parallelize API calls
  // 3. Use lower resolution for initial estimates
  // 4. Implement progressive enhancement
  
  // For now, delegate to main selection function
  return selectWeatherData(request);
} 