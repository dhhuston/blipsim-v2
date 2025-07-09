// Tests for terrain integration with prediction engine
// Based on task-30d specifications

import {
  TerrainEnhancedPredictionEngine,
  createTerrainEnhancedPredictionEngine,
  createDefaultTerrainConfig,
  prepareTerrainPredictionInput
} from './terrainEnhancedPrediction';

import {
  TerrainPredictionInput,
  TerrainConfig
} from '../types/terrainPrediction';

import { AscentInput } from './ascent';
import { DescentInput } from './descent';
import { WindDriftInput } from './windDrift';

describe('Terrain Enhanced Prediction Engine', () => {
  let engine: TerrainEnhancedPredictionEngine;
  let mockTerrainConfig: TerrainConfig;
  let mockAscentInput: AscentInput;
  let mockDescentInput: DescentInput;
  let mockWindDriftInput: WindDriftInput;
  let mockTerrainPredictionInput: TerrainPredictionInput;

  beforeEach(() => {
    engine = createTerrainEnhancedPredictionEngine();
    
    mockTerrainConfig = {
      enableTerrainAnalysis: true,
      terrainResolution: 10,
      analysisRadius: 5,
      obstacleAvoidance: true,
      landingSiteFiltering: true,
      burstHeightAdjustment: true,
      maxTerrainObstacleHeight: 300,
      minLandingSiteDistance: 1
    };

    mockAscentInput = {
      balloonVolume: 1200,
      payloadWeight: 2.0,
      launchAltitude: 100,
      burstAltitude: 30000,
      ascentRate: 5.0,
      atmosphericDensity: 1.225,
      windSpeed: 10,
      windDirection: 90
    };

    mockDescentInput = {
      burstLatitude: 40.7128,
      burstLongitude: -74.0060,
      burstAltitude: 30000,
      payloadWeight: 2.0,
      parachuteArea: 2.0,
      dragCoefficient: 1.2,
      windSpeed: 10,
      windDirection: 90,
      landingAltitude: 0
    };

    mockWindDriftInput = {
      startLatitude: 40.7128,
      startLongitude: -74.0060,
      windSpeed: 10,
      windDirection: 90,
      duration: 3600,
      altitude: 1000
    };

    mockTerrainPredictionInput = {
      ascent: mockAscentInput,
      launchLocation: { lat: 40.7128, lng: -74.0060, alt: 100 },
      launchTime: '2024-01-15T12:00:00Z',
      terrainConfig: mockTerrainConfig
    };
  });

  describe('Engine Creation and Configuration', () => {
    test('should create terrain enhanced prediction engine', () => {
      expect(engine).toBeInstanceOf(TerrainEnhancedPredictionEngine);
    });

    test('should create default terrain configuration', () => {
      const defaultConfig = createDefaultTerrainConfig();
      expect(defaultConfig.enableTerrainAnalysis).toBe(true);
      expect(defaultConfig.terrainResolution).toBe(10);
      expect(defaultConfig.analysisRadius).toBe(5);
      expect(defaultConfig.maxTerrainObstacleHeight).toBe(300);
    });

    test('should prepare terrain prediction input', () => {
      const basePredictionInput = {
        ascent: mockAscentInput,
        launchLocation: { lat: 40.7128, lng: -74.0060, alt: 100 },
        launchTime: '2024-01-15T12:00:00Z'
      };

      const terrainInput = prepareTerrainPredictionInput(basePredictionInput, mockTerrainConfig);
      
      expect(terrainInput.terrainConfig).toEqual(mockTerrainConfig);
      expect(terrainInput.ascent).toEqual(mockAscentInput);
    });
  });

  describe('Terrain Configuration Validation', () => {
    test('should validate correct terrain configuration', () => {
      const validation = engine.validateTerrainConfig(mockTerrainConfig);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject invalid terrain resolution', () => {
      const invalidConfig = { ...mockTerrainConfig, terrainResolution: -1 };
      const validation = engine.validateTerrainConfig(invalidConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Terrain resolution must be positive');
    });

    test('should reject invalid analysis radius', () => {
      const invalidConfig = { ...mockTerrainConfig, analysisRadius: 0 };
      const validation = engine.validateTerrainConfig(invalidConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Analysis radius must be positive');
    });

    test('should reject negative obstacle height', () => {
      const invalidConfig = { ...mockTerrainConfig, maxTerrainObstacleHeight: -100 };
      const validation = engine.validateTerrainConfig(invalidConfig);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Max terrain obstacle height cannot be negative');
    });
  });

  describe('Terrain-Enhanced Prediction Calculation', () => {
    test('should calculate terrain-enhanced prediction successfully', async () => {
      const result = await engine.calculateTerrainEnhancedPrediction(mockTerrainPredictionInput);
      
      expect(result).toHaveProperty('terrain');
      expect(result).toHaveProperty('adjustedPredictions');
      expect(result).toHaveProperty('landingSiteRecommendations');
      expect(result).toHaveProperty('terrainWarnings');
      
      expect(result.terrain.terrainComplexity).toHaveProperty('overall');
      expect(result.terrain.elevationStats).toHaveProperty('minElevation');
      expect(Array.isArray(result.landingSiteRecommendations)).toBe(true);
      expect(Array.isArray(result.terrainWarnings)).toBe(true);
    });

    test('should fallback to basic prediction on terrain analysis failure', async () => {
      // Create invalid config to trigger fallback
      const invalidInput = {
        ...mockTerrainPredictionInput,
        terrainConfig: { ...mockTerrainConfig, terrainResolution: -1 }
      };

      const result = await engine.calculateTerrainEnhancedPrediction(invalidInput);
      
      // Should still return a result structure
      expect(result).toHaveProperty('terrain');
      expect(result).toHaveProperty('adjustedPredictions');
    });

    test('should handle missing elevation data gracefully', async () => {
      const result = await engine.calculateTerrainEnhancedPrediction(mockTerrainPredictionInput);
      
      // Should complete without throwing errors
      expect(result.terrain.elevationStats.minElevation).toBeGreaterThanOrEqual(0);
      expect(result.terrain.elevationStats.maxElevation).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Terrain-Adjusted Ascent Calculation', () => {
    test('should calculate terrain-adjusted ascent', async () => {
      const result = await engine.calculateTerrainAdjustedAscent(mockAscentInput, mockTerrainConfig);
      
      expect(result).toHaveProperty('trajectory');
      expect(result).toHaveProperty('burstPoint');
      expect(result).toHaveProperty('ascentDuration');
      expect(result.ascentDuration).toBeGreaterThan(0);
    });

    test('should use standard ascent when terrain analysis disabled', async () => {
      const disabledConfig = { ...mockTerrainConfig, enableTerrainAnalysis: false };
      const result = await engine.calculateTerrainAdjustedAscent(mockAscentInput, disabledConfig);
      
      expect(result).toHaveProperty('trajectory');
      expect(result.ascentDuration).toBeGreaterThan(0);
    });

    test('should adjust burst altitude for terrain obstacles', async () => {
      const highTerrainConfig = {
        ...mockTerrainConfig,
        burstHeightAdjustment: true,
        maxTerrainObstacleHeight: 1000
      };

      const result = await engine.calculateTerrainAdjustedAscent(mockAscentInput, highTerrainConfig);
      
      // Should complete successfully even with high terrain obstacles
      expect(result.burstPoint.alt).toBeGreaterThan(0);
    });
  });

  describe('Terrain-Adjusted Descent Calculation', () => {
    test('should calculate terrain-adjusted descent', async () => {
      const result = await engine.calculateTerrainAdjustedDescent(mockDescentInput, mockTerrainConfig);
      
      expect(result).toHaveProperty('trajectory');
      expect(result).toHaveProperty('landingPoint');
      expect(result).toHaveProperty('descentDuration');
      expect(result.descentDuration).toBeGreaterThan(0);
    });

    test('should use standard descent when terrain analysis disabled', async () => {
      const disabledConfig = { ...mockTerrainConfig, enableTerrainAnalysis: false };
      const result = await engine.calculateTerrainAdjustedDescent(mockDescentInput, disabledConfig);
      
      expect(result.descentDuration).toBeGreaterThan(0);
    });

    test('should adjust landing altitude for terrain features', async () => {
      const result = await engine.calculateTerrainAdjustedDescent(mockDescentInput, mockTerrainConfig);
      
      expect(result.landingPoint.lat).toBeCloseTo(mockDescentInput.burstLatitude, 1);
      expect(result.landingPoint.lng).toBeCloseTo(mockDescentInput.burstLongitude, 1);
    });
  });

  describe('Terrain-Adjusted Wind Drift Calculation', () => {
    test('should calculate terrain-adjusted wind drift', async () => {
      const result = await engine.calculateTerrainAdjustedWindDrift(mockWindDriftInput, mockTerrainConfig);
      
      expect(result).toHaveProperty('endLatitude');
      expect(result).toHaveProperty('endLongitude');
      expect(result).toHaveProperty('totalDistance');
      expect(result.totalDistance).toBeGreaterThanOrEqual(0);
    });

    test('should use standard wind drift when obstacle avoidance disabled', async () => {
      const noObstacleConfig = { ...mockTerrainConfig, obstacleAvoidance: false };
      const result = await engine.calculateTerrainAdjustedWindDrift(mockWindDriftInput, noObstacleConfig);
      
      expect(result.totalDistance).toBeGreaterThanOrEqual(0);
    });

    test('should modify wind patterns for terrain effects', async () => {
      const result = await engine.calculateTerrainAdjustedWindDrift(mockWindDriftInput, mockTerrainConfig);
      
      // Wind drift should be affected by terrain
      expect(result.endLatitude).not.toBe(mockWindDriftInput.startLatitude);
      expect(result.endLongitude).not.toBe(mockWindDriftInput.startLongitude);
    });
  });

  describe('Landing Site Terrain Filtering', () => {
    test('should filter landing sites by terrain difficulty', async () => {
      const mockLandingSites = [
        {
          endLatitude: 40.7200,
          endLongitude: -74.0100,
          totalDistance: 5.2,
          averageSpeed: 1.44,
          trajectory: []
        },
        {
          endLatitude: 40.7150,
          endLongitude: -74.0050,
          totalDistance: 3.8,
          averageSpeed: 1.05,
          trajectory: []
        }
      ];

      const filteredSites = await engine.filterLandingSitesByTerrain(mockLandingSites, mockTerrainConfig);
      
      expect(Array.isArray(filteredSites)).toBe(true);
      expect(filteredSites.length).toBeLessThanOrEqual(mockLandingSites.length);
    });

    test('should return all sites when filtering disabled', async () => {
      const noFilterConfig = { ...mockTerrainConfig, landingSiteFiltering: false };
      const mockLandingSites = [
        {
          endLatitude: 40.7200,
          endLongitude: -74.0100,
          totalDistance: 5.2,
          averageSpeed: 1.44,
          trajectory: []
        }
      ];

      const filteredSites = await engine.filterLandingSitesByTerrain(mockLandingSites, noFilterConfig);
      
      expect(filteredSites).toEqual(mockLandingSites);
    });
  });

  describe('Burst Altitude Terrain Adjustment', () => {
    test('should adjust burst altitude for terrain obstacles', async () => {
      const originalAltitude = 25000;
      const location = { lat: 40.7128, lng: -74.0060 };
      
      const adjustedAltitude = await engine.adjustBurstAltitudeForTerrain(
        originalAltitude,
        location,
        mockTerrainConfig
      );
      
      expect(adjustedAltitude).toBeGreaterThanOrEqual(originalAltitude);
    });

    test('should not adjust when burst height adjustment disabled', async () => {
      const originalAltitude = 25000;
      const location = { lat: 40.7128, lng: -74.0060 };
      const noAdjustConfig = { ...mockTerrainConfig, burstHeightAdjustment: false };
      
      const adjustedAltitude = await engine.adjustBurstAltitudeForTerrain(
        originalAltitude,
        location,
        noAdjustConfig
      );
      
      expect(adjustedAltitude).toBe(originalAltitude);
    });

    test('should provide minimum safe clearance above terrain', async () => {
      const lowAltitude = 1000; // Low burst altitude
      const location = { lat: 40.7128, lng: -74.0060 };
      
      const adjustedAltitude = await engine.adjustBurstAltitudeForTerrain(
        lowAltitude,
        location,
        mockTerrainConfig
      );
      
      // Should be adjusted upward for safety
      expect(adjustedAltitude).toBeGreaterThan(lowAltitude);
    });
  });

  describe('Terrain Confidence Adjustment', () => {
    test('should calculate terrain confidence adjustment', async () => {
      const baseConfidence = 0.9;
      const location = { lat: 40.7128, lng: -74.0060, alt: 100 };
      
      const adjustedConfidence = await engine.calculateTerrainConfidenceAdjustment(
        baseConfidence,
        location,
        mockTerrainConfig
      );
      
      expect(adjustedConfidence).toBeGreaterThan(0);
      expect(adjustedConfidence).toBeLessThanOrEqual(1);
    });

    test('should return base confidence when terrain analysis disabled', async () => {
      const baseConfidence = 0.9;
      const location = { lat: 40.7128, lng: -74.0060, alt: 100 };
      const disabledConfig = { ...mockTerrainConfig, enableTerrainAnalysis: false };
      
      const adjustedConfidence = await engine.calculateTerrainConfidenceAdjustment(
        baseConfidence,
        location,
        disabledConfig
      );
      
      expect(adjustedConfidence).toBe(baseConfidence);
    });

    test('should reduce confidence for complex terrain', async () => {
      const baseConfidence = 0.9;
      const location = { lat: 40.7128, lng: -74.0060, alt: 100 };
      
      const adjustedConfidence = await engine.calculateTerrainConfidenceAdjustment(
        baseConfidence,
        location,
        mockTerrainConfig
      );
      
      // Confidence should be adjusted based on terrain complexity
      expect(adjustedConfidence).toBeGreaterThan(0.5);
      expect(adjustedConfidence).toBeLessThanOrEqual(baseConfidence);
    });
  });

  describe('Performance and Metrics', () => {
    test('should track performance metrics', async () => {
      await engine.calculateTerrainEnhancedPrediction(mockTerrainPredictionInput);
      
      const metrics = engine.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('totalTime');
      expect(metrics).toHaveProperty('terrainAnalysisTime');
      expect(metrics).toHaveProperty('predictionTime');
      expect(metrics).toHaveProperty('terrainServiceMetrics');
      
      expect(metrics.totalTime).toBeGreaterThanOrEqual(0);
      expect(metrics.terrainAnalysisTime).toBeGreaterThanOrEqual(0);
    });

    test('should complete terrain analysis within reasonable time', async () => {
      const startTime = Date.now();
      await engine.calculateTerrainEnhancedPrediction(mockTerrainPredictionInput);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds for mock data
      expect(duration).toBeLessThan(5000);
    });

    test('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Run multiple predictions to test efficiency
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(engine.calculateTerrainEnhancedPrediction(mockTerrainPredictionInput));
      }
      
      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle multiple predictions efficiently
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid terrain configuration gracefully', async () => {
      const invalidInput = {
        ...mockTerrainPredictionInput,
        terrainConfig: { ...mockTerrainConfig, terrainResolution: -1 }
      };

      // Should not throw an error, but fallback to basic prediction
      const result = await engine.calculateTerrainEnhancedPrediction(invalidInput);
      expect(result).toHaveProperty('terrain');
    });

    test('should handle extreme terrain conditions', async () => {
      const extremeConfig = {
        ...mockTerrainConfig,
        maxTerrainObstacleHeight: 10000, // Very high obstacles
        analysisRadius: 100 // Very large radius
      };

      const result = await engine.calculateTerrainEnhancedPrediction({
        ...mockTerrainPredictionInput,
        terrainConfig: extremeConfig
      });

      expect(result).toHaveProperty('terrain');
      expect(result.terrain.elevationStats).toHaveProperty('maxElevation');
    });

    test('should handle coordinates near poles', async () => {
      const polarInput = {
        ...mockTerrainPredictionInput,
        launchLocation: { lat: 85, lng: 0, alt: 100 }
      };

      const result = await engine.calculateTerrainEnhancedPrediction(polarInput);
      expect(result).toHaveProperty('terrain');
    });

    test('should handle coordinates crossing 180° longitude', async () => {
      const crossingInput = {
        ...mockTerrainPredictionInput,
        launchLocation: { lat: 0, lng: 179, alt: 100 }
      };

      const result = await engine.calculateTerrainEnhancedPrediction(crossingInput);
      expect(result).toHaveProperty('terrain');
    });
  });

  describe('Integration with Existing Algorithms', () => {
    test('should integrate with ascent algorithm', async () => {
      const result = await engine.calculateTerrainAdjustedAscent(mockAscentInput, mockTerrainConfig);
      
      // Should have all standard ascent result properties
      expect(result).toHaveProperty('trajectory');
      expect(result).toHaveProperty('burstPoint');
      expect(result).toHaveProperty('ascentDuration');
      expect(result).toHaveProperty('windDrift');
    });

    test('should integrate with descent algorithm', async () => {
      const result = await engine.calculateTerrainAdjustedDescent(mockDescentInput, mockTerrainConfig);
      
      // Should have all standard descent result properties
      expect(result).toHaveProperty('trajectory');
      expect(result).toHaveProperty('landingPoint');
      expect(result).toHaveProperty('descentDuration');
    });

    test('should integrate with wind drift algorithm', async () => {
      const result = await engine.calculateTerrainAdjustedWindDrift(mockWindDriftInput, mockTerrainConfig);
      
      // Should have all standard wind drift result properties
      expect(result).toHaveProperty('endLatitude');
      expect(result).toHaveProperty('endLongitude');
      expect(result).toHaveProperty('totalDistance');
      expect(result).toHaveProperty('trajectory');
    });

    test('should maintain backward compatibility', async () => {
      // Test that algorithms still work with minimal terrain config
      const minimalConfig = {
        enableTerrainAnalysis: false,
        terrainResolution: 10,
        analysisRadius: 1,
        obstacleAvoidance: false,
        landingSiteFiltering: false,
        burstHeightAdjustment: false,
        maxTerrainObstacleHeight: 0,
        minLandingSiteDistance: 0
      };

      const ascentResult = await engine.calculateTerrainAdjustedAscent(mockAscentInput, minimalConfig);
      const descentResult = await engine.calculateTerrainAdjustedDescent(mockDescentInput, minimalConfig);
      const windDriftResult = await engine.calculateTerrainAdjustedWindDrift(mockWindDriftInput, minimalConfig);

      expect(ascentResult.ascentDuration).toBeGreaterThan(0);
      expect(descentResult.descentDuration).toBeGreaterThan(0);
      expect(windDriftResult.totalDistance).toBeGreaterThanOrEqual(0);
    });
  });
});
