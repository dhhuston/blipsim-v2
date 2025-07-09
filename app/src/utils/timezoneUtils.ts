// Timezone handling utilities for weather data selection
// Based on task-12d specifications

export interface TimezoneInfo {
  timezone: string;              // IANA timezone identifier
  offset: number;               // UTC offset in minutes
  isDST: boolean;               // Whether daylight saving time is active
  name: string;                 // Human-readable timezone name
}

export interface TimeConversion {
  utc: string;                  // ISO string in UTC
  local: string;                // ISO string in local timezone
  timestamp: number;            // Unix timestamp
  timezone: string;             // IANA timezone identifier
}

/**
 * Convert launch time to UTC for weather API requests
 * @param localTime ISO string in local timezone
 * @param location Geographic coordinates for timezone detection
 * @returns UTC time and timezone information
 */
export function convertToUTC(
  localTime: string,
  location: { lat: number; lng: number }
): TimeConversion {
  try {
    // Parse the local time
    const localDate = new Date(localTime);
    
    // Get timezone for the location
    const timezone = getTimezoneForLocation(location);
    
    // Create a date in the specific timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Get UTC equivalent
    const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    
    return {
      utc: utcDate.toISOString(),
      local: localDate.toISOString(),
      timestamp: utcDate.getTime(),
      timezone
    };
  } catch (error) {
    console.error('Timezone conversion failed:', error);
    // Fallback to treating input as UTC
    const date = new Date(localTime);
    return {
      utc: date.toISOString(),
      local: date.toISOString(),
      timestamp: date.getTime(),
      timezone: 'UTC'
    };
  }
}

/**
 * Convert UTC weather data timestamps to local timezone
 * @param utcTime ISO string in UTC
 * @param timezone IANA timezone identifier
 * @returns Local time conversion
 */
export function convertFromUTC(utcTime: string, timezone: string): TimeConversion {
  try {
    const utcDate = new Date(utcTime);
    
    // Convert to local timezone
    const localTime = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
    
    return {
      utc: utcDate.toISOString(),
      local: localTime.toISOString(),
      timestamp: utcDate.getTime(),
      timezone
    };
  } catch (error) {
    console.error('UTC conversion failed:', error);
    const date = new Date(utcTime);
    return {
      utc: date.toISOString(),
      local: date.toISOString(),
      timestamp: date.getTime(),
      timezone: 'UTC'
    };
  }
}

/**
 * Get timezone information for a geographic location
 * Uses Intl.DateTimeFormat to determine timezone
 * @param location Geographic coordinates
 * @returns Timezone identifier
 */
export function getTimezoneForLocation(location: { lat: number; lng: number }): string {
  try {
    // Create a temporary date to test timezone detection
    const testDate = new Date();
    
    // Use a mapping of coordinate ranges to common timezones
    // This is a simplified approach - in production, you'd use a proper timezone database
    const timezone = getApproximateTimezone(location.lat, location.lng);
    
    // Validate the timezone by testing it
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return timezone;
    } catch {
      // Fallback to UTC if timezone is invalid
      return 'UTC';
    }
  } catch (error) {
    console.error('Timezone detection failed:', error);
    return 'UTC';
  }
}

/**
 * Get approximate timezone based on coordinates
 * This is a simplified mapping - in production, use a proper timezone database
 */
function getApproximateTimezone(lat: number, lng: number): string {
  // North America
  if (lat >= 25 && lat <= 70 && lng >= -170 && lng <= -50) {
    if (lng >= -130) return 'America/New_York';
    if (lng >= -110) return 'America/Chicago';
    if (lng >= -125) return 'America/Denver';
    if (lng >= -140) return 'America/Los_Angeles';
    return 'America/Anchorage';
  }
  
  // Europe
  if (lat >= 35 && lat <= 75 && lng >= -15 && lng <= 40) {
    if (lng <= 0) return 'Europe/London';
    if (lng <= 15) return 'Europe/Paris';
    if (lng <= 30) return 'Europe/Berlin';
    return 'Europe/Moscow';
  }
  
  // Asia
  if (lat >= -10 && lat <= 70 && lng >= 60 && lng <= 180) {
    if (lng <= 90) return 'Asia/Kolkata';
    if (lng <= 120) return 'Asia/Shanghai';
    if (lng <= 140) return 'Asia/Tokyo';
    return 'Asia/Seoul';
  }
  
  // Australia/Oceania
  if (lat >= -50 && lat <= -10 && lng >= 110 && lng <= 180) {
    if (lng <= 130) return 'Australia/Perth';
    if (lng <= 145) return 'Australia/Adelaide';
    return 'Australia/Sydney';
  }
  
  // Default to UTC for other regions
  return 'UTC';
}

/**
 * Get detailed timezone information
 * @param timezone IANA timezone identifier
 * @param date Optional date for DST calculation
 * @returns Timezone information
 */
