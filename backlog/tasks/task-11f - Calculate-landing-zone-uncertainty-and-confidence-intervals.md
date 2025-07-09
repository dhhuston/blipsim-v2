---
id: task-11f
title: 'Calculate landing zone uncertainty and confidence intervals'
status: To Do
assignee: []
created_date: '2025-01-27'
updated_date: '2025-01-27'
labels: ['core-algorithm', 'uncertainty', 'monte-carlo', 'confidence']
dependencies: ['task-11c', 'task-11e']
priority: high
---

## Description

Implement Monte Carlo simulation to calculate landing zone uncertainty and provide confidence intervals for landing predictions. This gives users realistic expectations of where the balloon might actually land.

## Acceptance Criteria
- [ ] Implement Monte Carlo simulation for uncertainty modeling
- [ ] Calculate 95% confidence radius for landing zone
- [ ] Factor in wind error and measurement uncertainty
- [ ] Provide statistical confidence metrics
- [ ] Visualize uncertainty zone on map
- [ ] Handle varying wind conditions and errors

## Implementation Details

### Landing Zone Uncertainty Algorithm
**Location**: `app/src/algorithms/windDrift.ts` and `app/src/algorithms/predictionEngine.ts`

**Core Logic**:
1. **Monte Carlo Simulation**: Runs multiple trajectory samples with wind error
2. **Wind Error Modeling**: Applies RMS wind error to each trajectory point
3. **Statistical Analysis**: Calculates 95th percentile landing radius
4. **Confidence Intervals**: Provides uncertainty metrics for landing zone

### Key Features Implemented
- **Monte Carlo Approach**: 100 simulation samples for statistical confidence
- **Wind Error Integration**: RMS wind error applied to each trajectory point
- **95% Confidence Zone**: Statistical landing radius calculation
- **Real-time Uncertainty**: Updates with changing parameters and weather

### Code Structure
```typescript
export function performMonteCarloSimulation(params: MonteCarloParams): MonteCarloResult {
  const { trajectory, windErrorRMS, numSamples } = params;
  const landingPoints: Array<{ latitude: number; longitude: number }> = [];
  
  // Generate multiple trajectory samples with wind error
  for (let i = 0; i < numSamples; i++) {
    let currentLat = trajectory[0].latitude;
    let currentLng = trajectory[0].longitude;
    
    // Apply wind drift with error to each trajectory point
    for (const point of trajectory) {
      const windDrift = calculateWindDrift({
        windU: point.windU,
        windV: point.windV,
        windErrorRMS,
        timestep: 1,
        latitude: currentLat
      });
      
      currentLat += windDrift.dlat;
      currentLng += windDrift.dlng;
    }
    
    landingPoints.push({ latitude: currentLat, longitude: currentLng });
  }
  
  // Calculate landing radius (95% confidence)
  const distances = landingPoints.map(point => {
    const dx = (point.longitude - trajectory[0].longitude) * Math.cos(trajectory[0].latitude * Math.PI / 180);
    const dy = point.latitude - trajectory[0].latitude;
    return Math.sqrt(dx * dx + dy * dy) * 111000; // Convert to meters
  });
  
  // Sort distances and find 95th percentile
  distances.sort((a, b) => a - b);
  const landingRadius = distances[Math.floor(0.95 * distances.length)];
  
  return { landingPoints, landingRadius, windError: windErrorRMS };
}
```

### Uncertainty Modeling Features
- **Statistical Confidence**: 95% confidence radius for landing predictions
- **Wind Error Modeling**: RMS wind error (typically 2.0 m/s) affects uncertainty
- **Multiple Scenarios**: Monte Carlo generates 100 different landing outcomes
- **Dynamic Updates**: Uncertainty recalculates with parameter changes

### Map Visualization
- **Uncertainty Circle**: 95% confidence radius displayed on map
- **Landing Zone**: Visual representation of probable landing area
- **Confidence Info**: Popup showing radius size and wind error details

