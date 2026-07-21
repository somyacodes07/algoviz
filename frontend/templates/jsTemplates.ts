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
  {
    name: 'Circular Linked List',
    category: 'Data Structures',
    description: 'Create and traverse a circular linked list',
    language: 'javascript',
    tags: ['linked-list', 'circular', 'pointers', 'traversal'],
    code: `// Circular Linked List: Creation and Traversal
class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

// Create a circular linked list: 10 -> 20 -> 30 -> (back to 10)
let head = new ListNode(10);
let node2 = new ListNode(20);
let node3 = new ListNode(30);

head.next = node2;
node2.next = node3;
node3.next = head; // Pointing back to head to make it circular!

console.log("Traversing circular linked list...");
let curr = head;
let steps = 0;

do {
  console.log("Visiting Node:", curr.val);
  curr = curr.next;
  steps++;
} while (curr !== head && steps < 15);

console.log("Traversal complete. Visited " + steps + " nodes.");
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

  // ==============================
  // SEARCH & SORT (New)
  // ==============================
  {
    name: 'Bubble Sort',
    category: 'Search & Sort',
    description: 'Classic O(n²) sort repeatedly swapping adjacent out-of-order elements',
    language: 'javascript',
    tags: ['sort', 'bubble-sort', 'array', 'swaps', 'O(n2)'],
    code: `// Bubble Sort
let arr = [64, 34, 25, 12, 22, 11, 90];
let n = arr.length;

console.log("Original:", [...arr]);

for (let i = 0; i < n - 1; i++) {
  let swapped = false;
  for (let j = 0; j < n - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      // Swap adjacent elements
      let temp = arr[j];
      arr[j] = arr[j + 1];
      arr[j + 1] = temp;
      swapped = true;
      console.log("Swapped", arr[j], "and", arr[j+1], "->", [...arr]);
    }
  }
  // Early exit if no swaps in this pass
  if (!swapped) {
    console.log("No swaps in pass", i + 1, "- array is sorted!");
    break;
  }
  console.log("Pass", i + 1, "complete:", [...arr]);
}

console.log("Sorted array:", arr);
`,
  },
  {
    name: 'Counting Sort',
    category: 'Search & Sort',
    description: 'O(n+k) non-comparison sort using frequency count array',
    language: 'javascript',
    tags: ['sort', 'counting-sort', 'frequency', 'O(n)', 'non-comparison'],
    code: `// Counting Sort
let arr = [4, 2, 2, 8, 3, 3, 1];
let max = Math.max(...arr);

console.log("Original:", [...arr]);
console.log("Max value:", max);

// Step 1: Build frequency count
let count = Array(max + 1).fill(0);
for (let val of arr) {
  count[val]++;
}
console.log("Frequency count:", [...count]);

// Step 2: Build prefix sum (cumulative)
for (let i = 1; i <= max; i++) {
  count[i] += count[i - 1];
  console.log("Prefix sum at index", i, ":", count[i]);
}

// Step 3: Build output array
let output = Array(arr.length);
for (let i = arr.length - 1; i >= 0; i--) {
  let val = arr[i];
  output[count[val] - 1] = val;
  count[val]--;
  console.log("Placed", val, "at position", count[val]);
}

console.log("Sorted:", output);
`,
  },
  {
    name: 'Heap Sort',
    category: 'Search & Sort',
    description: 'O(n log n) in-place sort using a max-heap',
    language: 'javascript',
    tags: ['sort', 'heap-sort', 'heap', 'max-heap', 'O(nlogn)'],
    code: `// Heap Sort (Max Heap based)
let arr = [12, 11, 13, 5, 6, 7];
let n = arr.length;

// Build max heap (heapify down)
function heapify(arr, n, i) {
  let largest = i;
  let left = 2 * i + 1;
  let right = 2 * i + 2;

  if (left < n && arr[left] > arr[largest]) largest = left;
  if (right < n && arr[right] > arr[largest]) largest = right;

  if (largest !== i) {
    let temp = arr[i];
    arr[i] = arr[largest];
    arr[largest] = temp;
    console.log("Heapify swap: index", i, "<->", largest, "Array:", [...arr]);
    heapify(arr, n, largest);
  }
}

// Phase 1: Build max heap
for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
  heapify(arr, n, i);
}
console.log("Max heap built:", [...arr]);

// Phase 2: Extract max repeatedly
for (let i = n - 1; i > 0; i--) {
  // Move current root (max) to end
  let temp = arr[0];
  arr[0] = arr[i];
  arr[i] = temp;
  console.log("Moved max", arr[i], "to position", i, "->", [...arr]);
  heapify(arr, i, 0);
}

