// Wind drift calculation algorithm for balloon trajectory prediction
// Based on task-11c specifications

export interface WindDriftInput {
  startLatitude: number;      // degrees
  startLongitude: number;     // degrees
  windSpeed: number;          // m/s
  windDirection: number;      // degrees
  duration: number;           // seconds
  altitude: number;           // m
  windSpeedAtAltitude?: number; // m/s (optional, defaults to surface wind)
  windDirectionAtAltitude?: number; // degrees (optional, defaults to surface wind)
}

export interface WindDriftResult {
  endLatitude: number;        // degrees
  endLongitude: number;       // degrees
  totalDistance: number;      // km
  averageSpeed: number;       // m/s
  trajectory: WindDriftPoint[];
}

export interface WindDriftPoint {
  lat: number;
  lng: number;
  alt: number;
  timestamp: string;
  windSpeed: number;          // m/s
  windDirection: number;      // degrees
  distance: number;           // km
}

// Wind uncertainty model for Monte Carlo simulation
export interface WindUncertainty {
  speedError: number;         // m/s (standard deviation)
  directionError: number;     // degrees (standard deviation)
  altitudeError: number;      // m (standard deviation)
  timeError: number;          // seconds (standard deviation)
}

// Monte Carlo simulation result
export interface MonteCarloResult {
  trajectories: WindDriftResult[];
  confidenceInterval: {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
    minDistance: number;
    maxDistance: number;
  };
  statistics: {
    meanDistance: number;
    stdDevDistance: number;
    meanEndLatitude: number;
    meanEndLongitude: number;
    confidenceLevel: number;
  };
}

// Wind data point for interpolation
export interface WindDataPoint {
  altitude: number;           // m
  windSpeed: number;          // m/s
  windDirection: number;      // degrees
  timestamp: string;
}

// Convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Linear interpolation for wind data
export function interpolateWindData(
  targetAltitude: number,
  windDataPoints: WindDataPoint[]
): { windSpeed: number; windDirection: number } {
  if (windDataPoints.length === 0) {
    throw new Error('No wind data points provided');
  }

  if (windDataPoints.length === 1) {
    return {
      windSpeed: windDataPoints[0].windSpeed,
      windDirection: windDataPoints[0].windDirection
    };
  }

  // Sort by altitude
  const sortedData = [...windDataPoints].sort((a, b) => a.altitude - b.altitude);

  // Find the two closest altitude points
  let lowerPoint: WindDataPoint | null = null;
  let upperPoint: WindDataPoint | null = null;

  for (let i = 0; i < sortedData.length; i++) {
    if (sortedData[i].altitude <= targetAltitude) {
      lowerPoint = sortedData[i];
    } else {
      upperPoint = sortedData[i];
      break;
    }
  }

  // Handle edge cases
  if (!lowerPoint) {
    return {
      windSpeed: sortedData[0].windSpeed,
      windDirection: sortedData[0].windDirection
    };
  }

  if (!upperPoint) {
    return {
      windSpeed: sortedData[sortedData.length - 1].windSpeed,
      windDirection: sortedData[sortedData.length - 1].windDirection
    };
  }

  // Linear interpolation
  const altitudeRatio = (targetAltitude - lowerPoint.altitude) / 
                       (upperPoint.altitude - lowerPoint.altitude);

  // Interpolate wind speed
  const interpolatedSpeed = lowerPoint.windSpeed + 
                           altitudeRatio * (upperPoint.windSpeed - lowerPoint.windSpeed);

  // Interpolate wind direction (handle circular nature)
  let directionDiff = upperPoint.windDirection - lowerPoint.windDirection;
  if (directionDiff > 180) directionDiff -= 360;
  if (directionDiff < -180) directionDiff += 360;

  const interpolatedDirection = lowerPoint.windDirection + altitudeRatio * directionDiff;
  const normalizedDirection = ((interpolatedDirection + 360) % 360);

  return {
    windSpeed: interpolatedSpeed,
    windDirection: normalizedDirection
  };
}

