// Weather quality assessment service for forecast reliability evaluation
// Based on task-12d specifications

export interface WeatherQualityAssessment {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  temporal: 'high' | 'medium' | 'low';
  spatial: 'high' | 'medium' | 'low';
  confidence: number;              // 0-1 scale
  uncertainty: number;             // 0-1 scale
  reliability: {
    forecastAge: number;           // Hours since model run
    forecastHorizon: number;       // Hours into future
    modelConfidence: number;       // Model-specific confidence
    ensembleSpread: number;        // Uncertainty from ensemble data
  };
  issues: string[];                // List of quality issues
  recommendations: string[];       // Improvement suggestions
}

export interface ModelCharacteristics {
  name: string;                    // Model name
  resolution: {
    temporal: number;              // Hours between timesteps
    spatial: number;               // Grid resolution in km
    vertical: number;              // Number of vertical levels
  };
  updateFrequency: number;         // Hours between updates
  skillScores: {
    temperature: number;           // Model skill (0-1)
    pressure: number;
    windSpeed: number;
    windDirection: number;
  };
  maxReliableHorizon: number;      // Hours of reliable forecast
}

export interface QualityRequest {
  forecastTime: string;            // When forecast was generated
  targetTime: string;              // Time for which forecast is needed
  location: { lat: number; lng: number };
  altitudeRange: { min: number; max: number };
  modelUsed: string;
  ensembleData?: {
    memberCount: number;
    spread: number;                // Standard deviation of ensemble
  };
  historicalAccuracy?: {
    recent: number;                // Recent accuracy (0-1)
    seasonal: number;              // Seasonal accuracy (0-1)
  };
}

/**
 * Assess weather forecast quality for specific conditions
 * @param request Quality assessment request
 * @returns Comprehensive quality assessment
 */
export function assessWeatherQuality(request: QualityRequest): WeatherQualityAssessment {
  try {
    // Validate request
    if (!validateQualityRequest(request)) {
      throw new Error('Invalid quality assessment request');
    }

    // Calculate forecast age and horizon
    const forecastTime = new Date(request.forecastTime);
    const targetTime = new Date(request.targetTime);
    const currentTime = new Date();

    const forecastAge = (currentTime.getTime() - forecastTime.getTime()) / (1000 * 60 * 60);
    const forecastHorizon = (targetTime.getTime() - forecastTime.getTime()) / (1000 * 60 * 60);

    // Get model characteristics
    const modelCharacteristics = getModelCharacteristics(request.modelUsed);

    // Assess temporal quality
    const temporalQuality = assessTemporalQuality(forecastHorizon, forecastAge, modelCharacteristics);

    // Assess spatial quality
    const spatialQuality = assessSpatialQuality(request.location, request.altitudeRange, modelCharacteristics);

    // Calculate overall confidence
    const confidence = calculateOverallConfidence(
      temporalQuality,
      spatialQuality,
      request.ensembleData,
      request.historicalAccuracy,
      modelCharacteristics
    );

    // Calculate uncertainty
    const uncertainty = calculateUncertainty(
      forecastHorizon,
      request.ensembleData,
      modelCharacteristics
    );

    // Identify issues and recommendations
    const { issues, recommendations } = identifyQualityIssues(
      forecastAge,
      forecastHorizon,
      temporalQuality,
      spatialQuality,
      confidence,
      modelCharacteristics
    );

    // Determine overall quality rating
    const overall = determineOverallQuality(confidence, temporalQuality.quality, spatialQuality.quality);

    return {
      overall,
      temporal: temporalQuality.quality,
      spatial: spatialQuality.quality,
      confidence,
      uncertainty,
      reliability: {
        forecastAge,
        forecastHorizon,
        modelConfidence: modelCharacteristics.skillScores.temperature, // Use temperature as representative
        ensembleSpread: request.ensembleData?.spread || 0
      },
      issues,
      recommendations
    };
  } catch (error) {
    console.error('Weather quality assessment failed:', error);
    
    // Return conservative assessment
    return {
      overall: 'poor',
      temporal: 'low',
      spatial: 'low',
      confidence: 0.1,
      uncertainty: 0.9,
      reliability: {
        forecastAge: 0,
        forecastHorizon: 0,
        modelConfidence: 0.1,
        ensembleSpread: 1.0
      },
      issues: ['Quality assessment failed'],
      recommendations: ['Use alternative data source or increase safety margins']
    };
  }
}

