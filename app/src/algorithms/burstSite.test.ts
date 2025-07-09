import {
  predictBurstSite,
  validateBurstSiteInput,
  estimateBurstTime,
  predictBurstSiteWithUncertainty,
  BurstSiteInput,
  BurstSiteResult
} from './burstSite';

describe('Burst Site Prediction Algorithm', () => {
  const mockBurstSiteInput: BurstSiteInput = {
    launchLatitude: 40.7128,    // New York City
    launchLongitude: -74.0060,  // New York City
    launchAltitude: 0,           // m
    burstAltitude: 30000,        // m
    balloonVolume: 1.0,          // m³
    payloadWeight: 1.0,          // kg
    ascentRate: 5.0,             // m/s
    windSpeed: 10,               // m/s
    windDirection: 90            // degrees (east)
  };

  describe('Input Validation', () => {
    test('should validate correct inputs', () => {
      expect(validateBurstSiteInput(mockBurstSiteInput)).toBe(true);
    });

    test('should reject invalid latitude', () => {
      const invalidInput = { ...mockBurstSiteInput, launchLatitude: 100 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject invalid longitude', () => {
      const invalidInput = { ...mockBurstSiteInput, launchLongitude: 200 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject negative launch altitude', () => {
      const invalidInput = { ...mockBurstSiteInput, launchAltitude: -100 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject burst altitude lower than launch altitude', () => {
      const invalidInput = { ...mockBurstSiteInput, burstAltitude: 1000, launchAltitude: 2000 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject negative balloon volume', () => {
      const invalidInput = { ...mockBurstSiteInput, balloonVolume: -1 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject zero balloon volume', () => {
      const invalidInput = { ...mockBurstSiteInput, balloonVolume: 0 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject negative payload weight', () => {
      const invalidInput = { ...mockBurstSiteInput, payloadWeight: -1 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject zero payload weight', () => {
      const invalidInput = { ...mockBurstSiteInput, payloadWeight: 0 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject negative ascent rate', () => {
      const invalidInput = { ...mockBurstSiteInput, ascentRate: -1 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject zero ascent rate', () => {
      const invalidInput = { ...mockBurstSiteInput, ascentRate: 0 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject negative wind speed', () => {
      const invalidInput = { ...mockBurstSiteInput, windSpeed: -1 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject invalid wind direction', () => {
      const invalidInput = { ...mockBurstSiteInput, windDirection: 400 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });

    test('should reject negative max flight time', () => {
      const invalidInput = { ...mockBurstSiteInput, maxFlightTime: -1 };
      expect(validateBurstSiteInput(invalidInput)).toBe(false);
    });
  });

  describe('Burst Time Estimation', () => {
    test('should estimate burst time correctly', () => {
      const estimatedTime = estimateBurstTime(0, 30000, 5.0);
      const expectedTime = 30000 / 5.0; // altitude difference / ascent rate
      expect(estimatedTime).toBe(expectedTime);
    });

    test('should handle different ascent rates', () => {
      const slowAscent = estimateBurstTime(0, 30000, 2.0);
      const fastAscent = estimateBurstTime(0, 30000, 10.0);
      expect(slowAscent).toBeGreaterThan(fastAscent);
    });

    test('should handle different altitude differences', () => {
      const lowAltitude = estimateBurstTime(0, 10000, 5.0);
      const highAltitude = estimateBurstTime(0, 50000, 5.0);
      expect(highAltitude).toBeGreaterThan(lowAltitude);
    });

    test('should throw error for negative ascent rate', () => {
      expect(() => estimateBurstTime(0, 30000, -1)).toThrow('Ascent rate must be positive');
    });

    test('should throw error for zero ascent rate', () => {
      expect(() => estimateBurstTime(0, 30000, 0)).toThrow('Ascent rate must be positive');
    });
  });

  describe('Main Burst Site Prediction', () => {
    test('should predict burst site correctly', () => {
      const result = predictBurstSite(mockBurstSiteInput);
      
      expect(result).toHaveProperty('burstLatitude');
      expect(result).toHaveProperty('burstLongitude');
      expect(result).toHaveProperty('burstAltitude');
      expect(result).toHaveProperty('burstTime');
      expect(result).toHaveProperty('totalWindDrift');
      expect(result).toHaveProperty('ascentDuration');
      expect(result).toHaveProperty('trajectory');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('earlyBurstRisk');
      
      expect(Array.isArray(result.trajectory)).toBe(true);
      expect(result.trajectory.length).toBeGreaterThan(0);
      expect(result.burstAltitude).toBeGreaterThanOrEqual(mockBurstSiteInput.launchAltitude);
      expect(result.burstTime).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.earlyBurstRisk).toBeGreaterThanOrEqual(0);
      expect(result.earlyBurstRisk).toBeLessThanOrEqual(1);
    });

    test('should throw error for invalid latitude', () => {
      const invalidInput = { ...mockBurstSiteInput, launchLatitude: 100 };
      expect(() => predictBurstSite(invalidInput)).toThrow('Launch latitude must be between -90 and 90 degrees');
    });

    test('should throw error for invalid longitude', () => {
      const invalidInput = { ...mockBurstSiteInput, launchLongitude: 200 };
      expect(() => predictBurstSite(invalidInput)).toThrow('Launch longitude must be between -180 and 180 degrees');
    });

    test('should throw error for negative launch altitude', () => {
      const invalidInput = { ...mockBurstSiteInput, launchAltitude: -100 };
      expect(() => predictBurstSite(invalidInput)).toThrow('Launch altitude cannot be negative');
    });

    test('should throw error for burst altitude lower than launch altitude', () => {
      const invalidInput = { ...mockBurstSiteInput, burstAltitude: 1000, launchAltitude: 2000 };
      expect(() => predictBurstSite(invalidInput)).toThrow('Burst altitude must be higher than launch altitude');
    });

    test('should throw error for negative balloon volume', () => {
      const invalidInput = { ...mockBurstSiteInput, balloonVolume: 0 };
      expect(() => predictBurstSite(invalidInput)).toThrow('Balloon volume must be positive');
    });

    test('should throw error for negative payload weight', () => {
      const invalidInput = { ...mockBurstSiteInput, payloadWeight: 0 };
      expect(() => predictBurstSite(invalidInput)).toThrow('Payload weight must be positive');
    });

    test('should throw error for negative ascent rate', () => {
      const invalidInput = { ...mockBurstSiteInput, ascentRate: 0 };
      expect(() => predictBurstSite(invalidInput)).toThrow('Ascent rate must be positive');
    });

    test('should throw error for negative wind speed', () => {
      const invalidInput = { ...mockBurstSiteInput, windSpeed: -1 };
      expect(() => predictBurstSite(invalidInput)).toThrow('Wind speed cannot be negative');
    });

    test('should throw error for invalid wind direction', () => {
      const invalidInput = { ...mockBurstSiteInput, windDirection: 400 };
      expect(() => predictBurstSite(invalidInput)).toThrow('Wind direction must be between 0 and 360 degrees');
    });
  });

  describe('Wind Drift Integration', () => {
    test('should account for wind drift in burst location', () => {
      const noWindInput = { ...mockBurstSiteInput, windSpeed: 0 };
      const highWindInput = { ...mockBurstSiteInput, windSpeed: 20 };
      
      const noWindResult = predictBurstSite(noWindInput);
      const highWindResult = predictBurstSite(highWindInput);
      
      // High wind should result in different burst coordinates
      expect(highWindResult.burstLatitude).not.toBe(noWindResult.burstLatitude);
      expect(highWindResult.burstLongitude).not.toBe(noWindResult.burstLongitude);
      expect(highWindResult.totalWindDrift).toBeGreaterThan(noWindResult.totalWindDrift);
    });

    test('should handle different wind directions', () => {
      const northWindInput = { ...mockBurstSiteInput, windDirection: 0 };
      const southWindInput = { ...mockBurstSiteInput, windDirection: 180 };
      const eastWindInput = { ...mockBurstSiteInput, windDirection: 90 };
      const westWindInput = { ...mockBurstSiteInput, windDirection: 270 };
      
      const northResult = predictBurstSite(northWindInput);
      const southResult = predictBurstSite(southWindInput);
      const eastResult = predictBurstSite(eastWindInput);
      const westResult = predictBurstSite(westWindInput);
      
      // Different wind directions should result in different burst locations
      expect(northResult.burstLatitude).not.toBe(southResult.burstLatitude);
      expect(eastResult.burstLongitude).not.toBe(westResult.burstLongitude);
    });

    test('should use altitude-specific wind data when available', () => {
      const altitudeWindInput = {
        ...mockBurstSiteInput,
        windSpeedAtAltitude: 15,
        windDirectionAtAltitude: 180
      };
      
      const result = predictBurstSite(altitudeWindInput);
      expect(result.totalWindDrift).toBeGreaterThan(0);
    });
  });

  describe('Atmospheric Integration', () => {
    test('should consider atmospheric density changes', () => {
      const lowAltitudeInput = { ...mockBurstSiteInput, burstAltitude: 5000, maxFlightTime: 7200 };
      const highAltitudeInput = { ...mockBurstSiteInput, burstAltitude: 50000, maxFlightTime: 20000 };
      
      const lowResult = predictBurstSite(lowAltitudeInput);
      const highResult = predictBurstSite(highAltitudeInput);
      
      // Different altitudes should result in different burst times
      expect(lowResult.burstTime).not.toBe(highResult.burstTime);
    });

    test('should handle early burst scenarios', () => {
      const highRiskInput = {
        ...mockBurstSiteInput,
        burstAltitude: 50000,
        balloonVolume: 0.1, // Very small balloon, higher risk
        payloadWeight: 5.0   // Very heavy payload, higher risk
      };
      
      const result = predictBurstSite(highRiskInput);
      expect(result.earlyBurstRisk).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very low burst altitude', () => {
      const lowAltitudeInput = { ...mockBurstSiteInput, burstAltitude: 100 };
      const result = predictBurstSite(lowAltitudeInput);
      expect(result.burstAltitude).toBeGreaterThanOrEqual(100);
    });

    test('should handle very high burst altitude', () => {
      const highAltitudeInput = { ...mockBurstSiteInput, burstAltitude: 100000 };
      const result = predictBurstSite(highAltitudeInput);
      expect(result.burstAltitude).toBeGreaterThanOrEqual(mockBurstSiteInput.launchAltitude);
    });

    test('should handle maximum flight time limit', () => {
      const shortFlightInput = { ...mockBurstSiteInput, maxFlightTime: 100 };
      const result = predictBurstSite(shortFlightInput);
      expect(result.burstTime).toBeLessThanOrEqual(100);
    });

    test('should handle zero wind conditions', () => {
      const noWindInput = { ...mockBurstSiteInput, windSpeed: 0 };
      const result = predictBurstSite(noWindInput);
      expect(result.totalWindDrift).toBe(0);
      expect(result.burstLatitude).toBe(mockBurstSiteInput.launchLatitude);
      expect(result.burstLongitude).toBe(mockBurstSiteInput.launchLongitude);
    });

    test('should handle polar coordinates', () => {
      const polarInput = { ...mockBurstSiteInput, launchLatitude: 85, launchLongitude: 0 };
      const result = predictBurstSite(polarInput);
      expect(result.burstLatitude).toBeGreaterThanOrEqual(-90);
      expect(result.burstLatitude).toBeLessThanOrEqual(90);
    });

    test('should handle equatorial coordinates', () => {
      const equatorialInput = { ...mockBurstSiteInput, launchLatitude: 0, launchLongitude: 0 };
      const result = predictBurstSite(equatorialInput);
      expect(result.burstLatitude).toBeGreaterThanOrEqual(-90);
      expect(result.burstLatitude).toBeLessThanOrEqual(90);
    });
  });

  describe('Uncertainty Modeling', () => {
    test('should handle burst site prediction with uncertainty', () => {
      const uncertainty = {
        windSpeedError: 2.0,
        windDirectionError: 15.0,
        ascentRateError: 0.5,
        burstAltitudeError: 500.0
      };
      
      const result = predictBurstSiteWithUncertainty(mockBurstSiteInput, uncertainty);
      
      expect(result).toHaveProperty('burstLatitude');
      expect(result).toHaveProperty('burstLongitude');
      expect(result).toHaveProperty('burstAltitude');
      expect(result).toHaveProperty('burstTime');
      expect(result.burstAltitude).toBeGreaterThanOrEqual(mockBurstSiteInput.launchAltitude);
    });

    test('should produce different results with uncertainty', () => {
      const uncertainty = {
        windSpeedError: 5.0,
        windDirectionError: 30.0,
        ascentRateError: 1.0,
        burstAltitudeError: 1000.0
      };
      
      const result1 = predictBurstSiteWithUncertainty(mockBurstSiteInput, uncertainty);
      const result2 = predictBurstSiteWithUncertainty(mockBurstSiteInput, uncertainty);
      
      // Results should be different due to random uncertainty
      expect(result1.burstLatitude).not.toBe(result2.burstLatitude);
      expect(result1.burstLongitude).not.toBe(result2.burstLongitude);
    });
  });

  describe('Performance Tests', () => {
    test('should complete prediction within 200ms for typical flight', () => {
      const startTime = Date.now();
      predictBurstSite(mockBurstSiteInput);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });

    test('should handle high-altitude flights efficiently', () => {
      const highAltitudeInput = { ...mockBurstSiteInput, burstAltitude: 50000 };
      
      const startTime = Date.now();
      predictBurstSite(highAltitudeInput);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });

    test('should handle uncertainty calculations efficiently', () => {
      const uncertainty = {
        windSpeedError: 2.0,
        windDirectionError: 15.0,
        ascentRateError: 0.5,
        burstAltitudeError: 500.0
      };
      
      const startTime = Date.now();
      predictBurstSiteWithUncertainty(mockBurstSiteInput, uncertainty);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Trajectory Analysis', () => {
    test('should generate trajectory with proper phase markers', () => {
      const result = predictBurstSite(mockBurstSiteInput);
      
      expect(result.trajectory.length).toBeGreaterThan(0);
      
      // Check that trajectory points have proper phase markers
      for (const point of result.trajectory) {
        expect(point.phase).toMatch(/^(ascent|burst)$/);
        expect(point.lat).toBeGreaterThanOrEqual(-90);
        expect(point.lat).toBeLessThanOrEqual(90);
        expect(point.lng).toBeGreaterThanOrEqual(-180);
        expect(point.lng).toBeLessThanOrEqual(180);
        expect(point.alt).toBeGreaterThanOrEqual(mockBurstSiteInput.launchAltitude);
        expect(point.atmosphericDensity).toBeGreaterThan(0);
      }
    });

    test('should have increasing altitude in trajectory', () => {
      const result = predictBurstSite(mockBurstSiteInput);
      
      for (let i = 1; i < result.trajectory.length; i++) {
        const prevAlt = result.trajectory[i - 1].alt;
        const currAlt = result.trajectory[i].alt;
        expect(currAlt).toBeGreaterThanOrEqual(prevAlt);
      }
    });

    test('should have proper timestamps in trajectory', () => {
      const result = predictBurstSite(mockBurstSiteInput);
      
      for (let i = 1; i < result.trajectory.length; i++) {
        const prevTime = new Date(result.trajectory[i - 1].timestamp).getTime();
        const currTime = new Date(result.trajectory[i].timestamp).getTime();
        expect(currTime).toBeGreaterThan(prevTime);
      }
    });
  });
}); 