console.log("Sorted array:", arr);
`,
  },

  // ==============================
  // MATH (New)
  // ==============================
  {
    name: 'Sieve of Eratosthenes',
    category: 'Math',
    description: 'Find all prime numbers up to N using the ancient sieve algorithm',
    language: 'javascript',
    tags: ['math', 'prime', 'sieve', 'sieve-of-eratosthenes', 'array'],
    code: `// Sieve of Eratosthenes
let N = 30;
let isPrime = Array(N + 1).fill(true);
isPrime[0] = false;
isPrime[1] = false;

console.log("Finding all primes up to", N);

for (let p = 2; p * p <= N; p++) {
  if (isPrime[p]) {
    console.log(p, "is prime — marking multiples as composite");
    for (let multiple = p * p; multiple <= N; multiple += p) {
      if (isPrime[multiple]) {
        isPrime[multiple] = false;
        console.log(" ->", multiple, "is NOT prime (multiple of", p + ")");
      }
    }
  }
}

let primes = [];
for (let i = 2; i <= N; i++) {
  if (isPrime[i]) primes.push(i);
}

console.log("Primes up to", N, ":", primes);
`,
  },
  {
    name: 'GCD (Euclidean Algorithm)',
    category: 'Math',
    description: 'Find Greatest Common Divisor using recursive Euclidean algorithm',
    language: 'javascript',
    tags: ['math', 'gcd', 'euclidean', 'recursion', 'number-theory'],
    code: `// GCD using Euclidean Algorithm
function gcd(a, b) {
  console.log("gcd(" + a + ", " + b + ")");
  if (b === 0) {
    console.log("Base case reached! GCD =", a);
    return a;
  }
  console.log("Remainder:", a % b, "-> recurse with gcd(" + b + ", " + (a % b) + ")");
  return gcd(b, a % b);
}

// Also compute LCM using GCD
function lcm(a, b) {
  return (a / gcd(a, b)) * b;
}

let a = 48, b = 18;
console.log("Computing GCD of", a, "and", b);
let result = gcd(a, b);
console.log("GCD(", a, ",", b, ") =", result);
console.log("LCM(", a, ",", b, ") =", lcm(a, b));
`,
  },
  {
    name: 'Fibonacci (Memoization)',
    category: 'Math',
    description: 'Fibonacci with top-down memoization to avoid redundant recursion',
    language: 'javascript',
    tags: ['math', 'fibonacci', 'memoization', 'top-down', 'recursion', 'dp'],
    code: `// Fibonacci with Memoization (Top-Down DP)
let memo = {};

function fibonacci(n) {
  if (n in memo) {
    console.log("Cache hit! fib(" + n + ") =", memo[n]);
    return memo[n];
  }
  if (n <= 1) {
    console.log("Base case: fib(" + n + ") =", n);
    return n;
  }
  
  console.log("Computing fib(" + n + ")...");
  let result = fibonacci(n - 1) + fibonacci(n - 2);
  memo[n] = result;
  console.log("Cached fib(" + n + ") =", result);
  return result;
}

let n = 8;
console.log("Finding Fibonacci(" + n + ")");
let answer = fibonacci(n);
console.log("\\nFibonacci(" + n + ") =", answer);
console.log("Memo table size:", Object.keys(memo).length, "entries computed");
`,
  },

  // ==============================
  // DATA STRUCTURES (New)
  // ==============================
  {
    name: 'Trie (Insert & Search)',
    category: 'Data Structures',
    description: 'Insert and search words in a Trie (prefix tree)',
    language: 'javascript',
    tags: ['trie', 'prefix-tree', 'string', 'search', 'insert'],
    code: `// Trie Data Structure
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    console.log("Inserting:", word);
    for (let char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
        console.log(" -> Created node for char:", char);
      }
      node = node.children[char];
    }
    node.isEnd = true;
    console.log(" -> Marked end of word:", word);
  }

  search(word) {
    let node = this.root;
    console.log("Searching:", word);
    for (let char of word) {
      if (!node.children[char]) {
        console.log(" -> Char", char, "not found! Word absent.");
        return false;
      }
      node = node.children[char];
    }
    let found = node.isEnd;
    console.log(" ->", word, found ? "FOUND in Trie!" : "is a prefix only, not a full word.");
    return found;
  }
}

