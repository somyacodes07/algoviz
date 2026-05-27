# Features & UI Layouts

AlgoViz uses a **Neo-Brutalist Developer's Workbench** design with bold typography, high contrast borders, and precise geometric layouts. The UI leverages the **Native View Transitions API** for seamless, hardware-accelerated dark/light mode toggling, creating a stunning visual experience without sacrificing performance.

## 1. Step-by-Step Execution

The timeline playback system lets you:

- **Play/Pause** through execution automatically
- **Step forward/backward** one statement at a time
- **Scrub** the timeline slider to jump to any point
- **Adjust speed** from slow (detailed study) to fast (overview)
- **Reset** to re-run with the same code

## 2. Live Variables Panel

The Variables tab shows all in-scope variables updating in real time:

- Scalars display with their current value
- Arrays and vectors render as indexed blocks
- Objects and maps display as key-value pairs
- Changed values are highlighted on each step

## 3. Algorithmic Array Pointers

AlgoViz scans your variable scope for common algorithmic pointers:
- `i`, `j`, `k`
- `left`, `right`, `lo`, `hi`, `low`, `high`
- `mid`, `pivot`

These render as **Emerald Green Tags** above array columns, letting you physically watch sliding windows shrink, pivots swap, and binary searches narrow.

## 4. Complexity Analysis Panel

The Complexity tab provides live time complexity estimation:

- **Big-O notation** estimated from AST analysis (JS) or timeline heuristics (C++)
- **Operations count** showing total traced steps
- **Unique lines** executed
- **Peak stack depth** for recursion analysis
- **Hot-line heatmap** showing which lines run most frequently
- Works for **both JavaScript and C++**

## 5. Command Palette Templates

Press `Cmd+K` to launch the **Templates Command Palette**:

- **Search & Sort**: Quick Sort, Bubble Sort, Merge Sort, Binary Search
- **Data Structures**: Linked List traversals, Stack implementations
- **Graphs**: BFS, DFS, Dijkstra
- **Math**: Sieve of Eratosthenes, Fibonacci
- Available for both JavaScript and C++

## 6. Monaco Code Editor

Microsoft's Monaco Editor provides:

- Full syntax highlighting for JavaScript and C++
- The active line highlights as the execution cursor steps through time
- Dark mode support

## 7. Call Stack View

The Call Stack tab dynamically visualizes function call depth:

- Watch recursive trees branch and collapse
- See Fibonacci DFS or dynamic programming branches expand
- Track which function is currently executing

## 8. Console Output

The Console panel replays `console.log` (JS) and `cout` (C++) output:

- Output appears at the exact step it was emitted
- Error messages display with distinct styling
- Long output is gracefully truncated

## 9. Data Structure Visualizers

- **Graph Visualizer**: Analyzes adjacency matrices to draw nodes with directed SVG arrows and Bezier curves for bidirectional edges
- **Linked Lists**: Infers `.next` chaining to render linear memory graphs with cycle detection

## 10. Share Feature

Click the **Share** button to generate a shareable URL that encodes your current code, making it easy to share algorithms with classmates or students.

## 11. Preferences & Settings Panel

Click the gear icon in the Workbench header to open the Preferences dialog:
- **Permanent Theme Accent**: Toggle between Auto (Language-adaptive saffron/blue), Saffron (JavaScript orange theme), or Blue (C++ blue theme).
- **C++ Compiler Strategy**: Toggle between remote GCC Wandbox API and offline-ready local WebAssembly compiler (online vs offline trade-offs explained on hover).
- **Default Array Rendering**: Configure array visualizers to display standard memory cells or clean numeric bar charts.

## 12. Enlarged Diagram View

Click the Maximize icon (`Maximize2`) on visualizers (Tree, Graph, List, Grid) to open a full-screen, blurred-backdrop modal view, making it easy to inspect large data structures on high-resolution screens.

## 13. Variables Sparkline Graphing

Traces the history of numeric variables over the execution timeline, drawing mini inline SVG sparkline trendlines with gradient area fills next to variable values.

## 14. Virtual Stack Frame Variables

Reconstructs local variables inside Call Stack frame cards by searching backward dynamically, allowing you to trace recursive parameter states across every call stack frame simultaneously.

