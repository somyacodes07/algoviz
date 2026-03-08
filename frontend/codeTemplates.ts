
export interface CodeTemplate {
  name: string;
  description: string;
  language: string;
  code: string;
}

export const JS_TEMPLATES: CodeTemplate[] = [
  // Arrays
  {
    name: '[Arrays] Find Maximum',
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
  
  // Move pointers
  left++;
  right--;
}

console.log("Reversed array:", arr);
`
  },
  {
    name: '[Arrays] Two Sum',
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

  // Searching
  {
    name: '[Search] Linear Search',
    description: 'Simple O(n) search',
    language: 'javascript',
    code: `// Linear Search Algorithm
let arr = [4, 2, 7, 1, 9, 3];
let target = 7;
let result = -1;

for (let i = 0; i < arr.length; i++) {
  console.log("Checking index", i);
  if (arr[i] === target) {
    result = i;
    console.log("Found at index", i);
    break;
  }
}

if (result === -1) {
  console.log("Not found");
}
`
  },
  {
    name: '[Search] Binary Search',
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

  // Sorting
  {
    name: '[Sort] Bubble Sort',
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
    name: '[Sort] Selection Sort',
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
    console.log("Swapped elements");
  }
}

console.log("Sorted:", arr);
`
  },
  {
    name: '[Sort] Insertion Sort',
    description: 'Build sorted array one element at a time',
    language: 'javascript',
    code: `// Insertion Sort Algorithm
let arr = [12, 11, 13, 5, 6];
let n = arr.length;

for (let i = 1; i < n; i++) {
  let key = arr[i];
  let j = i - 1;

  // Move elements that are greater than key
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    j = j - 1;
  }
  arr[j + 1] = key;
}

console.log("Sorted:", arr);
`
  },

  // Math & Recursion
  {
    name: '[Math] Fibonacci Sequence',
    description: 'Generate Fibonacci sequence iteratively',
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
    name: '[Recursion] Factorial',
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
  }
];

export const CPP_TEMPLATES: CodeTemplate[] = [
  // Arrays
  {
    name: '[Arrays] Find Maximum',
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
        // Swap elements
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        
        // Move pointers
        left++;
        right--;
    }

    cout << "Reversed array:" << endl;
    for (int x : arr) {
        cout << x << endl;
    }
    return 0;
}
`
  },

  // Searching
  {
    name: '[Search] Linear Search',
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
  },
  {
    name: '[Search] Binary Search',
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

  // Sorting
  {
    name: '[Sort] Bubble Sort',
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
        cout << x << endl;
    }

    return 0;
}
`
  },
  {
    name: '[Sort] Selection Sort',
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
        }
    }

    cout << "Sorted!" << endl;
    for (int x : arr) {
        cout << x << endl;
    }

    return 0;
}
`
  },
  {
    name: '[Sort] Insertion Sort',
    description: 'Build sorted array one element at a time',
    language: 'c++',
    code: `// Insertion Sort in C++
#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> arr = {12, 11, 13, 5, 6};
    int n = arr.size();

    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;

        // Move elements that are greater than key
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }

    cout << "Sorted!" << endl;
    for (int x : arr) {
        cout << x << endl;
    }

    return 0;
}
`
  },

  // Math & Recursion
  {
    name: '[Math] Fibonacci Sequence',
    description: 'Generate Fibonacci sequence iteratively',
    language: 'c++',
    code: `// Fibonacci Sequence in C++
#include <iostream>
#include <vector>

using namespace std;

int main() {
    int n = 10;
    vector<int> fib(n);
    fib[0] = 0;
    fib[1] = 1;

    for (int i = 2; i < n; i++) {
        fib[i] = fib[i - 1] + fib[i - 2];
        cout << "F(" << i << ") = " << fib[i] << endl;
    }

    return 0;
}
`
  },
  {
    name: '[Recursion] Factorial',
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
