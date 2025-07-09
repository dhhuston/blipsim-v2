// Terrain analysis algorithms for balloon landing site assessment
// Based on task-30c specifications

import {
  TerrainAnalysisInput,
  TerrainAnalysisResult,
  TerrainPoint,
  SlopeCalculation,
  ElevationProfile,
  TerrainFeature,
  TerrainObstacle,
  LandingSiteAnalysis,
  TerrainAnalysisConfig,
  TerrainAnalysisError,
  InsufficientDataError,
  InvalidParametersError
} from '../types/terrain';

// Default configuration
const DEFAULT_CONFIG: TerrainAnalysisConfig = {
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
  analysisResolution: 10, // meters
  minLandingSiteSize: 100, // meters
  obstacleDetectionThreshold: 10 // meters
};

/**
 * Calculate slope between two points using elevation and distance
 */
export function calculateSlope(
  point1: { latitude: number; longitude: number; elevation: number },
  point2: { latitude: number; longitude: number; elevation: number }
): SlopeCalculation {
  // Calculate distance using Haversine formula
  const distance = calculateDistance(point1, point2);
  
  if (distance === 0) {
    return {
      slopeAngle: 0,
      slopeDirection: 0,
      gradient: 0,
      steepnessCategory: 'flat'
    };
  }

  // Calculate elevation difference
  const elevationDiff = point2.elevation - point1.elevation;
  
  // Calculate gradient (rise/run)
  const gradient = elevationDiff / distance;
  
  // Calculate slope angle in degrees
  const slopeAngle = Math.abs(Math.atan(gradient) * (180 / Math.PI));
  
  // Calculate slope direction (bearing from point1 to point2)
  const slopeDirection = calculateBearing(point1, point2);
  
  // Categorize steepness
  const steepnessCategory = categorizeSteepness(slopeAngle);

  return {
    slopeAngle,
    slopeDirection,
    gradient,
    steepnessCategory
  };
}

/**
 * Calculate distance between two geographic points in meters
 */
export function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = point1.latitude * (Math.PI / 180);
  const lat2Rad = point2.latitude * (Math.PI / 180);
  const deltaLatRad = (point2.latitude - point1.latitude) * (Math.PI / 180);
  const deltaLngRad = (point2.longitude - point1.longitude) * (Math.PI / 180);

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing between two points in degrees (0-360)
 */
export function calculateBearing(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const lat1Rad = point1.latitude * (Math.PI / 180);
  const lat2Rad = point2.latitude * (Math.PI / 180);
  const deltaLngRad = (point2.longitude - point1.longitude) * (Math.PI / 180);

  const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);

  const bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

/**
 * Categorize slope steepness based on angle
 */
export function categorizeSteepness(slopeAngle: number): SlopeCalculation['steepnessCategory'] {
  const config = DEFAULT_CONFIG.slopeThresholds;
  
  if (slopeAngle < config.flat) return 'flat';
  if (slopeAngle < config.gentle) return 'gentle';
  if (slopeAngle < config.moderate) return 'moderate';
  if (slopeAngle < config.steep) return 'steep';
  if (slopeAngle < config.verysteep) return 'very-steep';
  return 'cliff';
}

/**
 * Calculate terrain roughness index for a set of points
 */
export function calculateTerrainRoughness(points: Array<{ elevation: number }>): number {
  if (points.length < 2) return 0;

  // Calculate standard deviation of elevations
  const elevations = points.map(p => p.elevation);
  const mean = elevations.reduce((sum, elev) => sum + elev, 0) / elevations.length;
  const variance = elevations.reduce((sum, elev) => sum + Math.pow(elev - mean, 2), 0) / elevations.length;
  const stdDev = Math.sqrt(variance);

  // Normalize to 0-1 scale (using 50m as max expected std dev)
  return Math.min(stdDev / 50, 1);
}

/**
 * Generate elevation profile along a path
 */
export function generateElevationProfile(
  points: Array<{ latitude: number; longitude: number; elevation: number }>
): ElevationProfile {
  if (points.length < 2) {
    throw new InsufficientDataError('At least 2 points required for elevation profile');
  }

  const profilePoints = [];
  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let maxElevation = points[0].elevation;
  let minElevation = points[0].elevation;

  // First point
  profilePoints.push({
    distance: 0,
    elevation: points[0].elevation,
    latitude: points[0].latitude,
    longitude: points[0].longitude
  });

  // Calculate cumulative distances and elevation changes
  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(points[i - 1], points[i]);
    totalDistance += distance;

    const elevationChange = points[i].elevation - points[i - 1].elevation;
    if (elevationChange > 0) {
      elevationGain += elevationChange;
    } else {
      elevationLoss += Math.abs(elevationChange);
    }

    maxElevation = Math.max(maxElevation, points[i].elevation);
    minElevation = Math.min(minElevation, points[i].elevation);

    profilePoints.push({
      distance: totalDistance,
      elevation: points[i].elevation,
      latitude: points[i].latitude,
      longitude: points[i].longitude
    });
  }

  // Calculate average slope
  const totalElevationChange = Math.abs(points[points.length - 1].elevation - points[0].elevation);
  const averageSlope = totalDistance > 0 ? Math.atan(totalElevationChange / totalDistance) * (180 / Math.PI) : 0;

  return {
    points: profilePoints,
    totalDistance,
    elevationGain,
    elevationLoss,
    maxElevation,
    minElevation,
    averageSlope
  };
}