/**
 * Get model characteristics for quality assessment
 */
function getModelCharacteristics(modelName: string): ModelCharacteristics {
  const modelDatabase: { [key: string]: ModelCharacteristics } = {
    'GFS': {
      name: 'GFS',
      resolution: {
        temporal: 3,
        spatial: 25,
        vertical: 31
      },
      updateFrequency: 6,
      skillScores: {
        temperature: 0.85,
        pressure: 0.90,
        windSpeed: 0.75,
        windDirection: 0.70
      },
      maxReliableHorizon: 168 // 7 days
    },
    'ECMWF': {
      name: 'ECMWF',
      resolution: {
        temporal: 6,
        spatial: 18,
        vertical: 37
      },
      updateFrequency: 12,
      skillScores: {
        temperature: 0.92,
        pressure: 0.95,
        windSpeed: 0.85,
        windDirection: 0.80
      },
      maxReliableHorizon: 240 // 10 days
    },
    'NAM': {
      name: 'NAM',
      resolution: {
        temporal: 1,
        spatial: 12,
        vertical: 40
      },
      updateFrequency: 6,
      skillScores: {
        temperature: 0.88,
        pressure: 0.92,
        windSpeed: 0.80,
        windDirection: 0.75
      },
      maxReliableHorizon: 84 // 3.5 days
    },
    'Open-Meteo': {
      name: 'Open-Meteo',
      resolution: {
        temporal: 1,
        spatial: 11,
        vertical: 25
      },
      updateFrequency: 1,
      skillScores: {
        temperature: 0.80,
        pressure: 0.85,
        windSpeed: 0.72,
        windDirection: 0.68
      },
      maxReliableHorizon: 240 // 10 days
    }
  };

  return modelDatabase[modelName] || {
    name: 'Unknown',
    resolution: { temporal: 6, spatial: 50, vertical: 20 },
    updateFrequency: 12,
    skillScores: { temperature: 0.60, pressure: 0.65, windSpeed: 0.55, windDirection: 0.50 },
    maxReliableHorizon: 72
  };
}

/**
 * Assess temporal quality based on forecast horizon and age
 */
function assessTemporalQuality(
  forecastHorizon: number,
  forecastAge: number,
  model: ModelCharacteristics
): { quality: 'high' | 'medium' | 'low'; score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 1.0;

  // Forecast horizon impact
  if (forecastHorizon <= 24) {
    factors.push('Short-term forecast: high accuracy expected');
    score *= 1.0;
  } else if (forecastHorizon <= 72) {
    factors.push('Medium-term forecast: good accuracy expected');
    score *= 0.85;
  } else if (forecastHorizon <= model.maxReliableHorizon) {
    factors.push('Long-term forecast: moderate accuracy expected');
    score *= 0.65;
  } else {
    factors.push('Beyond reliable forecast horizon');
    score *= 0.35;
  }

  // Forecast age impact
  if (forecastAge <= model.updateFrequency) {
    factors.push('Recent model run: data is fresh');
    score *= 1.0;
  } else if (forecastAge <= model.updateFrequency * 2) {
    factors.push('Moderate age: data still reliable');
    score *= 0.90;
  } else {
    factors.push('Old forecast data: accuracy degraded');
    score *= 0.70;
  }

  // Model update frequency bonus
  if (model.updateFrequency <= 6) {
    factors.push('Frequent model updates improve reliability');
    score *= 1.05;
  }

  // Determine quality rating
  let quality: 'high' | 'medium' | 'low';
  if (score >= 0.8) {
    quality = 'high';
  } else if (score >= 0.5) {
    quality = 'medium';
  } else {
    quality = 'low';
  }

  return { quality, score: Math.min(1.0, score), factors };
}

/**
 * Assess spatial quality based on location and altitude range
 */
