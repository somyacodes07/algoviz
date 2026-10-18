import { Node, Tree } from 'web-tree-sitter';
import { parseCpp } from './parser';

interface Patch {
  index: number;
  text: string;
}

/**
 * C++ Source-to-Source Instrumenter.
 * Injects tracing calls into C++ code to capture variable states and execution path.
 *
 * Key design decisions:
 * - Scope tracking mirrors C++ scoping rules: for/while/do push their own scope
 *   so loop-iterator variables (e.g. `int i`) don't leak into outer trace calls.
 * - Trace calls are injected AFTER most statements but BEFORE return statements
 *   (since code after a return is dead/unreachable).
 * - Only statements that are direct children of a compound_statement are traced,
 *   preventing injection inside for-loop headers or if-conditions.
 */
export class CppInstrumenter {
  private patches: Patch[] = [];
  private scopeStack: Set<string>[] = [];

  constructor() {}

  /**
   * Instrument C++ code with trace calls.
   */
  public async instrument(code: string): Promise<string> {
    const { initParser } = await import('./parser');
    await initParser();

    const tree = parseCpp(code);
    this.patches = [];
    this.scopeStack = [new Set()];

    this.walk(tree.rootNode);

    // Sort patches in reverse order to apply them from end to start
    this.patches.sort((a, b) => b.index - a.index);

    let instrumentedCode = code;
    for (const patch of this.patches) {
      instrumentedCode =
        instrumentedCode.slice(0, patch.index) + patch.text + instrumentedCode.slice(patch.index);
    }

    return this.getTraceHeader() + '\n' + instrumentedCode;
  }

  private addPatch(index: number, text: string) {
    this.patches.push({ index, text });
  }

