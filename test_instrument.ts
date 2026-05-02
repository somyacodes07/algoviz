import { CppInstrumenter } from './backend/sandbox/transpiler/cppInstrumenter';

const code = `// C++ Visualizer (Beta): Find Maximum
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

    cout << "Maximum value: " << maxVal << " at index " << maxIndex << endl;
    return maxVal;
}`;

async function main() {
  const inst = new CppInstrumenter();
  const result = await inst.instrument(code);
  console.log("=== INSTRUMENTED CODE ===");
  console.log(result);
}
main().catch(console.error);
