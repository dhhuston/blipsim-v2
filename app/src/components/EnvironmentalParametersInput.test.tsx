import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import EnvironmentalParametersInput, { 
  EnvironmentalParameters, 
  EnvironmentalParametersInputProps 
} from './EnvironmentalParametersInput';

const mockOnParametersChange = jest.fn();

const defaultParameters: EnvironmentalParameters = {
  windSpeed: 5.0,
  windDirection: 0,
  temperature: 20,
  atmosphericPressure: 1013,
  relativeHumidity: 60,
  useLiveWeather: false
};

const renderWithTheme = (props: EnvironmentalParametersInputProps) => {
  return render(
    <ThemeProvider theme={theme}>
      <EnvironmentalParametersInput {...props} />
    </ThemeProvider>
  );
};

describe('EnvironmentalParametersInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all basic input fields', () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      expect(screen.getByLabelText(/wind speed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/wind direction/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/temperature \(°c\)/i)).toBeInTheDocument();
      expect(screen.getByText(/reset to defaults/i)).toBeInTheDocument();
    });

    it('renders weather presets', () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      expect(screen.getByText('Calm Conditions')).toBeInTheDocument();
      expect(screen.getByText('Spring Conditions')).toBeInTheDocument();
      expect(screen.getByText('Storm Conditions')).toBeInTheDocument();
    });

    it('renders advanced parameters section', () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      expect(screen.getByText('Advanced Parameters')).toBeInTheDocument();
    });

    it('renders configuration summary', () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      expect(screen.getByText('Current Configuration')).toBeInTheDocument();
      expect(screen.getByText(/5 m\/s N, 20°C, 60% humidity/)).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('validates wind speed range', async () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      const windSpeedInput = screen.getByLabelText(/wind speed/i);
      
      // Test invalid value
      fireEvent.change(windSpeedInput, { target: { value: '60' } });
      fireEvent.blur(windSpeedInput);
      
      await waitFor(() => {
        expect(screen.getByText(/wind speed must be between 0 and 50 m\/s/i)).toBeInTheDocument();
      });

      // Test valid value
      fireEvent.change(windSpeedInput, { target: { value: '10' } });
      fireEvent.blur(windSpeedInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/wind speed must be between 0 and 50 m\/s/i)).not.toBeInTheDocument();
      });
    });

    it('validates wind direction range', async () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      const windDirectionInput = screen.getByLabelText(/wind direction/i);
      
      // Test invalid value
      fireEvent.change(windDirectionInput, { target: { value: '400' } });
      fireEvent.blur(windDirectionInput);
      
      await waitFor(() => {
        expect(screen.getByText(/wind direction must be between 0 and 360 degrees/i)).toBeInTheDocument();
      });

      // Test valid value
      fireEvent.change(windDirectionInput, { target: { value: '180' } });
      fireEvent.blur(windDirectionInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/wind direction must be between 0 and 360 degrees/i)).not.toBeInTheDocument();
      });
    });

    it('validates temperature range', async () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      const temperatureInput = screen.getByLabelText(/temperature \(°c\)/i);
      
      // Test invalid value
      fireEvent.change(temperatureInput, { target: { value: '60' } });
      fireEvent.blur(temperatureInput);
      
      await waitFor(() => {
        expect(screen.getByText(/temperature must be between -50 and 50°C/i)).toBeInTheDocument();
      });

      // Test valid value
      fireEvent.change(temperatureInput, { target: { value: '25' } });
      fireEvent.blur(temperatureInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/temperature must be between -50 and 50°C/i)).not.toBeInTheDocument();
      });
    });

    it('validates atmospheric pressure range', async () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      // Expand advanced parameters
      const advancedButton = screen.getByText('Advanced Parameters');
      fireEvent.click(advancedButton);

      const pressureInput = screen.getByLabelText(/atmospheric pressure/i);
      
      // Test invalid value
      fireEvent.change(pressureInput, { target: { value: '400' } });
      fireEvent.blur(pressureInput);
      
      await waitFor(() => {
        expect(screen.getByText(/atmospheric pressure must be between 500 and 1100 hPa/i)).toBeInTheDocument();
      });

      // Test valid value
      fireEvent.change(pressureInput, { target: { value: '1000' } });
      fireEvent.blur(pressureInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/atmospheric pressure must be between 500 and 1100 hPa/i)).not.toBeInTheDocument();
      });
    });

    it('validates relative humidity range', async () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      // Expand advanced parameters
      const advancedButton = screen.getByText('Advanced Parameters');
      fireEvent.click(advancedButton);

      const humidityInput = screen.getByLabelText(/relative humidity/i);
      
      // Test invalid value
      fireEvent.change(humidityInput, { target: { value: '110' } });
      fireEvent.blur(humidityInput);
      
      await waitFor(() => {
        expect(screen.getByText(/relative humidity must be between 0 and 100%/i)).toBeInTheDocument();
      });

      // Test valid value
      fireEvent.change(humidityInput, { target: { value: '75' } });
      fireEvent.blur(humidityInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/relative humidity must be between 0 and 100%/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Weather Presets', () => {
    it('applies calm conditions preset', async () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      const calmPreset = screen.getByText('Calm Conditions');
      fireEvent.click(calmPreset);

      await waitFor(() => {
        expect(mockOnParametersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            windSpeed: 1.0,
            windDirection: 0,
            temperature: 20,
            atmosphericPressure: 1013,
            relativeHumidity: 60
          })
        );
      });
    });

    it('applies storm conditions preset', async () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      const stormPreset = screen.getByText('Storm Conditions');
      fireEvent.click(stormPreset);

      await waitFor(() => {
        expect(mockOnParametersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            windSpeed: 25.0,
            windDirection: 0,
            temperature: 8,
            atmosphericPressure: 980,
            relativeHumidity: 90
          })
        );
      });
    });
  });

  describe('Live Weather Toggle', () => {
    it('toggles live weather mode', async () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      const toggle = screen.getByLabelText(/use live weather data/i);
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockOnParametersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            useLiveWeather: true
          })
        );
      });
    });

    it('shows info alert when live weather is enabled', () => {
      renderWithTheme({
        parameters: { ...defaultParameters, useLiveWeather: true },
        onParametersChange: mockOnParametersChange
      });

      expect(screen.getByText(/live weather data is enabled/i)).toBeInTheDocument();
    });
  });

  describe('Reset to Defaults', () => {
    it('resets all parameters to default values', async () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      const resetButton = screen.getByText(/reset to defaults/i);
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(mockOnParametersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            windSpeed: 5.0,
            windDirection: 0,
            temperature: 20,
            atmosphericPressure: 1013,
            relativeHumidity: 60,
            useLiveWeather: false
          })
        );
      });
    });
  });

  describe('Cardinal Direction Helper', () => {
    it('displays correct cardinal direction for wind direction', () => {
      renderWithTheme({
        parameters: { ...defaultParameters, windDirection: 90 },
        onParametersChange: mockOnParametersChange
      });

      expect(screen.getByText(/5 m\/s E, 20°C, 60% humidity/)).toBeInTheDocument();
    });

    it('displays correct cardinal direction for different angles', () => {
      renderWithTheme({
        parameters: { ...defaultParameters, windDirection: 180 },
        onParametersChange: mockOnParametersChange
      });

      expect(screen.getByText(/5 m\/s S, 20°C, 60% humidity/)).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables all inputs when disabled prop is true', () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange,
        disabled: true
      });

      const windSpeedInput = screen.getByLabelText(/wind speed/i);
      const windDirectionInput = screen.getByLabelText(/wind direction/i);
      const temperatureInput = screen.getByLabelText(/temperature \(°c\)/i);
      const resetButton = screen.getByText(/reset to defaults/i);

      expect(windSpeedInput).toBeDisabled();
      expect(windDirectionInput).toBeDisabled();
      expect(temperatureInput).toBeDisabled();
      expect(resetButton).toBeDisabled();
    });
  });

  describe('Form Validation Status', () => {
    it('shows validation warning when form is invalid', () => {
      renderWithTheme({
        parameters: { ...defaultParameters, windSpeed: -1 },
        onParametersChange: mockOnParametersChange
      });

      expect(screen.getByText(/please fix validation errors before proceeding/i)).toBeInTheDocument();
    });

    it('does not show validation warning when form is valid', () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      expect(screen.queryByText(/please fix validation errors before proceeding/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      expect(screen.getByLabelText(/wind speed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/wind direction/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/temperature \(°c\)/i)).toBeInTheDocument();
    });

    it('has tooltips for information', () => {
      renderWithTheme({
        parameters: defaultParameters,
        onParametersChange: mockOnParametersChange
      });

      const infoButton = screen.getByRole('button', { name: /configure wind, temperature, and atmospheric conditions/i });
      expect(infoButton).toBeInTheDocument();
    });
  });
}); 