let trie = new Trie();
trie.insert("apple");
trie.insert("app");
trie.insert("apex");
trie.search("app");
trie.search("apple");
trie.search("ap");
trie.search("bat");
`,
  },
  {
    name: 'LRU Cache',
    category: 'Data Structures',
    description: 'Least Recently Used cache using a Map to maintain insertion order',
    language: 'javascript',
    tags: ['lru', 'cache', 'map', 'data-structure', 'eviction'],
    code: `// LRU Cache Implementation
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map preserves insertion order
    console.log("LRU Cache created with capacity:", capacity);
  }

  get(key) {
    if (!this.cache.has(key)) {
      console.log("GET", key, "-> -1 (not found)");
      return -1;
    }
    // Move to end (most recently used)
    let val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    console.log("GET", key, "->", val, "(moved to most-recent)");
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key); // Remove old position
    }
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      // Evict least recently used (first in Map)
      let lruKey = this.cache.keys().next().value;
      this.cache.delete(lruKey);
      console.log("PUT", key, "=", value, "| EVICTED LRU key:", lruKey);
    } else {
      console.log("PUT", key, "=", value, "| Cache size:", this.cache.size);
    }
  }
}

let cache = new LRUCache(3);
cache.put(1, 100);
cache.put(2, 200);
cache.put(3, 300);
cache.get(1);
cache.put(4, 400); // Evicts key 2
cache.get(2);     // Returns -1
cache.get(3);
`,
  },
  {
    name: 'Union-Find (Disjoint Set)',
    category: 'Data Structures',
    description: 'Union by rank and path compression for disjoint set operations',
    language: 'javascript',
    tags: ['union-find', 'disjoint-set', 'graph', 'path-compression', 'rank'],
    code: `// Union-Find with Path Compression and Union by Rank
let parent = [0, 1, 2, 3, 4, 5];
let rank = [0, 0, 0, 0, 0, 0];

function find(x) {
  if (parent[x] !== x) {
    parent[x] = find(parent[x]); // Path compression
    console.log("Path compress: parent[" + x + "] ->", parent[x]);
  }
  return parent[x];
}

function union(x, y) {
  let rootX = find(x);
  let rootY = find(y);

  if (rootX === rootY) {
    console.log("Union(" + x + ", " + y + "): Already in same set! Root:", rootX);
    return;
  }

  // Union by rank
  if (rank[rootX] < rank[rootY]) {
    parent[rootX] = rootY;
    console.log("Union(" + x + ", " + y + "): Attach root", rootX, "under", rootY);
  } else if (rank[rootX] > rank[rootY]) {
    parent[rootY] = rootX;
    console.log("Union(" + x + ", " + y + "): Attach root", rootY, "under", rootX);
  } else {
    parent[rootY] = rootX;
    rank[rootX]++;
    console.log("Union(" + x + ", " + y + "): Equal rank, attach", rootY, "under", rootX, "new rank:", rank[rootX]);
  }
}

union(0, 1);
union(1, 2);
union(3, 4);
union(4, 5);
console.log("Are 0 and 2 connected?", find(0) === find(2));
console.log("Are 0 and 3 connected?", find(0) === find(3));
union(2, 3); // Connect the two groups
console.log("After union(2,3) - Are 0 and 5 connected?", find(0) === find(5));
`,
  },

  // ==============================
  // GRAPHS & TREES (New)
  // ==============================
  {
    name: 'Bellman-Ford',
    category: 'Graphs & Trees',
    description: 'Single-source shortest paths supporting negative weights',
    language: 'javascript',
    tags: ['graph', 'bellman-ford', 'shortest-path', 'negative-weights', 'dynamic-programming'],
    code: `// Bellman-Ford Algorithm
let vertices = 5;
let edges = [
  [0, 1, -1], [0, 2, 4],
  [1, 2, 3], [1, 3, 2], [1, 4, 2],
  [3, 2, 5], [3, 1, 1],
  [4, 3, -3]
];
// Edge format: [from, to, weight]

let dist = Array(vertices).fill(Infinity);
dist[0] = 0; // Source = node 0

console.log("Starting Bellman-Ford from node 0");

// Relax all edges V-1 times
for (let i = 0; i < vertices - 1; i++) {
  console.log("--- Relaxation round", i + 1);
  for (let [u, v, w] of edges) {
    if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
      dist[v] = dist[u] + w;
      console.log("Relaxed edge (" + u + "->" + v + " w=" + w + ") dist[" + v + "] =", dist[v]);
    }
  }
}

