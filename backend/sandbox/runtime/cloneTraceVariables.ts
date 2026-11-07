/**
 * Copies one step's variables. Shared references stay shared (trees and lists depend on it),
 * undefined stays undefined, and functions become the '[Function]' marker the UI expects.
 */
export function cloneTraceVariables(vars: Record<string, unknown>): Record<string, unknown> {
  const copies = new Map<object, unknown>();
  const copy = (value: unknown, depth: number): unknown => {
    if (typeof value === 'function') return '[Function]';
    if (value === null || typeof value !== 'object') return value;
    if (copies.has(value)) return copies.get(value);
    if (depth > 12) return Array.isArray(value) ? `[Array(${value.length})]` : '[Object]';
    if (value instanceof Date) return new Date(value.getTime());
    if (value instanceof Map) {
      const out = new Map();
      copies.set(value, out);
      value.forEach((v, k) => out.set(copy(k, depth + 1), copy(v, depth + 1)));
      return out;
    }
    if (value instanceof Set) {
      const out = new Set();
      copies.set(value, out);
      value.forEach((v) => out.add(copy(v, depth + 1)));
      return out;
    }
    if (Array.isArray(value)) {
      const out: unknown[] = [];
      copies.set(value, out);
      for (let i = 0; i < value.length; i++) out.push(copy(value[i], depth + 1));
      return out;
    }
    const out: Record<string, unknown> = {};
    copies.set(value, out);
    for (const key of Object.keys(value)) out[key] = copy((value as Record<string, unknown>)[key], depth + 1);
    return out;
  };
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(vars)) result[key] = copy(vars[key], 0);
  return result;
}
