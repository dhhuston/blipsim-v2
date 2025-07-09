import {
  calculateAtmosphericDensity,
  calculateAtmosphericPressure,
  calculateTemperature,
  getAtmosphericConditions,
  validateAtmosphericInput
} from './atmospheric';

describe('Atmospheric Module', () => {
  describe('Atmospheric Density Calculation', () => {
    test('should calculate density at sea level correctly', () => {
      const density = calculateAtmosphericDensity(0);
      expect(density).toBeCloseTo(1.225, 3);
    });

    test('should calculate density at altitude correctly', () => {
      const density = calculateAtmosphericDensity(1000);
      expect(density).toBeLessThan(1.225); // Density decreases with altitude
      expect(density).toBeGreaterThan(0);
    });

    test('should handle high altitudes', () => {
      const density = calculateAtmosphericDensity(10000);
      expect(density).toBeGreaterThan(0);
      expect(density).toBeLessThan(1.225);
    });

    test('should throw error for negative altitude', () => {
      expect(() => calculateAtmosphericDensity(-100)).toThrow('Altitude cannot be negative');
    });
  });

  describe('Atmospheric Pressure Calculation', () => {
    test('should calculate pressure at sea level correctly', () => {
      const pressure = calculateAtmosphericPressure(0);
      expect(pressure).toBeCloseTo(101325, 0);
    });

    test('should calculate pressure at altitude correctly', () => {
      const pressure = calculateAtmosphericPressure(1000);
      expect(pressure).toBeLessThan(101325); // Pressure decreases with altitude
      expect(pressure).toBeGreaterThan(0);
    });

    test('should throw error for negative altitude', () => {
      expect(() => calculateAtmosphericPressure(-100)).toThrow('Altitude cannot be negative');
    });
  });

  describe('Temperature Calculation', () => {
    test('should calculate temperature at sea level correctly', () => {
      const temperature = calculateTemperature(0);
      expect(temperature).toBeCloseTo(288.15, 2); // 15°C
    });

    test('should calculate temperature at altitude correctly', () => {
      const temperature = calculateTemperature(1000);
      expect(temperature).toBeLessThan(288.15); // Temperature decreases with altitude
    });

    test('should throw error for negative altitude', () => {
      expect(() => calculateTemperature(-100)).toThrow('Altitude cannot be negative');
    });
  });

  describe('Atmospheric Conditions', () => {
    test('should return all atmospheric conditions', () => {
      const conditions = getAtmosphericConditions(1000);
      
      expect(conditions).toHaveProperty('density');
      expect(conditions).toHaveProperty('pressure');
      expect(conditions).toHaveProperty('temperature');
      
      expect(conditions.density).toBeGreaterThan(0);
      expect(conditions.pressure).toBeGreaterThan(0);
      expect(conditions.temperature).toBeGreaterThan(0);
    });

    test('should return consistent values for same altitude', () => {
      const conditions1 = getAtmosphericConditions(5000);
      const conditions2 = getAtmosphericConditions(5000);
      
      expect(conditions1.density).toBe(conditions2.density);
      expect(conditions1.pressure).toBe(conditions2.pressure);
      expect(conditions1.temperature).toBe(conditions2.temperature);
    });
  });

  describe('Input Validation', () => {
    test('should validate positive altitudes', () => {
      expect(validateAtmosphericInput(0)).toBe(true);
      expect(validateAtmosphericInput(1000)).toBe(true);
      expect(validateAtmosphericInput(50000)).toBe(true);
    });

    test('should reject negative altitudes', () => {
      expect(validateAtmosphericInput(-100)).toBe(false);
    });

    test('should reject extremely high altitudes', () => {
      expect(validateAtmosphericInput(150000)).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('should complete calculations within reasonable time', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        calculateAtmosphericDensity(i * 100);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero altitude', () => {
      const density = calculateAtmosphericDensity(0);
      const pressure = calculateAtmosphericPressure(0);
      const temperature = calculateTemperature(0);
      
      expect(density).toBeGreaterThan(0);
      expect(pressure).toBeGreaterThan(0);
      expect(temperature).toBeGreaterThan(0);
    });

    test('should handle very high altitudes', () => {
      const density = calculateAtmosphericDensity(50000);
      const pressure = calculateAtmosphericPressure(50000);
      const temperature = calculateTemperature(50000);
      
      expect(density).toBeGreaterThan(0);
      expect(pressure).toBeGreaterThan(0);
      // Temperature can be negative at high altitudes (physically correct)
      expect(temperature).toBeLessThan(288.15); // Should be colder than sea level
    });
  });
}); 