// Check for negative cycles
let hasNegativeCycle = false;
for (let [u, v, w] of edges) {
  if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
    hasNegativeCycle = true;
    console.log("Negative cycle detected!");
    break;
  }
}

if (!hasNegativeCycle) {
  console.log("Shortest distances from source:", dist);
}
`,
  },
  {
    name: 'Floyd-Warshall',
    category: 'Graphs & Trees',
    description: 'All-pairs shortest paths using O(V³) dynamic programming',
    language: 'javascript',
    tags: ['graph', 'floyd-warshall', 'all-pairs', 'shortest-path', 'dynamic-programming'],
    code: `// Floyd-Warshall All-Pairs Shortest Paths
const INF = Infinity;
let dist = [
  [0,   3,   INF, 7],
  [8,   0,   2,   INF],
  [5,   INF, 0,   1],
  [2,   INF, INF, 0]
];
let V = dist.length;

console.log("Running Floyd-Warshall on", V, "vertices");

for (let k = 0; k < V; k++) {
  console.log("--- Using vertex", k, "as intermediate");
  for (let i = 0; i < V; i++) {
    for (let j = 0; j < V; j++) {
      if (dist[i][k] !== INF && dist[k][j] !== INF) {
        let newDist = dist[i][k] + dist[k][j];
        if (newDist < dist[i][j]) {
          console.log("Shorter path found: " + i + "->" + j + " via " + k + " = " + newDist);
          dist[i][j] = newDist;
        }
      }
    }
  }
}

console.log("Final distance matrix:");
for (let i = 0; i < V; i++) {
  console.log("Row", i, ":", dist[i].map(d => d === INF ? "INF" : d));
}
`,
  },
  {
    name: 'Topological Sort (Kahn\'s)',
    category: 'Graphs & Trees',
    description: 'BFS-based topological ordering using in-degree counting',
    language: 'javascript',
    tags: ['graph', 'topological-sort', 'kahn', 'dag', 'bfs', 'in-degree'],
    code: `// Topological Sort using Kahn's Algorithm (BFS)
let V = 6;
let adj = {0: [1,2], 1: [3], 2: [3,4], 3: [5], 4: [5], 5: []};

// Compute in-degrees
let inDegree = Array(V).fill(0);
for (let u in adj) {
  for (let v of adj[u]) {
    inDegree[v]++;
  }
}
console.log("In-degrees:", [...inDegree]);

// Start with all 0 in-degree nodes
let queue = [];
for (let i = 0; i < V; i++) {
  if (inDegree[i] === 0) {
    queue.push(i);
    console.log("Adding node", i, "to queue (in-degree 0)");
  }
}

let order = [];
while (queue.length > 0) {
  let node = queue.shift();
  order.push(node);
  console.log("Processing node", node, "| Order so far:", [...order]);

  for (let neighbor of adj[node]) {
    inDegree[neighbor]--;
    console.log(" -> Reduced in-degree of", neighbor, "to", inDegree[neighbor]);
    if (inDegree[neighbor] === 0) {
      queue.push(neighbor);
      console.log(" -> Node", neighbor, "ready (in-degree = 0)");
    }
  }
}

if (order.length === V) {
  console.log("\\nTopological Order:", order);
} else {
  console.log("Graph has a cycle! Topological sort not possible.");
}
`,
  },
  {
    name: "Prim's MST",
    category: 'Graphs & Trees',
    description: "Greedy minimum spanning tree using Prim's algorithm",
    language: 'javascript',
    tags: ['graph', 'prim', 'mst', 'minimum-spanning-tree', 'greedy'],
    code: `// Prim's Minimum Spanning Tree Algorithm
let V = 5;
let graph = [
  [0, 2, 0, 6, 0],
  [2, 0, 3, 8, 5],
  [0, 3, 0, 0, 7],
  [6, 8, 0, 0, 9],
  [0, 5, 7, 9, 0]
];
// graph[i][j] = edge weight (0 means no edge)

let key = Array(V).fill(Infinity); // Min edge weight to reach each vertex
let inMST = Array(V).fill(false);
let parent = Array(V).fill(-1);

key[0] = 0; // Start from vertex 0
let totalWeight = 0;

