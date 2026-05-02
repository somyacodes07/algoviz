# The C++ Execution Engine

## Overview

AlgoViz uses a **dual-engine architecture** for C++ execution that combines the best of both worlds: real GCC compilation for accuracy and a local transpiler for offline resilience.

## Execution Flow

```
C++ Source Code
  ├─ PRIMARY: Wandbox API (Online)
  │    ├─ Tree-sitter parses C++ into AST
  │    ├─ Source-to-source instrumenter injects __trace() calls
  │    ├─ Instrumented code sent to Wandbox (real GCC)
  │    ├─ __TRACE__ JSON blocks parsed from stdout
  │    └─ Timeline + Complexity Analysis returned to UI
  │
  └─ FALLBACK: Local Transpiler (Offline)
       ├─ Tree-sitter parses C++ into AST
       ├─ Transformer maps C++ → JavaScript
       ├─ Acorn instruments the JS with tracer hooks
       ├─ Sandboxed Web Worker executes instrumented JS
       └─ Timeline + Complexity Analysis returned to UI
```

## Primary Engine: Wandbox API

When you press **Run** on C++ code, AlgoViz follows this pipeline:

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

### 2. Remote Compilation (`wandboxExecutor.ts`)

The instrumented code is sent to [Wandbox](https://wandbox.org/api/compile.json) for compilation with GCC.

```json
{
  "compiler": "gcc-head",
  "code": "<instrumented C++ source>",
  "stdin": "",
  "save": false
}
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

## Fallback Engine: Local Transpiler

If Wandbox is unreachable (no internet, API rate-limited, or server down), AlgoViz automatically falls back to the local C++ → JavaScript transpiler.

### When Fallback Activates

| Scenario | Engine Used |
|---|---|
| Online, Wandbox responds | Wandbox (GCC) |
| No internet / Wandbox 5xx | Local transpiler |
| Wandbox returns compiler error | Error shown to user (no fallback) |
| Tree-sitter init fails | Local transpiler |

### Transpiler Pipeline

1. **Parse**: Tree-sitter WASM parses C++ into a syntax tree
2. **Transform**: Maps DSA-friendly C++ patterns to JavaScript equivalents
3. **Instrument**: Acorn injects `__tracer.step()` hooks into the JS
4. **Execute**: Runs in an isolated Web Worker with timeout protection

### Transpiler Mappings

| C++ | JavaScript |
|---|---|
| `vector<int> arr;` | `let arr = [];` |
| `queue<int> q;` | `let q = [];` |
| `for (auto x : vec)` | `for (let x of vec)` |
| `push_back()` | `push()` |
| `size()` | `length` |
| `.front()` | `[0]` |
| `int mid = (l+r)/2;` | `let mid = Math.trunc((l+r)/2);` |
| `sort(v.begin(), v.end())` | `v.sort((a,b) => a-b)` |

## Complexity Analysis for C++

Since Acorn (the JS parser) cannot parse C++ source code, AlgoViz uses a **timeline-based heuristic** to estimate complexity:

1. **Hot-line detection**: Lines hit more than once are identified as loop bodies
2. **Input size estimation**: Array/vector sizes from the first timeline step
3. **Loop depth inference**: Compares max hit count against input size to estimate nesting
4. **Sort detection**: Scans source text for `sort()` calls
5. **Logarithmic detection**: Checks if hot-line hits match log₂(n) patterns

This produces accurate estimates for common DSA patterns: O(n), O(n²), O(n log n), O(log n).

## In One Sentence

AlgoViz executes C++ through real GCC compilation with source-to-source instrumentation, falling back to a local transpiler when offline, and provides full variable tracing, console output, and complexity analysis for both paths.
