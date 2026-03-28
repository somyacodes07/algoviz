# The C++ Transpiler Engine

Visualizing C++ in a browser is hard for a very specific reason: the thing students want to see is **runtime state**, not just final machine output.

Traditional browser-side C++ strategies usually revolve around compiling code through a heavyweight native-style toolchain into WebAssembly. That can absolutely run fast, but it is a poor fit for an educational visualizer because the program's internal variables, call stack frames, and line-by-line transitions become difficult to inspect in a friendly JavaScript UI.

AlgoViz takes a different path.

Instead of trying to faithfully reproduce all of native C++ semantics, AlgoViz targets the subset of C++ that shows up constantly in Data Structures and Algorithms practice, parses it structurally, translates it into equivalent JavaScript, and then feeds that JavaScript through the exact same tracing system used by the JavaScript visualizer.

## The High-Level Pipeline

When you press **Run** on C++ code, AlgoViz follows this browser-native pipeline:

```text
C++ source
  -> Tree-sitter parser in WASM
  -> structural AST
  -> C++ to JS transformer
  -> generated JavaScript
  -> instrumentation sandbox
  -> isolated Web Worker execution
  -> timeline snapshots for the React UI
```

This architecture is powerful because each phase stays inspectable:

- The parser gives us structure instead of regex guesses.
- The transformer gives us room to preserve algorithmic intent.
- The JavaScript target gives us a debuggable runtime.
- The sandbox gives us the line-by-line state history the UI needs.

## Why AlgoViz Does Not Use "Compile Native C++ and Hope"

There are two central tradeoffs:

1. **Native-style compilation is great for execution, but not ideal for educational introspection.**
   Once code becomes low-level output, it is much harder to explain variable snapshots and source-level logic in a browser UI.

2. **Full C++ is enormous.**
   The language, standard library, memory model, templates, and compiler behavior are far broader than what most DSA teaching flows need.

AlgoViz therefore optimizes for:

- recursion
- arrays and vectors
- loops
- maps, sets, queues, stacks, and priority queues
- integer arithmetic
- control flow clarity

That trade is intentional. The goal is not to become a production-grade C++ compiler. The goal is to make algorithm behavior visible and teachable.

## Phase 1: WASM Parsing with Tree-sitter

The browser loads Tree-sitter's WebAssembly runtime together with the C++ grammar. From there, AlgoViz parses the user's code into a queryable syntax tree.

That matters because syntax trees let us reason about meaning:

- where declarations happen
- what type a variable was declared as
- whether a loop is index-based or range-based
- which method is being called on a container
- whether an expression should preserve integer semantics

This is a huge upgrade over regex-based rewriting. Regex can sometimes patch simple snippets, but it quickly breaks down once nesting, templates, or multi-line control flow appear.

## Phase 2: AST Transformation Mapping

The `transformer.ts` layer walks the syntax tree and emits JavaScript with the same algorithmic behavior.

Typical examples include:

- `std::vector<int> arr;` -> `let arr = [];`
- `queue<int> q;` -> `let q = [];`
- `for (auto x : vec)` -> `for (let x of vec)`
- `push_back()` -> `push()`
- `pop_back()` -> `pop()`
- `size()` -> `length`
- `.front()` -> `[0]`
- queue-style `.erase(.begin())` patterns -> `.shift()`

The transformer is especially useful for DSA code because those snippets tend to be structural and repetitive. Once the parser knows the shape of the source, mapping it into readable JavaScript is usually far more reliable than students expect.

## Phase 3: Integer Math Preservation

One of the most important jobs of the C++ engine is preserving integer behavior.

C++ integer division and JavaScript number division are not the same. In JavaScript, numbers are floating point values by default, so expressions like:

```cpp
int mid = (left + right) / 2;
num /= 10;
```

would become dangerously wrong if translated naïvely. A binary search midpoint turning into `2.5` instead of `2` is enough to break loop conditions, indexing, and recursion depth logic.

AlgoViz addresses this by tracking integer-like variables and wrapping the corresponding transformed arithmetic in `Math.trunc()` where needed:

```javascript
let mid = Math.trunc((left + right) / 2);
num = Math.trunc(num / 10);
```

This keeps common algorithm behavior aligned with what students expect from C++.

## Concrete Translation Example

Consider this small C++ snippet:

```cpp
vector<int> nums = {5, 3, 8};
sort(nums.begin(), nums.end());
int mid = (left + right) / 2;
```

AlgoViz aims to preserve its meaning in a form closer to:

```javascript
let nums = [5, 3, 8];
nums.sort((a, b) => a - b);
let mid = Math.trunc((left + right) / 2);
```

Once this JavaScript shape exists, the rest of the platform can instrument it exactly like any handwritten JS snippet.

## Phase 4: Code Generation

After transformation, the engine emits a JavaScript string. This is the bridge between the C++ world and the visualizer runtime.

At this point:

- structural C++ constructs have been rewritten
- key semantics like integer division have been preserved
- the result is now compatible with the tracing sandbox

The generated JavaScript is not the final student-facing product. It is an internal execution artifact that unlocks the next stage.

## Phase 5: Instrumentation and Worker Execution

The generated JavaScript is then handed to the instrumentation layer, which injects trace checkpoints and safety guards before execution.

That means a C++ snippet ultimately becomes:

```text
C++ source
  -> transformed JavaScript
  -> tracer-instrumented JavaScript
  -> worker execution
  -> timeline frames
  -> visual playback
```

This is the real reason the browser approach works: once the code is transformed into a runtime the UI can inspect, the visualizer can expose every important teaching primitive:

- current line
- variable snapshots
- call stack depth
- console output
- error states

## What Subset of C++ Is the Engine Targeting?

AlgoViz currently focuses on the subset that dominates interview prep, homework, and classroom DSA sessions:

- primitive scalar types
- vectors and nested vectors
- maps and sets
- queues, stacks, and priority queues
- loops, branching, and recursion
- standard algorithm patterns like sorting and traversal

This is why the system works well for:

- binary search
- BFS and DFS
- Dijkstra
- merge sort
- quick sort
- dynamic programming tables
- recursion-heavy backtracking

## Why This Approach Works Well for Education

For a teaching product, the winning question is not "Can it execute arbitrary C++?" The better question is:

> Can it show students what their algorithm is doing right now?

The current engine says yes for the cases that matter most in learning:

- state-rich algorithms
- container-heavy code
- recursion and stack growth
- pointer-like index movement
- loops whose behavior depends on integer arithmetic

## Current Tradeoffs

This approach is strong, but intentionally scoped.

You should think of the current engine as:

- structural rather than native
- pedagogical rather than universal
- optimized for algorithm walkthroughs rather than systems programming

That is a feature, not a bug. By staying focused, AlgoViz can provide a clean, understandable experience instead of pretending to be a complete C++ toolchain.

## In One Sentence

AlgoViz achieves C++ visualization in the browser by parsing a DSA-friendly subset of C++ into a syntax tree, transforming that structure into JavaScript, instrumenting the result, and replaying its runtime state through a visual timeline.
