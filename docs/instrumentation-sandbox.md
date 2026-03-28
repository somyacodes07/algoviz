# Instrumentation Sandbox

Once AlgoViz has runnable JavaScript, the next challenge is not execution. The real challenge is **making execution observable**.

That is what the instrumentation sandbox does.

Its job is to turn ordinary code into code that continuously reports:

- the current source line
- visible variables
- the active call stack
- console output
- runtime failure state

## Where the Sandbox Sits

The sandbox comes after parsing and transformation:

```text
JavaScript source
or transformed C++ output
  -> Acorn AST walk
  -> tracer injection
  -> protected worker evaluation
  -> timeline snapshots
  -> visual playback in React
```

This is the layer that makes the visualizer possible. Without instrumentation, the UI would have no timeline to replay.

## Step 1: Parse the JavaScript Shape

AlgoViz uses **Acorn** to parse the final JavaScript into an Abstract Syntax Tree.

That gives the system precise knowledge about:

- statements
- expressions
- loops
- function bodies
- nested scope boundaries

Once the code is structural, the sandbox can insert tracing behavior in deterministic places instead of relying on brittle string hacks.

## Step 2: Inject Tracing Hooks

The `instrumenter.ts` service walks the AST and injects calls such as:

```javascript
__tracer.step(line, variables);
```

These calls are what allow the system to record state after meaningful execution points.

The sandbox also manages:

1. **Expression and variable tracking**
   Execution checkpoints capture the current scope so the UI can render variable panels and highlight changes.

2. **Loop protection**
   `for`, `while`, and `do...while` flows are guarded so runaway algorithms do not freeze the product.

3. **Call stack entry and exit**
   Functions are wrapped so recursion depth and nested calls appear cleanly in the stack view.

## Step 3: Run in an Isolated Web Worker

After instrumentation, AlgoViz executes the final code inside `executor.worker.ts`.

That worker matters for both safety and product quality:

- the main UI thread stays responsive
- infinite loops can be terminated cleanly
- runtime failures can be converted into structured timeline errors

The worker also blocks or shadows dangerous globals where possible so user code cannot freely treat the visualizer like a general browser environment.

## Step 4: Build the Timeline

During execution, the tracer constructs a timeline of snapshots.

A single timeline entry generally contains:

- the active line number
- a deep-cloned variable snapshot
- a call stack array
- newly produced console logs
- optional error information

That distinction between **new logs** and **full console history** is important. The worker stores console output incrementally, and the frontend reconstructs the full history when it renders playback. This helps reduce worker memory bloat.

## Infinite Loop Protection

AlgoViz defaults to a capped step count so broken logic does not lock the tab forever.

If an algorithm never terminates, the worker can:

- stop execution
- emit a structured timeout or loop-limit error
- preserve the partial history that was already captured

This is especially helpful for students because they still get diagnostic context instead of a total UI hang.

## Why the Worker Model Is So Valuable

The Web Worker architecture gives AlgoViz three major wins:

1. **Safety**
   The main interface is protected from blocking execution.

2. **Recoverability**
   The app can terminate or report bad runs without refreshing the page.

3. **Replay**
   The worker returns data, not UI state, so React can focus entirely on rendering and playback.

## Error Handling Strategy

The sandbox separates several failure modes so the product can explain what went wrong:

- transpilation failure
- instrumentation failure
- runtime failure
- timeout or loop-limit failure
- worker crash

This separation is important in a teaching tool because "your code crashed" is not nearly as useful as "the transpiler could not map this C++ construct" or "the loop exceeded the safety step limit."

## Why This Layer Matters for Learning

The instrumentation sandbox is what turns AlgoViz from a code editor into a visual teaching system.

Without it, you could still run code.

With it, you can:

- scrub backward and forward
- compare state between steps
- see recursive expansion
- understand when logs appear
- detect exactly where logic diverges

That replayable visibility is the foundation of the entire product.
