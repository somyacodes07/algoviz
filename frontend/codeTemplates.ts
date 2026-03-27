export interface CodeTemplate {
  name: string;
  category: string;
  description: string;
  language: string;
  code: string;
}

export const JS_TEMPLATES: CodeTemplate[] = [
  // ==============================
  // ARRAYS & STRINGS
  // ==============================
  {
    name: '[Arrays] Find Maximum',
    category: 'Arrays & Strings',
    description: 'Find the largest element in an array',
    language: 'javascript',
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
`
  },
  {
    name: '[Arrays] Reverse Array',
    category: 'Arrays & Strings',
    description: 'Reverse an array in-place using two pointers',
    language: 'javascript',
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
`
  },
  {
    name: '[Arrays] Two Sum',
    category: 'Arrays & Strings',
    description: 'Find pair that sums to target',
    language: 'javascript',
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
`
  },
  {
    name: '[Sliding Window] Max Subarray',
    category: 'Arrays & Strings',
    description: 'Find contiguous subarray with largest sum (Kadane’s Algo)',
    language: 'javascript',
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
`
  },

  // ==============================
  // DATA STRUCTURES
  // ==============================
  {
    name: '[Stack] Valid Parentheses',
    category: 'Data Structures',
    description: 'Check if string has valid bracket sequences using a Stack',
    language: 'javascript',
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
`
  },
  {
    name: '[Linked List] Reverse List',
    category: 'Data Structures',
    description: 'Iteratively reverse a linked list using Node classes',
    language: 'javascript',
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
`
  },

  // ==============================
  // SEARCH & SORT
  // ==============================
  {
    name: '[Search] Binary Search',
    category: 'Search & Sort',
    description: 'O(log n) search in sorted array',
    language: 'javascript',
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
    result = mid;
    console.log("Found at index", mid);
    break;
  } else if (arr[mid] < target) {
    low = mid + 1;
  } else {
    high = mid - 1;
  }
}

if (result === -1) {
  console.log("Not found");
}
`
  },
  {
    name: '[Sort] Merge Sort',
    category: 'Search & Sort',
    description: 'O(n log n) Divide and Conquer sorting',
    language: 'javascript',
    code: `// Merge Sort Implementation
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  
  let mid = Math.floor(arr.length / 2);
  let left = mergeSort(arr.slice(0, mid));
  let right = mergeSort(arr.slice(mid));
  
  return merge(left, right);
}

function merge(left, right) {
  let result = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    if (left[i] < right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }
  
  let merged = result.concat(left.slice(i)).concat(right.slice(j));
  console.log("Merged:", merged);
  return merged;
}

let array = [38, 27, 43, 3, 9, 82, 10];
console.log("Initial Array:", array);
let sortedArray = mergeSort(array);
console.log("Final Sorted Array:", sortedArray);
`
  },
  {
    name: '[Sort] Selection Sort',
    category: 'Search & Sort',
    description: 'Find minimum and swap (O(n²))',
    language: 'javascript',
    code: `// Selection Sort Algorithm
let arr = [29, 10, 14, 37, 13];
let n = arr.length;

for (let i = 0; i < n - 1; i++) {
  let minIdx = i;
  for (let j = i + 1; j < n; j++) {
    if (arr[j] < arr[minIdx]) {
      minIdx = j;
    }
  }
  if (minIdx !== i) {
    let temp = arr[i];
    arr[i] = arr[minIdx];
    arr[minIdx] = temp;
    console.log("Swapped. Array is now:", arr);
  }
}

console.log("Sorted:", arr);
`
  },

  // ==============================
  // GRAPH ALGORITHMS
  // ==============================
  {
    name: '[Graph] Breadth-First Search (BFS)',
    category: 'Algorithms',
    description: 'Level-order traversal of a graph using a Queue',
    language: 'javascript',
    code: `// Graph BFS Traversal
const graph = {
  A: ['B', 'C'],
  B: ['D', 'E'],
  C: ['F'],
  D: [],
  E: ['F'],
  F: []
};

