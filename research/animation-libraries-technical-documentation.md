# Animation Libraries Technical Documentation

## Overview

This document provides technical specifications, implementation details, and reference materials for animation libraries and techniques in the BLIiPSim project.

## Library Specifications

### Framer Motion

#### Installation
```bash
npm install framer-motion
```

#### Basic Usage
```typescript
import { motion } from 'framer-motion';

// Simple animation
<motion.div
  animate={{ opacity: 1, y: 0 }}
  initial={{ opacity: 0, y: 20 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

#### Advanced Features
```typescript
// Gesture support
<motion.div
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  drag
  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
>
  Draggable content
</motion.div>

// Layout animations
<motion.div layout>
  <motion.div layoutId="unique-id">
    Animated layout
  </motion.div>
</motion.div>
```

#### Performance Optimizations
```typescript
// Use transform instead of layout properties
<motion.div
  animate={{ x: 100, y: 100 }}
  style={{ willChange: 'transform' }}
>
  Optimized animation
</motion.div>

// Lazy load heavy animations
const HeavyAnimation = lazy(() => import('./HeavyAnimation'));
```

### React Spring

#### Installation
```bash
npm install @react-spring/web
```

#### Basic Usage
```typescript
import { useSpring, animated } from '@react-spring/web';

function AnimatedComponent() {
  const [springs, api] = useSpring(() => ({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
  }));

  return <animated.div style={springs}>Content</animated.div>;
}
```

#### Physics-based Animations
```typescript
import { useSpring, animated } from '@react-spring/web';

function PhysicsAnimation() {
  const [springs, api] = useSpring(() => ({
    from: { scale: 0 },
    to: { scale: 1 },
    config: {
      tension: 300,
      friction: 20,
    },
  }));

  return <animated.div style={springs}>Physics content</animated.div>;
}
```

### React Transition Group

#### Installation
```bash
npm install react-transition-group
```

#### Basic Usage
```typescript
import { CSSTransition } from 'react-transition-group';

function TransitionComponent() {
  const [inProp, setInProp] = useState(false);

  return (
    <CSSTransition
      in={inProp}
      timeout={300}
      classNames="fade"
      unmountOnExit
    >
      <div>Transitioning content</div>
    </CSSTransition>
  );
}
```

#### CSS Classes
```css
.fade-enter {
  opacity: 0;
}

.fade-enter-active {
  opacity: 1;
  transition: opacity 300ms ease-in;
}

.fade-exit {
  opacity: 1;
}

.fade-exit-active {
  opacity: 0;
  transition: opacity 300ms ease-out;
}
```

## Animation Design System

### Timing Functions

#### Standard Easing
```css
/* Standard */
cubic-bezier(0.4, 0, 0.2, 1)

/* Enter */
cubic-bezier(0, 0, 0.2, 1)

/* Exit */
cubic-bezier(0.4, 0, 1, 1)

/* Bounce */
cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

#### Duration Standards
```typescript
const durations = {
  micro: 150,
  fast: 300,
  standard: 500,
  slow: 800,
  loading: 1000,
};
```

### Animation Variants

#### Framer Motion Variants
```typescript
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};
```

#### React Spring Configurations
```typescript
const springConfigs = {
  gentle: { tension: 170, friction: 26 },
  standard: { tension: 300, friction: 20 },
  bouncy: { tension: 400, friction: 10 },
  slow: { tension: 100, friction: 30 },
};
```

## Performance Optimization

### GPU Acceleration
```typescript
// Good - GPU accelerated
<motion.div animate={{ x: 100, y: 100, opacity: 0.5 }} />

// Bad - CPU intensive
<motion.div animate={{ width: '200px', height: '200px' }} />
```

### Memory Management
```typescript
import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

function AnimatedComponent() {
  const controls = useAnimation();

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      controls.stop();
    };
  }, [controls]);

  return <motion.div animate={controls}>Content</motion.div>;
}
```

### Bundle Optimization
```typescript
// Tree-shake unused features
import { motion } from 'framer-motion';
// Only import what you need
import { AnimatePresence } from 'framer-motion';

// Lazy load heavy animations
const HeavyAnimation = lazy(() => import('./HeavyAnimation'));
```

## Accessibility Implementation

### Reduced Motion Support
```typescript
import { useReducedMotion } from 'framer-motion';

function AccessibleAnimation() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { x: 100 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
    >
      Accessible content
    </motion.div>
  );
}
```

### Focus Management
```typescript
import { useEffect, useRef } from 'react';

function FocusableAnimation() {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Restore focus after animation
    const element = elementRef.current;
    if (element) {
      element.focus();
    }
  }, []);

  return (
    <motion.div
      ref={elementRef}
      tabIndex={0}
      whileFocus={{ scale: 1.05 }}
    >
      Focusable content
    </motion.div>
  );
}
```