// Generate random wind data with uncertainty
export function generateRandomWindData(
  baseWindSpeed: number,
  baseWindDirection: number,
  uncertainty: WindUncertainty
): { windSpeed: number; windDirection: number } {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

  // Apply uncertainty to wind speed
  const speedError = z0 * uncertainty.speedError;
  const windSpeed = Math.max(0, baseWindSpeed + speedError);

  // Apply uncertainty to wind direction
  const directionError = z1 * uncertainty.directionError;
  let windDirection = baseWindDirection + directionError;
  windDirection = ((windDirection + 360) % 360);

  return { windSpeed, windDirection };
}

// Calculate new position based on wind drift
export function calculateNewPosition(
  startLat: number,
  startLng: number,
  windSpeed: number,
  windDirection: number,
  duration: number
): { lat: number; lng: number } {
  const R = 6371; // Earth's radius in km
  
  // Convert wind speed from m/s to km/s
  const speedKmS = windSpeed / 1000;
  
  // Calculate distance traveled
  const distance = speedKmS * duration;
  
  // Convert distance to angular distance
  const angularDistance = distance / R;
  
  // Convert wind direction to radians
  const bearing = toRadians(windDirection);
  
  // Calculate new latitude
  const lat1 = toRadians(startLat);
  const lng1 = toRadians(startLng);
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  
  // Calculate new longitude
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  // Normalize longitude to -180 to 180
  const normalizedLng2 = ((lng2 + Math.PI) % (2 * Math.PI)) - Math.PI;
  
  return {
    lat: toDegrees(lat2),
    lng: toDegrees(normalizedLng2)
  };
}

// Main wind drift calculation function
export function calculateWindDrift(input: WindDriftInput): WindDriftResult {
  // Validate inputs
  if (input.startLatitude < -90 || input.startLatitude > 90) {
    throw new Error('Start latitude must be between -90 and 90 degrees');
  }
  if (input.startLongitude < -180 || input.startLongitude > 180) {
    throw new Error('Start longitude must be between -180 and 180 degrees');
  }
  if (input.windSpeed < 0) {
    throw new Error('Wind speed cannot be negative');
  }
  if (input.windDirection < 0 || input.windDirection > 360) {
    throw new Error('Wind direction must be between 0 and 360 degrees');
  }
  if (input.duration <= 0) {
    throw new Error('Duration must be positive');
  }
  if (input.altitude < 0) {
    throw new Error('Altitude cannot be negative');
  }

  const trajectory: WindDriftPoint[] = [];
  let currentLat = input.startLatitude;
  let currentLng = input.startLongitude;
  let currentTime = 0;
  let totalDistance = 0;

  // Use altitude-specific wind data if available, otherwise use surface wind
  const effectiveWindSpeed = input.windSpeedAtAltitude || input.windSpeed;
  const effectiveWindDirection = input.windDirectionAtAltitude || input.windDirection;

  // Calculate trajectory points
  const timeStep = 60; // 1 minute timesteps for efficiency
  while (currentTime < input.duration) {
    const stepDuration = Math.min(timeStep, input.duration - currentTime);
    
    // Calculate new position
    const newPosition = calculateNewPosition(
      currentLat,
      currentLng,
      effectiveWindSpeed,
      effectiveWindDirection,
      stepDuration
    );

    // Calculate distance for this step
    const stepDistance = calculateDistance(
      currentLat, currentLng,
      newPosition.lat, newPosition.lng
    );
    totalDistance += stepDistance;

    // Create trajectory point
    const point: WindDriftPoint = {
      lat: newPosition.lat,
      lng: newPosition.lng,
      alt: input.altitude,
      timestamp: new Date(Date.now() + currentTime * 1000).toISOString(),
      windSpeed: effectiveWindSpeed,
      windDirection: effectiveWindDirection,
      distance: stepDistance
    };

    trajectory.push(point);

    // Update current position
    currentLat = newPosition.lat;
    currentLng = newPosition.lng;
    currentTime += stepDuration;
  }

  const averageSpeed = (totalDistance * 1000) / input.duration; // Convert km to m

  return {
    endLatitude: currentLat,
    endLongitude: currentLng,
    totalDistance,
    averageSpeed,
    trajectory
  };
}

