// Orchestration Types for Unified Prediction Engine
// Based on task-11g specifications

import { LaunchLocation, BalloonSpecifications, EnvironmentalParameters } from './UserInputs';
import { TrajectoryPoint, Coordinates } from './SystemOutputs';

export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface LaunchSchedule {
  launchTime: string;  // ISO 8601 format
  timeZone: string;
  delayTolerance?: number;  // minutes
}

export interface BalloonConfiguration {
  balloonType: string;
  initialVolume: number;
  burstAltitude: number;
  ascentRate: number;
  payloadWeight: number;
  dragCoefficient: number;
}

export interface PredictionRequest {
  launchLocation: Location;
  launchTime: LaunchSchedule;
  balloonSpecs: BalloonConfiguration;
  environmentalParams?: EnvironmentalParameters;
  options: {
    includeUncertainty: boolean;
    weatherResolution: 'high' | 'medium' | 'low';
    calculationPrecision: 'fast' | 'standard' | 'precise';
  };
}

export interface BurstSite {
  location: Location;
  altitude: number;
  uncertainty: number;    // km radius
  confidence: number;     // 0-1 scale
}

export interface LandingSite {
  location: Location;
  uncertainty: number;    // km radius
  confidence: number;     // 0-1 scale
}

export interface FlightMetrics {
  duration: number;       // minutes
  maxAltitude: number;    // meters
  totalDistance: number;  // km
  averageWindSpeed: number; // m/s
}

export interface WeatherImpact {
  windDrift: number;      // km
  temperatureEffect: number; // altitude variance
  pressureEffect: number;    // burst altitude variance
}

export interface QualityAssessment {
  weatherDataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  predictionConfidence: number; // 0-1 scale
  warnings: string[];
  recommendations: string[];
}

export interface PredictionResult {
  trajectory: TrajectoryPoint[];
  burstSite: BurstSite;
  landingSite: LandingSite;
  flightMetrics: FlightMetrics;
  weatherImpact: WeatherImpact;
  qualityAssessment: QualityAssessment;
}

// Validation interfaces
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// Processing interfaces
export interface ProcessingStatus {
  phase: 'validation' | 'weather' | 'calculation' | 'processing' | 'complete';
  progress: number;  // 0-1 scale
  message: string;
}

export interface OrchestrationError extends Error {
  code: string;
  phase: string;
  recoverable: boolean;
  details?: any;
}

// Weather integration interfaces
export interface WeatherWindow {
  startTime: string;
  endTime: string;
  resolution: 'high' | 'medium' | 'low';
  altitudeLevels: number[];
}

export interface WeatherData {
  timestamp: string;
  altitude: number;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  pressure: number;
  humidity: number;
  uncertainty: number;
}

// Algorithm coordination interfaces
export interface AlgorithmInput {
  launchLocation: Location;
  balloonSpecs: BalloonConfiguration;
  weatherData: WeatherData[];
  precision: 'fast' | 'standard' | 'precise';
}

export interface AlgorithmResult {
  trajectory: TrajectoryPoint[];
  burstPoint: Location;
  landingPoint: Location;
  confidence: number;
  processingTime: number;
}

// Cache interfaces
export interface CacheKey {
  launchLocation: string;
  launchTime: string;
  balloonSpecs: string;
  weatherHash: string;
  precision: string;
}

export interface CachedResult {
  result: PredictionResult;
  timestamp: number;
  expiresAt: number;
}

// Performance monitoring
export interface PerformanceMetrics {
  totalTime: number;
  validationTime: number;
  weatherTime: number;
  calculationTime: number;
  processingTime: number;
  cacheHit: boolean;
  memoryUsage: number;
}

// Error recovery interfaces
export interface RecoveryStrategy {
  canRecover: boolean;
  fallbackMethod: 'simple' | 'cached' | 'degraded';
  confidenceReduction: number;
}

export interface FallbackOptions {
  useSimpleModel: boolean;
  useCachedWeather: boolean;
  reduceResolution: boolean;
  skipUncertainty: boolean;
} 