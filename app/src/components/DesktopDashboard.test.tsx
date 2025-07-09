import React from 'react';
import { render } from '@testing-library/react';
import DesktopDashboard from './DesktopDashboard';

test('renders DesktopDashboard component', () => {
  const { container } = render(<DesktopDashboard />);
  expect(container).toBeInTheDocument();
});
