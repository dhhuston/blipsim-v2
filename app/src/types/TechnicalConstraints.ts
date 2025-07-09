// Technical Constraints and Limitations for BLIiPSim v2
// Based on task-2c specifications

// ============================================================================
// 1. PERFORMANCE REQUIREMENTS
// ============================================================================

export interface PerformanceRequirements {
  responseTime: ResponseTimeConstraints;
  accuracy: AccuracyRequirements;
  computational: ComputationalConstraints;
}

export interface ResponseTimeConstraints {
  initialPredictionCalculation: number;  // seconds
  realTimeUpdates: number;               // seconds
  mapRendering: number;                  // seconds
  dataFetching: number;                  // seconds
  exportGeneration: number;              // seconds
}

export interface AccuracyRequirements {
  landingPredictionRadius: number;       // km (95% confidence)
  flightDurationUncertainty: number;     // hours (95% confidence)
  altitudeUncertainty: number;           // meters (95% confidence)
  windInterpolationAccuracy: number;     // m/s
}

export interface ComputationalConstraints {
  clientSideProcessing: string;          // "Must work on mid-range devices"
  memoryUsage: number;                   // MB
  cpuUsage: number;                      // percentage
  networkBandwidth: number;              // MB per request
}

// ============================================================================
// 2. PLATFORM CONSTRAINTS
// ============================================================================

export interface PlatformConstraints {
  browserCompatibility: BrowserCompatibility;
  mobileSupport: MobileSupport;
  desktopSupport: DesktopSupport;
}

export interface BrowserCompatibility {
  primaryBrowsers: BrowserVersion[];
  mobileBrowsers: BrowserVersion[];
  javascriptSupport: string;             // "ES2020+ features required"
  webglSupport: boolean;                 // Required for 3D map rendering
  serviceWorker: boolean;                // Required for offline functionality
}

export interface BrowserVersion {
  name: string;
  minVersion: string;
  notes?: string;
}

export interface MobileSupport {
  screenSizes: ScreenSizeRange;
  touchInterface: boolean;               // Full touch support required
  orientation: OrientationSupport;
  performance: string;                   // "Must work on 3-year-old mobile devices"
  offlineCapability: boolean;           // Basic functionality without internet
}

export interface ScreenSizeRange {
  minWidth: number;                      // px
  maxWidth: number;                      // px
}

export interface OrientationSupport {
  portrait: boolean;
  landscape: boolean;
}

export interface DesktopSupport {
  screenResolutions: ResolutionRange;
  keyboardNavigation: boolean;           // Full keyboard accessibility
  mouseInteraction: boolean;             // Precise mouse control for map
  windowResizing: boolean;               // Responsive to window size changes
}

export interface ResolutionRange {
  minWidth: number;                      // px
  minHeight: number;                     // px
  maxWidth: number;                      // px
  maxHeight: number;                     // px
}

// ============================================================================
// 3. DATA SOURCE LIMITATIONS AND FALLBACK STRATEGIES
// ============================================================================

export interface DataSourceConstraints {
  weatherDataSources: WeatherDataSource[];
  dataQualityConstraints: DataQualityConstraints;
  fallbackStrategy: FallbackStrategy;
}

export interface WeatherDataSource {
  name: string;
  type: 'primary' | 'secondary' | 'fallback';
  rateLimit?: number;                    // requests per day
  updateDelay: number;                   // hours behind real-time
  coverageQuality: string;               // "Remote areas may have lower quality data"
  modelLimitations: string;              // e.g., "GFS resolution limited to ~25km"
}

export interface DataQualityConstraints {
  coverageGaps: string;                  // "Remote areas may have lower quality data"
  updateDelays: string;                  // "Weather data 1-4 hours behind real-time"
  modelLimitations: string;              // "GFS resolution limited to ~25km"
  interpolationErrors: string;           // "Wind data interpolation introduces uncertainty"
}

export interface FallbackStrategy {
  primary: string;                       // "Open-Meteo API"
  secondary: string;                     // "NOAA GFS"
  cached: string;                        // "Last 6 hours of data"
  offline: string;                       // "Last known good prediction"
  degraded: string;                      // "Basic prediction without real-time weather"
}

// ============================================================================
// 4. API RATE LIMITS AND USAGE CONSTRAINTS
// ============================================================================

export interface APIConstraints {
  openMeteo: OpenMeteoConstraints;
  noaa: NOAAConstraints;
  implementation: ImplementationConstraints;
}

