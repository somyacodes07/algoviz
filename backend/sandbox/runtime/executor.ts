import { Timeline, ExecutionConfig, ErrorType, ComplexityAnalysis } from '../../../types';

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
 * Execute user code in an isolated Web Worker.
 *
 * Features:
 * - Configurable timeout (default 5s) — kills worker if exceeded
 * - Configurable max steps and input values
 * - Categorized error types for better UI feedback
 */
export const executeCode = async (
  userCode: string,
  language: string = 'javascript',
  config?: ExecutionConfig,
): Promise<ExecuteResult> => {
  const timeoutMs = config?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // ── Native Backend Execution for C++ ──
  if (language === 'cpp') {
    try {
      const EXECUTION_API_URL = import.meta.env.VITE_EXECUTION_SERVER_URL || 'http://localhost:3000';
      const response = await fetch(`${EXECUTION_API_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: userCode, language, config }),
        signal: AbortSignal.timeout(timeoutMs + 2000), // Network timeout slightly longer than execution config
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      return {
        timeline: data.timeline || [],
        errorType: data.errorType,
        analysis: data.analysis || null,
      };
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.message === 'Timeout') {
        return {
          timeline: [{
            line: 0,
            variables: {},
            callStack: ['main'],
            consoleOutput: [{ type: 'error', message: `Execution timed out after ${timeoutMs / 1000}s on backend.` }],
            isError: true,
            errorMessage: 'Timeout',
          }],
          errorType: 'timeout',
          analysis: null,
        };
      }
      return {
        timeline: [{
          line: 0,
          variables: {},
          callStack: ['main'],
          consoleOutput: [{ type: 'error', message: `Backend Execution Error: ${err.message}. Ensure the execution-service is running.` }],
          isError: true,
          errorMessage: err.message,
        }],
        errorType: 'runtime',
        analysis: null,
      };
    }
  }

  // ── Browser Web Worker Fallback (for JS/Python) ──
  return new Promise((resolve, reject) => {
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
};
