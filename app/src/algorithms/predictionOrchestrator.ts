// Unified Prediction Engine Orchestrator
// Based on task-11g specifications

import { 
  PredictionRequest, 
  PredictionResult, 
  ProcessingStatus, 
  PerformanceMetrics, 
  AlgorithmInput, 
  AlgorithmResult, 
  WeatherData, 
  WeatherWindow,
  CacheKey,
  CachedResult 
} from '../types/orchestrationTypes';

import { validatePredictionInput } from './inputValidator';
import { processResults } from './resultsProcessor';
import { 
  handlePredictionError, 
  executeFallbackPrediction, 
  createOrchestrationError 
} from './errorHandler';

// Import existing algorithm modules
import { calculateAscent, AscentInput } from './ascent';
import { predictBurstSite, BurstSiteInput } from './burstSite';

// Import weather and time-based services
import { WeatherIntegrationService } from '../services/weatherIntegration';
import { selectWeatherData } from '../services/weatherSelector';
import { WeatherService } from '../services/weatherService';

// Cache for storing prediction results
const predictionCache = new Map<string, CachedResult>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Main prediction orchestrator - coordinates all components
 */
export class PredictionOrchestrator {
  private weatherService: WeatherService;
  private weatherIntegration: WeatherIntegrationService;
  private performanceMetrics: PerformanceMetrics;
  private processingStatus: ProcessingStatus;

  constructor() {
    this.weatherService = new WeatherService();
    this.weatherIntegration = new WeatherIntegrationService({
      weatherService: this.weatherService
    });
    this.performanceMetrics = this.initializeMetrics();
    this.processingStatus = {
      phase: 'validation',
      progress: 0,
      message: 'Initializing prediction'
    };
  }

  /**
   * Executes complete prediction workflow
   */
  async executePrediction(request: PredictionRequest): Promise<PredictionResult> {
    const startTime = Date.now();
    this.performanceMetrics = this.initializeMetrics();
    
    try {
      // Phase 1: Input Validation
      this.updateStatus('validation', 0.1, 'Validating input parameters');
      const validationResult = await this.validateInputs(request);
      this.performanceMetrics.validationTime = Date.now() - startTime;
      
      if (!validationResult.isValid) {
        throw createOrchestrationError(
          `Input validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`,
          'VALIDATION_FAILED',
          'validation',
          false,
          { errors: validationResult.errors }
        );
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        this.performanceMetrics.cacheHit = true;
        this.updateStatus('complete', 1.0, 'Retrieved from cache');
        return cachedResult;
      }

      // Phase 2: Weather Preparation
      this.updateStatus('weather', 0.2, 'Preparing weather data');
      const weatherData = await this.prepareWeatherData(request);
      this.performanceMetrics.weatherTime = Date.now() - startTime - this.performanceMetrics.validationTime;

      // Phase 3: Prediction Execution
      this.updateStatus('calculation', 0.4, 'Executing prediction algorithms');
      const algorithmResult = await this.executeAlgorithms(request, weatherData);
      this.performanceMetrics.calculationTime = Date.now() - startTime - this.performanceMetrics.validationTime - this.performanceMetrics.weatherTime;

      // Phase 4: Results Processing
      this.updateStatus('processing', 0.8, 'Processing results');
      const predictionResult = await this.processResultsPhase(algorithmResult, weatherData, request, startTime);
      this.performanceMetrics.processingTime = Date.now() - startTime - this.performanceMetrics.validationTime - this.performanceMetrics.weatherTime - this.performanceMetrics.calculationTime;

      // Cache the result
      this.cacheResult(cacheKey, predictionResult);

      // Complete
      this.updateStatus('complete', 1.0, 'Prediction completed successfully');
      this.performanceMetrics.totalTime = Date.now() - startTime;
      this.performanceMetrics.memoryUsage = this.getMemoryUsage();

      return predictionResult;

    } catch (error) {
      const { error: orchestrationError, recovery } = handlePredictionError(
        error as Error,
        this.processingStatus.phase,
        { request, metrics: this.performanceMetrics }
      );

      // Attempt recovery if possible
      if (recovery && recovery.canRecover) {
        try {
          this.updateStatus('processing', 0.9, 'Attempting recovery');
          const fallbackResult = await executeFallbackPrediction(request, recovery, orchestrationError);
          this.performanceMetrics.totalTime = Date.now() - startTime;
          return fallbackResult;
        } catch (fallbackError) {
          // Fallback failed, throw original error
          throw orchestrationError;
        }
      }

      throw orchestrationError;
    }
  }

