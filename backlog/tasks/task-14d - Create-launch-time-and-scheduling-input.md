# Task 14d: Create Launch Time and Scheduling Input

## Description

Clear, focused description of what this task accomplishes in 1-2 sentences.

## Overview
Create a comprehensive launch time and scheduling input component that allows users to specify when the balloon launch will occur, affecting weather data selection and trajectory predictions.

## Requirements

### Core Features
- **Launch Time Selection**
  - Date picker for launch date
  - Time picker for launch time (with timezone support)
  - Future launch scheduling (up to 7 days ahead)

### Advanced Features
- **Timezone Handling**
  - Auto-detect timezone from launch location
  - Manual timezone selection override
  - Display both local and UTC times
  - Handle daylight saving time transitions

### Weather Integration
- **Forecast Window**
  - Show available weather forecast range
  - Indicate data quality/resolution for selected time
  - Warning for predictions beyond reliable forecast window
  - Weather data staleness indicators

### Validation & UX
- **Input Validation**
  - Prevent past launch times (unless historical analysis)
  - Validate against weather data availability
  - Check for reasonable time ranges (not too far in future)
  - Handle edge cases (midnight, timezone boundaries)

## Technical Specifications

### Component Structure
```
LaunchTimeInput/
├── LaunchTimeInput.tsx          # Main component
├── LaunchTimeInput.test.tsx     # Unit tests
├── components/
│   ├── DateTimePicker.tsx       # Custom date/time picker
│   ├── TimezoneSelector.tsx     # Timezone selection
│   └── WeatherAvailability.tsx  # Weather data status
└── utils/
    ├── timezoneUtils.ts         # Timezone calculations
    └── weatherWindow.ts         # Weather forecast validation
```

### Data Model
```typescript
interface LaunchSchedule {
  date: string;           // ISO date string
  time: string;           // HH:MM format
  timezone: string;       // IANA timezone identifier
  utcDateTime: string;    // Calculated UTC timestamp
  weatherQuality: 'high' | 'medium' | 'low' | 'unavailable';
}
```

### Integration Points
- Connect to `weatherService.ts` for forecast availability
- Pass launch time to prediction algorithms
- Update map display with time-dependent weather visualization
- Integrate with `predictionEngine.ts` for timing-based calculations

## Dependencies
- `task-12a` - Weather API client (for forecast availability)
- `task-14a` - Launch location input (for timezone detection)

## Acceptance Criteria
- [ ] User can select launch date and time 
- [ ] Timezone automatically detected from launch location 
- [ ] Manual timezone override available 
- [ ] Weather forecast availability clearly indicated 
- [ ] Validation prevents invalid launch times 
- [ ] Integration with weather service for time-based data 
- [ ] Responsive design for mobile/desktop 
- [ ] Comprehensive test coverage (>90%)  - 34 tests implemented
- [ ] Error handling for invalid inputs 
- [ ] Accessibility compliance (WCAG 2.1) 

## Testing Requirements
- Unit tests for timezone calculations
- Integration tests with weather service
- Edge case testing (DST transitions, midnight, etc.)
- User interaction testing
- Mobile responsiveness testing

## Priority: **HIGH CRITICAL** ❌ **INCOMPLETE - TESTS FAILING**
This task is essential for proper weather-prediction integration and must be completed before the unified prediction engine can work correctly.

## ## Performance Requirements
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

## ## Implementation Summary
- **Component**: `LaunchTimeInput.tsx` with comprehensive launch time and scheduling functionality
- **Tests**: `LaunchTimeInput.test.tsx` with 34 tests - **12 tests failing due to outdated expectations**
- **Features**: Date/time picker, timezone handling, weather availability assessment, validation
- **Integration**: Ready for weather-prediction integration with `task-12c` and `task-12d`
- **Status**: Component implemented but tests need updating to match actual implementation
- **Issue**: Tests expect "Weather data unavailable for selected time" but component shows different messages based on weather quality 