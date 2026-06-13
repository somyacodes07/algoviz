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
    name: 'Circular Linked List: Traverse',
    category: 'Linked List',
    description: 'Create and traverse a circular linked list in C++',
    language: 'c++',
    tags: ['linked-list', 'circular', 'pointers', 'traversal'],
    code: `// C++ Circular Linked List Traversal
#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* next;
    Node(int v) : val(v), next(nullptr) {}
};

int main() {
    // Create nodes
    Node* head = new Node(10);
    Node* node2 = new Node(20);
    Node* node3 = new Node(30);

    // Form circular links
    head->next = node2;
    node2->next = node3;
    node3->next = head; // Pointing back to head to make it circular

    cout << "Traversing circular linked list:" << endl;
    Node* curr = head;
    int steps = 0;
    
    if (head != nullptr) {
        do {
            cout << "Visited Node: " << curr->val << endl;
            curr = curr->next;
            steps++;
        } while (curr != head && steps < 10);
    }

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
  // SEARCH & SORT
  // ==============================
  {
    name: 'Binary Search',
    category: 'Search & Sort',
    description: 'Find target value in sorted vector using low/high/mid pointers',
    language: 'c++',
    tags: ['search', 'binary-search', 'divide-and-conquer', 'pointers'],
    code: `// C++ Binary Search
#include <iostream>
#include <vector>
using namespace std;

int binarySearch(const vector<int>& arr, int target) {
    int low = 0;
    int high = arr.size() - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        cout << "Low: " << low << ", High: " << high << ", Mid: " << mid << ", Val: " << arr[mid] << endl;

        if (arr[mid] == target) {
            cout << "Target " << target << " found at index " << mid << "!" << endl;
            return mid;
        }
        if (arr[mid] < target) {
            cout << arr[mid] << " < " << target << ", search right half." << endl;
            low = mid + 1;
        } else {
            cout << arr[mid] << " > " << target << ", search left half." << endl;
            high = mid - 1;
        }
    }
    cout << "Target " << target << " not found in array." << endl;
    return -1;
}

int main() {
    vector<int> arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int target = 23;
    binarySearch(arr, target);
    return 0;
}
`,
  },
  {
    name: 'Bubble Sort',
    category: 'Search & Sort',
    description: 'Sort vector elements through repeated adjacent swaps',
    language: 'c++',
    tags: ['sort', 'bubble-sort', 'array', 'nested-loops'],
    code: `// C++ Bubble Sort
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    int n = arr.size();
    
    cout << "Starting Bubble Sort..." << endl;
    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            cout << "Comparing arr[" << j << "]=" << arr[j] << " and arr[" << j+1 << "]=" << arr[j+1] << endl;
            if (arr[j] > arr[j + 1]) {
                // Swap
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
                cout << "-> Swapped: " << arr[j] << " and " << arr[j+1] << endl;
            }
        }
        if (!swapped) {
            cout << "Array is sorted. Breaking early." << endl;
            break;
        }
    }
    
    cout << "Sorted array: ";
    for (int x : arr) cout << x << " ";
    cout << endl;
    return 0;
}
`,
  },
  {
    name: 'Insertion Sort',
    category: 'Search & Sort',
    description: 'Insert vector values into sorted position sequentially',
    language: 'c++',
    tags: ['sort', 'insertion-sort', 'array', 'insertion'],
    code: `// C++ Insertion Sort
#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {12, 11, 13, 5, 6};
    int n = arr.size();

    cout << "Starting Insertion Sort..." << endl;
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        cout << "Inserting key=" << key << " from index " << i << endl;

        while (j >= 0 && arr[j] > key) {
            cout << "Moving arr[" << j << "]=" << arr[j] << " to index " << j + 1 << endl;
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
        cout << "Placed key=" << key << " at index " << j + 1 << endl;
    }

    cout << "Sorted array: ";
    for (int x : arr) cout << x << " ";
    cout << endl;
    return 0;
}
`,
  },
  {
    name: 'Merge Sort',
    category: 'Search & Sort',
    description: 'Recursive divide-and-conquer sorting with list merging',
    language: 'c++',
    tags: ['sort', 'merge-sort', 'divide-and-conquer', 'recursion'],
    code: `// C++ Merge Sort
#include <iostream>
#include <vector>
using namespace std;

void merge(vector<int>& arr, int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;

    vector<int> L(n1), R(n2);
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];

    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }

    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }

    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}

