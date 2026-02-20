import { instrumentCode } from '../tracer/instrumenter';
import { transpileCppToJs } from './cppTranspiler';
import { Timeline, ConsoleLog } from '../../types';

self.onmessage = (e: MessageEvent) => {
    const { userCode, language } = e.data;

    const timeline: Timeline = [];
    const currentLogs: ConsoleLog[] = [];
    let lastLine = 0;

    try {
        let codeToInstrument = userCode;

        // Transpile if C++
        if (language === 'c++' || language === 'cpp') {
            try {
                codeToInstrument = transpileCppToJs(userCode);
            } catch (transpileError: any) {
                throw new Error(`Transpilation Failed: ${transpileError.message}`);
            }
        }

        const instrumented = instrumentCode(codeToInstrument);
        let stepCount = 0;
        const MAX_STEPS = 2000;

        const tracer = {
            stack: ['main'],
            currentLine: 1,
            _inputValues: [5, 10, 3, 7, 1, 42, 100, 0, -1, 99],
            _inputIndex: 0,

            enter: (name: string) => {
                tracer.stack.push(name);
            },

            exit: () => {
                if (tracer.stack.length > 1) { // Don't pop 'main'
                    tracer.stack.pop();
                }
            },

            setLine: (line: number) => {
                tracer.currentLine = line;
                lastLine = line;
            },

            step: (line: number, vars: any) => {
                if (stepCount++ > MAX_STEPS) throw new Error("Execution limit exceeded (infinite loop detection).");

                tracer.currentLine = line;
                lastLine = line;

                const safeVars = JSON.parse(JSON.stringify(vars, (key, value) => {
                    if (typeof value === 'function') return '[Function]';
                    if (value === undefined) return 'undefined';
                    if (Number.isNaN(value)) return 'NaN';
                    return value;
                }));

                timeline.push({
                    line,
                    variables: safeVars,
                    callStack: [...tracer.stack],
                    consoleOutput: [...currentLogs]
                });
            },

            checkLoop: () => {
                if (stepCount > MAX_STEPS) return true;
                return false;
            },

            log: (...args: any[]) => {
                const message = args.map(a =>
                    typeof a === 'object' ? JSON.stringify(a) : String(a)
                ).join(' ');
                currentLogs.push({ type: 'log', message });
            },

            input: () => {
                // Return pre-seeded sample values for cin visualization
                const val = tracer._inputValues[tracer._inputIndex % tracer._inputValues.length];
                tracer._inputIndex++;
                currentLogs.push({ type: 'log', message: `[input] → ${val}` });
                return val;
            }
        };

        const wrappedCode = `
        const __tracer = arguments[0];
        const console = { 
          log: __tracer.log, 
          error: __tracer.log, 
          warn: __tracer.log 
        };
        
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
        let errorLine = lastLine;
        const errorTimeline = [
            ...timeline,
            {
                line: errorLine,
                variables: timeline.length > 0 ? timeline[timeline.length - 1].variables : {},
                callStack: timeline.length > 0 ? timeline[timeline.length - 1].callStack : ['main'],
                consoleOutput: [
                    ...currentLogs,
                    { type: 'error', message: `Runtime Error: ${e.message}` }
                ],
                isError: true,
                errorMessage: e.message
            }
        ];
        self.postMessage({ type: 'error', timeline: errorTimeline, message: e.message });
    }
};
