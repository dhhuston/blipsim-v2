import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Chip,
  Divider,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  Collapse,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Info as InfoIcon,
  Cloud as CloudIcon,
  Air as AirIcon,
  Thermostat as ThermostatIcon,
  Speed as SpeedIcon,
  Navigation as CompassIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

export interface EnvironmentalParameters {
  windSpeed: number;        // m/s (0-50)
  windDirection: number;    // degrees (0-360)
  temperature: number;      // Celsius (-50 to 50)
  atmosphericPressure: number; // hPa (500-1100)
  relativeHumidity: number; // percentage (0-100)
  useLiveWeather: boolean;  // toggle for live weather data
}

export interface WeatherPreset {
  name: string;
  description: string;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  atmosphericPressure: number;
  relativeHumidity: number;
  color: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export interface EnvironmentalParametersInputProps {
  parameters: EnvironmentalParameters;
  onParametersChange: (params: EnvironmentalParameters) => void;
  disabled?: boolean;
}

const WEATHER_PRESETS: WeatherPreset[] = [
  {
    name: 'Calm Conditions',
    description: 'Very light winds, clear skies',
    windSpeed: 1.0,
    windDirection: 0,
    temperature: 20,
    atmosphericPressure: 1013,
    relativeHumidity: 60,
    color: 'success'
  },
  {
    name: 'Very Light Winds',
    description: 'Minimal wind interference',
    windSpeed: 2.0,
    windDirection: 45,
    temperature: 18,
    atmosphericPressure: 1010,
    relativeHumidity: 55,
    color: 'success'
  },
  {
    name: 'Spring Conditions',
    description: 'Typical spring weather patterns',
    windSpeed: 5.0,
    windDirection: 90,
    temperature: 15,
    atmosphericPressure: 1008,
    relativeHumidity: 70,
    color: 'info'
  },
  {
    name: 'Summer Conditions',
    description: 'Warm summer weather',
    windSpeed: 3.0,
    windDirection: 135,
    temperature: 25,
    atmosphericPressure: 1012,
    relativeHumidity: 65,
    color: 'info'
  },
  {
    name: 'Autumn Conditions',
    description: 'Fall weather patterns',
    windSpeed: 6.0,
    windDirection: 180,
    temperature: 12,
    atmosphericPressure: 1005,
    relativeHumidity: 75,
    color: 'info'
  },
  {
    name: 'Winter Conditions',
    description: 'Cold winter weather',
    windSpeed: 4.0,
    windDirection: 225,
    temperature: 2,
    atmosphericPressure: 1020,
    relativeHumidity: 80,
    color: 'info'
  },
  {
    name: 'Moderate Winds',
    description: 'Noticeable wind conditions',
    windSpeed: 8.0,
    windDirection: 270,
    temperature: 16,
    atmosphericPressure: 1000,
    relativeHumidity: 60,
    color: 'warning'
  },
  {
    name: 'Strong Winds',
    description: 'High wind conditions',
    windSpeed: 15.0,
    windDirection: 315,
    temperature: 14,
    atmosphericPressure: 995,
    relativeHumidity: 50,
    color: 'warning'
  },
  {
    name: 'Storm Conditions',
    description: 'Severe weather conditions',
    windSpeed: 25.0,
    windDirection: 0,
    temperature: 8,
    atmosphericPressure: 980,
    relativeHumidity: 90,
    color: 'error'
  },
  {
    name: 'High Pressure',
    description: 'High pressure system',
    windSpeed: 2.0,
    windDirection: 45,
    temperature: 22,
    atmosphericPressure: 1030,
    relativeHumidity: 40,
    color: 'default'
  }
];

const DEFAULT_PARAMETERS: EnvironmentalParameters = {
  windSpeed: 5.0,
  windDirection: 0,
  temperature: 20,
  atmosphericPressure: 1013,
  relativeHumidity: 60,
  useLiveWeather: false
};

const getCardinalDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const EnvironmentalParametersInput: React.FC<EnvironmentalParametersInputProps> = ({
  parameters,
  onParametersChange,
  disabled = false
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Validation functions
  const validateWindSpeed = (value: number): string => {
    if (value < 0 || value > 50) {
      return 'Wind speed must be between 0 and 50 m/s';
    }
    return '';
  };

  const validateWindDirection = (value: number): string => {
    if (value < 0 || value > 360) {
      return 'Wind direction must be between 0 and 360 degrees';
    }
    return '';
  };

  const validateTemperature = (value: number): string => {
    if (value < -50 || value > 50) {
      return 'Temperature must be between -50 and 50°C';
    }
    return '';
  };

  const validateAtmosphericPressure = (value: number): string => {
    if (value < 500 || value > 1100) {
      return 'Atmospheric pressure must be between 500 and 1100 hPa';
    }
    return '';
  };

  const validateRelativeHumidity = (value: number): string => {
    if (value < 0 || value > 100) {
      return 'Relative humidity must be between 0 and 100%';
    }
    return '';
  };

  const validateField = (field: string, value: number): string => {
    switch (field) {
      case 'windSpeed':
        return validateWindSpeed(value);
      case 'windDirection':
        return validateWindDirection(value);
      case 'temperature':
        return validateTemperature(value);
      case 'atmosphericPressure':
        return validateAtmosphericPressure(value);
      case 'relativeHumidity':
        return validateRelativeHumidity(value);
      default:
        return '';
    }
  };

  const handleFieldChange = (field: keyof EnvironmentalParameters, value: any) => {
    const newParameters = { ...parameters, [field]: value };
    
    // Validate the field
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Update parameters if no error or if field is being cleared
    if (!error || value === '') {
      onParametersChange(newParameters);
    }
  };

  const handlePresetApply = (preset: WeatherPreset) => {
    const newParameters: EnvironmentalParameters = {
      ...parameters,
      windSpeed: preset.windSpeed,
      windDirection: preset.windDirection,
      temperature: preset.temperature,
      atmosphericPressure: preset.atmosphericPressure,
      relativeHumidity: preset.relativeHumidity
    };
    
    // Clear errors for preset values
    setErrors({});
    setTouched({});
    
    onParametersChange(newParameters);
  };

  const handleResetToDefaults = () => {
    const newParameters = { ...DEFAULT_PARAMETERS };
    setErrors({});
    setTouched({});
    onParametersChange(newParameters);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isFormValid = (): boolean => {
    return Object.keys(errors).length === 0 && 
           parameters.windSpeed >= 0 &&
           parameters.windDirection >= 0 &&
           parameters.temperature >= -50 &&
           parameters.atmosphericPressure >= 500 &&
           parameters.relativeHumidity >= 0;
  };

  const getConfigurationSummary = (): string => {
    const direction = getCardinalDirection(parameters.windDirection);
    return `${parameters.windSpeed} m/s ${direction}, ${parameters.temperature}°C, ${parameters.relativeHumidity}% humidity`;
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <CloudIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h3">
          Environmental Parameters
        </Typography>
        <Tooltip title="Configure wind, temperature, and atmospheric conditions">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Live Weather Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={parameters.useLiveWeather}
            onChange={(e) => handleFieldChange('useLiveWeather', e.target.checked)}
            disabled={disabled}
          />
        }
        label="Use live weather data"
        sx={{ mb: 2 }}
      />

      {parameters.useLiveWeather && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Live weather data is enabled. Manual inputs are disabled but can be used as overrides.
        </Alert>
      )}

      {/* Weather Presets */}
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Weather Presets
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {WEATHER_PRESETS.map((preset) => (
            <Chip
              key={preset.name}
              label={preset.name}
              color={preset.color}
              variant="outlined"
              size="small"
              onClick={() => handlePresetApply(preset)}
              disabled={disabled}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      </Box>

      {/* Basic Parameters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Wind Speed (m/s)"
            type="number"
            value={parameters.windSpeed}
            onChange={(e) => handleFieldChange('windSpeed', parseFloat(e.target.value) || 0)}
            onBlur={() => handleBlur('windSpeed')}
            error={touched.windSpeed && !!errors.windSpeed}
            helperText={touched.windSpeed && errors.windSpeed}
            disabled={disabled}
            InputProps={{
              startAdornment: <SpeedIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Wind Direction (°)"
            type="number"
            value={parameters.windDirection}
            onChange={(e) => handleFieldChange('windDirection', parseFloat(e.target.value) || 0)}
            onBlur={() => handleBlur('windDirection')}
            error={touched.windDirection && !!errors.windDirection}
            helperText={touched.windDirection ? errors.windDirection : getCardinalDirection(parameters.windDirection)}
            disabled={disabled}
            InputProps={{
              startAdornment: <CompassIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <TextField
            fullWidth
            label="Temperature (°C)"
            type="number"
            value={parameters.temperature}
            onChange={(e) => handleFieldChange('temperature', parseFloat(e.target.value) || 0)}
            onBlur={() => handleBlur('temperature')}
            error={touched.temperature && !!errors.temperature}
            helperText={touched.temperature && errors.temperature}
            disabled={disabled}
            InputProps={{
              startAdornment: <ThermostatIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Button
            variant="outlined"
            onClick={handleResetToDefaults}
            disabled={disabled}
            startIcon={<RefreshIcon />}
            sx={{ height: '56px', width: '100%' }}
          >
            Reset to Defaults
          </Button>
        </Box>
      </Box>

      {/* Advanced Parameters */}
      <Accordion 
        expanded={showAdvanced} 
        onChange={() => setShowAdvanced(!showAdvanced)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography>Advanced Parameters</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Atmospheric Pressure (hPa)"
                type="number"
                value={parameters.atmosphericPressure}
                onChange={(e) => handleFieldChange('atmosphericPressure', parseFloat(e.target.value) || 0)}
                onBlur={() => handleBlur('atmosphericPressure')}
                error={touched.atmosphericPressure && !!errors.atmosphericPressure}
                helperText={touched.atmosphericPressure && errors.atmosphericPressure}
                disabled={disabled}
                InputProps={{
                  startAdornment: <AirIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Relative Humidity (%)"
                type="number"
                value={parameters.relativeHumidity}
                onChange={(e) => handleFieldChange('relativeHumidity', parseFloat(e.target.value) || 0)}
                onBlur={() => handleBlur('relativeHumidity')}
                error={touched.relativeHumidity && !!errors.relativeHumidity}
                helperText={touched.relativeHumidity && errors.relativeHumidity}
                disabled={disabled}
                InputProps={{
                  startAdornment: <CloudIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Configuration Summary */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.default', 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Current Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getConfigurationSummary()}
        </Typography>
      </Box>

      {/* Validation Summary */}
      {!isFormValid() && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Please fix validation errors before proceeding.
        </Alert>
      )}
    </Paper>
  );
};

export default EnvironmentalParametersInput; 