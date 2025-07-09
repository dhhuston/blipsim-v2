import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders balloon trajectory prediction app without crashing', () => {
  render(<App />);
  // Check that a unique element exists to confirm the app rendered
  const searchInput = screen.getByPlaceholderText(/Enter city, address, landmark, or airport/i);
  expect(searchInput).toBeInTheDocument();
});
