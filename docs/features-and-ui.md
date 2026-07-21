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

AlgoViz automatically maps memory state to the appropriate visual representations:
- **Array & 1D Vector**: Renders as a grid of memory cells or an interactive bar chart. Tracks standard algorithmic pointers (`i`, `j`, `left`, `right`, `mid`, etc.).
- **2D Array / Matrix**: Visualized as a 2D grid, rendering nested arrays or vectors perfectly.
- **Linked Lists**: Infers `.next` chaining to render linear memory graphs with cycle detection.
- **Binary Trees**: Reconstructs hierarchical structure recursively by traversing `.left` and `.right` pointers.
- **Heaps**: Renders 1D arrays as Binary Heap trees (Min-Heap / Max-Heap) based on index math (`2*i+1`, `2*i+2`).
- **Hash Maps / Sets**: Displays unique keys and values in organized bucket grids for constant-time lookups.
- **Trie (Prefix Tree)**: Connects node character properties via `.children` object mappings into dynamic prefix trees.
- **Graph Visualizer**: Analyzes adjacency matrices and neighbor arrays to draw nodes with directed SVG arrows and Bezier curves for bidirectional edges.

## 10. Share Feature

Click the **Share** button to generate a shareable URL that encodes your current code, making it easy to share algorithms with classmates or students.

## 11. Preferences & Settings Panel

Click the gear icon in the Workbench header to open the Preferences dialog:
- **Permanent Theme Accent**: Toggle between **Auto** (language-adaptive saffron/blue theme transition), **Saffron** (JavaScript-styled orange Neo-Brutalist look), or **Blue** (C++ styled blue look) to pin your preferred layout style.
- **C++ Compiler Strategy**: Toggle between **Wandbox Remote API** (runs compilation on external high-performance compilers over the network) and **WebAssembly Clang Engine** (runs a 30MB Clang compiler bundle directly inside your browser's local sandbox, offline-ready). Hovering over each option reveals a custom tooltip explaining trade-offs.
- **Default Array Rendering**: Configure 1D array visualizers to display standard **Memory Cells** or clean numeric **Bar Charts** (height proportional to value).

## 12. Enlarged Diagram View (Zoomable & Pannable Modal)

Click the Maximize icon (`Maximize2`) on visualizers (Tree, Graph, List, Grid/Matrix) to open a high-resolution, full-screen overlay modal with a blurred background:
- **Interactive Panning**: Click and drag your mouse cursor to slide and reposition large tree node structures or matrix grids.
- **Dynamic Zooming**: Scroll your mouse wheel or use trackpad pinch-to-zoom to scale the diagrams up and down smoothly.
- **Floating HUD controls**: Use the on-screen buttons to **Zoom In**, **Zoom Out**, **Reset Pan/Zoom**, and **Close** the modal.
- **Keyboard Shortcuts**: Focus the modal and use:
  - `Escape` key to close the overlay.
  - `+` / `-` keys to zoom in and out.
  - `0` key to reset translation and scale.
  - `Arrow Keys` (`Up`, `Down`, `Left`, `Right`) to pan the viewport step-by-step.

## 13. Variables Sparkline Graphing

Traces the historical value of numeric variables over the execution timeline, drawing mini inline SVG sparkline trendlines with gradient area fills next to variable values. Helps quickly identify sorting swaps, monotonic trends, and nested loops counters.

## 14. Virtual Stack Frame Variables

Reconstructs local variables inside Call Stack frame cards by walking backward dynamically. Traces recursive parameters (e.g., recursive `low`, `high`, `mid` values in binary searches, or coordinates in DFS backtracking) across every stack frame simultaneously.

## 15. Sticky Note Annotations

A built-in markdown editor that lets you attach notes to specific execution steps.
- **Step-Aware**: Notes are tied to the execution timeline. When playback hits a step with an attached note, it smoothly pops up in the workspace.
- **Markdown Support**: Render `code snippets`, bold text, lists, and links.
- **Persistent State**: Notes are securely saved in `localStorage` and tied to the underlying source code's hash, so they are restored when you revisit the same algorithm.

## 16. Embed Mode

You can securely embed the entire visualizer experience inside an `iframe` or applications like Notion.
- Append `?embed=true` to the URL.
- This strips away the top navigation header and locks the visualizer into a clean, minimalist UI optimized for educational content integration.

