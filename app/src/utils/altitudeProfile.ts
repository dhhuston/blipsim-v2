// Altitude profile calculation utilities for weather data requirements
// Based on task-12d specifications

export interface AltitudeRequirements {
  min: number;                    // Ground level (meters)
  max: number;                    // Burst altitude + safety margin (meters)
  intervals: number[];            // Specific altitude levels needed (meters)
  resolution: number;             // Altitude resolution (meters)
  safetyMargin: number;          // Safety margin above burst altitude (meters)
}

export interface FlightPhaseAltitudes {
  ascent: {
    start: number;                // Launch altitude
    end: number;                  // Burst altitude
    keyLevels: number[];          // Important altitude levels during ascent
  };
  descent: {
    start: number;                // Burst altitude
    end: number;                  // Landing altitude (estimated)
    keyLevels: number[];          // Important altitude levels during descent
  };
}

export interface AtmosphericLayer {
  name: string;                   // Layer name (troposphere, stratosphere, etc.)
  bottom: number;                 // Bottom altitude (meters)
  top: number;                    // Top altitude (meters)
  characteristics: {
    temperatureLapse: number;     // Temperature lapse rate (K/m)
    windBehavior: string;         // Expected wind behavior
    dataImportance: 'critical' | 'important' | 'optional';
  };
}

/**
 * Calculate altitude requirements for weather data fetching
 * @param launchAltitude Launch altitude in meters
 * @param burstAltitude Expected burst altitude in meters
 * @param safetyMargin Additional margin above burst altitude
 * @returns Altitude requirements for weather data
 */
export function calculateAltitudeRequirements(
  launchAltitude: number,
  burstAltitude: number,
  safetyMargin: number = 5000
): AltitudeRequirements {
  try {
    // Validate inputs
    if (launchAltitude < 0 || burstAltitude <= launchAltitude || safetyMargin < 0) {
      throw new Error('Invalid altitude parameters');
    }

    // Calculate min and max altitudes
    const min = Math.max(0, launchAltitude - 500); // Include 500m below launch for ground conditions
    const max = burstAltitude + safetyMargin;

    // Determine appropriate resolution based on altitude range
    const altitudeRange = max - min;
    let resolution: number;
    
    if (altitudeRange <= 10000) {
      resolution = 500;   // 500m intervals for low altitude flights
    } else if (altitudeRange <= 25000) {
      resolution = 1000;  // 1km intervals for medium altitude flights
    } else {
      resolution = 2000;  // 2km intervals for high altitude flights
    }

    // Generate altitude intervals
    const intervals = generateAltitudeIntervals(min, max, resolution);

    // Add critical atmospheric boundary layers
    const boundaryLayers = getCriticalAtmosphericLayers(min, max);
    const enhancedIntervals = addBoundaryLayerAltitudes(intervals, boundaryLayers);

    return {
      min,
      max,
      intervals: enhancedIntervals,
      resolution,
      safetyMargin
    };
  } catch (error) {
    console.error('Altitude requirements calculation failed:', error);
    // Return conservative fallback
    return {
      min: 0,
      max: Math.max(30000, burstAltitude + 5000),
      intervals: [0, 1000, 5000, 10000, 15000, 20000, 25000, 30000],
      resolution: 5000,
      safetyMargin: 5000
    };
  }
}

/**
 * Generate flight phase-specific altitude requirements
 * @param launchAltitude Launch altitude
 * @param burstAltitude Burst altitude
 * @param flightDuration Estimated flight duration in minutes
 * @returns Phase-specific altitude requirements
 */
export function generateFlightPhaseAltitudes(
  launchAltitude: number,
  burstAltitude: number,
  flightDuration: number
): FlightPhaseAltitudes {
  // Calculate key altitude levels for ascent phase
  const ascentLevels = calculateAscentKeyLevels(launchAltitude, burstAltitude);
  
  // Calculate key altitude levels for descent phase
  const descentLevels = calculateDescentKeyLevels(burstAltitude, launchAltitude);

  return {
    ascent: {
      start: launchAltitude,
      end: burstAltitude,
      keyLevels: ascentLevels
    },
    descent: {
      start: burstAltitude,
      end: launchAltitude, // Assuming landing near launch site
      keyLevels: descentLevels
    }
  };
}

