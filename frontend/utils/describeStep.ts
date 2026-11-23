import { ExecutionStep } from '../../types';

export function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function compactValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `Array(${value.length})`;
    return 'Object';
  }
  return String(value);
}

export function describeStep(current: ExecutionStep, previous: ExecutionStep | undefined): string {
  if (current.isError) return current.errorMessage || 'Execution stopped with an error.';
  if (!previous) return 'Execution is ready. Step forward to see what changes.';

  // A write of a whole object says little ("q changed to Object"); the field diff below says more.
  const event = (current.events || []).find(
    (item) => item.type !== 'line' && item.type !== 'output' && !(item.type === 'write' && item.after !== null && typeof item.after === 'object'),
  );
  if (event) {
    if (event.type === 'compare') return `${event.expression || 'Condition'} evaluated to ${event.result ? 'true' : 'false'}.`;
    if (event.type === 'swap' && event.indices) return `${event.variable || 'Values'} swapped indices ${event.indices[0]} and ${event.indices[1]}.`;
    if (event.type === 'array-write') return `${event.variable}[${event.index}] changed from ${compactValue(event.before)} to ${compactValue(event.after)}.`;
    if (event.type === 'grid-write') return `${event.variable}[${event.row}][${event.column}] changed from ${compactValue(event.before)} to ${compactValue(event.after)}.`;
    if (event.type === 'pointer-move') return `${event.variable} moved from ${compactValue(event.before)} to ${compactValue(event.after)}.`;
    if (event.type === 'call') return `Entered ${event.variable || 'a function'}; the call stack grew to ${event.after} frames.`;
    if (event.type === 'return') return `Returned from ${event.variable || 'a function'}; the call stack is now ${event.after} frames.`;
    if (event.type === 'visit') return `${event.variable || 'A visited item'} was marked${event.index !== undefined ? ` at index ${event.index}` : event.row !== undefined ? ` at [${event.row}, ${event.column}]` : ''}.`;
    if (event.type === 'write') return `${event.variable || 'Program state'} changed${event.after !== undefined ? ` to ${compactValue(event.after)}` : ''}.`;
  }

  const before = previous.variables || {};
  const after = current.variables || {};
  const changed = Object.keys(after).filter((name) => !valuesEqual(before[name], after[name]));

  for (const name of changed) {
    const oldValue = before[name];
    const newValue = after[name];
    // Objects (q, this, a struct): name the field that changed.
    if (oldValue && newValue && typeof oldValue === 'object' && typeof newValue === 'object' && !Array.isArray(oldValue) && !Array.isArray(newValue)) {
      const o = oldValue as Record<string, unknown>;
      const n = newValue as Record<string, unknown>;
      const field = Object.keys(n).find((k) => !k.startsWith('__') && !valuesEqual(o[k], n[k]));
      if (field) {
        const label = name === 'this' ? field : `${name}.${field}`;
        if (Array.isArray(o[field]) && Array.isArray(n[field]) && (o[field] as unknown[]).length === (n[field] as unknown[]).length) {
          const i = (n[field] as unknown[]).findIndex((v, j) => !valuesEqual(v, (o[field] as unknown[])[j]));
          if (i >= 0) return `${label}[${i}] changed from ${compactValue((o[field] as unknown[])[i])} to ${compactValue((n[field] as unknown[])[i])}.`;
        }
        if (typeof n[field] !== 'object' || n[field] === null) return `${label} changed from ${compactValue(o[field])} to ${compactValue(n[field])}.`;
      }
    }
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      const indices = newValue.map((value, index) =>
        valuesEqual(oldValue[index], value) ? -1 : index,
      ).filter((index) => index >= 0);
      if (indices.length === 2 && valuesEqual(oldValue[indices[0]], newValue[indices[1]]) && valuesEqual(oldValue[indices[1]], newValue[indices[0]])) {
        return `${name} swapped values at indices ${indices[0]} and ${indices[1]}.`;
      }
      if (indices.length === 1) return `${name}[${indices[0]}] changed from ${compactValue(oldValue[indices[0]])} to ${compactValue(newValue[indices[0]])}.`;
      return `${name} changed (${indices.length} array positions updated).`;
    }
  }

  const pointerNames = new Set(['i', 'j', 'k', 'left', 'right', 'low', 'high', 'lo', 'hi', 'mid', 'current', 'curr', 'head', 'tail', 'node']);
  const pointerChange = changed.find((name) => pointerNames.has(name.toLowerCase()) && Number.isFinite(before[name]) && Number.isFinite(after[name]));
  if (pointerChange) return `${pointerChange} moved from ${compactValue(before[pointerChange])} to ${compactValue(after[pointerChange])}.`;

  const valueChange = changed.find((name) => typeof after[name] !== 'object' || after[name] === null);
  if (valueChange) {
    if (!(valueChange in before)) return `${valueChange} was created with value ${compactValue(after[valueChange])}.`;
    return `${valueChange} changed from ${compactValue(before[valueChange])} to ${compactValue(after[valueChange])}.`;
  }

  if (changed.length > 0) return `${changed.length} values changed at this step.`;
  if ((current.callStack || []).length > (previous.callStack || []).length) return 'A function call added a frame to the call stack.';
  if ((current.callStack || []).length < (previous.callStack || []).length) return 'A function returned to its caller.';
  return 'Execution moved to the next statement.';
}
