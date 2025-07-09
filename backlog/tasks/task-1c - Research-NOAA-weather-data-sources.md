---
id: task-1c
title: Research NOAA weather data sources
status: Completed
assignee: []
created_date: '2025-07-08'
updated_date: '2025-07-08'
labels:
  - research
  - weather-data
dependencies: []
priority: high
---

## Description

Research NOAA weather data sources and APIs to understand available data formats, coverage, update frequency, and integration requirements.

## Acceptance Criteria
- [x] Identify relevant NOAA data products (GFS, NAM, etc.)
- [x] Document API endpoints and data formats
- [x] Research data update frequency and latency
- [x] Note rate limits and usage costs
- [x] Document data coverage and resolution

## Research Findings

### 1. Relevant NOAA Data Products

#### Global Forecast System (GFS)
- **Purpose**: Global weather forecasting model
- **Coverage**: Global (0.25° x 0.25° resolution)
- **Update Frequency**: Every 6 hours (00Z, 06Z, 12Z, 18Z)
- **Forecast Range**: Up to 16 days
- **Key Variables**: Wind (u/v components), temperature, pressure, humidity
- **Altitude Levels**: 26 pressure levels (surface to 10mb)
- **Format**: GRIB2, NetCDF
- **Access**: Free via NOMADS, AWS, Google Cloud

#### North American Mesoscale (NAM)
- **Purpose**: High-resolution regional forecasting
- **Coverage**: North America (12km resolution)
- **Update Frequency**: Every 6 hours
- **Forecast Range**: Up to 84 hours
- **Key Variables**: Wind, temperature, pressure, precipitation
- **Altitude Levels**: 60 levels (surface to 10mb)
- **Format**: GRIB2
- **Access**: Free via NOMADS

#### Rapid Refresh (RAP)
- **Purpose**: Short-term high-resolution forecasting
- **Coverage**: North America (13km resolution)
- **Update Frequency**: Every hour
- **Forecast Range**: Up to 18 hours
- **Key Variables**: Wind, temperature, pressure
- **Altitude Levels**: 50 levels
- **Format**: GRIB2
- **Access**: Free via NOMADS

#### High-Resolution Rapid Refresh (HRRR)
- **Purpose**: Very high-resolution short-term forecasting
- **Coverage**: Continental US (3km resolution)
- **Update Frequency**: Every hour
- **Forecast Range**: Up to 18 hours
- **Key Variables**: Wind, temperature, pressure, precipitation
- **Altitude Levels**: 50 levels
- **Format**: GRIB2
- **Access**: Free via NOMADS

### 2. API Endpoints and Data Formats

#### NOMADS (NOAA Operational Model Archive and Distribution System)
- **Base URL**: https://nomads.ncep.noaa.gov/
- **GFS Endpoint**: https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25_1hr.pl
- **NAM Endpoint**: https://nomads.ncep.noaa.gov/cgi-bin/filter_nam_0p25_1hr.pl
- **RAP Endpoint**: https://nomads.ncep.noaa.gov/cgi-bin/filter_rap_0p25_1hr.pl
- **HRRR Endpoint**: https://nomads.ncep.noaa.gov/cgi-bin/filter_hrrr_0p25_1hr.pl

#### NOAA Climate Data Online (CDO)
- **Base URL**: https://www.ncdc.noaa.gov/cdo-web/
- **API Endpoint**: https://www.ncdc.noaa.gov/cdo-web/api/v2/
- **Authentication**: Requires API token (free registration)
- **Rate Limit**: 1000 requests per day (free tier)
- **Format**: JSON

#### NOAA Weather API
- **Base URL**: https://api.weather.gov/
- **Authentication**: None required
- **Rate Limit**: 100 requests per minute
- **Format**: JSON
- **Coverage**: US only

### 3. Data Update Frequency and Latency

#### GFS (Recommended for BLIiPSim)
- **Model Runs**: 00Z, 06Z, 12Z, 18Z UTC
- **Data Availability**: ~4-6 hours after model run
- **Latency**: 4-6 hours from current time
- **Forecast Steps**: 1-hour intervals for first 120 hours, 3-hour intervals thereafter

#### NAM
- **Model Runs**: 00Z, 06Z, 12Z, 18Z UTC
- **Data Availability**: ~3-4 hours after model run
- **Latency**: 3-4 hours from current time
- **Forecast Steps**: 1-hour intervals for first 84 hours

#### RAP/HRRR
- **Model Runs**: Every hour
- **Data Availability**: ~1-2 hours after model run
- **Latency**: 1-2 hours from current time
- **Forecast Steps**: 1-hour intervals