for (let count = 0; count < V; count++) {
  // Find min key vertex not yet in MST
  let u = -1;
  for (let v = 0; v < V; v++) {
    if (!inMST[v] && (u === -1 || key[v] < key[u])) u = v;
  }

  inMST[u] = true;
  totalWeight += key[u];
  if (parent[u] !== -1) {
    console.log("MST Edge:", parent[u], "<->", u, "Weight:", key[u]);
  } else {
    console.log("Starting vertex:", u);
  }

  // Update keys of adjacent vertices
  for (let v = 0; v < V; v++) {
    if (graph[u][v] && !inMST[v] && graph[u][v] < key[v]) {
      key[v] = graph[u][v];
      parent[v] = u;
      console.log(" -> Updated key[" + v + "] =", key[v], "via vertex", u);
    }
  }
}

console.log("Total MST Weight:", totalWeight);
`,
  },
  {
    name: "Kruskal's MST",
    category: 'Graphs & Trees',
    description: "Greedy MST by sorting edges and using Union-Find to avoid cycles",
    language: 'javascript',
    tags: ['graph', 'kruskal', 'mst', 'union-find', 'greedy', 'minimum-spanning-tree'],
    code: `// Kruskal's Minimum Spanning Tree
let edges = [
  {u: 0, v: 1, w: 10},
  {u: 0, v: 2, w: 6},
  {u: 0, v: 3, w: 5},
  {u: 1, v: 3, w: 15},
  {u: 2, v: 3, w: 4}
];

// Sort edges by weight
edges.sort((a, b) => a.w - b.w);
console.log("Edges sorted by weight:", edges.map(e => e.u+"->"+e.v+"("+e.w+")").join(", "));

// Union-Find helpers
let parent = [0, 1, 2, 3];

function find(x) {
  if (parent[x] !== x) parent[x] = find(parent[x]);
  return parent[x];
}

function union(x, y) {
  parent[find(x)] = find(y);
}

let mst = [];
let totalWeight = 0;

for (let {u, v, w} of edges) {
  if (find(u) !== find(v)) {
    union(u, v);
    mst.push({u, v, w});
    totalWeight += w;
    console.log("Added edge", u, "<->", v, "weight", w, "| MST edges so far:", mst.length);
  } else {
    console.log("Skipped edge", u, "<->", v, "weight", w, "(would create cycle)");
  }
}

console.log("MST Total Weight:", totalWeight);
`,
  },

  // ==============================
  // DYNAMIC PROGRAMMING (New)
  // ==============================
  {
    name: 'Longest Common Subsequence',
    category: 'Dynamic Programming',
    description: 'Find LCS of two strings using 2D DP table',
    language: 'javascript',
    tags: ['dp', 'dynamic-programming', 'lcs', 'subsequence', 'string', 'tabulation'],
    code: `// Longest Common Subsequence (LCS)
let s1 = "ABCBDAB";
let s2 = "BDCAB";
let m = s1.length;
let n = s2.length;

// dp[i][j] = LCS length of s1[0..i-1] and s2[0..j-1]
let dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

