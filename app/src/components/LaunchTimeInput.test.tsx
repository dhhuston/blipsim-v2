import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LaunchTimeInput, { LaunchTimeInputProps, LaunchSchedule } from './LaunchTimeInput';
import { format, addDays } from 'date-fns';

// Mock date-fns-tz
jest.mock('date-fns-tz', () => ({
  utcToZonedTime: jest.fn((date) => date),
  zonedTimeToUtc: jest.fn((date) => date)
}));

describe('LaunchTimeInput', () => {
  const mockOnChange = jest.fn();
  const mockLaunchLocation = { lat: 40.7128, lng: -74.0060, alt: 10 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<LaunchTimeInput />);
    expect(screen.getByRole('heading', { name: /Launch Time and Scheduling/i })).toBeInTheDocument();
  });

  it('renders date and time input fields', () => {
    render(<LaunchTimeInput />);
    expect(screen.getByLabelText(/Launch Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Launch Time/i)).toBeInTheDocument();
  });

  it('renders timezone selector', () => {
    render(<LaunchTimeInput />);
    expect(screen.getByLabelText(/Timezone/i)).toBeInTheDocument();
  });

  it('initializes with default values', () => {
    render(<LaunchTimeInput />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i) as HTMLInputElement;
    const timeInput = screen.getByLabelText(/Launch Time/i) as HTMLInputElement;
    
    // Should default to tomorrow
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    expect(dateInput.value).toBe(tomorrow);
  });

  it('handles date input changes', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    const newDate = format(addDays(new Date(), 2), 'yyyy-MM-dd');
    
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, newDate);
    
    expect(dateInput).toHaveValue(newDate);
  });

  it('handles time input changes', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const timeInput = screen.getByLabelText(/Launch Time/i);
    
    await userEvent.clear(timeInput);
    await userEvent.type(timeInput, '14:30');
    
    expect(timeInput).toHaveValue('14:30');
  });

  it('handles timezone selection', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const timezoneSelect = screen.getByLabelText(/Timezone/i);
    await userEvent.click(timezoneSelect);
    
    // Should show timezone options
    expect(screen.getByText(/Eastern Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Pacific Time/i)).toBeInTheDocument();
  });

  it('auto-detects timezone from launch location', () => {
    render(<LaunchTimeInput launchLocation={mockLaunchLocation} />);
    
    // Should detect timezone based on coordinates - component shows UTC offset
    expect(screen.getByDisplayValue(/UTC/)).toBeInTheDocument();
  });

  it('shows weather quality indicator', () => {
    render(<LaunchTimeInput />);
    
    expect(screen.getByText(/Weather Forecast Quality:/i)).toBeInTheDocument();
    expect(screen.getByText(/High quality weather forecast available/i)).toBeInTheDocument();
  });

  it('validates past launch times', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');
    
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, yesterday);
    
    expect(screen.getByText(/Launch time cannot be in the past/i)).toBeInTheDocument();
  });

  it('validates future launch times too far in advance', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    const farFuture = format(addDays(new Date(), 31), 'yyyy-MM-dd');
    
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, farFuture);
    
    expect(screen.getByText(/Launch time cannot be more than 30 days in the future/i)).toBeInTheDocument();
  });

  it('calls onChange with valid schedule', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    const timeInput = screen.getByLabelText(/Launch Time/i);
    
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, tomorrow);
    
    await userEvent.clear(timeInput);
    await userEvent.type(timeInput, '14:30');
    
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      date: tomorrow,
      time: '14:30',
      timezone: 'UTC',
      weatherQuality: 'high'
    }));
  });

  it('initializes with provided value', () => {
    const initialValue: LaunchSchedule = {
      date: '2024-01-15',
      time: '14:30',
      timezone: 'America/New_York',
      utcDateTime: '2024-01-15T19:30:00.000Z',
      weatherQuality: 'high'
    };
    
    render(<LaunchTimeInput value={initialValue} />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i) as HTMLInputElement;
    const timeInput = screen.getByLabelText(/Launch Time/i) as HTMLInputElement;
    
    expect(dateInput.value).toBe('2024-01-15');
    expect(timeInput.value).toBe('14:30');
    // Robust: check the combobox text content
    const timezoneCombobox = screen.getByRole('combobox', { name: /Timezone/i });
    expect(timezoneCombobox).toHaveTextContent('Eastern Time (ET)');
  });

  it('shows UTC time display when date is selected', async () => {
    render(<LaunchTimeInput />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    const timeInput = screen.getByLabelText(/Launch Time/i);
    
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, tomorrow);
    
    await userEvent.clear(timeInput);
    await userEvent.type(timeInput, '14:30');
    
    expect(screen.getByText(/UTC Time:/i)).toBeInTheDocument();
  });

  it('shows different weather quality messages based on time', async () => {
    render(<LaunchTimeInput />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    
    // Test medium quality (3-7 days)
    const mediumDate = format(addDays(new Date(), 5), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, mediumDate);
    
    expect(screen.getByText(/Medium quality weather forecast available/i)).toBeInTheDocument();
  });

  it('shows low quality for far future dates', async () => {
    render(<LaunchTimeInput />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    
    // Test low quality (beyond 7 days)
    const lowDate = format(addDays(new Date(), 10), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, lowDate);
    
    expect(screen.getByText(/Low quality weather forecast - consider launching sooner/i)).toBeInTheDocument();
  });

  it('shows unavailable for past dates', async () => {
    render(<LaunchTimeInput />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    
    // Test past date
    const pastDate = format(addDays(new Date(), -1), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, pastDate);
    
    expect(screen.getByText(/Weather data unavailable for selected time/i)).toBeInTheDocument();
  });

  it('handles empty date gracefully', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    
    await userEvent.clear(dateInput);
    
    // Should not crash and should show validation error
    expect(screen.getByText(/Please select a launch date and time/i)).toBeInTheDocument();
  });

  it('handles empty time gracefully', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const timeInput = screen.getByLabelText(/Launch Time/i);
    
    await userEvent.clear(timeInput);
    
    // Should not crash
    expect(timeInput).toBeInTheDocument();
  });

  it('updates weather quality when time changes', async () => {
    render(<LaunchTimeInput />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    const timeInput = screen.getByLabelText(/Launch Time/i);
    
    // Set to tomorrow (high quality)
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, tomorrow);
    
    expect(screen.getByText(/High quality weather forecast available/i)).toBeInTheDocument();
    
    // Change to far future (low quality)
    const farFuture = format(addDays(new Date(), 10), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, farFuture);
    
    expect(screen.getByText(/Low quality weather forecast - consider launching sooner/i)).toBeInTheDocument();
  });

  it('maintains timezone selection when date changes', async () => {
    render(<LaunchTimeInput />);
    
    const timezoneCombobox = screen.getByRole('combobox', { name: /Timezone/i });
    await userEvent.click(timezoneCombobox);
    // Use getByRole for the menu item
    const easternOption = screen.getByRole('option', { name: /Eastern Time/i });
    await userEvent.click(easternOption);
    // Verify timezone is selected by checking the combobox text content
    expect(timezoneCombobox).toHaveTextContent('Eastern Time (ET)');
    // Change date
    const dateInput = screen.getByLabelText(/Launch Date/i);
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, tomorrow);
    // Timezone should still be selected
    expect(timezoneCombobox).toHaveTextContent('Eastern Time (ET)');
  });

  it('shows error for invalid date format', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    
    // Try to enter invalid date
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, 'invalid-date');
    
    // Should show validation error
    expect(screen.getByText(/Please select a launch date and time/i)).toBeInTheDocument();
  });

  it('prevents selecting dates before today', () => {
    render(<LaunchTimeInput />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i) as HTMLInputElement;
    
    // Check that min attribute is set to today
    const today = format(new Date(), 'yyyy-MM-dd');
    expect(dateInput.min).toBe(today);
  });

  it('handles timezone change correctly', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    const timezoneCombobox = screen.getByRole('combobox', { name: /Timezone/i });
    await userEvent.click(timezoneCombobox);
    // Use getByRole for the menu item
    const pacificOption = screen.getByRole('option', { name: /Pacific Time/i });
    await userEvent.click(pacificOption);
    // Verify timezone is selected by checking the combobox text content
    expect(timezoneCombobox).toHaveTextContent('Pacific Time (PT)');
    // Should call onChange with updated timezone
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      timezone: 'America/Los_Angeles'
    }));
  });

  it('displays instructions text', () => {
    render(<LaunchTimeInput />);
    
    expect(screen.getByText(/Set your launch date and time/i)).toBeInTheDocument();
    expect(screen.getByText(/automatically detect your timezone/i)).toBeInTheDocument();
  });

  it('handles multiple validation errors', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    
    // Set to past date
    const pastDate = format(addDays(new Date(), -1), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, pastDate);
    
    // Should show past date error
    expect(screen.getByText(/Launch time cannot be in the past/i)).toBeInTheDocument();
  });

  it('clears errors when valid date is selected', async () => {
    render(<LaunchTimeInput onChange={mockOnChange} />);
    
    const dateInput = screen.getByLabelText(/Launch Date/i);
    
    // First set invalid date
    const pastDate = format(addDays(new Date(), -1), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, pastDate);
    
    expect(screen.getByText(/Launch time cannot be in the past/i)).toBeInTheDocument();
    
    // Then set valid date
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, tomorrow);
    
    // Error should be cleared
    expect(screen.queryByText(/Launch time cannot be in the past/i)).not.toBeInTheDocument();
  });
}); 