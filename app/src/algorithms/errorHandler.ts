// Error Handling for Unified Prediction Engine
// Based on task-11g specifications

import { 
  OrchestrationError, 
  RecoveryStrategy, 
  FallbackOptions, 
  PredictionResult, 
  ValidationError 
} from '../types/orchestrationTypes';
import { TrajectoryPoint } from '../types/SystemOutputs';

/**
 * Creates a standardized orchestration error
 */
export function createOrchestrationError(
  message: string,
  code: string,
  phase: string,
  recoverable: boolean = false,
  details?: any
): OrchestrationError {
  const error = new Error(message) as OrchestrationError;
  error.code = code;
  error.phase = phase;
  error.recoverable = recoverable;
  error.details = details;
  return error;
}

/**
 * Handles errors during prediction orchestration
 */
export function handlePredictionError(
  error: Error,
  phase: string,
  context: any = {}
): { error: OrchestrationError; recovery: RecoveryStrategy | null } {
  let orchestrationError: OrchestrationError;
  let recoveryStrategy: RecoveryStrategy | null = null;

  // Convert to orchestration error if needed
  if (error && typeof error === 'object' && 'code' in error && 'phase' in error && 'recoverable' in error) {
    orchestrationError = error as OrchestrationError;
  } else {
    orchestrationError = createOrchestrationError(
      error.message,
      'UNKNOWN_ERROR',
      phase,
      false,
      { originalError: error.name, context }
    );
  }

  // Determine recovery strategy based on error type and phase
  recoveryStrategy = determineRecoveryStrategy(orchestrationError, context);

  // Log error for monitoring
  logError(orchestrationError, context);

  return { error: orchestrationError, recovery: recoveryStrategy };
}

/**
 * Determines recovery strategy for different error types
 */
export function determineRecoveryStrategy(
  error: OrchestrationError,
  context: any
): RecoveryStrategy | null {
  switch (error.phase) {
    case 'validation':
      return handleValidationError(error, context);
    case 'weather':
      return handleWeatherError(error, context);
    case 'calculation':
      return handleCalculationError(error, context);
    case 'processing':
      return handleProcessingError(error, context);
    default:
      return null;
  }
}

/**
 * Handles validation phase errors
 */
export function handleValidationError(
  error: OrchestrationError,
  context: any
): RecoveryStrategy | null {
  switch (error.code) {
    case 'INVALID_COORDINATES':
    case 'INVALID_BALLOON_SPECS':
    case 'INVALID_LAUNCH_TIME':
      // Validation errors are not recoverable
      return {
        canRecover: false,
        fallbackMethod: 'simple',
        confidenceReduction: 1.0 // Complete failure
      };
    
    case 'LAUNCH_TIME_TOO_FAR':
    case 'HRRR_OUTSIDE_CONUS':
      // These can be recovered with different parameters
      return {
        canRecover: true,
        fallbackMethod: 'degraded',
        confidenceReduction: 0.2
      };
    
    default:
      return null;
  }
}

/**
 * Handles weather data errors
 */
export function handleWeatherError(
  error: OrchestrationError,
  context: any
): RecoveryStrategy | null {
  switch (error.code) {
    case 'WEATHER_SERVICE_UNAVAILABLE':
    case 'WEATHER_API_ERROR':
      // Can fallback to cached weather data
      return {
        canRecover: true,
        fallbackMethod: 'cached',
        confidenceReduction: 0.3
      };
    
    case 'WEATHER_DATA_POOR_QUALITY':
      // Can reduce resolution and continue
      return {
        canRecover: true,
        fallbackMethod: 'degraded',
        confidenceReduction: 0.4
      };
    
    case 'WEATHER_TIMEOUT':
      // Can retry with simpler model
      return {
        canRecover: true,
        fallbackMethod: 'simple',
        confidenceReduction: 0.5
      };
    
    default:
      return {
        canRecover: true,
        fallbackMethod: 'simple',
        confidenceReduction: 0.6
      };
  }
}

/**
 * Handles calculation phase errors
 */
export function handleCalculationError(
  error: OrchestrationError,
  context: any
): RecoveryStrategy | null {
  switch (error.code) {
    case 'ALGORITHM_CONVERGENCE_FAILED':
      // Can retry with different parameters
      return {
        canRecover: true,
        fallbackMethod: 'degraded',
        confidenceReduction: 0.3
      };
    
    case 'PHYSICS_VALIDATION_FAILED':
      // Can fallback to simpler model
      return {
        canRecover: true,
        fallbackMethod: 'simple',
        confidenceReduction: 0.4
      };
    
    case 'MEMORY_EXHAUSTED':
      // Can reduce resolution and retry
      return {
        canRecover: true,
        fallbackMethod: 'degraded',
        confidenceReduction: 0.2
      };
    
    default:
      return {
        canRecover: true,
        fallbackMethod: 'simple',
        confidenceReduction: 0.5
      };
  }
}

