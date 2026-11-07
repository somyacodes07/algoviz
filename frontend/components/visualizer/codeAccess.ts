import { VariableMap } from '../../../types';

// Reads array accesses out of source text, so diagrams can mark the exact cells a line touches
// (dp[i-1][j-1], heap[Math.floor((i-1)/2)]) and only treat real index variables as pointers.

export interface CellAccess {
  indices: number[];
  write: boolean;
}

const IDENT = /[A-Za-z_$][\w$]*/y;
const NOT_INDEX = new Set(['Math', 'length', 'size', 'true', 'false', 'null', 'undefined', 'this', 'int', 'auto', 'const', 'let', 'var']);

// Each `name[...][...]` in `text`: the name (as written, `this.heap` or `heap`) and the raw index expressions.
function findSubscripts(text: string): { name: string; start: number; end: number; indexes: string[] }[] {
  const found: { name: string; start: number; end: number; indexes: string[] }[] = [];
  const pattern = /((?:this\s*(?:\.|->)\s*)?[A-Za-z_$][\w$]*(?:\s*(?:\.|->)\s*[A-Za-z_$][\w$]*)*)\s*\[/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const name = match[1].replace(/\s+/g, '').replace(/->/g, '.');
    const indexes: string[] = [];
    let i = match.index + match[0].length - 1;
    while (text[i] === '[') {
      let depth = 0;
      const open = i;
      for (; i < text.length; i++) {
        if (text[i] === '[') depth++;
        else if (text[i] === ']' && --depth === 0) break;
      }
      if (i >= text.length) break;
      indexes.push(text.slice(open + 1, i));
      i++;
      while (text[i] === ' ') i++;
    }
    if (indexes.length > 0) found.push({ name, start: match.index, end: i, indexes });
    pattern.lastIndex = match.index + match[0].length;
  }
  return found;
}

const shortName = (name: string) => name.split('.').pop() || name;

/** Variables the code puts inside `name[...]`: one set per dimension. */
export function indexVariables(code: string, arrayName: string): string[][] {
  const target = shortName(arrayName);
  const dims: Set<string>[] = [];
  for (const access of findSubscripts(code)) {
    if (shortName(access.name) !== target) continue;
    access.indexes.forEach((expr, dim) => {
      dims[dim] = dims[dim] || new Set();
      for (const id of expr.match(/[A-Za-z_$][\w$]*/g) || []) {
        if (!NOT_INDEX.has(id) && id !== target) dims[dim].add(id);
      }
    });
  }
  return dims.map((set) => Array.from(set));
}

