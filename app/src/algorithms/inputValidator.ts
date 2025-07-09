// Input Validation for Unified Prediction Engine
// Based on task-11g specifications

import { 
  PredictionRequest, 
  ValidationResult, 
  ValidationError, 
  Location, 
  LaunchSchedule, 
  BalloonConfiguration 
} from '../types/orchestrationTypes';
import { EnvironmentalParameters } from '../types/UserInputs';

/**
 * Validates all input parameters for prediction request
 */
export function validatePredictionInput(request: PredictionRequest): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Validate launch location
  const locationValidation = validateLocation(request.launchLocation);
  if (!locationValidation.isValid) {
    errors.push(...locationValidation.errors);
  }
  warnings.push(...locationValidation.warnings);

  // Validate launch schedule
  const scheduleValidation = validateLaunchSchedule(request.launchTime);
  if (!scheduleValidation.isValid) {
    errors.push(...scheduleValidation.errors);
  }
  warnings.push(...scheduleValidation.warnings);

  // Validate balloon specifications
  const balloonValidation = validateBalloonSpecs(request.balloonSpecs);
  if (!balloonValidation.isValid) {
    errors.push(...balloonValidation.errors);
  }
  warnings.push(...balloonValidation.warnings);

  // Validate environmental parameters (optional)
  if (request.environmentalParams) {
    const envValidation = validateEnvironmentalParams(request.environmentalParams);
    if (!envValidation.isValid) {
      errors.push(...envValidation.errors);
    }
    warnings.push(...envValidation.warnings);
  }

  // Validate options
  const optionsValidation = validateOptions(request.options);
  if (!optionsValidation.isValid) {
    errors.push(...optionsValidation.errors);
  }
  warnings.push(...optionsValidation.warnings);

  // Cross-validation checks
  const crossValidation = performCrossValidation(request);
  if (!crossValidation.isValid) {
    errors.push(...crossValidation.errors);
  }
  warnings.push(...crossValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates launch location coordinates and accessibility
 */
export function validateLocation(location: Location): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Validate latitude
  if (typeof location.latitude !== 'number' || isNaN(location.latitude)) {
    errors.push({
      field: 'launchLocation.latitude',
      message: 'Latitude must be a valid number',
      code: 'INVALID_LATITUDE_TYPE'
    });
  } else if (location.latitude < -90 || location.latitude > 90) {
    errors.push({
      field: 'launchLocation.latitude',
      message: 'Latitude must be between -90 and 90 degrees',
      code: 'LATITUDE_OUT_OF_RANGE'
    });
  }

  // Validate longitude
  if (typeof location.longitude !== 'number' || isNaN(location.longitude)) {
    errors.push({
      field: 'launchLocation.longitude',
      message: 'Longitude must be a valid number',
      code: 'INVALID_LONGITUDE_TYPE'
    });
  } else if (location.longitude < -180 || location.longitude > 180) {
    errors.push({
      field: 'launchLocation.longitude',
      message: 'Longitude must be between -180 and 180 degrees',
      code: 'LONGITUDE_OUT_OF_RANGE'
    });
  }

  // Validate altitude (optional)
  if (location.altitude !== undefined) {
    if (typeof location.altitude !== 'number' || isNaN(location.altitude)) {
      errors.push({
        field: 'launchLocation.altitude',
        message: 'Altitude must be a valid number',
        code: 'INVALID_ALTITUDE_TYPE'
      });
    } else if (location.altitude < -500 || location.altitude > 6000) {
      errors.push({
        field: 'launchLocation.altitude',
        message: 'Altitude must be between -500 and 6000 meters',
        code: 'ALTITUDE_OUT_OF_RANGE'
      });
    } else if (location.altitude > 3000) {
      warnings.push('High altitude launch location may affect weather data accuracy');
    }
  }

  // Check for problematic launch areas
  if (isOceanLocation(location)) {
    warnings.push('Ocean launch location may have limited weather data coverage');
  }

  if (isPolarLocation(location)) {
    warnings.push('Polar launch location may have limited weather model accuracy');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates launch schedule and timing
 */
export function validateLaunchSchedule(schedule: LaunchSchedule): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Validate launch time format
  if (!schedule.launchTime || typeof schedule.launchTime !== 'string') {
    errors.push({
      field: 'launchTime.launchTime',
      message: 'Launch time is required and must be a string',
      code: 'MISSING_LAUNCH_TIME'
    });
  } else {
    const launchDate = new Date(schedule.launchTime);
    if (isNaN(launchDate.getTime())) {
      errors.push({
        field: 'launchTime.launchTime',
        message: 'Launch time must be a valid ISO 8601 date string',
        code: 'INVALID_LAUNCH_TIME_FORMAT'
      });
    } else {
      const now = new Date();
      const timeDiff = launchDate.getTime() - now.getTime();
      
      // Check if launch time is in the past
      if (timeDiff < 0) {
        errors.push({
          field: 'launchTime.launchTime',
          message: 'Launch time cannot be in the past',
          code: 'LAUNCH_TIME_IN_PAST'
        });
      }
      
      // Check if launch time is too far in the future
      const maxFutureTime = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (timeDiff > maxFutureTime) {
        errors.push({
          field: 'launchTime.launchTime',
          message: 'Launch time cannot be more than 7 days in the future',
          code: 'LAUNCH_TIME_TOO_FAR'
        });
      }
      
      // Warning for very near-term launches
      if (timeDiff < 30 * 60 * 1000) { // 30 minutes
        warnings.push('Launch time is very soon - weather data may not be current');
      }
    }
  }

  // Validate time zone
  if (!schedule.timeZone || typeof schedule.timeZone !== 'string') {
    errors.push({
      field: 'launchTime.timeZone',
      message: 'Time zone is required and must be a string',
      code: 'MISSING_TIME_ZONE'
    });
  } else {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: schedule.timeZone });
    } catch (e) {
      errors.push({
        field: 'launchTime.timeZone',
        message: 'Invalid time zone identifier',
        code: 'INVALID_TIME_ZONE'
      });
    }
  }

  // Validate delay tolerance (optional)
  if (schedule.delayTolerance !== undefined) {
    if (typeof schedule.delayTolerance !== 'number' || isNaN(schedule.delayTolerance)) {
      errors.push({
        field: 'launchTime.delayTolerance',
        message: 'Delay tolerance must be a valid number',
        code: 'INVALID_DELAY_TOLERANCE'
      });
    } else if (schedule.delayTolerance < 0 || schedule.delayTolerance > 240) {
      errors.push({
        field: 'launchTime.delayTolerance',
        message: 'Delay tolerance must be between 0 and 240 minutes',
        code: 'DELAY_TOLERANCE_OUT_OF_RANGE'
      });
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates balloon specifications
 */
export function validateBalloonSpecs(specs: BalloonConfiguration): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Validate balloon type
  const validBalloonTypes = ['Latex Meteorological', 'HDPE', 'Custom'];
  if (!specs.balloonType || !validBalloonTypes.includes(specs.balloonType)) {
    errors.push({
      field: 'balloonSpecs.balloonType',
      message: `Balloon type must be one of: ${validBalloonTypes.join(', ')}`,
      code: 'INVALID_BALLOON_TYPE'
    });
  }

  // Validate initial volume
  if (typeof specs.initialVolume !== 'number' || isNaN(specs.initialVolume)) {
    errors.push({
      field: 'balloonSpecs.initialVolume',
      message: 'Initial volume must be a valid number',
      code: 'INVALID_INITIAL_VOLUME'
    });
  } else if (specs.initialVolume <= 0 || specs.initialVolume > 1000) {
    errors.push({
      field: 'balloonSpecs.initialVolume',
      message: 'Initial volume must be between 0 and 1000 cubic meters',
      code: 'INITIAL_VOLUME_OUT_OF_RANGE'
    });
  }

  // Validate burst altitude
  if (typeof specs.burstAltitude !== 'number' || isNaN(specs.burstAltitude)) {
    errors.push({
      field: 'balloonSpecs.burstAltitude',
      message: 'Burst altitude must be a valid number',
      code: 'INVALID_BURST_ALTITUDE'
    });
  } else if (specs.burstAltitude < 1000 || specs.burstAltitude > 60000) {
    errors.push({
      field: 'balloonSpecs.burstAltitude',
      message: 'Burst altitude must be between 1000 and 60000 meters',
      code: 'BURST_ALTITUDE_OUT_OF_RANGE'
    });
  }

  // Validate ascent rate
  if (typeof specs.ascentRate !== 'number' || isNaN(specs.ascentRate)) {
    errors.push({
      field: 'balloonSpecs.ascentRate',
      message: 'Ascent rate must be a valid number',
      code: 'INVALID_ASCENT_RATE'
    });
  } else if (specs.ascentRate <= 0 || specs.ascentRate > 10) {
    errors.push({
      field: 'balloonSpecs.ascentRate',
      message: 'Ascent rate must be between 0 and 10 meters per second',
      code: 'ASCENT_RATE_OUT_OF_RANGE'
    });
  }

  // Validate payload weight
  if (typeof specs.payloadWeight !== 'number' || isNaN(specs.payloadWeight)) {
    errors.push({
      field: 'balloonSpecs.payloadWeight',
      message: 'Payload weight must be a valid number',
      code: 'INVALID_PAYLOAD_WEIGHT'
    });
  } else if (specs.payloadWeight <= 0 || specs.payloadWeight > 50) {
    errors.push({
      field: 'balloonSpecs.payloadWeight',
      message: 'Payload weight must be between 0 and 50 kilograms',
      code: 'PAYLOAD_WEIGHT_OUT_OF_RANGE'
    });
  }

  // Validate drag coefficient
  if (typeof specs.dragCoefficient !== 'number' || isNaN(specs.dragCoefficient)) {
    errors.push({
      field: 'balloonSpecs.dragCoefficient',
      message: 'Drag coefficient must be a valid number',
      code: 'INVALID_DRAG_COEFFICIENT'
    });
  } else if (specs.dragCoefficient <= 0 || specs.dragCoefficient > 2.0) {
    errors.push({
      field: 'balloonSpecs.dragCoefficient',
      message: 'Drag coefficient must be between 0 and 2.0',
      code: 'DRAG_COEFFICIENT_OUT_OF_RANGE'
    });
  }

  // Physics validation warnings
  if (specs.burstAltitude && specs.ascentRate) {
    const ascentTime = specs.burstAltitude / specs.ascentRate / 60; // minutes
    if (ascentTime < 30) {
      warnings.push('Very fast ascent rate may result in less accurate predictions');
    }
    if (ascentTime > 240) {
      warnings.push('Very slow ascent rate may encounter changing weather conditions');
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates environmental parameters
 */
export function validateEnvironmentalParams(params: EnvironmentalParameters): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Validate weather source
  const validWeatherSources = ['Open-Meteo (Recommended)', 'NOAA GFS', 'Auto-select'];
  if (!params.weatherSource || !validWeatherSources.includes(params.weatherSource)) {
    errors.push({
      field: 'environmentalParams.weatherSource',
      message: `Weather source must be one of: ${validWeatherSources.join(', ')}`,
      code: 'INVALID_WEATHER_SOURCE'
    });
  }

  // Validate wind model
  const validWindModels = ['GFS (Global)', 'HRRR (CONUS only)', 'Auto'];
  if (!params.windModel || !validWindModels.includes(params.windModel)) {
    errors.push({
      field: 'environmentalParams.windModel',
      message: `Wind model must be one of: ${validWindModels.join(', ')}`,
      code: 'INVALID_WIND_MODEL'
    });
  }

  // Validate temperature offset
  if (typeof params.temperatureOffset !== 'number' || isNaN(params.temperatureOffset)) {
    errors.push({
      field: 'environmentalParams.temperatureOffset',
      message: 'Temperature offset must be a valid number',
      code: 'INVALID_TEMPERATURE_OFFSET'
    });
  } else if (params.temperatureOffset < -10 || params.temperatureOffset > 10) {
    errors.push({
      field: 'environmentalParams.temperatureOffset',
      message: 'Temperature offset must be between -10 and 10 degrees Celsius',
      code: 'TEMPERATURE_OFFSET_OUT_OF_RANGE'
    });
  }

  // Validate humidity factor
  if (typeof params.humidityFactor !== 'number' || isNaN(params.humidityFactor)) {
    errors.push({
      field: 'environmentalParams.humidityFactor',
      message: 'Humidity factor must be a valid number',
      code: 'INVALID_HUMIDITY_FACTOR'
    });
  } else if (params.humidityFactor < 0 || params.humidityFactor > 100) {
    errors.push({
      field: 'environmentalParams.humidityFactor',
      message: 'Humidity factor must be between 0 and 100 percent',
      code: 'HUMIDITY_FACTOR_OUT_OF_RANGE'
    });
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates prediction options
 */
export function validateOptions(options: PredictionRequest['options']): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Validate includeUncertainty
  if (typeof options.includeUncertainty !== 'boolean') {
    errors.push({
      field: 'options.includeUncertainty',
      message: 'Include uncertainty must be a boolean value',
      code: 'INVALID_INCLUDE_UNCERTAINTY'
    });
  }

  // Validate weather resolution
  const validWeatherResolutions = ['high', 'medium', 'low'];
  if (!options.weatherResolution || !validWeatherResolutions.includes(options.weatherResolution)) {
    errors.push({
      field: 'options.weatherResolution',
      message: `Weather resolution must be one of: ${validWeatherResolutions.join(', ')}`,
      code: 'INVALID_WEATHER_RESOLUTION'
    });
  }

  // Validate calculation precision
  const validPrecisions = ['fast', 'standard', 'precise'];
  if (!options.calculationPrecision || !validPrecisions.includes(options.calculationPrecision)) {
    errors.push({
      field: 'options.calculationPrecision',
      message: `Calculation precision must be one of: ${validPrecisions.join(', ')}`,
      code: 'INVALID_CALCULATION_PRECISION'
    });
  }

  // Performance warnings
  if (options.weatherResolution === 'high' && options.calculationPrecision === 'precise') {
    warnings.push('High resolution weather data with precise calculations may take longer to process');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Performs cross-validation checks between different input parameters
 */
export function performCrossValidation(request: PredictionRequest): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Check if HRRR model is selected outside CONUS
  if (request.environmentalParams?.windModel === 'HRRR (CONUS only)') {
    if (!isInCONUS(request.launchLocation)) {
      errors.push({
        field: 'environmentalParams.windModel',
        message: 'HRRR wind model is only available for CONUS (Continental United States)',
        code: 'HRRR_OUTSIDE_CONUS'
      });
    }
  }

  // Check balloon-payload ratio
  const balloonSpecs = request.balloonSpecs;
  if (balloonSpecs.initialVolume && balloonSpecs.payloadWeight) {
    const volumeToWeightRatio = balloonSpecs.initialVolume / balloonSpecs.payloadWeight;
    if (volumeToWeightRatio < 0.5) {
      warnings.push('Low balloon volume to payload weight ratio may result in poor ascent performance');
    }
  }

  // Check launch time vs weather resolution
  const launchTime = new Date(request.launchTime.launchTime);
  const now = new Date();
  const hoursUntilLaunch = (launchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilLaunch < 6 && request.options.weatherResolution === 'low') {
    warnings.push('Low weather resolution may not be optimal for near-term launches');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// Helper functions
function isOceanLocation(location: Location): boolean {
  // Simplified ocean detection - would need more sophisticated logic in production
  return Math.abs(location.latitude) < 60 && (location.altitude === undefined || location.altitude <= 0);
}

function isPolarLocation(location: Location): boolean {
  return Math.abs(location.latitude) > 70;
}

function isInCONUS(location: Location): boolean {
  // Simplified CONUS bounding box
  return location.latitude >= 24.7 && location.latitude <= 49.4 &&
         location.longitude >= -125.0 && location.longitude <= -66.9;
} 