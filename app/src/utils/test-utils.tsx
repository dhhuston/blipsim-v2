import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: any;
}

function customRender(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { theme: customTheme, ...renderOptions } = options;
  
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider theme={customTheme || theme}>
        {children}
      </ThemeProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
}

export * from '@testing-library/react';
export { customRender as render }; 