function assessSpatialQuality(
  location: { lat: number; lng: number },
  altitudeRange: { min: number; max: number },
  model: ModelCharacteristics
): { quality: 'high' | 'medium' | 'low'; score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 1.0;

  // Model spatial resolution impact
  if (model.resolution.spatial <= 15) {
    factors.push('High spatial resolution model');
    score *= 1.0;
  } else if (model.resolution.spatial <= 30) {
    factors.push('Medium spatial resolution model');
    score *= 0.85;
  } else {
    factors.push('Coarse spatial resolution model');
    score *= 0.70;
  }

  // Geographic location factors
  const { lat, lng } = location;
  
  // Land vs ocean (ocean generally has better model performance)
  if (isOverOcean(lat, lng)) {
    factors.push('Ocean location: typically better model accuracy');
    score *= 1.05;
  } else {
    factors.push('Land location: terrain effects may reduce accuracy');
    score *= 0.95;
  }

  // Latitude effects (mid-latitudes generally have best coverage)
  if (Math.abs(lat) >= 60) {
    factors.push('High latitude: reduced model accuracy');
    score *= 0.85;
  } else if (Math.abs(lat) <= 10) {
    factors.push('Tropical region: convective processes challenging for models');
    score *= 0.90;
  } else {
    factors.push('Mid-latitude location: optimal model performance');
    score *= 1.0;
  }

  // Altitude range considerations
  const altitudeSpan = altitudeRange.max - altitudeRange.min;
  if (altitudeSpan > 20000) {
    factors.push('Large altitude range: increased interpolation uncertainty');
    score *= 0.85;
  } else if (altitudeSpan > 10000) {
    factors.push('Moderate altitude range: some interpolation uncertainty');
    score *= 0.92;
  } else {
    factors.push('Small altitude range: minimal interpolation uncertainty');
    score *= 1.0;
  }

  // High altitude effects
  if (altitudeRange.max > 30000) {
    factors.push('Very high altitude: sparse observational data');
    score *= 0.80;
  } else if (altitudeRange.max > 20000) {
    factors.push('High altitude: reduced model accuracy');
    score *= 0.90;
  }

  // Vertical resolution impact
  if (model.resolution.vertical >= 35) {
    factors.push('High vertical resolution: good altitude interpolation');
    score *= 1.0;
  } else if (model.resolution.vertical >= 25) {
    factors.push('Adequate vertical resolution');
    score *= 0.95;
  } else {
    factors.push('Limited vertical resolution');
    score *= 0.85;
  }

  // Determine quality rating
  let quality: 'high' | 'medium' | 'low';
  if (score >= 0.8) {
    quality = 'high';
  } else if (score >= 0.6) {
    quality = 'medium';
  } else {
    quality = 'low';
  }

  return { quality, score: Math.min(1.0, score), factors };
}

/**
 * Calculate overall confidence from multiple factors
 */
function calculateOverallConfidence(
  temporal: { score: number },
  spatial: { score: number },
  ensembleData?: { memberCount: number; spread: number },
  historicalAccuracy?: { recent: number; seasonal: number },
  model?: ModelCharacteristics
): number {
  // Base confidence from temporal and spatial quality
  let confidence = (temporal.score * 0.6 + spatial.score * 0.4);

  // Ensemble data bonus
  if (ensembleData) {
    if (ensembleData.memberCount >= 20) {
      confidence *= 1.1; // Good ensemble size
    } else if (ensembleData.memberCount >= 10) {
      confidence *= 1.05; // Adequate ensemble size
    }

    // Lower spread means higher confidence
    const spreadFactor = Math.max(0.7, 1.0 - ensembleData.spread);
    confidence *= spreadFactor;
  }

  // Historical accuracy factor
  if (historicalAccuracy) {
    const historicalFactor = (historicalAccuracy.recent * 0.7 + historicalAccuracy.seasonal * 0.3);
    confidence = (confidence * 0.8) + (historicalFactor * 0.2);
  }

  // Model skill factor
  if (model) {
    const avgSkill = (
      model.skillScores.temperature + 
      model.skillScores.pressure + 
      model.skillScores.windSpeed + 
      model.skillScores.windDirection
    ) / 4;
    confidence = (confidence * 0.9) + (avgSkill * 0.1);
  }

  return Math.max(0.0, Math.min(1.0, confidence));
}

/**
 * Calculate uncertainty from various sources
 */
function calculateUncertainty(
  forecastHorizon: number,
  ensembleData?: { memberCount: number; spread: number },
  model?: ModelCharacteristics
): number {
  let uncertainty = 0.1; // Base uncertainty

  // Forecast horizon uncertainty
  if (forecastHorizon <= 24) {
    uncertainty += 0.05;
  } else if (forecastHorizon <= 72) {
    uncertainty += 0.15;
  } else if (forecastHorizon <= 168) {
    uncertainty += 0.30;
  } else {
    uncertainty += 0.50;
  }

  // Ensemble spread contribution
  if (ensembleData) {
    uncertainty += ensembleData.spread * 0.3;
  } else {
    uncertainty += 0.2; // No ensemble data penalty
  }

  // Model uncertainty
  if (model) {
    const avgSkill = (
      model.skillScores.temperature + 
      model.skillScores.pressure + 
      model.skillScores.windSpeed + 
      model.skillScores.windDirection
    ) / 4;
    uncertainty += (1.0 - avgSkill) * 0.2;
  }

  return Math.max(0.0, Math.min(1.0, uncertainty));
}

