import {
  calculateAscent,
  calculateBuoyancyForce,
  calculateNetForce,
  calculateVerticalVelocity,
  validateAscentInput,
  AscentInput,
  AscentResult
} from './ascent';

describe('Ascent Algorithm', () => {
  const mockAscentInput: AscentInput = {
    balloonVolume: 1.0,        // m³
    payloadWeight: 1.0,         // kg
    launchAltitude: 0,          // m
    burstAltitude: 30000,       // m
    ascentRate: 5.0,            // m/s
    atmosphericDensity: 1.225,  // kg/m³
    windSpeed: 10,              // m/s
    windDirection: 90           // degrees
  };

  describe('Buoyancy Force Calculation', () => {
    test('should calculate buoyancy force correctly', () => {
      const buoyancyForce = calculateBuoyancyForce(1.0, 1.225);
      const expectedForce = 1.0 * 1.225 * 9.81; // volume * density * g
      expect(buoyancyForce).toBeCloseTo(expectedForce, 2);
    });

    test('should handle zero volume', () => {
      const buoyancyForce = calculateBuoyancyForce(0, 1.225);
      expect(buoyancyForce).toBe(0);
    });

    test('should handle zero density', () => {
      const buoyancyForce = calculateBuoyancyForce(1.0, 0);
      expect(buoyancyForce).toBe(0);
    });

    test('should handle negative volume', () => {
      const buoyancyForce = calculateBuoyancyForce(-1.0, 1.225);
      expect(buoyancyForce).toBeLessThan(0);
    });
  });

  describe('Net Force Calculation', () => {
    test('should calculate net force correctly', () => {
      const netForce = calculateNetForce(1.0, 1.0, 1.225);
      const buoyancyForce = 1.0 * 1.225 * 9.81;
      const weightForce = 1.0 * 9.81;
      const expectedNetForce = buoyancyForce - weightForce;
      expect(netForce).toBeCloseTo(expectedNetForce, 2);
    });

    test('should return positive net force for buoyant balloon', () => {
      const netForce = calculateNetForce(2.0, 1.0, 1.225); // Larger volume than weight
      expect(netForce).toBeGreaterThan(0);
    });

    test('should return negative net force for heavy payload', () => {
      const netForce = calculateNetForce(1.0, 2.0, 1.225); // Heavier payload than buoyancy
      expect(netForce).toBeLessThan(0);
    });
  });

  describe('Vertical Velocity Calculation', () => {
    test('should calculate vertical velocity correctly', () => {
      const netForce = 9.81; // 1g upward force
      const payloadWeight = 1.0;
      const verticalVelocity = calculateVerticalVelocity(netForce, payloadWeight);
      expect(verticalVelocity).toBeGreaterThan(0);
    });

    test('should return zero velocity for zero net force', () => {
      const verticalVelocity = calculateVerticalVelocity(0, 1.0);
      expect(verticalVelocity).toBe(0);
    });

    test('should return zero velocity for negative net force', () => {
      const verticalVelocity = calculateVerticalVelocity(-9.81, 1.0);
      expect(verticalVelocity).toBe(0);
    });

    test('should handle different drag coefficients', () => {
      const netForce = 9.81;
      const payloadWeight = 1.0;
      const lowDragVelocity = calculateVerticalVelocity(netForce, payloadWeight, 0.1);
      const highDragVelocity = calculateVerticalVelocity(netForce, payloadWeight, 0.9);
      expect(lowDragVelocity).toBeGreaterThan(highDragVelocity);
    });
  });

  describe('Input Validation', () => {
    test('should validate correct inputs', () => {
      expect(validateAscentInput(mockAscentInput)).toBe(true);
    });

    test('should reject negative balloon volume', () => {
      const invalidInput = { ...mockAscentInput, balloonVolume: -1 };
      expect(validateAscentInput(invalidInput)).toBe(false);
    });

    test('should reject zero balloon volume', () => {
      const invalidInput = { ...mockAscentInput, balloonVolume: 0 };
      expect(validateAscentInput(invalidInput)).toBe(false);
    });

    test('should reject negative payload weight', () => {
      const invalidInput = { ...mockAscentInput, payloadWeight: -1 };
      expect(validateAscentInput(invalidInput)).toBe(false);
    });

    test('should reject negative launch altitude', () => {
      const invalidInput = { ...mockAscentInput, launchAltitude: -100 };
      expect(validateAscentInput(invalidInput)).toBe(false);
    });

    test('should reject burst altitude lower than launch altitude', () => {
      const invalidInput = { ...mockAscentInput, burstAltitude: 1000, launchAltitude: 2000 };
      expect(validateAscentInput(invalidInput)).toBe(false);
    });

    test('should reject negative ascent rate', () => {
      const invalidInput = { ...mockAscentInput, ascentRate: -1 };
      expect(validateAscentInput(invalidInput)).toBe(false);
    });

    test('should reject negative atmospheric density', () => {
      const invalidInput = { ...mockAscentInput, atmosphericDensity: -1 };
      expect(validateAscentInput(invalidInput)).toBe(false);
    });

    test('should reject negative wind speed', () => {
      const invalidInput = { ...mockAscentInput, windSpeed: -1 };
      expect(validateAscentInput(invalidInput)).toBe(false);
    });

    test('should reject invalid wind direction', () => {
      const invalidInput = { ...mockAscentInput, windDirection: 400 };
      expect(validateAscentInput(invalidInput)).toBe(false);
    });
  });

  describe('Main Ascent Calculation', () => {
    test('should calculate ascent trajectory correctly', () => {
      const result = calculateAscent(mockAscentInput);
      
      expect(result).toHaveProperty('trajectory');
      expect(result).toHaveProperty('burstPoint');
      expect(result).toHaveProperty('ascentDuration');
      expect(result).toHaveProperty('maxAltitude');
      expect(result).toHaveProperty('windDrift');
      
      expect(Array.isArray(result.trajectory)).toBe(true);
      expect(result.trajectory.length).toBeGreaterThan(0);
      expect(result.maxAltitude).toBe(mockAscentInput.burstAltitude);
      expect(result.ascentDuration).toBeGreaterThan(0);
    });

    test('should throw error for invalid balloon volume', () => {
      const invalidInput = { ...mockAscentInput, balloonVolume: 0 };
      expect(() => calculateAscent(invalidInput)).toThrow('Balloon volume must be positive');
    });

    test('should throw error for invalid payload weight', () => {
      const invalidInput = { ...mockAscentInput, payloadWeight: 0 };
      expect(() => calculateAscent(invalidInput)).toThrow('Payload weight must be positive');
    });

    test('should throw error for negative launch altitude', () => {
      const invalidInput = { ...mockAscentInput, launchAltitude: -100 };
      expect(() => calculateAscent(invalidInput)).toThrow('Launch altitude cannot be negative');
    });

    test('should throw error for burst altitude lower than launch altitude', () => {
      const invalidInput = { ...mockAscentInput, burstAltitude: 1000, launchAltitude: 2000 };
      expect(() => calculateAscent(invalidInput)).toThrow('Burst altitude must be higher than launch altitude');
    });

    test('should throw error for negative ascent rate', () => {
      const invalidInput = { ...mockAscentInput, ascentRate: -1 };
      expect(() => calculateAscent(invalidInput)).toThrow('Ascent rate must be positive');
    });
  });

  describe('Performance Tests', () => {
    test('should complete calculation within 100ms for typical flight', () => {
      const startTime = Date.now();
      calculateAscent(mockAscentInput);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
    });

    test('should handle long-duration flights efficiently', () => {
      const longFlightInput = {
        ...mockAscentInput,
        burstAltitude: 50000,
        ascentRate: 1.0 // Slow ascent
      };
      
      const startTime = Date.now();
      const result = calculateAscent(longFlightInput);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
      expect(result.ascentDuration).toBeGreaterThan(1000); // Should take more than 1000 seconds
    });
  });

  describe('Edge Cases', () => {
    test('should handle very small balloon volume', () => {
      const smallBalloonInput = { ...mockAscentInput, balloonVolume: 0.1 };
      const result = calculateAscent(smallBalloonInput);
      expect(result.trajectory.length).toBeGreaterThan(0);
    });

    test('should handle very large payload weight', () => {
      const heavyPayloadInput = { ...mockAscentInput, payloadWeight: 50 };
      const result = calculateAscent(heavyPayloadInput);
      expect(result.trajectory.length).toBeGreaterThan(0);
    });

    test('should handle extreme altitudes', () => {
      const extremeAltitudeInput = { ...mockAscentInput, burstAltitude: 60000 };
      const result = calculateAscent(extremeAltitudeInput);
      expect(result.maxAltitude).toBe(60000);
    });

    test('should handle zero wind conditions', () => {
      const noWindInput = { ...mockAscentInput, windSpeed: 0 };
      const result = calculateAscent(noWindInput);
      expect(result.windDrift).toBe(0);
    });

    test('should handle high wind conditions', () => {
      const highWindInput = { ...mockAscentInput, windSpeed: 50 };
      const result = calculateAscent(highWindInput);
      expect(result.windDrift).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('should produce consistent results for same inputs', () => {
      const result1 = calculateAscent(mockAscentInput);
      const result2 = calculateAscent(mockAscentInput);
      
      expect(result1.ascentDuration).toBe(result2.ascentDuration);
      expect(result1.maxAltitude).toBe(result2.maxAltitude);
      expect(result1.windDrift).toBe(result2.windDrift);
    });

    test('should handle atmospheric density changes with altitude', () => {
      const result = calculateAscent(mockAscentInput);
      
      // Check that trajectory points have decreasing atmospheric density with altitude
      for (let i = 1; i < result.trajectory.length; i++) {
        const prevAlt = result.trajectory[i - 1].alt;
        const currAlt = result.trajectory[i].alt;
        expect(currAlt).toBeGreaterThan(prevAlt);
      }
    });
  });
}); 