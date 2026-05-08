# Architecture Reference

This document provides a technical overview of AlgoViz's internal architecture for contributors and developers.

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│                                                                  │
│  ┌─────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Monaco   │  │ Variables   │  │ Call     │  │ Performance  │  │
│  │ Editor   │  │ Panel       │  │ Stack    │  │ Panel        │  │
│  └────┬─────┘  └──────▲──────┘  └────▲─────┘  └──────▲───────┘  │
│       │               │              │               │          │
│       │        ┌──────┴──────────────┴───────────────┘          │
│       │        │          useExecutionEngine()                   │
│       │        │    (Timeline state + playback controls)         │
│       │        └──────────────┬──────────────────────┘          │
│       │                      │                                   │
│       ▼                      ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    executeCode()                          │   │
│  │              backend/sandbox/runtime/executor.ts          │   │
│  └─────────┬─────────────────────────────┬──────────────────┘   │
│            │                             │                       │
└────────────┼─────────────────────────────┼───────────────────────┘
             │                             │
    ┌────────▼────────┐          ┌─────────▼─────────┐
    │ C++ (Wasm Clang)│          │ JS (Web Worker) / │
    │                 │          │ C++ Fallback API  │
    │  Instrument C++ │          │                   │
    │  Compile locally│          │  JS: Instrument   │
    │  Parse traces   │          │  C++: POST to GCC │
    │                 │          │                   │
    └────────┬────────┘          └─────────┬───────────┘
             │                             │
             └──────────┬──────────────────┘
                        │
               ┌────────▼────────┐
               │ analyzeComplexity│
               │  AST or Timeline │
               │  heuristic       │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ Timeline + UI   │
               └─────────────────┘
```

## Key Modules

### Execution Router (`executor.ts`)

The central entry point for all code execution. Routes based on language:

- **C++**: Tries local Wasm Clang engine first, falls back to Wandbox API if unsupported
- **JavaScript**: Always uses Web Worker with Acorn instrumentation

### Wasm Clang Engine (`wasmClangEngine.ts`)

Handles the primary C++ pipeline:

1. Instruments C++ with `CppInstrumenter`
2. Compiles to WebAssembly directly in the browser
3. Executes and parses `__TRACE__` blocks from stdout

### Wandbox Executor (`wandboxExecutor.ts`)

Handles the C++ → Wandbox API pipeline:

1. Instruments C++ with `CppInstrumenter`
2. POSTs to `https://wandbox.org/api/compile.json`
3. Parses `__TRACE__` blocks from stdout
4. Returns categorized errors (network vs. compiler)

### C++ Instrumenter (`cppInstrumenter.ts`)

Source-to-source transformation that keeps C++ valid while adding trace output:

- Uses Tree-sitter for AST parsing
- Injects `__trace(line, {vars...})` after statements
- Tracks variable scope (including for-loop iterators)
- Prepends a helper header with `__to_json()` serialization for STL types

### Web Worker (`executor.worker.ts`)

Sandboxed execution environment for JavaScript and fallback C++:

- Blocks dangerous globals (`fetch`, `WebSocket`, etc.)
- Enforces step limits for infinite loop protection
- Uses `structuredClone` for deep variable snapshots
- Reports errors with partial timeline preservation

### Complexity Analyzer (`complexity.ts`)

Dual-mode complexity estimation:

- **JS mode**: Acorn AST walk detects loops, recursion, sort calls
- **C++ mode**: Timeline heuristic infers complexity from hit patterns
- Both modes produce the same `ComplexityAnalysis` data structure

### Tree-sitter Parser (`parser.ts`)

Singleton WASM parser for C++ grammar:

- Lazy initialization with `initParser()` 
- Browser compatibility polyfill for `process.versions`
- Used by both the instrumenter (Wandbox path) and transformer (fallback path)

## Data Flow

### Timeline Format

Every execution step produces an `ExecutionStep`:

```typescript
interface ExecutionStep {
  line: number;           // 1-indexed source line
  variables: VariableMap; // { varName: value }
  callStack: string[];    // ["main", "findMax", ...]
  consoleOutput: ConsoleLog[];
  isError?: boolean;
  errorMessage?: string;
}
```

### Console Output Strategy

The worker stores console output **incrementally** (delta per step). The frontend's `useExecutionEngine` hook reconstructs full history during playback to reduce worker memory usage.

## Error Categories

| Error Type | Source | User Experience |
|---|---|---|
| `instrument` | JS instrumentation failed | Shows instrumentation error |
| `runtime` | Code threw during execution | Shows runtime error with partial trace |
| `timeout` | Exceeded step/time limit | Shows timeout message |
| `worker` | Web Worker crashed | Shows crash message |
| `networkError` | Wandbox unreachable | Displays error if Wasm Clang is also unavailable |
| `compilerError` | Clang/GCC compilation failed | Shows compiler error in Console Panel |

## Build & Deployment

- **Dev**: `npm run dev` — Vite dev server with HMR
- **Build**: `npm run build` — Static site generation
- **Preview**: `npm run preview` — Local production preview
- **Type check**: `npx tsc --noEmit` — TypeScript validation without emit
