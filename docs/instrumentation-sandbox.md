# Instrumentation Sandbox

After your code (whether raw JS, or transpiled from C++) is ready, AlgoViz injects tracing checkpoints using an AST parser called **Acorn**.

## Interception Logic

The \`instrumenter.ts\` service translates your codebase into an Abstract Syntax Tree. It then systematically traverses the AST tree to inject sandbox tracking signals:

1. **Expressions & Variable Tracking**: Before and after every expression evaluates, an injector block of \`__tracer.step(line, variables);\` is appended, logging the entire snapshot of memory context.
2. **Infinite Loop Protection**: All \`for\`, \`while\`, and \`do...while\` constructs are wrapped. Under the hood, a \`__tracer.checkLoop()\` boundary limits infinite-running processes to maximum 2,000 steps.
3. **Call Stack Tracking**: All functions are nested inside \`try { ... } finally { __tracer.exit(); }\` closures, cleanly managing recursive trees so your \`Fibonacci\` branching visualizations push and pop deterministically.

## The Web Worker Evaluator

The final `eval()` or `new Function()` sandbox strictly runs inside a **Web Worker** (\`executor.worker.ts\`). This prevents infinite algorithms from ever locking up the main React DOM thread.

Once the Web Worker reaches 2,000 computational "steps", it terminates securely and returns the Timeline Object containing the arrays of scope dictionaries directly to your frontend Visualizer!
