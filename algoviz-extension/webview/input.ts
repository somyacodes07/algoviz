// Finds where a program reads input, so the view can ask for it before running.

export interface InputRead {
  line: number;
  what: string; // `n`, `arr[i]`, `getline`, `prompt()`
}

function stripComments(code: string) {
  // Keep line breaks so line numbers stay right.
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/.*$/gm, '')
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""');
}

export function findInputReads(code: string, language: 'c++' | 'javascript'): InputRead[] {
  const reads: InputRead[] = [];
  stripComments(code)
    .split('\n')
    .forEach((text, i) => {
      const line = i + 1;
      if (language === 'c++') {
        for (const m of text.matchAll(/\bcin\s*>>([^;]*)/g)) {
          m[1].split('>>').map((t) => t.trim()).filter(Boolean).forEach((what) => reads.push({ line, what }));
        }
        for (const m of text.matchAll(/\bgetline\s*\(\s*cin\s*,\s*([^,)]+)/g)) reads.push({ line, what: `${m[1].trim()} (whole line)` });
        if (/\b(scanf|getchar|fgets)\s*\(/.test(text)) reads.push({ line, what: text.match(/\b(scanf|getchar|fgets)/)![1] });
      } else if (/\bprompt\s*\(/.test(text)) {
        reads.push({ line, what: 'prompt()' });
      }
    });
  return reads;
}

/** What the tracer receives: lines for C++ (joined back as stdin), values for JS prompt(). */
export function toInputValues(text: string, language: 'c++' | 'javascript'): Array<string | number> | undefined {
  if (!text.trim()) return undefined;
  if (language === 'c++') return text.replace(/\s+$/, '').split('\n');
  return text
    .split(/\n/)
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => (/^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v));
}

export function countValues(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}
