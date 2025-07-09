import {
  calculateDescent,
  calculateTerminalVelocity,
  calculateDragForce,
  calculateDescentNetForce,
  calculateDescentVelocity,
  validateDescentInput,
  estimateDescentTime,
  predictLandingSite,
  DescentInput,
  DescentResult
} from './descent';

describe('Descent Algorithm', () => {
  const mockDescentInput: DescentInput = {
    burstLatitude: 40.7128,   // degrees (New York)
    burstLongitude: -74.0060, // degrees
    burstAltitude: 30000,     // m
    payloadWeight: 1.0,       // kg
    parachuteArea: 2.0,       // m²
    dragCoefficient: 1.2,     // dimensionless
    windSpeed: 10,            // m/s
    windDirection: 90,        // degrees
    landingAltitude: 0        // m (ground level)
  };

  describe('Terminal Velocity Calculation', () => {
    test('should calculate terminal velocity correctly', () => {
      const atmosphericDensity = 1.225; // kg/m³ (sea level)
      const terminalVelocity = calculateTerminalVelocity(1.0, atmosphericDensity, 2.0, 1.2);
      
      // Expected: sqrt((2 * 1.0 * 9.81) / (1.225 * 2.0 * 1.2))
      const expectedVelocity = Math.sqrt((2 * 1.0 * 9.81) / (1.225 * 2.0 * 1.2));
      expect(terminalVelocity).toBeCloseTo(expectedVelocity, 2);
    });

    test('should handle different atmospheric densities', () => {
      const seaLevelDensity = 1.225;
      const highAltitudeDensity = 0.5;
      
      const seaLevelVelocity = calculateTerminalVelocity(1.0, seaLevelDensity, 2.0, 1.2);
      const highAltitudeVelocity = calculateTerminalVelocity(1.0, highAltitudeDensity, 2.0, 1.2);
      
      // Higher density should result in lower terminal velocity
      expect(seaLevelVelocity).toBeLessThan(highAltitudeVelocity);
    });

    test('should handle different parachute areas', () => {
      const smallParachute = 1.0;
      const largeParachute = 4.0;
      
      const smallParachuteVelocity = calculateTerminalVelocity(1.0, 1.225, smallParachute, 1.2);
      const largeParachuteVelocity = calculateTerminalVelocity(1.0, 1.225, largeParachute, 1.2);
      
      // Larger parachute should result in lower terminal velocity
      expect(largeParachuteVelocity).toBeLessThan(smallParachuteVelocity);
    });

    test('should throw error for invalid parameters', () => {
      expect(() => calculateTerminalVelocity(1.0, 0, 2.0, 1.2)).toThrow('Invalid parameters for terminal velocity calculation');
      expect(() => calculateTerminalVelocity(1.0, 1.225, 0, 1.2)).toThrow('Invalid parameters for terminal velocity calculation');
      expect(() => calculateTerminalVelocity(1.0, 1.225, 2.0, 0)).toThrow('Invalid parameters for terminal velocity calculation');
    });
  });

  describe('Drag Force Calculation', () => {
    test('should calculate drag force correctly', () => {
      const velocity = 10; // m/s
      const atmosphericDensity = 1.225; // kg/m³
      const parachuteArea = 2.0; // m²
      const dragCoefficient = 1.2;
      
      const dragForce = calculateDragForce(velocity, atmosphericDensity, parachuteArea, dragCoefficient);
      
      // Expected: 0.5 * 1.225 * 10² * 2.0 * 1.2 = 147 N
      const expectedForce = 0.5 * atmosphericDensity * Math.pow(velocity, 2) * parachuteArea * dragCoefficient;
      expect(dragForce).toBeCloseTo(expectedForce, 2);
    });

    test('should handle zero velocity', () => {
      const dragForce = calculateDragForce(0, 1.225, 2.0, 1.2);
      expect(dragForce).toBe(0);
    });

    test('should handle different velocities', () => {
      const lowVelocity = 5;
      const highVelocity = 15;
      
      const lowVelocityDrag = calculateDragForce(lowVelocity, 1.225, 2.0, 1.2);
      const highVelocityDrag = calculateDragForce(highVelocity, 1.225, 2.0, 1.2);
      
      // Higher velocity should result in higher drag force (quadratic relationship)
      expect(highVelocityDrag).toBeGreaterThan(lowVelocityDrag);
      expect(highVelocityDrag).toBeCloseTo(lowVelocityDrag * Math.pow(highVelocity / lowVelocity, 2), 2);
    });
  });

  describe('Net Force Calculation', () => {
    test('should calculate net force correctly', () => {
      const payloadWeight = 1.0; // kg
      const dragForce = 9.81; // N (equal to weight force)
      
      const netForce = calculateDescentNetForce(payloadWeight, dragForce);
      
      // Expected: weight force - drag force = 9.81 - 9.81 = 0
      const expectedForce = payloadWeight * 9.81 - dragForce;
      expect(netForce).toBeCloseTo(expectedForce, 2);
    });

    test('should return positive net force when drag is less than weight', () => {
      const payloadWeight = 1.0;
      const dragForce = 5.0; // Less than weight force (9.81)
      
      const netForce = calculateDescentNetForce(payloadWeight, dragForce);
      expect(netForce).toBeGreaterThan(0);
    });

    test('should return negative net force when drag is greater than weight', () => {
      const payloadWeight = 1.0;
      const dragForce = 15.0; // Greater than weight force (9.81)
      
      const netForce = calculateDescentNetForce(payloadWeight, dragForce);
      expect(netForce).toBeLessThan(0);
    });
  });

  describe('Descent Velocity Calculation', () => {
    test('should calculate descent velocity correctly', () => {
      const netForce = 4.905; // N (half of weight force)
      const payloadWeight = 1.0; // kg
      const currentVelocity = 5; // m/s
      const timeStep = 1; // s
      
      const newVelocity = calculateDescentVelocity(netForce, payloadWeight, currentVelocity, timeStep);
      
      // Expected: current velocity + (net force / mass) * time step
      const expectedVelocity = currentVelocity + (netForce / payloadWeight) * timeStep;
      expect(newVelocity).toBeCloseTo(expectedVelocity, 2);
    });

    test('should prevent negative velocity', () => {
      const netForce = -20; // N (large negative force)
      const payloadWeight = 1.0;
      const currentVelocity = 2; // m/s
      
      const newVelocity = calculateDescentVelocity(netForce, payloadWeight, currentVelocity);
      expect(newVelocity).toBe(0); // Should not go negative
    });

    test('should handle zero net force', () => {
      const netForce = 0;
      const payloadWeight = 1.0;
      const currentVelocity = 10; // m/s
      
      const newVelocity = calculateDescentVelocity(netForce, payloadWeight, currentVelocity);
      expect(newVelocity).toBe(currentVelocity); // Velocity should remain unchanged
    });
  });

  describe('Input Validation', () => {
    test('should validate correct inputs', () => {
      expect(validateDescentInput(mockDescentInput)).toBe(true);
    });

    test('should reject invalid burst latitude', () => {
      const invalidInput = { ...mockDescentInput, burstLatitude: 100 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject invalid burst longitude', () => {
      const invalidInput = { ...mockDescentInput, burstLongitude: 200 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject negative burst altitude', () => {
      const invalidInput = { ...mockDescentInput, burstAltitude: -1 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject zero burst altitude', () => {
      const invalidInput = { ...mockDescentInput, burstAltitude: 0 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject negative payload weight', () => {
      const invalidInput = { ...mockDescentInput, payloadWeight: -1 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject zero payload weight', () => {
      const invalidInput = { ...mockDescentInput, payloadWeight: 0 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject negative parachute area', () => {
      const invalidInput = { ...mockDescentInput, parachuteArea: -1 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject zero parachute area', () => {
      const invalidInput = { ...mockDescentInput, parachuteArea: 0 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject negative drag coefficient', () => {
      const invalidInput = { ...mockDescentInput, dragCoefficient: -1 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject zero drag coefficient', () => {
      const invalidInput = { ...mockDescentInput, dragCoefficient: 0 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject negative landing altitude', () => {
      const invalidInput = { ...mockDescentInput, landingAltitude: -100 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject burst altitude lower than landing altitude', () => {
      const invalidInput = { ...mockDescentInput, burstAltitude: 1000, landingAltitude: 2000 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });

    test('should reject invalid wind direction', () => {
      const invalidInput = { ...mockDescentInput, windDirection: 400 };
      expect(validateDescentInput(invalidInput)).toBe(false);
    });
  });

  describe('Main Descent Calculation', () => {
    test('should calculate descent trajectory correctly', () => {
      const result = calculateDescent(mockDescentInput);
      
      expect(result).toHaveProperty('trajectory');
      expect(result).toHaveProperty('landingPoint');
      expect(result).toHaveProperty('landingLatitude');
      expect(result).toHaveProperty('landingLongitude');
      expect(result).toHaveProperty('landingTime');
      expect(result).toHaveProperty('descentDuration');
      expect(result).toHaveProperty('terminalVelocity');
      expect(result).toHaveProperty('windDrift');
      expect(result).toHaveProperty('maxVelocity');
      expect(result).toHaveProperty('totalFlightDistance');
      expect(result).toHaveProperty('confidence');
      
      expect(Array.isArray(result.trajectory)).toBe(true);
      expect(result.trajectory.length).toBeGreaterThan(0);
      expect(result.descentDuration).toBeGreaterThan(0);
      expect(result.terminalVelocity).toBeGreaterThan(0);
      expect(result.maxVelocity).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should calculate landing coordinates correctly', () => {
      const result = calculateDescent(mockDescentInput);
      
      // Landing coordinates should be different from burst coordinates due to wind drift
      expect(result.landingLatitude).not.toBe(mockDescentInput.burstLatitude);
      expect(result.landingLongitude).not.toBe(mockDescentInput.burstLongitude);
      
      // Landing coordinates should be within reasonable bounds
      expect(result.landingLatitude).toBeGreaterThanOrEqual(-90);
      expect(result.landingLatitude).toBeLessThanOrEqual(90);
      expect(result.landingLongitude).toBeGreaterThanOrEqual(-180);
      expect(result.landingLongitude).toBeLessThanOrEqual(180);
    });

    test('should throw error for invalid burst latitude', () => {
      const invalidInput = { ...mockDescentInput, burstLatitude: 100 };
      expect(() => calculateDescent(invalidInput)).toThrow('Burst latitude must be between -90 and 90 degrees');
    });

    test('should throw error for invalid burst longitude', () => {
      const invalidInput = { ...mockDescentInput, burstLongitude: 200 };
      expect(() => calculateDescent(invalidInput)).toThrow('Burst longitude must be between -180 and 180 degrees');
    });

    test('should throw error for invalid burst altitude', () => {
      const invalidInput = { ...mockDescentInput, burstAltitude: 0 };
      expect(() => calculateDescent(invalidInput)).toThrow('Burst altitude must be positive');
    });

    test('should throw error for invalid payload weight', () => {
      const invalidInput = { ...mockDescentInput, payloadWeight: 0 };
      expect(() => calculateDescent(invalidInput)).toThrow('Payload weight must be positive');
    });

    test('should throw error for invalid parachute area', () => {
      const invalidInput = { ...mockDescentInput, parachuteArea: 0 };
      expect(() => calculateDescent(invalidInput)).toThrow('Parachute area must be positive');
    });

    test('should throw error for invalid drag coefficient', () => {
      const invalidInput = { ...mockDescentInput, dragCoefficient: 0 };
      expect(() => calculateDescent(invalidInput)).toThrow('Drag coefficient must be positive');
    });

    test('should throw error for negative landing altitude', () => {
      const invalidInput = { ...mockDescentInput, landingAltitude: -100 };
      expect(() => calculateDescent(invalidInput)).toThrow('Landing altitude cannot be negative');
    });

    test('should throw error for burst altitude lower than landing altitude', () => {
      const invalidInput = { ...mockDescentInput, burstAltitude: 1000, landingAltitude: 2000 };
      expect(() => calculateDescent(invalidInput)).toThrow('Burst altitude must be higher than landing altitude');
    });
  });

  describe('Landing Site Prediction', () => {
    test('should predict landing site correctly', () => {
      const result = predictLandingSite(
        40.7128,   // burstLatitude
        -74.0060,  // burstLongitude
        30000,     // burstAltitude
        1.0,       // payloadWeight
        2.0,       // parachuteArea
        1.2,       // dragCoefficient
        10,        // windSpeed
        90,        // windDirection
        0          // landingAltitude
      );
      
      expect(result).toHaveProperty('landingLatitude');
      expect(result).toHaveProperty('landingLongitude');
      expect(result).toHaveProperty('landingTime');
      expect(result).toHaveProperty('confidence');
      
      // Landing coordinates should be different from burst coordinates
      expect(result.landingLatitude).not.toBe(40.7128);
      expect(result.landingLongitude).not.toBe(-74.0060);
      
      // Landing time should be positive
      expect(result.landingTime).toBeGreaterThan(0);
      
      // Confidence should be between 0 and 1
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should handle different wind conditions', () => {
      const noWindResult = predictLandingSite(40.7128, -74.0060, 30000, 1.0, 2.0, 1.2, 0, 90, 0);
      const highWindResult = predictLandingSite(40.7128, -74.0060, 30000, 1.0, 2.0, 1.2, 20, 90, 0);
      
      // High wind should result in more drift
      expect(highWindResult.windDrift).toBeGreaterThan(noWindResult.windDrift);
    });
  });

  describe('Descent Time Estimation', () => {
    test('should estimate descent time correctly', () => {
      const burstAltitude = 30000; // m
      const terminalVelocity = 10; // m/s
      
      const estimatedTime = estimateDescentTime(burstAltitude, terminalVelocity);
      const expectedTime = burstAltitude / terminalVelocity;
      
      expect(estimatedTime).toBeCloseTo(expectedTime, 2);
    });

    test('should throw error for negative terminal velocity', () => {
      expect(() => estimateDescentTime(30000, -5)).toThrow('Terminal velocity must be positive');
    });

    test('should throw error for zero terminal velocity', () => {
      expect(() => estimateDescentTime(30000, 0)).toThrow('Terminal velocity must be positive');
    });
  });

  describe('Performance Tests', () => {
    test('should complete calculation within 100ms for typical flight', () => {
      const startTime = Date.now();
      calculateDescent(mockDescentInput);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100);
    });

    test('should handle high-altitude flights efficiently', () => {
      const highAltitudeInput = {
        ...mockDescentInput,
        burstAltitude: 50000,
        landingAltitude: 0
      };
      
      const startTime = Date.now();
      calculateDescent(highAltitudeInput);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });

    test('should handle different parachute configurations', () => {
      const smallParachuteInput = {
        ...mockDescentInput,
        parachuteArea: 0.5,
        dragCoefficient: 0.8
      };
      
      const largeParachuteInput = {
        ...mockDescentInput,
        parachuteArea: 5.0,
        dragCoefficient: 1.5
      };
      
      const smallParachuteResult = calculateDescent(smallParachuteInput);
      const largeParachuteResult = calculateDescent(largeParachuteInput);
      
      // Larger parachute should result in longer descent time
      expect(largeParachuteResult.descentDuration).toBeGreaterThan(smallParachuteResult.descentDuration);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very low burst altitude', () => {
      const lowAltitudeInput = {
        ...mockDescentInput,
        burstAltitude: 100,
        landingAltitude: 0
      };
      
      const result = calculateDescent(lowAltitudeInput);
      expect(result.descentDuration).toBeGreaterThan(0);
      expect(result.trajectory.length).toBeGreaterThan(0);
    });

    test('should handle high drag coefficient', () => {
      const highDragInput = {
        ...mockDescentInput,
        dragCoefficient: 2.5
      };
      
      const result = calculateDescent(highDragInput);
      // Higher drag coefficient should result in lower terminal velocity
      const lowDragResult = calculateDescent(mockDescentInput);
      expect(result.terminalVelocity).toBeLessThan(lowDragResult.terminalVelocity);
    });

    test('should handle zero wind conditions', () => {
      const noWindInput = {
        ...mockDescentInput,
        windSpeed: 0
      };
      
      const result = calculateDescent(noWindInput);
      expect(result.windDrift).toBe(0);
      // Landing coordinates should be very close to burst coordinates with no wind
      expect(result.landingLatitude).toBeCloseTo(mockDescentInput.burstLatitude, 6);
      expect(result.landingLongitude).toBeCloseTo(mockDescentInput.burstLongitude, 6);
    });

    test('should handle maximum flight time limit', () => {
      const longFlightInput = {
        ...mockDescentInput,
        maxFlightTime: 10 // Very short time limit
      };
      
      const result = calculateDescent(longFlightInput);
      expect(result.landingTime).toBeLessThanOrEqual(10);
    });
  });
}); 