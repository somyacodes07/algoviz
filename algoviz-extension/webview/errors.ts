// Turns raw compiler / runtime errors into something a student can read, and maps
// compiler line numbers (which point into the instrumented source) back to the user's file.

export interface ParsedProblem {
  line: number; // 1-based line in the user's file, 0 when unknown
  message: string;
}

export interface ParsedError {
  kind: 'compile' | 'runtime' | 'tracer' | 'network' | 'other';
  title: string;
  summary: string;
  problems: ParsedProblem[];
  details: string;
}

const DIAG = /^(?:<source>|[^\s:]+\.(?:cpp|cc|c|h|hpp)):(\d+):(\d+):\s*(fatal error|error):\s*(.*)$/;
const SNIPPET = /^\s*\d+\s*\|\s?(.*)$/;

// Injected tracer code, removed before matching a compiler snippet to the user's line.
function stripInstrumentation(text: string) {
  return text
    .replace(/__CallScope\s+__trace_call_\d+\([^;]*\);/g, '')
    .replace(/__trace\(\d+,\s*\{.*?\}\);/g, '')
    .replace(/\(__trace_condition\(\d+,\s*\(/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findUserLine(snippet: string, codeLines: string[]): number {
  const target = stripInstrumentation(snippet);
  if (target.length < 3) return 0;
  const normalized = codeLines.map((l) => l.replace(/\s+/g, ' ').trim());
  let index = normalized.findIndex((l) => l === target);
  if (index < 0) index = normalized.findIndex((l) => l.length > 2 && (target.startsWith(l) || l.startsWith(target)));
  return index + 1;
}

function cleanMessage(message: string) {
  return message
    .replace(/std::__cxx11::basic_string<char>/g, 'std::string')
    .replace(/std::__cxx11::/g, 'std::')
    .replace(/‘|’/g, "'");
}

export function parseError(raw: string, code: string, errorLine?: number): ParsedError {
  const text = raw.trim();
  const lines = text.split('\n');
  const codeLines = code.split('\n');

  if (/failed to fetch|network|ENOTFOUND|ECONNREFUSED|timed? ?out/i.test(text) && !DIAG.test(lines[0])) {
    return {
      kind: 'network',
      title: 'Couldn’t reach the C++ compiler',
      summary: 'The remote compiler did not answer. Check your connection, or switch “AlgoViz: Cpp Compiler” to wasm to compile locally.',
      problems: [],
      details: text,
    };
  }

  const problems: ParsedProblem[] = [];
  let mentionsTracer = false;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(DIAG);
    if (!match) continue;
    const message = cleanMessage(match[4]);
    const snippet = lines[i + 1]?.match(SNIPPET)?.[1] ?? '';
    if (/__to_json|__trace|__json_|__CallScope/.test(message + snippet)) mentionsTracer = true;
    const line = findUserLine(snippet, codeLines);
    if (!problems.some((p) => p.line === line && p.message === message)) problems.push({ line, message });
  }

  if (problems.length > 0) {
    const tracerOnly = mentionsTracer && problems.every((p) => /__to_json|__trace|__json_|initializer list|brace-enclosed/.test(p.message));
    if (tracerOnly) {
      return {
        kind: 'tracer',
        title: 'AlgoViz couldn’t trace this file',
        summary: 'Your code is fine. The code AlgoViz adds to record each step didn’t compile for one of your types. Please report it with the details below.',
        problems: problems.filter((p) => p.line > 0).map((p) => ({ ...p, message: 'AlgoViz couldn’t record the variables on this line.' })),
        details: text,
      };
    }
    const real = problems.filter((p) => !/__to_json|__trace|__json_/.test(p.message));
    const shown = real.length ? real : problems;
    return {
      kind: 'compile',
      title: shown.length === 1 ? 'Compile error' : `${shown.length} compile errors`,
      summary: shown[0].message,
      problems: shown,
      details: text,
    };
  }

  const firstLine = cleanMessage(lines[0] || 'Execution failed').replace(/^Runtime Error:\s*/i, '');
  return {
    kind: /error/i.test(text) || errorLine ? 'runtime' : 'other',
    title: 'Runtime error',
    summary: firstLine,
    problems: errorLine ? [{ line: errorLine, message: firstLine }] : [],
    details: lines.length > 1 ? text : '',
  };
}