/**
 * Detect terrain features (peaks, valleys, etc.)
 */
export function detectTerrainFeatures(
  points: Array<{ latitude: number; longitude: number; elevation: number }>,
  analysisRadius: number = 1000
): TerrainFeature[] {
  const features: TerrainFeature[] = [];
  
  // Simple peak detection using local maxima
  for (let i = 0; i < points.length; i++) {
    const currentPoint = points[i];
    const nearbyPoints = points.filter(p => 
      calculateDistance(currentPoint, p) <= analysisRadius
    );

    if (nearbyPoints.length < 3) continue;

    const sortedByElevation = nearbyPoints.sort((a, b) => b.elevation - a.elevation);
    const isLocalMaximum = sortedByElevation[0] === currentPoint;
    const prominence = currentPoint.elevation - sortedByElevation[Math.floor(sortedByElevation.length / 2)].elevation;

    if (isLocalMaximum && prominence > 50) { // 50m minimum prominence
      const featureType = prominence > 300 ? 'mountain' : 'hill';
      
      features.push({
        type: featureType,
        centerPoint: {
          latitude: currentPoint.latitude,
          longitude: currentPoint.longitude,
          elevation: currentPoint.elevation
        },
        prominence,
        area: Math.PI * Math.pow(analysisRadius, 2), // Approximate area
        boundingBox: calculateBoundingBox(nearbyPoints)
      });
    }
  }

  return features;
}

/**
 * Calculate bounding box for a set of points
 */
function calculateBoundingBox(points: Array<{ latitude: number; longitude: number }>): {
  north: number; south: number; east: number; west: number;
} {
  const latitudes = points.map(p => p.latitude);
  const longitudes = points.map(p => p.longitude);

  return {
    north: Math.max(...latitudes),
    south: Math.min(...latitudes),
    east: Math.max(...longitudes),
    west: Math.min(...longitudes)
  };
}

/**
 * Detect terrain obstacles that could affect landing
 */
export function detectTerrainObstacles(
  points: Array<{ latitude: number; longitude: number; elevation: number }>,
  config: TerrainAnalysisConfig = DEFAULT_CONFIG
): TerrainObstacle[] {
  const obstacles: TerrainObstacle[] = [];

  for (let i = 0; i < points.length; i++) {
    const currentPoint = points[i];
    
    // Find nearby points to establish baseline elevation
    const nearbyPoints = points.filter(p => {
      const distance = calculateDistance(currentPoint, p);
      return distance > 0 && distance <= 100; // 100m radius
    });

    if (nearbyPoints.length === 0) continue;

    const baselineElevation = nearbyPoints.reduce((sum, p) => sum + p.elevation, 0) / nearbyPoints.length;
    const relativeHeight = currentPoint.elevation - baselineElevation;

    if (relativeHeight >= config.obstacleDetectionThreshold) {
      obstacles.push({
        type: relativeHeight > 100 ? 'mountain' : 'hill',
        height: relativeHeight,
        position: {
          latitude: currentPoint.latitude,
          longitude: currentPoint.longitude,
          elevation: currentPoint.elevation
        },
        radius: 50, // Default obstacle radius
        clearanceRequired: relativeHeight + 20 // Add safety margin
      });
    }
  }

  return obstacles;
}

/**
 * Calculate landing site difficulty rating (1-10 scale)
 */
export function calculateDifficultyRating(
  terrainPoint: TerrainPoint,
  nearbyObstacles: TerrainObstacle[],
  config: TerrainAnalysisConfig = DEFAULT_CONFIG
): { rating: number; description: string } {
  const weights = config.difficultyWeights;
  
  // Normalize slope (0-1, where 1 is very difficult)
  const slopeScore = Math.min(terrainPoint.slope / 45, 1); // 45° = max difficulty
  
  // Roughness is already 0-1
  const roughnessScore = terrainPoint.roughness;
  
  // Accessibility (inverted, so low accessibility = high difficulty)
  const accessibilityScore = 1 - terrainPoint.accessibility;
  
  // Obstacle score based on nearby obstacles
  const obstacleScore = Math.min(nearbyObstacles.length / 5, 1); // 5+ obstacles = max difficulty

  // Weighted combination
  const combinedScore = 
    (slopeScore * weights.slope) +
    (roughnessScore * weights.roughness) +
    (accessibilityScore * weights.accessibility) +
    (obstacleScore * weights.obstacles);

  // Convert to 1-10 scale
  const rating = Math.max(1, Math.min(10, Math.round(1 + combinedScore * 9)));

  // Generate description
  const description = getDifficultyDescription(rating);

  return { rating, description };
}

