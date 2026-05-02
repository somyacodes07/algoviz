/**
 * Tree-sitter parser initialization and C++ parsing.
 *
 * Uses a singleton pattern: call `initParser()` once (async, loads WASM),
 * then `parseCpp()` is synchronous and fast on every subsequent call.
 *
 * The WASM files are loaded from the Vite public directory:
 *   - /tree-sitter.wasm      (Tree-sitter runtime)
 *   - /tree-sitter-cpp.wasm  (C++ grammar)
 */

import { Parser, Language, Tree } from 'web-tree-sitter';

// ─── Singleton State ──────────────────────────────────────────────────────────

let parserInstance: Parser | null = null;
let cppLanguage: Language | null = null;
let initPromise: Promise<void> | null = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize the Tree-sitter parser with the C++ grammar.
 * Safe to call multiple times — only initializes once.
 * Must be called (and awaited) before `parseCpp()`.
 */
export async function initParser(): Promise<void> {
  // If already initialized, return immediately
  if (parserInstance && cppLanguage) return;

  // If initialization is in progress, wait for it
  if (initPromise) return initPromise;

  // Start initialization
  initPromise = doInit();
  return initPromise;
}

/**
 * Check whether the parser has been initialized and is ready.
 */
export function isParserReady(): boolean {
  return parserInstance !== null && cppLanguage !== null;
}

/**
 * Parse a C++ source string into a Tree-sitter syntax tree.
 * Requires `initParser()` to have completed beforehand.
 *
 * @throws Error if the parser has not been initialized or parse fails
 */
export function parseCpp(code: string): Tree {
  if (!parserInstance || !cppLanguage) {
    throw new Error('Tree-sitter parser not initialized. Call and await initParser() first.');
  }

  const tree = parserInstance.parse(code);
  if (!tree) {
    throw new Error('Tree-sitter parse returned null — unexpected failure.');
  }
  return tree;
}

/**
 * Get the language instance (useful for query creation if needed later).
 */
export function getCppLanguage(): Language {
  if (!cppLanguage) {
    throw new Error('C++ language not loaded. Call initParser() first.');
  }
  return cppLanguage;
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function doInit(): Promise<void> {
  // Polyfill process.versions for web-tree-sitter compatibility in some browsers
  if (typeof process === 'undefined') {
    (window as any).process = { versions: {} };
  }
  if (typeof process !== 'undefined' && !process.versions) {
    (process as any).versions = {};
  }

  try {
    // Detect if running in Node.js (test environment) vs browser
    const isNode =
      typeof process !== 'undefined' &&
      process.versions != null &&
      process.versions.node != null;

    // Resolve WASM file paths based on environment
    const resolveWasmPath = (filename: string): string => {
      if (isNode) {
        // In Node.js: resolve relative to the project root's public/ directory
        // @ts-ignore — process.cwd() is Node-only
        return `${process.cwd()}/public/${filename}`;
      }
      // In browser: Vite serves public/ assets from root
      return `/${filename}`;
    };

    // Initialize the Tree-sitter WASM runtime
    await Parser.init({
      locateFile(scriptName: string) {
        return resolveWasmPath(scriptName);
      },
    });

    // Create a parser instance
    parserInstance = new Parser();

    // Load the C++ grammar WASM
    cppLanguage = await Language.load(resolveWasmPath('tree-sitter-cpp.wasm'));

    // Set the language on the parser
    parserInstance.setLanguage(cppLanguage);
  } catch (error) {
    // Reset state on failure so a retry is possible
    parserInstance = null;
    cppLanguage = null;
    initPromise = null;
    throw new Error(
      `Failed to initialize Tree-sitter C++ parser: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
