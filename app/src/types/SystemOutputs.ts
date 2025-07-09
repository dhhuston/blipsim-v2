// System Output Types and Formats for Balloon Trajectory Prediction
// Based on task-2b specifications

// ============================================================================
// 1. LANDING PREDICTION OUTPUT FORMAT
// ============================================================================

export interface Coordinates {
  latitude: number;   // Decimal degrees (-90 to +90)
  longitude: number;  // Decimal degrees (-180 to +180)
  altitude?: number;  // Meters above sea level (optional)
}

export interface ConfidenceInterval {
  radius_km: number;      // Landing zone radius in kilometers
  probability: number;     // Confidence level (0.0 to 1.0)
}

export interface LandingPrediction {
  coordinates: Coordinates;
  confidence_interval: ConfidenceInterval;
  estimated_landing_time: string;  // ISO 8601 format
  flight_duration_hours: number;
  total_distance_km: number;
}

export interface ScenarioPrediction {
  scenario_id: string;     // "best_case", "worst_case", "most_likely"
  landing_coordinates: Coordinates;
  probability: number;      // Probability of this scenario (0.0 to 1.0)
  flight_duration_hours: number;
}

export interface MultipleScenarioPredictions {
  scenarios: ScenarioPrediction[];
}

// ============================================================================
// 2. FLIGHT PATH COORDINATE FORMAT
// ============================================================================

export interface TrajectoryPoint {
  timestamp: string;        // ISO 8601 format
  latitude: number;
  longitude: number;
  altitude: number;
  wind_speed?: number;      // Meters per second
  wind_direction?: number;  // Degrees (0-360)
  temperature?: number;     // Celsius
  pressure?: number;        // hPa
}

export interface TrajectoryMetadata {
  total_points: number;
  time_step_seconds: number;
  coordinate_system: string;  // "WGS84"
}

export interface Trajectory {
  points: TrajectoryPoint[];
  metadata: TrajectoryMetadata;
}

export interface SimplifiedTrajectoryMetadata {
  simplification_factor: number;
  total_points: number;
}

export interface SimplifiedTrajectory {
  points: TrajectoryPoint[];
  metadata: SimplifiedTrajectoryMetadata;
}

// ============================================================================
// 3. TELEMETRY DATA STRUCTURE
// ============================================================================

export interface CurrentPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;  // ISO 8601 format
}

export interface FlightMetrics {
  current_speed: number;      // Meters per second
  ascent_rate: number;        // Meters per second
  distance_traveled: number;  // Kilometers
  time_in_flight: number;     // Seconds
}

export interface EnvironmentalData {
  temperature: number;     // Celsius
  pressure: number;        // hPa
  wind_speed: number;      // Meters per second
  wind_direction: number;  // Degrees (0-360)
}

export interface Telemetry {
  current_position: CurrentPosition;
  flight_metrics: FlightMetrics;
  environmental_data: EnvironmentalData;
}

export interface FlightSummary {
  launch_time: string;     // ISO 8601 format
  burst_time: string;      // ISO 8601 format
  landing_time: string;    // ISO 8601 format
  max_altitude: number;    // Meters
  total_distance: number;  // Kilometers
  flight_duration: number; // Seconds
  average_speed: number;   // Meters per second
}

// ============================================================================
// 4. OUTPUT COORDINATE SYSTEMS
// ============================================================================

export interface WGS84Coordinates {
  latitude: number;
  longitude: number;
}

export interface UTMCoordinates {
  zone: string;      // e.g., "18N"
  easting: number;   // Meters
  northing: number;  // Meters
}

export interface MGRSCoordinates {
  grid: string;      // e.g., "18TWL834564506789"
}

export interface CoordinateConversion {
  wgs84: WGS84Coordinates;
  utm: UTMCoordinates;
  mgrs: MGRSCoordinates;
}

// ============================================================================
// 5. ERROR MARGINS AND CONFIDENCE INTERVALS
// ============================================================================