/**
 * Get human-readable difficulty description
 */
function getDifficultyDescription(rating: number): string {
  const descriptions = {
    1: 'Very Easy - Ideal landing conditions',
    2: 'Easy - Excellent landing site',
    3: 'Easy - Good landing conditions',
    4: 'Moderate - Generally suitable',
    5: 'Moderate - Some challenges present',
    6: 'Challenging - Requires careful approach',
    7: 'Difficult - Significant obstacles present',
    8: 'Very Difficult - High risk landing',
    9: 'Extremely Difficult - Emergency only',
    10: 'Unsuitable - Avoid if possible'
  };

  return descriptions[rating as keyof typeof descriptions] || 'Unknown difficulty';
}

/**
 * Analyze a specific landing site
 */
export function analyzeLandingSite(
  position: { latitude: number; longitude: number; elevation: number },
  surroundingPoints: Array<{ latitude: number; longitude: number; elevation: number }>,
  config: TerrainAnalysisConfig = DEFAULT_CONFIG
): LandingSiteAnalysis {
  // Calculate terrain characteristics
  const slopes = surroundingPoints.map(point => calculateSlope(position, point));
  const averageSlope = slopes.reduce((sum, slope) => sum + slope.slopeAngle, 0) / slopes.length;
  const maxSlope = Math.max(...slopes.map(slope => slope.slopeAngle));
  const terrainRoughness = calculateTerrainRoughness(surroundingPoints);

  // Create terrain point for difficulty calculation
  const terrainPoint: TerrainPoint = {
    latitude: position.latitude,
    longitude: position.longitude,
    elevation: position.elevation,
    slope: averageSlope,
    roughness: terrainRoughness,
    accessibility: calculateAccessibilityScore(position, surroundingPoints)
  };

  // Detect nearby obstacles
  const obstacles = detectTerrainObstacles(surroundingPoints, config);
  const nearbyObstacles = obstacles.filter(obstacle => 
    calculateDistance(position, obstacle.position) <= 500 // 500m radius
  );

  // Calculate difficulty rating
  const difficulty = calculateDifficultyRating(terrainPoint, nearbyObstacles, config);

  // Calculate suitability score (inverse of difficulty, normalized)
  const suitabilityScore = Math.max(0, (11 - difficulty.rating) / 10);

  // Identify risk factors
  const riskFactors = identifyRiskFactors(terrainPoint, nearbyObstacles);

  // Generate recommendations
  const recommendations = generateRecommendations(terrainPoint, nearbyObstacles, difficulty.rating);

  return {
    position,
    difficultyRating: difficulty.rating,
    difficultyDescription: difficulty.description,
    suitabilityScore,
    accessibilityScore: terrainPoint.accessibility,
    terrainCharacteristics: {
      averageSlope,
      maxSlope,
      terrainRoughness,
      surfaceType: 'unknown' // Would require additional data sources
    },
    riskFactors,
    recommendations
  };
}

/**
 * Calculate accessibility score based on terrain
 */
function calculateAccessibilityScore(
  position: { latitude: number; longitude: number; elevation: number },
  surroundingPoints: Array<{ latitude: number; longitude: number; elevation: number }>
): number {
  // Simple accessibility calculation based on slope and roughness
  const slopes = surroundingPoints.map(point => calculateSlope(position, point));
  const averageSlope = slopes.reduce((sum, slope) => sum + slope.slopeAngle, 0) / slopes.length;
  const roughness = calculateTerrainRoughness(surroundingPoints);

  // Higher slopes and roughness reduce accessibility
  const slopeAccessibility = Math.max(0, 1 - (averageSlope / 30)); // 30° = poor accessibility
  const roughnessAccessibility = Math.max(0, 1 - roughness);

  return (slopeAccessibility + roughnessAccessibility) / 2;
}

/**
 * Identify risk factors for landing site
 */
function identifyRiskFactors(terrainPoint: TerrainPoint, obstacles: TerrainObstacle[]): string[] {
  const risks: string[] = [];

  if (terrainPoint.slope > 25) {
    risks.push('Steep terrain - landing approach may be difficult');
  }

  if (terrainPoint.roughness > 0.7) {
    risks.push('Rough terrain - potential for payload damage');
  }

  if (terrainPoint.accessibility < 0.3) {
    risks.push('Poor accessibility - recovery may be challenging');
  }

  if (obstacles.length > 2) {
    risks.push('Multiple terrain obstacles - increased collision risk');
  }

  const tallObstacles = obstacles.filter(obs => obs.height > 50);
  if (tallObstacles.length > 0) {
    risks.push('Tall terrain features - may affect descent trajectory');
  }

  return risks;
}

