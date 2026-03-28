/**
 * Public API for the C++ → JavaScript transpiler.
 *
 * Architecture:
 *   1. Call `initTranspiler()` once at startup (async, loads WASM).
 *   2. Then `transpileCppToJs()` is synchronous on every call.
 *   3. Falls back to the old regex transpiler if Tree-sitter fails.
 *
 * Usage:
 *   import { initTranspiler, transpileCppToJs } from './transpiler';
 *   await initTranspiler();
 *   const js = transpileCppToJs(cppCode);
 */

import { initParser, isParserReady, parseCpp } from './parser';
import { CppToJsTransformer } from './transformer';
import { formatGeneratedCode } from './generator';
import { transpileCppToJs as regexTranspile } from '../legacy/regexTranspiler';

// ─── Transpiler Mode ──────────────────────────────────────────────────────────

type TranspilerMode = 'ast' | 'regex';
let currentMode: TranspilerMode = 'ast';
let initDone = false;

/**
 * Initialize the Tree-sitter WASM parser.
 * Call this once at startup. If it fails, the transpiler
 * automatically falls back to the regex-based engine.
 */
export async function initTranspiler(): Promise<void> {
  if (initDone) return;

  try {
    await initParser();
    currentMode = 'ast';
    initDone = true;
    console.log('[Transpiler] Tree-sitter AST engine initialized.');
  } catch (error) {
    // Fall back to regex transpiler
    currentMode = 'regex';
    initDone = true;
    console.warn(
      '[Transpiler] Tree-sitter init failed, falling back to regex engine:',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Transpile C++ source code to executable JavaScript.
 *
 * SYNCHRONOUS after `initTranspiler()` has been called.
 * Falls back to the regex transpiler if AST mode is unavailable
 * or if the AST transpiler throws an error.
 */
export function transpileCppToJs(cppCode: string): string {
  // If init hasn't been called, use regex mode
  if (!initDone || currentMode === 'regex') {
    return regexTranspile(cppCode);
  }

  // Try AST-based transpilation
  try {
    if (!isParserReady()) {
      return regexTranspile(cppCode);
    }

    const tree = parseCpp(cppCode);
    const transformer = new CppToJsTransformer();
    const { code, warnings } = transformer.transform(tree);
    const formatted = formatGeneratedCode(code);

    // Log warnings in development (they're also embedded as JS comments)
    if (warnings.length > 0) {
      console.warn(`[Transpiler] ${warnings.length} warning(s):`, warnings);
    }

    return formatted;
  } catch (error) {
    // If AST transpilation fails, fall back to regex
    console.warn(
      '[Transpiler] AST transpilation failed, falling back to regex:',
      error instanceof Error ? error.message : String(error)
    );
    return regexTranspile(cppCode);
  }
}

/**
 * Get the current transpiler mode.
 */
export function getTranspilerMode(): TranspilerMode {
  return currentMode;
}

/**
 * Force a specific transpiler mode (for debugging/testing).
 */
export function setTranspilerMode(mode: TranspilerMode): void {
  currentMode = mode;
}
