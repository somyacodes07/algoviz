#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <map>
#include <stack>
#include <queue>
#include <deque>
#include <type_traits>

// Forward declarations
template<typename T> std::string __to_json(const T& v);
template<typename T> std::string __to_json(const std::vector<T>& v);
template<typename T, typename U> std::string __to_json(const std::pair<T, U>& p);
template<typename K, typename V> std::string __to_json(const std::map<K, V>& m);
template<typename T> std::string __to_json(const std::stack<T>& s);
template<typename T> std::string __to_json(const std::queue<T>& q);
template<typename T> std::string __to_json(T* ptr, int depth = 0);
std::string __to_json(const std::string& v);
std::string __to_json(const char* v);
std::string __to_json(bool v);

// Generic arithmetic fallback
template<typename T> std::string __to_json(const T& v) {
    if constexpr (std::is_arithmetic_v<T>) {
        return std::to_string(v);
    } else {
        return "\"unsupported\"";
    }
}

std::string __to_json(const std::string& v) { return "\"" + v + "\""; }
std::string __to_json(const char* v) { return "\"" + std::string(v) + "\""; }
std::string __to_json(bool v) { return v ? "true" : "false"; }

// vector
template<typename T> std::string __to_json(const std::vector<T>& v) {
    std::string res = "[";
    for (size_t i = 0; i < v.size(); ++i) {
        res += __to_json(v[i]);
        if (i < v.size() - 1) res += ", ";
    }
    res += "]";
    return res;
}

// pair
template<typename T, typename U> std::string __to_json(const std::pair<T, U>& p) {
    return "{\"first\": " + __to_json(p.first) + ", \"second\": " + __to_json(p.second) + "}";
}

// map
template<typename K, typename V> std::string __to_json(const std::map<K, V>& m) {
    std::string res = "{";
    bool first = true;
    for (auto const& [key, val] : m) {
        if (!first) res += ", ";
        res += __to_json(key) + ": " + __to_json(val);
        first = false;
    }
    res += "}";
    return res;
}

// stack
template<typename T> std::string __to_json(const std::stack<T>& s) {
    std::stack<T> copy = s;
    std::vector<T> v;
    while (!copy.empty()) { v.insert(v.begin(), copy.top()); copy.pop(); }
    return __to_json(v);
}

// queue
template<typename T> std::string __to_json(const std::queue<T>& q) {
    std::queue<T> copy = q;
    std::vector<T> v;
    while (!copy.empty()) { v.push_back(copy.front()); copy.pop(); }
    return __to_json(v);
}

// Pointers (Trees / Linked Lists)
template<typename T> std::string __to_json(T* ptr, int depth = 0) {
    if (ptr == nullptr) return "null";
    if (depth > 15) return "\"<max_depth>\"";
    if constexpr (requires(T a) { a.next; }) {
        std::string res = "{";
        if constexpr (requires(T a) { a.val; }) {
            res += "\"val\": " + __to_json(ptr->val) + ", ";
        } else if constexpr (requires(T a) { a.value; }) {
            res += "\"value\": " + __to_json(ptr->value) + ", ";
        } else if constexpr (requires(T a) { a.data; }) {
            res += "\"data\": " + __to_json(ptr->data) + ", ";
        }
        res += "\"next\": " + __to_json(ptr->next, depth + 1);
        res += "}";
        return res;
    } else if constexpr (requires(T a) { a.left; a.right; }) {
        std::string res = "{";
        if constexpr (requires(T a) { a.val; }) {
            res += "\"val\": " + __to_json(ptr->val) + ", ";
        } else if constexpr (requires(T a) { a.value; }) {
            res += "\"value\": " + __to_json(ptr->value) + ", ";
        } else if constexpr (requires(T a) { a.data; }) {
            res += "\"data\": " + __to_json(ptr->data) + ", ";
        }
        res += "\"left\": " + __to_json(ptr->left, depth + 1) + ", ";
        res += "\"right\": " + __to_json(ptr->right, depth + 1);
        res += "}";
        return res;
    } else {
        return __to_json(*ptr);
    }
}

// Trace emitter
void __trace(int line, std::initializer_list<std::pair<std::string, std::string>> vars) {
    std::cout << "__TRACE__{\"line\": " << line << ", \"variables\": {";
    bool first = true;
    for (auto& p : vars) {
        if (!first) std::cout << ", ";
        std::cout << "\"" << p.first << "\": " << p.second;
        first = false;
    }
    std::cout << "}}__TRACE__" << std::endl;
}

