# Features & UI Layouts

AlgoViz has been fundamentally redesigned into a **Developer's Workbench**. We opted for a "Neo-Brutalist" architectural layout, favoring bold typography, high contrast borders, drop shadows, and absolute geometric precision over soft, generic gradients.

## 1. Algorithmic Array Pointers

Instead of merely highlighting an array block when its value changes, AlgoViz uses advanced semantic extraction to map your loop limits to pointers. 

If you write:
\`\`\`javascript
let left = 0;
let right = arr.length - 1;
\`\`\`
AlgoViz scans your active variable scope for common algorithmic pointers:
- \`i, j, k\`
- \`left, right, lo, hi, low, high\`
- \`mid, pivot\`

It will instantly render a striking **Emerald Green Tag** above the respective Array columns. You can physically watch your sliding windows shrink, pivot elements swap, and binary searches narrow down mathematically.

## 2. Command Palette Templates

Press \`Cmd+K\` to launch the **Templates Command Palette**.
This interactive overlay filters through an expansive catalog of predefined educational algorithms spanning:
- **Search & Sort**: Quick Sort, Bubble Sort, Merge Sort, Binary Search
- **Data Structures**: Linked List traversals, Stack implementations
- **Graphs**: Breadth-First-Search (BFS), Depth-First Search (DFS)
- **Math**: Sieve of Eratosthenes

## 3. High-Fidelity Monaco Code Editor

We utilize Microsoft's Monaco Editor internally—the exact engine powering VS Code.
- Auto-completion and formatting.
- The active tracing line highlights gracefully as the execution cursor steps through time.
- Integrated Dark Mode and Light Mode (`Sun`/`Moon` Toggle) natively adapts the Monaco Theme to Saffron and Azure variants.

## 4. Protected Call Stack and Console Layouts

- The **Console Output Panel** gracefully truncates massive mathematical overflows (like trailing JS floats or string arrays) instead of shattering the CSS layout grid.
- The **Call Stack Tab** dynamically visualizes recursive trees—Watch standard Fibonacci DFS or dynamic programming branches branch out and pop from memory.
