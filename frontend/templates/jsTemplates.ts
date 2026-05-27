import { CodeTemplate } from '../codeTemplates';

export const JS_TEMPLATES: CodeTemplate[] = [
  // ==============================
  // ARRAYS & STRINGS
  // ==============================
  {
    name: 'Find Maximum',
    category: 'Arrays & Strings',
    description: 'Find the largest element in an array',
    language: 'javascript',
    tags: ['array', 'max', 'search', 'linear', 'loop'],
    code: `// Find Maximum Element
let arr = [12, 45, 7, 23, 56, 89, 34];
let maxVal = arr[0];
let maxIndex = 0;

for (let i = 1; i < arr.length; i++) {
  console.log("Comparing", arr[i], "with current max", maxVal);
  if (arr[i] > maxVal) {
    maxVal = arr[i];
    maxIndex = i;
    console.log("New max found!");
  }
}

console.log("Maximum value is", maxVal, "at index", maxIndex);
`,
  },
  {
    name: 'Reverse Array',
    category: 'Arrays & Strings',
    description: 'Reverse an array in-place using two pointers',
    language: 'javascript',
    tags: ['array', 'two-pointers', 'reverse', 'swap', 'in-place'],
    code: `// Reverse Array In-Place
let arr = [10, 20, 30, 40, 50, 60, 70];
let left = 0;
let right = arr.length - 1;

while (left < right) {
  // Swap elements
  let temp = arr[left];
  arr[left] = arr[right];
  arr[right] = temp;
  
  console.log("Swapped elements at", left, "and", right);
  
  // Move pointers
  left++;
  right--;
}

console.log("Reversed array:", arr);
`,
  },
  {
    name: 'Two Sum',
    category: 'Arrays & Strings',
    description: 'Find pair that sums to target',
    language: 'javascript',
    tags: ['array', 'math', 'two-sum', 'brute-force', 'combinations'],
    code: `// Two Sum Problem (O(n²) approach for visibility)
let nums = [2, 7, 11, 15, 3, 6];
let target = 9;
let found = false;

for (let i = 0; i < nums.length; i++) {
  for (let j = i + 1; j < nums.length; j++) {
    let sum = nums[i] + nums[j];
    console.log("Trying", nums[i], "+", nums[j], "=", sum);
    if (sum === target) {
      console.log("Found!", nums[i], "+", nums[j], "=", target);
      found = true;
    }
  }
}
`,
  },
  {
    name: 'Valid Palindrome',
    category: 'Arrays & Strings',
    description: 'Check if a string is a palindrome using two pointers',
    language: 'javascript',
    tags: ['string', 'palindrome', 'two-pointers', 'validation'],
    code: `// Valid Palindrome (Two-Pointer Technique)
let str = "racecar";
let isPalindrome = true;
let left = 0;
let right = str.length - 1;

while (left < right) {
  console.log("Comparing", str[left], "and", str[right]);
  if (str[left] !== str[right]) {
    console.log("Mismatch found!");
    isPalindrome = false;
    break;
  }
  left++;
  right--;
}

console.log("Is Palindrome?", isPalindrome);
`,
  },
  {
    name: 'Max Subarray',
    category: 'Arrays & Strings',
    description: 'Find contiguous subarray with largest sum (Kadane’s Algo)',
    language: 'javascript',
    tags: ['array', 'sliding-window', 'kadane', 'dynamic-programming', 'max'],
    code: `// Kadane's Algorithm for Maximum Subarray
let nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
let currentMax = nums[0];
let globalMax = nums[0];

for (let i = 1; i < nums.length; i++) {
  currentMax = Math.max(nums[i], currentMax + nums[i]);
  if (currentMax > globalMax) {
    globalMax = currentMax;
    console.log("New Global Max:", globalMax, "at index", i);
  }
}

console.log("Maximum Subarray Sum is:", globalMax);
`,
  },
  {
    name: 'Longest Substring',
    category: 'Arrays & Strings',
    description: 'Find longest substring without repeating characters',
    language: 'javascript',
    tags: ['string', 'sliding-window', 'hash', 'substring', 'optimization'],
    code: `// Longest Substring Without Repeating Characters
let s = "abcabcbb";
let charMap = {};
let left = 0;
let maxLength = 0;

for (let right = 0; right < s.length; right++) {
  let char = s[right];
  console.log("Processing:", char, "Window:", s.substring(left, right + 1));
  
  if (charMap[char] >= left) {
    console.log("Duplicate found. Shrinking window from left:", left, "to", charMap[char] + 1);
    left = charMap[char] + 1;
  }
  
  charMap[char] = right;
  let currentLength = right - left + 1;
  
  if (currentLength > maxLength) {
    maxLength = currentLength;
    console.log("New Max Length:", maxLength);
  }
}

console.log("Final Maximum Length:", maxLength);
`,
  },
  {
    name: 'Matrix Traversal',
    category: 'Arrays & Strings',
    description: 'Traverse a 2D matrix in row-major order with index tracking',
    language: 'javascript',
    tags: ['array', 'matrix', 'nested-loops', 'grid', 'traversal'],
    code: `// 2D Matrix Traversal with row/col pointers
let grid = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12]
];

let rowCount = grid.length;
let colCount = grid[0].length;

for (let r = 0; r < rowCount; r++) {
  for (let c = 0; c < colCount; c++) {
    let val = grid[r][c];
    console.log("Visiting cell at row:", r, "col:", c, "Value:", val);
  }
}
`,
  },

  // ==============================
  // DATA STRUCTURES
  // ==============================
  {
    name: 'Valid Parentheses',
    category: 'Data Structures',
    description: 'Check if string has valid bracket sequences using a Stack',
    language: 'javascript',
    tags: ['stack', 'string', 'validation', 'parentheses', 'LIFO'],
    code: `// Valid Parentheses using a Stack
let s = "{[()]}";
let stack = [];
let isValid = true;

for (let i = 0; i < s.length; i++) {
  let char = s[i];
  console.log("Processing char:", char);
  
  if (char === '(' || char === '{' || char === '[') {
    stack.push(char);
    console.log("Pushed to stack. Stack:", stack);
  } else {
    if (stack.length === 0) {
      isValid = false;
      break;
    }
    
    let top = stack.pop();
    console.log("Popped", top, "to match with", char);
    
    if ((char === ')' && top !== '(') ||
        (char === '}' && top !== '{') ||
        (char === ']' && top !== '[')) {
      isValid = false;
      break;
    }
  }
}

if (stack.length > 0) isValid = false;
console.log("Is Valid?", isValid);
`,
  },
  {
    name: 'Reverse List',
    category: 'Data Structures',
    description: 'Iteratively reverse a singly linked list using Node classes',
    language: 'javascript',
    tags: ['linked-list', 'pointers', 'reverse', 'node', 'iterative'],
    code: `// Reverse a Linked List
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Create list: 1 -> 2 -> 3 -> null
let head = new ListNode(1, new ListNode(2, new ListNode(3)));
let prev = null;
let curr = head;

console.log("Starting reversal...");

while (curr !== null) {
  let nextTemp = curr.next; // Store next node
  curr.next = prev;         // Reverse the link
  console.log("Reversed link for Node", curr.val);
  
  // Advance pointers
  prev = curr;
  curr = nextTemp;
}

head = prev; // New head
console.log("Reversal complete. New head is Node", head.val);
`,
  },
  {
    name: 'Detect Cycle',
    category: 'Data Structures',
    description: 'Floyd’s Tortoise and Hare Cycle Detection',
    language: 'javascript',
    tags: ['linked-list', 'two-pointers', 'cycle', 'floyd', 'tortoise-hare'],
    code: `// Detect Cycle using Floyd's Tortoise and Hare
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Create a cyclic list
let head = new ListNode(1);
let node2 = new ListNode(2);
let node3 = new ListNode(3);
let node4 = new ListNode(4);

head.next = node2;
node2.next = node3;
node3.next = node4;
node4.next = node2; // Creating a cycle back to 2!

let slow = head;
let fast = head;
let hasCycle = false;

// We use a counter just to prevent infinite execution in visualizers if it fails
let steps = 0; 
while (fast !== null && fast.next !== null && steps < 20) {
  slow = slow.next;
  fast = fast.next.next;
  console.log("Slow at:", slow.val, "| Fast at:", fast.val);
  
  if (slow === fast) {
    hasCycle = true;
    console.log("Cycle detected at Node", slow.val);
    break;
  }
  steps++;
}

console.log("Does list have cycle?", hasCycle);
`,
  },

  // ==============================
  // SEARCH & SORT
  // ==============================
  {
    name: 'Binary Search',
    category: 'Search & Sort',
    description: 'O(log n) search in sorted array',
    language: 'javascript',
    tags: ['search', 'binary-search', 'array', 'logarithmic', 'divide-conquer'],
    code: `// Binary Search Algorithm
let arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
let target = 23;
let low = 0;
let high = arr.length - 1;
let result = -1;

while (low <= high) {
  let mid = Math.floor((low + high) / 2);
  console.log("Checking index", mid, "value", arr[mid]);
  
  if (arr[mid] === target) {
    console.log("Target found at index", mid);
    result = mid;
    break;
  }
  
  if (arr[mid] < target) {
    console.log("Target is larger, moving low pointer up.");
    low = mid + 1;
  } else {
    console.log("Target is smaller, moving high pointer down.");
    high = mid - 1;
  }
}

console.log("Binary Search Result:", result);
`,
  },
  {
    name: 'Merge Sort',
    category: 'Search & Sort',
    description: 'Classic divide and conquer recursive sequence sort',
    language: 'javascript',
    tags: ['sort', 'merge-sort', 'recursion', 'divide-conquer', 'O(nlogn)'],
    code: `// Merge Sort
function merge(left, right) {
  let result = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    if (left[i] < right[j]) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }
  
  console.log("Merged:", result.concat(left.slice(i)).concat(right.slice(j)));
  return result.concat(left.slice(i)).concat(right.slice(j));
}

function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  
  let mid = Math.floor(arr.length / 2);
  let left = mergeSort(arr.slice(0, mid));
  let right = mergeSort(arr.slice(mid));
  
  return merge(left, right);
}

let numbers = [38, 27, 43, 3, 9, 82, 10];
console.log("Original:", numbers);
let sorted = mergeSort(numbers);
console.log("Sorted:", sorted);
`,
  },
  {
    name: 'Quick Sort',
    category: 'Search & Sort',
    description: 'Fast, partition-based recursive sort',
    language: 'javascript',
    tags: ['sort', 'quick-sort', 'recursion', 'partition', 'divide-conquer'],
    code: `// Quick Sort
function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    let pivotIndex = partition(arr, left, right);
    console.log("Array after partition at index", pivotIndex, ":", [...arr]);
    quickSort(arr, left, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, right);
  }
  return arr;
}

function partition(arr, left, right) {
  let pivot = arr[right];
  let i = left - 1;
  
  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      i++;
      let temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }
  
  let temp = arr[i + 1];
  arr[i + 1] = arr[right];
  arr[right] = temp;
  
  return i + 1;
}

let arr = [64, 34, 25, 12, 22, 11, 90];
quickSort(arr);
console.log("Final sorted:", arr);
`,
  },
  {
    name: 'Selection Sort',
    category: 'Search & Sort',
    description: 'Simple O(n²) sorting algorithm finding min repeatedly',
    language: 'javascript',
    tags: ['sort', 'selection-sort', 'array', 'loops', 'O(n2)'],
    code: `// Selection Sort
let arr = [64, 25, 12, 22, 11];

for (let i = 0; i < arr.length - 1; i++) {
  let minIdx = i;
  for (let j = i + 1; j < arr.length; j++) {
    if (arr[j] < arr[minIdx]) {
      minIdx = j;
    }
  }
  
  console.log("Swapping", arr[i], "with new min", arr[minIdx]);
  let temp = arr[minIdx];
  arr[minIdx] = arr[i];
  arr[i] = temp;
}

console.log("Sorted array:", arr);
`,
  },
  {
    name: 'Insertion Sort',
    category: 'Search & Sort',
    description: 'Build sorted array one element at a time',
    language: 'javascript',
    tags: ['sort', 'insertion-sort', 'array', 'loops', 'O(n2)'],
    code: `// Insertion Sort
let arr = [12, 11, 13, 5, 6];

for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;

    // Move elements of arr[0..i-1], that are greater than key,
    // to one position ahead of their current position
    while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        j = j - 1;
        console.log("Shifting elements. Array now:", [...arr]);
    }
    arr[j + 1] = key;
    console.log("Inserted key", key, "Array now:", [...arr]);
}

console.log("Sorted array:", arr);
`,
  },

  // ==============================
  // GRAPHS & TREES
  // ==============================
  {
    name: 'BST Insertion & Traversal',
    category: 'Graphs & Trees',
    description: 'Insert into Binary Search Tree and In-order traverse',
    language: 'javascript',
    tags: ['tree', 'bst', 'binary-search-tree', 'traversal', 'in-order', 'recursion'],
    code: `// Binary Search Tree (BST)
class TreeNode {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
    }
}

function insert(root, val) {
    if (root === null) return new TreeNode(val);
    
    if (val < root.val) {
        root.left = insert(root.left, val);
    } else {
        root.right = insert(root.right, val);
    }
    return root;
}

function inorder(root, result = []) {
    if (root !== null) {
        inorder(root.left, result);
        result.push(root.val);
        inorder(root.right, result);
    }
    return result;
}

let root = null;
let vals = [50, 30, 20, 40, 70, 60, 80];

for (let val of vals) {
    console.log("Inserting", val);
    root = insert(root, val);
}

let sortedVals = inorder(root);
console.log("Inorder Traversal (Sorted):", sortedVals);
`,
  },
  {
    name: 'Breadth-First Search (BFS)',
    category: 'Graphs & Trees',
    description: 'Level-order traversal of a graph using a Queue',
    language: 'javascript',
    tags: ['graph', 'bfs', 'breadth-first-search', 'queue', 'traversal'],
    code: `// Graph BFS Traversal
const graph = {
  'A': ['B', 'C'],
  'B': ['A', 'D', 'E'],
  'C': ['A', 'F'],
  'D': ['B'],
  'E': ['B', 'F'],
  'F': ['C', 'E']
};

let queue = ['A'];
let visited = new Set(['A']);
let result = [];

console.log("Starting BFS from node A");

while (queue.length > 0) {
  let current = queue.shift(); // Dequeue
  console.log("Visiting node:", current);
  result.push(current);
  
  for (let neighbor of graph[current]) {
    if (!visited.has(neighbor)) {
      console.log("Queueing unvisited neighbor:", neighbor);
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }
}

console.log("BFS Traversal Order:", result);
`,
  },
  {
    name: 'Depth-First Search (DFS)',
    category: 'Graphs & Trees',
    description: 'Recursive depth traversal of a graph',
    language: 'javascript',
    tags: ['graph', 'dfs', 'depth-first-search', 'recursion', 'traversal'],
    code: `// Graph DFS Traversal
const graph = {
  'A': ['B', 'C'],
  'B': ['A', 'D', 'E'],
  'C': ['A', 'F'],
  'D': ['B'],
  'E': ['B', 'F'],
  'F': ['C', 'E']
};

let visited = new Set();
let result = [];

function dfs(node) {
  if (visited.has(node)) return;
  
  console.log("Visiting node:", node);
  visited.add(node);
  result.push(node);
  
  for (let neighbor of graph[node]) {
    dfs(neighbor);
  }
}

console.log("Starting DFS from node A");
dfs('A');

console.log("DFS Traversal Order:", result);
`,
  },
  {
    name: "Dijkstra's Shortest Path",
    category: 'Graphs & Trees',
    description: 'Find shortest paths from a source to all nodes in a weighted graph',
    language: 'javascript',
    tags: ['graph', 'dijkstra', 'shortest-path', 'greedy', 'weighted'],
    code: `// Dijkstra's Algorithm (Using simple array minimum for queue logic)
const graph = {
  'A': { 'B': 4, 'C': 2 },
  'B': { 'C': 5, 'D': 10 },
  'C': { 'E': 3 },
  'D': { 'F': 11 },
  'E': { 'D': 4 },
  'F': {}
};

const distances = {};
const visited = new Set();
// Initialize all to Infinity
for (let node in graph) {
    distances[node] = Infinity;
}
distances['A'] = 0; // Source

while (visited.size < Object.keys(graph).length) {
    // Find unvisited node with minimum distance
    let current = null;
    for (let node in distances) {
        if (!visited.has(node)) {
            if (current === null || distances[node] < distances[current]) {
                current = node;
            }
        }
    }
    
    if (current === null || distances[current] === Infinity) break;
    
    visited.add(current);
    console.log("Locked shortest path for node", current, ":", distances[current]);
    
    // Update neighbors
    for (let neighbor in graph[current]) {
        let weight = graph[current][neighbor];
        let newDist = distances[current] + weight;
        if (newDist < distances[neighbor]) {
            console.log("Found shorter path to", neighbor, "via", current, "Cost:", newDist);
            distances[neighbor] = newDist;
        }
    }
}

console.log("Final Distances from A:", distances);
`,
  },

  // ==============================
  // DYNAMIC PROGRAMMING
  // ==============================
  {
    name: 'Climbing Stairs',
    category: 'Dynamic Programming',
    description: 'Fibonacci-style tabulation',
    language: 'javascript',
    tags: ['dp', 'dynamic-programming', 'fibonacci', 'tabulation', 'bottom-up'],
    code: `// Fibonacci Sequence / Climbing Stairs (Tabulation)
let n = 5; // steps
let dp = Array(n + 1).fill(0);

dp[1] = 1;
dp[2] = 2;

console.log("Base cases: dp[1] = 1, dp[2] = 2");

for (let i = 3; i <= n; i++) {
  dp[i] = dp[i - 1] + dp[i - 2];
  console.log("Calculated dp[" + i + "] =", dp[i]);
}

console.log("\\nNumber of ways to climb", n, "stairs:", dp[n]);
`,
  },
  {
    name: 'Coin Change',
    category: 'Dynamic Programming',
    description: 'Find minimum coins to make an amount',
    language: 'javascript',
    tags: ['dp', 'dynamic-programming', 'coin-change', 'tabulation', 'minimization'],
    code: `// Coin Change (Minimum Coins DP)
let coins = [1, 2, 5];
let amount = 11;

// Initialize DP array with a max value
let dp = Array(amount + 1).fill(amount + 1);
dp[0] = 0;

for (let currentAmount = 1; currentAmount <= amount; currentAmount++) {
  console.log("Calculating min coins for amount:", currentAmount);
  for (let coin of coins) {
    if (currentAmount - coin >= 0) {
      let newCount = dp[currentAmount - coin] + 1;
      if (newCount < dp[currentAmount]) {
        dp[currentAmount] = newCount;
      }
    }
  }
}

let result = dp[amount] > amount ? -1 : dp[amount];
console.log("Min coins needed for amount", amount, "is", result);
`,
  },
  {
    name: '0/1 Knapsack',
    category: 'Dynamic Programming',
    description: 'Find maximum value to pack within weight limit',
    language: 'javascript',
    tags: ['dp', 'dynamic-programming', 'knapsack', 'tabulation', 'optimization'],
    code: `// 0/1 Knapsack Problem
let weights = [1, 2, 3];
let values = [6, 10, 12];
let W = 5;

// dp[i][w] = max value with first i items and capacity w
let dp = Array(weights.length + 1).fill(0).map(() => Array(W + 1).fill(0));

for (let i = 1; i <= weights.length; i++) {
    for (let w = 1; w <= W; w++) {
        if (weights[i - 1] <= w) {
            dp[i][w] = Math.max(
                dp[i - 1][w],
                dp[i - 1][w - weights[i - 1]] + values[i - 1]
            );
        } else {
            dp[i][w] = dp[i - 1][w];
        }
    }
    console.log("DP row for item", i, "completed:", dp[i]);
}

console.log("Maximum Knapsack Value:", dp[weights.length][W]);
`,
  },
  {
    name: 'N-Queens Backtracking',
    category: 'Dynamic Programming',
    description: 'Solve the N-Queens placement problem via backtracking',
    language: 'javascript',
    tags: ['recursion', 'backtracking', 'n-queens', 'matrix', 'search'],
    code: `// N-Queens Problem via Backtracking
const N = 4;
let board = Array(N).fill(0).map(() => Array(N).fill('.'));
let solutions = [];

function isSafe(row, col) {
    // Check column
    for (let i = 0; i < row; i++) {
        if (board[i][col] === 'Q') return false;
    }
    // Check upper left diagonal
    for (let i = row, j = col; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] === 'Q') return false;
    }
    // Check upper right diagonal
    for (let i = row, j = col; i >= 0 && j < N; i--, j++) {
        if (board[i][j] === 'Q') return false;
    }
    return true;
}

function solveNQueens(row) {
    if (row === N) {
        solutions.push(board.map(r => [...r]));
        console.log("Found valid board setup!");
        return;
    }
    
    for (let col = 0; col < N; col++) {
        if (isSafe(row, col)) {
            board[row][col] = 'Q'; // Place queen
            solveNQueens(row + 1);
            board[row][col] = '.'; // Backtrack
        }
    }
}

console.log("Starting N-Queens Solver for N =", N);
solveNQueens(0);
console.log("Total Solutions:", solutions.length);
`,
  },
  {
    name: 'Minimum Size Subarray Sum',
    category: 'Arrays & Strings',
    description: 'Sliding window O(N) evaluation finding smallest subarray summing >= target',
    language: 'javascript',
    tags: ['array', 'sliding-window', 'optimization', 'minimum'],
    code: `// Minimum Size Subarray Sum (Sliding Window)
let target = 7;
let nums = [2, 3, 1, 2, 4, 3];
let n = nums.length;
let minLen = n + 1;
let left = 0;
let currentSum = 0;

console.log("Target sum:", target);
for (let right = 0; right < n; right++) {
  currentSum += nums[right];
  console.log("Right pointer at index", right, "value", nums[right], "currentSum:", currentSum);

  while (currentSum >= target) {
    let len = right - left + 1;
    console.log("-> CurrentSum >= Target! Subarray found from index", left, "to", right, "(len=" + len + ")");
    minLen = Math.min(minLen, len);
    
    console.log("-> Shrinking window: subtracting index", left, "value", nums[left]);
    currentSum -= nums[left];
    left++;
  }
}

let result = minLen === n + 1 ? 0 : minLen;
console.log("Minimum length of subarray sum >= target is:", result);
`,
  },
  {
    name: 'Queue using Stacks',
    category: 'Data Structures',
    description: 'Simulate LIFO-based queue operations utilizing two stack arrays',
    language: 'javascript',
    tags: ['stack', 'queue', 'data-structure', 'buffer'],
    code: `// Queue implementation using two Stacks
class Queue {
  constructor() {
    this.s1 = [];
    this.s2 = [];
  }

  enqueue(x) {
    console.log("Enqueuing:", x);
    this.s1.push(x);
  }

  dequeue() {
    if (this.s1.length === 0 && this.s2.length === 0) {
      console.log("Queue is empty!");
      return -1;
    }

    if (this.s2.length === 0) {
      console.log("Moving elements from Stack 1 to Stack 2...");
      while (this.s1.length > 0) {
        this.s2.push(this.s1.pop());
      }
    }

    let val = this.s2.pop();
    console.log("Dequeued:", val);
    return val;
  }
}

let q = new Queue();
q.enqueue(10);
q.enqueue(20);
q.enqueue(30);
q.dequeue();
q.enqueue(40);
q.dequeue();
q.dequeue();
q.dequeue();
`,
  },
  {
    name: 'Merge Two Sorted Lists',
    category: 'Data Structures',
    description: 'Merge two sorted linked lists recursively',
    language: 'javascript',
    tags: ['linked-list', 'merge', 'pointers', 'recursion'],
    code: `// Merge Two Sorted Lists
function Node(val) {
  this.val = val;
  this.next = null;
}

function mergeLists(l1, l2) {
  if (!l1) return l2;
  if (!l2) return l1;

  console.log("Comparing Node(" + l1.val + ") and Node(" + l2.val + ")");
  if (l1.val <= l2.val) {
    console.log(l1.val, "<=", l2.val, "- choosing", l1.val, "and merging remaining next");
    l1.next = mergeLists(l1.next, l2);
    return l1;
  } else {
    console.log(l1.val, ">", l2.val, "- choosing", l2.val, "and merging remaining next");
    l2.next = mergeLists(l1, l2.next);
    return l2;
  }
}

let l1 = new Node(1);
l1.next = new Node(3);
l1.next.next = new Node(5);

let l2 = new Node(2);
l2.next = new Node(4);
l2.next.next = new Node(6);

console.log("Merging lists...");
let mergedHead = mergeLists(l1, l2);
`,
  },
  {
    name: 'Flood Fill (Grid DFS)',
    category: 'Graphs & Trees',
    description: 'DFS traversal to change matching connected components on 2D grid',
    language: 'javascript',
    tags: ['matrix', 'grid', 'dfs', 'flood-fill', 'recursion'],
    code: `// Grid Flood Fill (DFS)
let grid = [
  [1, 1, 1, 0, 0],
  [1, 1, 0, 1, 1],
  [1, 0, 0, 1, 0],
  [0, 0, 1, 1, 1]
];

function dfs(r, c, oldColor, newColor) {
  let rows = grid.length;
  let cols = grid[0].length;

  if (r < 0 || r >= rows || c < 0 || c >= cols) return;
  if (grid[r][c] !== oldColor || grid[r][c] === newColor) return;

  console.log("Filling cell (" + r + "," + c + ") from color " + oldColor + " to " + newColor);
  grid[r][c] = newColor;

  dfs(r + 1, c, oldColor, newColor);
  dfs(r - 1, c, oldColor, newColor);
  dfs(r, c + 1, oldColor, newColor);
  dfs(r, c - 1, oldColor, newColor);
}

console.log("Initial grid color at (1,1):", grid[1][1]);
dfs(1, 1, 1, 2);
console.log("Flood fill completed.");
`,
  },
];

