// User Input Types and Validation for Balloon Trajectory Prediction
// Based on task-2a specifications

export interface LaunchLocation {
  latitude: number;      // Decimal degrees (-90 to +90)
  longitude: number;     // Decimal degrees (-180 to +180)
  altitude: number;      // Meters above sea level (-500 to 6000)
  launchTime: string;    // ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
}

export interface BalloonSpecifications {
  balloonType: string;   // "Latex Meteorological", "HDPE", "Custom"
  initialVolume: number; // Cubic meters (0.1 to 1000)
  burstAltitude: number; // Meters above sea level (1000 to 60000)
  ascentRate: number;    // Meters per second (1 to 10)
  payloadWeight: number; // Kilograms (0.1 to 50)
  dragCoefficient: number; // Dimensionless (0.1 to 2.0)
}

export interface EnvironmentalParameters {
  weatherSource: string; // "Open-Meteo (Recommended)", "NOAA GFS", "Auto-select"
  windModel: string;     // "GFS (Global)", "HRRR (CONUS only)", "Auto"
  temperatureOffset: number; // Celsius degrees (-10 to +10)
  humidityFactor: number;    // Percentage (0 to 100)
}

export interface PredictionParameters {
  maxFlightDuration: number; // Hours (1 to 168)
  timeStep: number;          // Seconds (1 to 60)
  windUncertainty: number;   // Percentage (0 to 50)
  monteCarloSimulations: number; // Count (1 to 1000)
}

export interface UserInputs {
  launchLocation: LaunchLocation;
  balloonSpecifications: BalloonSpecifications;
  environmentalParameters: EnvironmentalParameters;
  predictionParameters: PredictionParameters;
}

// Default Values
export const DEFAULT_LAUNCH_LOCATION: LaunchLocation = {
  latitude: 40.7128,    // New York City
  longitude: -74.0060,  // New York City
  altitude: 0,          // Sea level
  launchTime: new Date(Date.now() + 3600000).toISOString() // 1 hour in the future
};

export const DEFAULT_BALLOON_SPECIFICATIONS: BalloonSpecifications = {
  balloonType: "Latex Meteorological",
  initialVolume: 1.0,
  burstAltitude: 30000,
  ascentRate: 5.0,
  payloadWeight: 1.0,
  dragCoefficient: 0.5
};

export const DEFAULT_ENVIRONMENTAL_PARAMETERS: EnvironmentalParameters = {
  weatherSource: "Open-Meteo (Recommended)",
  windModel: "GFS (Global)",
  temperatureOffset: 0,
  humidityFactor: 50
};

export const DEFAULT_PREDICTION_PARAMETERS: PredictionParameters = {
  maxFlightDuration: 24,
  timeStep: 10,
  windUncertainty: 10,
  monteCarloSimulations: 100
};

export const DEFAULT_USER_INPUTS: UserInputs = {
  launchLocation: DEFAULT_LAUNCH_LOCATION,
  balloonSpecifications: DEFAULT_BALLOON_SPECIFICATIONS,
  environmentalParameters: DEFAULT_ENVIRONMENTAL_PARAMETERS,
  predictionParameters: DEFAULT_PREDICTION_PARAMETERS
};

// Preset Configurations
export const PRESET_CONFIGURATIONS = {
  standardMeteorological: {
    name: "Standard Meteorological Balloon",
    balloonSpecifications: {
      ...DEFAULT_BALLOON_SPECIFICATIONS,
      initialVolume: 1.0,
      burstAltitude: 30000,
      ascentRate: 5.0,
      payloadWeight: 1.0,
      dragCoefficient: 0.5
    }
  },
  highAltitudeResearch: {
    name: "High-Altitude Research Balloon",
    balloonSpecifications: {
      ...DEFAULT_BALLOON_SPECIFICATIONS,
      initialVolume: 10.0,
      burstAltitude: 45000,
      ascentRate: 3.0,
      payloadWeight: 5.0,
      dragCoefficient: 0.6
    }
  },
  educational: {
    name: "Educational Balloon",
    balloonSpecifications: {
      ...DEFAULT_BALLOON_SPECIFICATIONS,
      initialVolume: 0.5,
      burstAltitude: 20000,
      ascentRate: 4.0,
      payloadWeight: 0.5,
      dragCoefficient: 0.4
    }
  }
};

// Validation Rules
export const VALIDATION_RULES = {
  launchLocation: {
    latitude: { min: -90, max: 90, precision: 6 },
    longitude: { min: -180, max: 180, precision: 6 },
    altitude: { min: -500, max: 6000, precision: 0 },
    launchTime: { format: 'ISO8601', futureOnly: true }
  },
  balloonSpecifications: {
    balloonType: { options: ["Latex Meteorological", "HDPE", "Custom"] },
    initialVolume: { min: 0.1, max: 1000, precision: 2 },
    burstAltitude: { min: 1000, max: 60000, precision: 0 },
    ascentRate: { min: 1, max: 10, precision: 1 },
    payloadWeight: { min: 0.1, max: 50, precision: 2 },
    dragCoefficient: { min: 0.1, max: 2.0, precision: 2 }
  },
  environmentalParameters: {
    weatherSource: { options: ["Open-Meteo (Recommended)", "NOAA GFS", "Auto-select"] },
    windModel: { options: ["GFS (Global)", "HRRR (CONUS only)", "Auto"] },
    temperatureOffset: { min: -10, max: 10, precision: 1 },
    humidityFactor: { min: 0, max: 100, precision: 0 }
  },
  predictionParameters: {
    maxFlightDuration: { min: 1, max: 168, precision: 0 },
    timeStep: { min: 1, max: 60, precision: 0 },
    windUncertainty: { min: 0, max: 50, precision: 0 },
    monteCarloSimulations: { min: 1, max: 1000, precision: 0 }
  }
}; 