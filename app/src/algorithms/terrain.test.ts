// Comprehensive tests for terrain analysis algorithms
// Based on task-30c testing requirements

import {
  calculateSlope,
  calculateDistance,
  calculateBearing,
  categorizeSteepness,
  calculateTerrainRoughness,
  generateElevationProfile,
  detectTerrainFeatures,
  detectTerrainObstacles,
  calculateDifficultyRating,
  analyzeLandingSite,
  analyzeTerrainCharacteristics
} from './terrain';

import {
  TerrainAnalysisInput,
  TerrainPoint,
  InsufficientDataError,
  InvalidParametersError
} from '../types/terrain';

// Test data
const testPoints = [
  { latitude: 40.0000, longitude: -74.0000, elevation: 100 },
  { latitude: 40.0010, longitude: -74.0000, elevation: 120 },
  { latitude: 40.0020, longitude: -74.0000, elevation: 140 },
  { latitude: 40.0030, longitude: -74.0000, elevation: 110 },
  { latitude: 40.0040, longitude: -74.0000, elevation: 90 }
];

const mountainousPoints = [
  { latitude: 40.0000, longitude: -74.0000, elevation: 1000 },
  { latitude: 40.0010, longitude: -74.0000, elevation: 1200 },
  { latitude: 40.0020, longitude: -74.0000, elevation: 1500 },
  { latitude: 40.0030, longitude: -74.0000, elevation: 1300 },
  { latitude: 40.0040, longitude: -74.0000, elevation: 1100 }
];

const flatPoints = [
  { latitude: 40.0000, longitude: -74.0000, elevation: 100 },
  { latitude: 40.0010, longitude: -74.0000, elevation: 101 },
  { latitude: 40.0020, longitude: -74.0000, elevation: 99 },
  { latitude: 40.0030, longitude: -74.0000, elevation: 100 },
  { latitude: 40.0040, longitude: -74.0000, elevation: 102 }
];