export interface OpenMeteoConstraints {
  rateLimit: number;                     // requests per day
  requestSize: number;                   // MB per request
  timeout: number;                       // seconds per request
  cors: boolean;                         // Supported for web applications
  authentication: boolean;               // None required
}

export interface NOAAConstraints {
  nomads: NOAAServiceConstraints;
  cdo: NOAAServiceConstraints;
}

export interface NOAAServiceConstraints {
  rateLimit?: number;                    // requests per day (optional for NOMADS)
  dataSize: string;                      // e.g., "Large files (several GB per forecast)"
  timeout: number;                       // seconds per request
  authentication: boolean;               // None required for basic access
}

export interface ImplementationConstraints {
  caching: boolean;                      // Required to minimize API calls
  errorHandling: boolean;                // Must handle network failures gracefully
  retryLogic: boolean;                   // Exponential backoff for failed requests
  dataValidation: boolean;               // Must validate all received data
}

// ============================================================================
// 5. SCALABILITY REQUIREMENTS AND LIMITATIONS
// ============================================================================

export interface ScalabilityConstraints {
  concurrentUsers: ConcurrentUserLimits;
  dataVolume: DataVolumeLimits;
  performanceScaling: PerformanceScaling;
}

export interface ConcurrentUserLimits {
  target: number;                        // concurrent users
  peak: number;                          // concurrent users during events
  scaling: string;                       // "Horizontal scaling via CDN and caching"
  database: string;                      // "No persistent database required (stateless)"
}

export interface DataVolumeLimits {
  trajectoryPoints: number;              // points per prediction
  historicalData: number;                // saved predictions per user
  exportFiles: number;                   // MB per file
  cacheSize: number;                     // MB per browser session
}

export interface PerformanceScaling {
  clientSideProcessing: string;          // "Scales with user's device"
  serverSide: string;                    // "Minimal server requirements (static hosting)"
  cdn: boolean;                          // Required for global performance
  caching: boolean;                      // Browser and CDN caching essential
}

// ============================================================================
// 6. SECURITY AND PRIVACY CONSTRAINTS
// ============================================================================

export interface SecurityConstraints {
  dataPrivacy: DataPrivacyConstraints;
  securityRequirements: SecurityRequirements;
  apiSecurity: APISecurityConstraints;
}

export interface DataPrivacyConstraints {
  userData: string;                      // "No personal information collected"
  locationData: string;                  // "Only used for predictions, not stored"
  analytics: string;                     // "Anonymous usage statistics only"
  cookies: string;                       // "Minimal, essential cookies only"
}

export interface SecurityRequirements {
  https: boolean;                        // Required for all connections
  cors: boolean;                         // Properly configured for web security
  inputValidation: boolean;              // All user inputs validated
  xssProtection: boolean;                // Sanitize all user inputs
  csrfProtection: boolean;               // Implement CSRF tokens
}

export interface APISecurityConstraints {
  weatherAPIs: string;                   // "Public APIs, no authentication required"
  rateLimiting: boolean;                 // Client-side rate limiting to respect API limits
  errorHandling: boolean;                // Don't expose internal errors to users
  logging: string;                       // "Minimal logging, no sensitive data"
}

// ============================================================================
// 7. OFFLINE CAPABILITIES AND LIMITATIONS
// ============================================================================

export interface OfflineConstraints {
  offlineFunctionality: OfflineFunctionality;
  offlineLimitations: OfflineLimitations;
  serviceWorkerRequirements: ServiceWorkerRequirements;
}

export interface OfflineFunctionality {
  basicPrediction: boolean;              // Can run with cached weather data
  mapDisplay: boolean;                   // Offline map tiles (limited area)
  savedPredictions: boolean;             // Access to previously saved predictions
  export: boolean;                       // Generate exports from cached data
}

export interface OfflineLimitations {
  noRealTimeWeather: boolean;            // Must use cached data
  limitedMapArea: boolean;               // Only cached map tiles available
  noNewPredictions: boolean;             // Cannot fetch fresh weather data
  reducedAccuracy: boolean;              // Predictions less accurate with old data
}

export interface ServiceWorkerRequirements {
  cacheStrategy: string;                 // "Cache-first for static assets"
  weatherDataCache: number;              // hours
  mapTilesCache: number;                 // days
  fallback: string;                      // "Show offline indicator when no internet"
}

// ============================================================================
// 8. BROWSER COMPATIBILITY REQUIREMENTS
// ============================================================================

export interface BrowserCompatibilityRequirements {
  requiredFeatures: RequiredFeatures;
  progressiveEnhancement: ProgressiveEnhancement;
  testingRequirements: TestingRequirements;
}