#include <iostream>
using namespace std;

// Node structure
struct Node {
    int data;
    Node* next;
};

// Function to insert at beginning
void insertAtBeginning(Node*& head, int value) {
    Node* newNode = new Node(); __trace(12, {{"* newNode", __to_json(* newNode)}});   // create new node
    newNode->data = value; __trace(13, {{"* newNode", __to_json(* newNode)}});        // assign data
    newNode->next = head; __trace(14, {{"* newNode", __to_json(* newNode)}});         // point to current head
    head = newNode; __trace(15, {{"* newNode", __to_json(* newNode)}});               // update head
}

// Function to insert at end
void insertAtEnd(Node*& head, int value) {
    Node* newNode = new Node(); __trace(20, {{"* newNode", __to_json(* newNode)}});
    newNode->data = value; __trace(21, {{"* newNode", __to_json(* newNode)}});
    newNode->next = NULL; __trace(22, {{"* newNode", __to_json(* newNode)}});

    if (head == NULL) {
        head = newNode; __trace(25, {{"* newNode", __to_json(* newNode)}});
        __trace(26, {{"* newNode", __to_json(* newNode)}}); return;
    }

    Node* temp = head; __trace(29, {{"* newNode", __to_json(* newNode)}, {"* temp", __to_json(* temp)}});
    while (temp->next != NULL) {  // go to last node
        temp = temp->next; __trace(31, {{"* newNode", __to_json(* newNode)}, {"* temp", __to_json(* temp)}});
    }

    temp->next = newNode; __trace(34, {{"* newNode", __to_json(* newNode)}, {"* temp", __to_json(* temp)}}); // attach new node
}

// Function to delete a node
void deleteNode(Node*& head, int value) {
    if (head == NULL) return;

    // if head is to be deleted
    if (head->data == value) {
        Node* temp = head; __trace(43, {{"* temp", __to_json(* temp)}});
        head = head->next; __trace(44, {{"* temp", __to_json(* temp)}});
        delete temp; __trace(45, {{"* temp", __to_json(* temp)}});
        __trace(46, {{"* temp", __to_json(* temp)}}); return;
    }

    Node* temp = head; __trace(49, {{"* temp", __to_json(* temp)}});
    while (temp->next != NULL && temp->next->data != value) {
        temp = temp->next; __trace(51, {{"* temp", __to_json(* temp)}});
    }

    if (temp->next == NULL) return; // value not found

    Node* nodeToDelete = temp->next; __trace(56, {{"* temp", __to_json(* temp)}, {"* nodeToDelete", __to_json(* nodeToDelete)}});
    temp->next = temp->next->next; __trace(57, {{"* temp", __to_json(* temp)}, {"* nodeToDelete", __to_json(* nodeToDelete)}});
    delete nodeToDelete; __trace(58, {{"* temp", __to_json(* temp)}, {"* nodeToDelete", __to_json(* nodeToDelete)}});
}

// Function to display list
void display(Node* head) {
    Node* temp = head; __trace(63, {{"* temp", __to_json(* temp)}});
    while (temp != NULL) {
        cout << temp->data << " -> "; __trace(65, {{"* temp", __to_json(* temp)}});
        temp = temp->next; __trace(66, {{"* temp", __to_json(* temp)}});
    }
    cout << "NULL" << endl; __trace(68, {{"* temp", __to_json(* temp)}});
}

// Main function
int main() {
    Node* head = NULL; __trace(73, {{"* head", __to_json(* head)}}); // empty list

    insertAtBeginning(head, 10); __trace(75, {{"* head", __to_json(* head)}});
    insertAtBeginning(head, 20); __trace(76, {{"* head", __to_json(* head)}});
    insertAtEnd(head, 30); __trace(77, {{"* head", __to_json(* head)}});
    insertAtEnd(head, 40); __trace(78, {{"* head", __to_json(* head)}});

    cout << "Linked List: "; __trace(80, {{"* head", __to_json(* head)}});
    display(head); __trace(81, {{"* head", __to_json(* head)}});

    deleteNode(head, 20); __trace(83, {{"* head", __to_json(* head)}});
    cout << "After deleting 20: "; __trace(84, {{"* head", __to_json(* head)}});
    display(head); __trace(85, {{"* head", __to_json(* head)}});

    __trace(87, {{"* head", __to_json(* head)}}); return 0;
}