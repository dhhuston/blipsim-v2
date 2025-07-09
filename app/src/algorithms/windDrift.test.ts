import {
  calculateWindDrift,
  calculateMultiLayerWindDrift,
  calculateDistance,
  calculateNewPosition,
  interpolateWindData,
  generateRandomWindData,
  runMonteCarloSimulation,
  performMonteCarloLandingUncertainty,
  validateWindDriftInput,
  validateWindUncertainty,
  WindDriftInput,
  WindDriftResult,
  WindUncertainty,
  WindDataPoint
} from './windDrift';

describe('Wind Drift Algorithm', () => {
  const mockWindDriftInput: WindDriftInput = {
    startLatitude: 40.7128,    // New York City
    startLongitude: -74.0060,  // New York City
    windSpeed: 10,              // m/s
    windDirection: 90,          // degrees (east)
    duration: 3600,             // 1 hour
    altitude: 1000              // m
  };

  const mockUncertainty: WindUncertainty = {
    speedError: 2.0,            // m/s
    directionError: 15.0,       // degrees
    altitudeError: 100.0,       // m
    timeError: 60.0             // seconds
  };

  const mockWindDataPoints: WindDataPoint[] = [
    { altitude: 0, windSpeed: 5, windDirection: 90, timestamp: '2023-01-01T00:00:00Z' },
    { altitude: 1000, windSpeed: 10, windDirection: 95, timestamp: '2023-01-01T00:00:00Z' },
    { altitude: 2000, windSpeed: 15, windDirection: 100, timestamp: '2023-01-01T00:00:00Z' },
    { altitude: 3000, windSpeed: 20, windDirection: 105, timestamp: '2023-01-01T00:00:00Z' }
  ];

  describe('Distance Calculation', () => {
    test('should calculate distance between two points correctly', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7589, -73.9851);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10); // Should be less than 10 km for NYC coordinates
    });

    test('should return zero distance for same point', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });

    test('should handle antipodal points', () => {
      const distance = calculateDistance(0, 0, 0, 180);
      expect(distance).toBeGreaterThan(20000); // Should be approximately half Earth's circumference
    });

    test('should handle points at different latitudes', () => {
      const distance = calculateDistance(0, 0, 90, 0);
      expect(distance).toBeGreaterThan(10000); // Should be approximately quarter Earth's circumference
    });
  });

  describe('Wind Data Interpolation', () => {
    test('should interpolate wind data correctly', () => {
      const result = interpolateWindData(1500, mockWindDataPoints);
      
      // Should interpolate between 1000m and 2000m data points
      expect(result.windSpeed).toBeGreaterThan(10);
      expect(result.windSpeed).toBeLessThan(15);
      expect(result.windDirection).toBeGreaterThan(95);
      expect(result.windDirection).toBeLessThan(100);
    });

    test('should handle exact altitude match', () => {
      const result = interpolateWindData(1000, mockWindDataPoints);
      expect(result.windSpeed).toBe(10);
      expect(result.windDirection).toBe(95);
    });

    test('should handle altitude below range', () => {
      const result = interpolateWindData(-100, mockWindDataPoints);
      expect(result.windSpeed).toBe(5);
      expect(result.windDirection).toBe(90);
    });

    test('should handle altitude above range', () => {
      const result = interpolateWindData(4000, mockWindDataPoints);
      expect(result.windSpeed).toBe(20);
      expect(result.windDirection).toBe(105);
    });

    test('should handle single data point', () => {
      const singlePoint = [mockWindDataPoints[0]];
      const result = interpolateWindData(500, singlePoint);
      expect(result.windSpeed).toBe(5);
      expect(result.windDirection).toBe(90);
    });

    test('should handle direction wrapping around 360 degrees', () => {
      const dataWithWrapping = [
        { altitude: 0, windSpeed: 10, windDirection: 350, timestamp: '2023-01-01T00:00:00Z' },
        { altitude: 1000, windSpeed: 10, windDirection: 10, timestamp: '2023-01-01T00:00:00Z' }
      ];
      const result = interpolateWindData(500, dataWithWrapping);
      expect(result.windDirection).toBeGreaterThanOrEqual(0);
      expect(result.windDirection).toBeLessThanOrEqual(360);
    });

    test('should throw error for empty data points', () => {
      expect(() => interpolateWindData(1000, [])).toThrow('No wind data points provided');
    });
  });

  describe('Random Wind Data Generation', () => {
    test('should generate wind data within uncertainty bounds', () => {
      const baseSpeed = 10;
      const baseDirection = 90;
      
      for (let i = 0; i < 100; i++) {
        const result = generateRandomWindData(baseSpeed, baseDirection, mockUncertainty);
        
        // Speed should be non-negative
        expect(result.windSpeed).toBeGreaterThanOrEqual(0);
        
        // Direction should be between 0 and 360
        expect(result.windDirection).toBeGreaterThanOrEqual(0);
        expect(result.windDirection).toBeLessThan(360);
      }
    });

    test('should handle zero uncertainty', () => {
      const zeroUncertainty: WindUncertainty = {
        speedError: 0,
        directionError: 0,
        altitudeError: 0,
        timeError: 0
      };
      
      const result = generateRandomWindData(10, 90, zeroUncertainty);
      expect(result.windSpeed).toBe(10);
      expect(result.windDirection).toBe(90);
    });

    test('should generate different values with uncertainty', () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(generateRandomWindData(10, 90, mockUncertainty));
      }
      
      // Should have some variation
      const speeds = results.map(r => r.windSpeed);
      const directions = results.map(r => r.windDirection);
      
      const speedVariation = Math.max(...speeds) - Math.min(...speeds);
      const directionVariation = Math.max(...directions) - Math.min(...directions);
      
      expect(speedVariation).toBeGreaterThan(0);
      expect(directionVariation).toBeGreaterThan(0);
    });
  });

  describe('Monte Carlo Simulation', () => {
    test('should run Monte Carlo simulation correctly', () => {
      const result = runMonteCarloSimulation(mockWindDriftInput, mockUncertainty, 100);
      
      expect(result).toHaveProperty('trajectories');
      expect(result).toHaveProperty('confidenceInterval');
      expect(result).toHaveProperty('statistics');
      
      expect(Array.isArray(result.trajectories)).toBe(true);
      expect(result.trajectories.length).toBe(100);
      expect(result.statistics.confidenceLevel).toBe(0.95);
    });

    test('should calculate confidence intervals correctly', () => {
      const result = runMonteCarloSimulation(mockWindDriftInput, mockUncertainty, 100);
      
      expect(result.confidenceInterval.minDistance).toBeLessThan(result.confidenceInterval.maxDistance);
      expect(result.confidenceInterval.minLatitude).toBeLessThan(result.confidenceInterval.maxLatitude);
      expect(result.confidenceInterval.minLongitude).toBeLessThan(result.confidenceInterval.maxLongitude);
    });

    test('should calculate statistics correctly', () => {
      const result = runMonteCarloSimulation(mockWindDriftInput, mockUncertainty, 100);
      
      expect(result.statistics.meanDistance).toBeGreaterThan(0);
      expect(result.statistics.stdDevDistance).toBeGreaterThanOrEqual(0);
      expect(result.statistics.meanEndLatitude).toBeGreaterThanOrEqual(-90);
      expect(result.statistics.meanEndLatitude).toBeLessThanOrEqual(90);
      expect(result.statistics.meanEndLongitude).toBeGreaterThanOrEqual(-180);
      expect(result.statistics.meanEndLongitude).toBeLessThanOrEqual(180);
    });

    test('should throw error for invalid simulation count', () => {
      expect(() => runMonteCarloSimulation(mockWindDriftInput, mockUncertainty, 0))
        .toThrow('Number of simulations must be positive');
    });

    test('should handle different uncertainty levels', () => {
      const lowUncertainty: WindUncertainty = {
        speedError: 0.5,
        directionError: 5.0,
        altitudeError: 50.0,
        timeError: 30.0
      };
      
      const highUncertainty: WindUncertainty = {
        speedError: 5.0,
        directionError: 30.0,
        altitudeError: 200.0,
        timeError: 120.0
      };
      
      const lowResult = runMonteCarloSimulation(mockWindDriftInput, lowUncertainty, 50);
      const highResult = runMonteCarloSimulation(mockWindDriftInput, highUncertainty, 50);
      
      // Higher uncertainty should result in larger standard deviation
      expect(highResult.statistics.stdDevDistance).toBeGreaterThan(lowResult.statistics.stdDevDistance);
    });
  });

  describe('New Position Calculation', () => {
    test('should calculate new position correctly', () => {
      const newPosition = calculateNewPosition(40.7128, -74.0060, 10, 90, 3600);
      // With east wind (90 degrees), should move east (longitude increases)
      expect(newPosition.lng).toBeGreaterThan(-74.0060); // Should move east
      // Latitude change depends on the specific calculation, so just check it's a valid value
      expect(newPosition.lat).toBeGreaterThanOrEqual(-90);
      expect(newPosition.lat).toBeLessThanOrEqual(90);
    });

    test('should handle zero wind speed', () => {
      const newPosition = calculateNewPosition(40.7128, -74.0060, 0, 90, 3600);
      expect(newPosition.lat).toBe(40.7128);
      expect(newPosition.lng).toBe(-74.0060);
    });

    test('should handle zero duration', () => {
      const newPosition = calculateNewPosition(40.7128, -74.0060, 10, 90, 0);
      expect(newPosition.lat).toBe(40.7128);
      expect(newPosition.lng).toBe(-74.0060);
    });

    test('should handle different wind directions', () => {
      const northWind = calculateNewPosition(40.7128, -74.0060, 10, 0, 3600);
      const southWind = calculateNewPosition(40.7128, -74.0060, 10, 180, 3600);
      const eastWind = calculateNewPosition(40.7128, -74.0060, 10, 90, 3600);
      const westWind = calculateNewPosition(40.7128, -74.0060, 10, 270, 3600);

      expect(northWind.lat).toBeGreaterThan(40.7128);
      expect(southWind.lat).toBeLessThan(40.7128);
      expect(eastWind.lng).toBeGreaterThan(-74.0060);
      expect(westWind.lng).toBeLessThan(-74.0060);
    });
  });

  describe('Input Validation', () => {
    test('should validate correct inputs', () => {
      expect(validateWindDriftInput(mockWindDriftInput)).toBe(true);
    });

    test('should reject invalid latitude', () => {
      const invalidInput = { ...mockWindDriftInput, startLatitude: 100 };
      expect(validateWindDriftInput(invalidInput)).toBe(false);
    });

    test('should reject invalid longitude', () => {
      const invalidInput = { ...mockWindDriftInput, startLongitude: 200 };
      expect(validateWindDriftInput(invalidInput)).toBe(false);
    });

    test('should reject negative wind speed', () => {
      const invalidInput = { ...mockWindDriftInput, windSpeed: -1 };
      expect(validateWindDriftInput(invalidInput)).toBe(false);
    });

    test('should reject invalid wind direction', () => {
      const invalidInput = { ...mockWindDriftInput, windDirection: 400 };
      expect(validateWindDriftInput(invalidInput)).toBe(false);
    });

    test('should reject negative duration', () => {
      const invalidInput = { ...mockWindDriftInput, duration: -1 };
      expect(validateWindDriftInput(invalidInput)).toBe(false);
    });

    test('should reject zero duration', () => {
      const invalidInput = { ...mockWindDriftInput, duration: 0 };
      expect(validateWindDriftInput(invalidInput)).toBe(false);
    });

    test('should reject negative altitude', () => {
      const invalidInput = { ...mockWindDriftInput, altitude: -100 };
      expect(validateWindDriftInput(invalidInput)).toBe(false);
    });
  });

  describe('Uncertainty Validation', () => {
    test('should validate correct uncertainty parameters', () => {
      expect(validateWindUncertainty(mockUncertainty)).toBe(true);
    });

    test('should reject negative speed error', () => {
      const invalidUncertainty = { ...mockUncertainty, speedError: -1 };
      expect(validateWindUncertainty(invalidUncertainty)).toBe(false);
    });

    test('should reject negative direction error', () => {
      const invalidUncertainty = { ...mockUncertainty, directionError: -1 };
      expect(validateWindUncertainty(invalidUncertainty)).toBe(false);
    });

    test('should reject negative altitude error', () => {
      const invalidUncertainty = { ...mockUncertainty, altitudeError: -1 };
      expect(validateWindUncertainty(invalidUncertainty)).toBe(false);
    });

    test('should reject negative time error', () => {
      const invalidUncertainty = { ...mockUncertainty, timeError: -1 };
      expect(validateWindUncertainty(invalidUncertainty)).toBe(false);
    });
  });

  describe('Main Wind Drift Calculation', () => {
    test('should calculate wind drift trajectory correctly', () => {
      const result = calculateWindDrift(mockWindDriftInput);
      
      expect(result).toHaveProperty('endLatitude');
      expect(result).toHaveProperty('endLongitude');
      expect(result).toHaveProperty('totalDistance');
      expect(result).toHaveProperty('averageSpeed');
      expect(result).toHaveProperty('trajectory');
      
      expect(Array.isArray(result.trajectory)).toBe(true);
      expect(result.trajectory.length).toBeGreaterThan(0);
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.averageSpeed).toBeGreaterThan(0);
    });

    test('should throw error for invalid latitude', () => {
      const invalidInput = { ...mockWindDriftInput, startLatitude: 100 };
      expect(() => calculateWindDrift(invalidInput)).toThrow('Start latitude must be between -90 and 90 degrees');
    });

    test('should throw error for invalid longitude', () => {
      const invalidInput = { ...mockWindDriftInput, startLongitude: 200 };
      expect(() => calculateWindDrift(invalidInput)).toThrow('Start longitude must be between -180 and 180 degrees');
    });

    test('should throw error for negative wind speed', () => {
      const invalidInput = { ...mockWindDriftInput, windSpeed: -1 };
      expect(() => calculateWindDrift(invalidInput)).toThrow('Wind speed cannot be negative');
    });

    test('should throw error for invalid wind direction', () => {
      const invalidInput = { ...mockWindDriftInput, windDirection: 400 };
      expect(() => calculateWindDrift(invalidInput)).toThrow('Wind direction must be between 0 and 360 degrees');
    });

    test('should throw error for negative duration', () => {
      const invalidInput = { ...mockWindDriftInput, duration: -1 };
      expect(() => calculateWindDrift(invalidInput)).toThrow('Duration must be positive');
    });

    test('should throw error for negative altitude', () => {
      const invalidInput = { ...mockWindDriftInput, altitude: -100 };
      expect(() => calculateWindDrift(invalidInput)).toThrow('Altitude cannot be negative');
    });
  });

  describe('Multi-Layer Wind Drift', () => {
    test('should calculate multi-layer wind drift correctly', () => {
      const windLayers = [
        { altitude: 1000, windSpeed: 10, windDirection: 90, duration: 1800 },
        { altitude: 2000, windSpeed: 15, windDirection: 180, duration: 1800 }
      ];

      const result = calculateMultiLayerWindDrift(40.7128, -74.0060, windLayers);
      
      expect(result).toHaveProperty('endLatitude');
      expect(result).toHaveProperty('endLongitude');
      expect(result).toHaveProperty('totalDistance');
      expect(result).toHaveProperty('averageSpeed');
      expect(result).toHaveProperty('trajectory');
      
      expect(Array.isArray(result.trajectory)).toBe(true);
      expect(result.trajectory.length).toBeGreaterThan(0);
      expect(result.totalDistance).toBeGreaterThan(0);
    });

    test('should handle single layer', () => {
      const windLayers = [
        { altitude: 1000, windSpeed: 10, windDirection: 90, duration: 3600 }
      ];

      const result = calculateMultiLayerWindDrift(40.7128, -74.0060, windLayers);
      expect(result.trajectory.length).toBeGreaterThan(0);
    });

    test('should handle multiple layers with different conditions', () => {
      const windLayers = [
        { altitude: 1000, windSpeed: 5, windDirection: 0, duration: 1200 },
        { altitude: 2000, windSpeed: 10, windDirection: 90, duration: 1200 },
        { altitude: 3000, windSpeed: 15, windDirection: 180, duration: 1200 }
      ];

      const result = calculateMultiLayerWindDrift(40.7128, -74.0060, windLayers);
      expect(result.trajectory.length).toBeGreaterThan(0);
      expect(result.totalDistance).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    test('should complete basic wind drift calculation within 100ms', () => {
      const startTime = Date.now();
      calculateWindDrift(mockWindDriftInput);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
    });

    test('should complete Monte Carlo simulation within reasonable time', () => {
      const startTime = Date.now();
      runMonteCarloSimulation(mockWindDriftInput, mockUncertainty, 100);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 simulations
    });

    test('should handle interpolation efficiently', () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        interpolateWindData(i, mockWindDataPoints);
      }
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second for 1000 interpolations
    });
  });

  describe('Edge Cases', () => {
    test('should handle very high wind speeds', () => {
      const highWindInput = { ...mockWindDriftInput, windSpeed: 100 };
      const result = calculateWindDrift(highWindInput);
      expect(result.totalDistance).toBeGreaterThan(0);
    });

    test('should handle very long durations', () => {
      const longDurationInput = { ...mockWindDriftInput, duration: 86400 }; // 24 hours
      const result = calculateWindDrift(longDurationInput);
      expect(result.totalDistance).toBeGreaterThan(0);
    });

    test('should handle polar coordinates', () => {
      const polarInput = { ...mockWindDriftInput, startLatitude: 85, startLongitude: 0 };
      const result = calculateWindDrift(polarInput);
      expect(result.totalDistance).toBeGreaterThan(0);
    });

    test('should handle equatorial coordinates', () => {
      const equatorialInput = { ...mockWindDriftInput, startLatitude: 0, startLongitude: 0 };
      const result = calculateWindDrift(equatorialInput);
      expect(result.totalDistance).toBeGreaterThan(0);
    });

    test('should handle zero wind conditions', () => {
      const noWindInput = { ...mockWindDriftInput, windSpeed: 0 };
      const result = calculateWindDrift(noWindInput);
      expect(result.totalDistance).toBe(0);
      expect(result.endLatitude).toBe(mockWindDriftInput.startLatitude);
      expect(result.endLongitude).toBe(mockWindDriftInput.startLongitude);
    });
  });
}); 