export interface RequiredFeatures {
  es2020Plus: boolean;                   // Modern JavaScript features
  fetchAPI: boolean;                     // For HTTP requests
  webgl: boolean;                        // For 3D map rendering
  serviceWorkers: boolean;               // For offline functionality
  localStorage: boolean;                 // For caching and preferences
  indexedDB: boolean;                    // For larger data storage
}

export interface ProgressiveEnhancement {
  basicFunctionality: string;            // "Works without JavaScript (minimal)"
  enhancedFunctionality: string;         // "Full features with modern browsers"
  gracefulDegradation: boolean;          // Fallback for missing features
  accessibility: string;                 // "WCAG 2.1 AA compliance"
}

export interface TestingRequirements {
  desktopBrowsers: string[];             // ["Chrome", "Firefox", "Safari", "Edge"]
  mobileBrowsers: string[];              // ["iOS Safari", "Chrome Mobile"]
  screenReaders: string[];               // ["NVDA", "JAWS", "VoiceOver"]
  performance: string;                   // "Lighthouse score > 90"
}

// ============================================================================
// 9. INTEGRATION CONSTRAINTS
// ============================================================================

export interface IntegrationConstraints {
  thirdPartyServices: ThirdPartyServices;
  developmentConstraints: DevelopmentConstraints;
}

export interface ThirdPartyServices {
  weatherAPIs: string[];                 // ["Open-Meteo", "NOAA (free tiers)"]
  mapping: string[];                     // ["OpenStreetMap", "Mapbox (free tier)"]
  analytics: string[];                   // ["Google Analytics (optional)"]
  hosting: string[];                     // ["Static hosting (Netlify, Vercel, GitHub Pages)"]
}

export interface DevelopmentConstraints {
  buildSize: number;                     // MB total bundle size
  dependencies: string;                  // "Minimal external dependencies"
  typescript: boolean;                   // Required for type safety
  testing: string;                       // "Unit tests for core algorithms"
  documentation: string;                 // "Comprehensive API documentation"
}

// ============================================================================
// 10. DEPLOYMENT CONSTRAINTS
// ============================================================================

export interface DeploymentConstraints {
  hostingRequirements: HostingRequirements;
  buildConstraints: BuildConstraints;
}

export interface HostingRequirements {
  staticHosting: boolean;                // No server-side processing required
  cdn: boolean;                          // Required for global performance
  https: boolean;                        // Required for all connections
  customDomain: boolean;                 // Optional but recommended
}

export interface BuildConstraints {
  buildTime: number;                     // minutes
  bundleSize: number;                    // MB total
  treeShaking: boolean;                  // Remove unused code
  codeSplitting: boolean;                // Lazy load non-critical features
  compression: boolean;                  // Gzip/Brotli compression required
}

// ============================================================================
// 11. COMPLETE TECHNICAL CONSTRAINTS INTERFACE
// ============================================================================

export interface TechnicalConstraints {
  performance: PerformanceRequirements;
  platform: PlatformConstraints;
  dataSources: DataSourceConstraints;
  api: APIConstraints;
  scalability: ScalabilityConstraints;
  security: SecurityConstraints;
  offline: OfflineConstraints;
  browserCompatibility: BrowserCompatibilityRequirements;
  integration: IntegrationConstraints;
  deployment: DeploymentConstraints;
}

// ============================================================================
// 12. DEFAULT VALUES AND CONSTANTS
// ============================================================================

export const DEFAULT_PERFORMANCE_REQUIREMENTS: PerformanceRequirements = {
  responseTime: {
    initialPredictionCalculation: 30,
    realTimeUpdates: 5,
    mapRendering: 2,
    dataFetching: 10,
    exportGeneration: 15
  },
  accuracy: {
    landingPredictionRadius: 15,
    flightDurationUncertainty: 2,
    altitudeUncertainty: 500,
    windInterpolationAccuracy: 2
  },
  computational: {
    clientSideProcessing: "Must work on mid-range devices",
    memoryUsage: 500,
    cpuUsage: 50,
    networkBandwidth: 10
  }
};

export const DEFAULT_BROWSER_COMPATIBILITY: BrowserCompatibility = {
  primaryBrowsers: [
    { name: "Chrome", minVersion: "90" },
    { name: "Firefox", minVersion: "88" },
    { name: "Safari", minVersion: "14" },
    { name: "Edge", minVersion: "90" }
  ],
  mobileBrowsers: [
    { name: "iOS Safari", minVersion: "14" },
    { name: "Chrome Mobile", minVersion: "90" }
  ],
  javascriptSupport: "ES2020+ features required",
  webglSupport: true,
  serviceWorker: true
};

