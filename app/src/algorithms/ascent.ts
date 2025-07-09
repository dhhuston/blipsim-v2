// Ascent phase calculation algorithm for balloon trajectory prediction
// Based on task-11a specifications

import { calculateAtmosphericDensity } from './atmospheric';

export interface AscentInput {
  balloonVolume: number;      // m³
  payloadWeight: number;      // kg
  launchAltitude: number;     // m
  burstAltitude: number;      // m
  ascentRate: number;         // m/s
  atmosphericDensity: number; // kg/m³
  windSpeed: number;          // m/s
  windDirection: number;      // degrees
}

export interface TrajectoryPoint {
  lat: number;
  lng: number;
  alt: number;
  timestamp: string;
  velocity: number;           // m/s
  windSpeed: number;          // m/s
  windDirection: number;      // degrees
}

export interface AscentResult {
  trajectory: TrajectoryPoint[];
  burstPoint: TrajectoryPoint;
  ascentDuration: number;     // seconds
  maxAltitude: number;        // m
  windDrift: number;          // km
}

// Buoyancy force calculation
export function calculateBuoyancyForce(balloonVolume: number, atmosphericDensity: number): number {
  const g = 9.81; // m/s²
  return balloonVolume * atmosphericDensity * g;
}

// Net force calculation
export function calculateNetForce(
  balloonVolume: number, 
  payloadWeight: number, 
  atmosphericDensity: number
): number {
  const g = 9.81; // m/s²
  const buoyancyForce = calculateBuoyancyForce(balloonVolume, atmosphericDensity);
  const weightForce = payloadWeight * g;
  return buoyancyForce - weightForce;
}

// Vertical velocity calculation
export function calculateVerticalVelocity(
  netForce: number, 
  payloadWeight: number, 
  dragCoefficient: number = 0.5
): number {
  const g = 9.81; // m/s²
  const mass = payloadWeight; // Simplified mass calculation
  const acceleration = netForce / mass;
  
  // Apply drag effects
  const dragFactor = 1 - (dragCoefficient * 0.1);
  return Math.max(0, acceleration * dragFactor);
}

// Main ascent calculation function
export function calculateAscent(input: AscentInput): AscentResult {
  // Validate inputs
  if (input.balloonVolume <= 0) {
    throw new Error('Balloon volume must be positive');
  }
  if (input.payloadWeight <= 0) {
    throw new Error('Payload weight must be positive');
  }
  if (input.launchAltitude < 0) {
    throw new Error('Launch altitude cannot be negative');
  }
  if (input.burstAltitude <= input.launchAltitude) {
    throw new Error('Burst altitude must be higher than launch altitude');
  }
  if (input.ascentRate <= 0) {
    throw new Error('Ascent rate must be positive');
  }

  const trajectory: TrajectoryPoint[] = [];
  let currentAltitude = input.launchAltitude;
  let currentTime = 0;
  let windDrift = 0;

  // Calculate trajectory points
  const maxSteps = 10000; // Prevent infinite loops
  let stepCount = 0;
  
  while (currentAltitude < input.burstAltitude && stepCount < maxSteps) {
    const atmosphericDensity = calculateAtmosphericDensity(currentAltitude);
    const netForce = calculateNetForce(input.balloonVolume, input.payloadWeight, atmosphericDensity);
    const verticalVelocity = calculateVerticalVelocity(netForce, input.payloadWeight);
    
    // Update position
    const timeStep = 1; // 1 second timesteps
    const altitudeChange = verticalVelocity * timeStep;
    currentAltitude += altitudeChange;
    currentTime += timeStep;
    stepCount++;

    // Calculate wind drift
    const windDriftDistance = (input.windSpeed * timeStep) / 1000; // Convert to km
    windDrift += windDriftDistance;

    // Create trajectory point (only every 50 steps to reduce memory usage)
    if (stepCount % 50 === 0 || currentAltitude >= input.burstAltitude) {
      const point: TrajectoryPoint = {
        lat: 0, // TODO: Calculate actual lat/lng based on wind drift
        lng: 0,
        alt: currentAltitude,
        timestamp: new Date(Date.now() + currentTime * 1000).toISOString(),
        velocity: verticalVelocity,
        windSpeed: input.windSpeed,
        windDirection: input.windDirection
      };

      trajectory.push(point);
    }

    // Check for burst
    if (currentAltitude >= input.burstAltitude) {
      break;
    }
  }

  const burstPoint: TrajectoryPoint = {
    lat: 0,
    lng: 0,
    alt: input.burstAltitude,
    timestamp: new Date(Date.now() + currentTime * 1000).toISOString(),
    velocity: 0,
    windSpeed: input.windSpeed,
    windDirection: input.windDirection
  };

  return {
    trajectory,
    burstPoint,
    ascentDuration: currentTime,
    maxAltitude: input.burstAltitude,
    windDrift
  };
}

// Utility function to validate ascent inputs
export function validateAscentInput(input: AscentInput): boolean {
  return (
    input.balloonVolume > 0 &&
    input.payloadWeight > 0 &&
    input.launchAltitude >= 0 &&
    input.burstAltitude > input.launchAltitude &&
    input.ascentRate > 0 &&
    input.atmosphericDensity > 0 &&
    input.windSpeed >= 0 &&
    input.windDirection >= 0 &&
    input.windDirection <= 360
  );
} 