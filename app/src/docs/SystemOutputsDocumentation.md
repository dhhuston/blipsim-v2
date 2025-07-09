# System Outputs and Formats Documentation

## Overview

This document defines all system outputs and data formats for balloon trajectory predictions, including landing coordinates, flight path, telemetry data, and export formats. All formats are implemented as TypeScript interfaces in `app/src/types/SystemOutputs.ts`.

## 1. Landing Prediction Output Format

### Primary Landing Prediction

The primary landing prediction provides the most likely landing location with confidence intervals.

```typescript
interface LandingPrediction {
  coordinates: Coordinates;
  confidence_interval: ConfidenceInterval;
  estimated_landing_time: string;  // ISO 8601 format
  flight_duration_hours: number;
  total_distance_km: number;
}
```

**Example:**
```json
{
  "landing_prediction": {
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "altitude": 0
    },
    "confidence_interval": {
      "radius_km": 15.2,
      "probability": 0.95
    },
    "estimated_landing_time": "2024-01-15T18:30:00Z",
    "flight_duration_hours": 12.5,
    "total_distance_km": 245.3
  }
}
```

### Multiple Scenario Predictions

For uncertainty analysis, multiple scenarios can be generated with different probabilities.

```typescript
interface MultipleScenarioPredictions {
  scenarios: ScenarioPrediction[];
}
```

**Example:**
```json
{
  "scenarios": [
    {
      "scenario_id": "best_case",
      "landing_coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "probability": 0.25,
      "flight_duration_hours": 10.2
    },
    {
      "scenario_id": "worst_case",
      "landing_coordinates": {
        "latitude": 41.1234,
        "longitude": -73.9876
      },
      "probability": 0.25,
      "flight_duration_hours": 15.8
    }
  ]
}
```

## 2. Flight Path Coordinate Format

### Trajectory Points

Each point in the flight trajectory includes position, environmental data, and timestamp.

```typescript
interface TrajectoryPoint {
  timestamp: string;        // ISO 8601 format
  latitude: number;
  longitude: number;
  altitude: number;
  wind_speed?: number;      // Meters per second
  wind_direction?: number;  // Degrees (0-360)
  temperature?: number;     // Celsius
  pressure?: number;        // hPa
}
```

**Example:**
```json
{
  "trajectory": {
    "points": [
      {
        "timestamp": "2024-01-15T06:00:00Z",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "altitude": 0,
        "wind_speed": 5.2,
        "wind_direction": 270,
        "temperature": 15.5,
        "pressure": 1013.25
      },
      {
        "timestamp": "2024-01-15T06:00:10Z",
        "latitude": 40.7129,
        "longitude": -74.0061,
        "altitude": 50,
        "wind_speed": 6.1,
        "wind_direction": 275,
        "temperature": 14.8,
        "pressure": 1012.80
      }
    ],
    "metadata": {
      "total_points": 8640,
      "time_step_seconds": 10,
      "coordinate_system": "WGS84"
    }
  }
}
```

### Simplified Trajectory

For display purposes, trajectories can be simplified to reduce data size.

```typescript
interface SimplifiedTrajectory {
  points: TrajectoryPoint[];
  metadata: SimplifiedTrajectoryMetadata;
}
```

## 3. Telemetry Data Structure

### Real-time Telemetry

Current position and flight metrics for real-time tracking.

```typescript
interface Telemetry {
  current_position: CurrentPosition;
  flight_metrics: FlightMetrics;
  environmental_data: EnvironmentalData;
}
```

**Example:**
```json
{
  "telemetry": {
    "current_position": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "altitude": 5000,
      "timestamp": "2024-01-15T07:30:00Z"
    },
    "flight_metrics": {
      "current_speed": 5.2,
      "ascent_rate": 4.8,
      "distance_traveled": 12.5,
      "time_in_flight": 5400
    },
    "environmental_data": {
      "temperature": -15.2,
      "pressure": 540.25,
      "wind_speed": 8.5,
      "wind_direction": 280
    }
  }
}
```

### Flight Summary

Complete flight statistics after landing.

```typescript
interface FlightSummary {
  launch_time: string;     // ISO 8601 format
  burst_time: string;      // ISO 8601 format
  landing_time: string;    // ISO 8601 format
  max_altitude: number;    // Meters
  total_distance: number;  // Kilometers
  flight_duration: number; // Seconds
  average_speed: number;   // Meters per second
}
```