void mergeSort(vector<int>& arr, int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    cout << "Dividing array: left index " << l << " to " << m << ", right " << m+1 << " to " << r << endl;
    
    mergeSort(arr, l, m);
    mergeSort(arr, m + 1, r);
    
    cout << "Merging range: " << l << " to " << r << endl;
    merge(arr, l, m, r);
}

int main() {
    vector<int> arr = {38, 27, 43, 3, 9, 82, 10};
    cout << "Starting Merge Sort..." << endl;
    mergeSort(arr, 0, arr.size() - 1);
    
    cout << "Sorted array: ";
    for (int x : arr) cout << x << " ";
    cout << endl;
    return 0;
}
`,
  },
  {
    name: 'Quick Sort',
    category: 'Search & Sort',
    description: 'Pivot-based vector partitioning with recursive sorting',
    language: 'c++',
    tags: ['sort', 'quick-sort', 'divide-and-conquer', 'recursion'],
    code: `// C++ Quick Sort
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    cout << "Partitioning with pivot=" << pivot << " at index " << high << endl;
    int i = (low - 1);

    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
            cout << "Swapped arr[" << i << "]=" << arr[i] << " and arr[" << j << "]=" << arr[j] << endl;
        }
    }
    swap(arr[i + 1], arr[high]);
    cout << "Placed pivot at index " << i + 1 << endl;
    return (i + 1);
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        cout << "Pivot split index: " << pi << endl;
        
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    vector<int> arr = {10, 7, 8, 9, 1, 5};
    cout << "Starting Quick Sort..." << endl;
    quickSort(arr, 0, arr.size() - 1);
    
    cout << "Sorted array: ";
    for (int x : arr) cout << x << " ";
    cout << endl;
    return 0;
}
`,
  },
  {
    name: 'BST Insertion & Traversal',
    category: 'Graphs & Trees',
    description: 'Build BST and traverse via Inorder, Preorder, and Postorder recursion',
    language: 'c++',
    tags: ['tree', 'bst', 'binary-tree', 'traversal', 'recursion'],
    code: `// C++ Binary Search Tree Insertion and Traversal
#include <iostream>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* insert(TreeNode* root, int val) {
    if (root == nullptr) {
        cout << "Creating root/node with value: " << val << endl;
        return new TreeNode(val);
    }
    if (val < root->val) {
        cout << val << " < " << root->val << ", inserting left." << endl;
        root->left = insert(root->left, val);
    } else {
        cout << val << " >= " << root->val << ", inserting right." << endl;
        root->right = insert(root->right, val);
    }
    return root;
}

void inorder(TreeNode* root) {
    if (root == nullptr) return;
    inorder(root->left);
    cout << root->val << " ";
    inorder(root->right);
}

void preorder(TreeNode* root) {
    if (root == nullptr) return;
    cout << root->val << " ";
    preorder(root->left);
    preorder(root->right);
}

void postorder(TreeNode* root) {
    if (root == nullptr) return;
    postorder(root->left);
    postorder(root->right);
    cout << root->val << " ";
}

int main() {
    TreeNode* root = nullptr;
    root = insert(root, 50);
    insert(root, 30);
    insert(root, 70);
    insert(root, 20);
    insert(root, 40);
    
    cout << "\nInorder traversal: ";
    inorder(root);
    cout << "\nPreorder traversal: ";
    preorder(root);
    cout << "\nPostorder traversal: ";
    postorder(root);
    cout << endl;
    return 0;
}
`,
  },
  {
    name: 'Flood Fill (Grid DFS)',
    category: 'Graphs & Trees',
    description: 'DFS traversal to change matching connected components on 2D grid',
    language: 'c++',
    tags: ['matrix', 'grid', 'dfs', 'flood-fill', 'recursion'],
    code: `// C++ Grid Flood Fill (DFS)
#include <iostream>
#include <vector>
using namespace std;

void dfs(vector<vector<int>>& grid, int r, int c, int oldColor, int newColor) {
    int rows = grid.size();
    int cols = grid[0].size();

    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (grid[r][c] != oldColor || grid[r][c] == newColor) return;

    cout << "Filling cell (" << r << "," << c << ") from color " << oldColor << " to " << newColor << endl;
    grid[r][c] = newColor;

    dfs(grid, r + 1, c, oldColor, newColor);
    dfs(grid, r - 1, c, oldColor, newColor);
    dfs(grid, r, c + 1, oldColor, newColor);
    dfs(grid, r, c - 1, oldColor, newColor);
}

