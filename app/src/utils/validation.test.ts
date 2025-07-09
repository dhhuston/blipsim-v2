// Unit tests for validation functions
// Based on task-2a specifications

import {
  validateLaunchLocation,
  validateBalloonSpecifications,
  validateEnvironmentalParameters,
  validatePredictionParameters,
  validateCrossFieldConstraints,
  validateUserInputs,
  formatValidationErrors,
  ValidationResult
} from './validation';
import {
  LaunchLocation,
  BalloonSpecifications,
  EnvironmentalParameters,
  PredictionParameters,
  UserInputs,
  DEFAULT_USER_INPUTS
} from '../types/UserInputs';

describe('Launch Location Validation', () => {
  test('should validate correct launch location', () => {
    const location: LaunchLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 0,
      launchTime: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };

    const result = validateLaunchLocation(location);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid latitude', () => {
    const location: LaunchLocation = {
      latitude: 100, // Invalid
      longitude: -74.0060,
      altitude: 0,
      launchTime: new Date(Date.now() + 3600000).toISOString()
    };

    const result = validateLaunchLocation(location);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('latitude');
  });

  test('should reject invalid longitude', () => {
    const location: LaunchLocation = {
      latitude: 40.7128,
      longitude: 200, // Invalid
      altitude: 0,
      launchTime: new Date(Date.now() + 3600000).toISOString()
    };

    const result = validateLaunchLocation(location);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('longitude');
  });

  test('should reject invalid altitude', () => {
    const location: LaunchLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 7000, // Invalid - too high
      launchTime: new Date(Date.now() + 3600000).toISOString()
    };

    const result = validateLaunchLocation(location);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('altitude');
  });

  test('should accept below sea level altitude', () => {
    const location: LaunchLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: -400, // Valid - Dead Sea area
      launchTime: new Date(Date.now() + 3600000).toISOString()
    };

    const result = validateLaunchLocation(location);
    expect(result.isValid).toBe(true);
  });

  test('should reject past launch time', () => {
    const location: LaunchLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 0,
      launchTime: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    };

    const result = validateLaunchLocation(location);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('launchTime');
  });

  test('should reject invalid date format', () => {
    const location: LaunchLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 0,
      launchTime: 'invalid-date'
    };

    const result = validateLaunchLocation(location);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('launchTime');
  });
});

