// Burst site prediction algorithm for balloon trajectory prediction
// Based on task-11d specifications

import { calculateAtmosphericDensity } from './atmospheric';
import { calculateNewPosition } from './windDrift';

export interface BurstSiteInput {
  launchLatitude: number;     // degrees
  launchLongitude: number;    // degrees
  launchAltitude: number;     // m
  burstAltitude: number;      // m
  balloonVolume: number;      // m³
  payloadWeight: number;      // kg
  ascentRate: number;         // m/s
  windSpeed: number;          // m/s
  windDirection: number;      // degrees
  windSpeedAtAltitude?: number; // m/s (optional, defaults to surface wind)
  windDirectionAtAltitude?: number; // degrees (optional, defaults to surface wind)
  maxFlightTime?: number;     // seconds (optional, defaults to 24 hours)
}

export interface BurstSiteResult {
  burstLatitude: number;      // degrees
  burstLongitude: number;     // degrees
  burstAltitude: number;      // m
  burstTime: number;          // seconds from launch
  totalWindDrift: number;     // km
  ascentDuration: number;     // seconds
  trajectory: BurstTrajectoryPoint[];
  confidence: number;         // 0-1 confidence level
  earlyBurstRisk: number;     // 0-1 risk of early burst
}

export interface BurstTrajectoryPoint {
  lat: number;
  lng: number;
  alt: number;
  timestamp: string;
  velocity: number;           // m/s
  windSpeed: number;          // m/s
  windDirection: number;      // degrees
  atmosphericDensity: number; // kg/m³
  phase: 'ascent' | 'burst';
}

// Calculate buoyancy force
function calculateBuoyancyForce(balloonVolume: number, atmosphericDensity: number): number {
  const g = 9.81; // m/s²
  return balloonVolume * atmosphericDensity * g;
}

// Calculate net force during ascent
function calculateNetForce(
  balloonVolume: number, 
  payloadWeight: number, 
  atmosphericDensity: number
): number {
  const g = 9.81; // m/s²
  const buoyancyForce = calculateBuoyancyForce(balloonVolume, atmosphericDensity);
  const weightForce = payloadWeight * g;
  return buoyancyForce - weightForce;
}

// Calculate vertical velocity during ascent
function calculateVerticalVelocity(
  netForce: number, 
  payloadWeight: number, 
  dragCoefficient: number = 0.5
): number {
  const g = 9.81; // m/s²
  const mass = payloadWeight;
  const acceleration = netForce / mass;
  
  // Apply drag effects
  const dragFactor = 1 - (dragCoefficient * 0.1);
  return Math.max(0, acceleration * dragFactor);
}

// Calculate early burst risk based on atmospheric conditions
function calculateEarlyBurstRisk(
  currentAltitude: number,
  burstAltitude: number,
  atmosphericDensity: number,
  balloonVolume: number,
  payloadWeight: number
): number {
  // Risk increases as balloon approaches burst altitude
  const altitudeRatio = currentAltitude / burstAltitude;
  
  // Risk also increases with atmospheric density changes
  const seaLevelDensity = 1.225; // kg/m³
  const densityRatio = atmosphericDensity / seaLevelDensity;
  
  // Calculate pressure differential risk
  const netForce = calculateNetForce(balloonVolume, payloadWeight, atmosphericDensity);
  const maxSafeForce = payloadWeight * 9.81 * 2; // 2g limit
  const forceRatio = Math.min(netForce / maxSafeForce, 1);
  
  // Combine risk factors
  const altitudeRisk = Math.max(0, (altitudeRatio - 0.8) * 5); // Risk increases above 80% of burst altitude
  const densityRisk = Math.max(0, (densityRatio - 1) * 0.5);
  const forceRisk = Math.max(0, (forceRatio - 0.8) * 2);
  
  return Math.min(1, altitudeRisk + densityRisk + forceRisk);
}

