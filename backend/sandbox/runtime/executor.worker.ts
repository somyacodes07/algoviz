import { instrumentCode } from '../../tracer/instrumenter';
import { initTranspiler, transpileCppToJs } from '../transpiler';
import { Timeline, ConsoleLog, ErrorType, ExecutionConfig } from '../../../types';

// ─── Tree-sitter WASM init (once) ─────────────────────────────────────────────

let initPromise: Promise<void> | null = null;
function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = initTranspiler();
  }
  return initPromise;
}

// ─── Default config ───────────────────────────────────────────────────────────

const DEFAULT_MAX_STEPS = 2000;
const DEFAULT_INPUT_VALUES = [5, 10, 3, 7, 1, 42, 100, 0, -1, 99];

// ─── Worker message handler ───────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent) => {
    await ensureInit();

    const { userCode, language, config } = e.data as {
      userCode: string;
      language: string;
      config?: ExecutionConfig;
    };

    const MAX_STEPS = config?.maxSteps ?? DEFAULT_MAX_STEPS;
    const inputValues = config?.inputValues ?? DEFAULT_INPUT_VALUES;

    const timeline: Timeline = [];
    const currentLogs: ConsoleLog[] = [];
    let logSnapshotIndex = 0; // Track where we last snapshotted logs
    let lastLine = 0;

    /** Helper: snapshot only NEW logs since last step */
    function getNewLogs(): ConsoleLog[] {
      const newLogs = currentLogs.slice(logSnapshotIndex);
      logSnapshotIndex = currentLogs.length;
      return newLogs;
    }

    try {
        let codeToInstrument = userCode;

        // ── Transpile C++ ──
        if (language === 'c++' || language === 'cpp') {
            try {
                codeToInstrument = transpileCppToJs(userCode);
            } catch (transpileError: any) {
                postError(`Transpilation Failed: ${transpileError.message}`, lastLine, 'transpile');
                return;
            }
        }

        // ── Instrument ──
        let instrumented: string;
        try {
            instrumented = instrumentCode(codeToInstrument);
        } catch (instrumentError: any) {
            postError(`Instrumentation Failed: ${instrumentError.message}`, lastLine, 'instrument');
            return;
        }

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
                    throw new Error("Execution limit exceeded (infinite loop detection).");
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
                    safeVars = JSON.parse(JSON.stringify(vars, (_key, value) => {
                        if (typeof value === 'function') return '[Function]';
                        if (value === undefined) return 'undefined';
                        if (Number.isNaN(value)) return 'NaN';
                        return value;
                    }));
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
                const message = args.map(a =>
                    typeof a === 'object' ? JSON.stringify(a) : String(a)
                ).join(' ');
                currentLogs.push({ type: 'log', message });
            },

            input: () => {
                const val = tracer._inputValues[tracer._inputIndex % tracer._inputValues.length];
                tracer._inputIndex++;
                currentLogs.push({ type: 'log', message: `[input] → ${val}` });
                return val;
            }
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

        self.postMessage({ type: 'success', timeline });

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
                    { type: 'error' as const, message: `Runtime Error: ${message}` }
                ],
                isError: true,
                errorMessage: message,
            }
        ];
        self.postMessage({ type: 'error', timeline: errorTimeline, message, errorType });
    }
};
