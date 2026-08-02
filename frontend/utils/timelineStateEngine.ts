import { Timeline, ExecutionStep, VariableMap, ConsoleLog } from '../../types';

/**
 * Structural Sharing & State Differential Engine for Time-Travel Debugging.
 *
 * Optimizes memory consumption during long loop/recursion execution runs (5,000+ steps)
 * by sharing identical variable object references across steps and maintaining keyframe indexes.
 */

export interface OptimizedTimeline {
  steps: ExecutionStep[];
  keyframes: number[]; // Step indices stored at keyframe intervals (e.g. every 10 steps)
  memorySavingsPercent: number;
}

/**
 * Deep structural comparison check to determine if two values share identical structure.
 */
function isStructurallyEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isStructurallyEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (Array.isArray(a) || Array.isArray(b)) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!isStructurallyEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Apply structural sharing to a step's variable map against the previous step's variable map.
 */
export function applyStructuralSharing(
  currentVars: VariableMap,
  previousVars: VariableMap | null,
): VariableMap {
  if (!previousVars) return currentVars;

  const sharedVars: VariableMap = {};
  let totalObjects = 0;
  let reusedObjects = 0;

  for (const [key, val] of Object.entries(currentVars)) {
    if (val !== null && typeof val === 'object') {
      totalObjects++;
      if (previousVars[key] !== undefined && isStructurallyEqual(val, previousVars[key])) {
        // Reuse reference from previous step to enable JS engine pointer sharing
        sharedVars[key] = previousVars[key];
        reusedObjects++;
      } else {
        sharedVars[key] = val;
      }
    } else {
      sharedVars[key] = val;
    }
  }

  return sharedVars;
}

/**
 * Process a raw execution timeline to inject structural sharing and calculate keyframe indexes.
 */
export function processTimelineDiffEngine(rawTimeline: Timeline): OptimizedTimeline {
  if (!rawTimeline || rawTimeline.length === 0) {
    return { steps: [], keyframes: [], memorySavingsPercent: 0 };
  }

  const keyframes: number[] = [];
  const processedSteps: ExecutionStep[] = [];
  const KEYFRAME_INTERVAL = 10;

  let currentLogs: ConsoleLog[] = [];
  let prevStepVars: VariableMap | null = null;
  let reusedCount = 0;
  let totalCount = 0;

  for (let i = 0; i < rawTimeline.length; i++) {
    const rawStep = rawTimeline[i];

    // Reconstruct cumulative console logs
    currentLogs = [...currentLogs, ...(rawStep.consoleOutput || [])];

    // Apply structural sharing to variables map
    const optimizedVars = applyStructuralSharing(rawStep.variables || {}, prevStepVars);

    // Track reuse statistics
    for (const val of Object.values(optimizedVars)) {
      if (val !== null && typeof val === 'object') {
        totalCount++;
        if (prevStepVars && prevStepVars[val as any] === val) {
          reusedCount++;
        }
      }
    }

    const processedStep: ExecutionStep = {
      ...rawStep,
      variables: optimizedVars,
      consoleOutput: currentLogs,
    };

    processedSteps.push(processedStep);
    prevStepVars = optimizedVars;

    // Record keyframe index for fast scrubbing
    if (i % KEYFRAME_INTERVAL === 0 || i === rawTimeline.length - 1) {
      keyframes.push(i);
    }
  }

  const savingsPercent = totalCount > 0 ? Math.round((reusedCount / totalCount) * 100) : 0;

  return {
    steps: processedSteps,
    keyframes,
    memorySavingsPercent: savingsPercent,
  };
}