## 4. Output Coordinate Systems

### Primary Coordinate System: WGS84

All geographic coordinates use the World Geodetic System 1984 (WGS84) with decimal degrees.

```typescript
interface WGS84Coordinates {
  latitude: number;   // Decimal degrees (-90 to +90)
  longitude: number;  // Decimal degrees (-180 to +180)
}
```

### Alternative Coordinate Systems

The system supports conversion to other coordinate systems:

- **UTM**: Universal Transverse Mercator
- **MGRS**: Military Grid Reference System

```typescript
interface CoordinateConversion {
  wgs84: WGS84Coordinates;
  utm: UTMCoordinates;
  mgrs: MGRSCoordinates;
}
```

## 5. Error Margins and Confidence Intervals

### Uncertainty Analysis

Comprehensive uncertainty analysis for all prediction components.

```typescript
interface UncertaintyAnalysis {
  landing_zone: LandingZoneUncertainty;
  time_uncertainty: TimeUncertainty;
  altitude_uncertainty: AltitudeUncertainty;
}
```

**Example:**
```json
{
  "uncertainty_analysis": {
    "landing_zone": {
      "radius_km": 15.2,
      "confidence_level": 0.95,
      "factors": {
        "wind_uncertainty": 0.6,
        "model_uncertainty": 0.3,
        "data_quality": 0.1
      }
    },
    "time_uncertainty": {
      "hours": 2.5,
      "confidence_level": 0.95
    },
    "altitude_uncertainty": {
      "meters": 500,
      "confidence_level": 0.95
    }
  }
}
```

### Monte Carlo Results

Statistical analysis from Monte Carlo simulations.

```typescript
interface MonteCarloResults {
  simulations: number;
  landing_distribution: {
    mean_latitude: number;
    mean_longitude: number;
    std_deviation_km: number;
    percentiles: MonteCarloPercentiles;
  };
}
```

## 6. Export Formats

### KML Format (Google Earth)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Balloon Trajectory</name>
    <Placemark>
      <name>Launch Point</name>
      <Point>
        <coordinates>-74.0060,40.7128,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Trajectory</name>
      <LineString>
        <coordinates>
          -74.0060,40.7128,0
          -74.0061,40.7129,50
          ...
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
```

### GPX Format (GPS Exchange)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <trk>
    <name>Balloon Trajectory</name>
    <trkseg>
      <trkpt lat="40.7128" lon="-74.0060">
        <ele>0</ele>
        <time>2024-01-15T06:00:00Z</time>
      </trkpt>
      <trkpt lat="40.7129" lon="-74.0061">
        <ele>50</ele>
        <time>2024-01-15T06:00:10Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
```

### CSV Format (Spreadsheet)

```csv
timestamp,latitude,longitude,altitude,wind_speed,wind_direction,temperature,pressure
2024-01-15T06:00:00Z,40.7128,-74.0060,0,5.2,270,15.5,1013.25
2024-01-15T06:00:10Z,40.7129,-74.0061,50,6.1,275,14.8,1012.80
```

## 7. Real-time Output Formats

### WebSocket Updates

Real-time position updates via WebSocket.

```typescript
interface WebSocketUpdate {
  type: "position_update" | "telemetry_update" | "prediction_update";
  timestamp: string;  // ISO 8601 format
  data: {
    latitude: number;
    longitude: number;
    altitude: number;
    speed?: number;
    heading?: number;
  };
}
```

**Example:**
```json
{
  "type": "position_update",
  "timestamp": "2024-01-15T07:30:00Z",
  "data": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "altitude": 5000,
    "speed": 5.2,
    "heading": 280
  }
}
```

## 8. Complete Prediction Response

### REST API Response

Complete prediction response with all data and metadata.

```typescript
interface CompletePredictionResponse {
  status: "success" | "error";
  prediction_id: string;
  data: {
    landing_prediction: LandingPrediction;
    trajectory: Trajectory;
    uncertainty: UncertaintyAnalysis;
    telemetry?: Telemetry;
    flight_summary?: FlightSummary;
  };
  metadata: PredictionMetadata;
}
```

**Example:**
```json
{
  "status": "success",
  "prediction_id": "pred_12345",
  "data": {
    "landing_prediction": {...},
    "trajectory": {...},
    "uncertainty": {...}
  },
  "metadata": {
    "generated_at": "2024-01-15T06:00:00Z",
    "weather_source": "Open-Meteo",
    "model_version": "2.0.0"
  }
}
```