/**
 * Generate altitude intervals with appropriate spacing
 */
function generateAltitudeIntervals(
  minAltitude: number,
  maxAltitude: number,
  resolution: number
): number[] {
  const intervals: number[] = [];
  
  // Start from the lowest altitude
  let currentAltitude = Math.floor(minAltitude / resolution) * resolution;
  
  while (currentAltitude <= maxAltitude) {
    if (currentAltitude >= minAltitude) {
      intervals.push(currentAltitude);
    }
    currentAltitude += resolution;
  }
  
  // Ensure we include the exact launch and burst altitudes
  if (!intervals.includes(minAltitude)) {
    intervals.push(minAltitude);
  }
  if (!intervals.includes(maxAltitude)) {
    intervals.push(maxAltitude);
  }
  
  return intervals.sort((a, b) => a - b);
}

/**
 * Calculate key altitude levels during ascent phase
 */
function calculateAscentKeyLevels(launchAltitude: number, burstAltitude: number): number[] {
  const levels: number[] = [];
  const altitudeRange = burstAltitude - launchAltitude;
  
  // Add levels at regular intervals (every 20% of ascent)
  for (let i = 0; i <= 5; i++) {
    const level = launchAltitude + (altitudeRange * i / 5);
    levels.push(Math.round(level));
  }
  
  // Add critical atmospheric boundaries within ascent range
  const boundaries = [1000, 3000, 5000, 10000, 15000, 20000, 25000, 30000];
  for (const boundary of boundaries) {
    if (boundary > launchAltitude && boundary < burstAltitude) {
      levels.push(boundary);
    }
  }
  
  return Array.from(new Set(levels)).sort((a, b) => a - b);
}

/**
 * Calculate key altitude levels during descent phase
 */
function calculateDescentKeyLevels(burstAltitude: number, landingAltitude: number): number[] {
  const levels: number[] = [];
  const altitudeRange = burstAltitude - landingAltitude;
  
  // Add levels at regular intervals (every 20% of descent)
  for (let i = 0; i <= 5; i++) {
    const level = burstAltitude - (altitudeRange * i / 5);
    levels.push(Math.round(level));
  }
  
  // Add critical parachute deployment and landing zones
  const criticalLevels = [
    burstAltitude * 0.9,  // Just after burst
    burstAltitude * 0.7,  // Mid-descent
    burstAltitude * 0.5,  // Lower atmosphere
    Math.max(landingAltitude + 1000, 1000), // Low altitude
    landingAltitude + 100 // Near ground
  ];
  
  for (const level of criticalLevels) {
    if (level > landingAltitude && level <= burstAltitude) {
      levels.push(Math.round(level));
    }
  }
  
  return Array.from(new Set(levels)).sort((a, b) => b - a); // Descending order
}

/**
 * Get critical atmospheric layers that affect balloon flights
 */