export const DEFAULT_API_CONSTRAINTS: APIConstraints = {
  openMeteo: {
    rateLimit: 10000,
    requestSize: 1,
    timeout: 30,
    cors: true,
    authentication: false
  },
  noaa: {
    nomads: {
      dataSize: "Large files (several GB per forecast)",
      timeout: 60,
      authentication: false
    },
    cdo: {
      rateLimit: 1000,
      dataSize: "Large files (several GB per forecast)",
      timeout: 60,
      authentication: false
    }
  },
  implementation: {
    caching: true,
    errorHandling: true,
    retryLogic: true,
    dataValidation: true
  }
};

export const DEFAULT_SCALABILITY_CONSTRAINTS: ScalabilityConstraints = {
  concurrentUsers: {
    target: 100,
    peak: 500,
    scaling: "Horizontal scaling via CDN and caching",
    database: "No persistent database required (stateless)"
  },
  dataVolume: {
    trajectoryPoints: 10000,
    historicalData: 1000,
    exportFiles: 10,
    cacheSize: 100
  },
  performanceScaling: {
    clientSideProcessing: "Scales with user's device",
    serverSide: "Minimal server requirements (static hosting)",
    cdn: true,
    caching: true
  }
};

export const DEFAULT_SECURITY_CONSTRAINTS: SecurityConstraints = {
  dataPrivacy: {
    userData: "No personal information collected",
    locationData: "Only used for predictions, not stored",
    analytics: "Anonymous usage statistics only",
    cookies: "Minimal, essential cookies only"
  },
  securityRequirements: {
    https: true,
    cors: true,
    inputValidation: true,
    xssProtection: true,
    csrfProtection: true
  },
  apiSecurity: {
    weatherAPIs: "Public APIs, no authentication required",
    rateLimiting: true,
    errorHandling: true,
    logging: "Minimal logging, no sensitive data"
  }
};

export const DEFAULT_OFFLINE_CONSTRAINTS: OfflineConstraints = {
  offlineFunctionality: {
    basicPrediction: true,
    mapDisplay: true,
    savedPredictions: true,
    export: true
  },
  offlineLimitations: {
    noRealTimeWeather: true,
    limitedMapArea: true,
    noNewPredictions: true,
    reducedAccuracy: true
  },
  serviceWorkerRequirements: {
    cacheStrategy: "Cache-first for static assets",
    weatherDataCache: 6,
    mapTilesCache: 30,
    fallback: "Show offline indicator when no internet"
  }
};

export const DEFAULT_BROWSER_COMPATIBILITY_REQUIREMENTS: BrowserCompatibilityRequirements = {
  requiredFeatures: {
    es2020Plus: true,
    fetchAPI: true,
    webgl: true,
    serviceWorkers: true,
    localStorage: true,
    indexedDB: true
  },
  progressiveEnhancement: {
    basicFunctionality: "Works without JavaScript (minimal)",
    enhancedFunctionality: "Full features with modern browsers",
    gracefulDegradation: true,
    accessibility: "WCAG 2.1 AA compliance"
  },
  testingRequirements: {
    desktopBrowsers: ["Chrome", "Firefox", "Safari", "Edge"],
    mobileBrowsers: ["iOS Safari", "Chrome Mobile"],
    screenReaders: ["NVDA", "JAWS", "VoiceOver"],
    performance: "Lighthouse score > 90"
  }
};

export const DEFAULT_INTEGRATION_CONSTRAINTS: IntegrationConstraints = {
  thirdPartyServices: {
    weatherAPIs: ["Open-Meteo", "NOAA (free tiers)"],
    mapping: ["OpenStreetMap", "Mapbox (free tier)"],
    analytics: ["Google Analytics (optional)"],
    hosting: ["Static hosting (Netlify, Vercel, GitHub Pages)"]
  },
  developmentConstraints: {
    buildSize: 5,
    dependencies: "Minimal external dependencies",
    typescript: true,
    testing: "Unit tests for core algorithms",
    documentation: "Comprehensive API documentation"
  }
};

export const DEFAULT_DEPLOYMENT_CONSTRAINTS: DeploymentConstraints = {
  hostingRequirements: {
    staticHosting: true,
    cdn: true,
    https: true,
    customDomain: false
  },
  buildConstraints: {
    buildTime: 5,
    bundleSize: 5,
    treeShaking: true,
    codeSplitting: true,
    compression: true
  }
};

