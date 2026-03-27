# The C++ Transpiler Engine

C++ visualization in the browser represents an extremely complex technical challenge. Traditionally, compiling C++ in a browser requires WebAssembly toolchains (like Clang compiled to WASM). However, WebAssembly does not natively expose internal variable states or line-by-line runtime contexts to the DOM—making step-by-step visual debugging incredibly difficult.

To solve this, AlgoViz utilizes a proprietary **C++ to JS Regex AST Engine** (`cppTranspiler.ts`). Because C++ Data Structures and Algorithms code generally relies exclusively on primitive types and STL templates, we can safely transpile these constructs over to JavaScript logic, run them inside a sandbox, and perfectly visualize the underlying memory.

## The Transpilation Pipeline

When you hit **Run** on C++ code, the engine executes four distinct rewriting phases:

1. **Pre-Processing (I/O & Headers)**
   - Strips \`#include\` directives and \`using namespace std;\`.
   - Replaces literal string prints (\`cout << "Hello" << endl;\`) into equivalent \`console.log("Hello");\` chains.
   - Replaces console inputs (\`cin >> x;\`) with sandboxed \`__tracer.input()\` sequences. Wait, cin is fully abstracted to pull from a deterministic sandbox array so graph algorithms always test successfully automatically.

2. **STL Container Mapping**
   - Transpiles \`vector<int> arr;\` into \`let arr = [];\`
   - Transpiles complex graphs \`vector<vector<int>> graph = {{1, 2}, {3}};\` seamlessly into \`let graph = [[1, 2], [3]];\`
   - Translates deeply nested `for(auto x : vec)` loops into JS `for(let x of vec)`.
   - Transforms standard library functions:
     - \`push_back()\` → \`push()\`
     - \`pop_back()\` → \`pop()\`
     - \`size()\` / \`length()\` → \`length\`
     - \`.front()\` → \`[0]\` and \`.erase(.begin())\` → \`.shift()\` for perfect Breadth-First-Search visualizations!

3. **Strict Integer Mathematics**
   JavaScript structurally lacks static integer types. All numbers are 64-bit IEEE 754 floats. This breaks C++ loops that rely on explicit integer division. 
   
   If a student wrote \`mid = (low + high) / 2;\` or \`num /= 10;\` in C++, JS would evaluate it to floating decimals (e.g. \`2.5\`), shattering the loops recursively into eternity.

   **Solution**: The transpiler actively intercepts the right-hand sides of explicitly declared integer variables:
   \`\`\`cpp
   int mid = (l + r) / 2;
   num /= 10;
   \`\`\`
   And wraps them in `Math.trunc()` closures dynamically:
   \`\`\`javascript
   let mid = Math.trunc((l + r) / 2);
   num = Math.trunc(num / 10);
   \`\`\`
   This securely forces authentic C++ algorithm behavior within JavaScript!