### Screen Reader Support
```typescript
import { motion } from 'framer-motion';

function ScreenReaderAnimation() {
  return (
    <motion.div
      aria-live="polite"
      aria-label="Loading animation"
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      Loading...
    </motion.div>
  );
}
```

## Browser Compatibility

### Feature Detection
```typescript
// Check for Web Animations API support
const supportsWebAnimations = 'animate' in Element.prototype;

// Check for Intersection Observer support
const supportsIntersectionObserver = 'IntersectionObserver' in window;

// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### Fallback Strategies
```typescript
// CSS fallback for JavaScript animations
const useAnimationFallback = () => {
  const [supportsJS, setSupportsJS] = useState(true);

  useEffect(() => {
    // Test for JavaScript animation support
    const testAnimation = () => {
      try {
        const element = document.createElement('div');
        element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1 });
        setSupportsJS(true);
      } catch {
        setSupportsJS(false);
      }
    };

    testAnimation();
  }, []);

  return supportsJS;
};
```

## Testing Strategies

### Unit Testing
```typescript
import { render, screen } from '@testing-library/react';
import { motion } from 'framer-motion';

test('animation renders correctly', () => {
  render(
    <motion.div
      data-testid="animated-element"
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
    >
      Content
    </motion.div>
  );

  expect(screen.getByTestId('animated-element')).toBeInTheDocument();
});
```

### Integration Testing
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react';

test('animation triggers on interaction', async () => {
  const { getByTestId } = render(<AnimatedComponent />);
  
  const element = getByTestId('animated-element');
  fireEvent.click(element);

  await waitFor(() => {
    expect(element).toHaveStyle('transform: scale(0.95)');
  });
});
```

### Performance Testing
```typescript
// Measure animation performance
const measureAnimationPerformance = (callback: () => void) => {
  const start = performance.now();
  callback();
  const end = performance.now();
  
  return end - start;
};

// Test animation frame rate
const testFrameRate = (animation: () => void) => {
  let frameCount = 0;
  const startTime = performance.now();
  
  const measureFrame = () => {
    frameCount++;
    if (performance.now() - startTime < 1000) {
      requestAnimationFrame(measureFrame);
    } else {
      console.log(`Frame rate: ${frameCount} FPS`);
    }
  };
  
  requestAnimationFrame(measureFrame);
};
```

## Error Handling

### Animation Error Boundaries
```typescript
import React from 'react';

class AnimationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Animation error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Animation failed to load</div>;
    }

    return this.props.children;
  }
}
```

### Fallback Animations
```typescript
const useAnimationFallback = (primaryAnimation: any, fallbackAnimation: any) => {
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    try {
      // Test if primary animation works
      const testElement = document.createElement('div');
      testElement.animate(primaryAnimation, { duration: 1 });
      setUseFallback(false);
    } catch {
      setUseFallback(true);
    }
  }, [primaryAnimation]);

  return useFallback ? fallbackAnimation : primaryAnimation;
};
```

## Monitoring and Analytics

### Performance Monitoring
```typescript
// Track animation performance
const trackAnimationPerformance = (animationName: string, duration: number) => {
  // Send to analytics
  analytics.track('animation_performance', {
    name: animationName,
    duration,
    timestamp: Date.now(),
  });
};

// Monitor frame rate
const monitorFrameRate = () => {
  let frameCount = 0;
  let lastTime = performance.now();

  const countFrames = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      
      if (fps < 30) {
        console.warn('Low frame rate detected:', fps);
      }
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(countFrames);
  };

  requestAnimationFrame(countFrames);
};
```

### User Experience Tracking
```typescript
// Track animation interactions
const trackAnimationInteraction = (interaction: string) => {
  analytics.track('animation_interaction', {
    interaction,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  });
};

// Track accessibility preferences
const trackAccessibilityPreference = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  analytics.track('accessibility_preference', {
    reducedMotion: prefersReducedMotion,
    timestamp: Date.now(),
  });
};
```

## References

### Documentation
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Spring Documentation](https://react-spring.dev/)
- [React Transition Group](https://reactcommunity.org/react-transition-group/)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)

### Performance Resources
- [Web.dev Animation Guide](https://web.dev/animations-guide/)
- [CSS Animation Performance](https://developers.google.com/web/fundamentals/design-and-ux/animations)
- [JavaScript Animation Performance](https://developers.google.com/web/fundamentals/design-and-ux/animations/javascript-vs-css)

### Accessibility Resources
- [WCAG 2.1 Animation Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions)
- [Reduced Motion Media Query](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Animation Accessibility](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)

### Testing Resources
- [Jest Animation Testing](https://jestjs.io/docs/testing-frameworks)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Performance Testing](https://web.dev/performance-testing/) 