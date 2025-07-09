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
  Chip,
  Grid,
  CircularProgress
} from '@mui/material';
import { format, parseISO, isValid, addDays, isAfter, isBefore } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { WeatherService } from '../services/weatherService';

export interface LaunchSchedule {
  date: string;           // ISO date string
  time: string;           // HH:MM format
  timezone: string;       // IANA timezone identifier
  utcDateTime: string;    // Calculated UTC timestamp
  weatherQuality: 'high' | 'medium' | 'low' | 'unavailable';
}

export interface LaunchTimeInputProps {
  value?: LaunchSchedule;
  onChange?: (schedule: LaunchSchedule) => void;
  launchLocation?: { lat: number; lng: number; alt?: number };
  weatherService?: WeatherService;
}

// Common timezones for balloon launches
const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }
];

// Timezone detection based on coordinates
const getTimezoneFromCoordinates = (lat: number, lng: number): string => {
  // Simple timezone estimation based on longitude
  // This is a basic implementation - in production, use a proper timezone API
  const timezoneOffset = Math.round(lng / 15);
  const utcOffset = timezoneOffset >= 0 ? `+${timezoneOffset}` : `${timezoneOffset}`;
  return `UTC${utcOffset}`;
};

// Weather quality assessment
const assessWeatherQuality = (launchTime: Date, currentTime: Date = new Date()): 'high' | 'medium' | 'low' | 'unavailable' => {
  const timeDiff = launchTime.getTime() - currentTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  if (hoursDiff < 0) {
    return 'unavailable'; // Past time
  } else if (hoursDiff <= 48) {
    return 'high'; // Next 48 hours - high quality forecast
  } else if (hoursDiff <= 168) { // 7 days
    return 'medium'; // 3-7 days - medium quality
  } else {
    return 'low'; // Beyond 7 days - low quality
  }
};

const LaunchTimeInput: React.FC<LaunchTimeInputProps> = ({
  value,
  onChange,
  launchLocation,
  weatherService
}) => {
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(
    value ? parseISO(value.utcDateTime) : addDays(new Date(), 1)
  );
  const [dateInput, setDateInput] = useState<string>(
    value ? format(parseISO(value.utcDateTime), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );
  const [timeInput, setTimeInput] = useState<string>(
    value ? format(parseISO(value.utcDateTime), 'HH:mm') : format(addDays(new Date(), 1), 'HH:mm')
  );
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    value?.timezone || 'UTC'
  );
  const [weatherQuality, setWeatherQuality] = useState<'high' | 'medium' | 'low' | 'unavailable'>(
    value?.weatherQuality || 'high'
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-detect timezone from launch location
  useEffect(() => {
    if (launchLocation && !value?.timezone) {
      const detectedTimezone = getTimezoneFromCoordinates(launchLocation.lat, launchLocation.lng);
      setSelectedTimezone(detectedTimezone);
    }
  }, [launchLocation, value?.timezone]);

  // Validate and update schedule
  useEffect(() => {
    const newErrors: string[] = [];
    
    if (!selectedDateTime || !dateInput || !timeInput) {
      newErrors.push('Please select a launch date and time');
    } else {
      const now = new Date();
      
      // Check if launch time is in the past
      if (isBefore(selectedDateTime, now)) {
        newErrors.push('Launch time cannot be in the past');
      }
      
      // Check if launch time is too far in the future (more than 30 days)
      const thirtyDaysFromNow = addDays(now, 30);
      if (isAfter(selectedDateTime, thirtyDaysFromNow)) {
        newErrors.push('Launch time cannot be more than 30 days in the future');
      }
    }

    setErrors(newErrors);

    // Update weather quality
    if (selectedDateTime) {
      const quality = assessWeatherQuality(selectedDateTime);
      setWeatherQuality(quality);
    }

    // Call onChange if valid
    if (selectedDateTime && newErrors.length === 0 && onChange) {
      const utcDateTime = zonedTimeToUtc(selectedDateTime, selectedTimezone);
      const schedule: LaunchSchedule = {
        date: format(selectedDateTime, 'yyyy-MM-dd'),
        time: format(selectedDateTime, 'HH:mm'),
        timezone: selectedTimezone,
        utcDateTime: utcDateTime.toISOString(),
        weatherQuality
      };
      onChange(schedule);
    }
  }, [selectedDateTime, selectedTimezone, weatherQuality, dateInput, timeInput]); // Removed onChange from deps to prevent infinite loop

  const handleTimezoneChange = (newTimezone: string) => {
    setSelectedTimezone(newTimezone);
  };

  const getWeatherQualityMessage = () => {
    switch (weatherQuality) {
      case 'high':
        return 'High quality weather forecast available';
      case 'medium':
        return 'Medium quality weather forecast available';
      case 'low':
        return 'Low quality weather forecast - consider launching sooner';
      case 'unavailable':
        return 'Weather data unavailable for selected time';
      default:
        return '';
    }
  };

  const getWeatherQualityColor = () => {
    switch (weatherQuality) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      case 'unavailable':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Launch Time and Scheduling
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Date and Time Inputs */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          <TextField
            label="Launch Date"
            type="date"
            value={dateInput}
            onChange={(e) => {
              const date = e.target.value;
              setDateInput(date);
              if (date && timeInput) {
                const newDateTime = new Date(date + 'T' + timeInput);
                setSelectedDateTime(newDateTime);
              }
            }}
            fullWidth
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
          />
          <TextField
            label="Launch Time"
            type="time"
            value={timeInput}
            onChange={(e) => {
              const time = e.target.value;
              setTimeInput(time);
              if (time && dateInput) {
                const newDateTime = new Date(dateInput + 'T' + time);
                setSelectedDateTime(newDateTime);
              }
            }}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {/* Timezone Selector */}
        <FormControl fullWidth>
          <InputLabel id="timezone-label">Timezone</InputLabel>
          <Select
            labelId="timezone-label"
            value={selectedTimezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            label="Timezone"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <MenuItem key={tz.value} value={tz.value}>
                {tz.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Weather Quality Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Weather Forecast Quality:
          </Typography>
          <Chip
            label={getWeatherQualityMessage()}
            color={getWeatherQualityColor() as any}
            size="small"
          />
        </Box>

        {/* UTC Time Display */}
        {selectedDateTime && (
          <Typography variant="body2" color="text.secondary">
            UTC Time: {selectedDateTime ? format(selectedDateTime, 'yyyy-MM-dd HH:mm:ss') + ' UTC' : ''}
          </Typography>
        )}

        {/* Error Display */}
        {errors.length > 0 && (
          <Alert severity="error">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {/* Instructions */}
        <Typography variant="body2" color="text.secondary">
          Set your launch date and time. The system will automatically detect your timezone based on launch location, 
          but you can override it if needed. Weather forecast quality is indicated for the selected time.
        </Typography>
      </Box>
    </Paper>
  );
};

export default LaunchTimeInput; 