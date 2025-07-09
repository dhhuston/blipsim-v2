// Descent phase calculation algorithm for balloon trajectory prediction
// Based on task-11b specifications
// Enhanced with landing site prediction for task-11e

import { calculateAtmosphericDensity } from './atmospheric';
import { calculateNewPosition } from './windDrift';

export interface DescentInput {
  burstLatitude: number;      // degrees
  burstLongitude: number;     // degrees
  burstAltitude: number;      // m
  payloadWeight: number;      // kg
  parachuteArea: number;      // m²
  dragCoefficient: number;    // dimensionless
  windSpeed: number;          // m/s
  windDirection: number;      // degrees
  landingAltitude: number;    // m (ground level)
  maxFlightTime?: number;     // seconds (optional, defaults to 24 hours)
}

export interface DescentTrajectoryPoint {
  lat: number;
  lng: number;
  alt: number;
  timestamp: string;
  velocity: number;           // m/s
  windSpeed: number;          // m/s
  windDirection: number;      // degrees
  phase: 'descent' | 'landing';
}

export interface DescentResult {
  trajectory: DescentTrajectoryPoint[];
  landingPoint: DescentTrajectoryPoint;
  landingLatitude: number;    // degrees
  landingLongitude: number;   // degrees
  landingTime: number;        // seconds from burst
  descentDuration: number;    // seconds
  terminalVelocity: number;   // m/s
  windDrift: number;         // km
  maxVelocity: number;       // m/s
  totalFlightDistance: number; // km
  confidence: number;         // 0-1 confidence level
}

// Terminal velocity calculation
export function calculateTerminalVelocity(
  payloadWeight: number,
  atmosphericDensity: number,
  parachuteArea: number,
  dragCoefficient: number
): number {
  const g = 9.81; // m/s²
  
  // Terminal velocity formula: v = sqrt((2 * m * g) / (ρ * A * Cd))
  // where m = mass, g = gravity, ρ = density, A = area, Cd = drag coefficient
  const numerator = 2 * payloadWeight * g;
  const denominator = atmosphericDensity * parachuteArea * dragCoefficient;
  
  if (denominator <= 0) {
    throw new Error('Invalid parameters for terminal velocity calculation');
  }
  
  return Math.sqrt(numerator / denominator);
}

// Drag force calculation
export function calculateDragForce(
  velocity: number,
  atmosphericDensity: number,
  parachuteArea: number,
  dragCoefficient: number
): number {
  // Drag force formula: F = 0.5 * ρ * v² * A * Cd
  return 0.5 * atmosphericDensity * Math.pow(velocity, 2) * parachuteArea * dragCoefficient;
}

// Net force during descent
export function calculateDescentNetForce(
  payloadWeight: number,
  dragForce: number
): number {
  const g = 9.81; // m/s²
  const weightForce = payloadWeight * g;
  return weightForce - dragForce;
}

// Vertical velocity calculation during descent
export function calculateDescentVelocity(
  netForce: number,
  payloadWeight: number,
  currentVelocity: number,
  timeStep: number = 1
): number {
  const g = 9.81; // m/s²
  const mass = payloadWeight;
  const acceleration = netForce / mass;
  
  // Update velocity based on acceleration
  const newVelocity = currentVelocity + acceleration * timeStep;
  
  // Ensure velocity doesn't go negative (parachute should slow descent)
  return Math.max(0, newVelocity);
}

// Calculate confidence level based on various factors
function calculateLandingConfidence(
  descentDuration: number,
  maxVelocity: number,
  windDrift: number,
  terminalVelocity: number
): number {
  // Base confidence starts at 0.8
  let confidence = 0.8;
  
  // Reduce confidence for very long descents (potential for errors)
  if (descentDuration > 3600) { // More than 1 hour
    confidence -= 0.1;
  }
  
  // Reduce confidence for very high velocities (potential for damage)
  if (maxVelocity > 20) { // More than 20 m/s
    confidence -= 0.1;
  }
  
  // Reduce confidence for very high wind drift (less predictable)
  if (windDrift > 50) { // More than 50 km
    confidence -= 0.1;
  }
  
  // Increase confidence for stable terminal velocity
  if (terminalVelocity > 0 && terminalVelocity < 15) {
    confidence += 0.05;
  }
  
  return Math.max(0, Math.min(1, confidence));
}

