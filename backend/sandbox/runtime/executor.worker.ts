import { analyzeComplexity } from '../../analysis/complexity';
import { instrumentCode } from '../../tracer/instrumenter';
import {
  Timeline,
  ConsoleLog,
  ErrorType,
  ExecutionConfig,
  ComplexityAnalysis,
} from '../../../types';

// ─── Default config ───────────────────────────────────────────────────────────

const DEFAULT_MAX_STEPS = 2000;
const DEFAULT_INPUT_VALUES = [5, 10, 3, 7, 1, 42, 100, 0, -1, 99];

function serializeForDisplay(value: unknown, maxDepth: number = 4): string {
  const seen = new WeakSet<object>();

  const normalize = (current: unknown, depth: number): unknown => {
    if (current === null || typeof current !== 'object') {
      if (typeof current === 'function') return '[Function]';
      if (current === undefined) return 'undefined';
      if (Number.isNaN(current)) return 'NaN';
      return current;
    }

    if (seen.has(current as object)) {
      return '[Circular]';
    }

    if (depth >= maxDepth) {
      return Array.isArray(current) ? `[Array(${current.length})]` : '[Object]';
    }

    seen.add(current as object);

    if (Array.isArray(current)) {
      return current.map((item) => normalize(item, depth + 1));
    }

    const normalized: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(current as Record<string, unknown>)) {
      normalized[key] = normalize(entryValue, depth + 1);
    }
    return normalized;
  };

  try {
    return JSON.stringify(normalize(value, 0));
  } catch {
    return String(value);
  }
}

// ─── Worker message handler ───────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent) => {
  const { userCode, language, config } = e.data as {
    userCode: string;
    language: string;
    config?: ExecutionConfig;
  };

  // C++ is no longer handled here — it uses Wasm Clang or Wandbox directly.
  // This worker is strictly for JavaScript execution.
  if (language === 'c++' || language === 'cpp') {
    self.postMessage({
      type: 'error',
      timeline: [
        {
          line: 0,
          variables: {},
          callStack: ['main'],
          consoleOutput: [
            {
              type: 'error',
              message: 'C++ execution is handled by the Wasm Clang engine, not the Web Worker.',
            },
          ],
          isError: true,
          errorMessage: 'C++ should not be routed to the JS worker.',
        },
      ],
      errorType: 'runtime',
      analysis: null,
    });
    return;
  }

  const MAX_STEPS = config?.maxSteps ?? DEFAULT_MAX_STEPS;
  const inputValues = config?.inputValues ?? DEFAULT_INPUT_VALUES;

  const timeline: Timeline = [];
  const currentLogs: ConsoleLog[] = [];
  let logSnapshotIndex = 0; // Track where we last snapshotted logs
  let lastLine = 0;
  let complexityAnalysis: ComplexityAnalysis | null = null;

  /** Helper: snapshot only NEW logs since last step */
  function getNewLogs(): ConsoleLog[] {
    const newLogs = currentLogs.slice(logSnapshotIndex);
    logSnapshotIndex = currentLogs.length;
    return newLogs;
  }

  try {
    // ── Instrument JS code ──
    let instrumented: string;
    try {
      instrumented = instrumentCode(userCode);
    } catch (instrumentError: any) {
      postError(`Instrumentation Failed: ${instrumentError.message}`, lastLine, 'instrument');
      return;
    }

    complexityAnalysis = analyzeComplexity(userCode, timeline);

    let stepCount = 0;

    // ── Tracer object ──
    const tracer = {
      stack: ['main'],
      currentLine: 1,
      _inputValues: inputValues,
      _inputIndex: 0,

      enter: (name: string) => {
        tracer.stack.push(name);
      },

      exit: () => {
        if (tracer.stack.length > 1) {
          tracer.stack.pop();
        }
      },

      setLine: (line: number) => {
        tracer.currentLine = line;
        lastLine = line;
      },

      step: (line: number, vars: any) => {
        if (stepCount++ > MAX_STEPS) {
          throw new Error('Execution limit exceeded (infinite loop detection).');
        }

        tracer.currentLine = line;
        lastLine = line;

        // Deep-clone variables — structuredClone is faster than JSON round-trip
        // and handles more types (Map, Set, Date, RegExp, etc.)
        let safeVars: any;
        try {
          safeVars = structuredClone(vars);
        } catch {
          // Fallback for non-cloneable values (functions, symbols)
          safeVars = JSON.parse(serializeForDisplay(vars));
        }

        timeline.push({
          line,
          variables: safeVars,
          callStack: [...tracer.stack],
          // Only store NEW logs since last step (delta, not full history)
          consoleOutput: getNewLogs(),
        });
      },

      checkLoop: () => {
        return stepCount > MAX_STEPS;
      },

      log: (...args: any[]) => {
        const message = args
          .map((a) => (typeof a === 'object' ? serializeForDisplay(a) : String(a)))
          .join(' ');
        currentLogs.push({ type: 'log', message });
      },

      input: () => {
        const val = tracer._inputValues[tracer._inputIndex % tracer._inputValues.length];
        tracer._inputIndex++;
        currentLogs.push({ type: 'log', message: `[input] → ${val}` });
        return val;
      },
    };

    // ── Sandboxed execution ──
    // Block dangerous globals inside the sandbox to prevent exfiltration.
    // The worker already has no DOM access, but still has network APIs.
    const wrappedCode = `
        const __tracer = arguments[0];
        const console = {
          log: __tracer.log,
          error: __tracer.log,
          warn: __tracer.log
        };

        // ── Sandbox: block dangerous APIs ──
        const fetch = undefined;
        const XMLHttpRequest = undefined;
        const WebSocket = undefined;
        const importScripts = undefined;
        const EventSource = undefined;
        const navigator = undefined;
        const indexedDB = undefined;
        const caches = undefined;
        const BroadcastChannel = undefined;

        try {
          ${instrumented}
        } catch (e) {
            if (e.message !== "Execution limit exceeded (infinite loop detection).") {
                throw e;
            }
        }
      `;

    new Function(wrappedCode).call(null, tracer);

    complexityAnalysis = analyzeComplexity(userCode, timeline);
    self.postMessage({ type: 'success', timeline, analysis: complexityAnalysis });
  } catch (e: any) {
    postError(e.message, lastLine, 'runtime');
  }

  // ── Helper: post error with partial timeline ──
  function postError(message: string, errorLine: number, errorType: ErrorType) {
    const errorTimeline = [
      ...timeline,
      {
        line: errorLine,
        variables: timeline.length > 0 ? timeline[timeline.length - 1].variables : {},
        callStack: timeline.length > 0 ? timeline[timeline.length - 1].callStack : ['main'],
        consoleOutput: [
          ...getNewLogs(),
          { type: 'error' as const, message: `Runtime Error: ${message}` },
        ],
        isError: true,
        errorMessage: message,
      },
    ];
    try {
      complexityAnalysis = analyzeComplexity(userCode, errorTimeline);
    } catch {
      // Keep the last successful analysis if the fallback pass fails.
    }
    self.postMessage({
      type: 'error',
      timeline: errorTimeline,
      message,
      errorType,
      analysis: complexityAnalysis,
    });
  }
};
