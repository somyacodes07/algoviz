import { Breakpoint } from './types';

export interface CodeTemplate {
  name: string;
  description: string;
  language: string;
  code: string;
}

export const JS_TEMPLATES: CodeTemplate[] = [
  {
    name: 'Bubble Sort',
    description: 'Classic O(n²) sorting algorithm',
    language: 'javascript',
    code: `// Bubble Sort Algorithm
let arr = [64, 34, 25, 12, 22, 11, 90];
let n = arr.length;

for (let i = 0; i < n - 1; i++) {
  for (let j = 0; j < n - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      let temp = arr[j];
      arr[j] = arr[j + 1];
      arr[j + 1] = temp;
    }
  }
}

console.log("Sorted:", arr);
`
  },
  {
    name: 'Binary Search',
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
    name: 'Fibonacci',
    description: 'Generate Fibonacci sequence',
    language: 'javascript',
    code: `// Fibonacci Sequence
let n = 10;
let fib = [0, 1];

for (let i = 2; i < n; i++) {
  fib[i] = fib[i - 1] + fib[i - 2];
  console.log("F(" + i + ") =", fib[i]);
}

console.log("Sequence:", fib);
`
  },
  {
    name: 'Factorial (Recursive)',
    description: 'Recursive factorial with call stack',
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
  },
  {
    name: 'Selection Sort',
    description: 'Find minimum and swap',
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
    console.log("Swapped:", arr);
  }
}

console.log("Sorted:", arr);
`
  },
  {
    name: 'Two Sum',
    description: 'Find pair that sums to target',
    language: 'javascript',
    code: `// Two Sum Problem
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
  }
];

export const CPP_TEMPLATES: CodeTemplate[] = [
  {
    name: 'Bubble Sort',
    description: 'Classic O(n²) sorting',
    language: 'c++',
    code: `// Bubble Sort in C++
#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};
    int n = arr.size();

    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }

    cout << "Sorted!" << endl;
    for (int x : arr) {
        cout << x << " " << endl;
    }

    return 0;
}
`
  },
  {
    name: 'Selection Sort',
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
        int temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }

    cout << "Sorted!" << endl;
    for (int x : arr) {
        cout << x << " " << endl;
    }

    return 0;
}
`
  },
  {
    name: 'Linear Search',
    description: 'Simple O(n) search',
    language: 'c++',
    code: `// Linear Search in C++
#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> arr = {4, 2, 7, 1, 9, 3};
    int target = 7;
    int result = -1;

    for (int i = 0; i < arr.size(); i++) {
        cout << "Checking index " << i << endl;
        if (arr[i] == target) {
            result = i;
            cout << "Found at index " << i << endl;
            break;
        }
    }

    if (result == -1) {
        cout << "Not found" << endl;
    }

    return 0;
}
`
  }
];
