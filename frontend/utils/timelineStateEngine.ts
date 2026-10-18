import { Timeline, ExecutionStep, VariableMap, ConsoleLog, VisualizationEvent } from '../../types';

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

const POINTER_VARIABLES = new Set(['i', 'j', 'k', 'left', 'right', 'low', 'high', 'lo', 'hi', 'mid', 'current', 'curr', 'index', 'row', 'col', 'r', 'c', 'x', 'y']);
const MAX_EVENTS_PER_STEP = 80;
const MAX_DIFFED_ELEMENTS = 4096;

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function deriveVisualizationEvents(
  current: ExecutionStep,
  previous: ExecutionStep | undefined,
  previousVariables: VariableMap | null,
): VisualizationEvent[] {
  const events: VisualizationEvent[] = [...(current.events || [])];
  if (!events.some((event) => event.type === 'line')) events.unshift({ type: 'line', line: current.line });

  const before = previousVariables || {};
  const after = current.variables || {};
  if (previousVariables) {
    for (const variable of Object.keys(after)) {
      if (Object.is(before[variable], after[variable])) continue;
      if (events.some((event) => event.variable === variable && ['write', 'array-write', 'grid-write', 'swap', 'visit', 'pointer-move'].includes(event.type))) continue;
      const oldValue = before[variable];
      const newValue = after[variable];
      if (Array.isArray(oldValue) && Array.isArray(newValue) && oldValue.length <= MAX_DIFFED_ELEMENTS && newValue.length <= MAX_DIFFED_ELEMENTS && oldValue.every(Array.isArray) && newValue.every(Array.isArray)) {
        const matrixCellCount = newValue.reduce((total, row) => total + (Array.isArray(row) ? row.length : 0), 0);
        if (matrixCellCount > MAX_DIFFED_ELEMENTS) {
          events.push({
            type: 'write',
            line: current.line,
            variable,
            before: `Matrix(${oldValue.length}×${(oldValue[0] as unknown[] | undefined)?.length || 0})`,
            after: `Matrix(${newValue.length}×${(newValue[0] as unknown[] | undefined)?.length || 0})`,
          });
          continue;
        }
        for (let row = 0; row < newValue.length && events.length < MAX_EVENTS_PER_STEP; row++) {
          const oldRow = oldValue[row] as unknown[];
          const newRow = newValue[row] as unknown[];
          for (let column = 0; column < newRow.length && events.length < MAX_EVENTS_PER_STEP; column++) {
            if (!valuesEqual(oldRow?.[column], newRow[column])) {
              events.push({ type: /visited|seen|closed/i.test(variable) ? 'visit' : 'grid-write', line: current.line, variable, row, column, before: oldRow?.[column], after: newRow[column] });
            }
          }
        }
      } else if (Array.isArray(oldValue) && Array.isArray(newValue) && oldValue.length === newValue.length) {
        if (oldValue.length > MAX_DIFFED_ELEMENTS) {
          events.push({ type: 'write', line: current.line, variable, before: `Array(${oldValue.length})`, after: `Array(${newValue.length})` });
          continue;
        }
        const changed: number[] = [];
        for (let index = 0; index < newValue.length; index++) {
          if (!valuesEqual(oldValue[index], newValue[index])) changed.push(index);
        }
        if (changed.length === 2 && valuesEqual(oldValue[changed[0]], newValue[changed[1]]) && valuesEqual(oldValue[changed[1]], newValue[changed[0]])) {
          events.push({ type: 'swap', line: current.line, variable, indices: [changed[0], changed[1]], before: [oldValue[changed[0]], oldValue[changed[1]]], after: [newValue[changed[0]], newValue[changed[1]]] });
        } else {
          for (const index of changed.slice(0, MAX_EVENTS_PER_STEP)) {
            events.push({ type: /visited|seen|closed/i.test(variable) ? 'visit' : 'array-write', line: current.line, variable, index, before: oldValue[index], after: newValue[index] });
          }
        }
      } else if (POINTER_VARIABLES.has(variable.toLowerCase()) && Number.isFinite(oldValue) && Number.isFinite(newValue)) {
        events.push({ type: 'pointer-move', line: current.line, variable, before: oldValue, after: newValue });
      } else if (variable in before) {
        events.push({ type: /visited|seen|closed/i.test(variable) ? 'visit' : 'write', line: current.line, variable, before: oldValue, after: newValue });
      } else {
        events.push({ type: 'write', line: current.line, variable, after: newValue });
      }
    }
  }

  const oldStack = previous?.callStack || [];
  const newStack = current.callStack || [];
  if (!events.some((event) => event.type === 'call' || event.type === 'return') && newStack.length > oldStack.length) {
    events.push({ type: 'call', line: current.line, variable: newStack[newStack.length - 1], before: oldStack.length, after: newStack.length });
  } else if (!events.some((event) => event.type === 'call' || event.type === 'return') && newStack.length < oldStack.length) {
    events.push({ type: 'return', line: current.line, variable: oldStack[oldStack.length - 1], before: oldStack.length, after: newStack.length });
  }

  for (const log of current.consoleOutput || []) {
    events.push({ type: 'output', line: current.line, message: log.message });
  }

  return events.length > MAX_EVENTS_PER_STEP
    ? [...events.slice(0, MAX_EVENTS_PER_STEP - 1), { type: 'write', line: current.line, message: 'Additional state changes were grouped for performance.' }]
    : events;
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
      events: deriveVisualizationEvents({ ...rawStep, variables: optimizedVars, consoleOutput: rawStep.consoleOutput || [] }, processedSteps[i - 1], prevStepVars),
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