### Integration with Prediction Engine
```typescript
// In predictionEngine.ts
const monteCarloParams: MonteCarloParams = {
  trajectory: fullTrajectory,
  windErrorRMS,
  numSamples: 100 // Number of Monte Carlo samples
};

const monteCarloResult = performMonteCarloSimulation(monteCarloParams);

const result: PredictionResult = {
  trajectory: fullTrajectory,
  landingLocation: {
    latitude: descentResult.landingPoint.latitude,
    longitude: descentResult.landingPoint.longitude,
    timestamp: descentResult.landingPoint.timestamp
  },
  uncertainty: {
    landingRadius: monteCarloResult.landingRadius,
    windError: monteCarloResult.windError
  }
};
```

### Validation
- [ ] Tested with various wind error scenarios
- [ ] Validated against CUSF uncertainty model
- [ ] Integrated with map visualization
- [ ] Performance optimized for real-time updates

## Integration Points
- **Wind Drift**: Extends `task-11c` wind drift calculations
- **Landing Prediction**: Uses `task-11e` landing site as base prediction
- **Weather Data**: Incorporates wind error from weather uncertainty
- **Map Visualization**: Uncertainty zone displayed in `task-13a` map component
- **UI Integration**: Confidence metrics shown in prediction summary

## Uncertainty Visualization
- **Landing Circle**: Red circle showing 95% confidence radius
- **Radius Display**: Shows uncertainty radius in meters
- **Wind Error**: Displays RMS wind error contributing to uncertainty
- **Confidence Level**: Clear indication of 95% probability zone

## Statistical Accuracy
- **Monte Carlo Samples**: 100 samples provides statistical confidence
- **95% Confidence**: Standard meteorological confidence level
- **Wind Error**: Realistic 2.0 m/s RMS error based on weather forecast accuracy
- **Real-time Updates**: Uncertainty recalculates with parameter changes

## ## Technical Specifications

### Data Models
```typescript
interface ComponentProps {
  // Props interface
  requiredProp: string;
  optionalProp?: number;
  onEvent?: (data: any) => void;
}

interface ComponentState {
  // State interface
  isLoading: boolean;
  data: any[];
  error?: string;
}
```

### File Structure
```
components/
├── ComponentName.tsx
├── ComponentName.test.tsx
└── ComponentName.css
```

### Integration Points
- Connect to `{parent component}` for {data flow}
- Integrate with `{service}` for {functionality}
- Update `App.tsx` to include component
- Connect to `{state management}` for data

## ## ## Testing Requirements
- Unit tests for component rendering
- Integration tests with mock data
- Performance tests for user interactions
- Error handling tests for invalid props
- Edge case testing (empty data, loading states)
- End-to-end tests with real user interactions

## ## ## Performance Requirements
- Component rendering < {X}ms for typical props
- Memory usage < {X}MB for large datasets
- Smooth interactions ({X}fps)
- Bundle size increase < {X}KB ({dependencies})

## ## ## Error Handling
- Graceful degradation when props invalid
- Loading states for async operations
- Error boundaries for component failures
- Fallback UI for missing data

## ## ## Implementation Notes
- Implement in `app/src/components/{ComponentName}.tsx`
- Use Material-UI components for consistency
- Include responsive design for mobile/desktop
- Add accessibility features (ARIA labels, keyboard nav)
- Follow existing component patterns

## ## ## Files Created/Modified
- `app/src/components/{ComponentName}.tsx` - Main component implementation
- `app/src/components/{ComponentName}.test.tsx` - Comprehensive test suite
- `app/src/components/{ComponentName}.css` - Component-specific styling
- `app/src/App.tsx` - Integration with main application

## ## Testing Coverage
- Unit tests for Monte Carlo simulation
- Statistical validation of confidence intervals
- Performance testing with large sample sizes
- Integration testing with weather data uncertainty 