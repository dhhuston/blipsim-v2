---
id: task-2a
title: 'Define user inputs and parameters'
status: Completed
assignee: []
created_date: '2025-07-08'
updated_date: '2025-01-27'
completed_date: '2025-01-27'
labels: ['requirements', 'user-inputs']
dependencies: []
priority: high
---

## Description

Define all user inputs and parameters required for balloon trajectory prediction, including launch location, balloon specifications, and environmental conditions.

## Implementation Summary

✅ **COMPLETED** - All user input parameters defined and implemented with comprehensive validation system.

### Files Created:
- `app/src/types/UserInputs.ts` - TypeScript interfaces for all user inputs
- `app/src/utils/validation.ts` - Comprehensive validation functions
- `app/src/utils/validation.test.ts` - Unit tests for validation
- `app/src/docs/UserInputsImplementation.md` - Implementation documentation

### Key Features Implemented:
- **Launch Location**: Latitude/longitude (-90 to +90, -180 to +180), altitude (-500m to 6000m), launch time (ISO 8601)
- **Balloon Specifications**: Type selection, volume (0.1-1000m³), burst altitude (1000-60000m), ascent rate (1-10 m/s), payload weight (0.1-50kg), drag coefficient (0.1-2.0)
- **Environmental Parameters**: Weather source selection, wind model selection, temperature offset (-10 to +10°C), humidity factor (0-100%)
- **Prediction Parameters**: Max flight duration (1-168h), time step (1-60s), wind uncertainty (0-50%), Monte Carlo simulations (1-1000)

### Validation System:
- Geographic validation with precision requirements
- Balloon validation with safety limits
- Environmental validation with available options
- Cross-field validation for logical constraints
- Comprehensive error reporting and formatting

### Default Values and Presets:
- Standard Meteorological Balloon preset
- High-Altitude Research Balloon preset
- Educational Balloon preset
- Research-based altitude limits (-500m to 6000m launch, 1000m to 60000m burst)

## Acceptance Criteria
- [ ] Define launch location parameters (lat/lon, altitude)
- [ ] Define balloon specifications (volume, burst altitude, payload weight)
- [ ] Define environmental parameters (wind conditions, temperature)
- [ ] Document input validation rules
- [ ] Define default values and ranges

## User Inputs and Parameters

### 1. Launch Location Parameters

#### Geographic Coordinates
- **Latitude**: Decimal degrees (-90 to +90)
  - Default: 40.7128 (New York City)
  - Validation: Must be between -90 and +90
  - Precision: 6 decimal places (approximately 1 meter accuracy)

- **Longitude**: Decimal degrees (-180 to +180)
  - Default: -74.0060 (New York City)
  - Validation: Must be between -180 and +180
  - Precision: 6 decimal places (approximately 1 meter accuracy)

#### Launch Altitude
- **Altitude**: Meters above sea level (-500 to 6000)
  - Default: 0 (sea level)
  - Validation: Must be between -500 and 6000 (practical launch site limits)
  - Precision: Integer meters
  - Note: Covers below sea level to high-altitude research stations and airports

