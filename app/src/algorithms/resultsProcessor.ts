// Results Processing for Unified Prediction Engine
// Based on task-11g specifications

import { 
  PredictionResult, 
  BurstSite, 
  LandingSite, 
  FlightMetrics, 
  WeatherImpact, 
  QualityAssessment, 
  Location, 
  AlgorithmResult, 
  WeatherData 
} from '../types/orchestrationTypes';
import { TrajectoryPoint } from '../types/SystemOutputs';

/**
 * Processes algorithm results into comprehensive prediction output
 */
export function processResults(
  algorithmResult: AlgorithmResult,
  weatherData: WeatherData[],
  includeUncertainty: boolean,
  processingStartTime: number
): PredictionResult {
  const trajectory = enhanceTrajectory(algorithmResult.trajectory, weatherData);
  const burstSite = calculateBurstSite(algorithmResult, includeUncertainty);
  const landingSite = calculateLandingSite(algorithmResult, includeUncertainty);
  const flightMetrics = calculateFlightMetrics(trajectory, algorithmResult);
  const weatherImpact = calculateWeatherImpact(trajectory, weatherData);
  const qualityAssessment = assessPredictionQuality(
    algorithmResult,
    weatherData,
    processingStartTime
  );

  return {
    trajectory,
    burstSite,
    landingSite,
    flightMetrics,
    weatherImpact,
    qualityAssessment
  };
}

/**
 * Enhances trajectory with weather information
 */
export function enhanceTrajectory(
  trajectory: TrajectoryPoint[],
  weatherData: WeatherData[]
): TrajectoryPoint[] {
  return trajectory.map(point => {
    // Find closest weather data point
    const closestWeather = findClosestWeatherData(point, weatherData);
    
    return {
      ...point,
      wind_speed: closestWeather?.windSpeed,
      wind_direction: closestWeather?.windDirection,
      temperature: closestWeather?.temperature,
      pressure: closestWeather?.pressure
    };
  });
}

/**
 * Calculates burst site with uncertainty
 */
export function calculateBurstSite(
  algorithmResult: AlgorithmResult,
  includeUncertainty: boolean
): BurstSite {
  const burstPoint = algorithmResult.burstPoint;
  
  // Handle case where burstPoint might be undefined
  if (!burstPoint) {
    return {
      location: { latitude: 0, longitude: 0, altitude: 0 },
      altitude: 0,
      uncertainty: 0,
      confidence: 0
    };
  }
  
  let uncertainty = 0;
  let confidence = algorithmResult.confidence;
  
  if (includeUncertainty) {
    // Calculate uncertainty based on altitude and weather conditions
    const altitude = burstPoint.altitude || 0;
    const altitudeUncertainty = Math.max(0.1, altitude * 0.00005); // 0.005% of altitude
    const weatherUncertainty = (1 - confidence) * 2; // Scale with confidence
    uncertainty = Math.sqrt(altitudeUncertainty * altitudeUncertainty + weatherUncertainty * weatherUncertainty);
    
    // Clamp uncertainty to reasonable bounds
    uncertainty = Math.max(0.1, Math.min(10, uncertainty));
  }
  
  return {
    location: burstPoint,
    altitude: burstPoint.altitude || 0,
    uncertainty,
    confidence
  };
}

/**
 * Calculates landing site with uncertainty
 */
export function calculateLandingSite(
  algorithmResult: AlgorithmResult,
  includeUncertainty: boolean
): LandingSite {
  const landingPoint = algorithmResult.landingPoint;
  
  // Handle case where landingPoint might be undefined
  if (!landingPoint) {
    return {
      location: { latitude: 0, longitude: 0, altitude: 0 },
      uncertainty: 0,
      confidence: 0
    };
  }
  
  let uncertainty = 0;
  let confidence = algorithmResult.confidence;
  
  if (includeUncertainty) {
    // Landing uncertainty is typically higher than burst uncertainty
    const baseUncertainty = 0.5; // 500m base uncertainty
    const weatherUncertainty = (1 - confidence) * 5; // Scale with confidence
    uncertainty = Math.sqrt(baseUncertainty * baseUncertainty + weatherUncertainty * weatherUncertainty);
    
    // Clamp uncertainty to reasonable bounds
    uncertainty = Math.max(0.1, Math.min(20, uncertainty));
  }
  
  return {
    location: landingPoint,
    uncertainty,
    confidence
  };
}

/**
 * Calculates comprehensive flight metrics
 */
