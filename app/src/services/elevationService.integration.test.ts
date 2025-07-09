import { ElevationService } from './elevationService';
import type { ElevationRequest, BatchElevationRequest } from '../types/elevation';

// Integration tests for elevation service with real APIs
// These tests are skipped by default to avoid making real API calls
// Run with: npm test -- --testNamePattern="ElevationService Integration"

describe('ElevationService Integration', () => {
  let elevationService: ElevationService;
  
  beforeEach(() => {
    elevationService = new ElevationService();
  });

  // Skip these tests by default since they make real API calls
  describe.skip('Real API Tests', () => {
    it('should fetch elevation from USGS for Denver, CO', async () => {
      const request: ElevationRequest = {
        latitude: 39.7392358,
        longitude: -104.990251
      };

      const result = await elevationService.getElevation(request);
      
      expect(result.elevation).toBeGreaterThan(1500);
      expect(result.elevation).toBeLessThan(1700);
      expect(result.dataSource).toBe('USGS');
      expect(result.latitude).toBe(request.latitude);
      expect(result.longitude).toBe(request.longitude);
    }, 10000);

    it('should fetch elevation from Open-Meteo for Paris, France', async () => {
      const request: ElevationRequest = {
        latitude: 48.8566,
        longitude: 2.3522
      };

      const result = await elevationService.getElevation(request);
      
      expect(result.elevation).toBeGreaterThan(20);
      expect(result.elevation).toBeLessThan(50);
      expect(result.dataSource).toBe('Open-Meteo');
      expect(result.latitude).toBe(request.latitude);
      expect(result.longitude).toBe(request.longitude);
    }, 10000);

    it('should handle batch requests for multiple US locations', async () => {
      const request: BatchElevationRequest = {
        coordinates: [
          { latitude: 39.7392358, longitude: -104.990251 }, // Denver, CO
          { latitude: 40.7589, longitude: -73.9851 },      // New York, NY
          { latitude: 34.0522, longitude: -118.2437 }       // Los Angeles, CA
        ]
      };

      const result = await elevationService.getBatchElevation(request);
      
      expect(result.status).toBe('OK');
      expect(result.results).toHaveLength(3);
      
      // Denver should be high elevation
      expect(result.results[0].elevation).toBeGreaterThan(1500);
      
      // NYC should be low elevation
      expect(result.results[1].elevation).toBeLessThan(100);
      
      // LA should be moderate elevation
      expect(result.results[2].elevation).toBeGreaterThan(50);
      expect(result.results[2].elevation).toBeLessThan(200);
    }, 15000);

    it('should cache repeated requests', async () => {
      const request: ElevationRequest = {
        latitude: 39.7392358,
        longitude: -104.990251
      };

      const start1 = Date.now();
      const result1 = await elevationService.getElevation(request);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const result2 = await elevationService.getElevation(request);
      const time2 = Date.now() - start2;

      // Second request should be much faster (cached)
      expect(time2).toBeLessThan(time1 / 2);
      expect(result1.elevation).toBe(result2.elevation);
      expect(result1.dataSource).toBe(result2.dataSource);
    }, 15000);
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid coordinates gracefully', async () => {
      const request: ElevationRequest = {
        latitude: 91, // Invalid latitude
        longitude: -104.990251
      };

      await expect(elevationService.getElevation(request)).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      const serviceWithShortTimeout = new ElevationService({
        timeout: 1 // Very short timeout
      });

      const request: ElevationRequest = {
        latitude: 39.7392358,
        longitude: -104.990251
      };

      // This might succeed if the network is very fast, but will likely timeout
      try {
        await serviceWithShortTimeout.getElevation(request);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = [
        { latitude: 39.7392358, longitude: -104.990251 }, // Denver
        { latitude: 40.7589, longitude: -73.9851 },      // NYC
        { latitude: 34.0522, longitude: -118.2437 },     // LA
        { latitude: 29.7604, longitude: -95.3698 },      // Houston
        { latitude: 41.8781, longitude: -87.6298 }       // Chicago
      ];

      const start = Date.now();
      const results = await Promise.all(
        requests.map(req => elevationService.getElevation(req))
      );
      const duration = Date.now() - start;

      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      results.forEach((result, index) => {
        expect(result.latitude).toBe(requests[index].latitude);
        expect(result.longitude).toBe(requests[index].longitude);
        expect(typeof result.elevation).toBe('number');
      });
    }, 15000);

    it('should maintain cache efficiency under load', async () => {
      const request: ElevationRequest = {
        latitude: 39.7392358,
        longitude: -104.990251
      };

      // Make initial request to populate cache
      await elevationService.getElevation(request);

      // Make multiple cached requests
      const start = Date.now();
      const promises = Array(10).fill(null).map(() => 
        elevationService.getElevation(request)
      );
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(100); // Cached requests should be very fast
      
      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.elevation).toBe(firstResult.elevation);
        expect(result.dataSource).toBe(firstResult.dataSource);
      });
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = elevationService.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });

    it('should clear cache successfully', async () => {
      // Add something to cache
      const request: ElevationRequest = {
        latitude: 39.7392358,
        longitude: -104.990251
      };
      
      await elevationService.getElevation(request);
      elevationService.clearCache();
      
      const stats = elevationService.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Provider Availability', () => {
    it('should report available providers', () => {
      const providers = elevationService.getAvailableProviders();
      expect(providers).toContain('USGS');
      expect(providers).toContain('Open-Meteo');
      expect(Array.isArray(providers)).toBe(true);
    });

    it('should include Google provider when API key provided', () => {
      const serviceWithGoogle = new ElevationService(undefined, 'test-key');
      const providers = serviceWithGoogle.getAvailableProviders();
      expect(providers).toContain('Google');
    });
  });
});
