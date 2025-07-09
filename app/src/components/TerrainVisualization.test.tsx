import React from 'react';
import { render } from '@testing-library/react';
import TerrainVisualization from './TerrainVisualization';

test('renders TerrainVisualization component', () => {
  const { container } = render(<TerrainVisualization />);
  expect(container).toBeInTheDocument();
});