export const DEFAULT_TECHNICAL_CONSTRAINTS: TechnicalConstraints = {
  performance: DEFAULT_PERFORMANCE_REQUIREMENTS,
  platform: {
    browserCompatibility: DEFAULT_BROWSER_COMPATIBILITY,
    mobileSupport: {
      screenSizes: { minWidth: 320, maxWidth: 1920 },
      touchInterface: true,
      orientation: { portrait: true, landscape: true },
      performance: "Must work on 3-year-old mobile devices",
      offlineCapability: true
    },
    desktopSupport: {
      screenResolutions: { minWidth: 1024, minHeight: 768, maxWidth: 3840, maxHeight: 2160 },
      keyboardNavigation: true,
      mouseInteraction: true,
      windowResizing: true
    }
  },
  dataSources: {
    weatherDataSources: [
      { name: "Open-Meteo", type: "primary", rateLimit: 10000, updateDelay: 1, coverageQuality: "Remote areas may have lower quality data", modelLimitations: "GFS resolution limited to ~25km" },
      { name: "NOAA GFS", type: "secondary", updateDelay: 4, coverageQuality: "Remote areas may have lower quality data", modelLimitations: "GFS resolution limited to ~25km" }
    ],
    dataQualityConstraints: {
      coverageGaps: "Remote areas may have lower quality data",
      updateDelays: "Weather data 1-4 hours behind real-time",
      modelLimitations: "GFS resolution limited to ~25km",
      interpolationErrors: "Wind data interpolation introduces uncertainty"
    },
    fallbackStrategy: {
      primary: "Open-Meteo API",
      secondary: "NOAA GFS",
      cached: "Last 6 hours of data",
      offline: "Last known good prediction",
      degraded: "Basic prediction without real-time weather"
    }
  },
  api: DEFAULT_API_CONSTRAINTS,
  scalability: DEFAULT_SCALABILITY_CONSTRAINTS,
  security: DEFAULT_SECURITY_CONSTRAINTS,
  offline: DEFAULT_OFFLINE_CONSTRAINTS,
  browserCompatibility: DEFAULT_BROWSER_COMPATIBILITY_REQUIREMENTS,
  integration: DEFAULT_INTEGRATION_CONSTRAINTS,
  deployment: DEFAULT_DEPLOYMENT_CONSTRAINTS
};

// ============================================================================
// 13. VALIDATION FUNCTIONS
// ============================================================================

export function validatePerformanceRequirements(perf: PerformanceRequirements): boolean {
  return (
    perf.responseTime.initialPredictionCalculation <= 30 &&
    perf.responseTime.realTimeUpdates <= 5 &&
    perf.responseTime.mapRendering <= 2 &&
    perf.responseTime.dataFetching <= 10 &&
    perf.responseTime.exportGeneration <= 15 &&
    perf.computational.memoryUsage <= 500 &&
    perf.computational.cpuUsage <= 50 &&
    perf.computational.networkBandwidth <= 10
  );
}

export function validateAPIConstraints(api: APIConstraints): boolean {
  return (
    api.openMeteo.rateLimit <= 10000 &&
    api.openMeteo.requestSize <= 1 &&
    api.openMeteo.timeout <= 30 &&
    api.noaa.cdo &&
    typeof api.noaa.cdo.rateLimit === 'number' &&
    api.noaa.cdo.rateLimit <= 1000 &&
    api.noaa.nomads.timeout <= 60 &&
    api.noaa.cdo.timeout <= 60
  );
}

export function validateScalabilityConstraints(scalability: ScalabilityConstraints): boolean {
  return (
    scalability.concurrentUsers.target <= 100 &&
    scalability.concurrentUsers.peak <= 500 &&
    scalability.dataVolume.trajectoryPoints <= 10000 &&
    scalability.dataVolume.historicalData <= 1000 &&
    scalability.dataVolume.exportFiles <= 10 &&
    scalability.dataVolume.cacheSize <= 100
  );
}

export function validateSecurityConstraints(security: SecurityConstraints): boolean {
  return (
    security.securityRequirements.https &&
    security.securityRequirements.cors &&
    security.securityRequirements.inputValidation &&
    security.securityRequirements.xssProtection &&
    security.securityRequirements.csrfProtection
  );
}

export function validateTechnicalConstraints(constraints: TechnicalConstraints): boolean {
  return (
    validatePerformanceRequirements(constraints.performance) &&
    validateAPIConstraints(constraints.api) &&
    validateScalabilityConstraints(constraints.scalability) &&
    validateSecurityConstraints(constraints.security)
  );
} 