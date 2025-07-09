// Terrain Integration Service for prediction engine
// Based on task-30d specifications

import { 
  TerrainPredictionInput,
  TerrainPredictionResult,
  TerrainConfig,
  TerrainAnalysisResult,
  TerrainAdjustments,
  LandingSiteRecommendation,
  TerrainWarning,
  TerrainComplexity,
  ElevationStatistics,
  TerrainPredictionMetrics
} from '../types/terrainPrediction';

import { 
  PredictionInput,
  PredictionResult,
  calculatePrediction
} from '../algorithms/predictionEngine';

import {
  analyzeTerrainCharacteristics,
  analyzeLandingSite,
  generateElevationProfile,
  detectTerrainObstacles,
  calculateTerrainRoughness,
  calculateDifficultyRating
} from '../algorithms/terrain';

import {
  TerrainPoint,
  LandingSiteAnalysis,
  ElevationProfile,
  TerrainAnalysisConfig,
  TerrainObstacle as TerrainObstacleType
} from '../types/terrain';

import { AscentInput, AscentResult } from '../algorithms/ascent';
import { DescentInput, DescentResult } from '../algorithms/descent';
import { BurstSiteInput, BurstSiteResult } from '../algorithms/burstSite';
import { WindDriftInput, WindDriftResult } from '../algorithms/windDrift';

/**
 * Service for integrating terrain data with prediction algorithms
 */
export class TerrainIntegrationService {
  private cache: Map<string, any> = new Map();
  private metrics: TerrainPredictionMetrics;

