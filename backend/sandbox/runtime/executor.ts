import { Timeline, ExecutionConfig, ErrorType, ComplexityAnalysis } from '../../../types';
import { analyzeComplexity } from '../../analysis/complexity';

// We use Vite's ?worker feature to correctly bundle the worker and resolve its URL
import ExecutorWorker from './executor.worker?worker&inline';

/** Default execution timeout (ms) */
const DEFAULT_TIMEOUT_MS = 5000;

export interface ExecuteResult {
  timeline: Timeline;
  errorType?: ErrorType;
  analysis?: ComplexityAnalysis | null;
}

const executionCache = new Map<string, ExecuteResult>();
const MAX_CACHE_SIZE = 15;

/**
 * Execute user code in an isolated environment.
 *
 * For C++:
 *   1. Primary: Local Wasm Clang engine (in-browser compilation + execution)
 *   2. Fallback: Wandbox API (real GCC compilation) if Wasm engine is unavailable
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
  const cacheKey = `${language}:${userCode.trim()}:${timeoutMs}`;

  if (executionCache.has(cacheKey)) {
    return executionCache.get(cacheKey)!;
  }

  let result: ExecuteResult;

  // ── C++ Execution ──
  if (language === 'cpp' || language === 'c++') {
    result = await executeCpp(userCode, config, timeoutMs);
  } else {
    // ── Browser Web Worker (JS / Python) ──
    result = await executeInWorker(userCode, language, config, timeoutMs);
  }

  // Save to cache
  if (executionCache.size >= MAX_CACHE_SIZE) {
    const firstKey = executionCache.keys().next().value;
    executionCache.delete(firstKey);
  }
  executionCache.set(cacheKey, result);

  return result;
};

/**
 * C++ execution strategy:
 *  1. Try local Wasm Clang engine (zero-latency, offline-capable)
 *  2. On engine failure → fall back to Wandbox API (real GCC, full STL)
 *  3. On compiler error → show the error to the user (don't fallback)
 */
async function executeCpp(
  userCode: string,
  config: ExecutionConfig | undefined,
  timeoutMs: number,
): Promise<ExecuteResult> {
  // ── Strategy 1: Wasm Clang Engine (Primary) ──
  try {
    const { executeWasmClangCpp, isWasmClangReady } = await import('./wasmClangEngine');

    const result = await executeWasmClangCpp(userCode, config);

    // ── Engine error → fall back to Wandbox ──
    if (result.engineError) {
      console.warn(
        `[Executor] Wasm Clang unavailable (${result.engineError}), falling back to Wandbox API.`,
      );
      return executeWithWandbox(userCode, config, timeoutMs);
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

    // ── Success: run complexity analysis ──
    const analysis = analyzeComplexity(userCode, result.timeline);
    return {
      timeline: result.timeline,
      analysis,
    };
  } catch (e: any) {
    // Unexpected Wasm engine error → fall back to Wandbox
    console.warn('[Executor] Unexpected Wasm Clang error, falling back to Wandbox:', e.message);
    return executeWithWandbox(userCode, config, timeoutMs);
  }
}

/**
 * Fallback: Execute C++ via the Wandbox API (real GCC).
 * Used when the local Wasm Clang engine is unavailable.
 */
async function executeWithWandbox(
  userCode: string,
  config: ExecutionConfig | undefined,
  timeoutMs: number,
): Promise<ExecuteResult> {
  try {
    const { executeWandboxCpp } = await import('./wandboxExecutor');
    const result = await executeWandboxCpp(userCode, config);

    // ── Network / API error → return error to user ──
    if (result.networkError) {
      return {
        timeline: [
          {
            line: 0,
            variables: {},
            callStack: ['main'],
            consoleOutput: [
              {
                type: 'error',
                message: `Both local engine and Wandbox API are unavailable.\n\nLocal: Wasm Clang engine not loaded.\nRemote: ${result.networkError}\n\nPlease check your internet connection or reload the page.`,
              },
            ],
            isError: true,
            errorMessage: 'No C++ execution engine available',
          },
        ],
        errorType: 'runtime',
        analysis: null,
      };
    }

    // ── Compiler error → show to user ──
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

    // ── Success ──
    const analysis = analyzeComplexity(userCode, result.timeline);
    return {
      timeline: result.timeline,
      analysis,
    };
  } catch (e: any) {
    // Both engines failed
    return {
      timeline: [
        {
          line: 0,
          variables: {},
          callStack: ['main'],
          consoleOutput: [
            {
              type: 'error',
              message: `C++ execution failed: ${e.message}\n\nBoth the local Wasm engine and the Wandbox API are unavailable.`,
            },
          ],
          isError: true,
          errorMessage: e.message,
        },
      ],
      errorType: 'runtime',
      analysis: null,
    };
  }
}

/**
 * Execute code inside a sandboxed Web Worker.
 * Used for JS/Python execution only.
 * C++ no longer uses this path — it uses Wasm Clang or Wandbox instead.
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
