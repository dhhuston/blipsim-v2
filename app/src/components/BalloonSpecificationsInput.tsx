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
  IconButton
} from '@mui/material';
import {
  Info as InfoIcon,
  Science as ScienceIcon,
  Flight as FlightIcon,
  Speed as SpeedIcon,
  FitnessCenter as WeightIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { BalloonSpecifications } from '../types/UserInputs';

export interface BalloonSpecificationsInputProps {
  specifications: BalloonSpecifications;
  onSpecificationsChange: (specs: BalloonSpecifications) => void;
  disabled?: boolean;
}

export interface BalloonTypeOption {
  value: string;
  label: string;
  description: string;
  defaultVolume: number;
  defaultBurstAltitude: number;
  defaultAscentRate: number;
  defaultPayloadWeight: number;
  defaultDragCoefficient: number;
}

const BALLOON_TYPE_OPTIONS: BalloonTypeOption[] = [
  {
    value: 'latex',
    label: 'Latex Meteorological',
    description: 'Standard weather balloons for atmospheric research',
    defaultVolume: 1.0,
    defaultBurstAltitude: 30000,
    defaultAscentRate: 5.0,
    defaultPayloadWeight: 1.0,
    defaultDragCoefficient: 0.5
  },
  {
    value: 'hpe',
    label: 'HDPE High-Altitude',
    description: 'Research balloons for extended high-altitude flights',
    defaultVolume: 10.0,
    defaultBurstAltitude: 45000,
    defaultAscentRate: 3.0,
    defaultPayloadWeight: 5.0,
    defaultDragCoefficient: 0.6
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'User-defined specifications for specialized applications',
    defaultVolume: 1.0,
    defaultBurstAltitude: 30000,
    defaultAscentRate: 5.0,
    defaultPayloadWeight: 1.0,
    defaultDragCoefficient: 0.5
  }
];

const BalloonSpecificationsInput: React.FC<BalloonSpecificationsInputProps> = ({
  specifications,
  onSpecificationsChange,
  disabled = false
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Validation functions
  const validateVolume = (value: number): string => {
    if (value < 0.1 || value > 1000) {
      return 'Volume must be between 0.1 and 1000 m³';
    }
    return '';
  };

  const validateBurstAltitude = (value: number): string => {
    if (value < 1000 || value > 60000) {
      return 'Burst altitude must be between 1,000 and 60,000 m';
    }
    return '';
  };

  const validateAscentRate = (value: number): string => {
    if (value < 1 || value > 10) {
      return 'Ascent rate must be between 1 and 10 m/s';
    }
    return '';
  };

  const validatePayloadWeight = (value: number): string => {
    if (value < 0.1 || value > 50) {
      return 'Payload weight must be between 0.1 and 50 kg';
    }
    return '';
  };

  const validateDragCoefficient = (value: number): string => {
    if (value < 0.1 || value > 2.0) {
      return 'Drag coefficient must be between 0.1 and 2.0';
    }
    return '';
  };

  const validateField = (field: string, value: number): string => {
    switch (field) {
      case 'initialVolume':
        return validateVolume(value);
      case 'burstAltitude':
        return validateBurstAltitude(value);
      case 'ascentRate':
        return validateAscentRate(value);
      case 'payloadWeight':
        return validatePayloadWeight(value);
      case 'dragCoefficient':
        return validateDragCoefficient(value);
      default:
        return '';
    }
  };

  const handleFieldChange = (field: keyof BalloonSpecifications, value: any) => {
    const newSpecifications = { ...specifications, [field]: value };
    
    // Validate the field
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Update specifications if no error or if field is being cleared
    if (!error || value === '') {
      onSpecificationsChange(newSpecifications);
    }
  };

  const handleBalloonTypeChange = (balloonType: string) => {
    const selectedOption = BALLOON_TYPE_OPTIONS.find(option => option.value === balloonType);
    
    if (selectedOption && balloonType !== 'custom') {
      // Apply preset values for non-custom types
      const newSpecifications: BalloonSpecifications = {
        balloonType: selectedOption.label,
        initialVolume: selectedOption.defaultVolume,
        burstAltitude: selectedOption.defaultBurstAltitude,
        ascentRate: selectedOption.defaultAscentRate,
        payloadWeight: selectedOption.defaultPayloadWeight,
        dragCoefficient: selectedOption.defaultDragCoefficient
      };
      
      // Clear errors for preset values
      setErrors({});
      setTouched({});
      
      onSpecificationsChange(newSpecifications);
    } else {
      // For custom type, just update the type
      handleFieldChange('balloonType', selectedOption?.label || 'Custom');
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getCurrentBalloonTypeValue = (): string => {
    const option = BALLOON_TYPE_OPTIONS.find(opt => opt.label === specifications.balloonType);
    return option?.value || 'custom';
  };

  const isFormValid = (): boolean => {
    return Object.keys(errors).length === 0 && 
           specifications.initialVolume > 0 &&
           specifications.burstAltitude > 0 &&
           specifications.ascentRate > 0 &&
           specifications.payloadWeight > 0 &&
           specifications.dragCoefficient > 0;
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ScienceIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2">
          Balloon Specifications
        </Typography>
        <Tooltip title="Configure balloon parameters for trajectory prediction">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Balloon Type Selection */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel>Balloon Type</InputLabel>
            <Select
              value={getCurrentBalloonTypeValue()}
              onChange={(e) => handleBalloonTypeChange(e.target.value)}
              label="Balloon Type"
            >
              {BALLOON_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Initial Volume */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Initial Volume"
            type="number"
            value={specifications.initialVolume}
            onChange={(e) => handleFieldChange('initialVolume', parseFloat(e.target.value) || 0)}
            onBlur={() => handleBlur('initialVolume')}
            error={touched.initialVolume && !!errors.initialVolume}
            helperText={touched.initialVolume && errors.initialVolume}
            disabled={disabled}
            InputProps={{
              endAdornment: <Typography variant="caption">m³</Typography>,
              startAdornment: (
                <Tooltip title="Balloon volume at launch">
                  <FlightIcon sx={{ mr: 1, fontSize: 16 }} />
                </Tooltip>
              )
            }}
          />
        </Grid>

        {/* Burst Altitude */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Burst Altitude"
            type="number"
            value={specifications.burstAltitude}
            onChange={(e) => handleFieldChange('burstAltitude', parseFloat(e.target.value) || 0)}
            onBlur={() => handleBlur('burstAltitude')}
            error={touched.burstAltitude && !!errors.burstAltitude}
            helperText={touched.burstAltitude && errors.burstAltitude}
            disabled={disabled}
            InputProps={{
              endAdornment: <Typography variant="caption">m</Typography>,
              startAdornment: (
                <Tooltip title="Altitude where balloon bursts">
                  <FlightIcon sx={{ mr: 1, fontSize: 16 }} />
                </Tooltip>
              )
            }}
          />
        </Grid>

        {/* Ascent Rate */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Ascent Rate"
            type="number"
            value={specifications.ascentRate}
            onChange={(e) => handleFieldChange('ascentRate', parseFloat(e.target.value) || 0)}
            onBlur={() => handleBlur('ascentRate')}
            error={touched.ascentRate && !!errors.ascentRate}
            helperText={touched.ascentRate && errors.ascentRate}
            disabled={disabled}
            InputProps={{
              endAdornment: <Typography variant="caption">m/s</Typography>,
              startAdornment: (
                <Tooltip title="Vertical ascent speed">
                  <SpeedIcon sx={{ mr: 1, fontSize: 16 }} />
                </Tooltip>
              )
            }}
          />
        </Grid>

        {/* Payload Weight */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Payload Weight"
            type="number"
            value={specifications.payloadWeight}
            onChange={(e) => handleFieldChange('payloadWeight', parseFloat(e.target.value) || 0)}
            onBlur={() => handleBlur('payloadWeight')}
            error={touched.payloadWeight && !!errors.payloadWeight}
            helperText={touched.payloadWeight && errors.payloadWeight}
            disabled={disabled}
            InputProps={{
              endAdornment: <Typography variant="caption">kg</Typography>,
              startAdornment: (
                <Tooltip title="Total payload weight">
                  <WeightIcon sx={{ mr: 1, fontSize: 16 }} />
                </Tooltip>
              )
            }}
          />
        </Grid>

        {/* Drag Coefficient */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Drag Coefficient"
            type="number"
            value={specifications.dragCoefficient}
            onChange={(e) => handleFieldChange('dragCoefficient', parseFloat(e.target.value) || 0)}
            onBlur={() => handleBlur('dragCoefficient')}
            error={touched.dragCoefficient && !!errors.dragCoefficient}
            helperText={touched.dragCoefficient && errors.dragCoefficient}
            disabled={disabled}
            InputProps={{
              endAdornment: <Typography variant="caption">dimensionless</Typography>,
              startAdornment: (
                <Tooltip title="Aerodynamic drag coefficient">
                  <DragIcon sx={{ mr: 1, fontSize: 16 }} />
                </Tooltip>
              )
            }}
          />
        </Grid>
      </Grid>

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Please fix the following validation errors:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0 }}>
            {Object.entries(errors).map(([field, error]) => (
              <Typography key={field} component="li" variant="body2">
                {error}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}

      {/* Form Status */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isFormValid() ? (
            <Chip label="Valid Configuration" color="success" size="small" />
          ) : (
            <Chip label="Invalid Configuration" color="error" size="small" />
          )}
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          {specifications.balloonType} • {specifications.initialVolume} m³ • {specifications.burstAltitude} m
        </Typography>
      </Box>
    </Paper>
  );
};

export default BalloonSpecificationsInput; 