// Main burst site prediction function
export function predictBurstSite(input: BurstSiteInput): BurstSiteResult {
  // Validate inputs
  if (input.launchLatitude < -90 || input.launchLatitude > 90) {
    throw new Error('Launch latitude must be between -90 and 90 degrees');
  }
  if (input.launchLongitude < -180 || input.launchLongitude > 180) {
    throw new Error('Launch longitude must be between -180 and 180 degrees');
  }
  if (input.launchAltitude < 0) {
    throw new Error('Launch altitude cannot be negative');
  }
  if (input.burstAltitude <= input.launchAltitude) {
    throw new Error('Burst altitude must be higher than launch altitude');
  }
  if (input.balloonVolume <= 0) {
    throw new Error('Balloon volume must be positive');
  }
  if (input.payloadWeight <= 0) {
    throw new Error('Payload weight must be positive');
  }
  if (input.ascentRate <= 0) {
    throw new Error('Ascent rate must be positive');
  }
  if (input.windSpeed < 0) {
    throw new Error('Wind speed cannot be negative');
  }
  if (input.windDirection < 0 || input.windDirection > 360) {
    throw new Error('Wind direction must be between 0 and 360 degrees');
  }

  const trajectory: BurstTrajectoryPoint[] = [];
  let currentLat = input.launchLatitude;
  let currentLng = input.launchLongitude;
  let currentAltitude = input.launchAltitude;
  let currentTime = 0;
  let totalWindDrift = 0;
  let maxEarlyBurstRisk = 0;

  // Use altitude-specific wind data if available, otherwise use surface wind
  const effectiveWindSpeed = input.windSpeedAtAltitude || input.windSpeed;
  const effectiveWindDirection = input.windDirectionAtAltitude || input.windDirection;
  
  // Set maximum flight time (default 24 hours)
  const maxFlightTime = input.maxFlightTime || 86400; // 24 hours in seconds

  // Calculate trajectory points with 1-second timesteps
  const timeStep = 1; // 1 second timesteps for precision
  let stepCount = 0;
  const maxSteps = Math.floor(maxFlightTime / timeStep);

  while (currentAltitude < input.burstAltitude && currentTime < maxFlightTime && stepCount < maxSteps) {
    const atmosphericDensity = calculateAtmosphericDensity(currentAltitude);
    const netForce = calculateNetForce(input.balloonVolume, input.payloadWeight, atmosphericDensity);
    const verticalVelocity = calculateVerticalVelocity(netForce, input.payloadWeight);
    
    // Calculate wind drift for this timestep
    const newPosition = calculateNewPosition(
      currentLat,
      currentLng,
      effectiveWindSpeed,
      effectiveWindDirection,
      timeStep
    );

    // Update position
    const altitudeChange = verticalVelocity * timeStep;
    currentAltitude += altitudeChange;
    currentTime += timeStep;
    stepCount++;

    // Update coordinates with wind drift
    currentLat = newPosition.lat;
    currentLng = newPosition.lng;

    // Calculate wind drift distance
    const windDriftDistance = (effectiveWindSpeed * timeStep) / 1000; // Convert to km
    totalWindDrift += windDriftDistance;

    // Calculate early burst risk
    const earlyBurstRisk = calculateEarlyBurstRisk(
      currentAltitude,
      input.burstAltitude,
      atmosphericDensity,
      input.balloonVolume,
      input.payloadWeight
    );
    maxEarlyBurstRisk = Math.max(maxEarlyBurstRisk, earlyBurstRisk);

    // Create trajectory point (only every 50 steps to reduce memory usage)
    if (stepCount % 50 === 0 || currentAltitude >= input.burstAltitude) {
      const point: BurstTrajectoryPoint = {
        lat: currentLat,
        lng: currentLng,
        alt: currentAltitude,
        timestamp: new Date(Date.now() + currentTime * 1000).toISOString(),
        velocity: verticalVelocity,
        windSpeed: effectiveWindSpeed,
        windDirection: effectiveWindDirection,
        atmosphericDensity,
        phase: currentAltitude >= input.burstAltitude ? 'burst' : 'ascent'
      };

      trajectory.push(point);
    }

    // Check for burst condition
    if (currentAltitude >= input.burstAltitude) {
      break;
    }
    // Early burst: if risk is very high, trigger burst
    if (maxEarlyBurstRisk > 0.7 && currentAltitude > input.launchAltitude + 100) {
      break;
    }
  }

  // Handle edge cases
  let burstLatitude = currentLat;
  let burstLongitude = currentLng;
  let burstAltitude = currentAltitude;
  let burstTime = currentTime;

  // If we didn't reach burst altitude, use the maximum altitude reached
  if (currentAltitude < input.burstAltitude) {
    burstAltitude = currentAltitude;
    burstTime = currentTime;
  } else if (currentTime >= maxFlightTime) {
    // If we hit the max flight time, set burstTime to -1 to indicate timeout
    burstTime = -1;
  }

  // Calculate confidence based on various factors
  const altitudeConfidence = Math.min(1, currentAltitude / input.burstAltitude);
  const timeConfidence = burstTime === -1 ? 0 : Math.min(1, 1 - (currentTime / maxFlightTime));
  const windConfidence = Math.min(1, 1 - (totalWindDrift / 1000)); // Lower confidence for high wind drift
  const confidence = (altitudeConfidence + timeConfidence + windConfidence) / 3;

  // If maxEarlyBurstRisk is still 0, but we didn't reach burst altitude, set a minimal risk
  const finalEarlyBurstRisk = (maxEarlyBurstRisk === 0 && currentAltitude < input.burstAltitude) ? 0.1 : maxEarlyBurstRisk;

  return {
    burstLatitude,
    burstLongitude,
    burstAltitude,
    burstTime,
    totalWindDrift,
    ascentDuration: burstTime === -1 ? currentTime : burstTime,
    trajectory,
    confidence,
    earlyBurstRisk: finalEarlyBurstRisk
  };
}

