import { Timeline, ExecutionConfig } from '../../../types';
import { CppInstrumenter } from '../transpiler/cppInstrumenter';

const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';

export interface WandboxResult {
  timeline: Timeline;
  stdout: string;
  stderr: string;
  /** Compiler error to show the user (e.g. syntax error in their code). */
  compilerError?: string;
  /** Network / API error — signals executor.ts to try the transpiler fallback. */
  networkError?: string;
}

/**
 * Executes C++ code via the Wandbox API with source instrumentation.
 *
 * Flow:
 *  1. Instrument the user's C++ with __trace() calls.
 *  2. POST to Wandbox for real GCC compilation + execution.
 *  3. Parse __TRACE__ blocks from stdout into a Timeline.
 *
 * Error categories:
 *  - `networkError`  → Wandbox is unreachable; caller should try the local fallback.
 *  - `compilerError` → The user's code has a compilation error; show it in the UI.
 */
export async function executeWandboxCpp(
  code: string,
  config?: ExecutionConfig,
): Promise<WandboxResult> {
  // ── 1. Instrument the code ──
  let instrumentedCode: string;
  try {
    const instrumenter = new CppInstrumenter();
    instrumentedCode = await instrumenter.instrument(code);
  } catch (e: any) {
    // Instrumentation failure is a network-like error (tree-sitter init might fail)
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      networkError: `Instrumentation failed: ${e.message}`,
    };
  }

  // ── 2. Call Wandbox API ──
  let response: Response;
  try {
    response = await fetch(WANDBOX_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: 'gcc-head',
        code: instrumentedCode,
        stdin: config?.inputValues?.join('\n') || '',
        save: false,
      }),
    });
  } catch (fetchError: any) {
    // Network failure — Wandbox is down, no internet, CORS issue, etc.
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      networkError: `Cannot reach Wandbox API: ${fetchError.message}`,
    };
  }

  if (!response.ok) {
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      networkError: `Wandbox API returned HTTP ${response.status}`,
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
      networkError: 'Wandbox returned invalid JSON',
    };
  }

  // ── 3. Handle compiler errors ──
  // Wandbox puts compiler errors in compiler_error and runtime errors in program_error.
  // If there's a compiler error and no program output, the code didn't compile.
  if (result.status !== '0' && !result.program_output) {
    const errorMsg =
      result.compiler_error || result.program_error || 'Unknown compilation error';
    return {
      timeline: [],
      stdout: '',
      stderr: errorMsg,
      compilerError: errorMsg,
    };
  }

  // ── 4. Parse trace output from stdout ──
  const rawOutput = result.program_output || '';
  const timeline = parseWandboxOutput(rawOutput);

  // Extract user-visible output (everything that's NOT a __TRACE__ block)
  const userOutput = rawOutput
    .replace(/__TRACE__\{.*?\}__TRACE__\n?/g, '')
    .trim();

  // Attach user cout output to the last timeline step so it shows in the console
  if (userOutput && timeline.length > 0) {
    const outputLines = userOutput.split('\n').filter((l: string) => l.trim());
    for (const line of outputLines) {
      timeline[timeline.length - 1].consoleOutput.push({
        type: 'log',
        message: line,
      });
    }
  }

  return {
    timeline,
    stdout: userOutput,
    stderr: result.program_error || '',
  };
}

/**
 * Extracts __TRACE__{...}__TRACE__ blocks from stdout and builds the timeline.
 */
function parseWandboxOutput(stdout: string): Timeline {
  const timeline: Timeline = [];
  const regex = /__TRACE__(\{.*?\})__TRACE__/g;
  let match;

  while ((match = regex.exec(stdout)) !== null) {
    try {
      const traceData = JSON.parse(match[1]);
      timeline.push({
        line: traceData.line,
        variables: traceData.variables || {},
        callStack: ['main'],
        consoleOutput: [],
      });
    } catch (e) {
      // Skip malformed trace blocks
      console.warn('[WandboxExecutor] Skipped malformed trace block:', match[1]);
    }
  }

  return timeline;
}
