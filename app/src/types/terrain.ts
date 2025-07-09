// Terrain analysis type definitions for landing site difficulty assessment

export interface TerrainAnalysisInput {
  coordinates: Array<{
    latitude: number;
    longitude: number;
    elevation: number;
  }>;
  analysisRadius: number;    // meters - radius around each point to analyze
  resolution: number;        // meters - grid resolution for analysis
}

export interface TerrainPoint {
  latitude: number;
  longitude: number;
  elevation: number;
  slope: number;            // degrees
  roughness: number;        // terrain roughness index (0-1)
  accessibility: number;    // accessibility score (0-1)
}

export interface SlopeCalculation {
  slopeAngle: number;       // degrees (0-90)
  slopeDirection: number;   // degrees (0-360, 0=North)
  gradient: number;         // rise/run ratio
  steepnessCategory: 'flat' | 'gentle' | 'moderate' | 'steep' | 'very-steep' | 'cliff';
}

export interface ElevationProfile {
  points: Array<{
    distance: number;       // meters from start
    elevation: number;      // meters above sea level
    latitude: number;
    longitude: number;
  }>;
  totalDistance: number;    // meters
  elevationGain: number;    // meters
  elevationLoss: number;    // meters
  maxElevation: number;     // meters
  minElevation: number;     // meters
  averageSlope: number;     // degrees
}

export interface TerrainFeature {
  type: 'mountain' | 'hill' | 'valley' | 'ridge' | 'plateau' | 'depression';
  centerPoint: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  prominence: number;       // meters - height above surrounding terrain
  area: number;            // square meters
  boundingBox: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface TerrainObstacle {
  type: 'mountain' | 'hill' | 'building' | 'tower' | 'tree-line';
  height: number;          // meters above ground
  position: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  radius: number;          // meters - obstacle radius
  clearanceRequired: number; // meters - minimum clearance needed
}

export interface LandingSiteAnalysis {
  position: {
    latitude: number;
    longitude: number;
    elevation: number;
  };
  difficultyRating: number;        // 1-10 scale
  difficultyDescription: string;   // human-readable description
  suitabilityScore: number;        // 0-1 scale (1 = ideal)
  accessibilityScore: number;      // 0-1 scale (1 = highly accessible)
  terrainCharacteristics: {
    averageSlope: number;          // degrees
    maxSlope: number;              // degrees
    terrainRoughness: number;      // 0-1 scale
    vegetationDensity?: number;    // 0-1 scale (if available)
    surfaceType: 'grass' | 'dirt' | 'rock' | 'sand' | 'water' | 'urban' | 'forest' | 'unknown';
  };
  riskFactors: string[];           // array of identified risks
  recommendations: string[];       // array of recommendations
}

export interface TerrainAnalysisResult {
  analysisId: string;
  timestamp: string;
  inputParameters: TerrainAnalysisInput;
  terrainPoints: TerrainPoint[];
  elevationProfile: ElevationProfile;
  detectedFeatures: TerrainFeature[];
  detectedObstacles: TerrainObstacle[];
  landingSites: LandingSiteAnalysis[];
  overallDifficulty: {
    rating: number;                // 1-10 scale
    description: string;
    confidence: number;            // 0-1 scale
  };
  performanceMetrics: {
    analysisTime: number;          // milliseconds
    pointsAnalyzed: number;
    featuresDetected: number;
    obstaclesDetected: number;
  };
}

export interface TerrainAnalysisConfig {
  slopeThresholds: {
    flat: number;          // < 5 degrees
    gentle: number;        // 5-15 degrees
    moderate: number;      // 15-25 degrees
    steep: number;         // 25-45 degrees
    verysteep: number;     // 45-70 degrees
    cliff: number;         // > 70 degrees
  };
  difficultyWeights: {
    slope: number;         // 0.4
    roughness: number;     // 0.3
    accessibility: number; // 0.2
    obstacles: number;     // 0.1
  };
  analysisResolution: number;      // 10 meters default
  minLandingSiteSize: number;      // 100 meters default
  obstacleDetectionThreshold: number; // 10 meters height
}

// Error types
export class TerrainAnalysisError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'TerrainAnalysisError';
  }
}

export class InsufficientDataError extends TerrainAnalysisError {
  constructor(message: string, details?: any) {
    super(message, 'INSUFFICIENT_DATA', details);
    this.name = 'InsufficientDataError';
  }
}

export class InvalidParametersError extends TerrainAnalysisError {
  constructor(message: string, details?: any) {
    super(message, 'INVALID_PARAMETERS', details);
    this.name = 'InvalidParametersError';
  }
}