for (let i = 1; i <= m; i++) {
  for (let j = 1; j <= n; j++) {
    if (s1[i - 1] === s2[j - 1]) {
      dp[i][j] = dp[i - 1][j - 1] + 1;
      console.log("Match:", s1[i-1], "at ("+i+","+j+") dp =", dp[i][j]);
    } else {
      dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
}

console.log("LCS Length:", dp[m][n]);

// Backtrack to find the actual LCS string
let lcs = "";
let i = m, j = n;
while (i > 0 && j > 0) {
  if (s1[i - 1] === s2[j - 1]) {
    lcs = s1[i - 1] + lcs;
    i--; j--;
  } else if (dp[i - 1][j] > dp[i][j - 1]) {
    i--;
  } else {
    j--;
  }
}
console.log("LCS String:", lcs);
`,
  },
  {
    name: 'Longest Increasing Subsequence',
    category: 'Dynamic Programming',
    description: 'Find LIS length using O(n²) tabulation DP',
    language: 'javascript',
    tags: ['dp', 'dynamic-programming', 'lis', 'subsequence', 'array', 'tabulation'],
    code: `// Longest Increasing Subsequence (LIS)
let nums = [10, 9, 2, 5, 3, 7, 101, 18];
let n = nums.length;

// dp[i] = length of LIS ending at index i
let dp = Array(n).fill(1);

console.log("Array:", nums);

for (let i = 1; i < n; i++) {
  for (let j = 0; j < i; j++) {
    if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
      dp[i] = dp[j] + 1;
      console.log("LIS ending at index", i, "(value "+nums[i]+") updated to", dp[i], "via index", j, "(value "+nums[j]+")");
    }
  }
}

let maxLIS = Math.max(...dp);
let maxIndex = dp.indexOf(maxLIS);

console.log("DP table:", dp);
console.log("LIS Length:", maxLIS, "(longest chain ends at index", maxIndex, "value:", nums[maxIndex]+")");
`,
  },
  {
    name: 'Edit Distance',
    category: 'Dynamic Programming',
    description: 'Minimum insertions/deletions/substitutions to transform one string to another',
    language: 'javascript',
    tags: ['dp', 'dynamic-programming', 'edit-distance', 'levenshtein', 'string'],
    code: `// Edit Distance (Levenshtein Distance)
let word1 = "horse";
let word2 = "ros";
let m = word1.length;
let n = word2.length;

// dp[i][j] = edit distance between word1[0..i-1] and word2[0..j-1]
let dp = Array(m + 1).fill(0).map((_, i) =>
  Array(n + 1).fill(0).map((_, j) => (i === 0 ? j : j === 0 ? i : 0))
);

for (let i = 1; i <= m; i++) {
  for (let j = 1; j <= n; j++) {
    if (word1[i - 1] === word2[j - 1]) {
      dp[i][j] = dp[i - 1][j - 1]; // No operation needed
    } else {
      dp[i][j] = 1 + Math.min(
        dp[i - 1][j],     // Delete from word1
        dp[i][j - 1],     // Insert into word1
        dp[i - 1][j - 1]  // Replace
      );
      console.log("Mismatch ("+word1[i-1]+" vs "+word2[j-1]+") at ("+i+","+j+") cost:", dp[i][j]);
    }
  }
}

console.log("Edit distance from '"+word1+"' to '"+word2+"':", dp[m][n]);
`,
  },
  {
    name: 'Subset Sum',
    category: 'Dynamic Programming',
    description: 'Check if any subset sums to a target using tabulation DP',
    language: 'javascript',
    tags: ['dp', 'dynamic-programming', 'subset-sum', 'boolean-dp', 'tabulation'],
    code: `// Subset Sum Problem
let set = [3, 34, 4, 12, 5, 2];
let target = 9;
let n = set.length;

// dp[i][s] = true if subset of first i elements sums to s
let dp = Array(n + 1).fill(false).map(() => Array(target + 1).fill(false));
for (let i = 0; i <= n; i++) dp[i][0] = true; // Empty subset = sum 0

console.log("Set:", set, "Target:", target);

for (let i = 1; i <= n; i++) {
  for (let s = 1; s <= target; s++) {
    dp[i][s] = dp[i - 1][s]; // Don't include current element
    if (s >= set[i - 1]) {
      dp[i][s] = dp[i][s] || dp[i - 1][s - set[i - 1]]; // Include it
    }
    if (dp[i][s] && !dp[i-1][s]) {
      console.log("Sum", s, "achievable using element", set[i-1], "(index "+i+")");
    }
  }
}

console.log("Can subset sum to", target, "?", dp[n][target]);
`,
  },

  // ==============================
  // GREEDY (New)
  // ==============================
  {
    name: 'Activity Selection',
    category: 'Greedy',
    description: 'Select maximum non-overlapping activities using greedy earliest-finish approach',
    language: 'javascript',
    tags: ['greedy', 'activity-selection', 'interval', 'scheduling', 'sorting'],
    code: `// Activity Selection Problem (Greedy)
let activities = [
  {name: "A", start: 1, finish: 2},
  {name: "B", start: 3, finish: 4},
  {name: "C", start: 0, finish: 6},
  {name: "D", start: 5, finish: 7},
  {name: "E", start: 8, finish: 9},
  {name: "F", start: 5, finish: 9}
];

// Sort by finish time (greedy key)
activities.sort((a, b) => a.finish - b.finish);
console.log("Sorted by finish time:", activities.map(a => a.name+"("+a.start+"-"+a.finish+")").join(", "));

let selected = [activities[0]];
let lastFinish = activities[0].finish;
console.log("Selected:", activities[0].name, "finishes at", lastFinish);

for (let i = 1; i < activities.length; i++) {
  let act = activities[i];
  if (act.start >= lastFinish) {
    selected.push(act);
    lastFinish = act.finish;
    console.log("Selected:", act.name, "starts at", act.start, ">= last finish", lastFinish - (act.finish - act.start));
  } else {
    console.log("Skipped:", act.name, "starts at", act.start, "but last finish is", lastFinish, "(overlaps)");
  }
}

console.log("\\nMax activities selected:", selected.length, "->", selected.map(a => a.name).join(", "));
`,
  },
];

