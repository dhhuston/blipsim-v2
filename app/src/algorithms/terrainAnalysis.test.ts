import { analyzeTerrain, calculateSlope, detectFeatures } from './terrainAnalysis';

describe('Terrain Analysis Algorithms', () => {
  test('analyzeTerrain returns expected results', () => {
    const mockData = [
      { elevation: 100 },
      { elevation: 200 },
      { elevation: 300 },
    ];
    const result = analyzeTerrain(mockData);
    expect(result).toEqual(expect.any(Object));
  });

  test('calculateSlope calculates slope correctly', () => {
    const elevationData = [100, 200, 300];
    const slope = calculateSlope(elevationData);
    expect(slope).toBeGreaterThan(0);
  });

  test('detectFeatures identifies terrain features', () => {
    const mockData = [
      { elevation: 100, feature: 'hill' },
      { elevation: 300, feature: 'mountain' },
    ];
    const features = detectFeatures(mockData);
    expect(features).toContain('hill');
    expect(features).toContain('mountain');
  });
});
