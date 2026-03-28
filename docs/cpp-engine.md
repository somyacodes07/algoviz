# The C++ Transpiler Engine

C++ visualization in the browser represents an extremely complex technical challenge. Traditionally, compiling C++ in a browser requires heavy WebAssembly toolchains (like Clang compiled to WASM). However, WebAssembly does not natively expose internal variable states or line-by-line runtime contexts to the JS DOM—making step-by-step visual debugging incredibly difficult.

To solve this, AlgoViz utilizes a proprietary **WebAssembly Tree-Sitter AST Engine** (`backend/sandbox/transpiler/`). Because C++ Data Structures and Algorithms code generally relies exclusively on primitive types and STL templates, we can safely and robustly parse C++ into an Abstract Syntax Tree (AST), transform it into an equivalent JavaScript AST, and emit perfectly valid JS logic to run inside our visualization sandbox.

## The Transpilation Pipeline

When you hit **Run** on C++ code, the engine executes these distinct phases:

1. **WASM Parsing (Tree-Sitter)**
   - The browser securely loads `web-tree-sitter.wasm` and parsing grammar.
   - The user's C++ code is converted into a fully queryable AST, which eliminates all the flaws of outdated Regex-based approaches.

2. **AST Transformation Mapping**
   - The `transformer.ts` logically walks the tree, mapping C++ syntax to matching JavaScript structures:
   - `std::vector<int> arr;` → `let arr = [];`
   - `queue<int> q;` → `let q = [];`
   - Deeply nested structures like `vector<vector<int>> dp(10, vector<int>(5, 0))` are gracefully parsed and expanded sequentially into loops and JS `Array().fill()` combinations!
   - Translates deeply nested `for(auto x : vec)` loops into JS `for(let x of vec)`.
   - Transforms standard library functions dynamically based on AST Call Expressions:
     - `push_back()` → `push()`
     - `pop_back()` → `pop()`
     - `size()` / `length()` → `length`
     - `.front()` → `[0]` and `.erase(.begin())` → `.shift()` for perfect Breadth-First-Search visualizations!

3. **Strict Integer Mathematics Mapping**
   JavaScript structurally lacks static integer types. All numbers are 64-bit IEEE 754 floats. This breaks C++ loops that rely on explicit integer division. 
   
   If a student wrote `mid = (low + high) / 2;` or `num /= 10;` in C++, JS would evaluate it to floating decimals (e.g. `2.5`), shattering loops recursively into eternity.

   **Solution**: The transpiler actively intercepts the AST Assignment and Binary Expressions for variables statically declared as integers (`int mid = ...`), traversing up the tree and wrapping them in `Math.trunc()` closures dynamically:
   ```javascript
   let mid = Math.trunc((l + r) / 2);
   num = Math.trunc(num / 10);
   ```
   This securely forces authentic C++ algorithm behavior within JavaScript!

4. **Code Generation**
   Finally, the generated AST structure is emitted as a valid JavaScript string, which is then securely passed into the Stage 2 **Sandbox Instrumenter** for timeline recording!