#### Launch Time
- **Date and Time**: ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
  - Default: Current UTC time
  - Validation: Must be valid date/time, not in the past
  - Timezone: UTC (converted from user's local time)

### 2. Balloon Specifications

#### Balloon Type
- **Balloon Type**: String selection
  - Options: "Latex Meteorological", "HDPE", "Custom"
  - Default: "Latex Meteorological"
  - Validation: Must be one of the predefined options

#### Balloon Volume
- **Initial Volume**: Cubic meters (0.1 to 1000)
  - Default: 1.0 m³
  - Validation: Must be positive, reasonable upper limit
  - Precision: 2 decimal places

#### Burst Altitude
- **Burst Altitude**: Meters above sea level (1000 to 60000)
  - Default: 30000 meters (typical for meteorological balloons)
  - Validation: Must be between 1000 and 60000
  - Precision: Integer meters
  - Note: Based on CUSF research and high-altitude balloon capabilities

#### Ascent Rate
- **Ascent Rate**: Meters per second (1 to 10)
  - Default: 5 m/s
  - Validation: Must be between 1 and 10 m/s
  - Precision: 1 decimal place

#### Payload Weight
- **Payload Weight**: Kilograms (0.1 to 50)
  - Default: 1.0 kg
  - Validation: Must be positive, reasonable upper limit
  - Precision: 2 decimal places

#### Drag Coefficient
- **Drag Coefficient**: Dimensionless (0.1 to 2.0)
  - Default: 0.5 (typical for latex balloons)
  - Validation: Must be between 0.1 and 2.0
  - Precision: 2 decimal places

### 3. Environmental Parameters

#### Weather Data Source
- **Weather Source**: String selection
  - Options: "Open-Meteo (Recommended)", "NOAA GFS", "Auto-select"
  - Default: "Auto-select"
  - Validation: Must be one of the predefined options

#### Wind Model Selection
- **Wind Model**: String selection
  - Options: "GFS (Global)", "HRRR (CONUS only)", "Auto"
  - Default: "Auto"
  - Validation: Must be one of the predefined options

#### Atmospheric Conditions
- **Temperature Offset**: Celsius degrees (-10 to +10)
  - Default: 0°C
  - Validation: Must be between -10 and +10
  - Precision: 1 decimal place

- **Humidity Factor**: Percentage (0 to 100)
  - Default: 50%
  - Validation: Must be between 0 and 100
  - Precision: Integer percentage

### 4. Prediction Parameters

#### Simulation Duration
- **Max Flight Duration**: Hours (1 to 168)
  - Default: 24 hours
  - Validation: Must be between 1 and 168 hours (1 week)
  - Precision: Integer hours

#### Time Step
- **Time Step**: Seconds (1 to 60)
  - Default: 10 seconds
  - Validation: Must be between 1 and 60 seconds
  - Precision: Integer seconds

#### Uncertainty Modeling
- **Wind Uncertainty**: Percentage (0 to 50)
  - Default: 10%
  - Validation: Must be between 0 and 50
  - Precision: Integer percentage

- **Monte Carlo Simulations**: Count (1 to 1000)
  - Default: 100
  - Validation: Must be between 1 and 1000
  - Precision: Integer

### 5. Input Validation Rules

#### Geographic Validation
- **Latitude**: Must be valid decimal degrees
- **Longitude**: Must be valid decimal degrees
- **Altitude**: Must be realistic for balloon launch (-500m to 6000m)
- **Launch Time**: Must be in the future

#### Balloon Validation
- **Volume**: Must be positive and reasonable
- **Burst Altitude**: Must be higher than launch altitude
- **Ascent Rate**: Must be positive and reasonable
- **Payload Weight**: Must be positive and reasonable

#### Environmental Validation
- **Weather Source**: Must be available for launch location
- **Wind Model**: Must be available for launch region
- **Simulation Duration**: Must be reasonable for balloon type

### 6. Default Values and Ranges

#### Recommended Defaults for Common Scenarios

**Standard Meteorological Balloon:**
- Volume: 1.0 m³
- Burst Altitude: 30000 m
- Ascent Rate: 5 m/s
- Payload Weight: 1.0 kg
- Drag Coefficient: 0.5

**High-Altitude Research Balloon:**
- Volume: 10.0 m³
- Burst Altitude: 45000 m
- Ascent Rate: 3 m/s
- Payload Weight: 5.0 kg
- Drag Coefficient: 0.6

**Educational Balloon:**
- Volume: 0.5 m³
- Burst Altitude: 20000 m
- Ascent Rate: 4 m/s
- Payload Weight: 0.5 kg
- Drag Coefficient: 0.4

#### Range Limits

**Safety Limits:**
- Maximum burst altitude: 60000 m (professional high-altitude balloons)
- Maximum payload weight: 50 kg
- Maximum flight duration: 168 hours (1 week)
- Maximum ascent rate: 10 m/s
- Maximum launch altitude: 6000 m (high-altitude research stations)

**Practical Limits:**
- Minimum burst altitude: 1000 m
- Minimum payload weight: 0.1 kg
- Minimum flight duration: 1 hour
- Minimum ascent rate: 1 m/s
- Minimum launch altitude: -500 m (below sea level locations)

## Altitude Limits Update - Research-Based Changes

### Updated Launch Altitude Limits: -500m to 6000m

**Previous Limits**: 0 to 8,848m (Mount Everest height)  
**New Limits**: -500m to 6,000m (practical launch site limits)

### Research Justification

Based on balloon height research from CUSF, NOAA, and Open-Meteo studies, the altitude limits have been updated to reflect realistic balloon launch scenarios:

#### **Lower Limit: -500m**
- **Dead Sea**: -413m (lowest accessible launch location)
- **Salton Sea**: -226m (below sea level in California)
- **Death Valley**: -86m (below sea level launch sites)
- **Buffer**: -500m provides margin for extreme below-sea-level locations

#### **Upper Limit: 6,000m** 
- **High-altitude airports**: La Rinconada (Peru) ~4,300m, Shigatse (Tibet) ~4,000m
- **Research stations**: Atacama Desert observatories ~5,000m
- **Mountain launch sites**: Base camps and accessible high-altitude locations ~5,500m
- **Practical maximum**: 6,000m covers extreme but accessible launch sites

#### **Burst Altitude Updates: 1000m to 60,000m**
- **Research balloons**: Can reach 45,000-60,000m altitude
- **CUSF data**: Shows burst altitudes up to 50,000m+ for specialized balloons
- **Professional balloons**: Scientific missions reaching 60,000m+
- **Safety margin**: Increased from 50,000m to 60,000m based on research

### Implementation Impact

The updated limits ensure:
1. **Realistic constraints**: Based on actual balloon launch capabilities
2. **Global coverage**: Supports launches from extreme geographic locations  
3. **Research accuracy**: Limits aligned with actual balloon performance data
4. **Safety margins**: Conservative limits for professional and research applications

### ## Technical Specifications

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

## ## Files Updated
- `backlog/tasks/task-2a - Define-user-inputs-and-parameters.md` - Parameter specifications
- `app/src/components/LaunchLocationInput.tsx` - Validation logic
- `app/src/components/LaunchLocationInput.test.tsx` - Test cases 