/**
 * Generate recommendations for landing site
 */
function generateRecommendations(
  terrainPoint: TerrainPoint,
  obstacles: TerrainObstacle[],
  difficultyRating: number
): string[] {
  const recommendations: string[] = [];

  if (difficultyRating <= 3) {
    recommendations.push('Excellent landing site - no special precautions needed');
  } else if (difficultyRating <= 6) {
    recommendations.push('Monitor weather conditions closely');
    recommendations.push('Ensure recovery team has appropriate equipment');
  } else {
    recommendations.push('Consider alternative landing sites if possible');
    recommendations.push('Use experienced recovery team');
    recommendations.push('Monitor descent carefully for trajectory adjustments');
  }

  if (terrainPoint.slope > 20) {
    recommendations.push('Account for slope in recovery vehicle planning');
  }

  if (obstacles.length > 0) {
    recommendations.push('Brief recovery team on terrain obstacles');
  }

  return recommendations;
}

/**
 * Main terrain analysis function
 */
export async function analyzeTerrainCharacteristics(
  input: TerrainAnalysisInput,
  config: TerrainAnalysisConfig = DEFAULT_CONFIG
): Promise<TerrainAnalysisResult> {
  const startTime = Date.now();

  // Validate input
  if (!input.coordinates || input.coordinates.length < 3) {
    throw new InsufficientDataError('At least 3 coordinate points required for terrain analysis');
  }

  if (input.analysisRadius <= 0 || input.resolution <= 0) {
    throw new InvalidParametersError('Analysis radius and resolution must be positive numbers');
  }

  try {
    // Analyze each terrain point
    const terrainPoints: TerrainPoint[] = input.coordinates.map(point => {
      const nearbyPoints = input.coordinates.filter(p => 
        calculateDistance(point, p) <= input.analysisRadius
      );

      const slopes = nearbyPoints
        .filter(p => p !== point)
        .map(p => calculateSlope(point, p));
      
      const averageSlope = slopes.length > 0 
        ? slopes.reduce((sum, slope) => sum + slope.slopeAngle, 0) / slopes.length 
        : 0;

      return {
        latitude: point.latitude,
        longitude: point.longitude,
        elevation: point.elevation,
        slope: averageSlope,
        roughness: calculateTerrainRoughness(nearbyPoints),
        accessibility: calculateAccessibilityScore(point, nearbyPoints)
      };
    });

    // Generate elevation profile
    const elevationProfile = generateElevationProfile(input.coordinates);

    // Detect terrain features
    const detectedFeatures = detectTerrainFeatures(input.coordinates, input.analysisRadius);

    // Detect obstacles
    const detectedObstacles = detectTerrainObstacles(input.coordinates, config);

    // Analyze potential landing sites (use points with good characteristics)
    const landingSites = terrainPoints
      .filter(point => point.slope < 30 && point.accessibility > 0.3)
      .map(point => {
        const surroundingPoints = input.coordinates.filter(coord =>
          calculateDistance(point, coord) <= config.minLandingSiteSize
        );
        return analyzeLandingSite(point, surroundingPoints, config);
      })
      .sort((a, b) => a.difficultyRating - b.difficultyRating) // Sort by difficulty (easiest first)
      .slice(0, 10); // Top 10 sites

    // Calculate overall difficulty
    const avgDifficulty = landingSites.length > 0
      ? landingSites.reduce((sum, site) => sum + site.difficultyRating, 0) / landingSites.length
      : 8; // High difficulty if no suitable sites found

    const overallDifficulty = {
      rating: Math.round(avgDifficulty),
      description: getDifficultyDescription(Math.round(avgDifficulty)),
      confidence: Math.min(landingSites.length / 5, 1) // More sites = higher confidence
    };

    const endTime = Date.now();

    return {
      analysisId: `terrain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      inputParameters: input,
      terrainPoints,
      elevationProfile,
      detectedFeatures,
      detectedObstacles,
      landingSites,
      overallDifficulty,
      performanceMetrics: {
        analysisTime: endTime - startTime,
        pointsAnalyzed: terrainPoints.length,
        featuresDetected: detectedFeatures.length,
        obstaclesDetected: detectedObstacles.length
      }
    };

  } catch (error) {
    if (error instanceof TerrainAnalysisError) {
      throw error;
    }
    throw new TerrainAnalysisError(
      `Terrain analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'ANALYSIS_FAILED',
      { originalError: error }
    );
  }
}