// Monte Carlo simulation for wind drift uncertainty
export function runMonteCarloSimulation(
  input: WindDriftInput,
  uncertainty: WindUncertainty,
  numSimulations: number = 1000
): MonteCarloResult {
  if (numSimulations <= 0) {
    throw new Error('Number of simulations must be positive');
  }

  const trajectories: WindDriftResult[] = [];
  const distances: number[] = [];
  const endLatitudes: number[] = [];
  const endLongitudes: number[] = [];

  // Run Monte Carlo simulations
  for (let i = 0; i < numSimulations; i++) {
    // Generate random wind data with uncertainty
    const randomWind = generateRandomWindData(
      input.windSpeed,
      input.windDirection,
      uncertainty
    );

    // Create modified input with random wind data
    const randomInput: WindDriftInput = {
      ...input,
      windSpeed: randomWind.windSpeed,
      windDirection: randomWind.windDirection,
      windSpeedAtAltitude: input.windSpeedAtAltitude ? 
        generateRandomWindData(input.windSpeedAtAltitude, input.windDirectionAtAltitude || input.windDirection, uncertainty).windSpeed : undefined,
      windDirectionAtAltitude: input.windDirectionAtAltitude ? 
        generateRandomWindData(input.windSpeedAtAltitude || input.windSpeed, input.windDirectionAtAltitude, uncertainty).windDirection : undefined
    };

    // Add random time uncertainty
    const timeError = (Math.random() - 0.5) * 2 * uncertainty.timeError;
    randomInput.duration = Math.max(1, input.duration + timeError);

    // Add random altitude uncertainty
    const altitudeError = (Math.random() - 0.5) * 2 * uncertainty.altitudeError;
    randomInput.altitude = Math.max(0, input.altitude + altitudeError);

    // Calculate trajectory with random parameters
    const result = calculateWindDrift(randomInput);
    trajectories.push(result);
    distances.push(result.totalDistance);
    endLatitudes.push(result.endLatitude);
    endLongitudes.push(result.endLongitude);
  }

  // Calculate statistics
  const meanDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  const meanEndLatitude = endLatitudes.reduce((sum, lat) => sum + lat, 0) / endLatitudes.length;
  const meanEndLongitude = endLongitudes.reduce((sum, lng) => sum + lng, 0) / endLongitudes.length;

  // Calculate standard deviation
  const distanceVariance = distances.reduce((sum, d) => sum + Math.pow(d - meanDistance, 2), 0) / distances.length;
  const stdDevDistance = Math.sqrt(distanceVariance);

  // Calculate confidence intervals (95% confidence)
  const sortedDistances = [...distances].sort((a, b) => a - b);
  const sortedLatitudes = [...endLatitudes].sort((a, b) => a - b);
  const sortedLongitudes = [...endLongitudes].sort((a, b) => a - b);

  const confidenceIndex = Math.floor(0.025 * numSimulations);
  const confidenceInterval = {
    minDistance: sortedDistances[confidenceIndex],
    maxDistance: sortedDistances[numSimulations - 1 - confidenceIndex],
    minLatitude: sortedLatitudes[confidenceIndex],
    maxLatitude: sortedLatitudes[numSimulations - 1 - confidenceIndex],
    minLongitude: sortedLongitudes[confidenceIndex],
    maxLongitude: sortedLongitudes[numSimulations - 1 - confidenceIndex]
  };

  return {
    trajectories,
    confidenceInterval,
    statistics: {
      meanDistance,
      stdDevDistance,
      meanEndLatitude,
      meanEndLongitude,
      confidenceLevel: 0.95
    }
  };
}

// Monte Carlo landing zone uncertainty for balloon landing
export interface MonteCarloLandingParams {
  baseLatitude: number;
  baseLongitude: number;
  windSpeed: number; // m/s
  windDirection: number; // degrees
  windErrorRMS: number; // m/s RMS error
  numSamples: number;
  descentDuration: number; // seconds
}

