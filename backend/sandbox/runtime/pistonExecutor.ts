import { Timeline, ExecutionConfig } from '../../../types';
import { CppInstrumenter } from '../transpiler/cppInstrumenter';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

export interface PistonResult {
  timeline: Timeline;
  stdout: string;
  stderr: string;
  error?: string;
}

/**
 * Executes C++ code via the Piston API with source instrumentation.
 */
export async function executePistonCpp(
  code: string,
  config?: ExecutionConfig
): Promise<PistonResult> {
  try {
    // 1. Instrument the code
    const instrumenter = new CppInstrumenter();
    const instrumentedCode = await instrumenter.instrument(code);

    // 2. Prepare Piston payload
    const payload = {
      language: 'cpp',
      version: '10.2.0', // Standard GCC version on Piston
      files: [
        {
          name: 'main.cpp',
          content: instrumentedCode,
        },
      ],
      stdin: config?.inputValues?.join('\n') || '',
    };

    // 3. Call Piston API
    const response = await fetch(PISTON_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Piston API returned ${response.status}`);
    }

    const result = await response.json();
    const run = result.run;

    if (run.stderr && !run.stdout) {
       return {
         timeline: [],
         stdout: run.stdout,
         stderr: run.stderr,
         error: run.stderr
       };
    }

    // 4. Parse trace output from stdout
    const timeline = parsePistonOutput(run.stdout);

    return {
      timeline,
      stdout: run.stdout.replace(/__TRACE__.*?__TRACE__/g, '').trim(),
      stderr: run.stderr,
    };
  } catch (error: any) {
    return {
      timeline: [],
      stdout: '',
      stderr: '',
      error: error.message,
    };
  }
}

/**
 * Extracts __TRACE__JSON__TRACE__ blocks from stdout and builds the timeline.
 */
function parsePistonOutput(stdout: string): Timeline {
  const timeline: Timeline = [];
  const regex = /__TRACE__(\{.*?\})__TRACE__/g;
  let match;

  while ((match = regex.exec(stdout)) !== null) {
    try {
      const traceData = JSON.parse(match[1]);
      timeline.push({
        line: traceData.line,
        variables: traceData.variables || {},
        callStack: ['main'], // Basic support for now
        consoleOutput: [],
      });
    } catch (e) {
      console.error('Failed to parse trace block', match[1], e);
    }
  }

  // If we have stdout that isn't a trace, we should ideally attribute it to the timeline steps
  // For now, let's just keep it simple.
  
  return timeline;
}