  /**
   * Validates all input parameters
   */
  private async validateInputs(request: PredictionRequest) {
    const validationResult = validatePredictionInput(request);
    
    // Additional runtime validations
    if (validationResult.isValid) {
      // Validate launch time against weather availability
      const launchTime = new Date(request.launchTime.launchTime);
      const now = new Date();
      const hoursUntilLaunch = (launchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilLaunch > 168) { // 7 days
        validationResult.warnings.push('Long-term weather forecasts may be less accurate');
      }
    }
    
    return validationResult;
  }

  /**
   * Prepares weather data for prediction
   */
  private async prepareWeatherData(request: PredictionRequest): Promise<WeatherData[]> {
    try {
      // Calculate required weather window
      const weatherWindow = this.calculateWeatherWindow(request);
      
      // Use weather selector to get optimal weather data
      const weatherSelection = await selectWeatherData({
        launchTime: request.launchTime.launchTime,
        launchLocation: {
          lat: request.launchLocation.latitude,
          lng: request.launchLocation.longitude,
          alt: request.launchLocation.altitude
        },
        balloonSpecs: {
          balloonVolume: request.balloonSpecs.initialVolume,
          payloadWeight: request.balloonSpecs.payloadWeight,
          balloonWeight: 0.5, // Default balloon weight
          burstAltitude: request.balloonSpecs.burstAltitude,
          ascentRate: request.balloonSpecs.ascentRate,
          dragCoefficient: request.balloonSpecs.dragCoefficient
        },
        preferences: {
          forecastResolution: request.options.weatherResolution === 'high' ? 'hourly' : 
                             request.options.weatherResolution === 'medium' ? '3hourly' : '6hourly',
          qualityThreshold: 0.3
        }
      });

      // Convert to internal weather data format
      const weatherData = weatherSelection.weatherData?.surfaceData || weatherSelection.weatherData || [];
      return this.convertWeatherData(weatherData);
      
    } catch (error) {
      throw createOrchestrationError(
        'Failed to prepare weather data',
        'WEATHER_PREPARATION_FAILED',
        'weather',
        true,
        { originalError: error }
      );
    }
  }

  /**
   * Executes prediction algorithms in sequence
   */
  private async executeAlgorithms(
    request: PredictionRequest,
    weatherData: WeatherData[]
  ): Promise<AlgorithmResult> {
    const algorithmInput: AlgorithmInput = {
      launchLocation: request.launchLocation,
      balloonSpecs: request.balloonSpecs,
      weatherData,
      precision: request.options.calculationPrecision
    };

    try {
      // Execute ascent calculation
      const ascentResult = await this.executeAscentPhase(algorithmInput);
      
      // Execute burst site calculation
      const burstResult = await this.executeBurstPhase(algorithmInput, ascentResult);
      
      // Execute descent calculation
      const descentResult = await this.executeDescentPhase(algorithmInput, burstResult);
      
      // Execute wind drift calculation
      const windDriftResult = await this.executeWindDriftPhase(algorithmInput, descentResult);
      
      // Combine results
      const combinedTrajectory = [
        ...(ascentResult.trajectory || []),
        ...(descentResult.trajectory || [])
      ];
      
      return {
        trajectory: combinedTrajectory,
        burstPoint: {
          latitude: burstResult.burstLatitude,
          longitude: burstResult.burstLongitude,
          altitude: burstResult.burstAltitude
        },
        landingPoint: windDriftResult.landingLocation,
        confidence: this.calculateOverallConfidence([ascentResult, burstResult, descentResult, windDriftResult]),
        processingTime: Date.now() - Date.now() // Will be calculated properly
      };
      
    } catch (error) {
      throw createOrchestrationError(
        'Algorithm execution failed',
        'ALGORITHM_EXECUTION_FAILED',
        'calculation',
        true,
        { originalError: error }
      );
    }
  }

