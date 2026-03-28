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

## The Core Philosophy

AlgoViz is not trying to be a full IDE debugger replacement.

It is trying to be a **state-first learning surface**. That means the most important questions always stay visible:

- What line is active right now?
- What variables changed?
- Which function called this one?
- What is on the call stack?
- What did the program print at this moment?

This is also why the interface leans toward bold contrast, strong panel boundaries, and obvious hierarchy. The design is meant to feel instructional and confident rather than minimal for its own sake.

## How the Platform Thinks About Source Code

Internally, AlgoViz treats source code as a pipeline:

```text
Source code
  -> parse and normalize
  -> instrument runtime checkpoints
  -> execute in a protected worker
  -> return timeline snapshots
  -> replay those snapshots in the UI
```

For JavaScript, the path is relatively direct.

For C++, AlgoViz adds an extra structural translation stage so browser-side visualization is still possible without losing source-level introspection.

## Why the Browser Matters

AlgoViz deliberately runs in the browser because that makes the experience:

- immediate
- shareable
- deployment-light
- classroom-friendly

There is no heavy backend execution service required for the normal visualization flow. The parser, instrumentation, and runtime sandbox all live close to the UI so the product can stay responsive and easy to deploy.

## What Makes AlgoViz Different

Three product choices define the platform:

1. **Timeline over black-box execution**
   Every run aims to produce a replayable history, not just a final answer.

2. **Educational C++ support**
   Instead of ignoring C++ entirely, AlgoViz translates the DSA-heavy subset into a runtime the browser can explain visually.

3. **Algorithm-aware UX**
   Templates, pointer tracking, stack views, and state panels are built around the kinds of code students actually practice.

## Documentation Structure

The docs are organized around the same layers the app uses internally:

- [Setup & Installation](./setup-guide.md)
- [Features & UI Layouts](./features-and-ui.md)
- [C++ Execution Engine](./cpp-engine.md)
- [Instrumentation Sandbox](./instrumentation-sandbox.md)
- [Template Library & Palette](./templates-and-palette.md)

If you want the shortest path through the architecture:

1. Start with the C++ engine if you want to understand how browser-side C++ visualization works.
2. Continue to the instrumentation sandbox to see how traces become timeline frames.
3. Finish with the UI and template docs to understand how those traces turn into the teaching experience.
