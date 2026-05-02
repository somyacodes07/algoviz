import { CppInstrumenter } from './backend/sandbox/transpiler/cppInstrumenter';
import fs from 'fs';

const code = `#include <iostream>
using namespace std;

// Node structure
struct Node {
    int data;
    Node* next;
};

// Function to insert at beginning
void insertAtBeginning(Node*& head, int value) {
    Node* newNode = new Node();   // create new node
    newNode->data = value;        // assign data
    newNode->next = head;         // point to current head
    head = newNode;               // update head
}

// Function to insert at end
void insertAtEnd(Node*& head, int value) {
    Node* newNode = new Node();
    newNode->data = value;
    newNode->next = NULL;

    if (head == NULL) {
        head = newNode;
        return;
    }

    Node* temp = head;
    while (temp->next != NULL) {  // go to last node
        temp = temp->next;
    }

    temp->next = newNode; // attach new node
}

// Function to delete a node
void deleteNode(Node*& head, int value) {
    if (head == NULL) return;

    // if head is to be deleted
    if (head->data == value) {
        Node* temp = head;
        head = head->next;
        delete temp;
        return;
    }

    Node* temp = head;
    while (temp->next != NULL && temp->next->data != value) {
        temp = temp->next;
    }

    if (temp->next == NULL) return; // value not found

    Node* nodeToDelete = temp->next;
    temp->next = temp->next->next;
    delete nodeToDelete;
}

// Function to display list
void display(Node* head) {
    Node* temp = head;
    while (temp != NULL) {
        cout << temp->data << " -> ";
        temp = temp->next;
    }
    cout << "NULL" << endl;
}

// Main function
int main() {
    Node* head = NULL; // empty list

    insertAtBeginning(head, 10);
    insertAtBeginning(head, 20);
    insertAtEnd(head, 30);
    insertAtEnd(head, 40);

    cout << "Linked List: ";
    display(head);

    deleteNode(head, 20);
    cout << "After deleting 20: ";
    display(head);

    return 0;
}`;

async function main() {
  const instrumenter = new CppInstrumenter();
  const output = await instrumenter.instrument(code);
  fs.writeFileSync('test_ll_instrumented.cpp', output);
  console.log("Wrote instrumented code to test_ll_instrumented.cpp");
}

main().catch(console.error);