// Main descent calculation function with landing site prediction
export function calculateDescent(input: DescentInput): DescentResult {
  // Validate inputs
  if (input.burstLatitude < -90 || input.burstLatitude > 90) {
    throw new Error('Burst latitude must be between -90 and 90 degrees');
  }
  if (input.burstLongitude < -180 || input.burstLongitude > 180) {
    throw new Error('Burst longitude must be between -180 and 180 degrees');
  }
  if (input.burstAltitude <= 0) {
    throw new Error('Burst altitude must be positive');
  }
  if (input.payloadWeight <= 0) {
    throw new Error('Payload weight must be positive');
  }
  if (input.parachuteArea <= 0) {
    throw new Error('Parachute area must be positive');
  }
  if (input.dragCoefficient <= 0) {
    throw new Error('Drag coefficient must be positive');
  }
  if (input.landingAltitude < 0) {
    throw new Error('Landing altitude cannot be negative');
  }
  if (input.burstAltitude <= input.landingAltitude) {
    throw new Error('Burst altitude must be higher than landing altitude');
  }

  const trajectory: DescentTrajectoryPoint[] = [];
  let currentLat = input.burstLatitude;
  let currentLng = input.burstLongitude;
  let currentAltitude = input.burstAltitude;
  let currentVelocity = 0; // Start from rest after burst
  let currentTime = 0;
  let windDrift = 0;
  let maxVelocity = 0;
  let totalFlightDistance = 0;

  // Set maximum flight time (default 24 hours)
  const maxFlightTime = input.maxFlightTime || 86400; // 24 hours in seconds

  // Calculate trajectory points
  const maxSteps = Math.floor(maxFlightTime); // Prevent infinite loops
  let stepCount = 0;
  const timeStep = 1; // 1 second timesteps
  
  while (currentAltitude > input.landingAltitude && currentTime < maxFlightTime && stepCount < maxSteps) {
    const atmosphericDensity = calculateAtmosphericDensity(currentAltitude);
    
    // Calculate terminal velocity at current altitude
    const terminalVelocity = calculateTerminalVelocity(
      input.payloadWeight,
      atmosphericDensity,
      input.parachuteArea,
      input.dragCoefficient
    );
    
    // Calculate drag force
    const dragForce = calculateDragForce(
      currentVelocity,
      atmosphericDensity,
      input.parachuteArea,
      input.dragCoefficient
    );
    
    // Calculate net force
    const netForce = calculateDescentNetForce(input.payloadWeight, dragForce);
    
    // Update velocity
    currentVelocity = calculateDescentVelocity(netForce, input.payloadWeight, currentVelocity, timeStep);
    
    // Track maximum velocity
    maxVelocity = Math.max(maxVelocity, currentVelocity);
    
    // Calculate wind drift position using the windDrift module
    const newPosition = calculateNewPosition(
      currentLat,
      currentLng,
      input.windSpeed,
      input.windDirection,
      timeStep
    );
    
    // Update position
    const altitudeChange = currentVelocity * timeStep;
    currentAltitude -= altitudeChange; // Descending, so altitude decreases
    currentTime += timeStep;
    stepCount++;

    // Update coordinates
    currentLat = newPosition.lat;
    currentLng = newPosition.lng;

    // Calculate wind drift distance
    const windDriftDistance = (input.windSpeed * timeStep) / 1000; // Convert to km
    windDrift += windDriftDistance;

    // Calculate total flight distance (approximate)
    const positionChange = Math.sqrt(
      Math.pow(newPosition.lat - currentLat, 2) + 
      Math.pow(newPosition.lng - currentLng, 2)
    );
    totalFlightDistance += positionChange * 111; // Rough conversion to km

    // Create trajectory point (only every 50 steps to reduce memory usage)
    if (stepCount % 50 === 0 || currentAltitude <= input.landingAltitude) {
      const point: DescentTrajectoryPoint = {
        lat: currentLat,
        lng: currentLng,
        alt: Math.max(currentAltitude, input.landingAltitude),
        timestamp: new Date(Date.now() + currentTime * 1000).toISOString(),
        velocity: currentVelocity,
        windSpeed: input.windSpeed,
        windDirection: input.windDirection,
        phase: currentAltitude > input.landingAltitude ? 'descent' : 'landing'
      };

      trajectory.push(point);
    }

    // Check for landing
    if (currentAltitude <= input.landingAltitude) {
      break;
    }
  }

  // Final landing point
  const landingPoint: DescentTrajectoryPoint = {
    lat: currentLat,
    lng: currentLng,
    alt: input.landingAltitude,
    timestamp: new Date(Date.now() + currentTime * 1000).toISOString(),
    velocity: 0, // Landed, so velocity is 0
    windSpeed: input.windSpeed,
    windDirection: input.windDirection,
    phase: 'landing'
  };

  // Calculate final terminal velocity at landing altitude
  const landingAtmosphericDensity = calculateAtmosphericDensity(input.landingAltitude);
  const finalTerminalVelocity = calculateTerminalVelocity(
    input.payloadWeight,
    landingAtmosphericDensity,
    input.parachuteArea,
    input.dragCoefficient
  );

  // Calculate confidence level
  const confidence = calculateLandingConfidence(
    currentTime,
    maxVelocity,
    windDrift,
    finalTerminalVelocity
  );

  return {
    trajectory,
    landingPoint,
    landingLatitude: currentLat,
    landingLongitude: currentLng,
    landingTime: currentTime,
    descentDuration: currentTime,
    terminalVelocity: finalTerminalVelocity,
    windDrift,
    maxVelocity,
    totalFlightDistance,
    confidence
  };
}

