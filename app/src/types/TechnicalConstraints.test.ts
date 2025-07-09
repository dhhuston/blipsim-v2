// Test suite for TechnicalConstraints types and utilities
// Based on task-2c specifications

import {
  PerformanceRequirements,
  ResponseTimeConstraints,
  AccuracyRequirements,
  ComputationalConstraints,
  PlatformConstraints,
  BrowserCompatibility,
  BrowserVersion,
  MobileSupport,
  DesktopSupport,
  DataSourceConstraints,
  WeatherDataSource,
  APIConstraints,
  OpenMeteoConstraints,
  NOAAConstraints,
  ScalabilityConstraints,
  SecurityConstraints,
  OfflineConstraints,
  BrowserCompatibilityRequirements,
  IntegrationConstraints,
  DeploymentConstraints,
  TechnicalConstraints,
  validatePerformanceRequirements,
  validateAPIConstraints,
  validateScalabilityConstraints,
  validateSecurityConstraints,
  validateTechnicalConstraints,
  DEFAULT_PERFORMANCE_REQUIREMENTS,
  DEFAULT_BROWSER_COMPATIBILITY,
  DEFAULT_API_CONSTRAINTS,
  DEFAULT_SCALABILITY_CONSTRAINTS,
  DEFAULT_SECURITY_CONSTRAINTS,
  DEFAULT_OFFLINE_CONSTRAINTS,
  DEFAULT_BROWSER_COMPATIBILITY_REQUIREMENTS,
  DEFAULT_INTEGRATION_CONSTRAINTS,
  DEFAULT_DEPLOYMENT_CONSTRAINTS,
  DEFAULT_TECHNICAL_CONSTRAINTS
} from './TechnicalConstraints';

