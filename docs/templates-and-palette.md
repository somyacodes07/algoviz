# Educational Template Library & Palette

AlgoViz is built for learning! Writing 50 lines of Dijkstra's algorithm from scratch just to watch it execute can be tedious for students and teachers. 

To solve this, we've built a robust, highly modular **Template Library** loaded with the most fundamental Data Structures and Algorithm (DSA) patterns across both **JavaScript** and **C++**.

## Quick Search Command Palette
The UI features a stunning, keyboard-accessible command palette (`Cmd/Ctrl + K` or by clicking the **Templates** button). 

### Intelligent Meta-Tagging
Search isn't limited to just reading the title of the snippet. Every template in the internal system (`frontend/templates/`) is heavily annotated with a `tags: string[]` property!
This means if a student searches for `"heap"`, the engine intelligently surfaces the **Dijkstra's Shortest Path** template, and searching `"tortoise"` will surface the **Linked List Cycle Detection** algorithm, even if the word isn't explicitly in the title!

## Built-in Algorithm Implementations

Our categorized library currently includes more than 35 finely-tuned templates designed specifically for visual clarity in the Sandbox:

### Arrays & Strings
- Find Maximum
- Reverse Array In-Place
- Two Sum (Sorted Pointers)
- Valid Palindrome
- Maximum Subarray (Sliding Window)
- Longest Substring Without Repeating Characters

### Structures
- Linked List Reverse (Interactive nodes)
- Linked List Cycle Detection
- Valid Parentheses via Stack
- Array Frequency Counter (Hash Maps)

### Search & Sorting
- Binary Search (O(log n))
- Merge Sort, Quick Sort (O(n log n))
- Selection Sort, Insertion Sort, Bubble Sort (O(n^2))

### Graph & Trees
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra's Shortest Path
- Binary Search Tree Construction and In-order Traversal

### Dynamic Programming & Recursion
- Climbing Stairs (Fibonacci Sequence Tabulation)
- Coin Change
- 0/1 Knapsack
- N-Queens Backtracking

## Engine Tuning
Our C++ templates are specifically authored to prioritize syntax structures that the AlgoViz `Tree-Sitter Transpiler` elegantly supports to ensure students never hit execution roadblocks!