let queue = ['A'];
let visited = new Set(['A']);
let traversalOrder = [];

console.log("Starting BFS from node A");

while (queue.length > 0) {
  let node = queue.shift();
  traversalOrder.push(node);
  console.log("Visited:", node);
  
  for (let neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      queue.push(neighbor);
      console.log("  Queued neighbor:", neighbor);
    }
  }
}

console.log("Final Traversal Order:", traversalOrder);
`
  },
  {
    name: '[Graph] Depth-First Search (DFS)',
    category: 'Algorithms',
    description: 'Recursive path exploration in a graph',
    language: 'javascript',
    code: `// Graph DFS Traversal (Recursive)
const graph = {
  1: [2, 3],
  2: [4],
  3: [5],
  4: [],
  5: []
};

let visited = new Set();
let traversalOrder = [];

function dfs(node) {
  if (visited.has(node)) return;
  
  console.log("Visiting Node", node);
  visited.add(node);
  traversalOrder.push(node);
  
  for (let neighbor of graph[node]) {
    console.log("  Node", node, "-> Traversing to", neighbor);
    dfs(neighbor);
  }
}

dfs(1);
console.log("Final DFS Path:", traversalOrder);
`
  },

  // ==============================
  // DYNAMIC PROGRAMMING & MATH
  // ==============================
  {
    name: '[DP] Climbing Stairs',
    category: 'DP & Math',
    description: 'Count distinct ways to climb stairs (Fibonacci variation)',
    language: 'javascript',
    code: `// Climbing Stairs (Dynamic Programming)
let n = 5; // Number of steps
let dp = [];
dp[1] = 1;
dp[2] = 2;

console.log("Base cases: dp[1] = 1, dp[2] = 2");

for (let i = 3; i <= n; i++) {
  dp[i] = dp[i - 1] + dp[i - 2];
  console.log("Ways to reach step " + i + ": " + dp[i]);
}

console.log("Total ways to reach top:", dp[n]);
`
  },
  {
    name: '[DP] Coin Change',
    category: 'DP & Math',
    description: 'Find minimum coins to make a given amount',
    language: 'javascript',
    code: `// Coin Change (Bottom-Up DP)
let coins = [1, 2, 5];
let amount = 11;
let dp = new Array(amount + 1).fill(Infinity);
dp[0] = 0;

for (let i = 1; i <= amount; i++) {
  for (let coin of coins) {
    if (i - coin >= 0) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }
  console.log("Min coins for amount", i, "=", dp[i]);
}

let res = dp[amount] === Infinity ? -1 : dp[amount];
console.log("Minimum coins required for", amount, ":", res);
`
  },
  {
    name: '[Recursion] Factorial',
    category: 'DP & Math',
    description: 'Recursive factorial with call stack visualization',
    language: 'javascript',
    code: `// Recursive Factorial
function factorial(n) {
  console.log("Computing factorial(" + n + ")");
  if (n <= 1) {
    return 1;
  }
  let result = n * factorial(n - 1);
  return result;
}

let answer = factorial(6);
console.log("6! =", answer);
`
  }
];

export const CPP_TEMPLATES: CodeTemplate[] = [
  // ==============================
  // ARRAYS & STRINGS
  // ==============================
  {
    name: '[Arrays] Find Maximum',
    category: 'Arrays & Strings',
    description: 'Find the largest element in a vector',
    language: 'c++',
    code: `// Find Maximum Element in C++
#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> arr = {12, 45, 7, 23, 56, 89, 34};
    int maxVal = arr[0];
    int maxIndex = 0;

    for (int i = 1; i < arr.size(); i++) {
        cout << "Comparing " << arr[i] << " with current max " << maxVal << endl;
        if (arr[i] > maxVal) {
            maxVal = arr[i];
            maxIndex = i;
            cout << "New max found!" << endl;
        }
    }

    cout << "Maximum value is " << maxVal << " at index " << maxIndex << endl;
    return 0;
}
`
  },
  {
    name: '[Arrays] Reverse Array',
    category: 'Arrays & Strings',
    description: 'Reverse an array in-place using two pointers',
    language: 'c++',
    code: `// Reverse Array In-Place in C++
