# Modern UI Technical Documentation

## Implementation Guidelines for BLIiPSim

This document provides detailed technical specifications and implementation guidelines for modern UI techniques and minimalist interface design in the BLIiPSim project.

## 1. Design System Implementation

### 1.1 Color System

```css
/* CSS Custom Properties for Design System */
:root {
  /* Primary Colors */
  --primary-blue: #2563eb;
  --primary-gray: #64748b;
  --accent-green: #10b981;
  --accent-orange: #f59e0b;
  --accent-red: #ef4444;
  
  /* Background Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  
  /* Text Colors */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  
  /* Border Colors */
  --border-light: #e2e8f0;
  --border-medium: #cbd5e1;
  --border-dark: #94a3b8;
}
```

### 1.2 Typography System

```css
/* Typography Scale */
:root {
  /* Font Families */
  --font-family-primary: 'Inter', system-ui, -apple-system, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 1.3 Spacing System

```css
/* Spacing Scale */
:root {
  --spacing-0: 0;
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1rem;     /* 16px */
  --spacing-5: 1.25rem;  /* 20px */
  --spacing-6: 1.5rem;   /* 24px */
  --spacing-8: 2rem;     /* 32px */
  --spacing-10: 2.5rem;  /* 40px */
  --spacing-12: 3rem;    /* 48px */
  --spacing-16: 4rem;    /* 64px */
  --spacing-20: 5rem;    /* 80px */
}
```

## 2. Component Architecture

### 2.1 Base Component Interface

```typescript
// Base component props interface
interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
  children?: React.ReactNode;
  id?: string;
}

// Accessibility props interface
interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  role?: string;
  tabIndex?: number;
}

// Form component props interface
interface FormComponentProps extends BaseComponentProps {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}
```

### 2.2 Button Component

```typescript
interface ButtonProps extends BaseComponentProps, AccessibilityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-blue text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-primary-gray text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-accent-red text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
};
```

### 2.3 Input Component

```typescript
interface InputProps extends FormComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value?: string | number;
  onChange?: (value: string | number) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  required,
  disabled,
  className,
  ...props
}) => {
  const inputId = useId();
  const errorId = useId();
  const helpId = useId();
  
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${className}
        `}
        aria-describedby={error ? errorId : helpText ? helpId : undefined}
        aria-invalid={error ? 'true' : 'false'}
        disabled={disabled}
        {...props}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};
```

## 3. Layout Components

### 3.1 Card Component

```typescript
interface CardProps extends BaseComponentProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

const Card: React.FC<CardProps> = ({
  padding = 'md',
  shadow = 'md',
  border = true,
  children,
  className,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };
  
  return (
    <div
      className={`
        bg-white rounded-lg
        ${border ? 'border border-gray-200' : ''}
        ${shadowClasses[shadow]}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
```

### 3.2 Grid Layout

```typescript
interface GridProps extends BaseComponentProps {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

const Grid: React.FC<GridProps> = ({
  cols = 1,
  gap = 'md',
  responsive = true,
  children,
  className,
  ...props
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };
  
  const responsiveClasses = responsive ? {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-6 md:grid-cols-8 lg:grid-cols-12'
  } : {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  };
  
  return (
    <div
      className={`
        grid ${responsiveClasses[cols]} ${gapClasses[gap]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
```

## 4. Animation and Micro-interactions

### 4.1 Animation Utilities

```css
/* Animation Keyframes */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Animation Classes */
.animate-fade-in {
  animation: fadeIn 300ms ease-out;
}

.animate-slide-in {
  animation: slideIn 300ms ease-out;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Transition Classes */
.transition-all {
  transition: all 200ms ease-out;
}

.transition-colors {
  transition: color 200ms ease-out, background-color 200ms ease-out;
}

.transition-transform {
  transition: transform 200ms ease-out;
}
```

### 4.2 Loading States

```typescript
interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  const colorClasses = {
    primary: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600'
  };
  
  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};
```

## 5. Responsive Design

### 5.1 Breakpoint System

```css
/* Breakpoint Variables */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Responsive Utilities */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

### 5.2 Mobile-First Components

```typescript
interface ResponsiveLayoutProps extends BaseComponentProps {
  sidebar?: React.ReactNode;
  main?: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  sidebar,
  main,
  sidebarCollapsed = false,
  onSidebarToggle,
  className,
  ...props
}) => {
  return (
    <div className={`flex h-screen bg-gray-50 ${className}`} {...props}>
      {/* Mobile Sidebar Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onSidebarToggle} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            {sidebar}
          </div>
        </div>
      )}
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        {sidebar}
      </div>
      
      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          {main}
        </main>
      </div>
    </div>
  );
};
```

## 6. Accessibility Implementation

### 6.1 Focus Management

```typescript
// Focus trap hook for modals
const useFocusTrap = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref]);
};
```

### 6.2 Screen Reader Support

```typescript
// Live region for announcements
const LiveRegion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
};

// Skip link for keyboard navigation
const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded"
    >
      Skip to main content
    </a>
  );
};
```

## 7. Performance Optimization

### 7.1 Component Memoization

```typescript
// Memoized component example
const ExpensiveChart = React.memo<ChartProps>(({ data, options }) => {
  // Expensive chart rendering logic
  return <Chart data={data} options={options} />;
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.data === nextProps.data && 
         JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options);
});
```

### 7.2 Lazy Loading

```typescript
// Lazy load heavy components
const HeavyMapComponent = React.lazy(() => import('./HeavyMapComponent'));

const MapContainer: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <HeavyMapComponent />
    </Suspense>
  );
};
```

## 8. Testing Guidelines

### 8.1 Component Testing

```typescript
// Example test for Button component
describe('Button', () => {
  it('renders with correct variant styles', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-blue');
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is accessible', () => {
    render(<Button aria-label="Submit form">Submit</Button>);
    const button = screen.getByRole('button', { name: /submit form/i });
    expect(button).toBeInTheDocument();
  });
});
```

### 8.2 Accessibility Testing

```typescript
// Accessibility test utilities
const testAccessibility = (Component: React.ComponentType<any>, props = {}) => {
  it('meets accessibility standards', () => {
    const { container } = render(<Component {...props} />);
    expect(container).toBeAccessible();
  });
};
```

This technical documentation provides comprehensive implementation guidelines for modern UI techniques in the BLIiPSim project. The focus is on creating accessible, performant, and maintainable components that follow modern design principles. 