  constructor() {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Main terrain-enhanced prediction calculation
   */
  async calculateTerrainEnhancedPrediction(
    input: TerrainPredictionInput
  ): Promise<TerrainPredictionResult> {
    const startTime = Date.now();
    
    try {
      // Validate terrain configuration
      this.validateTerrainConfig(input.terrainConfig);

      // Prepare elevation data
      const elevationData = await this.prepareElevationData(
        input.launchLocation,
        input.terrainConfig
      );

      // Execute base prediction
      const basePrediction = await calculatePrediction(input);

      // Analyze terrain characteristics
      const terrainAnalysis = await this.analyzeTrajectoryTerrain(
        basePrediction,
        elevationData,
        input.terrainConfig
      );

      // Apply terrain adjustments
      const adjustedPredictions = await this.applyTerrainAdjustments(
        basePrediction,
        terrainAnalysis,
        input.terrainConfig
      );

      // Generate landing site recommendations
      const landingSiteRecommendations = await this.generateLandingSiteRecommendations(
        basePrediction,
        terrainAnalysis,
        input.terrainConfig
      );

      // Generate terrain warnings
      const terrainWarnings = this.generateTerrainWarnings(
        terrainAnalysis,
        adjustedPredictions
      );

      // Update metrics
      this.metrics.terrainAnalysisTime = Date.now() - startTime;
      this.metrics.elevationDataPoints = elevationData.length;

      return {
        ...basePrediction,
        ...adjustedPredictions,
        terrain: terrainAnalysis,
        adjustedPredictions,
        landingSiteRecommendations,
        terrainWarnings
      };

    } catch (error) {
      console.error('Terrain-enhanced prediction failed:', error);
      
      // Fallback to basic prediction
      const basePrediction = await calculatePrediction(input);
      return this.createFallbackResult(basePrediction);
    }
  }

  /**
   * Adjust ascent calculations based on terrain
   */
  adjustAscentForTerrain(
    ascentInput: AscentInput,
    terrainData: TerrainPoint[],
    config: TerrainConfig
  ): AscentInput {
    if (!config.enableTerrainAnalysis) {
      return ascentInput;
    }

    // Adjust burst altitude for terrain obstacles
    let adjustedBurstAltitude = ascentInput.burstAltitude;
    if (config.burstHeightAdjustment) {
      const maxTerrainHeight = Math.max(...terrainData.map(p => p.elevation));
      const minimumClearance = config.maxTerrainObstacleHeight;
      adjustedBurstAltitude = Math.max(
        ascentInput.burstAltitude,
        maxTerrainHeight + minimumClearance
      );
    }

    // Adjust ascent rate for terrain complexity
    const terrainComplexity = this.calculateTerrainComplexity(terrainData);
    const complexityFactor = this.getComplexityAdjustmentFactor(terrainComplexity);
    
    return {
      ...ascentInput,
      burstAltitude: adjustedBurstAltitude,
      ascentRate: ascentInput.ascentRate * complexityFactor
    };
  }

  /**
   * Adjust descent calculations based on terrain
   */
  adjustDescentForTerrain(
    descentInput: DescentInput,
    terrainData: TerrainPoint[],
    config: TerrainConfig
  ): DescentInput {
    if (!config.enableTerrainAnalysis) {
      return descentInput;
    }

    // Find suitable landing sites
    const suitableLandingSites = this.findSuitableLandingSites(
      terrainData,
      config
    );

    if (suitableLandingSites.length === 0) {
      return descentInput; // No adjustments if no suitable sites found
    }

    // Select best landing site
    const bestLandingSite = suitableLandingSites[0];
    
    return {
      ...descentInput,
      landingAltitude: bestLandingSite.elevation
    };
  }

  /**
   * Adjust wind drift calculations for terrain effects
   */
  adjustWindDriftForTerrain(
    windDriftInput: WindDriftInput,
    terrainData: TerrainPoint[],
    config: TerrainConfig
  ): WindDriftInput {
    if (!config.enableTerrainAnalysis || !config.obstacleAvoidance) {
      return windDriftInput;
    }

    // Create terrain analysis config
    const terrainConfig = this.createTerrainAnalysisConfig(config);

    // Detect terrain obstacles in flight path
    const obstacles = detectTerrainObstacles(terrainData, terrainConfig);
    
    // Adjust wind patterns for terrain effects
    const terrainInfluenceFactor = this.calculateTerrainWindInfluence(
      obstacles,
      windDriftInput.altitude
    );

    return {
      ...windDriftInput,
      windSpeed: windDriftInput.windSpeed * terrainInfluenceFactor.speedFactor,
      windDirection: windDriftInput.windDirection + terrainInfluenceFactor.directionAdjustment
    };
  }

  /**
   * Filter landing sites based on terrain difficulty
   */
  filterLandingSitesByTerrain(
    predictions: WindDriftResult[],
    terrainData: TerrainPoint[],
    config: TerrainConfig
  ): WindDriftResult[] {
    if (!config.enableTerrainAnalysis || !config.landingSiteFiltering) {
      return predictions;
    }

    const terrainConfig = this.createTerrainAnalysisConfig(config);

    return predictions.filter(prediction => {
      // Find closest terrain point to landing site
      const landingPoint = terrainData.find(point => 
        Math.abs(point.latitude - prediction.endLatitude) < 0.01 &&
        Math.abs(point.longitude - prediction.endLongitude) < 0.01
      );

      if (!landingPoint) return true; // Keep if no terrain data available

      const obstacles = detectTerrainObstacles(terrainData, terrainConfig);
      const nearbyObstacles = obstacles.filter(obs => 
        Math.abs(obs.position.latitude - prediction.endLatitude) < 0.01 &&
        Math.abs(obs.position.longitude - prediction.endLongitude) < 0.01
      );

      const difficultyRating = calculateDifficultyRating(
        landingPoint,
        nearbyObstacles,
        terrainConfig
      );

      // Filter out sites that are too difficult
      return difficultyRating.rating <= 7; // Maximum difficulty threshold
    });
  }

  /**
   * Analyze terrain characteristics along trajectory
   */
  private async analyzeTrajectoryTerrain(
    prediction: PredictionResult,
    elevationData: TerrainPoint[],
    config: TerrainConfig
  ): Promise<TerrainAnalysisResult> {
    const terrainConfig = this.createTerrainAnalysisConfig(config);

    // Generate elevation profile for trajectory
    const trajectoryTerrain = generateElevationProfile(elevationData);

    // Analyze landing site terrain (using burst point as approximation for now)
    const burstSiteLocation = {
      latitude: prediction.ascent.burstPoint.lat,
      longitude: prediction.ascent.burstPoint.lng,
      elevation: prediction.ascent.burstPoint.alt
    };

    const landingSiteTerrain = analyzeLandingSite(
      burstSiteLocation,
      elevationData
    );

    // Detect obstacles
    const obstaclesDetected = detectTerrainObstacles(
      elevationData,
      terrainConfig
    );

    // Calculate terrain complexity
    const terrainComplexity = this.calculateTerrainComplexity(elevationData);

    // Calculate elevation statistics
    const elevationStats = this.calculateElevationStatistics(elevationData);

    return {
      trajectoryTerrain,
      burstSiteTerrain: this.convertToTerrainCharacteristics(landingSiteTerrain),
      landingSiteTerrain,
      obstaclesDetected: this.convertObstacles(obstaclesDetected),
      terrainComplexity,
      elevationStats
    };
  }

  /**
   * Apply terrain-based adjustments to predictions
   */
  private async applyTerrainAdjustments(
    basePrediction: PredictionResult,
    terrainAnalysis: TerrainAnalysisResult,
    config: TerrainConfig
  ): Promise<TerrainAdjustments> {
    // Calculate burst height adjustment
    const burstHeightAdjustment = this.calculateBurstHeightAdjustment(
      terrainAnalysis,
      config
    );

    // Calculate trajectory deviation
    const trajectoryDeviation = this.calculateTrajectoryDeviation(
      terrainAnalysis,
      config
    );

    // Calculate landing site shift
    const landingSiteShift = this.calculateLandingSiteShift(
      terrainAnalysis,
      config
    );

    // Calculate confidence adjustment
    const confidenceAdjustment = this.calculateConfidenceAdjustment(
      terrainAnalysis,
      config
    );

    // Calculate flight time adjustment
    const flightTimeAdjustment = this.calculateFlightTimeAdjustment(
      terrainAnalysis,
      config
    );

    return {
      burstHeightAdjustment,
      trajectoryDeviation,
      landingSiteShift,
      confidenceAdjustment,
      flightTimeAdjustment
    };
  }

  /**
   * Generate landing site recommendations
   */
  private async generateLandingSiteRecommendations(
    prediction: PredictionResult,
    terrainAnalysis: TerrainAnalysisResult,
    config: TerrainConfig
  ): Promise<LandingSiteRecommendation[]> {
    const recommendations: LandingSiteRecommendation[] = [];

    // Analyze primary landing site
    const primarySite = this.createLandingSiteRecommendation(
      prediction.ascent.burstPoint,
      terrainAnalysis.landingSiteTerrain,
      0
    );
    recommendations.push(primarySite);

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Generate terrain warnings
   */
  private generateTerrainWarnings(
    terrainAnalysis: TerrainAnalysisResult,
    adjustments: TerrainAdjustments
  ): TerrainWarning[] {
    const warnings: TerrainWarning[] = [];

    // Check for obstacles
    terrainAnalysis.obstaclesDetected.forEach(obstacle => {
      if (obstacle.impact === 'major' || obstacle.impact === 'blocking') {
        warnings.push({
          type: 'obstacle',
          severity: obstacle.impact === 'blocking' ? 'critical' : 'high',
          location: obstacle.location,
          description: `${obstacle.type} obstacle detected at ${obstacle.height}m height`,
          recommendation: obstacle.avoidanceRecommendation,
          affectedPhase: 'descent'
        });
      }
    });

    // Check for terrain complexity
    if (terrainAnalysis.terrainComplexity.overall === 'extreme') {
      warnings.push({
        type: 'cliff',
        severity: 'high',
        location: {
          latitude: terrainAnalysis.landingSiteTerrain.position.latitude,
          longitude: terrainAnalysis.landingSiteTerrain.position.longitude,
          elevation: terrainAnalysis.landingSiteTerrain.position.elevation
        },
        description: 'Extremely complex terrain detected in landing area',
        recommendation: 'Consider alternative launch conditions or timing',
        affectedPhase: 'landing'
      });
    }

    return warnings;
  }

  // Helper methods for calculations
  private calculateTerrainComplexity(terrainData: TerrainPoint[]): TerrainComplexity {
    const elevations = terrainData.map(p => p.elevation);
    const elevationVariation = Math.max(...elevations) - Math.min(...elevations);
    const roughness = calculateTerrainRoughness(terrainData);
    
    let overall: TerrainComplexity['overall'];
    if (elevationVariation < 100 && roughness < 0.2) {
      overall = 'flat';
    } else if (elevationVariation < 500 && roughness < 0.4) {
      overall = 'gentle';
    } else if (elevationVariation < 1000 && roughness < 0.6) {
      overall = 'moderate';
    } else if (elevationVariation < 2000 && roughness < 0.8) {
      overall = 'mountainous';
    } else {
      overall = 'extreme';
    }

    return {
      overall,
      roughness,
      elevationVariation,
      slopeVariation: this.calculateSlopeVariation(terrainData),
      obstaclesDensity: this.calculateObstacleDensity(terrainData),
      predictabilityFactor: Math.max(0, 1 - roughness)
    };
  }

  private calculateElevationStatistics(terrainData: TerrainPoint[]): ElevationStatistics {
    const elevations = terrainData.map(p => p.elevation);
    
    return {
      minElevation: Math.min(...elevations),
      maxElevation: Math.max(...elevations),
      averageElevation: elevations.reduce((a, b) => a + b, 0) / elevations.length,
      elevationGain: Math.max(...elevations) - Math.min(...elevations),
      elevationLoss: 0, // Would need trajectory analysis
      steepestSlope: Math.max(...terrainData.map(p => p.slope || 0)),
      flattenessRatio: terrainData.filter(p => (p.slope || 0) < 5).length / terrainData.length
    };
  }

  private calculateBurstHeightAdjustment(
    terrainAnalysis: TerrainAnalysisResult,
    config: TerrainConfig
  ): number {
    if (!config.burstHeightAdjustment) return 0;
    
    const maxObstacleHeight = Math.max(
      ...terrainAnalysis.obstaclesDetected.map(o => o.height),
      0
    );
    
    return Math.max(0, maxObstacleHeight + config.maxTerrainObstacleHeight - terrainAnalysis.elevationStats.maxElevation);
  }

  private calculateTrajectoryDeviation(
    terrainAnalysis: TerrainAnalysisResult,
    config: TerrainConfig
  ): number {
    // Base deviation on terrain complexity
    const complexityFactor = terrainAnalysis.terrainComplexity.roughness;
    return complexityFactor * 5; // Up to 5 degrees deviation
  }

  private calculateLandingSiteShift(
    terrainAnalysis: TerrainAnalysisResult,
    config: TerrainConfig
  ): TerrainAdjustments['landingSiteShift'] {
    // Simplified calculation - would need more sophisticated algorithm
    const shift = terrainAnalysis.terrainComplexity.roughness * 0.01; // Up to 1km shift
    
    return {
      latitudeShift: shift,
      longitudeShift: shift,
      distanceShift: shift * 111 // Convert to km approximately
    };
  }

  private calculateConfidenceAdjustment(
    terrainAnalysis: TerrainAnalysisResult,
    config: TerrainConfig
  ): number {
    // Reduce confidence based on terrain complexity
    return Math.max(0.5, 1 - terrainAnalysis.terrainComplexity.roughness * 0.5);
  }

  private calculateFlightTimeAdjustment(
    terrainAnalysis: TerrainAnalysisResult,
    config: TerrainConfig
  ): number {
    // Adjust flight time based on terrain effects on wind patterns
    const terrainEffect = terrainAnalysis.terrainComplexity.roughness;
    return terrainEffect * 300; // Up to 5 minutes adjustment
  }

  // Additional helper methods
  private validateTerrainConfig(config: TerrainConfig): void {
    if (config.terrainResolution <= 0) {
      throw new Error('Terrain resolution must be positive');
    }
    if (config.analysisRadius <= 0) {
      throw new Error('Analysis radius must be positive');
    }
  }

  private async prepareElevationData(
    launchLocation: { lat: number; lng: number; alt?: number },
    config: TerrainConfig
  ): Promise<TerrainPoint[]> {
    // Simplified - in real implementation would fetch from elevation service
    // For now, generate mock data based on launch location
    const mockData: TerrainPoint[] = [];
    
    for (let i = 0; i < 100; i++) {
      mockData.push({
        latitude: launchLocation.lat + (Math.random() - 0.5) * 0.1,
        longitude: launchLocation.lng + (Math.random() - 0.5) * 0.1,
        elevation: (launchLocation.alt || 0) + Math.random() * 1000,
        slope: Math.random() * 45,
        roughness: Math.random(),
        accessibility: Math.random()
      });
    }
    
    return mockData;
  }

  private createTerrainAnalysisConfig(config: TerrainConfig): TerrainAnalysisConfig {
    return {
      slopeThresholds: {
        flat: 5,
        gentle: 15,
        moderate: 25,
        steep: 45,
        verysteep: 70,
        cliff: 90
      },
      difficultyWeights: {
        slope: 0.4,
        roughness: 0.3,
        accessibility: 0.2,
        obstacles: 0.1
      },
      analysisResolution: config.terrainResolution,
      minLandingSiteSize: config.minLandingSiteDistance * 1000, // Convert km to m
      obstacleDetectionThreshold: config.maxTerrainObstacleHeight
    };
  }

  private getComplexityAdjustmentFactor(complexity: TerrainComplexity): number {
    switch (complexity.overall) {
      case 'flat': return 1.0;
      case 'gentle': return 0.95;
      case 'moderate': return 0.9;
      case 'mountainous': return 0.85;
      case 'extreme': return 0.8;
      default: return 1.0;
    }
  }

  private findSuitableLandingSites(
    terrainData: TerrainPoint[],
    config: TerrainConfig
  ): TerrainPoint[] {
    const terrainConfig = this.createTerrainAnalysisConfig(config);
    
    return terrainData.filter(point => {
      const obstacles = detectTerrainObstacles([point], terrainConfig);
      const difficulty = calculateDifficultyRating(point, obstacles, terrainConfig);
      return difficulty.rating <= 5 && (point.slope || 0) < 15;
    });
  }

  private calculateTerrainWindInfluence(
    obstacles: any[],
    altitude: number
  ): { speedFactor: number; directionAdjustment: number } {
    const obstacleEffect = obstacles.length * 0.05;
    return {
      speedFactor: Math.max(0.8, 1 - obstacleEffect),
      directionAdjustment: obstacleEffect * 10 // Up to 10 degree adjustment
    };
  }

  private createLandingSiteRecommendation(
    location: any,
    analysis: LandingSiteAnalysis,
    distance: number
  ): LandingSiteRecommendation {
    // Map the actual LandingSiteAnalysis to our recommendation format
    const suitabilityMap = {
      1: 'excellent' as const,
      2: 'excellent' as const,
      3: 'good' as const,
      4: 'good' as const,
      5: 'fair' as const,
      6: 'fair' as const,
      7: 'poor' as const,
      8: 'poor' as const,
      9: 'unsuitable' as const,
      10: 'unsuitable' as const
    };

    const accessibilityMap = {
      high: 'easy' as const,
      medium: 'moderate' as const,
      low: 'difficult' as const,
      verylow: 'very_difficult' as const
    };

    const suitability = suitabilityMap[Math.round(analysis.difficultyRating) as keyof typeof suitabilityMap] || 'fair';
    const accessibility = analysis.accessibilityScore > 0.7 ? 'easy' : 
                         analysis.accessibilityScore > 0.5 ? 'moderate' : 
                         analysis.accessibilityScore > 0.3 ? 'difficult' : 'very_difficult';

    return {
      location: {
        latitude: location.lat,
        longitude: location.lng,
        elevation: location.alt
      },
      suitability,
      difficultyRating: analysis.difficultyRating,
      accessibility,
      terrainFeatures: [analysis.terrainCharacteristics.surfaceType],
      riskFactors: analysis.riskFactors,
      recommendations: analysis.recommendations,
      distanceFromPredicted: distance,
      confidence: analysis.suitabilityScore
    };
  }

  private convertToTerrainCharacteristics(analysis: LandingSiteAnalysis): any {
    // Convert LandingSiteAnalysis to match TerrainCharacteristics expected format
    return {
      location: analysis.position,
      averageSlope: analysis.terrainCharacteristics.averageSlope,
      maxSlope: analysis.terrainCharacteristics.maxSlope,
      minSlope: 0, // Not provided in LandingSiteAnalysis
      roughnessIndex: analysis.terrainCharacteristics.terrainRoughness,
      elevationVariation: 0, // Would need calculation
      vegetationCover: analysis.terrainCharacteristics.vegetationDensity || 0,
      accessibilityScore: analysis.accessibilityScore,
      difficultyRating: analysis.difficultyRating,
      features: [analysis.terrainCharacteristics.surfaceType],
      obstacles: [],
      riskFactors: analysis.riskFactors,
      confidence: analysis.suitabilityScore
    };
  }

  private convertObstacles(obstacles: TerrainObstacleType[]): Array<{
    type: 'mountain' | 'hill' | 'ridge' | 'cliff' | 'building' | 'tower';
    location: { latitude: number; longitude: number; elevation: number };
    height: number;
    clearanceRequired: number;
    impact: 'minor' | 'moderate' | 'major' | 'blocking';
    avoidanceRecommendation: string;
  }> {
    return obstacles.map(obs => ({
      type: this.mapObstacleType(obs.type),
      location: {
        latitude: obs.position.latitude,
        longitude: obs.position.longitude,
        elevation: obs.position.elevation
      },
      height: obs.height,
      clearanceRequired: obs.clearanceRequired,
      impact: obs.height > 100 ? 'blocking' : 
              obs.height > 50 ? 'major' : 
              obs.height > 20 ? 'moderate' : 'minor',
      avoidanceRecommendation: `Maintain ${obs.clearanceRequired}m clearance above ${obs.type}`
    }));
  }

  private mapObstacleType(type: string): 'mountain' | 'hill' | 'ridge' | 'cliff' | 'building' | 'tower' {
    switch (type) {
      case 'mountain': return 'mountain';
      case 'hill': return 'hill';
      case 'building': return 'building';
      case 'tower': return 'tower';
      case 'tree-line': return 'ridge'; // Map tree-line to ridge
      default: return 'hill'; // Default fallback
    }
  }

  private calculateSlopeVariation(terrainData: TerrainPoint[]): number {
    const slopes = terrainData.map(p => p.slope || 0);
    return Math.max(...slopes) - Math.min(...slopes);
  }

  private calculateObstacleDensity(terrainData: TerrainPoint[]): number {
    // Simplified obstacle density calculation
    return terrainData.filter(p => (p.slope || 0) > 30).length / terrainData.length;
  }

  private createFallbackResult(basePrediction: PredictionResult): TerrainPredictionResult {
    return {
      ...basePrediction,
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
        burstSiteTerrain: { 
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
        },
        landingSiteTerrain: { 
          position: { latitude: 0, longitude: 0, elevation: 0 }, 
          difficultyRating: 5, 
          difficultyDescription: 'Unknown terrain',
          suitabilityScore: 0.5, 
          accessibilityScore: 0.5, 
          terrainCharacteristics: { 
            averageSlope: 0, 
            maxSlope: 0, 
            terrainRoughness: 0, 
            surfaceType: 'unknown' 
          }, 
          riskFactors: [], 
          recommendations: [] 
        },
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
  }

  private initializeMetrics(): TerrainPredictionMetrics {
    return {
      terrainAnalysisTime: 0,
      elevationDataPoints: 0,
      obstaclesAnalyzed: 0,
      landingSitesEvaluated: 0,
      cacheHitRate: 0,
      memoryUsage: 0
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): TerrainPredictionMetrics {
    return { ...this.metrics };
  }
}