/**
 * Handles processing phase errors
 */
export function handleProcessingError(
  error: OrchestrationError,
  context: any
): RecoveryStrategy | null {
  switch (error.code) {
    case 'RESULTS_PROCESSING_FAILED':
      // Can provide simplified results
      return {
        canRecover: true,
        fallbackMethod: 'simple',
        confidenceReduction: 0.3
      };
    
    case 'UNCERTAINTY_CALCULATION_FAILED':
      // Can skip uncertainty calculations
      return {
        canRecover: true,
        fallbackMethod: 'degraded',
        confidenceReduction: 0.2
      };
    
    default:
      return {
        canRecover: true,
        fallbackMethod: 'simple',
        confidenceReduction: 0.4
      };
  }
}

/**
 * Executes fallback prediction with reduced capabilities
 */
export async function executeFallbackPrediction(
  originalRequest: any,
  recoveryStrategy: RecoveryStrategy,
  error: OrchestrationError
): Promise<PredictionResult> {
  const fallbackOptions = createFallbackOptions(recoveryStrategy);
  
  try {
    // Create simplified prediction result
    const fallbackResult = await createFallbackResult(
      originalRequest,
      fallbackOptions,
      recoveryStrategy.confidenceReduction
    );
    
    // Add warnings about fallback
    fallbackResult.qualityAssessment.warnings.push(
      `Fallback prediction used due to error: ${error.message}`
    );
    
    fallbackResult.qualityAssessment.predictionConfidence *= 
      (1 - recoveryStrategy.confidenceReduction);
    
    return fallbackResult;
  } catch (fallbackError) {
    // If fallback also fails, create minimal result
    return createMinimalResult(originalRequest, error);
  }
}

/**
 * Creates fallback options based on recovery strategy
 */
export function createFallbackOptions(strategy: RecoveryStrategy): FallbackOptions {
  return {
    useSimpleModel: strategy.fallbackMethod === 'simple',
    useCachedWeather: strategy.fallbackMethod === 'cached',
    reduceResolution: strategy.fallbackMethod === 'degraded',
    skipUncertainty: strategy.confidenceReduction > 0.5
  };
}

/**
 * Creates a fallback prediction result
 */
