// Prediction Orchestrator Tests
// Based on task-11g specifications

import { PredictionOrchestrator, executePrediction } from './predictionOrchestrator';
import { PredictionRequest, PredictionResult } from '../types/orchestrationTypes';

// Mock dependencies
jest.mock('../services/weatherService');
jest.mock('../services/weatherIntegration');
jest.mock('../services/weatherSelector');
jest.mock('./ascent');
jest.mock('./descent');
jest.mock('./windDrift');
jest.mock('./burstSite', () => ({
  predictBurstSite: jest.fn()
}));

describe('PredictionOrchestrator', () => {
  let orchestrator: PredictionOrchestrator;
  let mockRequest: PredictionRequest;

  beforeEach(() => {
    orchestrator = new PredictionOrchestrator();
    
    // Create mock request
    mockRequest = {
      launchLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 100
      },
      launchTime: {
        launchTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        timeZone: 'America/New_York'
      },
      balloonSpecs: {
        balloonType: 'Latex Meteorological',
        initialVolume: 1.0,
        burstAltitude: 30000,
        ascentRate: 5.0,
        payloadWeight: 1.0,
        dragCoefficient: 0.5
      },
      environmentalParams: {
        weatherSource: 'Open-Meteo (Recommended)',
        windModel: 'GFS (Global)',
        temperatureOffset: 0,
        humidityFactor: 50
      },
      options: {
        includeUncertainty: true,
        weatherResolution: 'medium',
        calculationPrecision: 'standard'
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should successfully validate valid input', async () => {
      const mockWeatherData: any[] = [];
      const mockAlgorithmResult = {
        trajectory: [],
        burstPoint: { latitude: 40.7, longitude: -74.0, altitude: 30000 },
        landingPoint: { latitude: 40.8, longitude: -74.1, altitude: 0 },
        confidence: 0.85,
        processingTime: 500
      };

      // Mock the dependencies to return valid data
      require('../services/weatherSelector').selectWeatherData.mockResolvedValue({
        weatherData: { surfaceData: mockWeatherData, altitudeData: [], interpolatedData: [] }
      });
      require('./ascent').calculateAscent.mockReturnValue({
        trajectory: [{ timestamp: '2023-01-01T12:00:00Z', latitude: 40.7128, longitude: -74.0060, altitude: 0 }],
        confidence: 0.9
      });
      require('./descent').calculateDescent.mockReturnValue({
        trajectory: [{ timestamp: '2023-01-01T14:00:00Z', latitude: 40.8, longitude: -74.1, altitude: 0 }],
        confidence: 0.8
      });
      require('./windDrift').calculateWindDrift.mockReturnValue({
        landingLocation: { latitude: 40.8, longitude: -74.1, altitude: 0 },
        confidence: 0.85
      });
      require('./burstSite').predictBurstSite.mockReturnValue({
        burstLatitude: 40.7,
        burstLongitude: -74.0,
        burstAltitude: 30000,
        confidence: 0.9
      });

      const result = await orchestrator.executePrediction(mockRequest);
      
      expect(result).toBeDefined();
      expect(result.trajectory).toBeDefined();
      expect(result.burstSite).toBeDefined();
      expect(result.landingSite).toBeDefined();
      expect(result.flightMetrics).toBeDefined();
      expect(result.weatherImpact).toBeDefined();
      expect(result.qualityAssessment).toBeDefined();
    });

    it('should reject invalid coordinates', async () => {
      const invalidRequest = {
        ...mockRequest,
        launchLocation: {
          latitude: 999, // Invalid latitude
          longitude: -74.0060,
          altitude: 100
        }
      };

      await expect(orchestrator.executePrediction(invalidRequest))
        .rejects.toThrow('Input validation failed');
    });

    it('should reject invalid launch time', async () => {
      const invalidRequest = {
        ...mockRequest,
        launchTime: {
          launchTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          timeZone: 'America/New_York'
        }
      };

      await expect(orchestrator.executePrediction(invalidRequest))
        .rejects.toThrow('Input validation failed');
    });

    it('should reject invalid balloon specifications', async () => {
      const invalidRequest = {
        ...mockRequest,
        balloonSpecs: {
          ...mockRequest.balloonSpecs,
          ascentRate: -1 // Invalid negative ascent rate
        }
      };

      await expect(orchestrator.executePrediction(invalidRequest))
        .rejects.toThrow('Input validation failed');
    });
  });

  describe('Weather Integration', () => {
    beforeEach(() => {
      // Mock successful validation
      require('../services/weatherSelector').selectWeatherData.mockResolvedValue({
        weatherData: [
          {
            timestamp: '2023-01-01T12:00:00Z',
            altitude: 0,
            windSpeed: 5,
            windDirection: 180,
            temperature: 15,
            pressure: 1013.25,
            humidity: 50,
            uncertainty: 0.1
          }
        ]
      });
    });

    it('should successfully integrate weather data', async () => {
      const mockAlgorithmResults = {
        trajectory: [{ timestamp: '2023-01-01T12:00:00Z', latitude: 40.7128, longitude: -74.0060, altitude: 0 }],
        burstPoint: { latitude: 40.7, longitude: -74.0, altitude: 30000 },
        landingPoint: { latitude: 40.8, longitude: -74.1, altitude: 0 },
        confidence: 0.85,
        processingTime: 500
      };

      require('./ascent').calculateAscent.mockReturnValue({
        trajectory: mockAlgorithmResults.trajectory,
        confidence: 0.9
      });
      require('./descent').calculateDescent.mockReturnValue({
        trajectory: [{ timestamp: '2023-01-01T14:00:00Z', latitude: 40.8, longitude: -74.1, altitude: 0 }],
        confidence: 0.8
      });
      require('./windDrift').calculateWindDrift.mockReturnValue({
        landingLocation: mockAlgorithmResults.landingPoint,
        confidence: 0.85
      });
      require('./burstSite').predictBurstSite.mockReturnValue({
        burstLatitude: mockAlgorithmResults.burstPoint.latitude,
        burstLongitude: mockAlgorithmResults.burstPoint.longitude,
        burstAltitude: mockAlgorithmResults.burstPoint.altitude,
        confidence: 0.9
      });

      const result = await orchestrator.executePrediction(mockRequest);
      
      expect(require('../services/weatherSelector').selectWeatherData).toHaveBeenCalled();
      expect(result.trajectory).toBeDefined();
      expect(result.weatherImpact).toBeDefined();
    });

    it('should handle weather service failures gracefully', async () => {
      require('../services/weatherSelector').selectWeatherData.mockRejectedValue(
        new Error('Weather service unavailable')
      );

      await expect(orchestrator.executePrediction(mockRequest))
        .rejects.toThrow('Failed to prepare weather data');
    });
  });

  describe('Algorithm Execution', () => {
    beforeEach(() => {
      require('../services/weatherSelector').selectWeatherData.mockResolvedValue({
        weatherData: [
          {
            timestamp: '2023-01-01T12:00:00Z',
            altitude: 0,
            windSpeed: 5,
            windDirection: 180,
            temperature: 15,
            pressure: 1013.25,
            humidity: 50,
            uncertainty: 0.1
          }
        ]
      });
    });

    it('should execute all prediction algorithms in sequence', async () => {
      const mockTrajectory = [
        { timestamp: '2023-01-01T12:00:00Z', latitude: 40.7128, longitude: -74.0060, altitude: 0 },
        { timestamp: '2023-01-01T13:00:00Z', latitude: 40.7200, longitude: -74.0100, altitude: 15000 },
        { timestamp: '2023-01-01T14:00:00Z', latitude: 40.8000, longitude: -74.1000, altitude: 0 }
      ];

      require('./ascent').calculateAscent.mockReturnValue({
        trajectory: mockTrajectory.slice(0, 2),
        confidence: 0.9
      });
      require('./descent').calculateDescent.mockReturnValue({
        trajectory: [mockTrajectory[2]],
        confidence: 0.8
      });
      require('./windDrift').calculateWindDrift.mockReturnValue({
        landingLocation: { latitude: 40.8, longitude: -74.1, altitude: 0 },
        confidence: 0.85
      });
      require('./burstSite').predictBurstSite.mockReturnValue({
        burstLatitude: 40.7200,
        burstLongitude: -74.0100,
        burstAltitude: 30000,
        confidence: 0.9
      });

      const result = await orchestrator.executePrediction(mockRequest);
      
      expect(require('./ascent').calculateAscent).toHaveBeenCalled();
      expect(require('./burstSite').predictBurstSite).toHaveBeenCalled();
      // Descent and wind drift are simplified in the current implementation
      
      expect(result.trajectory).toHaveLength(3);
      expect(result.burstSite.location.latitude).toBe(40.7200);
      expect(result.landingSite.location.latitude).toBe(40.8);
    });

    it('should handle algorithm failures with fallback', async () => {
      require('./ascent').calculateAscent.mockImplementation(() => {
        throw new Error('Ascent calculation failed');
      });

      // Should not throw but return fallback result
      const result = await orchestrator.executePrediction(mockRequest);
      
      expect(result).toBeDefined();
      expect(result.qualityAssessment.warnings.some(warning => 
        warning.toLowerCase().includes('fallback')
      )).toBe(true);
    });
  });

  describe('Performance Requirements', () => {
    beforeEach(() => {
      require('../services/weatherSelector').selectWeatherData.mockResolvedValue({
        weatherData: { surfaceData: [], altitudeData: [], interpolatedData: [] }
      });
      require('./ascent').calculateAscent.mockReturnValue({
        trajectory: [],
        confidence: 0.9
      });
      require('./burstSite').predictBurstSite.mockReturnValue({
        burstLatitude: 40.7,
        burstLongitude: -74.0,
        burstAltitude: 30000,
        confidence: 0.9
      });
    });

    it('should complete prediction in under 2 seconds', async () => {
      const startTime = Date.now();
      
      await orchestrator.executePrediction(mockRequest);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000);
    }, 10000);

    it('should track performance metrics', async () => {
      await orchestrator.executePrediction(mockRequest);
      
      const metrics = orchestrator.getMetrics();
      
      expect(metrics.totalTime).toBeGreaterThan(0);
      expect(metrics.validationTime).toBeGreaterThanOrEqual(0);
      expect(metrics.weatherTime).toBeGreaterThanOrEqual(0);
      expect(metrics.calculationTime).toBeGreaterThanOrEqual(0);
      expect(metrics.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      require('../services/weatherSelector').selectWeatherData.mockResolvedValue({
        weatherData: { surfaceData: [], altitudeData: [], interpolatedData: [] }
      });
      require('./ascent').calculateAscent.mockReturnValue({
        trajectory: [],
        confidence: 0.9
      });
      require('./burstSite').predictBurstSite.mockReturnValue({
        burstLatitude: 40.7,
        burstLongitude: -74.0,
        burstAltitude: 30000,
        confidence: 0.9
      });
    });

    it('should cache prediction results', async () => {
      // First call
      const result1 = await orchestrator.executePrediction(mockRequest);
      expect(result1).toBeDefined();
      
      // Second call should use cache
      const result2 = await orchestrator.executePrediction(mockRequest);
      expect(result2).toBeDefined();
      
      const metrics = orchestrator.getMetrics();
      expect(metrics.cacheHit).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle graceful degradation', async () => {
      require('../services/weatherSelector').selectWeatherData.mockRejectedValue(
        new Error('Weather service timeout')
      );

      // Should return fallback result instead of throwing
      const result = await orchestrator.executePrediction(mockRequest);
      
      expect(result).toBeDefined();
      expect(result.qualityAssessment.warnings.length).toBeGreaterThan(0);
      expect(result.qualityAssessment.predictionConfidence).toBeLessThan(0.8);
    });

    it('should provide user-friendly error messages', async () => {
      const invalidRequest = {
        ...mockRequest,
        launchLocation: {
          latitude: NaN,
          longitude: -74.0060,
          altitude: 100
        }
      };

      try {
        await orchestrator.executePrediction(invalidRequest);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('validation failed');
        expect(error.code).toBe('VALIDATION_FAILED');
      }
    });
  });

  describe('Status Tracking', () => {
    beforeEach(() => {
      require('../services/weatherSelector').selectWeatherData.mockResolvedValue({
        weatherData: { surfaceData: [], altitudeData: [], interpolatedData: [] }
      });
      require('./ascent').calculateAscent.mockReturnValue({
        trajectory: [],
        confidence: 0.9
      });
      require('./burstSite').predictBurstSite.mockReturnValue({
        burstLatitude: 40.7,
        burstLongitude: -74.0,
        burstAltitude: 30000,
        confidence: 0.9
      });
    });

    it('should track processing status', async () => {
      const predictionPromise = orchestrator.executePrediction(mockRequest);
      
      // Check status during execution
      const status = orchestrator.getStatus();
      expect(status.phase).toBeDefined();
      expect(status.progress).toBeGreaterThanOrEqual(0);
      expect(status.message).toBeDefined();
      
      await predictionPromise;
      
      // Check final status
      const finalStatus = orchestrator.getStatus();
      expect(finalStatus.phase).toBe('complete');
      expect(finalStatus.progress).toBe(1.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimal input', async () => {
      const minimalRequest: PredictionRequest = {
        launchLocation: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        launchTime: {
          launchTime: new Date(Date.now() + 3600000).toISOString(),
          timeZone: 'UTC'
        },
        balloonSpecs: {
          balloonType: 'Latex Meteorological',
          initialVolume: 1.0,
          burstAltitude: 30000,
          ascentRate: 5.0,
          payloadWeight: 1.0,
          dragCoefficient: 0.5
        },
        options: {
          includeUncertainty: false,
          weatherResolution: 'low',
          calculationPrecision: 'fast'
        }
      };

      require('../services/weatherSelector').selectWeatherData.mockResolvedValue({
        weatherData: { surfaceData: [], altitudeData: [], interpolatedData: [] }
      });
      require('./ascent').calculateAscent.mockReturnValue({
        trajectory: [],
        confidence: 0.9
      });
      require('./burstSite').predictBurstSite.mockReturnValue({
        burstLatitude: 40.7,
        burstLongitude: -74.0,
        burstAltitude: 30000,
        confidence: 0.9
      });

      const result = await orchestrator.executePrediction(minimalRequest);
      
      expect(result).toBeDefined();
      expect(result.burstSite.uncertainty).toBe(0);
      expect(result.landingSite.uncertainty).toBe(0);
    });

    it('should handle extreme weather conditions', async () => {
      require('../services/weatherSelector').selectWeatherData.mockResolvedValue({
        weatherData: [
          {
            timestamp: '2023-01-01T12:00:00Z',
            altitude: 0,
            windSpeed: 50, // Very high wind speed
            windDirection: 180,
            temperature: -40, // Very low temperature
            pressure: 800, // Low pressure
            humidity: 90,
            uncertainty: 0.8 // High uncertainty
          }
        ]
      });

      require('./ascent').calculateAscent.mockReturnValue({
        trajectory: [],
        confidence: 0.4 // Low confidence due to extreme conditions
      });
      require('./descent').calculateDescent.mockReturnValue({
        trajectory: [],
        confidence: 0.3
      });
      require('./windDrift').calculateWindDrift.mockReturnValue({
        landingLocation: { latitude: 40.8, longitude: -74.1, altitude: 0 },
        confidence: 0.2
      });
      require('./burstSite').predictBurstSite.mockReturnValue({
        burstLatitude: 40.7,
        burstLongitude: -74.0,
        burstAltitude: 30000,
        confidence: 0.3
      });

      const result = await orchestrator.executePrediction(mockRequest);
      
      expect(result).toBeDefined();
      expect(result.qualityAssessment.predictionConfidence).toBeLessThan(0.5);
      expect(result.qualityAssessment.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe('executePrediction function', () => {
  it('should export main execution function', async () => {
    const mockRequest: PredictionRequest = {
      launchLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        altitude: 100
      },
      launchTime: {
        launchTime: new Date(Date.now() + 3600000).toISOString(),
        timeZone: 'America/New_York'
      },
      balloonSpecs: {
        balloonType: 'Latex Meteorological',
        initialVolume: 1.0,
        burstAltitude: 30000,
        ascentRate: 5.0,
        payloadWeight: 1.0,
        dragCoefficient: 0.5
      },
      options: {
        includeUncertainty: true,
        weatherResolution: 'medium',
        calculationPrecision: 'standard'
      }
    };

    require('../services/weatherSelector').selectWeatherData.mockResolvedValue({
      weatherData: { surfaceData: [], altitudeData: [], interpolatedData: [] }
    });
    require('./ascent').calculateAscent.mockReturnValue({
      trajectory: [],
      confidence: 0.9
    });
    require('./burstSite').predictBurstSite.mockReturnValue({
      burstLatitude: 40.7,
      burstLongitude: -74.0,
      burstAltitude: 30000,
      confidence: 0.9
    });

    const result = await executePrediction(mockRequest);
    
    expect(result).toBeDefined();
    expect(typeof executePrediction).toBe('function');
  });
}); 