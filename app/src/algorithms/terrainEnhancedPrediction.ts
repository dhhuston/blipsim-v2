// Enhanced prediction engine with terrain integration
// Based on task-30d specifications

import { 
  TerrainPredictionInput,
  TerrainPredictionResult,
  TerrainConfig
} from '../types/terrainPrediction';

import { 
  PredictionInput,
  PredictionResult,
  calculatePrediction
} from './predictionEngine';

import { TerrainIntegrationService } from '../services/terrainIntegration';
import { AscentInput, AscentResult, calculateAscent } from './ascent';
import { DescentInput, DescentResult, calculateDescent } from './descent';
import { BurstSiteInput, BurstSiteResult, predictBurstSite } from './burstSite';
import { WindDriftInput, WindDriftResult, calculateWindDrift } from './windDrift';

/**
 * Enhanced prediction engine that integrates terrain data with existing algorithms
 */
export class TerrainEnhancedPredictionEngine {
  private terrainService: TerrainIntegrationService;
  private performanceMetrics: {
    totalTime: number;
    terrainAnalysisTime: number;
    predictionTime: number;
  };

  constructor() {
    this.terrainService = new TerrainIntegrationService();
    this.performanceMetrics = { totalTime: 0, terrainAnalysisTime: 0, predictionTime: 0 };
  }

  /**
   * Calculate terrain-enhanced prediction
   */
  async calculateTerrainEnhancedPrediction(
    input: TerrainPredictionInput
  ): Promise<TerrainPredictionResult> {
    const startTime = Date.now();

    try {
      // Use terrain integration service for the main calculation
      const result = await this.terrainService.calculateTerrainEnhancedPrediction(input);

      // Update performance metrics
      this.performanceMetrics.totalTime = Date.now() - startTime;
      this.performanceMetrics.terrainAnalysisTime = this.terrainService.getMetrics().terrainAnalysisTime;
      this.performanceMetrics.predictionTime = this.performanceMetrics.totalTime - this.performanceMetrics.terrainAnalysisTime;

      return result;

    } catch (error) {
      console.error('Terrain-enhanced prediction failed:', error);
      
      // Fallback to basic prediction
      return this.fallbackToBasicPrediction(input);
    }
  }

