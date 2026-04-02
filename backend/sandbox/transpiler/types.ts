/**
 * Internal type definitions for the C++ → JS AST-based transpiler.
 *
 * These types define the configuration maps and IR structures used
 * throughout the transformer and generator pipeline.
 */

// ─── C++ Type Classification ──────────────────────────────────────────────────

/** Set of C++ primitive type specifiers that map to `let` in JS */
export const CPP_PRIMITIVE_TYPES = new Set([
  'int', 'float', 'double', 'bool', 'char', 'void',
  'auto', 'long', 'short', 'string',
]);

/** Multi-word type specifiers (handled as a combined token) */
export const CPP_COMPOUND_TYPES = new Set([
  'long long', 'unsigned int', 'long int', 'short int',
  'unsigned long', 'unsigned long long', 'signed int',
]);

/** Types that require integer semantics (Math.trunc on division) */
export const CPP_INTEGER_TYPES = new Set([
  'int', 'long', 'short', 'long long', 'unsigned int',
  'long int', 'short int', 'unsigned long', 'unsigned long long',
  'signed int', 'char',
]);

// ─── STL Method → JS Method Maps ─────────────────────────────────────────────

/**
 * Direct method name replacements (no argument transformation needed).
 * Note: map<K,V> transpiles to plain {} objects (not new Map()) for
 * educational clarity — bracket access m[key] works naturally.
 */
export const STL_METHOD_MAP: Record<string, string> = {
  'push_back': 'push',
  'emplace_back': 'push',
  'pop_back': 'pop',
};

/** STL algorithm function → JS equivalent patterns */
export const STL_MATH_FUNCTIONS: Record<string, string> = {
  'abs': 'Math.abs',
  'pow': 'Math.pow',
  'exp': 'Math.exp',
  'sqrt': 'Math.sqrt',
  'ceil': 'Math.ceil',
  'floor': 'Math.floor',
  'log': 'Math.log',
  'log2': 'Math.log2',
  'log10': 'Math.log10',
  'round': 'Math.round',
};

/** C++ constants → JS equivalents */
export const CPP_CONSTANTS: Record<string, string> = {
  'INT_MAX': 'Number.MAX_SAFE_INTEGER',
  'INT_MIN': 'Number.MIN_SAFE_INTEGER',
  'LLONG_MAX': 'Number.MAX_SAFE_INTEGER',
  'LLONG_MIN': 'Number.MIN_SAFE_INTEGER',
  'nullptr': 'null',
  'NULL': 'null',
  'true': 'true',
  'false': 'false',
};

// ─── Transpiler Configuration ─────────────────────────────────────────────────

export interface TranspilerConfig {
  /** Whether to emit warnings as JS comments */
  emitWarnings: boolean;
  /** Whether to wrap integer division in Math.trunc */
  strictIntegerMath: boolean;
  /** Whether to inline main() body into global scope */
  inlineMain: boolean;
}

export const DEFAULT_CONFIG: TranspilerConfig = {
  emitWarnings: true,
  strictIntegerMath: true,
  inlineMain: true,
};

// ─── Transpiler Result ────────────────────────────────────────────────────────

export interface TranspilerResult {
  /** The generated JavaScript code */
  code: string;
  /** Warnings about unsupported constructs */
  warnings: string[];
}