#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> arr = {10, 20, 30, 40, 50, 60, 70};
    int left = 0;
    int right = arr.size() - 1;

    while (left < right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        
        cout << "Swapped elements at " << left << " and " << right << endl;
        
        left++;
        right--;
    }

    cout << "Reversal complete." << endl;
    return 0;
}
`
  },
  {
    name: '[Sliding Window] Max Subarray',
    category: 'Arrays & Strings',
    description: 'Kadane’s Algo for Max Subarray',
    language: 'c++',
    code: `// Kadane's Algorithm in C++
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    vector<int> nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    int currentMax = nums[0];
    int globalMax = nums[0];

    for (int i = 1; i < nums.size(); i++) {
        currentMax = max(nums[i], currentMax + nums[i]);
        if (currentMax > globalMax) {
            globalMax = currentMax;
            cout << "New Global Max: " << globalMax << " at index " << i << endl;
        }
    }

    cout << "Maximum Subarray Sum is: " << globalMax << endl;
    return 0;
}
`
  },

  // ==============================
  // DATA STRUCTURES
  // ==============================
  {
    name: '[Stack] Valid Parentheses',
    category: 'Data Structures',
    description: 'Check if string has valid bracket sequences using a Stack',
    language: 'c++',
    code: `// Valid Parentheses using a Stack
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    string s = "{[()]}";
    vector<char> stack;
    bool isValid = true;

    for (int i = 0; i < s.length(); i++) {
        char c = s[i];
        cout << "Processing char: " << c << endl;
        
        if (c == '(' || c == '{' || c == '[') {
            stack.push_back(c);
            cout << "Pushed to stack." << endl;
        } else {
            if (stack.empty()) {
                isValid = false;
                break;
            }
            
            char top = stack.back();
            stack.pop_back();
            cout << "Popped " << top << " to match with " << c << endl;
            
            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) {
                isValid = false;
                break;
            }
        }
    }

    if (!stack.empty()) isValid = false;
    cout << "Is Valid? " << (isValid ? "true" : "false") << endl;
    return 0;
}
`
  },

  // ==============================
  // SEARCH & SORT
  // ==============================
  {
    name: '[Search] Binary Search',
    category: 'Search & Sort',
    description: 'O(log n) search in sorted array',
    language: 'c++',
    code: `// Binary Search in C++
#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int target = 23;
    int low = 0;
    int high = arr.size() - 1;
    int result = -1;

    while (low <= high) {
        int mid = (low + high) / 2;
        cout << "Checking index " << mid << " value " << arr[mid] << endl;

        if (arr[mid] == target) {
            result = mid;
            cout << "Found at index " << mid << endl;
            break;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    if (result == -1) {
        cout << "Not found" << endl;
    }

    return 0;
}
`
  },
  {
    name: '[Sort] Merge Sort (Simulation)',
    category: 'Search & Sort',
    description: 'Divide and conquer arrays',
    language: 'c++',
    code: `// Merge Sort Simulation in C++
#include <iostream>
#include <vector>

using namespace std;

void merge(vector<int>& arr, int left, int mid, int right) {
    cout << "Merging ranges [" << left << "-" << mid << "] and [" << mid+1 << "-" << right << "]" << endl;
    // (Actual merge logic omitted here to focus on recursion steps)
}

void mergeSort(vector<int>& arr, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
        cout << "Merge Sort Complete!" << endl;
    return 0;
}
`
  },
  {
    name: '[Sort] Bubble Sort',
    category: 'Search & Sort',
    description: 'Classic O(n²) sorting demonstrating basic adjacent swaps',
    language: 'c++',
    code: `// Bubble Sort in C++
#include <iostream>
#include <vector>

using namespace std;

void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    bool swapped;
    
    for (int i = 0; i < n - 1; i++) {
        swapped = false;
        
        for (int j = 0; j < n - i - 1; j++) {
            cout << "Comparing index " << j << " and " << j+1 << endl;
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
                swapped = true;
                cout << "Swapped!" << endl;
            }
        }
        
        if (!swapped) break;
    }
}

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    bubbleSort(arr);
    
    cout << "Sorted array complete" << endl;
    return 0;
}`
  },
  {
    name: '[Sort] Quick Sort',
    category: 'Search & Sort',
    description: 'O(n log n) sorting using divide and conquer pivot partitioning',
    language: 'c++',
    code: `// Quick Sort in C++