## 9. Validation and Constants

### Default Values

```typescript
const DEFAULT_COORDINATE_SYSTEM = "WGS84";
const DEFAULT_TIME_STEP_SECONDS = 10;
const DEFAULT_CONFIDENCE_LEVEL = 0.95;
const DEFAULT_SIMPLIFICATION_FACTOR = 10;
```

### Coordinate Systems

```typescript
const COORDINATE_SYSTEMS = {
  WGS84: "World Geodetic System 1984",
  UTM: "Universal Transverse Mercator",
  MGRS: "Military Grid Reference System"
} as const;
```

### Export Formats

```typescript
const EXPORT_FORMATS = {
  KML: "Google Earth",
  GPX: "GPS Exchange",
  CSV: "Comma Separated Values",
  JSON: "JavaScript Object Notation"
} as const;
```

### Validation Rules

```typescript
const OUTPUT_VALIDATION_RULES = {
  coordinates: {
    latitude: { min: -90, max: 90, precision: 6 },
    longitude: { min: -180, max: 180, precision: 6 },
    altitude: { min: -1000, max: 100000, precision: 0 }
  },
  confidence_interval: {
    radius_km: { min: 0, max: 1000, precision: 1 },
    probability: { min: 0, max: 1, precision: 3 }
  },
  trajectory_point: {
    timestamp: { format: 'ISO8601' },
    wind_speed: { min: 0, max: 200, precision: 1 },
    wind_direction: { min: 0, max: 360, precision: 0 },
    temperature: { min: -100, max: 100, precision: 1 },
    pressure: { min: 0, max: 2000, precision: 2 }
  }
};
```

## 10. Utility Functions

### Validation Functions

```typescript
function validateCoordinates(coords: Coordinates): boolean
function validateConfidenceInterval(ci: ConfidenceInterval): boolean
function validateTrajectoryPoint(point: TrajectoryPoint): boolean
```

### Formatting Functions

```typescript
function formatCoordinateSystem(system: string): string
function formatExportFormat(format: string): string
```

## 11. Usage Examples

### Creating a Landing Prediction

```typescript
import { LandingPrediction, Coordinates, ConfidenceInterval } from './SystemOutputs';

const landingPrediction: LandingPrediction = {
  coordinates: {
    latitude: 40.7128,
    longitude: -74.0060,
    altitude: 0
  },
  confidence_interval: {
    radius_km: 15.2,
    probability: 0.95
  },
  estimated_landing_time: '2024-01-15T18:30:00Z',
  flight_duration_hours: 12.5,
  total_distance_km: 245.3
};
```

### Creating a Trajectory

```typescript
import { Trajectory, TrajectoryPoint } from './SystemOutputs';

const trajectory: Trajectory = {
  points: [
    {
      timestamp: '2024-01-15T06:00:00Z',
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 0,
      wind_speed: 5.2,
      wind_direction: 270,
      temperature: 15.5,
      pressure: 1013.25
    }
  ],
  metadata: {
    total_points: 1,
    time_step_seconds: 10,
    coordinate_system: 'WGS84'
  }
};
```

### Validating Data

```typescript
import { validateCoordinates, validateConfidenceInterval } from './SystemOutputs';

const coords = { latitude: 40.7128, longitude: -74.0060 };
const isValid = validateCoordinates(coords); // true

const ci = { radius_km: 15.2, probability: 0.95 };
const isCIValid = validateConfidenceInterval(ci); // true
```

## 12. Implementation Notes

- All timestamps use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
- Coordinates use WGS84 decimal degrees with 6 decimal place precision
- Altitudes are in meters above sea level
- Distances are in kilometers
- Speeds are in meters per second
- Temperatures are in Celsius
- Pressures are in hPa (hectopascals)
- All validation functions return boolean values
- Optional fields are marked with `?` in TypeScript interfaces
- Constants are exported for use throughout the application

## 13. File Structure

```
app/src/types/
├── SystemOutputs.ts          # Main type definitions
├── SystemOutputs.test.ts     # Test suite (when Jest is configured)
└── UserInputs.ts            # Related user input types

app/src/docs/
└── SystemOutputsDocumentation.md  # This documentation
```

This implementation provides a complete, type-safe system for handling all balloon trajectory prediction outputs and formats as specified in task-2b. 