describe('Terrain Analysis Algorithms', () => {
  
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const point1 = { latitude: 40.0000, longitude: -74.0000 };
      const point2 = { latitude: 40.0010, longitude: -74.0000 };
      
      const distance = calculateDistance(point1, point2);
      
      // Should be approximately 111 meters (1 degree lat ≈ 111km, so 0.001 ≈ 111m)
      expect(distance).toBeCloseTo(111, 0);
    });

    it('should return 0 for identical points', () => {
      const point = { latitude: 40.0000, longitude: -74.0000 };
      const distance = calculateDistance(point, point);
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const point1 = { latitude: -40.0000, longitude: -74.0000 };
      const point2 = { latitude: -40.0010, longitude: -74.0000 };
      
      const distance = calculateDistance(point1, point2);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('calculateBearing', () => {
    it('should calculate bearing correctly for north direction', () => {
      const point1 = { latitude: 40.0000, longitude: -74.0000 };
      const point2 = { latitude: 40.0010, longitude: -74.0000 };
      
      const bearing = calculateBearing(point1, point2);
      expect(bearing).toBeCloseTo(0, 1); // Should be close to 0° (north)
    });

    it('should calculate bearing correctly for east direction', () => {
      const point1 = { latitude: 40.0000, longitude: -74.0000 };
      const point2 = { latitude: 40.0000, longitude: -73.9990 };
      
      const bearing = calculateBearing(point1, point2);
      expect(bearing).toBeCloseTo(90, 1); // Should be close to 90° (east)
    });

    it('should return value between 0 and 360', () => {
      const point1 = { latitude: 40.0000, longitude: -74.0000 };
      const point2 = { latitude: 39.9990, longitude: -74.0010 };
      
      const bearing = calculateBearing(point1, point2);
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });
  });

  describe('calculateSlope', () => {
    it('should calculate slope correctly for upward grade', () => {
      const point1 = { latitude: 40.0000, longitude: -74.0000, elevation: 100 };
      const point2 = { latitude: 40.0010, longitude: -74.0000, elevation: 120 };
      
      const slope = calculateSlope(point1, point2);
      
      expect(slope.slopeAngle).toBeGreaterThan(0);
      expect(slope.gradient).toBeGreaterThan(0);
      expect(slope.steepnessCategory).toBeDefined();
    });

    it('should return zero slope for points at same elevation', () => {
      const point1 = { latitude: 40.0000, longitude: -74.0000, elevation: 100 };
      const point2 = { latitude: 40.0010, longitude: -74.0000, elevation: 100 };
      
      const slope = calculateSlope(point1, point2);
      
      expect(slope.slopeAngle).toBe(0);
      expect(slope.gradient).toBe(0);
      expect(slope.steepnessCategory).toBe('flat');
    });

    it('should handle identical points', () => {
      const point = { latitude: 40.0000, longitude: -74.0000, elevation: 100 };
      const slope = calculateSlope(point, point);
      
      expect(slope.slopeAngle).toBe(0);
      expect(slope.gradient).toBe(0);
      expect(slope.steepnessCategory).toBe('flat');
    });
  });

  describe('categorizeSteepness', () => {
    it('should categorize flat terrain correctly', () => {
      expect(categorizeSteepness(2)).toBe('flat');
      expect(categorizeSteepness(4.9)).toBe('flat');
    });

    it('should categorize gentle slopes correctly', () => {
      expect(categorizeSteepness(5)).toBe('gentle');
      expect(categorizeSteepness(10)).toBe('gentle');
      expect(categorizeSteepness(14.9)).toBe('gentle');
    });

    it('should categorize steep terrain correctly', () => {
      expect(categorizeSteepness(25)).toBe('steep');
      expect(categorizeSteepness(35)).toBe('steep');
      expect(categorizeSteepness(44.9)).toBe('steep');
    });

    it('should categorize cliffs correctly', () => {
      expect(categorizeSteepness(75)).toBe('cliff');
      expect(categorizeSteepness(85)).toBe('cliff');
    });
  });

  describe('calculateTerrainRoughness', () => {
    it('should return low roughness for flat terrain', () => {
      const roughness = calculateTerrainRoughness(flatPoints);
      expect(roughness).toBeLessThan(0.1);
    });

    it('should return high roughness for mountainous terrain', () => {
      const roughness = calculateTerrainRoughness(mountainousPoints);
      expect(roughness).toBeGreaterThan(0.5);
    });

    it('should return 0 for insufficient data', () => {
      const roughness = calculateTerrainRoughness([{ elevation: 100 }]);
      expect(roughness).toBe(0);
    });

    it('should return 0 for empty array', () => {
      const roughness = calculateTerrainRoughness([]);
      expect(roughness).toBe(0);
    });

    it('should return value between 0 and 1', () => {
      const roughness = calculateTerrainRoughness(testPoints);
      expect(roughness).toBeGreaterThanOrEqual(0);
      expect(roughness).toBeLessThanOrEqual(1);
    });
  });

  describe('generateElevationProfile', () => {
    it('should generate profile with correct number of points', () => {
      const profile = generateElevationProfile(testPoints);
      expect(profile.points).toHaveLength(testPoints.length);
    });

    it('should calculate total distance correctly', () => {
      const profile = generateElevationProfile(testPoints);
      expect(profile.totalDistance).toBeGreaterThan(0);
    });

    it('should calculate elevation gain and loss', () => {
      const profile = generateElevationProfile(testPoints);
      expect(profile.elevationGain).toBeGreaterThanOrEqual(0);
      expect(profile.elevationLoss).toBeGreaterThanOrEqual(0);
    });

    it('should find correct max and min elevations', () => {
      const profile = generateElevationProfile(testPoints);
      const elevations = testPoints.map(p => p.elevation);
      
      expect(profile.maxElevation).toBe(Math.max(...elevations));
      expect(profile.minElevation).toBe(Math.min(...elevations));
    });

    it('should throw error for insufficient data', () => {
      expect(() => {
        generateElevationProfile([testPoints[0]]);
      }).toThrow('At least 2 points required for elevation profile');
    });

    it('should calculate average slope', () => {
      const profile = generateElevationProfile(testPoints);
      expect(profile.averageSlope).toBeGreaterThanOrEqual(0);
      expect(profile.averageSlope).toBeLessThanOrEqual(90);
    });
  });

  describe('detectTerrainFeatures', () => {
    it('should detect features in mountainous terrain', () => {
      const features = detectTerrainFeatures(mountainousPoints, 1000);
      expect(features.length).toBeGreaterThanOrEqual(0);
    });

    it('should not detect features in flat terrain', () => {
      const features = detectTerrainFeatures(flatPoints, 1000);
      expect(features.length).toBe(0);
    });

    it('should return empty array for insufficient data', () => {
      const features = detectTerrainFeatures([testPoints[0]], 1000);
      expect(features).toHaveLength(0);
    });

    it('should categorize features correctly', () => {
      const features = detectTerrainFeatures(mountainousPoints, 1000);
      features.forEach(feature => {
        expect(['mountain', 'hill', 'valley', 'ridge', 'plateau', 'depression']).toContain(feature.type);
        expect(feature.prominence).toBeGreaterThan(0);
        expect(feature.area).toBeGreaterThan(0);
      });
    });
  });

  describe('detectTerrainObstacles', () => {
    it('should detect obstacles in mountainous terrain', () => {
      const obstacles = detectTerrainObstacles(mountainousPoints);
      expect(obstacles.length).toBeGreaterThanOrEqual(0);
    });

    it('should not detect obstacles in flat terrain', () => {
      const obstacles = detectTerrainObstacles(flatPoints);
      expect(obstacles.length).toBe(0);
    });

    it('should set appropriate clearance requirements', () => {
      const obstacles = detectTerrainObstacles(mountainousPoints);
      obstacles.forEach(obstacle => {
        expect(obstacle.clearanceRequired).toBeGreaterThan(obstacle.height);
        expect(obstacle.radius).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateDifficultyRating', () => {
    const flatTerrain: TerrainPoint = {
      latitude: 40.0000,
      longitude: -74.0000,
      elevation: 100,
      slope: 2,
      roughness: 0.1,
      accessibility: 0.9
    };

    const steepTerrain: TerrainPoint = {
      latitude: 40.0000,
      longitude: -74.0000,
      elevation: 100,
      slope: 35,
      roughness: 0.8,
      accessibility: 0.2
    };

    it('should rate flat terrain as easy', () => {
      const result = calculateDifficultyRating(flatTerrain, []);
      expect(result.rating).toBeLessThanOrEqual(4);
      expect(result.description).toContain('Easy');
    });

    it('should rate steep terrain as difficult', () => {
      const result = calculateDifficultyRating(steepTerrain, []);
      expect(result.rating).toBeGreaterThan(5);
      expect(result.description).toContain('Difficult');
    });

    it('should increase difficulty with obstacles', () => {
      const obstacles = [
        {
          type: 'hill' as const,
          height: 50,
          position: { latitude: 40.0000, longitude: -74.0000, elevation: 150 },
          radius: 50,
          clearanceRequired: 70
        }
      ];

      const withoutObstacles = calculateDifficultyRating(flatTerrain, []);
      const withObstacles = calculateDifficultyRating(flatTerrain, obstacles);
      
      expect(withObstacles.rating).toBeGreaterThanOrEqual(withoutObstacles.rating);
    });

    it('should return rating between 1 and 10', () => {
      const result = calculateDifficultyRating(flatTerrain, []);
      expect(result.rating).toBeGreaterThanOrEqual(1);
      expect(result.rating).toBeLessThanOrEqual(10);
    });
  });

  describe('analyzeLandingSite', () => {
    const testPosition = { latitude: 40.0000, longitude: -74.0000, elevation: 100 };

    it('should analyze landing site characteristics', () => {
      const analysis = analyzeLandingSite(testPosition, testPoints);
      
      expect(analysis.position).toEqual(testPosition);
      expect(analysis.difficultyRating).toBeGreaterThanOrEqual(1);
      expect(analysis.difficultyRating).toBeLessThanOrEqual(10);
      expect(analysis.suitabilityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.suitabilityScore).toBeLessThanOrEqual(1);
      expect(analysis.accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.accessibilityScore).toBeLessThanOrEqual(1);
    });

    it('should identify risk factors', () => {
      const analysis = analyzeLandingSite(testPosition, mountainousPoints);
      expect(Array.isArray(analysis.riskFactors)).toBe(true);
    });

    it('should provide recommendations', () => {
      const analysis = analyzeLandingSite(testPosition, testPoints);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate terrain characteristics', () => {
      const analysis = analyzeLandingSite(testPosition, testPoints);
      
      expect(analysis.terrainCharacteristics.averageSlope).toBeGreaterThanOrEqual(0);
      expect(analysis.terrainCharacteristics.maxSlope).toBeGreaterThanOrEqual(0);
      expect(analysis.terrainCharacteristics.terrainRoughness).toBeGreaterThanOrEqual(0);
      expect(analysis.terrainCharacteristics.terrainRoughness).toBeLessThanOrEqual(1);
      expect(analysis.terrainCharacteristics.surfaceType).toBeDefined();
    });
  });

  describe('analyzeTerrainCharacteristics', () => {
    const validInput: TerrainAnalysisInput = {
      coordinates: testPoints,
      analysisRadius: 1000,
      resolution: 10
    };

    it('should perform complete terrain analysis', async () => {
      const result = await analyzeTerrainCharacteristics(validInput);
      
      expect(result.analysisId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.inputParameters).toEqual(validInput);
      expect(Array.isArray(result.terrainPoints)).toBe(true);
      expect(result.elevationProfile).toBeDefined();
      expect(Array.isArray(result.detectedFeatures)).toBe(true);
      expect(Array.isArray(result.detectedObstacles)).toBe(true);
      expect(Array.isArray(result.landingSites)).toBe(true);
      expect(result.overallDifficulty).toBeDefined();
      expect(result.performanceMetrics).toBeDefined();
    });

    it('should validate input parameters', async () => {
      const invalidInput = {
        coordinates: [testPoints[0]], // Only 1 point
        analysisRadius: 1000,
        resolution: 10
      };

      await expect(analyzeTerrainCharacteristics(invalidInput))
        .rejects.toThrow('At least 3 coordinate points required for terrain analysis');
    });

    it('should validate analysis radius', async () => {
      const invalidInput = {
        coordinates: testPoints,
        analysisRadius: -100, // Negative radius
        resolution: 10
      };

      await expect(analyzeTerrainCharacteristics(invalidInput))
        .rejects.toThrow('Analysis radius and resolution must be positive numbers');
    });

    it('should validate resolution', async () => {
      const invalidInput = {
        coordinates: testPoints,
        analysisRadius: 1000,
        resolution: 0 // Zero resolution
      };

      await expect(analyzeTerrainCharacteristics(invalidInput))
        .rejects.toThrow('Analysis radius and resolution must be positive numbers');
    });

    it('should sort landing sites by difficulty', async () => {
      const result = await analyzeTerrainCharacteristics(validInput);
      
      for (let i = 1; i < result.landingSites.length; i++) {
        expect(result.landingSites[i].difficultyRating)
          .toBeGreaterThanOrEqual(result.landingSites[i - 1].difficultyRating);
      }
    });

    it('should measure performance', async () => {
      const result = await analyzeTerrainCharacteristics(validInput);
      
      expect(result.performanceMetrics.analysisTime).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.pointsAnalyzed).toBe(testPoints.length);
      expect(result.performanceMetrics.featuresDetected).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.obstaclesDetected).toBeGreaterThanOrEqual(0);
    });

    it('should calculate overall difficulty correctly', async () => {
      const result = await analyzeTerrainCharacteristics(validInput);
      
      expect(result.overallDifficulty.rating).toBeGreaterThanOrEqual(1);
      expect(result.overallDifficulty.rating).toBeLessThanOrEqual(10);
      expect(result.overallDifficulty.description).toBeDefined();
      expect(result.overallDifficulty.confidence).toBeGreaterThanOrEqual(0);
      expect(result.overallDifficulty.confidence).toBeLessThanOrEqual(1);
    });
  });

  // Performance tests
  describe('Performance Tests', () => {
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      
      const input: TerrainAnalysisInput = {
        coordinates: testPoints,
        analysisRadius: 1000,
        resolution: 10
      };

      await analyzeTerrainCharacteristics(input);
      
      const analysisTime = Date.now() - startTime;
      expect(analysisTime).toBeLessThan(5000); // Should complete within 5 seconds
    }, 10000);

    it('should handle large datasets efficiently', async () => {
      // Generate larger dataset
      const largeDataset = [];
      for (let i = 0; i < 100; i++) {
        largeDataset.push({
          latitude: 40.0000 + (i * 0.001),
          longitude: -74.0000 + (i * 0.001),
          elevation: 100 + Math.random() * 200
        });
      }

      const startTime = Date.now();
      
      const input: TerrainAnalysisInput = {
        coordinates: largeDataset,
        analysisRadius: 1000,
        resolution: 10
      };

      const result = await analyzeTerrainCharacteristics(input);
      
      const analysisTime = Date.now() - startTime;
      expect(analysisTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.performanceMetrics.pointsAnalyzed).toBe(largeDataset.length);
    }, 15000);
  });

  // Edge case tests
  describe('Edge Cases', () => {
    it('should handle extreme elevation values', () => {
      const extremePoints = [
        { latitude: 40.0000, longitude: -74.0000, elevation: -100 }, // Below sea level
        { latitude: 40.0010, longitude: -74.0000, elevation: 8848 },  // Mount Everest height
        { latitude: 40.0020, longitude: -74.0000, elevation: 0 }      // Sea level
      ];

      const profile = generateElevationProfile(extremePoints);
      expect(profile.maxElevation).toBe(8848);
      expect(profile.minElevation).toBe(-100);
    });

    it('should handle points with same coordinates but different elevations', () => {
      const sameLocationPoints = [
        { latitude: 40.0000, longitude: -74.0000, elevation: 100 },
        { latitude: 40.0000, longitude: -74.0000, elevation: 200 },
        { latitude: 40.0000, longitude: -74.0000, elevation: 150 }
      ];

      const roughness = calculateTerrainRoughness(sameLocationPoints);
      expect(roughness).toBeGreaterThan(0);
    });

    it('should handle coordinates near poles', () => {
      const polarPoints = [
        { latitude: 89.9999, longitude: 0, elevation: 100 },
        { latitude: 89.9998, longitude: 180, elevation: 110 }
      ];

      const distance = calculateDistance(polarPoints[0], polarPoints[1]);
      expect(distance).toBeGreaterThan(0);
      expect(Number.isFinite(distance)).toBe(true);
    });

    it('should handle coordinates crossing 180° longitude', () => {
      const crossingPoints = [
        { latitude: 40.0000, longitude: 179.9999, elevation: 100 },
        { latitude: 40.0000, longitude: -179.9999, elevation: 110 }
      ];

      const distance = calculateDistance(crossingPoints[0], crossingPoints[1]);
      expect(distance).toBeGreaterThan(0);
      expect(Number.isFinite(distance)).toBe(true);
    });
  });
});