export function calculateFlightMetrics(
  trajectory: TrajectoryPoint[],
  algorithmResult: AlgorithmResult
): FlightMetrics {
  if (trajectory.length === 0) {
    return {
      duration: 0,
      maxAltitude: 0,
      totalDistance: 0,
      averageWindSpeed: 0
    };
  }
  
  // Calculate duration
  const startTime = new Date(trajectory[0].timestamp);
  const endTime = new Date(trajectory[trajectory.length - 1].timestamp);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
  
  // Calculate max altitude
  const maxAltitude = Math.max(...trajectory.map(p => p.altitude));
  
  // Calculate total distance
  const totalDistance = calculateTotalDistance(trajectory);
  
  // Calculate average wind speed
  const windSpeeds = trajectory
    .filter(p => p.wind_speed !== undefined)
    .map(p => p.wind_speed!);
  const averageWindSpeed = windSpeeds.length > 0 
    ? windSpeeds.reduce((sum, speed) => sum + speed, 0) / windSpeeds.length
    : 0;
  
  return {
    duration,
    maxAltitude,
    totalDistance,
    averageWindSpeed
  };
}

/**
 * Calculates weather impact on trajectory
 */
export function calculateWeatherImpact(
  trajectory: TrajectoryPoint[],
  weatherData: WeatherData[]
): WeatherImpact {
  if (trajectory.length === 0 || weatherData.length === 0) {
    return {
      windDrift: 0,
      temperatureEffect: 0,
      pressureEffect: 0
    };
  }
  
  // Calculate wind drift
  const windDrift = calculateWindDrift(trajectory);
  
  // Calculate temperature effect on altitude
  const temperatureEffect = calculateTemperatureEffect(trajectory, weatherData);
  
  // Calculate pressure effect on burst altitude
  const pressureEffect = calculatePressureEffect(trajectory, weatherData);
  
  return {
    windDrift,
    temperatureEffect,
    pressureEffect
  };
}

/**
 * Assesses overall prediction quality
 */
export function assessPredictionQuality(
  algorithmResult: AlgorithmResult,
  weatherData: WeatherData[],
  processingStartTime: number
): QualityAssessment {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Assess weather data quality
  const weatherQuality = assessWeatherDataQuality(weatherData);
  
  // Assess prediction confidence
  const predictionConfidence = algorithmResult.confidence;
  
  // Generate warnings based on quality metrics
  if (weatherQuality === 'poor') {
    warnings.push('Weather data quality is poor - predictions may be less accurate');
    recommendations.push('Consider delaying launch until better weather data is available');
  } else if (weatherQuality === 'fair') {
    warnings.push('Weather data quality is fair - increased uncertainty expected');
  }
  
  if (predictionConfidence < 0.7) {
    warnings.push('Low prediction confidence due to challenging weather conditions');
    recommendations.push('Consider using higher resolution weather data or multiple predictions');
  }
  
  // Check processing time
  const processingTime = algorithmResult.processingTime;
  if (processingTime > 1000) { // 1 second
    warnings.push('Prediction processing took longer than expected');
  }
  
  // Check weather data coverage
  const weatherCoverage = assessWeatherCoverage(weatherData);
  if (weatherCoverage < 0.8) {
    warnings.push('Limited weather data coverage for prediction window');
    recommendations.push('Consider using multiple weather sources or extending prediction window');
  }
  
  // General recommendations
  if (predictionConfidence > 0.9 && weatherQuality === 'excellent') {
    recommendations.push('Excellent prediction conditions - high confidence in results');
  } else if (predictionConfidence > 0.8 && weatherQuality === 'good') {
    recommendations.push('Good prediction conditions - results should be reliable');
  } else {
    recommendations.push('Monitor weather conditions closely and consider real-time updates');
  }
  
  return {
    weatherDataQuality: weatherQuality,
    predictionConfidence,
    warnings,
    recommendations
  };
}

/**
 * Calculates total distance traveled
 */
export function calculateTotalDistance(trajectory: TrajectoryPoint[]): number {
  if (trajectory.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < trajectory.length; i++) {
    const prev = trajectory[i - 1];
    const curr = trajectory[i];
    totalDistance += calculateHaversineDistance(prev, curr);
  }
  
  return totalDistance;
}

/**
 * Calculates wind drift from trajectory
 */
export function calculateWindDrift(trajectory: TrajectoryPoint[]): number {
  if (trajectory.length < 2) return 0;
  
  const start = trajectory[0];
  const end = trajectory[trajectory.length - 1];
  
  return calculateHaversineDistance(start, end);
}

/**
 * Calculates temperature effect on trajectory
 */