export interface UncertaintyFactors {
  wind_uncertainty: number;   // Factor (0.0 to 1.0)
  model_uncertainty: number;  // Factor (0.0 to 1.0)
  data_quality: number;       // Factor (0.0 to 1.0)
}

export interface LandingZoneUncertainty {
  radius_km: number;
  confidence_level: number;   // 0.0 to 1.0
  factors: UncertaintyFactors;
}

export interface TimeUncertainty {
  hours: number;
  confidence_level: number;   // 0.0 to 1.0
}

export interface AltitudeUncertainty {
  meters: number;
  confidence_level: number;   // 0.0 to 1.0
}

export interface UncertaintyAnalysis {
  landing_zone: LandingZoneUncertainty;
  time_uncertainty: TimeUncertainty;
  altitude_uncertainty: AltitudeUncertainty;
}

export interface MonteCarloPercentiles {
  "10": Coordinates;
  "50": Coordinates;
  "90": Coordinates;
}

export interface MonteCarloResults {
  simulations: number;
  landing_distribution: {
    mean_latitude: number;
    mean_longitude: number;
    std_deviation_km: number;
    percentiles: MonteCarloPercentiles;
  };
}

// ============================================================================
// 6. EXPORT FORMATS
// ============================================================================

export interface KMLExport {
  document_name: string;
  placemarks: {
    launch_point: Coordinates;
    trajectory_points: TrajectoryPoint[];
  };
}

export interface GPXExport {
  track_name: string;
  track_points: TrajectoryPoint[];
}

export interface CSVExport {
  headers: string[];
  data: TrajectoryPoint[];
}

// ============================================================================
// 7. REAL-TIME OUTPUT FORMATS
// ============================================================================

export interface WebSocketUpdate {
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

// ============================================================================
// 8. COMPLETE PREDICTION RESPONSE
// ============================================================================

export interface PredictionMetadata {
  generated_at: string;      // ISO 8601 format
  weather_source: string;    // "Open-Meteo", "NOAA GFS", etc.
  model_version: string;     // "2.0.0"
}

export interface CompletePredictionResponse {
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

// ============================================================================
// 9. DEFAULT VALUES AND CONSTANTS
// ============================================================================

export const DEFAULT_COORDINATE_SYSTEM = "WGS84";
export const DEFAULT_TIME_STEP_SECONDS = 10;
export const DEFAULT_CONFIDENCE_LEVEL = 0.95;
export const DEFAULT_SIMPLIFICATION_FACTOR = 10;

export const COORDINATE_SYSTEMS = {
  WGS84: "World Geodetic System 1984",
  UTM: "Universal Transverse Mercator",
  MGRS: "Military Grid Reference System"
} as const;

export const EXPORT_FORMATS = {
  KML: "Google Earth",
  GPX: "GPS Exchange",
  CSV: "Comma Separated Values",
  JSON: "JavaScript Object Notation"
} as const;

// ============================================================================
// 10. VALIDATION RULES
// ============================================================================

export const OUTPUT_VALIDATION_RULES = {
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

// ============================================================================
// 11. UTILITY FUNCTIONS
// ============================================================================

export function validateCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= -90 && coords.latitude <= 90 &&
    coords.longitude >= -180 && coords.longitude <= 180
  );
}

export function validateConfidenceInterval(ci: ConfidenceInterval): boolean {
  return (
    ci.radius_km >= 0 && ci.radius_km <= 1000 &&
    ci.probability >= 0 && ci.probability <= 1
  );
}

export function validateTrajectoryPoint(point: TrajectoryPoint): boolean {
  return (
    validateCoordinates(point) &&
    point.altitude >= -1000 && point.altitude <= 100000
  );
}

export function formatCoordinateSystem(system: string): string {
  return COORDINATE_SYSTEMS[system as keyof typeof COORDINATE_SYSTEMS] || system;
}

export function formatExportFormat(format: string): string {
  return EXPORT_FORMATS[format as keyof typeof EXPORT_FORMATS] || format;
} 