function getCriticalAtmosphericLayers(minAltitude: number, maxAltitude: number): AtmosphericLayer[] {
  const allLayers: AtmosphericLayer[] = [
    {
      name: 'Surface Layer',
      bottom: 0,
      top: 100,
      characteristics: {
        temperatureLapse: -0.0065, // Standard atmosphere
        windBehavior: 'Surface friction effects',
        dataImportance: 'critical'
      }
    },
    {
      name: 'Planetary Boundary Layer',
      bottom: 100,
      top: 2000,
      characteristics: {
        temperatureLapse: -0.0098, // Higher lapse rate
        windBehavior: 'Turbulent mixing',
        dataImportance: 'critical'
      }
    },
    {
      name: 'Free Atmosphere',
      bottom: 2000,
      top: 10000,
      characteristics: {
        temperatureLapse: -0.0065, // Standard atmosphere
        windBehavior: 'Geostrophic winds',
        dataImportance: 'important'
      }
    },
    {
      name: 'Tropopause Region',
      bottom: 8000,
      top: 15000,
      characteristics: {
        temperatureLapse: 0.002, // Temperature inversion
        windBehavior: 'Jet stream influence',
        dataImportance: 'critical'
      }
    },
    {
      name: 'Lower Stratosphere',
      bottom: 12000,
      top: 25000,
      characteristics: {
        temperatureLapse: 0.001, // Slight warming
        windBehavior: 'Stratospheric winds',
        dataImportance: 'important'
      }
    },
    {
      name: 'Middle Stratosphere',
      bottom: 25000,
      top: 40000,
      characteristics: {
        temperatureLapse: 0.003, // Warming trend
        windBehavior: 'Weak winds',
        dataImportance: 'optional'
      }
    }
  ];
  
  // Filter layers that intersect with flight altitude range
  return allLayers.filter(layer => 
    layer.top >= minAltitude && layer.bottom <= maxAltitude
  );
}

/**
 * Add specific altitudes for atmospheric boundary layers
 */
function addBoundaryLayerAltitudes(
  existingIntervals: number[],
  boundaryLayers: AtmosphericLayer[]
): number[] {
  const enhancedIntervals = [...existingIntervals];
  
  for (const layer of boundaryLayers) {
    // Add bottom and top of each critical layer
    if (layer.characteristics.dataImportance === 'critical') {
      enhancedIntervals.push(layer.bottom, layer.top);
    }
    
    // Add middle of important layers
    if (layer.characteristics.dataImportance === 'important') {
      const middle = Math.round((layer.bottom + layer.top) / 2);
      enhancedIntervals.push(middle);
    }
  }
  
  // Remove duplicates and sort
  return Array.from(new Set(enhancedIntervals)).sort((a, b) => a - b);
}

/**
 * Optimize altitude intervals based on weather model resolution
 * @param intervals Current altitude intervals
 * @param modelResolution Weather model vertical resolution
 * @returns Optimized intervals
 */
export function optimizeForWeatherModel(
  intervals: number[],
  modelResolution: number = 1000
): number[] {
  // Snap intervals to model resolution boundaries when close
  const tolerance = modelResolution * 0.1; // 10% tolerance
  
  return intervals.map(interval => {
    const nearestModelLevel = Math.round(interval / modelResolution) * modelResolution;
    const difference = Math.abs(interval - nearestModelLevel);
    
    // Use model level if close enough
    if (difference <= tolerance) {
      return nearestModelLevel;
    }
    
    return interval;
  });
}

/**
 * Calculate minimum required altitude data based on flight profile
 * @param launchAltitude Launch altitude
 * @param burstAltitude Burst altitude
 * @param payloadWeight Payload weight (affects descent rate)
 * @returns Minimum altitude data requirements
 */
export function getMinimumAltitudeData(
  launchAltitude: number,
  burstAltitude: number,
  payloadWeight: number
): {
  essential: number[];    // Cannot perform prediction without these
  recommended: number[];  // Improves accuracy significantly
  optional: number[];     // Minor accuracy improvements
} {
  const essential = [
    launchAltitude,
    Math.round((launchAltitude + burstAltitude) / 2), // Mid-flight
    burstAltitude
  ];
  
  const recommended = [
    launchAltitude + 1000,  // Early ascent
    burstAltitude * 0.75,   // Late ascent
    burstAltitude * 0.25,   // Early descent
    launchAltitude + 500    // Late descent
  ];
  
  const optional = [
    launchAltitude + 500,   // Launch conditions
    burstAltitude + 1000,   // Above burst
    launchAltitude + 100    // Landing conditions
  ];
  
  return {
    essential: essential.filter(alt => alt >= 0),
    recommended: recommended.filter(alt => alt >= 0 && alt <= burstAltitude + 2000),
    optional: optional.filter(alt => alt >= 0)
  };
} 