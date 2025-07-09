---
id: task-14a
title: 'Create launch location input'
status: To Do
assignee: []
created_date: '2025-07-08'
updated_date: '2025-01-27'
labels: ['ui', 'input', 'location']
dependencies:
  - task-2a
  - task-10d
priority: high
---

## Description

Create input form for launch location including latitude, longitude, and altitude.

## Acceptance Criteria
- [ ] Create latitude/longitude input fields
- [ ] Add altitude input field
- [ ] Implement coordinate validation
- [ ] Add map-based location picker (click-to-select on interactive map)
- [ ] Test input validation and formatting
- [ ] Add address search functionality (geocoding)
- [ ] Implement address autocomplete/suggestions
- [ ] Test address search integration

## Implementation Summary

Successfully created `LaunchLocationInput` component with the following features:

### Core Features
- **Coordinate Input Fields**: Latitude, longitude, and altitude inputs with proper number validation
- **Real-time Validation**: Based on task-2a specifications (lat: -90 to +90, lng: -180 to +180, alt: 0 to 8848m)
- **Map-based Location Picker**: Interactive map using react-leaflet with click-to-select functionality
- **Current Location**: Geolocation API integration with "Use Current Location" button
- **Responsive Design**: Material-UI components with flexible layout that works on mobile and desktop

### Technical Details
- **Input Validation**: Real-time validation with error messages for out-of-range values
- **Precision**: 6 decimal places for coordinates (~1 meter accuracy) as specified in task-2a
- **State Management**: Proper state synchronization between inputs and parent component
- **Map Integration**: Collapsible map interface with OpenStreetMap tiles
- **Accessibility**: Proper ARIA labels, form controls, and keyboard navigation

### Integration
- **App.tsx Integration**: Replaced hardcoded launch coordinates with dynamic user input
- **Type Safety**: Full TypeScript integration with existing `LaunchParameters` interface
- **Testing**: Comprehensive test suite (12 tests) covering validation, user interaction, and edge cases

### Files Created/Modified
- `app/src/components/LaunchLocationInput.tsx` - Main component implementation
- `app/src/components/LaunchLocationInput.test.tsx` - Comprehensive test suite
- `app/src/App.tsx` - Integration with main application

The component follows all Material-UI design patterns and integrates seamlessly with the existing balloon trajectory prediction system.

## Updated Requirements (2025-01-27)

### Additional Features Requested
- **Address Search**: Add geocoding functionality to allow users to search for locations by address/place name
- **Map Selection**: Enhance existing map-based location picker (already implemented)

### Implementation Plan for Address Search
- **Geocoding API**: Use Open-Meteo Geocoding API (free, no authentication required)
- **UI Components**: Add search field with autocomplete suggestions
- **Integration**: Coordinate with existing map and coordinate inputs
- **Testing**: Add comprehensive tests for address search functionality

### Technical Approach
- **API**: https://geocoding-api.open-meteo.com/v1/ (from Open-Meteo research)
- **Features**: Comprehensive location search (cities, landmarks, addresses, airports, universities)
- **UX**: Seamless integration with existing coordinate and map inputs

## Enhanced Location Search Implementation (Completed 2025-01-27)

### New Features Added
- **GeocodingService**: Complete service using Open-Meteo Geocoding API
  - Free, no authentication required
  - Debounced search with 300ms delay
  - Error handling and timeout protection
  - Coordinate validation and elevation extraction
- **Address Search UI**: Material-UI Autocomplete component
  - Real-time search suggestions
  - Location details display
  - Clear button functionality
  - Loading indicators
- **Integration**: Seamless coordinate and map synchronization
  - Updates coordinate inputs when location selected
  - Updates map position automatically
  - Validates coordinates from geocoding results
  - Extracts elevation when available

### Files Created/Modified
- `app/src/services/geocodingService.ts` - Complete geocoding service
- `app/src/services/geocodingService.test.ts` - Comprehensive test suite (31 tests)
- `app/src/components/LaunchLocationInput.tsx` - Enhanced with address search
- `app/src/components/LaunchLocationInput.test.tsx` - Updated tests (23 tests)

### Test Coverage
- **GeocodingService**: 31 tests covering API calls, error handling, formatting
- **LaunchLocationInput**: 23 tests including 8 address search specific tests
- **Total**: 54 tests all passing

### Enhanced Search Capabilities (Final Update)
- **Comprehensive Location Types**: Cities, landmarks, addresses, airports, universities, parks, monuments
- **Smart Location Categorization**: 50+ location types with human-readable descriptions
- **Enhanced UX**: Improved placeholder text and search guidance
- **Better Results Display**: Location type tags (Airport, University, Monument, etc.)

### Supported Location Types
- **Cities & Towns**: Major cities, small towns, international locations
- **Landmarks**: Monuments, bridges, historic sites, natural wonders  
- **Transportation**: Airports, train stations, ports
- **Institutions**: Universities, hospitals, museums, government buildings
- **Natural Features**: Mountains, lakes, parks, beaches
- **Points of Interest**: Hotels, shopping centers, tourist attractions

The enhanced component now provides three ways to set launch location:
1. **Direct coordinate input** with validation
2. **Interactive map** with click-to-select  
3. **Comprehensive location search** with intelligent categorization and suggestions

**Search Examples**: 
- **Street Addresses**: "123 Main Street, San Francisco", "1 Apple Park Way, Cupertino"
- **Places**: "JFK Airport", "Harvard University", "Golden Gate Bridge", "Yellowstone", "Central Park"

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

## ## Hybrid Search System (Final Implementation)
- **Address Detection**: Automatically detects street addresses vs place names
- **Nominatim API**: Used for detailed street address search with house numbers, postal codes
- **Open-Meteo API**: Used for landmarks, cities, airports, universities  
- **Smart Fallback**: If no results in primary API, searches secondary API
- **Global Coverage**: Works worldwide for both addresses and places 