export function getTimezoneInfo(timezone: string, date?: Date): TimezoneInfo {
  try {
    const testDate = date || new Date();
    
    // Get timezone offset
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    
    const parts = formatter.formatToParts(testDate);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    const offset = parseTimezoneOffset(offsetPart?.value || '+00:00');
    
    // Check for DST by comparing winter and summer dates
    const winterDate = new Date(testDate.getFullYear(), 0, 1); // January 1st
    const summerDate = new Date(testDate.getFullYear(), 6, 1); // July 1st
    
    const winterOffset = getOffsetForDate(timezone, winterDate);
    const summerOffset = getOffsetForDate(timezone, summerDate);
    const currentOffset = getOffsetForDate(timezone, testDate);
    
    const isDST = currentOffset !== winterOffset && currentOffset === summerOffset;
    
    // Get human-readable name
    const nameFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'long'
    });
    const nameParts = nameFormatter.formatToParts(testDate);
    const name = nameParts.find(part => part.type === 'timeZoneName')?.value || timezone;
    
    return {
      timezone,
      offset,
      isDST,
      name
    };
  } catch (error) {
    console.error('Failed to get timezone info:', error);
    return {
      timezone: 'UTC',
      offset: 0,
      isDST: false,
      name: 'Coordinated Universal Time'
    };
  }
}

/**
 * Parse timezone offset string to minutes
 */
function parseTimezoneOffset(offsetString: string): number {
  const match = offsetString.match(/([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  
  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  
  return sign * (hours * 60 + minutes);
}

/**
 * Get timezone offset for a specific date
 */
function getOffsetForDate(timezone: string, date: Date): number {
  try {
    const utcTime = date.getTime();
    const localTime = new Date(date.toLocaleString('en-US', { timeZone: timezone })).getTime();
    return (utcTime - localTime) / (1000 * 60); // Convert to minutes
  } catch {
    return 0;
  }
}

/**
 * Handle daylight saving time transitions for weather data
 * @param startTime Start of weather window
 * @param endTime End of weather window
 * @param timezone IANA timezone identifier
 * @returns Adjusted time window accounting for DST transitions
 */
export function handleDSTTransitions(
  startTime: string,
  endTime: string,
  timezone: string
): {
  adjustedStart: string;
  adjustedEnd: string;
  dstTransitions: Array<{
    date: string;
    type: 'spring_forward' | 'fall_back';
    offset: number;
  }>;
} {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const transitions: Array<{
      date: string;
      type: 'spring_forward' | 'fall_back';
      offset: number;
    }> = [];
    
    // Check for DST transitions within the time window
    // This is a simplified approach - in production, use a proper DST database
    const currentYear = start.getFullYear();
    
    // Typical DST dates (varies by region)
    const springForward = new Date(currentYear, 2, 14); // Second Sunday in March (approximate)
    const fallBack = new Date(currentYear, 10, 7); // First Sunday in November (approximate)
    
    if (springForward >= start && springForward <= end) {
      transitions.push({
        date: springForward.toISOString(),
        type: 'spring_forward',
        offset: 60 // 1 hour forward
      });
    }
    
    if (fallBack >= start && fallBack <= end) {
      transitions.push({
        date: fallBack.toISOString(),
        type: 'fall_back',
        offset: -60 // 1 hour backward
      });
    }
    
    // For now, don't adjust the times - just report transitions
    return {
      adjustedStart: startTime,
      adjustedEnd: endTime,
      dstTransitions: transitions
    };
  } catch (error) {
    console.error('DST transition handling failed:', error);
    return {
      adjustedStart: startTime,
      adjustedEnd: endTime,
      dstTransitions: []
    };
  }
}

/**
 * Synchronize weather timestamps with balloon trajectory timing
 * @param weatherTimestamps Array of weather data timestamps
 * @param trajectoryStart Trajectory start time
 * @param timezone Target timezone
 * @returns Synchronized timestamps
 */
export function synchronizeWeatherTimestamps(
  weatherTimestamps: string[],
  trajectoryStart: string,
  timezone: string
): Array<{
  original: string;
  synchronized: string;
  offset: number; // minutes from trajectory start
}> {
  try {
    const startTime = new Date(trajectoryStart).getTime();
    
    return weatherTimestamps.map(timestamp => {
      const weatherTime = new Date(timestamp).getTime();
      const offset = Math.round((weatherTime - startTime) / (1000 * 60)); // Convert to minutes
      
      // Convert to local timezone for consistency
      const synchronized = convertFromUTC(timestamp, timezone);
      
      return {
        original: timestamp,
        synchronized: synchronized.local,
        offset
      };
    });
  } catch (error) {
    console.error('Timestamp synchronization failed:', error);
    return weatherTimestamps.map(timestamp => ({
      original: timestamp,
      synchronized: timestamp,
      offset: 0
    }));
  }
} 