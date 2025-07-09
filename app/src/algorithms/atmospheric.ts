// Atmospheric density calculations for balloon trajectory prediction
// Based on NASA standard atmosphere model

/**
 * Calculate atmospheric density at given altitude using NASA standard atmosphere model
 * @param altitude Altitude in meters
 * @returns Atmospheric density in kg/m³
 */
export function calculateAtmosphericDensity(altitude: number): number {
  if (altitude < 0) {
    throw new Error('Altitude cannot be negative');
  }

  // NASA standard atmosphere model (simplified)
  // Density decreases exponentially with altitude
  const seaLevelDensity = 1.225; // kg/m³
  const scaleHeight = 7400; // meters
  
  return seaLevelDensity * Math.exp(-altitude / scaleHeight);
}

/**
 * Calculate atmospheric pressure at given altitude
 * @param altitude Altitude in meters
 * @returns Atmospheric pressure in Pa
 */
export function calculateAtmosphericPressure(altitude: number): number {
  if (altitude < 0) {
    throw new Error('Altitude cannot be negative');
  }

  // NASA standard atmosphere model (simplified)
  const seaLevelPressure = 101325; // Pa
  const scaleHeight = 7400; // meters
  
  return seaLevelPressure * Math.exp(-altitude / scaleHeight);
}

/**
 * Calculate temperature at given altitude
 * @param altitude Altitude in meters
 * @returns Temperature in Kelvin
 */
export function calculateTemperature(altitude: number): number {
  if (altitude < 0) {
    throw new Error('Altitude cannot be negative');
  }

  // NASA standard atmosphere model (simplified)
  const seaLevelTemperature = 288.15; // K (15°C)
  const lapseRate = -0.0065; // K/m
  
  return seaLevelTemperature + lapseRate * altitude;
}

/**
 * Get atmospheric conditions at given altitude
 * @param altitude Altitude in meters
 * @returns Object containing density, pressure, and temperature
 */
export function getAtmosphericConditions(altitude: number) {
  return {
    density: calculateAtmosphericDensity(altitude),
    pressure: calculateAtmosphericPressure(altitude),
    temperature: calculateTemperature(altitude)
  };
}

/**
 * Validate atmospheric input parameters
 * @param altitude Altitude to validate
 * @returns True if valid, false otherwise
 */
export function validateAtmosphericInput(altitude: number): boolean {
  return altitude >= 0 && altitude <= 100000; // Reasonable altitude range
} 