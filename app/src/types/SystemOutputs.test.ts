// Test suite for SystemOutputs types and utilities
// Based on task-2b specifications

import {
  Coordinates,
  ConfidenceInterval,
  LandingPrediction,
  ScenarioPrediction,
  TrajectoryPoint,
  Trajectory,
  Telemetry,
  FlightSummary,
  UncertaintyAnalysis,
  MonteCarloResults,
  WebSocketUpdate,
  CompletePredictionResponse,
  validateCoordinates,
  validateConfidenceInterval,
  validateTrajectoryPoint,
  formatCoordinateSystem,
  formatExportFormat,
  DEFAULT_COORDINATE_SYSTEM,
  DEFAULT_CONFIDENCE_LEVEL,
  COORDINATE_SYSTEMS,
  EXPORT_FORMATS,
  OUTPUT_VALIDATION_RULES
} from './SystemOutputs';

describe('SystemOutputs Types and Utilities', () => {
  
  describe('Coordinate Validation', () => {
    test('should validate correct coordinates', () => {
      const coords: Coordinates = {
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 0
      };
      expect(validateCoordinates(coords)).toBe(true);
    });

    test('should validate coordinates without altitude', () => {
      const coords: Coordinates = {
        latitude: 40.7128,
        longitude: -74.0060
      };
      expect(validateCoordinates(coords)).toBe(true);
    });

    test('should reject invalid latitude', () => {
      const coords: Coordinates = {
        latitude: 91,
        longitude: -74.0060
      };
      expect(validateCoordinates(coords)).toBe(false);
    });

    test('should reject invalid longitude', () => {
      const coords: Coordinates = {
        latitude: 40.7128,
        longitude: -181
      };
      expect(validateCoordinates(coords)).toBe(false);
    });

    test('should reject negative latitude', () => {
      const coords: Coordinates = {
        latitude: -91,
        longitude: -74.0060
      };
      expect(validateCoordinates(coords)).toBe(false);
    });
  });

  describe('Confidence Interval Validation', () => {
    test('should validate correct confidence interval', () => {
      const ci: ConfidenceInterval = {
        radius_km: 15.2,
        probability: 0.95
      };
      expect(validateConfidenceInterval(ci)).toBe(true);
    });

    test('should reject negative radius', () => {
      const ci: ConfidenceInterval = {
        radius_km: -1,
        probability: 0.95
      };
      expect(validateConfidenceInterval(ci)).toBe(false);
    });

    test('should reject probability > 1', () => {
      const ci: ConfidenceInterval = {
        radius_km: 15.2,
        probability: 1.1
      };
      expect(validateConfidenceInterval(ci)).toBe(false);
    });

    test('should reject probability < 0', () => {
      const ci: ConfidenceInterval = {
        radius_km: 15.2,
        probability: -0.1
      };
      expect(validateConfidenceInterval(ci)).toBe(false);
    });
  });

  describe('Trajectory Point Validation', () => {
    test('should validate correct trajectory point', () => {
      const point: TrajectoryPoint = {
        timestamp: '2024-01-15T06:00:00Z',
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 0,
        wind_speed: 5.2,
        wind_direction: 270,
        temperature: 15.5,
        pressure: 1013.25
      };
      expect(validateTrajectoryPoint(point)).toBe(true);
    });

    test('should validate trajectory point without optional fields', () => {
      const point: TrajectoryPoint = {
        timestamp: '2024-01-15T06:00:00Z',
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 0
      };
      expect(validateTrajectoryPoint(point)).toBe(true);
    });

    test('should reject trajectory point with invalid altitude', () => {
      const point: TrajectoryPoint = {
        timestamp: '2024-01-15T06:00:00Z',
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: -2000
      };
      expect(validateTrajectoryPoint(point)).toBe(false);
    });

    test('should reject trajectory point with invalid coordinates', () => {
      const point: TrajectoryPoint = {
        timestamp: '2024-01-15T06:00:00Z',
        latitude: 91,
        longitude: -74.0060,
        altitude: 0
      };
      expect(validateTrajectoryPoint(point)).toBe(false);
    });
  });

  describe('Landing Prediction Structure', () => {
    test('should create valid landing prediction', () => {
      const prediction: LandingPrediction = {
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: 0
        },
        confidence_interval: {
          radius_km: 15.2,
          probability: 0.95
        },
        estimated_landing_time: '2024-01-15T18:30:00Z',
        flight_duration_hours: 12.5,
        total_distance_km: 245.3
      };

      expect(prediction.coordinates.latitude).toBe(40.7128);
      expect(prediction.confidence_interval.probability).toBe(0.95);
      expect(prediction.flight_duration_hours).toBe(12.5);
    });
  });

  describe('Trajectory Structure', () => {
    test('should create valid trajectory', () => {
      const trajectory: Trajectory = {
        points: [
          {
            timestamp: '2024-01-15T06:00:00Z',
            latitude: 40.7128,
            longitude: -74.0060,
            altitude: 0,
            wind_speed: 5.2,
            wind_direction: 270,
            temperature: 15.5,
            pressure: 1013.25
          },
          {
            timestamp: '2024-01-15T06:00:10Z',
            latitude: 40.7129,
            longitude: -74.0061,
            altitude: 50,
            wind_speed: 6.1,
            wind_direction: 275,
            temperature: 14.8,
            pressure: 1012.80
          }
        ],
        metadata: {
          total_points: 2,
          time_step_seconds: 10,
          coordinate_system: 'WGS84'
        }
      };

      expect(trajectory.points).toHaveLength(2);
      expect(trajectory.metadata.coordinate_system).toBe('WGS84');
      expect(trajectory.metadata.time_step_seconds).toBe(10);
    });
  });

  describe('Telemetry Structure', () => {
    test('should create valid telemetry', () => {
      const telemetry: Telemetry = {
        current_position: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: 5000,
          timestamp: '2024-01-15T07:30:00Z'
        },
        flight_metrics: {
          current_speed: 5.2,
          ascent_rate: 4.8,
          distance_traveled: 12.5,
          time_in_flight: 5400
        },
        environmental_data: {
          temperature: -15.2,
          pressure: 540.25,
          wind_speed: 8.5,
          wind_direction: 280
        }
      };

      expect(telemetry.current_position.altitude).toBe(5000);
      expect(telemetry.flight_metrics.current_speed).toBe(5.2);
      expect(telemetry.environmental_data.temperature).toBe(-15.2);
    });
  });

  describe('Flight Summary Structure', () => {
    test('should create valid flight summary', () => {
      const summary: FlightSummary = {
        launch_time: '2024-01-15T06:00:00Z',
        burst_time: '2024-01-15T08:45:00Z',
        landing_time: '2024-01-15T18:30:00Z',
        max_altitude: 30000,
        total_distance: 245.3,
        flight_duration: 45000,
        average_speed: 5.4
      };

      expect(summary.max_altitude).toBe(30000);
      expect(summary.total_distance).toBe(245.3);
      expect(summary.flight_duration).toBe(45000);
    });
  });

  describe('Uncertainty Analysis Structure', () => {
    test('should create valid uncertainty analysis', () => {
      const uncertainty: UncertaintyAnalysis = {
        landing_zone: {
          radius_km: 15.2,
          confidence_level: 0.95,
          factors: {
            wind_uncertainty: 0.6,
            model_uncertainty: 0.3,
            data_quality: 0.1
          }
        },
        time_uncertainty: {
          hours: 2.5,
          confidence_level: 0.95
        },
        altitude_uncertainty: {
          meters: 500,
          confidence_level: 0.95
        }
      };

      expect(uncertainty.landing_zone.radius_km).toBe(15.2);
      expect(uncertainty.time_uncertainty.hours).toBe(2.5);
      expect(uncertainty.altitude_uncertainty.meters).toBe(500);
    });
  });

  describe('Monte Carlo Results Structure', () => {
    test('should create valid Monte Carlo results', () => {
      const monteCarlo: MonteCarloResults = {
        simulations: 1000,
        landing_distribution: {
          mean_latitude: 40.7128,
          mean_longitude: -74.0060,
          std_deviation_km: 8.5,
          percentiles: {
            "10": { latitude: 40.6500, longitude: -74.0500 },
            "50": { latitude: 40.7128, longitude: -74.0060 },
            "90": { latitude: 40.7750, longitude: -73.9620 }
          }
        }
      };

      expect(monteCarlo.simulations).toBe(1000);
      expect(monteCarlo.landing_distribution.mean_latitude).toBe(40.7128);
      expect(monteCarlo.landing_distribution.std_deviation_km).toBe(8.5);
    });
  });

  describe('WebSocket Update Structure', () => {
    test('should create valid WebSocket update', () => {
      const update: WebSocketUpdate = {
        type: 'position_update',
        timestamp: '2024-01-15T07:30:00Z',
        data: {
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: 5000,
          speed: 5.2,
          heading: 280
        }
      };

      expect(update.type).toBe('position_update');
      expect(update.data.altitude).toBe(5000);
      expect(update.data.speed).toBe(5.2);
    });
  });

  describe('Complete Prediction Response Structure', () => {
    test('should create valid complete prediction response', () => {
      const response: CompletePredictionResponse = {
        status: 'success',
        prediction_id: 'pred_12345',
        data: {
          landing_prediction: {
            coordinates: {
              latitude: 40.7128,
              longitude: -74.0060,
              altitude: 0
            },
            confidence_interval: {
              radius_km: 15.2,
              probability: 0.95
            },
            estimated_landing_time: '2024-01-15T18:30:00Z',
            flight_duration_hours: 12.5,
            total_distance_km: 245.3
          },
          trajectory: {
            points: [],
            metadata: {
              total_points: 0,
              time_step_seconds: 10,
              coordinate_system: 'WGS84'
            }
          },
          uncertainty: {
            landing_zone: {
              radius_km: 15.2,
              confidence_level: 0.95,
              factors: {
                wind_uncertainty: 0.6,
                model_uncertainty: 0.3,
                data_quality: 0.1
              }
            },
            time_uncertainty: {
              hours: 2.5,
              confidence_level: 0.95
            },
            altitude_uncertainty: {
              meters: 500,
              confidence_level: 0.95
            }
          }
        },
        metadata: {
          generated_at: '2024-01-15T06:00:00Z',
          weather_source: 'Open-Meteo',
          model_version: '2.0.0'
        }
      };

      expect(response.status).toBe('success');
      expect(response.prediction_id).toBe('pred_12345');
      expect(response.metadata.weather_source).toBe('Open-Meteo');
    });
  });

  describe('Constants and Defaults', () => {
    test('should have correct default values', () => {
      expect(DEFAULT_COORDINATE_SYSTEM).toBe('WGS84');
      expect(DEFAULT_CONFIDENCE_LEVEL).toBe(0.95);
    });

    test('should have correct coordinate systems', () => {
      expect(COORDINATE_SYSTEMS.WGS84).toBe('World Geodetic System 1984');
      expect(COORDINATE_SYSTEMS.UTM).toBe('Universal Transverse Mercator');
      expect(COORDINATE_SYSTEMS.MGRS).toBe('Military Grid Reference System');
    });

    test('should have correct export formats', () => {
      expect(EXPORT_FORMATS.KML).toBe('Google Earth');
      expect(EXPORT_FORMATS.GPX).toBe('GPS Exchange');
      expect(EXPORT_FORMATS.CSV).toBe('Comma Separated Values');
      expect(EXPORT_FORMATS.JSON).toBe('JavaScript Object Notation');
    });
  });

  describe('Utility Functions', () => {
    test('should format coordinate system correctly', () => {
      expect(formatCoordinateSystem('WGS84')).toBe('World Geodetic System 1984');
      expect(formatCoordinateSystem('UTM')).toBe('Universal Transverse Mercator');
      expect(formatCoordinateSystem('UNKNOWN')).toBe('UNKNOWN');
    });

    test('should format export format correctly', () => {
      expect(formatExportFormat('KML')).toBe('Google Earth');
      expect(formatExportFormat('GPX')).toBe('GPS Exchange');
      expect(formatExportFormat('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('Validation Rules', () => {
    test('should have correct coordinate validation rules', () => {
      expect(OUTPUT_VALIDATION_RULES.coordinates.latitude.min).toBe(-90);
      expect(OUTPUT_VALIDATION_RULES.coordinates.latitude.max).toBe(90);
      expect(OUTPUT_VALIDATION_RULES.coordinates.longitude.min).toBe(-180);
      expect(OUTPUT_VALIDATION_RULES.coordinates.longitude.max).toBe(180);
    });

    test('should have correct confidence interval validation rules', () => {
      expect(OUTPUT_VALIDATION_RULES.confidence_interval.radius_km.min).toBe(0);
      expect(OUTPUT_VALIDATION_RULES.confidence_interval.radius_km.max).toBe(1000);
      expect(OUTPUT_VALIDATION_RULES.confidence_interval.probability.min).toBe(0);
      expect(OUTPUT_VALIDATION_RULES.confidence_interval.probability.max).toBe(1);
    });

    test('should have correct trajectory point validation rules', () => {
      expect(OUTPUT_VALIDATION_RULES.trajectory_point.wind_speed.min).toBe(0);
      expect(OUTPUT_VALIDATION_RULES.trajectory_point.wind_speed.max).toBe(200);
      expect(OUTPUT_VALIDATION_RULES.trajectory_point.wind_direction.min).toBe(0);
      expect(OUTPUT_VALIDATION_RULES.trajectory_point.wind_direction.max).toBe(360);
    });
  });
}); 