int main() {
    vector<vector<int>> grid = {
        {1, 1, 1, 0, 0},
        {1, 1, 0, 1, 1},
        {1, 0, 0, 1, 0},
        {0, 0, 1, 1, 1}
    };

    cout << "Initial grid color at (1,1): " << grid[1][1] << endl;
    dfs(grid, 1, 1, 1, 2);

    cout << "Flood fill completed." << endl;
    return 0;
}
`,
  },
  {
    name: 'Queue using Stacks',
    category: 'Stacks & Queues',
    description: 'Simulate LIFO-based queue operations utilizing two stack buffers',
    language: 'c++',
    tags: ['stack', 'queue', 'data-structure', 'buffer'],
    code: `// C++ Queue implementation using Stacks
#include <iostream>
#include <stack>
using namespace std;

class Queue {
    stack<int> s1;
    stack<int> s2;
public:
    void enqueue(int x) {
        cout << "Enqueuing: " << x << endl;
        s1.push(x);
    }
    
    int dequeue() {
        if (s1.empty() && s2.empty()) {
            cout << "Queue is empty!" << endl;
            return -1;
        }
        
        if (s2.empty()) {
            cout << "Moving elements from Stack 1 to Stack 2..." << endl;
            while (!s1.empty()) {
                s2.push(s1.top());
                s1.pop();
            }
        }
        
        int val = s2.top();
        s2.pop();
        cout << "Dequeued: " << val << endl;
        return val;
    }
};

int main() {
    Queue q;
    q.enqueue(10);
    q.enqueue(20);
    q.enqueue(30);
    
    q.dequeue();
    q.enqueue(40);
    q.dequeue();
    q.dequeue();
    q.dequeue();
    return 0;
}
`,
  },
  {
    name: 'Merge Two Sorted Lists',
    category: 'Linked List',
    description: 'Merge two sorted linked lists recursively',
    language: 'c++',
    tags: ['linked-list', 'merge', 'pointers', 'recursion'],
    code: `// C++ Merge Two Sorted Lists
#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* next;
    Node(int x) : val(x), next(nullptr) {}
};

Node* mergeLists(Node* l1, Node* l2) {
    if (l1 == nullptr) return l2;
    if (l2 == nullptr) return l1;
    
    cout << "Comparing Node(" << l1->val << ") and Node(" << l2->val << ")" << endl;
    if (l1->val <= l2->val) {
        cout << l1->val << " <= " << l2->val << ", choosing " << l1->val << " and merging remaining next" << endl;
        l1->next = mergeLists(l1->next, l2);
        return l1;
    } else {
        cout << l1->val << " > " << l2->val << ", choosing " << l2->val << " and merging remaining next" << endl;
        l2->next = mergeLists(l1, l2->next);
        return l2;
    }
}

int main() {
    Node* l1 = new Node(1);
    l1->next = new Node(3);
    l1->next->next = new Node(5);

    Node* l2 = new Node(2);
    l2->next = new Node(4);
    l2->next->next = new Node(6);

    cout << "Merging lists..." << endl;
    Node* mergedHead = mergeLists(l1, l2);

    return 0;
}
`,
  },
  {
    name: 'Minimum Size Subarray Sum',
    category: 'Arrays & Strings',
    description: 'Sliding window window O(N) evaluation finding smallest subarray summing >= target',
    language: 'c++',
    tags: ['sliding-window', 'array', 'optimization', 'minimum'],
    code: `// C++ Minimum Size Subarray Sum (Sliding Window)
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int minSubArrayLen(int target, const vector<int>& nums) {
    int n = nums.size();
    int minLen = n + 1;
    int left = 0;
    int currentSum = 0;

    cout << "Target sum: " << target << endl;
    for (int right = 0; right < n; right++) {
        currentSum += nums[right];
        cout << "Right pointer at index " << right << ", num=" << nums[right] << ", currentSum=" << currentSum << endl;

        while (currentSum >= target) {
            int len = right - left + 1;
            cout << "-> CurrentSum >= Target! Subarray found from index " << left << " to " << right << " (len=" << len << ")" << endl;
            minLen = min(minLen, len);
            
            cout << "-> Shrinking window: subtracting index " << left << " value " << nums[left] << endl;
            currentSum -= nums[left];
            left++;
        }
    }

    int result = (minLen == n + 1) ? 0 : minLen;
    cout << "Minimum length of subarray sum >= target is: " << result << endl;
    return result;
}

int main() {
    vector<int> nums = {2, 3, 1, 2, 4, 3};
    int target = 7;
    minSubArrayLen(target, nums);
    return 0;
}
`,
  },
];

