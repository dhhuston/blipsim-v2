import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from '../theme';
import BalloonSpecificationsInput from './BalloonSpecificationsInput';
import { BalloonSpecifications } from '../types/UserInputs';

// Mock Material-UI theme provider wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
);

// Default test specifications
const defaultSpecifications: BalloonSpecifications = {
  balloonType: 'Latex Meteorological',
  initialVolume: 1.0,
  burstAltitude: 30000,
  ascentRate: 5.0,
  payloadWeight: 1.0,
  dragCoefficient: 0.5
};

describe('BalloonSpecificationsInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all input fields correctly', () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Balloon Specifications')).toBeInTheDocument();
      // Fix: Use getAllByText for 'Balloon Type' and check at least one exists
      expect(screen.getAllByText('Balloon Type').length).toBeGreaterThan(0);
      expect(screen.getByLabelText('Initial Volume')).toBeInTheDocument();
      expect(screen.getByLabelText('Burst Altitude')).toBeInTheDocument();
      expect(screen.getByLabelText('Ascent Rate')).toBeInTheDocument();
      expect(screen.getByLabelText('Payload Weight')).toBeInTheDocument();
      expect(screen.getByLabelText('Drag Coefficient')).toBeInTheDocument();
    });

    it('displays current values correctly', () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      // Check that the form shows valid configuration
      expect(screen.getByText('Valid Configuration')).toBeInTheDocument();
      expect(screen.getByText('Latex Meteorological • 1 m³ • 30000 m')).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('validates volume input correctly', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      const volumeInput = screen.getByLabelText('Initial Volume');
      const volumeField = volumeInput.closest('.MuiFormControl-root') as HTMLElement || volumeInput.parentElement as HTMLElement;
      // Test invalid value (too low)
      fireEvent.change(volumeInput, { target: { value: '0.05' } });
      fireEvent.blur(volumeInput);
      await waitFor(() => {
        expect(within(volumeField!).getByText('Volume must be between 0.1 and 1000 m³')).toBeInTheDocument();
      });
      // Test invalid value (too high)
      fireEvent.change(volumeInput, { target: { value: '1500' } });
      fireEvent.blur(volumeInput);
      await waitFor(() => {
        expect(within(volumeField!).getByText('Volume must be between 0.1 and 1000 m³')).toBeInTheDocument();
      });
      // Test valid value
      fireEvent.change(volumeInput, { target: { value: '5.0' } });
      fireEvent.blur(volumeInput);
      await waitFor(() => {
        expect(within(volumeField!).queryByText('Volume must be between 0.1 and 1000 m³')).not.toBeInTheDocument();
      });
    });

    it('validates burst altitude input correctly', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );
      const altitudeInput = screen.getByLabelText('Burst Altitude');
      const altitudeField = altitudeInput.closest('.MuiFormControl-root') as HTMLElement || altitudeInput.parentElement as HTMLElement;
      // Test invalid value (too low)
      fireEvent.change(altitudeInput, { target: { value: '500' } });
      fireEvent.blur(altitudeInput);
      await waitFor(() => {
        expect(within(altitudeField!).getByText('Burst altitude must be between 1,000 and 60,000 m')).toBeInTheDocument();
      });
      // Test invalid value (too high)
      fireEvent.change(altitudeInput, { target: { value: '70000' } });
      fireEvent.blur(altitudeInput);
      await waitFor(() => {
        expect(within(altitudeField!).getByText('Burst altitude must be between 1,000 and 60,000 m')).toBeInTheDocument();
      });
      // Test valid value
      fireEvent.change(altitudeInput, { target: { value: '25000' } });
      fireEvent.blur(altitudeInput);
      await waitFor(() => {
        expect(within(altitudeField!).queryByText('Burst altitude must be between 1,000 and 60,000 m')).not.toBeInTheDocument();
      });
    });

    it('validates ascent rate input correctly', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );
      const ascentRateInput = screen.getByLabelText('Ascent Rate');
      const ascentRateField = ascentRateInput.closest('.MuiFormControl-root') as HTMLElement || ascentRateInput.parentElement as HTMLElement;
      // Test invalid value (too low)
      fireEvent.change(ascentRateInput, { target: { value: '0.5' } });
      fireEvent.blur(ascentRateInput);
      await waitFor(() => {
        expect(within(ascentRateField!).getByText('Ascent rate must be between 1 and 10 m/s')).toBeInTheDocument();
      });
      // Test invalid value (too high)
      fireEvent.change(ascentRateInput, { target: { value: '15' } });
      fireEvent.blur(ascentRateInput);
      await waitFor(() => {
        expect(within(ascentRateField!).getByText('Ascent rate must be between 1 and 10 m/s')).toBeInTheDocument();
      });
      // Test valid value
      fireEvent.change(ascentRateInput, { target: { value: '7.5' } });
      fireEvent.blur(ascentRateInput);
      await waitFor(() => {
        expect(within(ascentRateField!).queryByText('Ascent rate must be between 1 and 10 m/s')).not.toBeInTheDocument();
      });
    });

    it('validates payload weight input correctly', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );
      const payloadWeightInput = screen.getByLabelText('Payload Weight');
      const payloadWeightField = payloadWeightInput.closest('.MuiFormControl-root') as HTMLElement || payloadWeightInput.parentElement as HTMLElement;
      // Test invalid value (too low)
      fireEvent.change(payloadWeightInput, { target: { value: '0.05' } });
      fireEvent.blur(payloadWeightInput);
      await waitFor(() => {
        expect(within(payloadWeightField!).getByText('Payload weight must be between 0.1 and 50 kg')).toBeInTheDocument();
      });
      // Test invalid value (too high)
      fireEvent.change(payloadWeightInput, { target: { value: '75' } });
      fireEvent.blur(payloadWeightInput);
      await waitFor(() => {
        expect(within(payloadWeightField!).getByText('Payload weight must be between 0.1 and 50 kg')).toBeInTheDocument();
      });
      // Test valid value
      fireEvent.change(payloadWeightInput, { target: { value: '2.5' } });
      fireEvent.blur(payloadWeightInput);
      await waitFor(() => {
        expect(within(payloadWeightField!).queryByText('Payload weight must be between 0.1 and 50 kg')).not.toBeInTheDocument();
      });
    });

    it('validates drag coefficient input correctly', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );
      const dragCoefficientInput = screen.getByLabelText('Drag Coefficient');
      const dragCoefficientField = dragCoefficientInput.closest('.MuiFormControl-root') as HTMLElement || dragCoefficientInput.parentElement as HTMLElement;
      // Test invalid value (too low)
      fireEvent.change(dragCoefficientInput, { target: { value: '0.05' } });
      fireEvent.blur(dragCoefficientInput);
      await waitFor(() => {
        expect(within(dragCoefficientField!).getByText('Drag coefficient must be between 0.1 and 2.0')).toBeInTheDocument();
      });
      // Test invalid value (too high)
      fireEvent.change(dragCoefficientInput, { target: { value: '3.0' } });
      fireEvent.blur(dragCoefficientInput);
      await waitFor(() => {
        expect(within(dragCoefficientField!).getByText('Drag coefficient must be between 0.1 and 2.0')).toBeInTheDocument();
      });
      // Test valid value
      fireEvent.change(dragCoefficientInput, { target: { value: '0.8' } });
      fireEvent.blur(dragCoefficientInput);
      await waitFor(() => {
        expect(within(dragCoefficientField!).queryByText('Drag coefficient must be between 0.1 and 2.0')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('calls onChange when valid values are entered', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      const volumeInput = screen.getByLabelText('Initial Volume');
      fireEvent.change(volumeInput, { target: { value: '2.5' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultSpecifications,
        initialVolume: 2.5
      });
    });

    it('does not call onChange when invalid values are entered', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      const volumeInput = screen.getByLabelText('Initial Volume');
      fireEvent.change(volumeInput, { target: { value: '1500' } }); // Invalid value

      // Should not call onChange for invalid values
      expect(mockOnChange).not.toHaveBeenCalledWith(
        expect.objectContaining({ initialVolume: 1500 })
      );
    });
  });

  describe('Form Status', () => {
    it('shows valid configuration chip when all inputs are valid', () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Valid Configuration')).toBeInTheDocument();
    });

    it('shows invalid configuration chip when inputs are invalid', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      const volumeInput = screen.getByLabelText('Initial Volume');
      fireEvent.change(volumeInput, { target: { value: '0.05' } }); // Invalid value
      fireEvent.blur(volumeInput);

      await waitFor(() => {
        expect(screen.getByText('Invalid Configuration')).toBeInTheDocument();
      });
    });

    it('displays current configuration summary', () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Latex Meteorological • 1 m³ • 30000 m')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables all inputs when disabled prop is true', () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
            disabled={true}
          />
        </TestWrapper>
      );

      const volumeInput = screen.getByLabelText('Initial Volume');
      const altitudeInput = screen.getByLabelText('Burst Altitude');

      expect(volumeInput).toBeDisabled();
      expect(altitudeInput).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty input values gracefully', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      const volumeInput = screen.getByLabelText('Initial Volume');
      const volumeField = volumeInput.closest('.MuiFormControl-root') as HTMLElement || volumeInput.parentElement as HTMLElement;
      fireEvent.change(volumeInput, { target: { value: '' } });
      fireEvent.blur(volumeInput);

      // Should not crash and should show validation error (scoped)
      await waitFor(() => {
        expect(within(volumeField).getByText('Volume must be between 0.1 and 1000 m³')).toBeInTheDocument();
      });
    });

    it('handles decimal values correctly', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      const volumeInput = screen.getByLabelText('Initial Volume');
      fireEvent.change(volumeInput, { target: { value: '2.75' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultSpecifications,
        initialVolume: 2.75
      });
    });
  });

  describe('Performance', () => {
    it('renders quickly with typical inputs', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('validates inputs quickly', async () => {
      render(
        <TestWrapper>
          <BalloonSpecificationsInput
            specifications={defaultSpecifications}
            onSpecificationsChange={mockOnChange}
          />
        </TestWrapper>
      );

      const volumeInput = screen.getByLabelText('Initial Volume');
      const startTime = performance.now();
      
      fireEvent.change(volumeInput, { target: { value: '5.0' } });
      fireEvent.blur(volumeInput);
      
      const endTime = performance.now();
      const validationTime = endTime - startTime;
      
      // Should validate in less than 50ms
      expect(validationTime).toBeLessThan(50);
    });
  });
}); 