# Complexity & Telemetry Analysis

AlgoViz provides **live time and auxiliary space complexity estimation** for both JavaScript and C++ code. The Perf tab in the workbench displays estimated Big-O notations, interactive SVG growth curves, hotspot heatmaps, and call stack metrics.

## How It Works

The complexity analyzer uses two complementary strategies depending on the language:

### JavaScript: AST-Based Analysis

For JavaScript code, AlgoViz uses [Acorn](https://github.com/acornjs/acorn) to parse the source into an Abstract Syntax Tree and then walks the tree to detect:

- **Loop nesting depth**: Each `for`, `while`, `do-while` adds a nesting level
- **Logarithmic loop updates**: Detects `i *= 2`, `i /= 2`, `i >>= 1` patterns
- **Recursive functions**: Identifies self-calling functions and branching recursion
- **Sort calls**: Recognizes `.sort()` as an O(n log n) signal
- **Geometric body mutations**: Detects multiplication/division inside loop bodies

### C++: Timeline-Based Heuristic

Since Acorn cannot parse C++ source code, AlgoViz infers complexity from the **runtime execution trace**:

1. **Hot-line detection**: Lines executed more than once are identified as loop bodies
2. **Input size estimation**: Examines array/vector sizes from the first timeline step
3. **Loop depth inference**: Compares the most-hit line's count against the input size
   - `hits ≈ n` → O(n)
   - `hits ≈ n²` → O(n²)
   - `hits ≈ log₂(n)` → O(log n)
4. **Sort detection**: Scans the C++ source text for `sort(` patterns
5. **Logarithmic pattern matching**: Checks if hit counts follow log-scale growth

### Auxiliary Space Analysis

In addition to Time Complexity, AlgoViz estimates **Auxiliary Space Complexity**:
- **Stack Memory O(h)**: Evaluates peak call stack frames during recursive execution
- **Dynamic Heap Memory O(n)**: Evaluates vector, array, hash map, and matrix allocations
- **In-Place O(1)**: Confirms when only primitive scalar variables and registers are allocated

## Complexity Tab UI

The Perf panel displays telemetry metrics:

| Metric | Description |
|---|---|
| **Time Complexity** | Estimated Big-O time growth (e.g., `O(n²)`) with interactive sparkline curve |
| **Auxiliary Space** | Estimated Big-O memory overhead (e.g., `O(1)` or `O(n)`) |
| **Operations Seen** | Total number of traced execution steps |
| **Unique Lines** | Count of distinct source lines that were executed |
| **Peak Stack** | Maximum call stack depth reached during execution |
| **Hot Line** | The most frequently executed source code line number |
| **Hotspot Heatmap** | Color-coded severity bar chart of top executed lines |

## Estimation Benchmarks

| Algorithm | Time Complexity | Auxiliary Space | Status |
|---|---|---|---|
| Array Traversal | O(n) | O(1) | Verified ✓ |
| Binary Search | O(log n) | O(1) | Verified ✓ |
| Two Sum (Brute Force) | O(n²) | O(1) | Verified ✓ |
| Bubble Sort | O(n²) | O(1) | Verified ✓ |
| Merge Sort | O(n log n) | O(n) | Verified ✓ |
| Fibonacci (Recursive) | O(2^n) | O(n) | Verified ✓ |

## Confidence Levels

The analyzer assigns a confidence rating to each estimate:

- **High**: Strong structural evidence from nested loops, AST trees, or stack metrics
- **Medium**: Single loop or recursive pattern detected
- **Low**: No clear loop/recursion structure found (defaults to O(1))
