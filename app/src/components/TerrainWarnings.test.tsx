import React from 'react';
import { render } from '@testing-library/react';
import TerrainWarnings from './TerrainWarnings';

test('renders TerrainWarnings component', () => {
  const { container } = render(<TerrainWarnings />);
  expect(container).toBeInTheDocument();
});