export interface MonteCarloLandingResult {
  landingPoints: Array<{ latitude: number; longitude: number }>;
  landingRadius: number; // meters (95% confidence)
  windError: number; // m/s RMS
}

/**
 * Monte Carlo simulation for landing zone uncertainty (task-11f)
 * Simulates numSamples landings with wind error, returns 95% confidence radius (meters)
 */
export function performMonteCarloLandingUncertainty(params: MonteCarloLandingParams): MonteCarloLandingResult {
  const { baseLatitude, baseLongitude, windSpeed, windDirection, windErrorRMS, numSamples, descentDuration } = params;
  const landingPoints: Array<{ latitude: number; longitude: number }> = [];

  for (let i = 0; i < numSamples; i++) {
    let lat = baseLatitude;
    let lng = baseLongitude;
    let currentTime = 0;
    const timeStep = 1; // 1 second
    while (currentTime < descentDuration) {
      // Add wind error (normal distribution, RMS)
      const windSpeedError = (Math.random() - 0.5) * 2 * windErrorRMS;
      const windDirectionError = (Math.random() - 0.5) * 2 * 15; // 15 deg RMS typical
      const simWindSpeed = Math.max(0, windSpeed + windSpeedError);
      const simWindDirection = (windDirection + windDirectionError + 360) % 360;
      const newPos = calculateNewPosition(lat, lng, simWindSpeed, simWindDirection, timeStep);
      lat = newPos.lat;
      lng = newPos.lng;
      currentTime += timeStep;
    }
    landingPoints.push({ latitude: lat, longitude: lng });
  }

  // Calculate distances from base point
  const distances = landingPoints.map(pt => {
    const dx = (pt.longitude - baseLongitude) * Math.cos(baseLatitude * Math.PI / 180);
    const dy = pt.latitude - baseLatitude;
    return Math.sqrt(dx * dx + dy * dy) * 111000; // meters
  });
  distances.sort((a, b) => a - b);
  const landingRadius = distances[Math.floor(0.95 * distances.length)];

  return { landingPoints, landingRadius, windError: windErrorRMS };
}

// Calculate wind drift for multiple altitude layers
export function calculateMultiLayerWindDrift(
  startLat: number,
  startLng: number,
  windLayers: Array<{
    altitude: number;
    windSpeed: number;
    windDirection: number;
    duration: number;
  }>
): WindDriftResult {
  let currentLat = startLat;
  let currentLng = startLng;
  let totalDistance = 0;
  let totalDuration = 0;
  const trajectory: WindDriftPoint[] = [];

  for (const layer of windLayers) {
    const layerResult = calculateWindDrift({
      startLatitude: currentLat,
      startLongitude: currentLng,
      windSpeed: layer.windSpeed,
      windDirection: layer.windDirection,
      duration: layer.duration,
      altitude: layer.altitude
    });

    // Update position for next layer
    currentLat = layerResult.endLatitude;
    currentLng = layerResult.endLongitude;
    totalDistance += layerResult.totalDistance;
    totalDuration += layer.duration;

    // Add trajectory points from this layer
    trajectory.push(...layerResult.trajectory);
  }

  const averageSpeed = totalDuration > 0 ? (totalDistance * 1000) / totalDuration : 0;

  return {
    endLatitude: currentLat,
    endLongitude: currentLng,
    totalDistance,
    averageSpeed,
    trajectory
  };
}

// Utility function to validate wind drift inputs
export function validateWindDriftInput(input: WindDriftInput): boolean {
  return (
    input.startLatitude >= -90 && input.startLatitude <= 90 &&
    input.startLongitude >= -180 && input.startLongitude <= 180 &&
    input.windSpeed >= 0 &&
    input.windDirection >= 0 && input.windDirection <= 360 &&
    input.duration > 0 &&
    input.altitude >= 0
  );
}

// Utility function to validate wind uncertainty parameters
export function validateWindUncertainty(uncertainty: WindUncertainty): boolean {
  return (
    uncertainty.speedError >= 0 &&
    uncertainty.directionError >= 0 &&
    uncertainty.altitudeError >= 0 &&
    uncertainty.timeError >= 0
  );
} 