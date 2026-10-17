# Introduction to AlgoViz

Welcome to the **AlgoViz** documentation.

AlgoViz is an interactive code execution visualizer designed to make algorithm state visible while a program is running. Instead of forcing students to mentally simulate loops, recursion, and container mutations, the app turns execution into something they can watch.

## What Problem AlgoViz Is Solving

Most beginners do not struggle because they cannot read syntax. They struggle because they cannot yet connect:

- a line of code
- the variables currently in memory
- the active call stack frame
- the console output that appears later
- the algorithm's changing shape over time

AlgoViz exists to collapse that gap.

The product is especially useful when teaching or learning:

- recursion
- sorting algorithms
- graph traversal
- pointer-style index movement
- dynamic programming tables
- debugging logic mistakes step by step
- understanding time complexity through visualization

## The Core Philosophy

AlgoViz is not trying to be a full IDE debugger replacement.

It is trying to be a **state-first learning surface**. That means the most important questions always stay visible:

- What line is active right now?
- What variables changed?
- Which function called this one?
- What is on the call stack?
- What did the program print at this moment?
- What is the time complexity of this algorithm?

This is also why the interface leans toward bold contrast, strong panel boundaries, and obvious hierarchy. The design is meant to feel instructional and confident rather than minimal for its own sake.

## How the Platform Processes Code

Internally, AlgoViz treats source code differently based on the language:

### JavaScript
```
Source code → Acorn AST → tracer injection → Web Worker → timeline → UI
```

### C++ (Local Wasm option)
```
Source code → Tree-sitter AST → __trace() injection → Wasm Clang Engine (Local Browser) → timeline → UI
```

### C++ (Remote Wandbox option)
```
Source code → Tree-sitter AST → __trace() injection → Wandbox API (Remote GCC) → timeline → UI
```

The current default is Wandbox. If local Wasm is selected, an engine initialization failure falls back to Wandbox. A compiler error is returned as an error rather than retried remotely.

## Why the Browser Matters

AlgoViz deliberately runs in the browser because that makes the experience:

- immediate
- shareable
- deployment-light
- classroom-friendly

JavaScript execution runs in a browser worker. C++ uses the compiler strategy selected in Settings: Wandbox is the current default, while Wasm Clang provides local execution when its compiler bundle is available. Wasm mode can fall back to Wandbox if the local engine fails to initialize.

## What Makes AlgoViz Different

Four product choices define the platform:

1. **Timeline over black-box execution**
   Every run aims to produce a replayable history, not just a final answer.

2. **Two C++ compiler strategies**
   Choose local WebAssembly Clang or remote Wandbox GCC. The Wasm strategy can fall back to Wandbox when the local engine is unavailable.

3. **Complexity estimates with trace context**
   JavaScript estimates use source structure and C++ estimates use runtime traces. Treat them as learning aids, not proofs of asymptotic bounds.

4. **Algorithm-aware UX**
   Templates, pointer tracking, stack views, and state panels are built around the kinds of code students actually practice.

## Documentation Structure

The docs are organized around the same layers the app uses internally:

- [Setup & Installation](./setup-guide.md) — Getting the project running locally
- [Features & UI Layouts](./features-and-ui.md) — What each panel does and how the workbench works
- [C++ Execution Engine](./cpp-engine.md) — How C++ is compiled and traced in the browser
- [Instrumentation Sandbox](./instrumentation-sandbox.md) — How code becomes an observable timeline
- [Complexity Analysis](./complexity-analysis.md) — How time complexity is estimated
- [Template Library & Palette](./templates-and-palette.md) — Pre-built algorithm examples
- [Architecture Reference](./architecture.md) — Technical module and data flow overview

If you want the shortest path through the architecture:

1. Start with the C++ engine if you want to understand how browser-side C++ visualization works.
2. Continue to the instrumentation sandbox to see how traces become timeline frames.
3. Check complexity analysis to understand the Big-O estimation system.
4. Finish with the UI and template docs to understand how those traces turn into the teaching experience.
