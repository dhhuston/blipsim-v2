import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container, Box, Alert, CircularProgress } from '@mui/material';
import { format, addDays } from 'date-fns';
import './App.css';
import theme from './theme';
import MapComponent from './components/MapComponent';
import LaunchLocationInput from './components/LaunchLocationInput';
import LaunchTimeInput from './components/LaunchTimeInput';
import BalloonSpecificationsInput from './components/BalloonSpecificationsInput';
import EnvironmentalParametersInput from './components/EnvironmentalParametersInput';
import { BalloonSpecifications, DEFAULT_BALLOON_SPECIFICATIONS } from './types/UserInputs';
import { EnvironmentalParameters } from './components/EnvironmentalParametersInput';
import { LaunchSchedule } from './components/LaunchTimeInput';
import { calculatePrediction, PredictionResult } from './algorithms/predictionEngine';
import { WeatherIntegrationService } from './services/weatherIntegration';
import TerrainVisualization from './components/TerrainVisualization';
import TerrainWarnings from './components/TerrainWarnings';
import DesktopDashboard from './components/DesktopDashboard';

interface LaunchLocation {
  lat: number;
  lng: number;
  alt?: number;
}

interface TrajectoryPoint {
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;
}

const defaultTrajectory: TrajectoryPoint[] = [
  { latitude: 40.7128, longitude: -74.0060, altitude: 10, timestamp: '2023-01-01T00:00:00Z' },
  { latitude: 40.7138, longitude: -74.0050, altitude: 5000, timestamp: '2023-01-01T00:10:00Z' },
  { latitude: 40.7148, longitude: -74.0040, altitude: 30000, timestamp: '2023-01-01T00:20:00Z' },
  { latitude: 40.7158, longitude: -74.0030, altitude: 5000, timestamp: '2023-01-01T00:30:00Z' },
  { latitude: 40.7168, longitude: -74.0020, altitude: 100, timestamp: '2023-01-01T00:40:00Z' }
];

function App() {
  const [launchLocation, setLaunchLocation] = useState<LaunchLocation>({ 
    lat: 40.7128, 
    lng: -74.0060, 
    alt: 10 
  });

  const [launchSchedule, setLaunchSchedule] = useState<LaunchSchedule>({
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '12:00',
    timezone: 'UTC',
    utcDateTime: addDays(new Date(), 1).toISOString(),
    weatherQuality: 'high'
  });

  const [balloonSpecifications, setBalloonSpecifications] = useState<BalloonSpecifications>(
    DEFAULT_BALLOON_SPECIFICATIONS
  );

  const [environmentalParameters, setEnvironmentalParameters] = useState<EnvironmentalParameters>({
    windSpeed: 5.0,
    windDirection: 0,
    temperature: 20,
    atmosphericPressure: 1013,
    relativeHumidity: 60,
    useLiveWeather: false
  });

  // Weather integration state
  const [weatherIntegration] = useState(() => new WeatherIntegrationService({
    weatherService: new (require('./services/weatherService')).WeatherService(),
    targetAltitudes: [1000, 5000, 10000, 15000, 20000, 25000, 30000],
    interpolationEnabled: true,
    cacheEnabled: true
  }));

  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>(defaultTrajectory);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Calculate prediction when inputs change
  useEffect(() => {
    const calculateWeatherIntegratedPrediction = async () => {
      if (!launchLocation || !launchSchedule.utcDateTime) {
        return;
      }

      setIsCalculating(true);
      setPredictionError(null);

      try {
        // Convert balloon specifications to ascent input
        const ascentInput = {
          balloonVolume: balloonSpecifications.initialVolume,
          payloadWeight: balloonSpecifications.payloadWeight,
          launchAltitude: launchLocation.alt || 0,
          burstAltitude: balloonSpecifications.burstAltitude,
          ascentRate: balloonSpecifications.ascentRate,
          atmosphericDensity: 1.225, // Will be calculated by the engine
          windSpeed: environmentalParameters.windSpeed,
          windDirection: environmentalParameters.windDirection
        };

        const predictionInput = {
          ascent: ascentInput,
          launchLocation,
          launchTime: launchSchedule.utcDateTime,
          weatherIntegration
        };

        const result = await calculatePrediction(predictionInput);
        setPredictionResult(result);

        // Convert trajectory points to map format
        const mapTrajectory: TrajectoryPoint[] = result.ascent.trajectory.map(point => ({
          latitude: point.lat,
          longitude: point.lng,
          altitude: point.alt,
          timestamp: point.timestamp
        }));

        setTrajectory(mapTrajectory);

      } catch (error) {
        console.error('Prediction calculation failed:', error);
        setPredictionError(error instanceof Error ? error.message : 'Prediction calculation failed');
        setTrajectory(defaultTrajectory);
      } finally {
        setIsCalculating(false);
      }
    };

    // Debounce the calculation to avoid excessive API calls
    const timeoutId = setTimeout(calculateWeatherIntegratedPrediction, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    launchLocation,
    launchSchedule.utcDateTime,
    balloonSpecifications,
    environmentalParameters,
    weatherIntegration
  ]);

  const handleLaunchLocationChange = (location: LaunchLocation) => {
    setLaunchLocation(location);
  };

  const handleBalloonSpecificationsChange = (specs: BalloonSpecifications) => {
    setBalloonSpecifications(specs);
  };

  const handleEnvironmentalParametersChange = (params: EnvironmentalParameters) => {
    setEnvironmentalParameters(params);
  };

  const handleLaunchScheduleChange = (schedule: LaunchSchedule) => {
    setLaunchSchedule(schedule);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <Container maxWidth="lg">
          <Box sx={{ py: 2 }}>
            {isCalculating && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Calculating weather-integrated prediction...
              </Alert>
            )}

            {predictionError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {predictionError}
              </Alert>
            )}

            {predictionResult && (
              <Alert 
                severity={predictionResult.weatherQuality === 'high' ? 'success' : 
                         predictionResult.weatherQuality === 'medium' ? 'warning' : 'error'} 
                sx={{ mb: 2 }}
              >
                Weather Quality: {predictionResult.weatherQuality.toUpperCase()}
                {predictionResult.weatherImpact && (
                  <div>
                    Wind Drift: {predictionResult.weatherImpact.windDrift.toFixed(2)} km
                    | Altitude Effect: {predictionResult.weatherImpact.altitudeEffect.toFixed(1)} m
                    | Uncertainty: {predictionResult.weatherImpact.uncertaintyRadius.toFixed(1)} km
                  </div>
                )}
              </Alert>
            )}

            <LaunchLocationInput
              value={launchLocation}
              onChange={handleLaunchLocationChange}
            />
            <LaunchTimeInput
              value={launchSchedule}
              onChange={handleLaunchScheduleChange}
              launchLocation={launchLocation}
            />
            <BalloonSpecificationsInput
              specifications={balloonSpecifications}
              onSpecificationsChange={handleBalloonSpecificationsChange}
            />
            <EnvironmentalParametersInput
              parameters={environmentalParameters}
              onParametersChange={handleEnvironmentalParametersChange}
            />
            <MapComponent
              center={[launchLocation.lat, launchLocation.lng]}
              zoom={13}
              launchLocation={launchLocation}
              trajectory={trajectory}
            />
            <TerrainVisualization />
            <TerrainWarnings />
            <DesktopDashboard />
          </Box>
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
