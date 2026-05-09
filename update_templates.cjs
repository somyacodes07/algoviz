const fs = require('fs');

const path = 'frontend/templates/cppTemplates.ts';
let content = fs.readFileSync(path, 'utf8');

// We want to remove the large Doubly Linked List template
// and the "Linked List Reversal" template, and replace them with a new Linked List category.
// Since the file is large, let's just find the start of DATA STRUCTURES and end of it
// Actually, it's easier to manipulate the AST or just regex, but string replacement is safest.

const startMarker = `  // ==============================
  // DATA STRUCTURES
  // ==============================`;

const nextMarker = `  // ==============================
  // GRAPHS & TREES
  // ==============================`;

const startIndex = content.indexOf(startMarker);
const nextIndex = content.indexOf(nextMarker);

if (startIndex === -1 || nextIndex === -1) {
    console.error('Markers not found');
    process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(nextIndex);

const newLinkedListCategory = `  // ==============================
  // LINKED LISTS
  // ==============================
  {
    name: 'Singly Linked List: Reverse',
    category: 'Linked List',
    description: 'Reverse a singly linked list in-place using three pointers',
    language: 'c++',
    tags: ['linked-list', 'pointers', 'reverse', 'in-place'],
    code: \`// Reverse a Singly Linked List
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
\`,
  },
  {
    name: 'Doubly Linked List: Insert',
    category: 'Linked List',
    description: 'Insert nodes at head and tail of a doubly linked list',
    language: 'c++',
    tags: ['linked-list', 'doubly-linked-list', 'insert'],
    code: \`// Doubly Linked List: Insertion
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
\`,
  },
  {
    name: 'Doubly Linked List: Delete',
    category: 'Linked List',
    description: 'Delete a specific node from a doubly linked list',
    language: 'c++',
    tags: ['linked-list', 'doubly-linked-list', 'delete'],
    code: \`// Doubly Linked List: Delete Node
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
\`,
  },
  {
    name: 'Doubly Linked List: Reverse',
    category: 'Linked List',
    description: 'Reverse a doubly linked list by swapping prev and next pointers',
    language: 'c++',
    tags: ['linked-list', 'doubly-linked-list', 'reverse'],
    code: \`// Doubly Linked List: Reverse
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
\`,
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
    code: \`// Valid Parentheses using std::stack
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
\`,
  },
  {
    name: 'Frequency Counter',
    category: 'Hash Maps',
    description: 'Count occurrences of numbers in an array',
    language: 'c++',
    tags: ['map', 'hash', 'frequency', 'counting', 'dictionary'],
    code: \`// Array Frequency Counter
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
\`,
  },

`;

fs.writeFileSync(path, before + newLinkedListCategory + after);
console.log('Templates updated successfully!');
