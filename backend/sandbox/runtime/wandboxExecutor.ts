import { Timeline, ExecutionConfig } from '../../../types';
import { CppInstrumenter } from '../transpiler/cppInstrumenter';

const WANDBOX_API_URL = 'https://wandbox.org/api/compile.json';

export interface WandboxResult {
  timeline: Timeline;
  stdout: string;
  stderr: string;
  error?: string;
}

/**
 * Executes C++ code via the Wandbox API with source instrumentation.
 */
export async function executeWandboxCpp(
  code: string,
  config?: ExecutionConfig
): Promise<WandboxResult> {
  try {
    // 1. Instrument the code
    const instrumenter = new CppInstrumenter();
    const instrumentedCode = await instrumenter.instrument(code);

    // 2. Prepare Wandbox payload
    const payload = {
      compiler: 'gcc-head', // Latest GCC
      code: instrumentedCode,
      stdin: config?.inputValues?.join('\n') || '',
      save: false,
    };

    // 3. Call Wandbox API
    const response = await fetch(WANDBOX_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Wandbox API returned ${response.status}`);
    }

    const result = await response.json();

    if (result.compiler_error || result.program_error) {
       const errorMsg = result.compiler_error || result.program_error;
       // If it's just a warning, we might still have output, but usually it's an error
       if (!result.program_output) {
          return {
            timeline: [],
            stdout: result.program_output || '',
            stderr: errorMsg,
            error: errorMsg
          };
       }
    }

    // 4. Parse trace output from stdout
    const timeline = parseWandboxOutput(result.program_output || '');

    return {
      timeline,
      stdout: (result.program_output || '').replace(/__TRACE__.*?__TRACE__/g, '').trim(),
      stderr: result.program_error || '',
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
      console.error('Failed to parse trace block', match[1], e);
    }
  }
  
  return timeline;
}