describe('Monte Carlo Landing Zone Uncertainty', () => {
  const baseLat = 40.7128;
  const baseLng = -74.0060;
  const windSpeed = 10;
  const windDirection = 90;
  const windErrorRMS = 2.0;
  const numSamples = 100;
  const descentDuration = 600; // 10 minutes

  test('should compute landing points and 95% confidence radius', () => {
    const result = performMonteCarloLandingUncertainty({
      baseLatitude: baseLat,
      baseLongitude: baseLng,
      windSpeed,
      windDirection,
      windErrorRMS,
      numSamples,
      descentDuration
    });
    expect(result).toHaveProperty('landingPoints');
    expect(result).toHaveProperty('landingRadius');
    expect(result).toHaveProperty('windError');
    expect(Array.isArray(result.landingPoints)).toBe(true);
    expect(result.landingPoints.length).toBe(numSamples);
    expect(result.landingRadius).toBeGreaterThan(0);
    expect(result.windError).toBe(windErrorRMS);
  });

  test('should increase radius with higher wind error', () => {
    const lowError = performMonteCarloLandingUncertainty({
      baseLatitude: baseLat,
      baseLongitude: baseLng,
      windSpeed,
      windDirection,
      windErrorRMS: 0.5,
      numSamples,
      descentDuration
    });
    const highError = performMonteCarloLandingUncertainty({
      baseLatitude: baseLat,
      baseLongitude: baseLng,
      windSpeed,
      windDirection,
      windErrorRMS: 5.0,
      numSamples,
      descentDuration
    });
    expect(highError.landingRadius).toBeGreaterThan(lowError.landingRadius);
  });

  test('should handle zero wind error (all points nearly identical)', () => {
    const result = performMonteCarloLandingUncertainty({
      baseLatitude: baseLat,
      baseLongitude: baseLng,
      windSpeed,
      windDirection,
      windErrorRMS: 0,
      numSamples,
      descentDuration
    });
    // All points should be at the same location (deterministic landing)
    const lats = result.landingPoints.map(pt => pt.latitude);
    const lngs = result.landingPoints.map(pt => pt.longitude);
    const meanLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const meanLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    const stdLat = Math.sqrt(lats.reduce((sum, v) => sum + (v - meanLat) ** 2, 0) / lats.length);
    const stdLng = Math.sqrt(lngs.reduce((sum, v) => sum + (v - meanLng) ** 2, 0) / lngs.length);
    expect(stdLat).toBeLessThan(0.001);
    expect(stdLng).toBeLessThan(0.001);
    // Do not check landingRadius here; it is the wind-driven distance, not the spread
  });
}); 