#include <iostream>
#include <vector>

using namespace std;

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    
    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return (i + 1);
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    vector<int> arr = {10, 7, 8, 9, 1, 5};
    int n = arr.size();
    quickSort(arr, 0, n - 1);
    
    cout << "Sorted completely" << endl;
    return 0;
}`
  },
  {
    name: '[Sort] Selection Sort',
    category: 'Search & Sort',
    description: 'Find minimum and swap',
    language: 'c++',
    code: `// Selection Sort in C++
#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> arr = {29, 10, 14, 37, 13};
    int n = arr.size();

    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
            cout << "Swapped elements!" << endl;
        }
    }

    cout << "Sorted!" << endl;
    return 0;
}
`
  },

  // ==============================
  // GRAPH ALGORITHMS
  // ==============================
  {
    name: '[Graph] Breadth-First Search (BFS)',
    category: 'Algorithms',
    description: 'Level-order traversal of a graph using a Queue',
    language: 'c++',
    code: `// Graph BFS Traversal in C++
#include <iostream>
#include <vector>
#include <queue>

using namespace std;

int main() {
    // Graph representation (Adjacency List)
    vector<vector<int>> graph = {
        {1, 2},    // Node 0 neighbors
        {3, 4},    // Node 1 neighbors
        {5},       // Node 2 neighbors
        {},        // Node 3 neighbors
        {5},       // Node 4 neighbors
        {}         // Node 5 neighbors
    };
    
    vector<bool> visited(6, false);
    vector<int> q;
    
    q.push_back(0); // Start at Node 0
    visited[0] = true;
    
    cout << "Starting BFS from node 0" << endl;
    
    while (!q.empty()) {
        int node = q.front();
        q.erase(q.begin()); // Dequeue
        
        cout << "Visited: " << node << endl;
        
        for (int neighbor : graph[node]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push_back(neighbor);
                cout << "  Queued neighbor: " << neighbor << endl;
            }
        }
    }
    
    return 0;
}
`
  },

  // ==============================
  // DYNAMIC PROGRAMMING & MATH
  // ==============================
  {
    name: '[DP] Climbing Stairs',
    category: 'DP & Math',
    description: 'Count distinct ways to climb stairs',
    language: 'c++',
    code: `// Climbing Stairs (Dynamic Programming)
#include <iostream>
#include <vector>

using namespace std;

int main() {
    int n = 5; // Number of steps
    vector<int> dp(n + 1, 0);
    dp[1] = 1;
    dp[2] = 2;

    cout << "Base cases: dp[1] = 1, dp[2] = 2" << endl;

    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
        cout << "Ways to reach step " << i << ": " << dp[i] << endl;
    }

    cout << "Total ways to reach top: " << dp[n] << endl;
    return 0;
}
`
  },
  {
    name: '[Recursion] Factorial',
    category: 'DP & Math',
    description: 'Recursive factorial with call stack',
    language: 'c++',
    code: `// Recursive Factorial in C++
#include <iostream>

using namespace std;

int factorial(int n) {
    cout << "Computing factorial(" << n << ")" << endl;
    if (n <= 1) {
        return 1;
    }
    int result = n * factorial(n - 1);
    return result;
}

int main() {
    int answer = factorial(6);
    cout << "6! = " << answer << endl;
    return 0;
}
`
  }
];
