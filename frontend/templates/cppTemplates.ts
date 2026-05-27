import { CodeTemplate } from '../codeTemplates';

export const CPP_TEMPLATES: CodeTemplate[] = [
  // ==============================
  // ARRAYS & STRINGS
  // ==============================
  {
    name: 'Find Maximum',
    category: 'Arrays & Strings',
    description: 'Find the largest element in a vector',
    language: 'c++',
    tags: ['array', 'vector', 'max', 'search', 'linear'],
    code: `// C++ Visualizer (Beta): Find Maximum
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {12, 45, 7, 23, 56, 89, 34};
    int maxVal = arr[0];
    int maxIndex = 0;

    for (int i = 1; i < arr.size(); i++) {
        if (arr[i] > maxVal) {
            maxVal = arr[i];
            maxIndex = i;
        }
    }

    cout << "Maximum value is " << maxVal << " at index " << maxIndex << endl;
    return 0;
}
`,
  },
  {
    name: 'Reverse Array',
    category: 'Arrays & Strings',
    description: 'Reverse an array in-place using two pointers',
    language: 'c++',
    tags: ['array', 'vector', 'two-pointers', 'swap', 'in-place', 'reverse'],
    code: `// C++ Reverse Array In-Place
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {10, 20, 30, 40, 50, 60, 70};
    int left = 0;
    int right = arr.size() - 1;

    while (left < right) {
        // Swap elements
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        
        // Move pointers
        left++;
        right--;
    }

    return 0;
}
`,
  },
  {
    name: 'Two Sum',
    category: 'Arrays & Strings',
    description: 'Find pair that sums to target',
    language: 'c++',
    tags: ['array', 'vector', 'math', 'two-sum', 'brute-force', 'combinations'],
    code: `// Two Sum Problem (O(n²) approach for visibility)
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {2, 7, 11, 15, 3, 6};
    int target = 9;
    bool found = false;

    for (int i = 0; i < nums.size(); i++) {
        for (int j = i + 1; j < nums.size(); j++) {
            int sum = nums[i] + nums[j];
            if (sum == target) {
                found = true;
            }
        }
    }
    return 0;
}
`,
  },
  {
    name: 'Matrix Traversal',
    category: 'Arrays & Strings',
    description: 'Traverse a 2D vector matrix in row-major order with index tracking',
    language: 'c++',
    tags: ['array', 'vector', 'matrix', 'nested-loops', 'grid', 'traversal'],
    code: `// C++ 2D Matrix Traversal
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<vector<int>> grid = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    int rowCount = grid.size();
    int colCount = grid[0].size();

    for (int r = 0; r < rowCount; r++) {
        for (int c = 0; c < colCount; c++) {
            int val = grid[r][c];
            cout << "Visiting cell (" << r << "," << c << ") = " << val << endl;
        }
    }

    return 0;
}
`,
  },
  {
    name: 'Max Subarray',
    category: 'Arrays & Strings',
    description: 'Find contiguous subarray with largest sum (Kadane’s Algo)',
    language: 'c++',
    tags: ['array', 'vector', 'sliding-window', 'kadane', 'dynamic-programming', 'max'],
    code: `// Kadane's Algorithm for Maximum Subarray
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
        }
    }

    cout << "Maximum Subarray Sum is: " << globalMax << endl;
    return 0;
}
`,
  },

  // ==============================
  // LINKED LISTS
  // ==============================
  {
    name: 'Singly Linked List: Reverse',
    category: 'Linked List',
    description: 'Reverse a singly linked list in-place using three pointers',
    language: 'c++',
    tags: ['linked-list', 'pointers', 'reverse', 'in-place'],
    code: `// Reverse a Singly Linked List
#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* next;
    Node(int v) : val(v), next(nullptr) {}
};

class LinkedList {
    Node* head;
public:
    LinkedList() : head(nullptr) {}
    void insert(int val) {
        Node* n = new Node(val);
        n->next = head;
        head = n;
    }
    void reverse() {
        Node* prev = nullptr;
        Node* curr = head;
        while (curr != nullptr) {
            Node* nextTemp = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nextTemp;
        }
        head = prev;
    }
};

int main() {
    LinkedList ll;
    ll.insert(4);
    ll.insert(3);
    ll.insert(2);
    ll.insert(1); // List: 1 -> 2 -> 3 -> 4
    
    ll.reverse(); // Watch pointers swap!
    
    return 0;
}
`,
  },
  {
    name: 'Doubly Linked List: Insert',
    category: 'Linked List',
    description: 'Insert nodes at head and tail of a doubly linked list',
    language: 'c++',
    tags: ['linked-list', 'doubly-linked-list', 'insert'],
    code: `// Doubly Linked List: Insertion
#include <iostream>
using namespace std;

struct DNode {
    int data;
    DNode* prev;
    DNode* next;
    DNode(int val) : data(val), prev(nullptr), next(nullptr) {}
};

class DoublyLinkedList {
    DNode* head;
    DNode* tail;
public:
    DoublyLinkedList() : head(nullptr), tail(nullptr) {}
    
    void insertAtHead(int val) {
        DNode* n = new DNode(val);
        if (!head) head = tail = n;
        else { n->next = head; head->prev = n; head = n; }
    }
    
    void insertAtTail(int val) {
        DNode* n = new DNode(val);
        if (!tail) head = tail = n;
        else { tail->next = n; n->prev = tail; tail = n; }
    }
};

int main() {
    DoublyLinkedList dll;
    
    // Insert at head
    dll.insertAtHead(20);
    dll.insertAtHead(10);
    
    // Insert at tail
    dll.insertAtTail(30);
    dll.insertAtTail(40);
    
    return 0;
}
`,
  },
  {
    name: 'Doubly Linked List: Delete',
    category: 'Linked List',
    description: 'Delete a specific node from a doubly linked list',
    language: 'c++',
    tags: ['linked-list', 'doubly-linked-list', 'delete'],
    code: `// Doubly Linked List: Delete Node
#include <iostream>
using namespace std;

struct DNode {
    int data;
    DNode* prev;
    DNode* next;
    DNode(int val) : data(val), prev(nullptr), next(nullptr) {}
};

class DoublyLinkedList {
    DNode* head;
    DNode* tail;
public:
    DoublyLinkedList() : head(nullptr), tail(nullptr) {}
    
    void insertAtTail(int val) {
        DNode* n = new DNode(val);
        if (!tail) head = tail = n;
        else { tail->next = n; n->prev = tail; tail = n; }
    }
    
    DNode* search(int val) {
        DNode* curr = head;
        while (curr) {
            if (curr->data == val) return curr;
            curr = curr->next;
        }
        return nullptr;
    }
    
    void deleteNode(DNode* node) {
        if (!node) return;
        if (node->prev) node->prev->next = node->next;
        else head = node->next; // deleting head
        
        if (node->next) node->next->prev = node->prev;
        else tail = node->prev; // deleting tail
        
        delete node;
    }
};

int main() {
    DoublyLinkedList dll;
    dll.insertAtTail(10);
    dll.insertAtTail(20);
    dll.insertAtTail(30);
    dll.insertAtTail(40);
    
    DNode* target = dll.search(20);
    if (target) {
        dll.deleteNode(target); // Watch the node disappear!
    }
    
    return 0;
}
`,
  },
  {
    name: 'Doubly Linked List: Reverse',
    category: 'Linked List',
    description: 'Reverse a doubly linked list by swapping prev and next pointers',
    language: 'c++',
    tags: ['linked-list', 'doubly-linked-list', 'reverse'],
    code: `// Doubly Linked List: Reverse
#include <iostream>
using namespace std;

struct DNode {
    int data;
    DNode* prev;
    DNode* next;
    DNode(int val) : data(val), prev(nullptr), next(nullptr) {}
};

class DoublyLinkedList {
    DNode* head;
    DNode* tail;
public:
    DoublyLinkedList() : head(nullptr), tail(nullptr) {}
    
    void insertAtTail(int val) {
        DNode* n = new DNode(val);
        if (!tail) head = tail = n;
        else { tail->next = n; n->prev = tail; tail = n; }
    }
    
    void reverse() {
        DNode* curr = head;
        DNode* temp = nullptr;
        tail = head; // tail becomes the old head
        while (curr) {
            temp = curr->prev;
            curr->prev = curr->next;
            curr->next = temp;
            curr = curr->prev; // move forward using old next
        }
        if (temp) head = temp->prev;
    }
};

int main() {
    DoublyLinkedList dll;
    dll.insertAtTail(10);
    dll.insertAtTail(20);
    dll.insertAtTail(30);
    dll.insertAtTail(40);
    
    dll.reverse(); // Watch pointers swap!
    
    return 0;
}
`,
  },

  // ==============================
  // STACKS & QUEUES
  // ==============================
  {
    name: 'Valid Parentheses',
    category: 'Stacks & Queues',
    description: 'Check if string has valid bracket sequences using a stack',
    language: 'c++',
    tags: ['stack', 'string', 'validation', 'parentheses', 'LIFO'],
    code: `// Valid Parentheses using std::stack
#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    string s = "{[()]}";
    stack<char> st;
    bool isValid = true;

    for (int i = 0; i < s.length(); i++) {
        char c = s[i];
        
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else {
            if (st.empty()) {
                isValid = false;
                break;
            }
            
            char top = st.top();
            st.pop();
            
            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) {
                isValid = false;
                break;
            }
        }
    }

    if (!st.empty()) isValid = false;
    
    cout << "Is Valid? " << isValid << endl;
    return 0;
}
`,
  },
  {
    name: 'Frequency Counter',
    category: 'Hash Maps',
    description: 'Count occurrences of numbers in an array',
    language: 'c++',
    tags: ['map', 'hash', 'frequency', 'counting', 'dictionary'],
    code: `// Array Frequency Counter
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {4, 0, 4, 8, 3, 0, 1, 4, 8};
    vector<int> freq(10, 0); 
    
    for (int num : arr) {
        freq[num] = freq[num] + 1;
    }
    
    for (int i = 0; i < freq.size(); i++) {
        if (freq[i] > 0) {
            cout << "Element " << i << " occurs " << freq[i] << " times" << endl;
        }
    }
    
    return 0;
}
`,
  },

  // ==============================
  // GRAPHS & TREES
  // ==============================
  {
    name: 'Breadth-First Search (BFS)',
    category: 'Graphs & Trees',
    description: 'Level-order graph traversal using std::queue',
    language: 'c++',
    tags: ['graph', 'bfs', 'breadth-first-search', 'queue', 'traversal', 'matrix'],
    code: `// Graph BFS using std::queue
#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int main() {
    // Adjacency Matrix representing a graph
    // A=0, B=1, C=2, D=3, E=4, F=5
    vector<vector<int>> graph = {
        {1, 2},    // A connected to B, C
        {0, 3, 4}, // B connected to A, D, E
        {0, 5},    // C connected to A, F
        {1},       // D connected to B
        {1, 5},    // E connected to B, F
        {2, 4}     // F connected to C, E
    };

    queue<int> q;
    vector<int> visited(6, 0);
    vector<int> result;

    q.push(0); // Start at Node A (0)
    visited[0] = 1;

    while (!q.empty()) {
        int current = q.front();
        q.pop();
        
        result.push_back(current);
        
        for (int neighbor : graph[current]) {
            if (visited[neighbor] == 0) {
                visited[neighbor] = 1;
                q.push(neighbor);
            }
        }
    }

    return 0;
}
`,
  },
  {
    name: 'Depth-First Search (DFS)',
    category: 'Graphs & Trees',
    description: 'Recursive depth traversal using a graph matrix',
    language: 'c++',
    tags: ['graph', 'dfs', 'depth-first-search', 'recursion', 'traversal', 'matrix'],
    code: `// Graph DFS Traversal (Recursive)
#include <iostream>
#include <vector>
using namespace std;

// Adjacency Matrix
vector<vector<int>> graph = {
    {1, 2},    // A=0
    {0, 3, 4}, // B=1
    {0, 5},    // C=2
    {1},       // D=3
    {1, 5},    // E=4
    {2, 4}     // F=5
};

vector<int> visited(6, 0);
vector<int> result;

void dfs(int node) {
    if (visited[node] == 1) return;
    
    visited[node] = 1;
    result.push_back(node);
    
    for (int neighbor : graph[node]) {
        dfs(neighbor);
    }
}

int main() {
    dfs(0); // Start at Node A (0)
    return 0;
}
`,
  },
  {
    name: "Dijkstra's Shortest Path",
    category: 'Graphs & Trees',
    description: 'Find shortest paths using priority queue (Min-Heap)',
    language: 'c++',
    tags: ['graph', 'dijkstra', 'shortest-path', 'greedy', 'weighted', 'priority-queue', 'heap'],
    code: `// Dijkstra's Shortest Path using Priority Queue
#include <iostream>
#include <vector>
#include <queue>
using namespace std;

// Helper to bypass transpilation ambiguity of C++ pairs
vector<int> p(int a, int b) {
    vector<int> pair; pair.push_back(a); pair.push_back(b); return pair;
}

int main() {
    int V = 6;
    // Graph: tuple of {neighbor, weight}
    vector<vector<vector<int>>> adj;
    for (int i = 0; i < V; i++) {
        vector<vector<int>> row;
        adj.push_back(row);
    }
    
    adj[0].push_back(p(1, 4)); // A->B
    adj[0].push_back(p(2, 2)); // A->C
    adj[1].push_back(p(2, 5)); // B->C
    adj[1].push_back(p(3, 10));// B->D
    adj[2].push_back(p(4, 3)); // C->E
    adj[3].push_back(p(5, 11));// D->F
    adj[4].push_back(p(3, 4)); // E->D
    
    // priority_queue stores pairs of {distance, node}
    priority_queue<vector<int>, vector<vector<int>>, greater<vector<int>>> pq;
    
    vector<int> dist(V, 9999);
    
    int source = 0;
    pq.push(p(0, source));
    dist[source] = 0;
    
    while (!pq.empty()) {
        int d = pq.top()[0];
        int u = pq.top()[1];
        pq.pop();
        
        if (d > dist[u]) continue;
        
        for (auto edge : adj[u]) {
            int v = edge[0];
            int weight = edge[1];
            
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.push(p(dist[v], v));
            }
        }
    }
    
    return 0;
}
`,
  },

  // ==============================
  // DYNAMIC PROGRAMMING
  // ==============================
  {
    name: 'Climbing Stairs',
    category: 'Dynamic Programming',
    description: 'Fibonacci-style tabulation using a vector',
    language: 'c++',
    tags: ['dp', 'dynamic-programming', 'fibonacci', 'tabulation', 'bottom-up'],
    code: `// Climbing Stairs
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n = 7;
    vector<int> dp(n + 1, 0);

    dp[1] = 1;
    dp[2] = 2;

    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    cout << "Ways to climb " << n << " stairs: " << dp[n] << endl;
    return 0;
}
`,
  },
  {
    name: 'Factorial',
    category: 'Dynamic Programming',
    description: 'Compute factorial using recursion stack',
    language: 'c++',
    tags: ['recursion', 'math', 'factorial', 'call-stack', 'classic'],
    code: `// Recursive Factorial
#include <iostream>
using namespace std;

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int result = factorial(5);
    cout << "Factorial of 5 is: " << result << endl;
    return 0;
}
`,
  },
  {
    name: '0/1 Knapsack',
    category: 'Dynamic Programming',
    description: 'Classic 0/1 Knapsack optimization problem',
    language: 'c++',
    tags: ['dp', 'dynamic-programming', 'knapsack', 'tabulation', 'optimization', 'matrix'],
    code: `// 0/1 Knapsack Problem in C++
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> weights = {1, 2, 3};
    vector<int> values = {6, 10, 12};
    int W = 5;
    int n = weights.size();
    
    vector<vector<int>> dp;
    for (int i = 0; i <= n; i++) {
        vector<int> row(W + 1, 0);
        dp.push_back(row);
    }
    
    for (int i = 1; i <= n; i++) {
        for (int w = 1; w <= W; w++) {
            if (weights[i - 1] <= w) {
                dp[i][w] = max(
                    dp[i - 1][w],
                    dp[i - 1][w - weights[i - 1]] + values[i - 1]
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    
    int maxValue = dp[n][W];
    cout << "Maximum value is " << maxValue << endl;
    
    return 0;
}
`,
  },

  // ==============================
  // AARTI MAM TEMPLATES
  // ==============================
  {
    name: '1. Pair Sum (Brute Force)',
    category: 'Aarti Mam',
    description: 'Find a pair in an array whose sum equals z',
    language: 'c++',
    tags: ['array', 'pair', 'sum', 'brute-force', 'aarti-mam'],
    code: `// Pair Sum (Brute Force)
#include <iostream>
using namespace std;

// Function to find a pair in the given array whose sum is equal to z
bool findPair(int a[], int n, int z)
{
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            if (i != j && a[i] + a[j] == z)
                return true;

    return false;
}

int main()
{
    int a[] = {1, -2, 1, 0, 5};
    int z = 0;
    int n = sizeof(a) / sizeof(a[0]);

    if (findPair(a, n, z))
        cout << "True" << endl;
    else
        cout << "False" << endl;

    return 0;
}
`,
  },
  {
    name: '2. Frequency Count (Hash Map)',
    category: 'Aarti Mam',
    description: 'Count frequencies of array items using an unordered_map',
    language: 'c++',
    tags: ['array', 'frequency', 'map', 'hash', 'aarti-mam'],
    code: `// Frequency Count using Hash Map
#include <iostream>
#include <unordered_map>
using namespace std;

// Function to count frequencies of array items
void countFreq(int arr[], int n)
{
    unordered_map<int, int> freq;

    for (int i = 0; i < n; i++)
        freq[arr[i]]++;

    for (auto x : freq)
        cout << x.first << " occurs " << x.second << " times." << endl;
}

int main()
{
    int arr[] = {10, 20, 20, 10, 10, 20, 5, 20};
    int n = sizeof(arr) / sizeof(arr[0]);

    countFreq(arr, n);

    return 0;
}
`,
  },
  {
    name: '3. Function Growth Table',
    category: 'Aarti Mam',
    description:
      'Compare computational growth functions mathematically (log, linear, quadratic, exponential)',
    language: 'c++',
    tags: ['math', 'growth', 'complexity', 'table', 'aarti-mam'],
    code: `// Function Growth Table (log, n, n², nⁿ, eⁿ)
#include <iostream>
#include <cmath>
#include <iomanip>
using namespace std;

int main() {
    cout << setw(5) << "n"
         << setw(10) << "log(n)"
         << setw(10) << "n"
         << setw(10) << "n^2"
         << setw(15) << "n^n"
         << setw(15) << "e^n" << endl;

    cout << "---------------------------------------------------------------" << endl;

    for (int n = 1; n <= 10; n++) {
        double logn = log(n);
        double square = pow(n, 2);
        double nn = pow(n, n);
        double en = exp(n);

        cout << setw(5) << n
             << setw(10) << fixed << setprecision(2) << logn
             << setw(10) << n
             << setw(10) << square
             << setw(15) << nn
             << setw(15) << en << endl;
    }

    return 0;
}
`,
  },
  {
    name: '4. Frequency Count (Simulated Array)',
    category: 'Aarti Mam',
    description: 'Frequency count simulation expanding from class psuedo-code',
    language: 'c++',
    tags: ['array', 'frequency', 'pseudo-code', 'aarti-mam'],
    code: `// Frequency Count (Pseudo-Code Array Translation)
#include <iostream>
using namespace std;

int main() {
    int n = 7;
    int a[] = {5, 2, 8, 5, 2, 2, 9};
    
    // Initializing frequency bucket array up to a safe magnitude (e.g. 15 for safety)
    int freq[15] = {0};

    cout << "Calculating frequencies for elements..." << endl;
    for(int i = 0; i < n; i++) {
        // Pseudo-code called for 'cin >> a[i]'
        // We simulate reading inputs by incrementing from predefined array 'a'
        freq[a[i]]++;
    }

    // Output the results
    for(int i = 0; i < 15; i++) {
        if(freq[i] > 0) {
            cout << "Value " << i << " occurs " << freq[i] << " times." << endl;
        }
    }
    
    return 0;
}
`,
  },
  {
    name: '5. Pair Sum (Simulated Arrays)',
    category: 'Aarti Mam',
    description: 'Pair sum simulation evaluating from class pseudo-code',
    language: 'c++',
    tags: ['array', 'pair', 'sum', 'pseudo-code', 'aarti-mam'],
    code: `// Pair Sum (Pseudo-Code Array Translation)
#include <iostream>
using namespace std;

int main() {
    int n = 6;
    int a[] = {3, 1, 4, 1, 5, 9};
    int z = 10; // Target sum
    bool foundPair = false;

    // First pseudo-loop logic for reading constraints into memory
    /* 
    for(int i = 0; i < n; i++)
        cin >> a[i];  (Pre-defined in 'a[]' above instead for visualizer simulation)
    */

    for(int i = 0; i < n; i++) {
        for(int j = 0; j < n; j++) {
            if(i != j && a[i] + a[j] == z) {
                foundPair = true;
            }
        }
    }

    if(foundPair) {
        cout << "Pair evaluating to " << z << " was found!" << endl;
    } else {
        cout << "No pair computes to " << z << "!" << endl;
    }

    return 0;
}
`,
  },
  {
    name: '6. Loop Complexity (O(N*logN))',
    category: 'Aarti Mam',
    description: 'Visualizing geometric iteration progression demonstrating computational loops',
    language: 'c++',
    tags: ['complexity', 'loops', 'big-o', 'aarti-mam'],
    code: `// Loop Complexity Example Simulation (O(N * log N))
#include <iostream>
using namespace std;

int main() {
    int N = 32;
    int count = 0;

    cout << "Analyzing exponential loop scaling for N=" << N << endl;
    
    for (int i = N; i > 0; i /= 2) {
        int innerLoopsCount = 0;
        for (int j = 0; j < i; j++) {
            count++;
            innerLoopsCount++;
        }
        cout << "- Inner bounded execute operations: " << innerLoopsCount << " (for i: " << i << ")" << endl;
    }
    
    cout << "Total computation complexity evaluated to: " << count << " iterations." << endl;
    return 0;
}
`,
  },
  {
    name: '7. Add Two Numbers',
    category: 'Aarti Mam',
    description: 'Simple arithmetic translating from pseudo-code assignments',
    language: 'c++',
    tags: ['arithmetic', 'sum', 'pseudo-code', 'aarti-mam'],
    code: `// Add Two Numbers (Pseudo-Code Expansion)
#include <iostream>
using namespace std;

int main() {
    int A = 1450;
    int B = 550;

    cout << "Assigning pseudo values A=" << A << " & B=" << B << endl;

    int C = A + B;

    cout << "Final Calculation (C) = " << C << endl;
    return 0;
}
`,
  },
];
