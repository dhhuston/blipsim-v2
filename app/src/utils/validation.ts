// Validation functions for user inputs
// Based on task-2a specifications

import { 
  UserInputs, 
  LaunchLocation, 
  BalloonSpecifications, 
  EnvironmentalParameters, 
  PredictionParameters,
  VALIDATION_RULES 
} from '../types/UserInputs';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Geographic Validation
export function validateLaunchLocation(location: LaunchLocation): ValidationResult {
  const errors: ValidationError[] = [];

  // Latitude validation
  if (location.latitude < -90 || location.latitude > 90) {
    errors.push({
      field: 'latitude',
      message: 'Latitude must be between -90 and +90 degrees',
      value: location.latitude
    });
  }

  // Longitude validation
  if (location.longitude < -180 || location.longitude > 180) {
    errors.push({
      field: 'longitude',
      message: 'Longitude must be between -180 and +180 degrees',
      value: location.longitude
    });
  }

  // Altitude validation
  if (location.altitude < -500 || location.altitude > 6000) {
    errors.push({
      field: 'altitude',
      message: 'Launch altitude must be between -500m and 6000m',
      value: location.altitude
    });
  }

  // Launch time validation
  try {
    const launchDate = new Date(location.launchTime);
    const now = new Date();
    
    if (isNaN(launchDate.getTime())) {
      errors.push({
        field: 'launchTime',
        message: 'Launch time must be a valid ISO 8601 date/time',
        value: location.launchTime
      });
    } else if (launchDate <= now) {
      errors.push({
        field: 'launchTime',
        message: 'Launch time must be in the future',
        value: location.launchTime
      });
    }
  } catch (error) {
    errors.push({
      field: 'launchTime',
      message: 'Launch time format is invalid',
      value: location.launchTime
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Balloon Validation
export function validateBalloonSpecifications(specs: BalloonSpecifications): ValidationResult {
  const errors: ValidationError[] = [];

  // Balloon type validation
  const validTypes = ["Latex Meteorological", "HDPE", "Custom"];
  if (!validTypes.includes(specs.balloonType)) {
    errors.push({
      field: 'balloonType',
      message: `Balloon type must be one of: ${validTypes.join(', ')}`,
      value: specs.balloonType
    });
  }

  // Initial volume validation
  if (specs.initialVolume < 0.1 || specs.initialVolume > 1000) {
    errors.push({
      field: 'initialVolume',
      message: 'Initial volume must be between 0.1 and 1000 cubic meters',
      value: specs.initialVolume
    });
  }

  // Burst altitude validation
  if (specs.burstAltitude < 1000 || specs.burstAltitude > 60000) {
    errors.push({
      field: 'burstAltitude',
      message: 'Burst altitude must be between 1000m and 60000m',
      value: specs.burstAltitude
    });
  }

  // Ascent rate validation
  if (specs.ascentRate < 1 || specs.ascentRate > 10) {
    errors.push({
      field: 'ascentRate',
      message: 'Ascent rate must be between 1 and 10 m/s',
      value: specs.ascentRate
    });
  }

  // Payload weight validation
  if (specs.payloadWeight < 0.1 || specs.payloadWeight > 50) {
    errors.push({
      field: 'payloadWeight',
      message: 'Payload weight must be between 0.1 and 50 kg',
      value: specs.payloadWeight
    });
  }

  // Drag coefficient validation
  if (specs.dragCoefficient < 0.1 || specs.dragCoefficient > 2.0) {
    errors.push({
      field: 'dragCoefficient',
      message: 'Drag coefficient must be between 0.1 and 2.0',
      value: specs.dragCoefficient
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Environmental Validation
export function validateEnvironmentalParameters(params: EnvironmentalParameters): ValidationResult {
  const errors: ValidationError[] = [];

  // Weather source validation
  const validWeatherSources = ["Open-Meteo (Recommended)", "NOAA GFS", "Auto-select"];
  if (!validWeatherSources.includes(params.weatherSource)) {
    errors.push({
      field: 'weatherSource',
      message: `Weather source must be one of: ${validWeatherSources.join(', ')}`,
      value: params.weatherSource
    });
  }

  // Wind model validation
  const validWindModels = ["GFS (Global)", "HRRR (CONUS only)", "Auto"];
  if (!validWindModels.includes(params.windModel)) {
    errors.push({
      field: 'windModel',
      message: `Wind model must be one of: ${validWindModels.join(', ')}`,
      value: params.windModel
    });
  }

  // Temperature offset validation
  if (params.temperatureOffset < -10 || params.temperatureOffset > 10) {
    errors.push({
      field: 'temperatureOffset',
      message: 'Temperature offset must be between -10 and +10 degrees Celsius',
      value: params.temperatureOffset
    });
  }

  // Humidity factor validation
  if (params.humidityFactor < 0 || params.humidityFactor > 100) {
    errors.push({
      field: 'humidityFactor',
      message: 'Humidity factor must be between 0 and 100 percent',
      value: params.humidityFactor
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Prediction Parameters Validation
export function validatePredictionParameters(params: PredictionParameters): ValidationResult {
  const errors: ValidationError[] = [];

  // Max flight duration validation
  if (params.maxFlightDuration < 1 || params.maxFlightDuration > 168) {
    errors.push({
      field: 'maxFlightDuration',
      message: 'Max flight duration must be between 1 and 168 hours',
      value: params.maxFlightDuration
    });
  }

  // Time step validation
  if (params.timeStep < 1 || params.timeStep > 60) {
    errors.push({
      field: 'timeStep',
      message: 'Time step must be between 1 and 60 seconds',
      value: params.timeStep
    });
  }

  // Wind uncertainty validation
  if (params.windUncertainty < 0 || params.windUncertainty > 50) {
    errors.push({
      field: 'windUncertainty',
      message: 'Wind uncertainty must be between 0 and 50 percent',
      value: params.windUncertainty
    });
  }

  // Monte Carlo simulations validation
  if (params.monteCarloSimulations < 1 || params.monteCarloSimulations > 1000) {
    errors.push({
      field: 'monteCarloSimulations',
      message: 'Monte Carlo simulations must be between 1 and 1000',
      value: params.monteCarloSimulations
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Cross-field validation
export function validateCrossFieldConstraints(inputs: UserInputs): ValidationResult {
  const errors: ValidationError[] = [];

  // Burst altitude must be higher than launch altitude
  if (inputs.balloonSpecifications.burstAltitude <= inputs.launchLocation.altitude) {
    errors.push({
      field: 'burstAltitude',
      message: 'Burst altitude must be higher than launch altitude',
      value: inputs.balloonSpecifications.burstAltitude
    });
  }

  // Simulation duration should be reasonable for balloon type
  const maxDuration = inputs.predictionParameters.maxFlightDuration;
  const balloonType = inputs.balloonSpecifications.balloonType;
  
  if (balloonType === "Latex Meteorological" && maxDuration > 48) {
    errors.push({
      field: 'maxFlightDuration',
      message: 'Latex meteorological balloons typically have shorter flight durations',
      value: maxDuration
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Comprehensive validation
export function validateUserInputs(inputs: UserInputs): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate each section
  const locationValidation = validateLaunchLocation(inputs.launchLocation);
  const balloonValidation = validateBalloonSpecifications(inputs.balloonSpecifications);
  const environmentalValidation = validateEnvironmentalParameters(inputs.environmentalParameters);
  const predictionValidation = validatePredictionParameters(inputs.predictionParameters);
  const crossFieldValidation = validateCrossFieldConstraints(inputs);

  // Collect all errors
  errors.push(...locationValidation.errors);
  errors.push(...balloonValidation.errors);
  errors.push(...environmentalValidation.errors);
  errors.push(...predictionValidation.errors);
  errors.push(...crossFieldValidation.errors);

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Format validation errors for display
export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map(error => `${error.field}: ${error.message}`);
}

// Check if a specific field is valid
export function isFieldValid(fieldName: string, value: any, section: keyof UserInputs): boolean {
  const validation = validateUserInputs({
    launchLocation: { latitude: 0, longitude: 0, altitude: 0, launchTime: new Date().toISOString() },
    balloonSpecifications: {
      balloonType: "Latex Meteorological",
      initialVolume: 1.0,
      burstAltitude: 30000,
      ascentRate: 5.0,
      payloadWeight: 1.0,
      dragCoefficient: 0.5
    },
    environmentalParameters: {
      weatherSource: "Auto-select",
      windModel: "Auto",
      temperatureOffset: 0,
      humidityFactor: 50
    },
    predictionParameters: {
      maxFlightDuration: 24,
      timeStep: 10,
      windUncertainty: 10,
      monteCarloSimulations: 100
    }
  });

  // Create a test object with the field value
  const testInputs = { ...validation } as any;
  testInputs[section] = { ...testInputs[section], [fieldName]: value };

  const testValidation = validateUserInputs(testInputs);
  return testValidation.errors.filter(error => error.field === fieldName).length === 0;
} 