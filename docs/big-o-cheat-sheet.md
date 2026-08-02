# Big-O Complexity Cheat Sheet & Formula Reference

Understanding asymptotic notation and runtime performance is essential for mastering Data Structures & Algorithms. AlgoViz automatically evaluates time complexity at runtime, but this guide breaks down the underlying formulas, recurrence relations, and algorithm complexity bounds.

---

## 1. Asymptotic Notation Overview

| Notation | Name | Mathematical Definition | Intuition |
| :--- | :--- | :--- | :--- |
| **$O(f(n))$** | **Big-O (Upper Bound)** | $T(n) \le c \cdot f(n)$ for all $n \ge n_0$ | Worst-case execution guarantee |
| **$\Omega(f(n))$** | **Big-Omega (Lower Bound)** | $T(n) \ge c \cdot f(n)$ for all $n \ge n_0$ | Best-case execution guarantee |
| **$\Theta(f(n))$** | **Big-Theta (Tight Bound)** | $c_1 f(n) \le T(n) \le c_2 f(n)$ | Precise growth rate |

---

## 2. Growth Rate Hierarchy (Fastest to Slowest)

$$O(1) < O(\log n) < O(n) < O(n \log n) < O(n^2) < O(n^3) < O(2^n) < O(n!)$$

```
Operations (N = 100)
--------------------------------------------------------------------------
O(1)        : 1 operation         (Constant)
O(log N)    : ~7 operations       (Logarithmic - Binary Search)
O(N)        : 100 operations      (Linear - Single Loop)
O(N log N)  : ~700 operations     (Linearithmic - QuickSort / MergeSort)
O(N^2)      : 10,000 operations   (Quadratic - Nested Loops)
O(2^N)      : 1.26 x 10^30 ops    (Exponential - Recursive Subsets)
```

---

## 3. Data Structure Operations Matrix

| Data Structure | Access | Search | Insertion | Deletion | Space Complexity |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Array** | $O(1)$ | $O(n)$ | $O(n)$ | $O(n)$ | $O(n)$ |
| **Stack / Queue** | $O(n)$ | $O(n)$ | $O(1)$ | $O(1)$ | $O(n)$ |
| **Singly Linked List** | $O(n)$ | $O(n)$ | $O(1)$ | $O(1)$ | $O(n)$ |
| **Doubly Linked List** | $O(n)$ | $O(n)$ | $O(1)$ | $O(1)$ | $O(n)$ |
| **Hash Table** | N/A | $O(1)$ avg | $O(1)$ avg | $O(1)$ avg | $O(n)$ |
| **Binary Search Tree (BST)** | $O(\log n)$ avg | $O(\log n)$ avg | $O(\log n)$ avg | $O(\log n)$ avg | $O(n)$ |
| **AVL Tree / Red-Black Tree** | $O(\log n)$ | $O(\log n)$ | $O(\log n)$ | $O(\log n)$ | $O(n)$ |
| **Binary Heap** | $O(1)$ max/min | $O(n)$ | $O(\log n)$ | $O(\log n)$ | $O(n)$ |

---

## 4. Sorting Algorithms Complexity Matrix

| Sorting Algorithm | Best Case | Average Case | Worst Case | Space Complexity | Stable? |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Quick Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | No |
| **Merge Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | Yes |
| **Heap Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(1)$ | No |
| **Bubble Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | Yes |
| **Selection Sort** | $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | No |
| **Insertion Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | Yes |

---

## 5. Recurrence Relations & Master Theorem

For divide-and-conquer recurrences of the form:

$$T(n) = a \cdot T\left(\frac{n}{b}\right) + f(n)$$

Where $a \ge 1$ and $b > 1$:

1. **Case 1:** If $f(n) = O(n^{\log_b a - \epsilon})$, then $T(n) = \Theta(n^{\log_b a})$.
2. **Case 2:** If $f(n) = \Theta(n^{\log_b a})$, then $T(n) = \Theta(n^{\log_b a} \log n)$.
3. **Case 3:** If $f(n) = \Omega(n^{\log_b a + \epsilon})$, then $T(n) = \Theta(f(n))$.

---

## 6. How AlgoViz Estimates Complexity Live

1. **Loop Statement Tracking:** AlgoViz tracks loop step frequencies and nested depths.
2. **Hotspot Line Heatmaps:** Glowing heatmaps highlight lines hit thousands of times.
3. **AST Structure Walking:** Acorn AST parser identifies logarithmic splits, linear scans, and quadratic loop nests.