export async function createFallbackResult(
  request: any,
  options: FallbackOptions,
  confidenceReduction: number
): Promise<PredictionResult> {
  // Create simplified trajectory
  const trajectory = createSimplifiedTrajectory(request, options);
  
  // Create basic burst and landing sites
  const burstSite = createBasicBurstSite(trajectory, confidenceReduction);
  const landingSite = createBasicLandingSite(trajectory, confidenceReduction);
  
  // Calculate basic metrics
  const flightMetrics = calculateBasicMetrics(trajectory);
  
  // Create minimal weather impact
  const weatherImpact = {
    windDrift: 0,
    temperatureEffect: 0,
    pressureEffect: 0
  };
  
  // Create quality assessment
  const qualityAssessment = {
    weatherDataQuality: 'poor' as const,
    predictionConfidence: Math.max(0.1, 0.8 * (1 - confidenceReduction)),
    warnings: [
      'Fallback prediction used due to system limitations',
      'Reduced accuracy expected'
    ],
    recommendations: [
      'Consider retrying with different parameters',
      'Monitor conditions closely'
    ]
  };
  
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
 * Creates minimal result when all else fails
 */
export function createMinimalResult(
  request: any,
  error: OrchestrationError
): PredictionResult {
  const now = new Date().toISOString();
  const launch = request.launchLocation || { latitude: 0, longitude: 0 };
  
  // Create minimal trajectory with just launch point
  const trajectory: TrajectoryPoint[] = [{
    timestamp: now,
    latitude: launch.latitude,
    longitude: launch.longitude,
    altitude: launch.altitude || 0
  }];
  
  return {
    trajectory,
    burstSite: {
      location: launch,
      altitude: 0,
      uncertainty: 999,
      confidence: 0.1
    },
    landingSite: {
      location: launch,
      uncertainty: 999,
      confidence: 0.1
    },
    flightMetrics: {
      duration: 0,
      maxAltitude: 0,
      totalDistance: 0,
      averageWindSpeed: 0
    },
    weatherImpact: {
      windDrift: 0,
      temperatureEffect: 0,
      pressureEffect: 0
    },
    qualityAssessment: {
      weatherDataQuality: 'poor',
      predictionConfidence: 0.1,
      warnings: [
        'Prediction failed - minimal result returned',
        `Error: ${error.message}`
      ],
      recommendations: [
        'Check input parameters and try again',
        'Contact support if problem persists'
      ]
    }
  };
}

/**
 * Creates simplified trajectory for fallback
 */
export function createSimplifiedTrajectory(
  request: any,
  options: FallbackOptions
): TrajectoryPoint[] {
  const launch = request.launchLocation || { latitude: 0, longitude: 0 };
  const balloonSpecs = request.balloonSpecs || {};
  
  // Create basic ascent trajectory
  const ascentRate = balloonSpecs.ascentRate || 5; // m/s
  const burstAltitude = balloonSpecs.burstAltitude || 30000; // m
  const ascentTime = burstAltitude / ascentRate; // seconds
  
  const trajectory: TrajectoryPoint[] = [];
  const startTime = new Date(request.launchTime?.launchTime || Date.now());
  
  // Add points every 5 minutes during ascent
  for (let t = 0; t <= ascentTime; t += 300) {
    const altitude = Math.min(t * ascentRate, burstAltitude);
    const timestamp = new Date(startTime.getTime() + t * 1000);
    
    trajectory.push({
      timestamp: timestamp.toISOString(),
      latitude: launch.latitude,
      longitude: launch.longitude,
      altitude
    });
  }
  
  return trajectory;
}

/**
 * Creates basic burst site for fallback
 */
export function createBasicBurstSite(
  trajectory: TrajectoryPoint[],
  confidenceReduction: number
): any {
  const burstPoint = trajectory[trajectory.length - 1] || trajectory[0];
  
  return {
    location: {
      latitude: burstPoint.latitude,
      longitude: burstPoint.longitude,
      altitude: burstPoint.altitude
    },
    altitude: burstPoint.altitude,
    uncertainty: 5 + confidenceReduction * 10,
    confidence: Math.max(0.1, 0.7 * (1 - confidenceReduction))
  };
}

/**
 * Creates basic landing site for fallback
 */
export function createBasicLandingSite(
  trajectory: TrajectoryPoint[],
  confidenceReduction: number
): any {
  const landingPoint = trajectory[trajectory.length - 1] || trajectory[0];
  
  return {
    location: {
      latitude: landingPoint.latitude,
      longitude: landingPoint.longitude,
      altitude: 0
    },
    uncertainty: 10 + confidenceReduction * 20,
    confidence: Math.max(0.1, 0.6 * (1 - confidenceReduction))
  };
}

/**
 * Calculates basic metrics for fallback
 */
export function calculateBasicMetrics(trajectory: TrajectoryPoint[]): any {
  if (trajectory.length === 0) {
    return {
      duration: 0,
      maxAltitude: 0,
      totalDistance: 0,
      averageWindSpeed: 0
    };
  }
  
  const startTime = new Date(trajectory[0].timestamp);
  const endTime = new Date(trajectory[trajectory.length - 1].timestamp);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  return {
    duration,
    maxAltitude: Math.max(...trajectory.map(p => p.altitude)),
    totalDistance: 0,
    averageWindSpeed: 0
  };
}

/**
 * Logs errors for monitoring and debugging
 */
export function logError(error: OrchestrationError, context: any): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      code: error.code,
      phase: error.phase,
      recoverable: error.recoverable,
      stack: error.stack
    },
    context,
    details: error.details
  };
  
  // In production, this would send to monitoring service
  console.error('Orchestration Error:', logEntry);
}

/**
 * Validates error recovery is possible
 */
export function canRecover(error: OrchestrationError): boolean {
  return error.recoverable && error.phase !== 'validation';
}

/**
 * Gets user-friendly error message
 */
export function getUserFriendlyMessage(error: OrchestrationError): string {
  switch (error.code) {
    case 'INVALID_COORDINATES':
      return 'Please check your launch location coordinates';
    case 'INVALID_LAUNCH_TIME':
      return 'Please select a valid launch time';
    case 'WEATHER_SERVICE_UNAVAILABLE':
      return 'Weather service is temporarily unavailable';
    case 'ALGORITHM_CONVERGENCE_FAILED':
      return 'Unable to calculate trajectory - please try different parameters';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
} 