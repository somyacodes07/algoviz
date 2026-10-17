# The C++ Execution Engine

## Overview

AlgoViz supports two C++ execution strategies: local Wasm Clang and remote Wandbox GCC. The current default is Wandbox. If Wasm is selected but cannot initialize, the executor falls back to Wandbox; compile errors do not trigger a fallback.

## Execution Flow

```
C++ Source Code
  ├─ Local Wasm Clang (selected in Settings)
  │    ├─ Tree-sitter parses C++ into AST
  │    ├─ Source-to-source instrumenter injects __trace() calls
  │    ├─ Local WebAssembly Clang compiles code in-browser
  │    ├─ Binary executes locally, printing __TRACE__ JSON
  │    └─ Timeline + Complexity Analysis returned to UI
  │
  └─ Wandbox API (default; also Wasm initialization fallback)
       ├─ Tree-sitter parses C++ into AST
       ├─ Source-to-source instrumenter injects __trace() calls
       ├─ Instrumented code POSTed to Wandbox (remote GCC)
       ├─ __TRACE__ JSON blocks parsed from stdout
       └─ Timeline + Complexity Analysis returned to UI
```

## Local Engine: Wasm Clang

When selected, the Wasm engine follows this pipeline:

### 1. Source Instrumentation (`cppInstrumenter.ts`)

The instrumenter uses Tree-sitter to parse the C++ code into an AST, then injects `__trace()` calls after every statement inside block scopes. This produces instrumented C++ that is still valid, compilable C++.

**Example input:**
```cpp
int main() {
    vector<int> arr = {5, 3, 8};
    int maxVal = arr[0];
    for (int i = 1; i < arr.size(); i++) {
        if (arr[i] > maxVal) {
            maxVal = arr[i];
        }
    }
    return maxVal;
}
```

**Instrumented output (simplified):**
```cpp
// [Trace helper header with __to_json() and __trace() definitions]

int main() {
    vector<int> arr = {5, 3, 8}; __trace(3, {{"arr", __to_json(arr)}});
    int maxVal = arr[0]; __trace(4, {{"arr", __to_json(arr)}, {"maxVal", __to_json(maxVal)}});
    for (int i = 1; i < arr.size(); i++) {
        if (arr[i] > maxVal) {
            maxVal = arr[i]; __trace(7, {{"arr", ...}, {"maxVal", ...}, {"i", ...}});
        }
    }
    __trace(10, {{"arr", ...}, {"maxVal", ...}}); return maxVal;
}
```

Key design decisions:
- **Scope tracking mirrors C++ rules**: `for(int i=...)` pushes its own scope so `i` doesn't leak into trace calls after the loop
- **Return statements**: Trace injected *before* `return` (not after dead code)
- **Only block-level statements traced**: Prevents injection inside for-loop headers or if-conditions

### 2. Local Browser Compilation (`wasmClangEngine.ts`)

The instrumented code is compiled directly within the browser using WebAssembly Clang. This provides near-native execution speed with zero network latency.

```javascript
const result = await executeWasmClangCpp(userCode, config);
```

### 3. Trace Parsing

The executed program's stdout contains `__TRACE__` blocks interleaved with normal output:

```
__TRACE__{"line": 3, "variables": {"arr": [5, 3, 8]}}__TRACE__
__TRACE__{"line": 4, "variables": {"arr": [5, 3, 8], "maxVal": 5}}__TRACE__
```

These are extracted via regex and parsed into the Timeline format that the React UI consumes.

### 4. Supported C++ Types

The trace header includes `__to_json()` overloads for:

| Type | Serialization |
|---|---|
| `int`, `double`, `float`, `bool` | Numeric/boolean JSON |
| `std::string`, `const char*` | Quoted string |
| `std::vector<T>` | JSON array `[1, 2, 3]` |
| `std::pair<T, U>` | `{"first": ..., "second": ...}` |
| `std::map<K, V>` | JSON object `{key: value, ...}` |
| `std::stack<T>` | JSON array (copied and unwound) |
| `std::queue<T>` | JSON array (copied and unwound) |
| Unknown types | `"unsupported"` fallback |

## Remote Engine: Wandbox API

When Wandbox is selected, the instrumented C++ source is sent to the Wandbox service. When Wasm is selected, the executor also uses Wandbox if the local engine fails to initialize. This sends source code to a remote service and requires network access.

### When Fallback Activates

| Scenario | Engine Used |
|---|---|
| Wandbox selected | Wandbox API (Remote GCC) |
| Wasm selected and initialized | Wasm Clang (Local) |
| Wasm initialization failure | Wandbox API (Remote GCC) |
| Selected compiler returns a compiler error | Error shown to user |

### Wandbox Pipeline

1. **Parse & Instrument**: Tree-sitter WASM parses and injects trace logic into C++.
2. **Execute**: Code is sent to the Wandbox REST API.
3. **Parse Trace**: The resulting stdout is parsed for `__TRACE__` outputs, using the same timeline format as the local path.

## Complexity Analysis for C++

Since Acorn (the JS parser) cannot parse C++ source code, AlgoViz uses a **timeline-based heuristic** to estimate complexity:

1. **Hot-line detection**: Lines hit more than once are identified as loop bodies
2. **Input size estimation**: Array/vector sizes from the first timeline step
3. **Loop depth inference**: Compares max hit count against input size to estimate nesting
4. **Sort detection**: Scans source text for `sort()` calls
5. **Logarithmic detection**: Checks if hot-line hits match log₂(n) patterns

These are heuristics for common DSA patterns, not proofs of complexity. A single run can misclassify unusual algorithms or input-dependent paths.

## In One Sentence

AlgoViz executes C++ through local WebAssembly Clang compilation directly in your browser, falling back to the remote Wandbox API when necessary, providing full variable tracing, console output, and complexity analysis for both paths.