  /**
   * Executes ascent phase calculation
   */
  private async executeAscentPhase(input: AlgorithmInput): Promise<any> {
    const ascentInput: AscentInput = {
      balloonVolume: input.balloonSpecs.initialVolume,
      payloadWeight: input.balloonSpecs.payloadWeight,
      launchAltitude: input.launchLocation.altitude || 0,
      burstAltitude: input.balloonSpecs.burstAltitude,
      ascentRate: input.balloonSpecs.ascentRate,
      atmosphericDensity: 1.225, // Standard density at sea level
      windSpeed: this.getAverageWindSpeed(input.weatherData),
      windDirection: this.getAverageWindDirection(input.weatherData)
    };

    return calculateAscent(ascentInput);
  }

  /**
   * Executes burst site calculation
   */
  private async executeBurstPhase(input: AlgorithmInput, ascentResult: any): Promise<any> {
    const burstInput: BurstSiteInput = {
      launchLatitude: input.launchLocation.latitude,
      launchLongitude: input.launchLocation.longitude,
      launchAltitude: input.launchLocation.altitude || 0,
      balloonVolume: input.balloonSpecs.initialVolume,
      payloadWeight: input.balloonSpecs.payloadWeight,
      burstAltitude: input.balloonSpecs.burstAltitude,
      ascentRate: input.balloonSpecs.ascentRate,
      windSpeed: this.getAverageWindSpeed(input.weatherData),
      windDirection: this.getAverageWindDirection(input.weatherData)
    };

    return predictBurstSite(burstInput);
  }

  /**
   * Executes descent phase calculation
   */
  private async executeDescentPhase(input: AlgorithmInput, burstResult: any): Promise<any> {
    // Simplified descent calculation - would need proper interface matching
    return {
      trajectory: [],
      landingLocation: burstResult.burstLocation, // Simplified - same as burst location
      confidence: 0.8
    };
  }

  /**
   * Executes wind drift calculation
   */
  private async executeWindDriftPhase(input: AlgorithmInput, descentResult: any): Promise<any> {
    // Simplified wind drift calculation - would need proper interface matching
    return {
      landingLocation: descentResult.landingLocation,
      confidence: 0.8
    };
  }

  /**
   * Processes results into final format
   */
  private async processResultsPhase(
    algorithmResult: AlgorithmResult,
    weatherData: WeatherData[],
    request: PredictionRequest,
    startTime: number
  ): Promise<PredictionResult> {
    try {
      return processResults(
        algorithmResult,
        weatherData,
        request.options.includeUncertainty,
        startTime
      );
    } catch (error) {
      throw createOrchestrationError(
        'Results processing failed',
        'RESULTS_PROCESSING_FAILED',
        'processing',
        true,
        { originalError: error }
      );
    }
  }

  /**
   * Calculates weather window for prediction
   */
  private calculateWeatherWindow(request: PredictionRequest): WeatherWindow {
    const launchTime = new Date(request.launchTime.launchTime);
    const estimatedFlightDuration = this.estimateFlightDuration(request.balloonSpecs);
    
    return {
      startTime: new Date(launchTime.getTime() - 3600000).toISOString(), // 1 hour before
      endTime: new Date(launchTime.getTime() + estimatedFlightDuration + 3600000).toISOString(), // 1 hour after
      resolution: request.options.weatherResolution,
      altitudeLevels: this.calculateAltitudeLevels(request.balloonSpecs)
    };
  }

