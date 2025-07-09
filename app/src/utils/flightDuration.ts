// Flight duration calculation utilities for balloon trajectory prediction
// Based on task-12d specifications

export interface FlightParameters {
  balloonVolume: number;          // m³
  payloadWeight: number;          // kg
  balloonWeight: number;          // kg
  launchAltitude: number;         // m
  burstAltitude: number;          // m
  ascentRate: number;             // m/s
  dragCoefficient: number;        // dimensionless
  atmosphericConditions?: {
    temperature: number;          // K
    pressure: number;            // Pa
    density: number;             // kg/m³
  };
}

export interface FlightDurationEstimate {
  ascentTime: number;             // minutes
  descentTime: number;            // minutes
  totalFlightTime: number;        // minutes
  uncertaintyMargin: number;      // minutes (±)
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Estimate flight duration based on balloon specifications
 * Uses physics-based models for ascent and descent phases
 * @param params Flight parameters
 * @returns Flight duration estimate with uncertainty
 */
export function estimateFlightDuration(params: FlightParameters): FlightDurationEstimate {
  try {
    // Validate input parameters
    if (!validateFlightParameters(params)) {
      throw new Error('Invalid flight parameters provided');
    }

    // Calculate ascent duration
    const ascentTime = calculateAscentDuration(params);
    
    // Calculate descent duration
    const descentTime = calculateDescentDuration(params);
    
    // Total flight time
    const totalFlightTime = ascentTime + descentTime;
    
    // Calculate uncertainty margin based on model confidence
    const uncertaintyMargin = calculateUncertaintyMargin(params, totalFlightTime);
    
    // Assess confidence level
    const confidence = assessConfidenceLevel(params, uncertaintyMargin);

    return {
      ascentTime,
      descentTime,
      totalFlightTime,
      uncertaintyMargin,
      confidence
    };
  } catch (error) {
    console.error('Flight duration estimation failed:', error);
    // Return conservative fallback estimate
    return {
      ascentTime: 120, // 2 hours
      descentTime: 60,  // 1 hour
      totalFlightTime: 180, // 3 hours
      uncertaintyMargin: 60, // ±1 hour
      confidence: 'low'
    };
  }
}

/**
 * Calculate ascent duration using balloon physics
 */
function calculateAscentDuration(params: FlightParameters): number {
  const { launchAltitude, burstAltitude, ascentRate } = params;
  
  // Basic calculation: time = distance / rate
  const altitudeDifference = burstAltitude - launchAltitude;
  
  // Account for decreasing atmospheric density with altitude
  // Ascent rate typically decreases as altitude increases
  const averageAscentRate = ascentRate * 0.85; // 15% reduction on average
  
  const ascentTimeSeconds = altitudeDifference / averageAscentRate;
  return Math.round(ascentTimeSeconds / 60); // Convert to minutes
}

/**
 * Calculate descent duration using parachute descent models
 */
function calculateDescentDuration(params: FlightParameters): number {
  const { burstAltitude, launchAltitude, payloadWeight, dragCoefficient } = params;
  
  // Estimate terminal velocity based on payload weight and drag
  const terminalVelocity = calculateTerminalVelocity(payloadWeight, dragCoefficient);
  
  // Calculate descent distance
  const descentDistance = burstAltitude - launchAltitude;
  
  // Account for parachute deployment and variable descent rates
  const averageDescentRate = terminalVelocity * 0.7; // Accounting for parachute deployment
  
  const descentTimeSeconds = descentDistance / averageDescentRate;
  return Math.round(descentTimeSeconds / 60); // Convert to minutes
}

/**
 * Calculate terminal velocity for descent phase
 */
function calculateTerminalVelocity(payloadWeight: number, dragCoefficient: number): number {
  // Terminal velocity = sqrt((2 * weight * g) / (density * drag_coefficient * area))
  // Simplified model using typical parachute characteristics
  const gravity = 9.81; // m/s²
  const airDensity = 1.225; // kg/m³ at sea level
  const parachuteArea = 10; // m² (typical small parachute)
  
  const terminalVelocity = Math.sqrt(
    (2 * payloadWeight * gravity) / 
    (airDensity * dragCoefficient * parachuteArea)
  );
  
  // Clamp to reasonable bounds (2-15 m/s)
  return Math.max(2, Math.min(15, terminalVelocity));
}

/**
 * Calculate uncertainty margin based on model limitations
 */
function calculateUncertaintyMargin(params: FlightParameters, totalFlightTime: number): number {
  let uncertaintyFactor = 0.1; // Base 10% uncertainty
  
  // Increase uncertainty for extreme conditions
  if (params.burstAltitude > 30000) {
    uncertaintyFactor += 0.05; // High altitude increases uncertainty
  }
  
  if (params.payloadWeight > 2000) {
    uncertaintyFactor += 0.05; // Heavy payloads increase uncertainty
  }
  
  if (!params.atmosphericConditions) {
    uncertaintyFactor += 0.1; // No atmospheric data increases uncertainty
  }
  
  // Cap uncertainty at 50%
  uncertaintyFactor = Math.min(0.5, uncertaintyFactor);
  
  return Math.round(totalFlightTime * uncertaintyFactor);
}

/**
 * Assess confidence level based on parameter quality
 */
function assessConfidenceLevel(
  params: FlightParameters, 
  uncertaintyMargin: number
): 'high' | 'medium' | 'low' {
  const uncertaintyRatio = uncertaintyMargin / (params.burstAltitude - params.launchAltitude) * 60;
  
  if (uncertaintyRatio < 0.1 && params.atmosphericConditions) {
    return 'high';
  } else if (uncertaintyRatio < 0.3) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Validate flight parameters
 */
function validateFlightParameters(params: FlightParameters): boolean {
  return (
    params.balloonVolume > 0 &&
    params.payloadWeight > 0 &&
    params.balloonWeight > 0 &&
    params.launchAltitude >= 0 &&
    params.burstAltitude > params.launchAltitude &&
    params.ascentRate > 0 &&
    params.dragCoefficient > 0
  );
}

/**
 * Calculate flight duration with weather impact
 * Accounts for wind effects on trajectory and timing
 */
export function estimateWeatherAdjustedDuration(
  params: FlightParameters,
  averageWindSpeed: number
): FlightDurationEstimate {
  const baseDuration = estimateFlightDuration(params);
  
  // Wind affects primarily the descent phase
  const windImpactFactor = Math.min(1.5, 1 + (averageWindSpeed * 0.01));
  
  const adjustedDescentTime = Math.round(baseDuration.descentTime * windImpactFactor);
  const adjustedTotalTime = baseDuration.ascentTime + adjustedDescentTime;
  
  // Increase uncertainty margin for windy conditions
  const windUncertainty = Math.round(averageWindSpeed * 2); // 2 minutes per m/s of wind
  const adjustedUncertainty = baseDuration.uncertaintyMargin + windUncertainty;
  
  return {
    ascentTime: baseDuration.ascentTime,
    descentTime: adjustedDescentTime,
    totalFlightTime: adjustedTotalTime,
    uncertaintyMargin: adjustedUncertainty,
    confidence: averageWindSpeed > 10 ? 'low' : baseDuration.confidence
  };
}

/**
 * Get recommended forecast window based on flight duration
 * Includes safety margins for weather prediction accuracy
 */
export function getRecommendedForecastWindow(
  flightDuration: FlightDurationEstimate,
  launchTime: string
): {
  start: string;
  end: string;
  totalHours: number;
  safetyMargin: number;
} {
  const launchDate = new Date(launchTime);
  
  // Safety margin: 2 hours before + uncertainty margin + 1 hour after
  const safetyMarginMinutes = 120 + flightDuration.uncertaintyMargin + 60;
  
  const startTime = new Date(launchDate.getTime() - 120 * 60 * 1000); // 2 hours before
  const endTime = new Date(
    launchDate.getTime() + 
    (flightDuration.totalFlightTime + flightDuration.uncertaintyMargin + 60) * 60 * 1000
  );
  
  const totalHours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
  
  return {
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    totalHours,
    safetyMargin: safetyMarginMinutes
  };
} 