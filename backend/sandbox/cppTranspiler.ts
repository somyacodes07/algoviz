
/**
 * A comprehensive C++ to JavaScript transpiler for educational visualization.
 * 
 * Covers the vast majority of educational C++ patterns:
 * - Preprocessor directives, macros, typedefs
 * - All primitive types, const correctness
 * - Vectors (including nested), arrays (including 2D), strings
 * - cout, cerr, cin, printf
 * - STL containers: map, set, pair, stack, queue
 * - STL algorithms: sort, reverse, swap, min, max, find
 * - Math functions: abs, pow, sqrt, ceil, floor, log
 * - Constants: INT_MAX, INT_MIN, nullptr
 * - Helper functions + main() extraction
 * - Range-based for loops
 * - All loop types, switch/case, if/else
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Find the index of the matching closing brace for an opening brace.
 * Handles nested braces, strings, and character literals correctly.
 */
function findMatchingBrace(code: string, openIndex: number): number {
    let depth = 0;
    let inString = false;
    let inChar = false;
    let stringChar = '';

    for (let i = openIndex; i < code.length; i++) {
        const ch = code[i];
        const prev = i > 0 ? code[i - 1] : '';

        // Handle string/char literal boundaries
        if (!inChar && (ch === '"') && prev !== '\\') {
            inString = !inString;
            continue;
        }
        if (!inString && (ch === "'") && prev !== '\\') {
            inChar = !inChar;
            continue;
        }
        if (inString || inChar) continue;

        // Handle single-line comments
        if (ch === '/' && i + 1 < code.length && code[i + 1] === '/') {
            // Skip to end of line
            const eol = code.indexOf('\n', i);
            if (eol === -1) return -1;
            i = eol;
            continue;
        }

        // Handle multi-line comments
        if (ch === '/' && i + 1 < code.length && code[i + 1] === '*') {
            const end = code.indexOf('*/', i + 2);
            if (end === -1) return -1;
            i = end + 1;
            continue;
        }

        if (ch === '{') depth++;
        if (ch === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

/**
 * Parse cout/cerr << chains, correctly handling parenthesized expressions
 * (so bitshift << inside parens is not confused with cout's <<).
 */
function parseCoutArgs(argsStr: string): string {
    const parts: string[] = [];
    let current = '';
    let parenDepth = 0;

    for (let i = 0; i < argsStr.length; i++) {
        const ch = argsStr[i];

        if (ch === '(') parenDepth++;
        if (ch === ')') parenDepth--;

        // Only treat << as a separator when not inside parentheses
        if (parenDepth === 0 && ch === '<' && i + 1 < argsStr.length && argsStr[i + 1] === '<') {
            const trimmed = current.trim();
            if (trimmed) parts.push(trimmed);
            current = '';
            i++; // skip second <
            continue;
        }

        current += ch;
    }
    const trimmed = current.trim();
    if (trimmed) parts.push(trimmed);

    // Filter out endl / std::endl and "\n"
    const filtered = parts.filter(p => {
        const clean = p.trim();
        return clean !== 'endl' && clean !== 'std::endl';
    });

    return filtered.join(', ');
}

// ─── Main Transpiler ────────────────────────────────────────────────────────

export function transpileCppToJs(cppCode: string): string {
    let js = cppCode;

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Preprocessor & Boilerplate Removal
    // ═══════════════════════════════════════════════════════════════════════

    // Helper to preserve exact line numbers by replacing stripped content with equivalent newlines
    const preserveLines = (match: string, replacer = '') => {
        const newlines = (match.match(/\n/g) || []).length;
        return replacer + '\n'.repeat(newlines);
    };

    // Remove #include <...> and #include "..."
    js = js.replace(/#include\s*<[^>]*>/g, (m) => preserveLines(m, '// include placeholder'));
    js = js.replace(/#include\s*"[^"]*"/g, (m) => preserveLines(m, '// include placeholder'));

    // Convert #define NAME VALUE → const NAME = VALUE;
    js = js.replace(/#define\s+(\w+)\s+(.+)/g, 'const $1 = $2;');

    // Remove using namespace std;
    js = js.replace(/using\s+namespace\s+std\s*;/g, (m) => preserveLines(m, '// namespace placeholder'));

    // Remove typedef / using aliases (e.g., typedef long long ll;)
    js = js.replace(/typedef\s+[\w\s]+\s+(\w+)\s*;/g, (m) => preserveLines(m, '// typedef placeholder'));
    js = js.replace(/using\s+\w+\s*=\s*[^;]+;/g, (m) => preserveLines(m, '// using alias placeholder'));

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: Extract Functions & Main
    // ═══════════════════════════════════════════════════════════════════════

    // Find all function definitions (return_type name(params) { body })
    // We need to handle these BEFORE type replacement, so we can identify them.
    const functionBodies: string[] = [];
    let mainBody = '';

    // Regex to find function signatures
    const funcRegex = /(?:^|\n)(\s*)(?:(?:(?:inline|constexpr|static|virtual)\s+)?(?:void|int|float|double|string|bool|char|long|auto|long\s+long|unsigned\s+int|short)\s+)(\w+)\s*\(([^)]*)\)\s*\{/g;

    let match: RegExpExecArray | null;
    const processedCode = js;

    // Collect all functions
    const functions: Array<{ name: string; params: string; body: string; fullMatch: string; startIndex: number; openBraceIndex: number; closeBraceIndex: number; indent: string }> = [];

    // Reset regex
    funcRegex.lastIndex = 0;

    while ((match = funcRegex.exec(processedCode)) !== null) {
        const indent = match[1];
        const funcName = match[2];
        const params = match[3];
        const openBraceIndex = processedCode.indexOf('{', match.index + match[0].length - 1);

        if (openBraceIndex === -1) continue;

        const closeBraceIndex = findMatchingBrace(processedCode, openBraceIndex);
        if (closeBraceIndex === -1) continue;

        const body = processedCode.substring(openBraceIndex + 1, closeBraceIndex);
        const fullMatch = processedCode.substring(match.index, closeBraceIndex + 1);

        functions.push({ 
            name: funcName, 
            params, 
            body, 
            fullMatch, 
            startIndex: match.index, 
            openBraceIndex, 
            closeBraceIndex,
            indent
        });
    }

    // Sort functions from bottom to top so replacements don't invalidate indices
    functions.sort((a, b) => b.startIndex - a.startIndex);

    for (const func of functions) {
        const { name, params, startIndex, openBraceIndex, closeBraceIndex, indent } = func;
        
        if (name === 'main') {
            // Replaces: "int main() {"  → "// int main() {"
            // Replaces: "}" (at closeBrace) → "// }"
            const beforeSig = js.substring(0, startIndex);
            const signature = js.substring(startIndex, openBraceIndex + 1);
            const insideBody = js.substring(openBraceIndex + 1, closeBraceIndex);
            const afterBody = js.substring(closeBraceIndex + 1);
            
            // Comment out signature but preserve its newlines, handle the beginning of string matching correctly
            // We'll just replace the first non-whitespace character with // 
            const commentedSignature = signature.replace(/([\w\\]+.*)/s, '// $1');
            
            // Also nullify `return 0;` inside main
            const modifiedBody = insideBody.replace(/return\s+0\s*;/g, '// return 0;');
            
            js = beforeSig + commentedSignature + modifiedBody + '// }' + afterBody;
        } else {
            // Helper function: "void swap(int a, int b) {" → "function swap(a, b) {"
            // Transpile parameters: remove C++ types from params
            const jsParams = params
                .split(',')
                .map(p => {
                    const trimmed = p.trim();
                    if (!trimmed) return '';
                    // Remove type prefix: "int x" → "x", "const string& s" → "s"
                    const parts = trimmed.replace(/&/g, '').trim().split(/\s+/);
                    return parts[parts.length - 1]; // last token is the name
                })
                .filter(Boolean)
                .join(', ');

            const beforeSig = js.substring(0, startIndex);
            const signature = js.substring(startIndex, openBraceIndex + 1);
            const afterSig = js.substring(openBraceIndex + 1);
            
            // We want to replace the C++ signature with "function name(params) {"
            // Keep the exact same number of newlines if possible, but standard definition is fine
            const sigNewlines = (signature.match(/\n/g) || []).join('');
            const jsSignature = `${sigNewlines}${indent}function ${name}(${jsParams}) {`;
            
            js = beforeSig + jsSignature + afterSig;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: STL Containers (BEFORE type replacement to catch template syntax)
    // ═══════════════════════════════════════════════════════════════════════

    // --- Nested vectors: vector<vector<int>> ---
    // vector<vector<int>> vv = {{1,2},{3,4}}; → let vv = [[1,2],[3,4]];
    js = js.replace(/(?:std::)?vector\s*<\s*(?:std::)?vector\s*<[^>]+>\s*>\s+(\w+)\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name, init) => {
        const converted = init.replace(/\{/g, '[').replace(/\}/g, ']');
        return `let ${name} = [${converted}];`;
    });
    // vector<vector<int>> vv; → let vv = [];
    js = js.replace(/(?:std::)?vector\s*<\s*(?:std::)?vector\s*<[^>]+>\s*>\s+(\w+)\s*;/g, 'let $1 = [];');

    // --- Single vectors ---
    // vector<int> v = {1, 2, 3}; → let v = [1, 2, 3];
    js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name, init) => {
        const converted = init.replace(/\{/g, '[').replace(/\}/g, ']');
        return `let ${name} = [${converted}];`;
    });
    // vector<int> v; → let v = [];
    js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*;/g, 'let $1 = [];');
    // vector<int> v(n, val); → let v = Array(n).fill(val);
    js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*\(([^,]+),\s*([^)]+)\)\s*;/g, 'let $1 = Array($2).fill($3);');
    // vector<int> v(n); → let v = Array(n).fill(0);
    js = js.replace(/(?:std::)?vector\s*<[^>]+>\s+(\w+)\s*\(([^)]+)\)\s*;/g, 'let $1 = Array($2).fill(0);');

    // --- Map ---
    // map<string, int> m; → let m = new Map();
    js = js.replace(/(?:std::)?(?:unordered_)?map\s*<[^>]+>\s+(\w+)\s*;/g, 'let $1 = new Map();');
    // map<string, int> m = {{...}}; → let m = new Map([...]);
    js = js.replace(/(?:std::)?(?:unordered_)?map\s*<[^>]+>\s+(\w+)\s*=\s*\{([^}]*)\}\s*;/g, (_, name, init) => {
        // Convert {{"a", 1}, {"b", 2}} → [["a", 1], ["b", 2]]
        const converted = init.replace(/\{/g, '[').replace(/\}/g, ']');
        return `let ${name} = new Map([${converted}]);`;
    });

    // --- Set ---
    // set<int> s; → let s = new Set();
    js = js.replace(/(?:std::)?(?:unordered_)?set\s*<[^>]+>\s+(\w+)\s*;/g, 'let $1 = new Set();');
    // set<int> s = {1, 2, 3}; → let s = new Set([1, 2, 3]);
    js = js.replace(/(?:std::)?(?:unordered_)?set\s*<[^>]+>\s+(\w+)\s*=\s*\{([^}]*)\}\s*;/g, 'let $1 = new Set([$2]);');

    // --- Pair ---
    // pair<int, int> p = {1, 2}; → let p = [1, 2];
    js = js.replace(/(?:std::)?pair\s*<[^>]+>\s+(\w+)\s*=\s*\{([^}]*)\}\s*;/g, 'let $1 = [$2];');
    // pair<int, int> p(1, 2); → let p = [1, 2];
    js = js.replace(/(?:std::)?pair\s*<[^>]+>\s+(\w+)\s*\(([^)]*)\)\s*;/g, 'let $1 = [$2];');
    // pair<int,int> p; → let p = [0, 0];
    js = js.replace(/(?:std::)?pair\s*<[^>]+>\s+(\w+)\s*;/g, 'let $1 = [0, 0];');
    // make_pair(a, b) → [a, b]
    js = js.replace(/(?:std::)?make_pair\s*\(([^,]+),\s*([^)]+)\)/g, '[$1, $2]');

    // --- Stack ---
    // stack<int> st; → let st = []; (with .push/.pop/.top → .push/.pop/[.length-1])
    js = js.replace(/(?:std::)?stack\s*<[^>]+>\s+(\w+)\s*;/g, 'let $1 = [];');

    // --- Queue ---
    // queue<int> q; → let q = []; (with .push/.pop/.front → .push/.shift/[0])
    js = js.replace(/(?:std::)?queue\s*<[^>]+>\s+(\w+)\s*;/g, 'let $1 = [];');

    // --- Priority Queue ---
    js = js.replace(/(?:std::)?priority_queue\s*<[^>]*>\s+(\w+)\s*;/g, 'let $1 = [];');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: Type Replacement
    // ═══════════════════════════════════════════════════════════════════════

    // Range-based for loops MUST be handled before generic type replacement
    // for (int x : vec) → for (let x of vec)
    // for (auto x : vec) → for (let x of vec)
    // for (auto& x : vec) → for (let x of vec)
    // for (const auto& x : vec) → for (const x of vec)  
    js = js.replace(/for\s*\(\s*(?:const\s+)?(?:auto|int|float|double|string|char|long|long\s+long|unsigned\s+int|short|bool)\s*&?\s+(\w+)\s*:\s*/g, 'for (let $1 of ');

    // const TYPE → const
    js = js.replace(/\bconst\s+(?:int|float|double|string|bool|char|auto|long|short|long\s+long|unsigned\s+int)\s+/g, 'const ');

    // Regular types → let
    const types = [
        'long\\s+long', 'unsigned\\s+int',
        'int', 'float', 'double', 'string', 'bool', 'char', 'auto', 'long', 'short'
    ];
    const typeRegex = new RegExp(`\\b(${types.join('|')})\\s+`, 'g');
    js = js.replace(typeRegex, 'let ');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5: Arrays (after type replacement, so "int" is now "let")
    // ═══════════════════════════════════════════════════════════════════════

    // 2D Arrays: let arr[3][4]; → let arr = Array(3).fill(null).map(() => Array(4).fill(0));
    js = js.replace(/let\s+(\w+)\[(\d+)\]\[(\d+)\]\s*;/g,
        'let $1 = Array($2).fill(null).map(() => Array($3).fill(0));');

    // 2D Arrays with init: let arr[2][2] = {{1,2},{3,4}}; → let arr = [[1,2],[3,4]];
    js = js.replace(/let\s+(\w+)\[\d+\]\[\d+\]\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name, init) => {
        const converted = init.replace(/\{/g, '[').replace(/\}/g, ']');
        return `let ${name} = [${converted}];`;
    });

    // 1D Arrays: let arr[] = {1, 2, 3}; → let arr = [1, 2, 3];
    js = js.replace(/let\s+(\w+)\[\]\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name, init) => {
        return `let ${name} = [${init.replace(/\{/g, '[').replace(/\}/g, ']')}];`;
    });

    // Sized arrays with init: let arr[3] = {1, 2, 3}; → let arr = [1, 2, 3];
    js = js.replace(/let\s+(\w+)\[\d+\]\s*=\s*\{([\s\S]*?)\}\s*;/g, (_, name, init) => {
        return `let ${name} = [${init.replace(/\{/g, '[').replace(/\}/g, ']')}];`;
    });

    // Sized arrays without init: let arr[5]; → let arr = Array(5).fill(0);
    js = js.replace(/let\s+(\w+)\[(\d+)\]\s*;/g, 'let $1 = Array($2).fill(0);');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 6: I/O
    // ═══════════════════════════════════════════════════════════════════════

    // cout (parenthesis-aware to handle bitshift properly)
    js = js.replace(/(?:std::)?cout\s*<<\s*(.*);/g, (_, args) => {
        const parsed = parseCoutArgs(args);
        if (!parsed) return '// empty cout';
        return `console.log(${parsed});`;
    });

    // cerr → console.error
    js = js.replace(/(?:std::)?cerr\s*<<\s*(.*);/g, (_, args) => {
        const parsed = parseCoutArgs(args);
        if (!parsed) return '// empty cerr';
        return `console.error(${parsed});`;
    });

    // cin >> var; → let var = __tracer.input();
    // cin >> a >> b; → a = __tracer.input(); b = __tracer.input();
    js = js.replace(/(?:std::)?cin\s*>>\s*(.*);/g, (_, args) => {
        const vars = args.split('>>').map((v: string) => v.trim()).filter(Boolean);
        return vars.map((v: string) => `${v} = __tracer.input();`).join(' ');
    });

    // printf("format", args) → console.log(args) (simplified)
    js = js.replace(/printf\s*\(\s*"([^"]*)"(?:\s*,\s*([^)]*))?\)\s*;/g, (_, fmt, args) => {
        if (args) {
            return `console.log(${args.trim()});`;
        }
        return `console.log("${fmt}");`;
    });

    // scanf → input mock (simplified)
    js = js.replace(/scanf\s*\([^)]*\)\s*;/g, '// scanf not supported in visualizer');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 7: STL Method Translations
    // ═══════════════════════════════════════════════════════════════════════

    // --- Vector / Array methods ---
    js = js.replace(/\.push_back\s*\(/g, '.push(');
    js = js.replace(/\.pop_back\s*\(\s*\)/g, '.pop()');
    js = js.replace(/\.emplace_back\s*\(/g, '.push(');
    js = js.replace(/\.size\s*\(\s*\)/g, '.length');
    js = js.replace(/\.length\s*\(\s*\)/g, '.length'); // string.length() → .length
    // .empty() — dynamically use the correct variable name
    js = js.replace(/(\w+)\.empty\s*\(\s*\)/g, '($1.length === 0)');
    js = js.replace(/\.front\s*\(\s*\)/g, '[0]');
    js = js.replace(/\.back\s*\(\s*\)/g, '[this.length - 1]');
    // Fix .back() to use actual variable: x.back() → x[x.length - 1]
    js = js.replace(/(\w+)\[this\.length - 1\]/g, '$1[$1.length - 1]');
    js = js.replace(/\.clear\s*\(\s*\)/g, '.length = 0');
    js = js.replace(/\.erase\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*\)/g, '.shift()');
    js = js.replace(/\.insert\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*/g, '.unshift(');

    // --- Map methods ---
    // m[key] = val (already works in JS with objects, but Map needs .set)
    // m.count(key) → m.has(key) ? 1 : 0
    js = js.replace(/(\w+)\.count\s*\(([^)]+)\)/g, '($1.has ? ($1.has($2) ? 1 : 0) : ($2 in $1 ? 1 : 0))');
    // m.find(key) != m.end() → m.has(key) (for Map) / key in m (for object)
    js = js.replace(/(\w+)\.find\s*\(([^)]+)\)\s*!=\s*\1\.end\s*\(\s*\)/g, '$1.has($2)');
    js = js.replace(/(\w+)\.find\s*\(([^)]+)\)\s*==\s*\1\.end\s*\(\s*\)/g, '!$1.has($2)');

    // --- Set methods ---
    // s.insert(x) → s.add(x) 
    // (but only for Set objects — we handle this generically for now)
    js = js.replace(/\.insert\s*\((?!(\w+)\.begin)/g, '.add(');

    // --- Stack methods ---
    // st.top() → st[st.length - 1]
    js = js.replace(/(\w+)\.top\s*\(\s*\)/g, '$1[$1.length - 1]');
    // st.push and st.pop already work with arrays

    // --- Queue methods ---
    // q.front() → q[0] (already handled by .front() above)
    // q.pop() for queue means shift, but for stack means pop
    // This is ambiguous — we'll leave .pop() as-is since it works for stack

    // --- Pair methods ---
    // p.first → p[0], p.second → p[1]
    js = js.replace(/\.first\b/g, '[0]');
    js = js.replace(/\.second\b/g, '[1]');

    // --- String methods ---
    // str.substr(pos, len) → str.substring(pos, pos + len)
    js = js.replace(/(\w+)\.substr\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, '$1.substring($2, $2 + $3)');
    // str.substr(pos) → str.substring(pos)
    js = js.replace(/\.substr\s*\(/g, '.substring(');
    // str.find(x) → str.indexOf(x) (only when not already handled for map)
    js = js.replace(/(\w+)\.find\s*\(([^)]+)\)(?!\s*[!=]=)/g, '$1.indexOf($2)');
    // string::npos → -1
    js = js.replace(/(?:std::)?string::npos/g, '-1');
    // str.append(x) → str += x  (tricky — leave as comment for now, it partially works)
    // str.compare(other) → 0 if equal
    // to_string(x) → String(x)
    js = js.replace(/to_string\s*\(/g, 'String(');
    // stoi(x) → parseInt(x)
    js = js.replace(/stoi\s*\(/g, 'parseInt(');
    // stof/stod(x) → parseFloat(x)
    js = js.replace(/sto[fd]\s*\(/g, 'parseFloat(');
    // getline(cin, str) → str = __tracer.input()
    js = js.replace(/getline\s*\(\s*(?:std::)?cin\s*,\s*(\w+)\s*\)/g, '$1 = __tracer.input()');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 8: STL Algorithms
    // ═══════════════════════════════════════════════════════════════════════

    // sort(v.begin(), v.end()) → v.sort((a,b) => a - b)
    js = js.replace(/(?:std::)?sort\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
        '$1.sort((a, b) => a - b)');
    // sort(v.begin(), v.end(), greater<int>()) → v.sort((a,b) => b - a)
    js = js.replace(/(?:std::)?sort\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*(?:std::)?greater\s*<[^>]*>\s*\(\s*\)\s*\)/g,
        '$1.sort((a, b) => b - a)');
    // sort(v.begin(), v.end(), comp) → v.sort(comp)
    js = js.replace(/(?:std::)?sort\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*(\w+)\s*\)/g,
        '$1.sort($2)');
    // sort(arr, arr + n) → arr.sort((a,b) => a - b)
    js = js.replace(/(?:std::)?sort\s*\(\s*(\w+)\s*,\s*\1\s*\+\s*(\w+)\s*\)/g,
        '$1.sort((a, b) => a - b)');


    // reverse(v.begin(), v.end()) → v.reverse()
    js = js.replace(/(?:std::)?reverse\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
        '$1.reverse()');

    // swap(a, b) → [a, b] = [b, a] (statement-level swap)
    js = js.replace(/(?:std::)?swap\s*\(\s*(\w+(?:\[[^\]]*\])?)\s*,\s*(\w+(?:\[[^\]]*\])?)\s*\)\s*;/g,
        '[$1, $2] = [$2, $1];');

    // find(v.begin(), v.end(), val) → v.indexOf(val)
    js = js.replace(/(?:std::)?find\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
        '$1.indexOf($2)');

    // accumulate(v.begin(), v.end(), 0) → v.reduce((a,b) => a+b, 0)
    js = js.replace(/(?:std::)?accumulate\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
        '$1.reduce((a, b) => a + b, $2)');

    // min_element / max_element
    js = js.replace(/\*\s*(?:std::)?min_element\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
        'Math.min(...$1)');
    js = js.replace(/\*\s*(?:std::)?max_element\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*\)/g,
        'Math.max(...$1)');

    // fill(v.begin(), v.end(), val) → v.fill(val)
    js = js.replace(/(?:std::)?fill\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
        '$1.fill($2)');

    // count(v.begin(), v.end(), val) → v.filter(x => x === val).length
    js = js.replace(/(?:std::)?count\s*\(\s*(\w+)\.begin\s*\(\s*\)\s*,\s*\1\.end\s*\(\s*\)\s*,\s*([^)]+)\s*\)/g,
        '$1.filter(x => x === $2).length');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 9: Math Functions & Constants
    // ═══════════════════════════════════════════════════════════════════════

    // min/max — but not inside sort or other already-handled contexts
    js = js.replace(/(?:std::)?min\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, 'Math.min($1, $2)');
    js = js.replace(/(?:std::)?max\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, 'Math.max($1, $2)');

    // Math functions — (?<!\.) prevents matching property accesses like console.log
    js = js.replace(/(?<!\.)(?:\b)abs\s*\(/g, 'Math.abs(');
    js = js.replace(/(?<!\.)(?:\b)pow\s*\(/g, 'Math.pow(');
    js = js.replace(/(?<!\.)(?:\b)sqrt\s*\(/g, 'Math.sqrt(');
    js = js.replace(/(?<!\.)(?:\b)ceil\s*\(/g, 'Math.ceil(');
    js = js.replace(/(?<!\.)(?:\b)floor\s*\(/g, 'Math.floor(');
    js = js.replace(/(?<!\.)(?:\b)log\s*\(/g, 'Math.log(');
    js = js.replace(/(?<!\.)(?:\b)log2\s*\(/g, 'Math.log2(');
    js = js.replace(/(?<!\.)(?:\b)log10\s*\(/g, 'Math.log10(');
    js = js.replace(/(?<!\.)(?:\b)round\s*\(/g, 'Math.round(');

    // Constants
    js = js.replace(/\bINT_MAX\b/g, 'Number.MAX_SAFE_INTEGER');
    js = js.replace(/\bINT_MIN\b/g, 'Number.MIN_SAFE_INTEGER');
    js = js.replace(/\bLLONG_MAX\b/g, 'Number.MAX_SAFE_INTEGER');
    js = js.replace(/\bLLONG_MIN\b/g, 'Number.MIN_SAFE_INTEGER');
    js = js.replace(/\bnullptr\b/g, 'null');
    js = js.replace(/\bNULL\b/g, 'null');
    js = js.replace(/\btrue\b/g, 'true');
    js = js.replace(/\bfalse\b/g, 'false');

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 10: Cleanup
    // ═══════════════════════════════════════════════════════════════════════

    // Remove stray std:: prefixes
    js = js.replace(/std::/g, '');

    // Remove remaining C++ reference operators (&) in variable declarations
    // e.g., "let &x" → "let x"
    js = js.replace(/\blet\s+&(\w+)/g, 'let $1');
    js = js.replace(/\bconst\s+&(\w+)/g, 'const $1');

    // Clean up multiple blank lines
    js = js.replace(/\n{3,}/g, '\n\n');

    // Trim leading/trailing whitespace
    js = js.trim();

    return js;
}