/**
 * Identify quality issues and provide recommendations
 */
function identifyQualityIssues(
  forecastAge: number,
  forecastHorizon: number,
  temporal: { quality: string; factors: string[] },
  spatial: { quality: string; factors: string[] },
  confidence: number,
  model: ModelCharacteristics
): { issues: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Forecast age issues
  if (forecastAge > model.updateFrequency * 2) {
    issues.push('Forecast data is outdated');
    recommendations.push('Use more recent model run if available');
  }

  // Forecast horizon issues
  if (forecastHorizon > model.maxReliableHorizon) {
    issues.push('Forecast beyond reliable horizon');
    recommendations.push('Consider using ensemble data or increase uncertainty margins');
  }

  // Low confidence issues
  if (confidence < 0.5) {
    issues.push('Overall confidence is low');
    recommendations.push('Consider delaying launch or using alternative weather sources');
  } else if (confidence < 0.7) {
    issues.push('Moderate confidence level');
    recommendations.push('Increase safety margins and monitor weather updates');
  }

  // Temporal quality issues
  if (temporal.quality === 'low') {
    issues.push('Poor temporal quality');
    recommendations.push('Use shorter forecast horizon or wait for updated model run');
  }

  // Spatial quality issues
  if (spatial.quality === 'low') {
    issues.push('Poor spatial quality');
    recommendations.push('Consider higher resolution model or local weather observations');
  }

  // Model-specific recommendations
  if (model.name === 'Unknown') {
    issues.push('Unknown model characteristics');
    recommendations.push('Use established weather models with known performance');
  }

  // General recommendations
  if (issues.length === 0) {
    recommendations.push('Weather data quality is acceptable for balloon predictions');
  }

  return { issues, recommendations };
}

/**
 * Determine overall quality rating
 */
function determineOverallQuality(
  confidence: number,
  temporal: string,
  spatial: string
): 'excellent' | 'good' | 'fair' | 'poor' {
  const temporalScore = temporal === 'high' ? 3 : temporal === 'medium' ? 2 : 1;
  const spatialScore = spatial === 'high' ? 3 : spatial === 'medium' ? 2 : 1;
  const confidenceScore = confidence >= 0.8 ? 3 : confidence >= 0.6 ? 2 : 1;

  const totalScore = (temporalScore + spatialScore + confidenceScore) / 3;

  if (totalScore >= 2.7) return 'excellent';
  if (totalScore >= 2.3) return 'good';
  if (totalScore >= 1.7) return 'fair';
  return 'poor';
}

/**
 * Simple check if coordinates are over ocean (very basic implementation)
 */
function isOverOcean(lat: number, lng: number): boolean {
  // Very simplified - in production, use a proper land/sea mask
  // This is just a rough approximation for major ocean areas
  
  // Pacific Ocean
  if (lng >= -180 && lng <= -60 && lat >= -60 && lat <= 60) return true;
  if (lng >= 120 && lng <= 180 && lat >= -60 && lat <= 60) return true;
  
  // Atlantic Ocean
  if (lng >= -60 && lng <= 20 && lat >= -60 && lat <= 70) return true;
  
  // Indian Ocean
  if (lng >= 20 && lng <= 120 && lat >= -60 && lat <= 30) return true;
  
  return false;
}

/**
 * Validate quality assessment request
 */
function validateQualityRequest(request: QualityRequest): boolean {
  if (!request.forecastTime || isNaN(Date.parse(request.forecastTime))) {
    return false;
  }

  if (!request.targetTime || isNaN(Date.parse(request.targetTime))) {
    return false;
  }

  if (!request.location || 
      request.location.lat < -90 || request.location.lat > 90 ||
      request.location.lng < -180 || request.location.lng > 180) {
    return false;
  }

  if (!request.altitudeRange ||
      request.altitudeRange.min < 0 ||
      request.altitudeRange.max <= request.altitudeRange.min) {
    return false;
  }

  if (!request.modelUsed) {
    return false;
  }

  return true;
} 