import { Timeline, ExecutionConfig } from '../../../types';
import { CppInstrumenter } from '../transpiler/cppInstrumenter';

const GODBOLT_API_URL = 'https://godbolt.org/api/compiler/g132/compile';

export interface RemoteResult {
  timeline: Timeline;
  stdout: string;
  stderr: string;
  compilerError?: string;
  networkError?: string;
}

export async function executeWandboxCpp(
  code: string,
  config?: ExecutionConfig,
): Promise<RemoteResult> {
  // ── 1. Instrument the code ──
  let instrumentedCode: string;
  try {
    const instrumenter = new CppInstrumenter();
    instrumentedCode = await instrumenter.instrument(code);
  } catch (e: any) {
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      networkError: `Instrumentation failed: ${e.message}`,
    };
  }

  // ── 2. Call Godbolt API ──
  let response: Response;
  try {
    response = await fetch(GODBOLT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        source: instrumentedCode,
        options: {
          userArguments: '-std=c++20 -O3 -fdiagnostics-color=never',
          executeParameters: {
            args: '',
            stdin: config?.inputValues?.join('\n') || ''
          },
          compilerOptions: {
            executorRequest: true
          }
        }
      }),
    });
  } catch (fetchError: any) {
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      networkError: `Cannot reach Remote API: ${fetchError.message}`,
    };
  }

  if (!response.ok) {
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      networkError: `Remote API returned HTTP ${response.status}`,
    };
  }

  let result: any;
  try {
    result = await response.json();
  } catch {
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      networkError: 'Remote API returned invalid JSON',
    };
  }

  // Helper to strip ANSI codes
  // eslint-disable-next-line no-control-regex
  const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, '');

  // ── 3. Handle compiler errors ──
  if (result.code !== 0 && !result.didExecute) {
    const stderrLines = (result.buildResult?.stderr || [])
      .map((e: any) => stripAnsi(e.text))
      .filter(Boolean);
    const errorMsg = stderrLines.join('\n') || 'Unknown compilation error';
    return {
      timeline: [],
      stdout: '',
      stderr: errorMsg,
      compilerError: errorMsg,
    };
  }

  // ── 4. Parse trace output from stdout ──
  const rawOutputLines = (result.stdout || []).map((e: any) => stripAnsi(e.text));
  const rawOutput = rawOutputLines.join('\n');
  const rawStderrLines = (result.stderr || []).map((e: any) => stripAnsi(e.text));
  
  const timeline = parseTraceOutput(rawOutput);

  // Extract user-visible output (everything that's NOT a __TRACE__ block)
  const userOutput = rawOutput.replace(/__TRACE__\{.*?\}__TRACE__\n?/g, '').trim();



  return {
    timeline,
    stdout: userOutput,
    stderr: rawStderrLines.join('\n'),
  };
}

function parseTraceOutput(stdout: string): Timeline {
  const timeline: Timeline = [];
  let currentLogs: { type: 'log' | 'error'; message: string }[] = [];

  const traceRegex = /__TRACE__(\{.*?\})__TRACE__/g;
  let lastIndex = 0;
  let match;

  while ((match = traceRegex.exec(stdout)) !== null) {
    // Everything between lastIndex and match.index is normal stdout printed before this trace
    const normalText = stdout.slice(lastIndex, match.index);
    if (normalText) {
      const normalLines = normalText.split('\n');
      for (const line of normalLines) {
        if (line.trim()) {
          currentLogs.push({ type: 'log', message: line });
        }
      }
    }

    // Parse the trace data
    try {
      const traceData = JSON.parse(match[1]);
      timeline.push({
        line: traceData.line,
        variables: traceData.variables || {},
        callStack: Array.isArray(traceData.callStack) ? traceData.callStack : ['main'],
        consoleOutput: [...currentLogs],
        events: Array.isArray(traceData.events) ? traceData.events : [],
      });
      currentLogs = [];
    } catch (e) {
      console.warn('[RemoteExecutor] Skipped malformed trace block:', match[1]);
    }

    lastIndex = traceRegex.lastIndex;
  }

  // Handle any trailing normal output after the last trace
  const trailingText = stdout.slice(lastIndex);
  if (trailingText) {
    const trailingLines = trailingText.split('\n');
    for (const line of trailingLines) {
      if (line.trim()) {
        currentLogs.push({ type: 'log', message: line });
      }
    }
  }

  if (currentLogs.length > 0 && timeline.length > 0) {
    timeline[timeline.length - 1].consoleOutput.push(...currentLogs);
  }

  return timeline;
}