describe('TechnicalConstraints Types and Utilities', () => {
  
  describe('Performance Requirements', () => {
    test('should validate correct performance requirements', () => {
      const perf: PerformanceRequirements = {
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
      expect(validatePerformanceRequirements(perf)).toBe(true);
    });

    test('should reject performance requirements exceeding limits', () => {
      const perf: PerformanceRequirements = {
        responseTime: {
          initialPredictionCalculation: 35, // Exceeds 30 second limit
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
      expect(validatePerformanceRequirements(perf)).toBe(false);
    });

    test('should reject excessive memory usage', () => {
      const perf: PerformanceRequirements = {
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
          memoryUsage: 600, // Exceeds 500MB limit
          cpuUsage: 50,
          networkBandwidth: 10
        }
      };
      expect(validatePerformanceRequirements(perf)).toBe(false);
    });
  });

  describe('Platform Constraints', () => {
    test('should create valid browser compatibility', () => {
      const browserCompat: BrowserCompatibility = {
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

      expect(browserCompat.primaryBrowsers).toHaveLength(4);
      expect(browserCompat.mobileBrowsers).toHaveLength(2);
      expect(browserCompat.webglSupport).toBe(true);
      expect(browserCompat.serviceWorker).toBe(true);
    });

    test('should create valid mobile support', () => {
      const mobileSupport: MobileSupport = {
        screenSizes: { minWidth: 320, maxWidth: 1920 },
        touchInterface: true,
        orientation: { portrait: true, landscape: true },
        performance: "Must work on 3-year-old mobile devices",
        offlineCapability: true
      };

      expect(mobileSupport.screenSizes.minWidth).toBe(320);
      expect(mobileSupport.screenSizes.maxWidth).toBe(1920);
      expect(mobileSupport.touchInterface).toBe(true);
      expect(mobileSupport.offlineCapability).toBe(true);
    });

    test('should create valid desktop support', () => {
      const desktopSupport: DesktopSupport = {
        screenResolutions: { minWidth: 1024, minHeight: 768, maxWidth: 3840, maxHeight: 2160 },
        keyboardNavigation: true,
        mouseInteraction: true,
        windowResizing: true
      };

      expect(desktopSupport.screenResolutions.minWidth).toBe(1024);
      expect(desktopSupport.screenResolutions.maxWidth).toBe(3840);
      expect(desktopSupport.keyboardNavigation).toBe(true);
      expect(desktopSupport.mouseInteraction).toBe(true);
    });
  });

  describe('Data Source Constraints', () => {
    test('should create valid weather data sources', () => {
      const dataSources: DataSourceConstraints = {
        weatherDataSources: [
          {
            name: "Open-Meteo",
            type: "primary",
            rateLimit: 10000,
            updateDelay: 1,
            coverageQuality: "Remote areas may have lower quality data",
            modelLimitations: "GFS resolution limited to ~25km"
          },
          {
            name: "NOAA GFS",
            type: "secondary",
            updateDelay: 4,
            coverageQuality: "Remote areas may have lower quality data",
            modelLimitations: "GFS resolution limited to ~25km"
          }
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
      };

      expect(dataSources.weatherDataSources).toHaveLength(2);
      expect(dataSources.weatherDataSources[0].type).toBe("primary");
      expect(dataSources.weatherDataSources[1].type).toBe("secondary");
    });
  });

  describe('API Constraints', () => {
    test('should validate correct API constraints', () => {
      const api: APIConstraints = {
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

      expect(validateAPIConstraints(api)).toBe(true);
    });

    test('should reject API constraints exceeding rate limits', () => {
      const api: APIConstraints = {
        openMeteo: {
          rateLimit: 11000, // Exceeds 10,000 limit
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

      expect(validateAPIConstraints(api)).toBe(false);
    });
  });

  describe('Scalability Constraints', () => {
    test('should validate correct scalability constraints', () => {
      const scalability: ScalabilityConstraints = {
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

      expect(validateScalabilityConstraints(scalability)).toBe(true);
    });

    test('should reject scalability constraints exceeding limits', () => {
      const scalability: ScalabilityConstraints = {
        concurrentUsers: {
          target: 150, // Exceeds 100 limit
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

      expect(validateScalabilityConstraints(scalability)).toBe(false);
    });
  });

  describe('Security Constraints', () => {
    test('should validate correct security constraints', () => {
      const security: SecurityConstraints = {
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

      expect(validateSecurityConstraints(security)).toBe(true);
    });

    test('should reject security constraints missing required features', () => {
      const security: SecurityConstraints = {
        dataPrivacy: {
          userData: "No personal information collected",
          locationData: "Only used for predictions, not stored",
          analytics: "Anonymous usage statistics only",
          cookies: "Minimal, essential cookies only"
        },
        securityRequirements: {
          https: false, // Missing HTTPS requirement
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

      expect(validateSecurityConstraints(security)).toBe(false);
    });
  });

  describe('Offline Constraints', () => {
    test('should create valid offline constraints', () => {
      const offline: OfflineConstraints = {
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

      expect(offline.offlineFunctionality.basicPrediction).toBe(true);
      expect(offline.offlineLimitations.noRealTimeWeather).toBe(true);
      expect(offline.serviceWorkerRequirements.weatherDataCache).toBe(6);
      expect(offline.serviceWorkerRequirements.mapTilesCache).toBe(30);
    });
  });

  describe('Browser Compatibility Requirements', () => {
    test('should create valid browser compatibility requirements', () => {
      const browserCompat: BrowserCompatibilityRequirements = {
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

      expect(browserCompat.requiredFeatures.es2020Plus).toBe(true);
      expect(browserCompat.requiredFeatures.webgl).toBe(true);
      expect(browserCompat.testingRequirements.desktopBrowsers).toHaveLength(4);
      expect(browserCompat.testingRequirements.mobileBrowsers).toHaveLength(2);
    });
  });

  describe('Integration Constraints', () => {
    test('should create valid integration constraints', () => {
      const integration: IntegrationConstraints = {
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

      expect(integration.thirdPartyServices.weatherAPIs).toHaveLength(2);
      expect(integration.thirdPartyServices.mapping).toHaveLength(2);
      expect(integration.developmentConstraints.buildSize).toBe(5);
      expect(integration.developmentConstraints.typescript).toBe(true);
    });
  });

  describe('Deployment Constraints', () => {
    test('should create valid deployment constraints', () => {
      const deployment: DeploymentConstraints = {
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

      expect(deployment.hostingRequirements.staticHosting).toBe(true);
      expect(deployment.hostingRequirements.https).toBe(true);
      expect(deployment.buildConstraints.buildTime).toBe(5);
      expect(deployment.buildConstraints.bundleSize).toBe(5);
    });
  });

  describe('Complete Technical Constraints', () => {
    test('should create valid complete technical constraints', () => {
      const constraints: TechnicalConstraints = {
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

      expect(validateTechnicalConstraints(constraints)).toBe(true);
    });

    test('should reject invalid complete technical constraints', () => {
      const constraints: TechnicalConstraints = {
        performance: {
          ...DEFAULT_PERFORMANCE_REQUIREMENTS,
          computational: {
            ...DEFAULT_PERFORMANCE_REQUIREMENTS.computational,
            memoryUsage: 600 // Exceeds limit
          }
        },
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

      expect(validateTechnicalConstraints(constraints)).toBe(false);
    });
  });

  describe('Default Values', () => {
    test('should have correct default performance requirements', () => {
      expect(DEFAULT_PERFORMANCE_REQUIREMENTS.responseTime.initialPredictionCalculation).toBe(30);
      expect(DEFAULT_PERFORMANCE_REQUIREMENTS.responseTime.realTimeUpdates).toBe(5);
      expect(DEFAULT_PERFORMANCE_REQUIREMENTS.computational.memoryUsage).toBe(500);
      expect(DEFAULT_PERFORMANCE_REQUIREMENTS.computational.cpuUsage).toBe(50);
    });

    test('should have correct default API constraints', () => {
      expect(DEFAULT_API_CONSTRAINTS.openMeteo.rateLimit).toBe(10000);
      expect(DEFAULT_API_CONSTRAINTS.openMeteo.timeout).toBe(30);
      expect(DEFAULT_API_CONSTRAINTS.noaa.cdo.rateLimit).toBe(1000);
      expect(DEFAULT_API_CONSTRAINTS.noaa.nomads.timeout).toBe(60);
    });

    test('should have correct default scalability constraints', () => {
      expect(DEFAULT_SCALABILITY_CONSTRAINTS.concurrentUsers.target).toBe(100);
      expect(DEFAULT_SCALABILITY_CONSTRAINTS.concurrentUsers.peak).toBe(500);
      expect(DEFAULT_SCALABILITY_CONSTRAINTS.dataVolume.trajectoryPoints).toBe(10000);
      expect(DEFAULT_SCALABILITY_CONSTRAINTS.dataVolume.cacheSize).toBe(100);
    });

    test('should have correct default security constraints', () => {
      expect(DEFAULT_SECURITY_CONSTRAINTS.securityRequirements.https).toBe(true);
      expect(DEFAULT_SECURITY_CONSTRAINTS.securityRequirements.cors).toBe(true);
      expect(DEFAULT_SECURITY_CONSTRAINTS.securityRequirements.inputValidation).toBe(true);
      expect(DEFAULT_SECURITY_CONSTRAINTS.securityRequirements.xssProtection).toBe(true);
    });

    test('should have correct default offline constraints', () => {
      expect(DEFAULT_OFFLINE_CONSTRAINTS.offlineFunctionality.basicPrediction).toBe(true);
      expect(DEFAULT_OFFLINE_CONSTRAINTS.offlineFunctionality.mapDisplay).toBe(true);
      expect(DEFAULT_OFFLINE_CONSTRAINTS.serviceWorkerRequirements.weatherDataCache).toBe(6);
      expect(DEFAULT_OFFLINE_CONSTRAINTS.serviceWorkerRequirements.mapTilesCache).toBe(30);
    });

    test('should have correct default browser compatibility requirements', () => {
      expect(DEFAULT_BROWSER_COMPATIBILITY_REQUIREMENTS.requiredFeatures.es2020Plus).toBe(true);
      expect(DEFAULT_BROWSER_COMPATIBILITY_REQUIREMENTS.requiredFeatures.webgl).toBe(true);
      expect(DEFAULT_BROWSER_COMPATIBILITY_REQUIREMENTS.testingRequirements.desktopBrowsers).toHaveLength(4);
      expect(DEFAULT_BROWSER_COMPATIBILITY_REQUIREMENTS.testingRequirements.mobileBrowsers).toHaveLength(2);
    });

    test('should have correct default integration constraints', () => {
      expect(DEFAULT_INTEGRATION_CONSTRAINTS.developmentConstraints.buildSize).toBe(5);
      expect(DEFAULT_INTEGRATION_CONSTRAINTS.developmentConstraints.typescript).toBe(true);
      expect(DEFAULT_INTEGRATION_CONSTRAINTS.thirdPartyServices.weatherAPIs).toHaveLength(2);
      expect(DEFAULT_INTEGRATION_CONSTRAINTS.thirdPartyServices.mapping).toHaveLength(2);
    });

    test('should have correct default deployment constraints', () => {
      expect(DEFAULT_DEPLOYMENT_CONSTRAINTS.hostingRequirements.staticHosting).toBe(true);
      expect(DEFAULT_DEPLOYMENT_CONSTRAINTS.hostingRequirements.https).toBe(true);
      expect(DEFAULT_DEPLOYMENT_CONSTRAINTS.buildConstraints.buildTime).toBe(5);
      expect(DEFAULT_DEPLOYMENT_CONSTRAINTS.buildConstraints.bundleSize).toBe(5);
    });

    test('should have valid complete default technical constraints', () => {
      expect(validateTechnicalConstraints(DEFAULT_TECHNICAL_CONSTRAINTS)).toBe(true);
    });
  });
}); 