// Utility function to validate burst site inputs
export function validateBurstSiteInput(input: BurstSiteInput): boolean {
  return (
    input.launchLatitude >= -90 && input.launchLatitude <= 90 &&
    input.launchLongitude >= -180 && input.launchLongitude <= 180 &&
    input.launchAltitude >= 0 &&
    input.burstAltitude > input.launchAltitude &&
    input.balloonVolume > 0 &&
    input.payloadWeight > 0 &&
    input.ascentRate > 0 &&
    input.windSpeed >= 0 &&
    input.windDirection >= 0 && input.windDirection <= 360 &&
    (!input.maxFlightTime || input.maxFlightTime > 0)
  );
}

// Utility function to estimate burst time
export function estimateBurstTime(
  launchAltitude: number,
  burstAltitude: number,
  ascentRate: number
): number {
  if (ascentRate <= 0) {
    throw new Error('Ascent rate must be positive');
  }
  
  const altitudeDifference = burstAltitude - launchAltitude;
  return altitudeDifference / ascentRate;
}

// Utility function to calculate burst site with uncertainty
export function predictBurstSiteWithUncertainty(
  input: BurstSiteInput,
  uncertainty: {
    windSpeedError: number;    // m/s
    windDirectionError: number; // degrees
    ascentRateError: number;   // m/s
    burstAltitudeError: number; // m
  }
): BurstSiteResult {
  // Apply uncertainty to input parameters
  const uncertainInput: BurstSiteInput = {
    ...input,
    windSpeed: Math.max(0, input.windSpeed + (Math.random() - 0.5) * 2 * uncertainty.windSpeedError),
    windDirection: ((input.windDirection + (Math.random() - 0.5) * 2 * uncertainty.windDirectionError + 360) % 360),
    ascentRate: Math.max(0.1, input.ascentRate + (Math.random() - 0.5) * 2 * uncertainty.ascentRateError),
    burstAltitude: Math.max(input.launchAltitude + 100, input.burstAltitude + (Math.random() - 0.5) * 2 * uncertainty.burstAltitudeError)
  };

  return predictBurstSite(uncertainInput);
} 