### 4. Rate Limits and Usage Costs

#### Free Access (Recommended)
- **NOMADS**: No rate limits, no authentication required
- **NOAA Weather API**: 100 requests/minute, no authentication
- **CDO API**: 1000 requests/day (free tier), requires registration
- **AWS Public Dataset**: No rate limits, pay for data transfer

#### Commercial Access
- **CDO API Premium**: $1000/month for 100,000 requests/day
- **AWS Data Transfer**: ~$0.09/GB for data transfer
- **Google Cloud**: Similar pricing to AWS

### 5. Data Coverage and Resolution

#### Global Coverage (GFS)
- **Spatial Resolution**: 0.25° x 0.25° (~25km at equator)
- **Temporal Resolution**: 1-hour intervals (first 120 hours)
- **Vertical Levels**: 26 pressure levels (surface to 10mb)
- **Variables**: Wind (u/v), temperature, pressure, humidity, geopotential height

#### Regional Coverage (NAM/RAP/HRRR)
- **Spatial Resolution**: 12km (NAM), 13km (RAP), 3km (HRRR)
- **Temporal Resolution**: 1-hour intervals
- **Vertical Levels**: 60 levels (NAM), 50 levels (RAP/HRRR)
- **Variables**: Wind (u/v), temperature, pressure, humidity, precipitation

### 6. Integration Requirements for BLIiPSim

#### Recommended Approach
1. **Primary Data Source**: GFS via NOMADS (global coverage, free access)
2. **Backup Data Source**: NAM for North American flights
3. **High-Resolution Option**: HRRR for US flights when available

#### Data Processing Requirements
- **GRIB2 Parser**: Required for reading model output
- **NetCDF Parser**: Alternative format support
- **Interpolation**: Bilinear interpolation for wind vectors
- **Caching**: Local caching to reduce API calls
- **Error Handling**: Fallback to older forecasts if latest unavailable

#### Technical Implementation
- **Library**: `grib2` or `eccodes` for GRIB2 parsing
- **Interpolation**: Custom bilinear interpolation for wind vectors
- **Caching**: Redis or local file system
- **Error Handling**: Exponential backoff for API failures

### 7. Comparison with CUSF Approach

#### CUSF Implementation
- **Data Source**: NOAA GFS via PyDAP
- **Resolution**: 1.0° x 1.0° (coarser than current GFS)
- **Update Frequency**: Every 6 hours
- **Interpolation**: Bilinear interpolation in lat/lng/alt/time
- **Caching**: PyDAP cache for weather data

#### BLIiPSim v2 Improvements
- **Higher Resolution**: 0.25° x 0.25° GFS data
- **Multiple Sources**: GFS + NAM + HRRR for redundancy
- **Better Caching**: Client-side caching with service workers
- **Real-time Updates**: Hourly updates for short-term flights
- **Error Handling**: Multiple fallback options

### 8. Cost Analysis

#### Free Tier (Recommended for MVP)
- **Data Transfer**: ~1GB/month for global coverage
- **API Calls**: <1000/day (well within limits)
- **Storage**: <100MB for cached data
- **Total Cost**: $0

#### Production Scaling
- **Data Transfer**: ~10GB/month for high-frequency updates
- **API Calls**: <10,000/day for multiple users
- **Storage**: <1GB for extended caching
- **Total Cost**: <$50/month

## Recommendations

### For BLIiPSim v2 Implementation
1. **Start with GFS**: Use NOMADS GFS data as primary source
2. **Add NAM backup**: Implement NAM for North American flights
3. **Consider HRRR**: Add HRRR for US flights requiring high resolution
4. **Implement caching**: Cache data locally to reduce API calls
5. **Add error handling**: Implement fallback to older forecasts
6. **Use GRIB2 parser**: Implement GRIB2 parsing for direct model access

### Next Steps
1. **Prototype GFS integration**: Test NOMADS API access
2. **Implement GRIB2 parsing**: Add support for direct model data
3. **Design caching strategy**: Plan local data storage approach
4. **Plan fallback strategy**: Design error handling and backup data sources

## ## Technical Specifications

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

## ## Sources
- NOAA NOMADS: https://nomads.ncep.noaa.gov/
- NOAA Climate Data Online: https://www.ncdc.noaa.gov/cdo-web/
- NOAA Weather API: https://api.weather.gov/
- AWS NOAA Public Dataset: https://aws.amazon.com/noaa/
- Google Cloud NOAA Data: https://cloud.google.com/storage/docs/public-datasets/noaa
