import { Timeline, ExecutionConfig, ErrorType, ComplexityAnalysis } from '../../../types';
import { analyzeComplexity } from '../../analysis/complexity';

// We use Vite's ?worker feature to correctly bundle the worker and resolve its URL
import ExecutorWorker from './executor.worker?worker';

/** Default execution timeout (ms) */
const DEFAULT_TIMEOUT_MS = 5000;

export interface ExecuteResult {
  timeline: Timeline;
  errorType?: ErrorType;
  analysis?: ComplexityAnalysis | null;
}

/**
 * Execute user code in an isolated environment.
 *
 * For C++:
 *   1. Primary: Wandbox API (real GCC compilation via source instrumentation)
 *   2. Fallback: Local transpiler (C++ → JS) in Web Worker if Wandbox is unreachable
 *
 * For JS/Python:
 *   - Always uses the local Web Worker with AST instrumentation.
 */
export const executeCode = async (
  userCode: string,
  language: string = 'javascript',
  config?: ExecutionConfig,
): Promise<ExecuteResult> => {
  const timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // ── C++ Execution ──
  if (language === 'cpp' || language === 'c++') {
    return executeCpp(userCode, config, timeoutMs);
  }

  // ── Browser Web Worker (JS / Python) ──
  return executeInWorker(userCode, language, config, timeoutMs);
};

/**
 * C++ execution strategy:
 *  1. Try Wandbox API (real GCC, full STL support)
 *  2. On network failure → fall back to the local C++→JS transpiler in a Web Worker
 *  3. On compiler error → show the error to the user (don't fallback)
 */
async function executeCpp(
  userCode: string,
  config: ExecutionConfig | undefined,
  timeoutMs: number,
): Promise<ExecuteResult> {
  try {
    const { executeWandboxCpp } = await import('./wandboxExecutor');
    const result = await executeWandboxCpp(userCode, config);

    // ── Network / API error → fall back to local transpiler ──
    if (result.networkError) {
      console.warn(
        `[Executor] Wandbox unavailable (${result.networkError}), falling back to local transpiler.`,
      );
      return executeInWorker(userCode, 'cpp', config, timeoutMs);
    }

    // ── Compiler error → show to user, don't fallback ──
    if (result.compilerError) {
      return {
        timeline: [
          {
            line: 0,
            variables: {},
            callStack: ['main'],
            consoleOutput: [{ type: 'error', message: result.compilerError }],
            isError: true,
            errorMessage: result.compilerError,
          },
        ],
        errorType: 'runtime',
        analysis: null,
      };
    }

    // ── Success: run complexity analysis on the original C++ code + timeline ──
    const analysis = analyzeComplexity(userCode, result.timeline);
    return {
      timeline: result.timeline,
      analysis,
    };
  } catch (e: any) {
    // Unexpected error → fall back to local transpiler
    console.warn('[Executor] Unexpected Wandbox error, falling back:', e.message);
    return executeInWorker(userCode, 'cpp', config, timeoutMs);
  }
}

/**
 * Execute code inside a sandboxed Web Worker.
 * Used for JS/Python directly, and as the C++ fallback (transpiler path).
 */
function executeInWorker(
  userCode: string,
  language: string,
  config: ExecutionConfig | undefined,
  timeoutMs: number,
): Promise<ExecuteResult> {
  return new Promise((resolve) => {
    const worker = new ExecutorWorker();
    let settled = false;

    // ── Timeout guard ──
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve({
        timeline: [
          {
            line: 0,
            variables: {},
            callStack: ['main'],
            consoleOutput: [
              {
                type: 'error',
                message: `Execution timed out after ${timeoutMs / 1000}s. Possible infinite loop or heavy computation.`,
              },
            ],
            isError: true,
            errorMessage: `Execution timed out after ${timeoutMs / 1000}s.`,
          },
        ],
        errorType: 'timeout',
      });
    }, timeoutMs);

    // ── Worker response ──
    worker.onmessage = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();

      const { type, timeline, errorType, analysis } = e.data;
      resolve({
        timeline: timeline || [],
        errorType: type === 'error' ? errorType || 'runtime' : undefined,
        analysis: analysis || null,
      });
    };

    // ── Worker crash ──
    worker.onerror = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve({
        timeline: [
          {
            line: 0,
            variables: {},
            callStack: ['main'],
            consoleOutput: [{ type: 'error', message: `Worker crashed: ${e.message}` }],
            isError: true,
            errorMessage: e.message,
          },
        ],
        errorType: 'worker',
        analysis: null,
      });
    };

    // ── Send payload ──
    worker.postMessage({
      userCode,
      language,
      config: {
        maxSteps: config?.maxSteps,
        inputValues: config?.inputValues,
      },
    });
  });
}