  /**
   * Calculate ascent with terrain adjustments
   */
  calculateTerrainAdjustedAscent(
    input: AscentInput,
    terrainConfig: TerrainConfig
  ): Promise<AscentResult> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!terrainConfig.enableTerrainAnalysis) {
          // Use standard ascent calculation
          resolve(calculateAscent(input));
          return;
        }

        // Prepare terrain data
        const elevationData = await this.prepareElevationDataForLocation(
          { lat: 0, lng: 0, alt: input.launchAltitude }, // Would get from input in real implementation
          terrainConfig
        );

        // Adjust ascent input for terrain
        const adjustedInput = this.terrainService.adjustAscentForTerrain(
          input,
          elevationData,
          terrainConfig
        );

        // Calculate ascent with adjusted parameters
        const result = calculateAscent(adjustedInput);

        resolve(result);

      } catch (error) {
        console.error('Terrain-adjusted ascent calculation failed:', error);
        // Fallback to standard calculation
        resolve(calculateAscent(input));
      }
    });
  }

  /**
   * Calculate descent with terrain adjustments
   */
  calculateTerrainAdjustedDescent(
    input: DescentInput,
    terrainConfig: TerrainConfig
  ): Promise<DescentResult> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!terrainConfig.enableTerrainAnalysis) {
          resolve(calculateDescent(input));
          return;
        }

        // Prepare terrain data
        const elevationData = await this.prepareElevationDataForLocation(
          { lat: input.burstLatitude, lng: input.burstLongitude, alt: input.burstAltitude },
          terrainConfig
        );

        // Adjust descent input for terrain
        const adjustedInput = this.terrainService.adjustDescentForTerrain(
          input,
          elevationData,
          terrainConfig
        );

        // Calculate descent with adjusted parameters
        const result = calculateDescent(adjustedInput);

        resolve(result);

      } catch (error) {
        console.error('Terrain-adjusted descent calculation failed:', error);
        resolve(calculateDescent(input));
      }
    });
  }

  /**
   * Calculate wind drift with terrain effects
   */
  calculateTerrainAdjustedWindDrift(
    input: WindDriftInput,
    terrainConfig: TerrainConfig
  ): Promise<WindDriftResult> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!terrainConfig.enableTerrainAnalysis || !terrainConfig.obstacleAvoidance) {
          resolve(calculateWindDrift(input));
          return;
        }

        // Prepare terrain data
        const elevationData = await this.prepareElevationDataForLocation(
          { lat: input.startLatitude, lng: input.startLongitude, alt: input.altitude },
          terrainConfig
        );

        // Adjust wind drift input for terrain effects
        const adjustedInput = this.terrainService.adjustWindDriftForTerrain(
          input,
          elevationData,
          terrainConfig
        );

        // Calculate wind drift with adjusted parameters
        const result = calculateWindDrift(adjustedInput);

        resolve(result);

      } catch (error) {
        console.error('Terrain-adjusted wind drift calculation failed:', error);
        resolve(calculateWindDrift(input));
      }
    });
  }

  /**
   * Filter landing sites based on terrain difficulty
   */
  async filterLandingSitesByTerrain(
    landingSites: WindDriftResult[],
    terrainConfig: TerrainConfig
  ): Promise<WindDriftResult[]> {
    if (!terrainConfig.enableTerrainAnalysis || !terrainConfig.landingSiteFiltering) {
      return landingSites;
    }

    try {
      // For each landing site, get terrain data and filter
      const filteredSites: WindDriftResult[] = [];

      for (const site of landingSites) {
        const elevationData = await this.prepareElevationDataForLocation(
          { lat: site.endLatitude, lng: site.endLongitude, alt: 0 },
          terrainConfig
        );

        const filtered = this.terrainService.filterLandingSitesByTerrain(
          [site],
          elevationData,
          terrainConfig
        );

        if (filtered.length > 0) {
          filteredSites.push(site);
        }
      }

      return filteredSites;

    } catch (error) {
      console.error('Landing site terrain filtering failed:', error);
      return landingSites; // Return original sites if filtering fails
    }
  }

  /**
   * Update burst altitude based on terrain obstacles
   */
  adjustBurstAltitudeForTerrain(
    burstAltitude: number,
    location: { lat: number; lng: number },
    terrainConfig: TerrainConfig
  ): Promise<number> {
    return new Promise(async (resolve) => {
      try {
        if (!terrainConfig.enableTerrainAnalysis || !terrainConfig.burstHeightAdjustment) {
          resolve(burstAltitude);
          return;
        }

        const elevationData = await this.prepareElevationDataForLocation(
          { lat: location.lat, lng: location.lng, alt: burstAltitude },
          terrainConfig
        );

        // Find maximum terrain elevation in the area
        const maxTerrainElevation = Math.max(...elevationData.map(p => p.elevation));
        
        // Ensure burst altitude is above terrain with safety margin
        const minSafeBurstAltitude = maxTerrainElevation + terrainConfig.maxTerrainObstacleHeight;
        
        resolve(Math.max(burstAltitude, minSafeBurstAltitude));

      } catch (error) {
        console.error('Burst altitude terrain adjustment failed:', error);
        resolve(burstAltitude);
      }
    });
  }

  /**
   * Calculate prediction confidence adjustment based on terrain complexity
   */
  calculateTerrainConfidenceAdjustment(
    baseConfidence: number,
    location: { lat: number; lng: number; alt?: number },
    terrainConfig: TerrainConfig
  ): Promise<number> {
    return new Promise(async (resolve) => {
      try {
        if (!terrainConfig.enableTerrainAnalysis) {
          resolve(baseConfidence);
          return;
        }

        const elevationData = await this.prepareElevationDataForLocation(
          location,
          terrainConfig
        );

        // Calculate terrain complexity
        const elevations = elevationData.map(p => p.elevation);
        const elevationVariation = Math.max(...elevations) - Math.min(...elevations);
        const averageSlope = elevationData.reduce((sum, p) => sum + (p.slope || 0), 0) / elevationData.length;

        // Reduce confidence based on terrain complexity
        let complexityFactor = 1.0;
        
        if (elevationVariation > 1000) complexityFactor *= 0.8; // High elevation variation
        if (averageSlope > 15) complexityFactor *= 0.9; // Steep terrain
        if (elevationVariation > 2000) complexityFactor *= 0.7; // Very high elevation variation
        if (averageSlope > 30) complexityFactor *= 0.8; // Very steep terrain

        resolve(baseConfidence * complexityFactor);

      } catch (error) {
        console.error('Terrain confidence adjustment failed:', error);
        resolve(baseConfidence);
      }
    });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      terrainServiceMetrics: this.terrainService.getMetrics()
    };
  }

  /**
   * Validate terrain configuration
   */
  validateTerrainConfig(config: TerrainConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.terrainResolution <= 0) {
      errors.push('Terrain resolution must be positive');
    }

    if (config.analysisRadius <= 0) {
      errors.push('Analysis radius must be positive');
    }

    if (config.maxTerrainObstacleHeight < 0) {
      errors.push('Max terrain obstacle height cannot be negative');
    }

    if (config.minLandingSiteDistance < 0) {
      errors.push('Min landing site distance cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Private helper methods

  private async fallbackToBasicPrediction(input: TerrainPredictionInput): Promise<TerrainPredictionResult> {
    try {
      const basicPrediction = await calculatePrediction(input);
      
      // Create minimal terrain result structure
      return {
        ...basicPrediction,
        terrain: {
          trajectoryTerrain: { 
            points: [], 
            totalDistance: 0, 
            elevationGain: 0, 
            elevationLoss: 0, 
            maxElevation: 0, 
            minElevation: 0, 
            averageSlope: 0 
          },
          burstSiteTerrain: this.createEmptyTerrainCharacteristics(),
          landingSiteTerrain: this.createEmptyLandingSiteAnalysis(),
          obstaclesDetected: [],
          terrainComplexity: { 
            overall: 'moderate', 
            roughness: 0.5, 
            elevationVariation: 0, 
            slopeVariation: 0, 
            obstaclesDensity: 0, 
            predictabilityFactor: 0.5 
          },
          elevationStats: { 
            minElevation: 0, 
            maxElevation: 0, 
            averageElevation: 0, 
            elevationGain: 0, 
            elevationLoss: 0, 
            steepestSlope: 0, 
            flattenessRatio: 1 
          }
        },
        adjustedPredictions: {
          burstHeightAdjustment: 0,
          trajectoryDeviation: 0,
          landingSiteShift: { latitudeShift: 0, longitudeShift: 0, distanceShift: 0 },
          confidenceAdjustment: 1,
          flightTimeAdjustment: 0
        },
        landingSiteRecommendations: [],
        terrainWarnings: []
      };

    } catch (error) {
      throw new Error(`Both terrain-enhanced and basic prediction failed: ${error}`);
    }
  }

  private async prepareElevationDataForLocation(
    location: { lat: number; lng: number; alt?: number },
    config: TerrainConfig
  ) {
    // This would normally fetch real elevation data from a service
    // For now, generate mock data
    const mockData = [];
    
    for (let i = 0; i < 50; i++) {
      mockData.push({
        latitude: location.lat + (Math.random() - 0.5) * 0.05,
        longitude: location.lng + (Math.random() - 0.5) * 0.05,
        elevation: (location.alt || 0) + Math.random() * 500,
        slope: Math.random() * 30,
        roughness: Math.random(),
        accessibility: Math.random()
      });
    }
    
    return mockData;
  }

  private createEmptyTerrainCharacteristics() {
    return { 
      location: { latitude: 0, longitude: 0, elevation: 0 }, 
      averageSlope: 0, 
      maxSlope: 0, 
      minSlope: 0, 
      roughnessIndex: 0, 
      elevationVariation: 0, 
      vegetationCover: 0, 
      accessibilityScore: 0, 
      difficultyRating: 0, 
      features: [], 
      obstacles: [], 
      riskFactors: [], 
      confidence: 0 
    };
  }

  private createEmptyLandingSiteAnalysis() {
    return { 
      position: { latitude: 0, longitude: 0, elevation: 0 }, 
      difficultyRating: 5, 
      difficultyDescription: 'Unknown terrain',
      suitabilityScore: 0.5, 
      accessibilityScore: 0.5, 
      terrainCharacteristics: { 
        averageSlope: 0, 
        maxSlope: 0, 
        terrainRoughness: 0, 
        surfaceType: 'unknown' as const
      }, 
      riskFactors: [], 
      recommendations: [] 
    };
  }
}

/**
 * Factory function to create terrain-enhanced prediction engine
 */
export function createTerrainEnhancedPredictionEngine(): TerrainEnhancedPredictionEngine {
  return new TerrainEnhancedPredictionEngine();
}

/**
 * Helper function to create default terrain configuration
 */
export function createDefaultTerrainConfig(): TerrainConfig {
  return {
    enableTerrainAnalysis: true,
    terrainResolution: 10, // 10 meters
    analysisRadius: 5, // 5 km
    obstacleAvoidance: true,
    landingSiteFiltering: true,
    burstHeightAdjustment: true,
    maxTerrainObstacleHeight: 300, // 300 meters clearance
    minLandingSiteDistance: 1 // 1 km from obstacles
  };
}

/**
 * Helper function to validate and prepare terrain prediction input
 */
export function prepareTerrainPredictionInput(
  basePredictionInput: PredictionInput,
  terrainConfig?: TerrainConfig
): TerrainPredictionInput {
  return {
    ...basePredictionInput,
    terrainConfig: terrainConfig || createDefaultTerrainConfig()
  };
}