  private walk(node: Node) {
    if (!node) return;

    const type = node.type;
    const startLine = node.startPosition.row + 1; // 1-indexed for visualizer

    // Push scope for compound_statement AND for loop/while/do statements.
    // In C++, `for (int i = ...)` declares `i` in the for-statement's own scope,
    // so we must push/pop here to prevent `i` from leaking into the parent scope.
    const isBlock = type === 'compound_statement';
    const isLoopScope =
      type === 'for_statement' ||
      type === 'while_statement' ||
      type === 'do_statement' ||
      type === 'for_range_loop';

    if (isBlock || isLoopScope) {
      this.scopeStack.push(new Set());
    }

    // Capture Variable Declarations
    if (type === 'declaration') {
      this.handleDeclaration(node);
    }

    // Conditions are wrapped at their original evaluation site and evaluated
    // exactly once by the helper. Only condition fields are touched.
    if (['if_statement', 'while_statement', 'do_statement', 'for_statement'].includes(type)) {
      const condition = node.childForFieldName('condition');
      const test = condition?.type === 'condition_clause'
        ? condition.namedChildren.find((child) => child.type !== 'init_statement' && !child.type.includes('declaration'))
        : condition;
      if (test && !test.type.includes('declaration')) {
        this.addPatch(test.startIndex, `(__trace_condition(${startLine}, (`);
        this.addPatch(test.endIndex, ')))');
      }
    }

    if (type === 'function_definition') {
      const body = node.childForFieldName('body');
      const declarator = node.childForFieldName('declarator');
      const functionName = declarator?.text.match(/([A-Za-z_]\w*(?:::[A-Za-z_]\w*)*)\s*\(/)?.[1];
      if (body && functionName) {
        const literal = JSON.stringify(functionName);
        this.addPatch(body.startIndex + 1, ` __CallScope __trace_call_${body.startIndex}(${literal}, ${startLine}); `);
      }
    }

    // Inject Line Trace for statements
    if (this.isTraceable(node)) {
      this.injectTraceCall(node, startLine);
    }

    // Recurse into children
    for (let i = 0; i < node.namedChildCount; i++) {
      this.walk(node.namedChild(i)!);
    }

    if (isBlock || isLoopScope) {
      this.scopeStack.pop();
    }
  }

  /**
   * Only trace statements that are direct children of a compound_statement.
   * This prevents injecting trace calls inside for-loop init/condition/update,
   * if-condition, or other non-block contexts.
   */
  private isTraceable(node: Node): boolean {
    const traceableTypes = ['expression_statement', 'declaration', 'return_statement'];
    return traceableTypes.includes(node.type) && node.parent?.type === 'compound_statement';
  }

  private extractIdentifier(node: Node | null): string | null {
    if (!node) return null;
    if (node.type === 'identifier') return node.text;

    // Check for a nested 'declarator' field (handles pointer_declarator, array_declarator, etc.)
    const declaratorField = node.childForFieldName('declarator');
    if (declaratorField) {
      return this.extractIdentifier(declaratorField);
    }

    // Check named children for identifier or other declarators (handles reference_declarator which might lack a field name)
    for (const child of node.namedChildren) {
      if (child.type === 'identifier' || child.type.includes('declarator')) {
        return this.extractIdentifier(child);
      }
    }

    return node.text;
  }

  private handleDeclaration(node: Node) {
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i)!;
      if (child.type === 'init_declarator' || child.type === 'declaration') {
        const declarator = child.childForFieldName('declarator');
        if (declarator) {
          const id = this.extractIdentifier(declarator);
          if (id) this.scopeStack[this.scopeStack.length - 1].add(id);
        }
      } else if (child.type === 'identifier') {
        this.scopeStack[this.scopeStack.length - 1].add(child.text);
      }
    }
  }

  private injectTraceCall(node: Node, line: number) {
    const vars = this.getCurrentScopeVars();
    const varPairs =
      vars.length === 0 ? '' : vars.map((v) => `{"${v}", __to_json(${v})}`).join(', ');

    const traceCall = `__trace(${line}, {${varPairs}});`;

    if (node.type === 'return_statement') {
      // Inject BEFORE return so the trace actually executes
      this.addPatch(node.startIndex, traceCall + ' ');
    } else {
      // Inject AFTER other statements
      this.addPatch(node.endIndex, ' ' + traceCall);
    }
  }

  private getCurrentScopeVars(): string[] {
    const vars = new Set<string>();
    for (const scope of this.scopeStack) {
      for (const v of scope) {
        vars.add(v);
      }
    }
    return Array.from(vars);
  }

  /**
   * Returns the C++ helper code that gets prepended to the user's source.
   * Uses raw string building to avoid TypeScript/JS escape confusion.
   */
  private getTraceHeader(): string {
    const DQ = '"'; // literal double-quote character
    const BSQ = '\\' + DQ; // backslash + double-quote = \" for C++ strings

    const lines = [
      '#include <iostream>',
      '#include <string>',
      '#include <sstream>',
      '#include <vector>',
      '#include <map>',
      '#include <stack>',
      '#include <queue>',
      '#include <deque>',
      '#include <type_traits>',
      '#include <initializer_list>',
      '#include <utility>',
      '',
      'void __trace(int line, std::initializer_list<std::pair<std::string, std::string>> vars);',
      '// Forward declarations',
      'template<typename T> std::string __to_json(const T& v);',
      'template<typename T> std::string __to_json(const std::vector<T>& v);',
      'template<typename T, typename U> std::string __to_json(const std::pair<T, U>& p);',
      'template<typename K, typename V> std::string __to_json(const std::map<K, V>& m);',
      'template<typename T> std::string __to_json(const std::stack<T>& s);',
      'template<typename T> std::string __to_json(const std::queue<T>& q);',
      'template<typename T> std::string __to_json(T* ptr, int depth = 0);',
      'std::vector<std::string> __pending_events;',
      'std::vector<std::string> __call_stack;',
      'std::string __json_quote(const std::string& value) {',
      String.raw`    std::string result = "\"";`,
      '    for (char c : value) {',
      String.raw`        if (c == '\"' || c == '\\') result += '\\';`,
      '        if (c == \'\\n\') { result += "\\\\n"; continue; }',
      '        if (c == \'\\r\') { result += "\\\\r"; continue; }',
      '        if (c == \'\\t\') { result += "\\\\t"; continue; }',
      '        result += c;',
      '    }',
      String.raw`    result += "\"";`,
      '    return result;',
      '}',
      'void __trace_call_event(const char* type, int line, const std::string& name, size_t depth) {',
      String.raw`    __pending_events.push_back(std::string("{\"type\":") + __json_quote(type) + ",\"line\":" + std::to_string(line) + ",\"variable\":" + __json_quote(name) + ",\"after\":" + std::to_string(depth) + "}");`,
      '}',
      'struct __CallScope {',
      '    std::string name; int line;',
      '    __CallScope(std::string fn, int ln) : name(std::move(fn)), line(ln) { __call_stack.push_back(name); __trace_call_event("call", line, name, __call_stack.size()); }',
      '    ~__CallScope() { if (!__call_stack.empty()) __call_stack.pop_back(); __trace_call_event("return", line, name, __call_stack.size()); __trace(line, {}); }',
      '};',
      'bool __trace_condition(int line, bool result) {',
      '    __pending_events.push_back(std::string("{\\"type\\":\\"compare\\",\\"line\\":") + std::to_string(line) + ",\\"result\\":" + (result ? "true}" : "false}"));',
      '    return result;',
      '}',
      'std::string __to_json(const std::string& v);',
      'std::string __to_json(const char* v);',
      'std::string __to_json(bool v);',
      '',
      '// Generic arithmetic fallback',
      'template<typename T> std::string __to_json(const T& v) {',
      '    if constexpr (std::is_arithmetic_v<T>) {',
      '        return std::to_string(v);',
      '    } else {',
      `        return ${DQ}${BSQ}unsupported${BSQ}${DQ};`,
      '    }',
      '}',
      '',
      // string overloads
      `std::string __to_json(const std::string& v) { return ${DQ}${BSQ}${DQ} + v + ${DQ}${BSQ}${DQ}; }`,
      `std::string __to_json(const char* v) { return ${DQ}${BSQ}${DQ} + std::string(v) + ${DQ}${BSQ}${DQ}; }`,
      `std::string __to_json(bool v) { return v ? ${DQ}true${DQ} : ${DQ}false${DQ}; }`,
      '',
      '// vector',
      'template<typename T> std::string __to_json(const std::vector<T>& v) {',
      `    std::string res = ${DQ}[${DQ};`,
      '    for (size_t i = 0; i < v.size(); ++i) {',
      '        res += __to_json(v[i]);',
      `        if (i < v.size() - 1) res += ${DQ}, ${DQ};`,
      '    }',
      `    res += ${DQ}]${DQ};`,
      '    return res;',
      '}',
      '',
      '// pair',
      'template<typename T, typename U> std::string __to_json(const std::pair<T, U>& p) {',
      `    return ${DQ}{${BSQ}first${BSQ}: ${DQ} + __to_json(p.first) + ${DQ}, ${BSQ}second${BSQ}: ${DQ} + __to_json(p.second) + ${DQ}}${DQ};`,
      '}',
      '',
      '// map',
      'template<typename K, typename V> std::string __to_json(const std::map<K, V>& m) {',
      `    std::string res = ${DQ}{${DQ};`,
      '    bool first = true;',
      '    for (auto const& [key, val] : m) {',
      `        if (!first) res += ${DQ}, ${DQ};`,
      `        res += __to_json(key) + ${DQ}: ${DQ} + __to_json(val);`,
      '        first = false;',
      '    }',
      `    res += ${DQ}}${DQ};`,
      '    return res;',
      '}',
      '',
      '// stack',
      'template<typename T> std::string __to_json(const std::stack<T>& s) {',
      '    std::stack<T> copy = s;',
      '    std::vector<T> v;',
      '    while (!copy.empty()) { v.insert(v.begin(), copy.top()); copy.pop(); }',
      '    return __to_json(v);',
      '}',
      '',
      '// queue',
      'template<typename T> std::string __to_json(const std::queue<T>& q) {',
      '    std::queue<T> copy = q;',
      '    std::vector<T> v;',
      '    while (!copy.empty()) { v.push_back(copy.front()); copy.pop(); }',
      '    return __to_json(v);',
      '}',
      '',
      '// SFINAE Member Detectors (C++17)',
      'template<typename, typename = void> struct __has_next : std::false_type {};',
      'template<typename T> struct __has_next<T, std::void_t<decltype(std::declval<T>().next)>> : std::true_type {};',
      '',
      'template<typename, typename = void> struct __has_left_right : std::false_type {};',
      'template<typename T> struct __has_left_right<T, std::void_t<decltype(std::declval<T>().left), decltype(std::declval<T>().right)>> : std::true_type {};',
      '',
      'template<typename, typename = void> struct __has_val : std::false_type {};',
      'template<typename T> struct __has_val<T, std::void_t<decltype(std::declval<T>().val)>> : std::true_type {};',
      '',
      'template<typename, typename = void> struct __has_value : std::false_type {};',
      'template<typename T> struct __has_value<T, std::void_t<decltype(std::declval<T>().value)>> : std::true_type {};',
      '',
      'template<typename, typename = void> struct __has_data : std::false_type {};',
      'template<typename T> struct __has_data<T, std::void_t<decltype(std::declval<T>().data)>> : std::true_type {};',
      '',
      'template<typename, typename = void> struct __has_prev : std::false_type {};',
      'template<typename T> struct __has_prev<T, std::void_t<decltype(std::declval<T>().prev)>> : std::true_type {};',
      '',
      '// Pointers (Trees / Linked Lists)',
      'template<typename T> std::string __to_json(T* ptr, int depth) {',
      `    if (ptr == nullptr) return ${DQ}null${DQ};`,
      `    if (depth > 15) return ${DQ}${BSQ}<max_depth>${BSQ}${DQ};`,
      '    if constexpr (__has_next<T>::value) {',
      `        std::string res = ${DQ}{${DQ};`,
      `        res += ${DQ}${BSQ}__addr${BSQ}: ${DQ} + std::to_string(reinterpret_cast<size_t>(ptr)) + ${DQ}, ${DQ};`,
      '        if constexpr (__has_val<T>::value) {',
      `            res += ${DQ}${BSQ}val${BSQ}: ${DQ} + __to_json(ptr->val) + ${DQ}, ${DQ};`,
      '        } else if constexpr (__has_value<T>::value) {',
      `            res += ${DQ}${BSQ}value${BSQ}: ${DQ} + __to_json(ptr->value) + ${DQ}, ${DQ};`,
      '        } else if constexpr (__has_data<T>::value) {',
      `            res += ${DQ}${BSQ}data${BSQ}: ${DQ} + __to_json(ptr->data) + ${DQ}, ${DQ};`,
      '        }',
      '        // Serialize prev pointer for doubly linked lists',
      '        if constexpr (__has_prev<T>::value) {',
      `            res += std::string(${DQ}${BSQ}prev${BSQ}: ${DQ}) + (ptr->prev ? std::string(${DQ}true${DQ}) : std::string(${DQ}null${DQ})) + std::string(${DQ}, ${DQ});`,
      '        }',
      `        res += ${DQ}${BSQ}next${BSQ}: ${DQ} + __to_json(ptr->next, depth + 1);`,
      `        res += ${DQ}}${DQ};`,
      '        return res;',
      '    } else if constexpr (__has_left_right<T>::value) {',
      `        std::string res = ${DQ}{${DQ};`,
      `        res += ${DQ}${BSQ}__addr${BSQ}: ${DQ} + std::to_string(reinterpret_cast<size_t>(ptr)) + ${DQ}, ${DQ};`,
      '        if constexpr (__has_val<T>::value) {',
      `            res += ${DQ}${BSQ}val${BSQ}: ${DQ} + __to_json(ptr->val) + ${DQ}, ${DQ};`,
      '        } else if constexpr (__has_value<T>::value) {',
      `            res += ${DQ}${BSQ}value${BSQ}: ${DQ} + __to_json(ptr->value) + ${DQ}, ${DQ};`,
      '        } else if constexpr (__has_data<T>::value) {',
      `            res += ${DQ}${BSQ}data${BSQ}: ${DQ} + __to_json(ptr->data) + ${DQ}, ${DQ};`,
      '        }',
      `        res += ${DQ}${BSQ}left${BSQ}: ${DQ} + __to_json(ptr->left, depth + 1) + ${DQ}, ${DQ};`,
      `        res += ${DQ}${BSQ}right${BSQ}: ${DQ} + __to_json(ptr->right, depth + 1);`,
      `        res += ${DQ}}${DQ};`,
      '        return res;',
      '    } else {',
      '        return __to_json(*ptr);',
      '    }',
      '}',
      '',
      '// Trace emitter',
      'void __trace(int line, std::initializer_list<std::pair<std::string, std::string>> vars) {',
      `    std::cout << ${DQ}__TRACE__{${BSQ}line${BSQ}: ${DQ} << line << ${DQ}, ${BSQ}variables${BSQ}: {${DQ};`,
      '    bool first = true;',
      '    for (auto& p : vars) {',
      `        if (!first) std::cout << ${DQ}, ${DQ};`,
      `        std::cout << ${DQ}${BSQ}${DQ} << p.first << ${DQ}${BSQ}: ${DQ} << p.second;`,
      '        first = false;',
      '    }',
      `    std::cout << ${DQ}}, ${BSQ}callStack${BSQ}: [${DQ};`,
      String.raw`    if (__call_stack.empty()) std::cout << "\"main\"";`,
      '    for (size_t i = 0; i < __call_stack.size(); ++i) {',
      `        if (i) std::cout << ${DQ}, ${DQ};`,
      '        std::cout << __json_quote(__call_stack[i]);',
      '    }',
      `    std::cout << ${DQ}], ${BSQ}events${BSQ}: [${DQ};`,
      '    for (size_t i = 0; i < __pending_events.size(); ++i) {',
      `        if (i) std::cout << ${DQ}, ${DQ};`,
      '        std::cout << __pending_events[i];',
      '    }',
      '    __pending_events.clear();',
      `    std::cout << ${DQ}]}__TRACE__${DQ} << std::endl;`,
      '}',
      '',
    ];

    return lines.join('\n');
  }
}
