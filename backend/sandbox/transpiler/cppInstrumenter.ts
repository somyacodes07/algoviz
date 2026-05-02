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
        instrumentedCode.slice(0, patch.index) +
        patch.text +
        instrumentedCode.slice(patch.index);
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
    const traceableTypes = [
      'expression_statement',
      'declaration',
      'return_statement',
    ];
    return (
      traceableTypes.includes(node.type) &&
      node.parent?.type === 'compound_statement'
    );
  }

  private handleDeclaration(node: Node) {
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i)!;
      if (child.type === 'init_declarator') {
        const declarator = child.childForFieldName('declarator');
        if (declarator) {
          this.scopeStack[this.scopeStack.length - 1].add(declarator.text);
        }
      } else if (child.type === 'identifier') {
        this.scopeStack[this.scopeStack.length - 1].add(child.text);
      }
    }
  }

  private injectTraceCall(node: Node, line: number) {
    const vars = this.getCurrentScopeVars();
    const varPairs =
      vars.length === 0
        ? ''
        : vars.map((v) => `{"${v}", __to_json(${v})}`).join(', ');

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
      '',
      '// Forward declarations',
      'template<typename T> std::string __to_json(const T& v);',
      'template<typename T> std::string __to_json(const std::vector<T>& v);',
      'template<typename T, typename U> std::string __to_json(const std::pair<T, U>& p);',
      'template<typename K, typename V> std::string __to_json(const std::map<K, V>& m);',
      'template<typename T> std::string __to_json(const std::stack<T>& s);',
      'template<typename T> std::string __to_json(const std::queue<T>& q);',
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
      '// Trace emitter',
      'void __trace(int line, std::initializer_list<std::pair<std::string, std::string>> vars) {',
      `    std::cout << ${DQ}__TRACE__{${BSQ}line${BSQ}: ${DQ} << line << ${DQ}, ${BSQ}variables${BSQ}: {${DQ};`,
      '    bool first = true;',
      '    for (auto& p : vars) {',
      `        if (!first) std::cout << ${DQ}, ${DQ};`,
      `        std::cout << ${DQ}${BSQ}${DQ} << p.first << ${DQ}${BSQ}: ${DQ} << p.second;`,
      '        first = false;',
      '    }',
      `    std::cout << ${DQ}}}__TRACE__${DQ} << std::endl;`,
      '}',
      '',
    ];

    return lines.join('\n');
  }
}