describe('Balloon Specifications Validation', () => {
  test('should validate correct balloon specifications', () => {
    const specs: BalloonSpecifications = {
      balloonType: "Latex Meteorological",
      initialVolume: 1.0,
      burstAltitude: 30000,
      ascentRate: 5.0,
      payloadWeight: 1.0,
      dragCoefficient: 0.5
    };

    const result = validateBalloonSpecifications(specs);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid balloon type', () => {
    const specs: BalloonSpecifications = {
      balloonType: "Invalid Type",
      initialVolume: 1.0,
      burstAltitude: 30000,
      ascentRate: 5.0,
      payloadWeight: 1.0,
      dragCoefficient: 0.5
    };

    const result = validateBalloonSpecifications(specs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('balloonType');
  });

  test('should reject invalid initial volume', () => {
    const specs: BalloonSpecifications = {
      balloonType: "Latex Meteorological",
      initialVolume: 0.05, // Too small
      burstAltitude: 30000,
      ascentRate: 5.0,
      payloadWeight: 1.0,
      dragCoefficient: 0.5
    };

    const result = validateBalloonSpecifications(specs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('initialVolume');
  });

  test('should reject invalid burst altitude', () => {
    const specs: BalloonSpecifications = {
      balloonType: "Latex Meteorological",
      initialVolume: 1.0,
      burstAltitude: 500, // Too low
      ascentRate: 5.0,
      payloadWeight: 1.0,
      dragCoefficient: 0.5
    };

    const result = validateBalloonSpecifications(specs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('burstAltitude');
  });

  test('should reject invalid ascent rate', () => {
    const specs: BalloonSpecifications = {
      balloonType: "Latex Meteorological",
      initialVolume: 1.0,
      burstAltitude: 30000,
      ascentRate: 15.0, // Too high
      payloadWeight: 1.0,
      dragCoefficient: 0.5
    };

    const result = validateBalloonSpecifications(specs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('ascentRate');
  });

  test('should reject invalid payload weight', () => {
    const specs: BalloonSpecifications = {
      balloonType: "Latex Meteorological",
      initialVolume: 1.0,
      burstAltitude: 30000,
      ascentRate: 5.0,
      payloadWeight: 100.0, // Too heavy
      dragCoefficient: 0.5
    };

    const result = validateBalloonSpecifications(specs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('payloadWeight');
  });

  test('should reject invalid drag coefficient', () => {
    const specs: BalloonSpecifications = {
      balloonType: "Latex Meteorological",
      initialVolume: 1.0,
      burstAltitude: 30000,
      ascentRate: 5.0,
      payloadWeight: 1.0,
      dragCoefficient: 3.0 // Too high
    };

    const result = validateBalloonSpecifications(specs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('dragCoefficient');
  });
});

describe('Environmental Parameters Validation', () => {
  test('should validate correct environmental parameters', () => {
    const params: EnvironmentalParameters = {
      weatherSource: "Open-Meteo (Recommended)",
      windModel: "GFS (Global)",
      temperatureOffset: 0,
      humidityFactor: 50
    };

    const result = validateEnvironmentalParameters(params);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid weather source', () => {
    const params: EnvironmentalParameters = {
      weatherSource: "Invalid Source",
      windModel: "GFS (Global)",
      temperatureOffset: 0,
      humidityFactor: 50
    };

    const result = validateEnvironmentalParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('weatherSource');
  });

  test('should reject invalid wind model', () => {
    const params: EnvironmentalParameters = {
      weatherSource: "Open-Meteo (Recommended)",
      windModel: "Invalid Model",
      temperatureOffset: 0,
      humidityFactor: 50
    };

    const result = validateEnvironmentalParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('windModel');
  });

  test('should reject invalid temperature offset', () => {
    const params: EnvironmentalParameters = {
      weatherSource: "Open-Meteo (Recommended)",
      windModel: "GFS (Global)",
      temperatureOffset: 15, // Too high
      humidityFactor: 50
    };

    const result = validateEnvironmentalParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('temperatureOffset');
  });

  test('should reject invalid humidity factor', () => {
    const params: EnvironmentalParameters = {
      weatherSource: "Open-Meteo (Recommended)",
      windModel: "GFS (Global)",
      temperatureOffset: 0,
      humidityFactor: 150 // Too high
    };

    const result = validateEnvironmentalParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('humidityFactor');
  });
});

describe('Prediction Parameters Validation', () => {
  test('should validate correct prediction parameters', () => {
    const params: PredictionParameters = {
      maxFlightDuration: 24,
      timeStep: 10,
      windUncertainty: 10,
      monteCarloSimulations: 100
    };

    const result = validatePredictionParameters(params);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid max flight duration', () => {
    const params: PredictionParameters = {
      maxFlightDuration: 200, // Too long
      timeStep: 10,
      windUncertainty: 10,
      monteCarloSimulations: 100
    };

    const result = validatePredictionParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('maxFlightDuration');
  });

  test('should reject invalid time step', () => {
    const params: PredictionParameters = {
      maxFlightDuration: 24,
      timeStep: 100, // Too high
      windUncertainty: 10,
      monteCarloSimulations: 100
    };

    const result = validatePredictionParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('timeStep');
  });

  test('should reject invalid wind uncertainty', () => {
    const params: PredictionParameters = {
      maxFlightDuration: 24,
      timeStep: 10,
      windUncertainty: 60, // Too high
      monteCarloSimulations: 100
    };

    const result = validatePredictionParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('windUncertainty');
  });

  test('should reject invalid Monte Carlo simulations', () => {
    const params: PredictionParameters = {
      maxFlightDuration: 24,
      timeStep: 10,
      windUncertainty: 10,
      monteCarloSimulations: 2000 // Too high
    };

    const result = validatePredictionParameters(params);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('monteCarloSimulations');
  });
});

describe('Cross-Field Validation', () => {
  test('should validate correct cross-field constraints', () => {
    const inputs: UserInputs = {
      launchLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 0,
        launchTime: new Date(Date.now() + 3600000).toISOString()
      },
      balloonSpecifications: {
        balloonType: "Latex Meteorological",
        initialVolume: 1.0,
        burstAltitude: 30000,
        ascentRate: 5.0,
        payloadWeight: 1.0,
        dragCoefficient: 0.5
      },
      environmentalParameters: {
        weatherSource: "Open-Meteo (Recommended)",
        windModel: "GFS (Global)",
        temperatureOffset: 0,
        humidityFactor: 50
      },
      predictionParameters: {
        maxFlightDuration: 24,
        timeStep: 10,
        windUncertainty: 10,
        monteCarloSimulations: 100
      }
    };

    const result = validateCrossFieldConstraints(inputs);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject burst altitude lower than launch altitude', () => {
    const inputs: UserInputs = {
      launchLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 5000,
        launchTime: new Date(Date.now() + 3600000).toISOString()
      },
      balloonSpecifications: {
        balloonType: "Latex Meteorological",
        initialVolume: 1.0,
        burstAltitude: 3000, // Lower than launch altitude
        ascentRate: 5.0,
        payloadWeight: 1.0,
        dragCoefficient: 0.5
      },
      environmentalParameters: {
        weatherSource: "Open-Meteo (Recommended)",
        windModel: "GFS (Global)",
        temperatureOffset: 0,
        humidityFactor: 50
      },
      predictionParameters: {
        maxFlightDuration: 24,
        timeStep: 10,
        windUncertainty: 10,
        monteCarloSimulations: 100
      }
    };

    const result = validateCrossFieldConstraints(inputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('burstAltitude');
  });

  test('should warn about long flight duration for latex balloons', () => {
    const inputs: UserInputs = {
      launchLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 0,
        launchTime: new Date(Date.now() + 3600000).toISOString()
      },
      balloonSpecifications: {
        balloonType: "Latex Meteorological",
        initialVolume: 1.0,
        burstAltitude: 30000,
        ascentRate: 5.0,
        payloadWeight: 1.0,
        dragCoefficient: 0.5
      },
      environmentalParameters: {
        weatherSource: "Open-Meteo (Recommended)",
        windModel: "GFS (Global)",
        temperatureOffset: 0,
        humidityFactor: 50
      },
      predictionParameters: {
        maxFlightDuration: 72, // Too long for latex balloon
        timeStep: 10,
        windUncertainty: 10,
        monteCarloSimulations: 100
      }
    };

    const result = validateCrossFieldConstraints(inputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('maxFlightDuration');
  });
});

describe('Comprehensive Validation', () => {
  test('should validate correct user inputs', () => {
    const result = validateUserInputs(DEFAULT_USER_INPUTS);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should catch multiple validation errors', () => {
    const invalidInputs: UserInputs = {
      launchLocation: {
        latitude: 100, // Invalid
        longitude: 200, // Invalid
        altitude: 7000, // Invalid
        launchTime: new Date(Date.now() - 3600000).toISOString() // Past
      },
      balloonSpecifications: {
        balloonType: "Invalid Type",
        initialVolume: 0.05, // Too small
        burstAltitude: 500, // Too low
        ascentRate: 15.0, // Too high
        payloadWeight: 100.0, // Too heavy
        dragCoefficient: 3.0 // Too high
      },
      environmentalParameters: {
        weatherSource: "Invalid Source",
        windModel: "Invalid Model",
        temperatureOffset: 15, // Too high
        humidityFactor: 150 // Too high
      },
      predictionParameters: {
        maxFlightDuration: 200, // Too long
        timeStep: 100, // Too high
        windUncertainty: 60, // Too high
        monteCarloSimulations: 2000 // Too high
      }
    };

    const result = validateUserInputs(invalidInputs);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(10); // Multiple errors
  });
});

describe('Error Formatting', () => {
  test('should format validation errors correctly', () => {
    const errors = [
      { field: 'latitude', message: 'Latitude must be between -90 and +90 degrees', value: 100 },
      { field: 'longitude', message: 'Longitude must be between -180 and +180 degrees', value: 200 }
    ];

    const formatted = formatValidationErrors(errors);
    expect(formatted).toEqual([
      'latitude: Latitude must be between -90 and +90 degrees',
      'longitude: Longitude must be between -180 and +180 degrees'
    ]);
  });
}); 