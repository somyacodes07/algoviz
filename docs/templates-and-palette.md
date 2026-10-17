# Educational Template Library & Palette

AlgoViz is built for learning. Writing 50 lines of Dijkstra's algorithm from scratch just to watch it execute can be tedious. The Template Library gives you instant access to runnable examples.

## Quick Search Command Palette

Press `Cmd/Ctrl + K` or click the **Templates** button to open the command palette.

### Intelligent Meta-Tagging

Search isn't limited to exact title matches. Every template in the system (`frontend/templates/`) is annotated with a `tags: string[]` property. This means:

- Searching `"heap"` surfaces **Dijkstra's Shortest Path**
- Searching `"tortoise"` surfaces **Linked List Cycle Detection**
- Searching `"brute"` surfaces brute-force algorithm variants

The fuzzy matching makes the palette useful even when you think in concepts rather than exact algorithm names.

## Built-in Algorithm Implementations

The library includes 50+ templates designed for visual clarity, available in both **JavaScript** and **C++**:

### Arrays & Strings
- Find Maximum
- Reverse Array In-Place
- Two Sum (Sorted Pointers)
- Valid Palindrome
- Maximum Subarray (Sliding Window)
- Longest Substring Without Repeating Characters

### Data Structures
- Linked List Reverse (Interactive nodes)
- Linked List Cycle Detection
- Valid Parentheses via Stack
- Array Frequency Counter (Hash Maps)
- Trie (Insert & Search)
- LRU Cache
- Union-Find (Disjoint Set)

### Search & Sorting
- Binary Search (O(log n))
- Merge Sort, Quick Sort (O(n log n))
- Selection Sort, Insertion Sort, Bubble Sort (O(n²))
- Heap Sort
- Counting Sort

### Graph & Trees
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra's Shortest Path
- A* Pathfinding
- Bellman-Ford
- Binary Search Tree Construction and In-order Traversal
- Binary Tree Invert (Mirror)
- Binary Tree Level Order Traversal

### Dynamic Programming, Math & Recursion
- Climbing Stairs (Fibonacci Sequence Tabulation)
- Coin Change
- 0/1 Knapsack
- N-Queens Backtracking
- Sieve of Eratosthenes (Prime Numbers)
- Euclidean Algorithm (GCD)

## C++ Template Design

C++ templates work with either configured compiler strategy:

- **Wasm Clang mode**: Compiles and executes inside the browser. Offline use requires the compiler bundle to be available; initialization errors can fall back to Wandbox.
- **Wandbox mode**: Sends instrumented source to the remote GCC service and requires network access.

## Complexity Visibility

Each template is crafted so that the **Complexity Analysis** panel can accurately detect the algorithm's time complexity. For example:

- Bubble Sort templates produce clear O(n²) hotspot patterns
- Binary Search templates show O(log n) hit distributions
- BFS/DFS templates demonstrate linear traversal signatures