// Utility function to validate descent inputs
export function validateDescentInput(input: DescentInput): boolean {
  return (
    input.burstLatitude >= -90 && input.burstLatitude <= 90 &&
    input.burstLongitude >= -180 && input.burstLongitude <= 180 &&
    input.burstAltitude > 0 &&
    input.payloadWeight > 0 &&
    input.parachuteArea > 0 &&
    input.dragCoefficient > 0 &&
    input.windSpeed >= 0 &&
    input.windDirection >= 0 &&
    input.windDirection <= 360 &&
    input.landingAltitude >= 0 &&
    input.burstAltitude > input.landingAltitude
  );
}

// Utility function to calculate descent time estimate
export function estimateDescentTime(
  burstAltitude: number,
  terminalVelocity: number
): number {
  if (terminalVelocity <= 0) {
    throw new Error('Terminal velocity must be positive');
  }
  
  const altitudeDifference = burstAltitude;
  return altitudeDifference / terminalVelocity;
}

// Landing site prediction function (main entry point for task-11e)
export function predictLandingSite(
  burstLatitude: number,
  burstLongitude: number,
  burstAltitude: number,
  payloadWeight: number,
  parachuteArea: number,
  dragCoefficient: number,
  windSpeed: number,
  windDirection: number,
  landingAltitude: number = 0,
  maxFlightTime?: number
): DescentResult {
  const input: DescentInput = {
    burstLatitude,
    burstLongitude,
    burstAltitude,
    payloadWeight,
    parachuteArea,
    dragCoefficient,
    windSpeed,
    windDirection,
    landingAltitude,
    maxFlightTime
  };

  return calculateDescent(input);
} 