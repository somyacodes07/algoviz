# Complexity Analysis

AlgoViz provides **live time complexity estimation** for both JavaScript and C++ code. The Complexity tab in the workbench displays the estimated Big-O notation, hotspot heatmap, and execution statistics.

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

## Complexity Tab UI

The Complexity panel shows:

| Metric | Description |
|---|---|
| **Observed Complexity** | The estimated Big-O notation (e.g., `O(n²)`) |
| **Trace Slice** | Percentage of the total timeline currently visible |
| **Operations Seen** | Total number of traced execution steps |
| **Unique Lines** | Count of distinct source lines that were executed |
| **Peak Stack** | Maximum call stack depth during execution |
| **Hot Line** | The most frequently executed line number |
| **Hot Lines** | Heatmap bar chart of the top 6 most-hit lines |

## Estimation Examples

| Algorithm | Expected | Detected |
|---|---|---|
| Array traversal | O(n) | O(n) ✓ |
| Two Sum (brute force) | O(n²) | O(n²) ✓ |
| Binary Search | O(log n) | O(log n) ✓ |
| Bubble Sort | O(n²) | O(n²) ✓ |
| Merge Sort | O(n log n) | O(n log n) ✓ |
| Fibonacci (recursive) | O(2^n) | O(2^n) ✓ |

## Confidence Levels

The analyzer assigns a confidence level to each estimate:

- **High**: Strong structural evidence from nested loops or multiple signals
- **Medium**: Single loop or recursive pattern detected
- **Low**: No clear loop/recursion structure found (defaults to O(1))

## Limitations

- The C++ timeline heuristic requires a sufficiently large input for accurate estimation
- Very short programs (< 3 steps) may produce O(1) estimates regardless of actual complexity
- Custom iterators or non-standard loop patterns may not be detected
- The analyzer estimates *observed* complexity, which may differ from worst-case theoretical complexity