  /**
   * Estimates flight duration based on balloon specs
   */
  private estimateFlightDuration(balloonSpecs: any): number {
    const ascentTime = balloonSpecs.burstAltitude / balloonSpecs.ascentRate;
    const descentTime = balloonSpecs.burstAltitude / 5; // Approximate descent rate
    return (ascentTime + descentTime) * 1000; // Convert to milliseconds
  }

  /**
   * Calculates altitude levels for weather data
   */
  private calculateAltitudeLevels(balloonSpecs: any): number[] {
    const levels = [];
    for (let alt = 0; alt <= balloonSpecs.burstAltitude + 1000; alt += 1000) {
      levels.push(alt);
    }
    return levels;
  }

  /**
   * Converts weather selection to internal format
   */
  private convertWeatherData(weatherData: any[]): WeatherData[] {
    if (!weatherData || !Array.isArray(weatherData)) {
      return [];
    }
    
    return weatherData.map(data => ({
      timestamp: data.timestamp || new Date().toISOString(),
      altitude: data.altitude || 0,
      windSpeed: data.windSpeed || 0,
      windDirection: data.windDirection || 0,
      temperature: data.temperature || 15,
      pressure: data.pressure || 1013.25,
      humidity: data.humidity || 50,
      uncertainty: data.uncertainty || 0.1
    }));
  }

  /**
   * Calculates overall confidence from individual results
   */
  private calculateOverallConfidence(results: any[]): number {
    const confidences = results.map(r => r.confidence || 0.8);
    return confidences.reduce((acc, conf) => acc * conf, 1);
  }

  /**
   * Helper methods for extracting data from weather
   */
  private getAverageWindSpeed(weatherData: WeatherData[]): number {
    return weatherData.reduce((sum, data) => sum + data.windSpeed, 0) / weatherData.length;
  }

  private getAverageWindDirection(weatherData: WeatherData[]): number {
    return weatherData.reduce((sum, data) => sum + data.windDirection, 0) / weatherData.length;
  }

  private extractAtmosphericConditions(weatherData: WeatherData[]): any {
    return weatherData.map(data => ({
      altitude: data.altitude,
      temperature: data.temperature,
      pressure: data.pressure,
      density: this.calculateDensity(data.pressure, data.temperature)
    }));
  }

  private extractWindConditions(weatherData: WeatherData[]): any {
    return weatherData.map(data => ({
      altitude: data.altitude,
      windSpeed: data.windSpeed,
      windDirection: data.windDirection,
      timestamp: data.timestamp
    }));
  }

  private calculateDensity(pressure: number, temperature: number): number {
    const R = 287.058; // Specific gas constant for dry air
    const tempKelvin = temperature + 273.15;
    return (pressure * 100) / (R * tempKelvin); // Convert hPa to Pa
  }

  /**
   * Cache management methods
   */
  private generateCacheKey(request: PredictionRequest): string {
    const keyData = {
      location: `${request.launchLocation.latitude},${request.launchLocation.longitude}`,
      time: request.launchTime.launchTime,
      balloon: JSON.stringify(request.balloonSpecs),
      options: JSON.stringify(request.options)
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private getCachedResult(cacheKey: string): PredictionResult | null {
    const cached = predictionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
    return null;
  }

  private cacheResult(cacheKey: string, result: PredictionResult): void {
    predictionCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION
    });
  }

  /**
   * Status and metrics methods
   */
  private updateStatus(phase: ProcessingStatus['phase'], progress: number, message: string): void {
    this.processingStatus = { phase, progress, message };
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      totalTime: 0,
      validationTime: 0,
      weatherTime: 0,
      calculationTime: 0,
      processingTime: 0,
      cacheHit: false,
      memoryUsage: 0
    };
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Public getters for monitoring
   */
  public getStatus(): ProcessingStatus {
    return this.processingStatus;
  }

  public getMetrics(): PerformanceMetrics {
    return this.performanceMetrics;
  }
}

// Export singleton instance
export const predictionOrchestrator = new PredictionOrchestrator();

// Export main execution function
export async function executePrediction(request: PredictionRequest): Promise<PredictionResult> {
  return predictionOrchestrator.executePrediction(request);
} 