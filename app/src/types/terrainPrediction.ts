// Terrain-enhanced prediction types for balloon trajectory calculation
// Based on task-30d specifications

import { 
  PredictionInput, 
  PredictionResult 
} from '../algorithms/predictionEngine';
import { 
  TerrainCharacteristics, 
  LandingSiteAnalysis, 
  TerrainPoint,
  ElevationProfile 
} from './terrain';

/**
 * Extended prediction input with terrain configuration
 */
export interface TerrainPredictionInput extends PredictionInput {
  terrainConfig: TerrainConfig;
  elevationData?: TerrainPoint[];
}

/**
 * Terrain configuration for prediction calculations
 */
export interface TerrainConfig {
  enableTerrainAnalysis: boolean;
  terrainResolution: number;        // meters per data point
  analysisRadius: number;           // km around trajectory
  obstacleAvoidance: boolean;
  landingSiteFiltering: boolean;
  burstHeightAdjustment: boolean;
  maxTerrainObstacleHeight: number; // meters
  minLandingSiteDistance: number;   // km from obstacles
}

/**
 * Enhanced prediction result with terrain analysis
 */
export interface TerrainPredictionResult extends PredictionResult {
  terrain: TerrainAnalysisResult;
  adjustedPredictions: TerrainAdjustments;
  landingSiteRecommendations: LandingSiteRecommendation[];
  terrainWarnings: TerrainWarning[];
}

/**
 * Terrain analysis results for the prediction
 */
export interface TerrainAnalysisResult {
  trajectoryTerrain: ElevationProfile;
  burstSiteTerrain: TerrainCharacteristics;
  landingSiteTerrain: LandingSiteAnalysis;
  obstaclesDetected: TerrainObstacle[];
  terrainComplexity: TerrainComplexity;
  elevationStats: ElevationStatistics;
}

/**
 * Terrain-based adjustments to predictions
 */
export interface TerrainAdjustments {
  burstHeightAdjustment: number;    // meters added/subtracted
  trajectoryDeviation: number;      // degrees from original path
  landingSiteShift: {
    latitudeShift: number;          // degrees
    longitudeShift: number;         // degrees
    distanceShift: number;          // km
  };
  confidenceAdjustment: number;     // factor applied to confidence
  flightTimeAdjustment: number;     // seconds added/subtracted
}

/**
 * Landing site recommendation with terrain evaluation
 */
export interface LandingSiteRecommendation {
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  suitability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';
  difficultyRating: number;         // 1-10 scale
  accessibility: 'easy' | 'moderate' | 'difficult' | 'very_difficult';
  terrainFeatures: string[];
  riskFactors: string[];
  recommendations: string[];
  distanceFromPredicted: number;    // km
  confidence: number;               // 0-1
}

/**
 * Terrain warning for flight safety
 */
export interface TerrainWarning {
  type: 'obstacle' | 'cliff' | 'water' | 'urban' | 'restricted';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  description: string;
  recommendation: string;
  affectedPhase: 'ascent' | 'descent' | 'landing';
}

/**
 * Terrain obstacle information
 */
export interface TerrainObstacle {
  type: 'mountain' | 'hill' | 'ridge' | 'cliff' | 'building' | 'tower';
  location: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  height: number;                   // meters above ground
  clearanceRequired: number;        // meters
  impact: 'minor' | 'moderate' | 'major' | 'blocking';
  avoidanceRecommendation: string;
}

/**
 * Terrain complexity assessment
 */
export interface TerrainComplexity {
  overall: 'flat' | 'gentle' | 'moderate' | 'mountainous' | 'extreme';
  roughness: number;                // 0-1 scale
  elevationVariation: number;       // meters
  slopeVariation: number;           // degrees
  obstaclesDensity: number;         // obstacles per km²
  predictabilityFactor: number;     // 0-1 scale
}

/**
 * Elevation statistics for the trajectory
 */
export interface ElevationStatistics {
  minElevation: number;             // meters
  maxElevation: number;             // meters
  averageElevation: number;         // meters
  elevationGain: number;            // meters
  elevationLoss: number;            // meters
  steepestSlope: number;            // degrees
  flattenessRatio: number;          // 0-1 scale
}

/**
 * Terrain prediction performance metrics
 */
export interface TerrainPredictionMetrics {
  terrainAnalysisTime: number;      // milliseconds
  elevationDataPoints: number;
  obstaclesAnalyzed: number;
  landingSitesEvaluated: number;
  cacheHitRate: number;             // 0-1
  memoryUsage: number;              // MB
}

/**
 * Terrain prediction configuration options
 */
export interface TerrainPredictionOptions {
  enableCaching: boolean;
  parallelProcessing: boolean;
  progressiveAnalysis: boolean;     // coarse → fine resolution
  maxProcessingTime: number;        // milliseconds
  fallbackToBasicPrediction: boolean;
  logTerrainInfluence: boolean;
}

/**
 * Terrain-based prediction confidence factors
 */
export interface TerrainConfidenceFactors {
  elevationDataQuality: number;     // 0-1
  terrainModelAccuracy: number;     // 0-1
  obstacleDetectionReliability: number; // 0-1
  landingSitePredictability: number; // 0-1
  weatherTerrainInteraction: number; // 0-1
}

/**
 * Terrain prediction validation result
 */
export interface TerrainPredictionValidation {
  isValid: boolean;
  terrainDataAvailable: boolean;
  configurationValid: boolean;
  elevationDataSufficient: boolean;
  issues: Array<{
    type: 'warning' | 'error';
    message: string;
    field?: string;
  }>;
}