export function calculateTemperatureEffect(
  trajectory: TrajectoryPoint[],
  weatherData: WeatherData[]
): number {
  if (trajectory.length === 0 || weatherData.length === 0) return 0;
  
  // Calculate average temperature deviation from standard atmosphere
  const standardTemperature = 15; // °C at sea level
  const temperatureDeviations = weatherData.map(data => {
    const expectedTemp = standardTemperature - (data.altitude * 0.0065); // Standard lapse rate
    return Math.abs(data.temperature - expectedTemp);
  });
  
  return temperatureDeviations.reduce((sum, dev) => sum + dev, 0) / temperatureDeviations.length;
}

/**
 * Calculates pressure effect on burst altitude
 */
export function calculatePressureEffect(
  trajectory: TrajectoryPoint[],
  weatherData: WeatherData[]
): number {
  if (trajectory.length === 0 || weatherData.length === 0) return 0;
  
  // Find pressure at burst altitude
  const maxAltitude = Math.max(...trajectory.map(p => p.altitude));
  const burstWeather = weatherData.find(data => Math.abs(data.altitude - maxAltitude) < 1000);
  
  if (!burstWeather) return 0;
  
  // Calculate pressure deviation from standard atmosphere
  const standardPressure = 1013.25 * Math.pow(1 - 0.0065 * maxAltitude / 288.15, 5.255);
  const pressureDeviation = Math.abs(burstWeather.pressure - standardPressure);
  
  // Convert pressure deviation to altitude effect (rough approximation)
  return pressureDeviation * 8.5; // 8.5 meters per hPa
}

/**
 * Assesses weather data quality
 */
export function assessWeatherDataQuality(weatherData: WeatherData[]): 'excellent' | 'good' | 'fair' | 'poor' {
  if (weatherData.length === 0) return 'poor';
  
  const avgUncertainty = weatherData.reduce((sum, data) => sum + data.uncertainty, 0) / weatherData.length;
  const dataCompleteness = weatherData.length / 24; // Assuming 24 hours of data expected
  
  if (avgUncertainty < 0.1 && dataCompleteness > 0.9) return 'excellent';
  if (avgUncertainty < 0.2 && dataCompleteness > 0.8) return 'good';
  if (avgUncertainty < 0.3 && dataCompleteness > 0.6) return 'fair';
  return 'poor';
}

/**
 * Assesses weather data coverage
 */
export function assessWeatherCoverage(weatherData: WeatherData[]): number {
  if (weatherData.length === 0) return 0;
  
  // Calculate temporal coverage
  const timestamps = weatherData.map(data => new Date(data.timestamp).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeSpan = maxTime - minTime;
  const expectedTimeSpan = 24 * 60 * 60 * 1000; // 24 hours
  
  const temporalCoverage = Math.min(1, timeSpan / expectedTimeSpan);
  
  // Calculate altitude coverage
  const altitudes = weatherData.map(data => data.altitude);
  const minAltitude = Math.min(...altitudes);
  const maxAltitude = Math.max(...altitudes);
  const altitudeSpan = maxAltitude - minAltitude;
  const expectedAltitudeSpan = 35000; // 35km
  
  const altitudeCoverage = Math.min(1, altitudeSpan / expectedAltitudeSpan);
  
  return (temporalCoverage + altitudeCoverage) / 2;
}

/**
 * Finds closest weather data point to trajectory point
 */
export function findClosestWeatherData(
  trajectoryPoint: TrajectoryPoint,
  weatherData: WeatherData[]
): WeatherData | null {
  if (weatherData.length === 0) return null;
  
  let closest = weatherData[0];
  let minDistance = calculateWeatherDistance(trajectoryPoint, closest);
  
  for (const weather of weatherData) {
    const distance = calculateWeatherDistance(trajectoryPoint, weather);
    if (distance < minDistance) {
      minDistance = distance;
      closest = weather;
    }
  }
  
  return closest;
}

/**
 * Calculates distance between trajectory point and weather data
 */
export function calculateWeatherDistance(
  trajectoryPoint: TrajectoryPoint,
  weatherData: WeatherData
): number {
  const altitudeDiff = Math.abs(trajectoryPoint.altitude - weatherData.altitude);
  const timeDiff = Math.abs(
    new Date(trajectoryPoint.timestamp).getTime() - new Date(weatherData.timestamp).getTime()
  );
  
  // Normalize and combine differences
  const normalizedAltitude = altitudeDiff / 1000; // per km
  const normalizedTime = timeDiff / (1000 * 60 * 60); // per hour
  
  return Math.sqrt(normalizedAltitude * normalizedAltitude + normalizedTime * normalizedTime);
}

/**
 * Calculates Haversine distance between two points
 */
export function calculateHaversineDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
} 