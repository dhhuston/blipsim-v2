// Prediction algorithm types for balloon trajectory calculation
// Based on task-11a specifications

// Re-export types from ascent algorithm for convenience
export type { AscentInput, TrajectoryPoint, AscentResult } from '../algorithms/ascent';

// Re-export types from descent algorithm for convenience
export type { 
  DescentInput, 
  DescentResult, 
  DescentTrajectoryPoint,
  calculateDescent,
  predictLandingSite,
  calculateTerminalVelocity,
  calculateDragForce,
  calculateDescentNetForce,
  calculateDescentVelocity,
  validateDescentInput,
  estimateDescentTime
} from '../algorithms/descent';

// Re-export types from wind drift algorithm for convenience
export type { 
  WindDriftInput, 
  WindDriftResult, 
  WindDriftPoint,
  WindUncertainty,
  MonteCarloResult,
  WindDataPoint
} from '../algorithms/windDrift';

// Re-export types from burst site algorithm for convenience
export type { 
  BurstSiteInput, 
  BurstSiteResult, 
  BurstTrajectoryPoint
} from '../algorithms/burstSite';

// Re-export balloon specification types for convenience
export type { BalloonSpecifications } from './UserInputs';
export type { 
  BalloonSpecificationsInputProps,
  BalloonTypeOption
} from '../components/BalloonSpecificationsInput'; 