// ── Tiny expression evaluator: numbers, scalars, + - * / %, parentheses, Math.floor/min/max/abs,
// x.length and nested subscripts into arrays in scope. Anything else gives undefined.
function evaluate(expr: string, variables: VariableMap): number | undefined {
  let pos = 0;
  const skip = () => {
    while (expr[pos] === ' ') pos++;
  };
  const lookup = (name: string): unknown => {
    const path = name.replace(/^this\./, '').split('.');
    if (path.length > 1 && path[0] in variables) {
      let value: unknown = variables[path[0]];
      for (const key of path.slice(1)) value = value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
      return value;
    }
    if (name in variables) return variables[name];
    const short = path[path.length - 1];
    return Object.entries(variables).find(([key]) => shortName(key) === short)?.[1];
  };

  const primary = (): number | undefined => {
    skip();
    if (expr[pos] === '(') {
      pos++;
      const value = sum();
      skip();
      if (expr[pos] !== ')') return undefined;
      pos++;
      return value;
    }
    if (expr[pos] === '-') {
      pos++;
      const value = primary();
      return value === undefined ? undefined : -value;
    }
    const number = expr.slice(pos).match(/^\d+(\.\d+)?/);
    if (number) {
      pos += number[0].length;
      return Number(number[0]);
    }
    IDENT.lastIndex = pos;
    const id = IDENT.exec(expr);
    if (!id) return undefined;
    pos += id[0].length;
    let name = id[0];
    while (expr[pos] === '.' || expr.startsWith('->', pos)) {
      pos += expr[pos] === '.' ? 1 : 2;
      IDENT.lastIndex = pos;
      const part = IDENT.exec(expr);
      if (!part) return undefined;
      pos += part[0].length;
      name += `.${part[0]}`;
    }
    skip();
    if (name.startsWith('Math.') && expr[pos] === '(') {
      pos++;
      const args: (number | undefined)[] = [];
      for (;;) {
        args.push(sum());
        skip();
        if (expr[pos] === ',') {
          pos++;
          continue;
        }
        break;
      }
      if (expr[pos] !== ')' || args.some((a) => a === undefined)) return undefined;
      pos++;
      const nums = args as number[];
      const fn = name.slice(5);
      if (fn === 'floor') return Math.floor(nums[0]);
      if (fn === 'ceil') return Math.ceil(nums[0]);
      if (fn === 'abs') return Math.abs(nums[0]);
      if (fn === 'min') return Math.min(...nums);
      if (fn === 'max') return Math.max(...nums);
      return undefined;
    }
    if (name.endsWith('.length') || name.endsWith('.size')) {
      const owner = lookup(name.replace(/\.(length|size)$/, ''));
      if (expr[pos] === '(') pos = expr.indexOf(')', pos) + 1;
      return Array.isArray(owner) || typeof owner === 'string' ? owner.length : undefined;
    }
    let value: unknown = lookup(name);
    while (expr[pos] === '[') {
      pos++;
      const index = sum();
      skip();
      if (expr[pos] !== ']' || index === undefined) return undefined;
      pos++;
      value = Array.isArray(value) || typeof value === 'string' ? (value as unknown[])[index] : undefined;
      skip();
    }
    return typeof value === 'number' ? value : typeof value === 'boolean' ? Number(value) : undefined;
  };
  const product = (): number | undefined => {
    let left = primary();
    for (;;) {
      skip();
      const op = expr[pos];
      if (op !== '*' && op !== '/' && op !== '%') return left;
      pos++;
      const right = primary();
      if (left === undefined || right === undefined) return undefined;
      left = op === '*' ? left * right : op === '/' ? Math.trunc(left / right) : left % right;
    }
  };
  const sum = (): number | undefined => {
    let left = product();
    for (;;) {
      skip();
      const op = expr[pos];
      if ((op !== '+' && op !== '-') || expr[pos + 1] === op) return left;
      pos++;
      const right = product();
      if (left === undefined || right === undefined) return undefined;
      left = op === '+' ? left + right : left - right;
    }
  };

  const result = sum();
  skip();
  return pos === expr.length && result !== undefined && Number.isInteger(result) ? result : undefined;
}

const ASSIGNMENT = /(?<![=!<>+\-*/%&|^])(?:=(?![=>])|\+=|-=|\*=|\/=|%=|<<=|>>=|&=|\|=|\^=)/;

/**
 * Accesses on one source line, by array name (both `this.heap` and `heap` keys are set).
 * A subscript left of the line's assignment, or one being incremented, is a write.
 */
export function lineAccesses(lineText: string | undefined, variables: VariableMap): Map<string, CellAccess[]> {
  const result = new Map<string, CellAccess[]>();
  if (!lineText) return result;
  const text = lineText.replace(/\/\/.*$/, '');
  const assignAt = text.search(ASSIGNMENT);
  for (const access of findSubscripts(text)) {
    const indices = access.indexes.map((expr) => evaluate(expr.trim(), variables));
    if (indices.some((i) => i === undefined || i < 0)) continue;
    const after = text.slice(access.end).trimStart();
    const before = text.slice(0, access.start).trimEnd();
    const write = (assignAt >= 0 && access.start < assignAt && !/^[=!<>]=/.test(after)) || /^(\+\+|--)/.test(after) || /(\+\+|--)$/.test(before);
    const entry = { indices: indices as number[], write };
    for (const key of new Set([access.name, shortName(access.name)])) {
      if (!result.has(key)) result.set(key, []);
      result.get(key)!.push(entry);
    }
  }
  return result;
}

export function accessesFor(map: Map<string, CellAccess[]>, name: string): CellAccess[] {
  return map.get(name) || map.get(shortName(name)) || [];
}

/** Large sentinels people use for "no path yet" read as infinity. */
export function displayValue(value: unknown): string {
  if (value === null || value === undefined) return 'nil';
  if (typeof value === 'number') {
    if (value === Infinity || value >= 1e9 || value === 2147483647) return '∞';
    if (value === -Infinity || value <= -1e9 || value === -2147483648) return '-∞';
    return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
  }
  if (typeof value === 'boolean') return value ? 'T' : 'F';
  return String(value);
}
