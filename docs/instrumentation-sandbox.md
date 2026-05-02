# Instrumentation Sandbox

The instrumentation sandbox is the layer that transforms ordinary code into code that continuously reports its runtime state. Without it, the UI would have no timeline to replay.

## Two Instrumentation Paths

AlgoViz uses different instrumentation strategies depending on the language and engine:

### Path 1: JavaScript (and C++ Fallback)

```
JavaScript source (or transpiled C++ output)
  → Acorn AST walk
  → __tracer.step() injection
  → Protected Web Worker execution
  → Timeline snapshots
  → Visual playback in React
```

### Path 2: C++ via Wandbox

```
C++ source
  → Tree-sitter AST walk
  → __trace() injection (source-to-source)
  → POST to Wandbox (real GCC)
  → Parse __TRACE__ JSON blocks from stdout
  → Timeline snapshots
  → Visual playback in React
```

## JavaScript Instrumentation

### Step 1: Parse the JavaScript Shape

AlgoViz uses **Acorn** to parse the final JavaScript into an Abstract Syntax Tree. That gives the system precise knowledge about statements, expressions, loops, function bodies, and nested scope boundaries.

### Step 2: Inject Tracing Hooks

The `instrumenter.ts` service walks the AST and injects calls such as:

```javascript
__tracer.step(line, variables);
```

The sandbox also manages:

1. **Expression and variable tracking** — Execution checkpoints capture the current scope so the UI can render variable panels and highlight changes.
2. **Loop protection** — `for`, `while`, and `do...while` flows are guarded so runaway algorithms do not freeze the product.
3. **Call stack entry and exit** — Functions are wrapped so recursion depth and nested calls appear cleanly in the stack view.

### Step 3: Run in an Isolated Web Worker

After instrumentation, AlgoViz executes the final code inside `executor.worker.ts`.

The worker provides:
- Main UI thread stays responsive
- Infinite loops can be terminated cleanly
- Runtime failures can be converted into structured timeline errors
- Dangerous globals are blocked (`fetch`, `WebSocket`, `XMLHttpRequest`, etc.)

## C++ Instrumentation

### Source-to-Source Transformation

The C++ instrumenter (`cppInstrumenter.ts`) takes a fundamentally different approach: instead of converting C++ to another language, it keeps the code in C++ and injects tracing calls that produce JSON output to stdout.

Key capabilities:
- **Scope-aware**: Tracks variable declarations across nested scopes, including for-loop iterators
- **STL serialization**: Converts vectors, maps, stacks, queues, and pairs to JSON strings
- **Non-destructive**: The instrumented code is still valid C++ that compiles with any standard compiler

### Trace Protocol

Each `__trace()` call outputs a JSON block wrapped in sentinel markers:

```
__TRACE__{"line": 7, "variables": {"arr": [5, 3, 8], "maxVal": 5}}__TRACE__
```

The executor strips these from stdout and parses them into Timeline entries.

## Timeline Structure

A single timeline entry contains:

- The active line number (1-indexed)
- A deep-cloned variable snapshot
- A call stack array
- Newly produced console logs (delta, not full history)
- Optional error information

The frontend reconstructs full console history during playback to minimize worker memory usage.

## Infinite Loop Protection

AlgoViz defaults to a capped step count (2000 steps) so broken logic does not lock the tab:

- **Web Worker path**: The tracer's `step()` function throws after exceeding the limit
- **Wandbox path**: The execution timeout is handled by the API and the fetch timeout

In both cases, partial timeline data is preserved so students get diagnostic context.

## Error Handling Strategy

The sandbox separates several failure modes:

| Error Type | Description |
|---|---|
| `transpile` | C++ → JS transformation failed |
| `instrument` | JS AST instrumentation failed |
| `runtime` | Code threw during execution |
| `timeout` | Step or time limit exceeded |
| `worker` | Web Worker crashed |

For C++ via Wandbox, errors are further categorized:
- **Network errors** → Trigger automatic fallback to local transpiler
- **Compiler errors** → Shown directly to the user in the Console Panel

## Why This Layer Matters for Learning

The instrumentation sandbox turns AlgoViz from a code editor into a visual teaching system. With it, you can:

- Scrub backward and forward through execution
- Compare state between steps
- See recursive expansion
- Understand when logs appear
- Detect exactly where logic diverges

That replayable visibility is the foundation of the entire product.
