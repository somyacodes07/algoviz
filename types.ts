export interface VariableMap {
  [key: string]: any;
}

export interface ConsoleLog {
  type: 'log' | 'info' | 'error' | 'warn';
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

export interface SpaceEstimate {
  notation: string;
  confidence: 'low' | 'medium' | 'high';
  rationale: string[];
}

export interface ComplexityAnalysis {
  estimate: ComplexityEstimate;
  spaceEstimate?: SpaceEstimate;
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

export type VisualizationEventType =
  | 'line'
  | 'write'
  | 'array-write'
  | 'grid-write'
  | 'swap'
  | 'pointer-move'
  | 'call'
  | 'return'
  | 'visit'
  | 'compare'
  | 'output';

/** A concrete, language-neutral action emitted alongside an execution snapshot. */
export interface VisualizationEvent {
  type: VisualizationEventType;
  line: number;
  variable?: string;
  index?: number;
  row?: number;
  column?: number;
  indices?: [number, number];
  before?: unknown;
  after?: unknown;
  expression?: string;
  result?: boolean;
  message?: string;
}

export interface ExecutionStep {
  line: number;
  variables: VariableMap;
  callStack: string[];
  consoleOutput: ConsoleLog[];
  events?: VisualizationEvent[];
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
  /** C++ Compiler Strategy override */
  cppCompiler?: 'api' | 'wasm';
}
