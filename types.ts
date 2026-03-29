export interface VariableMap {
  [key: string]: any;
}

export interface ConsoleLog {
  type: 'log' | 'error' | 'warn';
  message: string;
}

export interface ComplexityEstimate {
  notation: string;
  confidence: 'low' | 'medium' | 'high';
  rationale: string[];
}

export interface ComplexityHotspot {
  line: number;
  hits: number;
  share: number;
}

export interface ComplexityAnalysis {
  estimate: ComplexityEstimate;
  maxLoopDepth: number;
  recursiveFunctions: string[];
  hasLogarithmicLoop: boolean;
  hasBranchingRecursion: boolean;
  hasArraySort: boolean;
  observedOperations: number;
  uniqueExecutedLines: number;
  peakStackDepth: number;
  hotspots: ComplexityHotspot[];
}

export interface ExecutionStep {
  line: number;
  variables: VariableMap;
  callStack: string[];
  consoleOutput: ConsoleLog[];
  isError?: boolean;
  errorMessage?: string;
}

export type Timeline = ExecutionStep[];

/** Categorized error types for better UI feedback */
export type ErrorType = 'transpile' | 'instrument' | 'runtime' | 'timeout' | 'worker';

export interface ExecutionResult {
  timeline: Timeline;
  error?: string;
  errorType?: ErrorType;
  analysis?: ComplexityAnalysis | null;
}

export interface Breakpoint {
  line: number;
  enabled: boolean;
}

/** Configuration passed to the executor worker */
export interface ExecutionConfig {
  /** Maximum execution steps before infinite-loop detection (default: 2000) */
  maxSteps?: number;
  /** Maximum execution time in ms before timeout (default: 5000) */
  timeoutMs?: number;
  /** Input values for cin simulation */
  inputValues?: number[];
}
