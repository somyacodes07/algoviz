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
  // Parameter names of the function whose body is about to open; they join that body's scope.
  private pendingParams: string[] | null = null;
  // Array parameters of the current function and the parameter holding their length (`arr` -> `n`).
  private arraySpans = new Map<string, string>();
  // True inside a non-static member function, where the object's fields are traced as `this`.
  private inMember = false;

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
    this.pendingParams = null;

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

    // A lambda cannot read the enclosing function's locals unless it captures them,
    // so its traces only see globals and its own parameters.
    if (type === 'lambda_expression') {
      const saved = this.scopeStack;
      this.scopeStack = [new Set(saved[0])];
      this.pendingParams = this.functionParams(node);
      const savedMember = this.inMember;
      this.inMember = false;
      for (let i = 0; i < node.namedChildCount; i++) this.walk(node.namedChild(i)!);
      this.inMember = savedMember;
      this.scopeStack = saved;
      this.pendingParams = null;
      return;
    }

    if (type === 'struct_specifier' || type === 'class_specifier') {
      this.addStructSerializer(node);
    }

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
      const scope = new Set<string>();
      if (isBlock && this.pendingParams) {
        this.pendingParams.forEach((name) => scope.add(name));
        this.pendingParams = null;
      }
      this.scopeStack.push(scope);
    }

    if (type === 'function_definition') {
      this.pendingParams = this.functionParams(node);
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

    const savedSpans = this.arraySpans;
    const savedMember = this.inMember;
    if (type === 'function_definition') {
      this.arraySpans = this.arrayParamSpans(node);
      this.inMember = this.isMemberFunction(node);
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

    const LOOPS = ['for_statement', 'while_statement', 'do_statement', 'for_range_loop'];
    const parent = node.parent;
    const isBodyOf = (p: Node | null) => !!p && p.childForFieldName('body')?.startIndex === node.startIndex;

    // One step at the top of every loop iteration, on the loop's own line, so each
    // turn of `for (j ...)` shows up even when nothing inside it changes.
    if (isBlock && parent && LOOPS.includes(parent.type) && isBodyOf(parent)) {
      this.addPatch(node.startIndex + 1, ' ' + this.traceCall(parent.startPosition.row + 1) + ' ');
    }

    // A step on each `if` before its condition is checked.
    if (type === 'if_statement' && parent?.type === 'compound_statement') {
      this.addPatch(node.startIndex, this.traceCall(startLine) + ' ');
    }

    // Brace-less bodies (`for (...) sum += a[i];`, `if (x) return y;`) get braces and a step.
    const braceless = ['expression_statement', 'return_statement'].includes(type) && parent && parent.type !== 'compound_statement';
    if (braceless && parent) {
      const inLoop = LOOPS.includes(parent.type) && isBodyOf(parent);
      const inIf = parent.type === 'if_statement' || parent.type === 'else_clause';
      if (inLoop || inIf) {
        const head = inLoop ? this.traceCall(parent.startPosition.row + 1) + ' ' : '';
        if (type === 'return_statement') {
          this.addPatch(node.startIndex, `{ ${head}${this.traceCall(startLine)} `);
          this.addPatch(node.endIndex, ' }');
        } else {
          this.addPatch(node.startIndex, `{ ${head}`);
          this.addPatch(node.endIndex, ` ${this.traceCall(startLine)} }`);
        }
      }
    }

    // Recurse into children
    for (let i = 0; i < node.namedChildCount; i++) {
      this.walk(node.namedChild(i)!);
    }

    if (isBlock || isLoopScope) {
      this.scopeStack.pop();
    }
    this.arraySpans = savedSpans;
    this.inMember = savedMember;
  }

  /** In-class or `Class::method` definitions that have an object, so not static ones. */
  private isMemberFunction(fn: Node): boolean {
    if (fn.children.some((c) => c.type === 'storage_class_specifier' && c.text === 'static')) return false;
    if (fn.children.some((c) => c.type === 'friend')) return false;
    if (fn.parent?.type === 'friend_declaration') return false;
    if (fn.parent?.type === 'field_declaration_list') return true;
    const declarator = fn.childForFieldName('declarator');
    let inner = declarator;
    while (inner && inner.type !== 'function_declarator') inner = inner.childForFieldName('declarator');
    const name = inner?.childForFieldName('declarator');
    return name?.type === 'qualified_identifier';
  }

  /**
   * `void sort(int arr[], int n)` or `void sort(int* a, int size)`: pair each array-like
   * parameter of a scalar type with the integer parameter that looks like its length.
   */
  private arrayParamSpans(fn: Node): Map<string, string> {
    const spans = new Map<string, string>();
    let declarator = fn.childForFieldName('declarator');
    while (declarator && declarator.type !== 'function_declarator') {
      declarator = declarator.childForFieldName('declarator') || null;
    }
    const list = declarator?.childForFieldName('parameters');
    if (!list) return spans;
    const arrays: string[] = [];
    const ints: string[] = [];
    const SCALAR = /^(?:(?:unsigned|signed|long|short|const)\s+)*(?:int|long|short|char|float|double|bool|size_t|long\s+long)$/;
    for (const param of list.namedChildren) {
      if (param.type !== 'parameter_declaration') continue;
      const typeText = (param.childForFieldName('type')?.text || '').trim();
      const decl = param.childForFieldName('declarator');
      if (!decl) continue;
      const name = this.extractIdentifier(decl);
      if (!name) continue;
      const isArray = decl.type === 'array_declarator' || (decl.type === 'pointer_declarator' && decl.namedChildren.some((c) => c.type === 'identifier'));
      if (isArray && SCALAR.test(typeText)) arrays.push(name);
      else if (decl.type === 'identifier' && /^(?:(?:unsigned|signed|long|short|const)\s+)*(?:int|long|short|size_t|long\s+long)$/.test(typeText)) ints.push(name);
    }
    const LENGTH_NAMES = ['n', 'size', 'len', 'length', 'N', 'sz', 'count', 'num', 'm'];
    const length = LENGTH_NAMES.find((candidate) => ints.includes(candidate)) || (ints.length === 1 ? ints[0] : undefined);
    if (length) arrays.forEach((name) => spans.set(name, length));
    return spans;
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

  /**
   * Give every struct and class a hidden-friend `__to_json`, so values print as
   * {"field": value} with their real field names. A friend can read private members, and
   * argument-dependent lookup finds it from the generic serializers.
   */
  private addStructSerializer(node: Node) {
    const body = node.childForFieldName('body');
    const name = node.childForFieldName('name');
    if (!body || !name || name.type !== 'type_identifier') return;
    if (node.parent?.type === 'template_declaration') return;
    // Local classes (declared inside a function) may not define friend functions.
    for (let up = node.parent; up; up = up.parent) {
      if (up.type === 'function_definition' || up.type === 'lambda_expression') return;
    }

    const fields: string[] = [];
    const collect = (declarator: Node | null) => {
      if (!declarator || declarator.type === 'function_declarator') return;
      if (declarator.type === 'field_identifier') {
        fields.push(declarator.text);
        return;
      }
      if (declarator.type === 'bitfield_clause') return;
      const inner = declarator.childForFieldName('declarator');
      if (inner) collect(inner);
      else declarator.namedChildren.forEach((child) => child.type === 'field_identifier' && fields.push(child.text));
    };
    for (const member of body.namedChildren) {
      if (member.type !== 'field_declaration') continue;
      if (member.namedChildren.some((child) => child.type === 'storage_class_specifier' && child.text === 'static')) continue;
      member.namedChildren.forEach((child) => {
        if (['field_identifier', 'pointer_declarator', 'array_declarator', 'reference_declarator', 'init_declarator'].includes(child.type)) collect(child);
      });
    }

    const typeName = name.text;
    const parts = fields.map((field, i) => `${i ? '", ' : '"'}\\"${field}\\": " + __to_json(__v.${field}) + `);
    const json = fields.length ? `std::string("{") + ${parts.join('')}"}"` : 'std::string("{}")';
    const serializer = ` friend std::string __to_json(const ${typeName}& __v) { __JsonDepth __guard; if (__guard.tooDeep()) return "\\"{...}\\""; return ${json}; } `;
    this.addPatch(body.endIndex - 1, serializer);
  }

  // Named parameters of a function definition: `int insert(Node* root, int val)` gives root and val.
  private functionParams(fn: Node): string[] {
    let declarator = fn.childForFieldName('declarator');
    while (declarator && declarator.type !== 'function_declarator' && declarator.type !== 'abstract_function_declarator') {
      declarator = declarator.childForFieldName('declarator') || declarator.namedChildren.find((child) => child.type.includes('declarator')) || null;
    }
    const list = declarator?.childForFieldName('parameters');
    if (!list) return [];
    const names: string[] = [];
    for (const param of list.namedChildren) {
      if (!param.type.includes('parameter_declaration')) continue;
      const name = this.extractIdentifier(param.childForFieldName('declarator'));
      if (name && /^[A-Za-z_]\w*$/.test(name)) names.push(name);
    }
    return names;
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
      } else if (child.type === 'array_declarator' || child.type === 'pointer_declarator' || child.type === 'reference_declarator') {
        // `int arr[100];` and `Node* head;` without an initializer.
        const id = this.extractIdentifier(child);
        if (id) this.scopeStack[this.scopeStack.length - 1].add(id);
      }
    }
  }

  private traceCall(line: number): string {
    const vars = this.getCurrentScopeVars();
    const pairs = vars.map((v) => {
      const length = this.arraySpans.get(v);
      return length ? `{"${v}", __json_span(${v}, ${length})}` : `{"${v}", __to_json(${v})}`;
    });
    if (this.inMember) pairs.unshift(`{"this", __to_json(*this)}`);
    return `__trace(${line}, {${pairs.join(', ')}});`;
  }

  private injectTraceCall(node: Node, line: number) {
    const vars = this.getCurrentScopeVars();
    const varPairs =
      vars.length === 0
        ? ''
        : vars
            .map((v) => {
              const length = this.arraySpans.get(v);
              return length ? `{"${v}", __json_span(${v}, ${length})}` : `{"${v}", __to_json(${v})}`;
            })
            .join(', ');

    const thisPair = this.inMember ? `{"this", __to_json(*this)}` : '';
    const allPairs = [thisPair, varPairs].filter(Boolean).join(', ');
    const traceCall = `__trace(${line}, {${allPairs}});`;

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
      '#include <iomanip>',
      '#include <cmath>',
      '#include <vector>',
      '#include <array>',
      '#include <map>',
      '#include <unordered_map>',
      '#include <set>',
      '#include <unordered_set>',
      '#include <stack>',
      '#include <queue>',
      '#include <deque>',
      '#include <type_traits>',
      '#include <initializer_list>',
      '#include <utility>',
      '#include <cstring>',
      '#include <cstdlib>',
      '',
      'void __trace(int line, std::initializer_list<std::pair<std::string, std::string>> vars);',
      '// Forward declarations: every serializer can call every other one.',
      'std::string __to_json(bool v);',
      'std::string __to_json(char v);',
      'std::string __to_json(const std::string& v);',
      'std::string __to_json(const char* v);',
      'template<typename T, typename std::enable_if<!std::is_array<T>::value, int>::type = 0> std::string __to_json(const T& v);',
      'template<typename T, typename A> std::string __to_json(const std::vector<T, A>& v);',
      'template<typename T, size_t N> std::string __to_json(const std::array<T, N>& v);',
      'template<typename T, size_t N> std::string __to_json(const T (&v)[N]);',
      'template<size_t N> std::string __to_json(const char (&v)[N]);',
      'template<typename T, typename U> std::string __to_json(const std::pair<T, U>& p);',
      'template<typename K, typename V, typename C, typename A> std::string __to_json(const std::map<K, V, C, A>& m);',
      'template<typename K, typename V, typename H, typename E, typename A> std::string __to_json(const std::unordered_map<K, V, H, E, A>& m);',
      'template<typename T, typename C, typename A> std::string __to_json(const std::set<T, C, A>& s);',
      'template<typename T, typename H, typename E, typename A> std::string __to_json(const std::unordered_set<T, H, E, A>& s);',
      'template<typename T, typename A> std::string __to_json(const std::deque<T, A>& d);',
      'template<typename T, typename C> std::string __to_json(const std::stack<T, C>& s);',
      'template<typename T, typename C> std::string __to_json(const std::queue<T, C>& q);',
      'template<typename T, typename C, typename P> std::string __to_json(const std::priority_queue<T, C, P>& q);',
      'template<typename T> std::string __to_json(T* const& ptr, int depth = 0);',
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
      '',
      '// Numbers. JSON has no infinity, but 1e999 parses to Infinity in JavaScript.',
      'template<typename T, typename std::enable_if<!std::is_array<T>::value, int>::type> std::string __to_json(const T& v) {',
      '    if constexpr (std::is_floating_point_v<T>) {',
      '        if (std::isnan(v)) return "null";',
      '        if (std::isinf(v)) return v > 0 ? "1e999" : "-1e999";',
      '        std::ostringstream out;',
      '        out << std::setprecision(10) << v;',
      '        return out.str();',
      '    } else if constexpr (std::is_arithmetic_v<T>) {',
      '        return std::to_string(v);',
      '    } else if constexpr (std::is_enum_v<T>) {',
      '        return std::to_string(static_cast<long long>(v));',
      '    } else {',
      String.raw`        return "\"{...}\"";`,
      '    }',
      '}',
      '',
      'std::string __to_json(bool v) { return v ? "true" : "false"; }',
      'std::string __to_json(char v) { return __json_quote(std::string(1, v)); }',
      'std::string __to_json(const std::string& v) { return __json_quote(v); }',
      String.raw`std::string __to_json(const char* v) { return v ? __json_quote(std::string(v)) : "null"; }`,
      '',
      '// Struct serializers are generated per struct; this guard stops pointer cycles and runaway nesting.',
      'struct __JsonDepth {',
      '    static int& level() { static int depth = 0; return depth; }',
      '    __JsonDepth() { ++level(); }',
      '    ~__JsonDepth() { --level(); }',
      '    bool tooDeep() const { return level() > 7; }',
      '};',
      '',
      '// Object keys must be JSON strings, whatever the C++ key type is.',
      'template<typename K> std::string __json_key(const K& key) {',
      '    std::string text = __to_json(key);',
      String.raw`    return !text.empty() && text[0] == '"' ? text : __json_quote(text);`,
      '}',
      '',
      'template<typename It> std::string __json_list(It begin, It end) {',
      '    std::string res = "[";',
      '    for (It it = begin; it != end; ++it) {',
      '        if (it != begin) res += ", ";',
      '        res += __to_json(static_cast<typename std::iterator_traits<It>::value_type>(*it));',
      '    }',
      '    return res + "]";',
      '}',
      'template<typename It> std::string __json_object(It begin, It end) {',
      '    std::string res = "{";',
      '    for (It it = begin; it != end; ++it) {',
      '        if (it != begin) res += ", ";',
      '        res += __json_key(it->first) + ": " + __to_json(it->second);',
      '    }',
      '    return res + "}";',
      '}',
      '',
      'template<typename T, typename A> std::string __to_json(const std::vector<T, A>& v) { return __json_list(v.begin(), v.end()); }',
      'template<typename T, size_t N> std::string __to_json(const std::array<T, N>& v) { return __json_list(v.begin(), v.end()); }',
      'template<typename T, size_t N> std::string __to_json(const T (&v)[N]) { return __json_list(v, v + N); }',
      '// An array parameter (`int arr[], int n`) decays to a pointer; show its first n elements.',
      'template<typename T> std::string __json_span(const T* p, long long n) { if (!p) return "null"; if (n < 0) n = 0; if (n > 2000) n = 2000; return __json_list(p, p + n); }',
      'template<size_t N> std::string __to_json(const char (&v)[N]) { return __json_quote(std::string(v, strnlen(v, N))); }',
      '// Pairs become two-item arrays, so a vector of pairs reads as a table.',
      'template<typename T, typename U> std::string __to_json(const std::pair<T, U>& p) { return "[" + __to_json(p.first) + ", " + __to_json(p.second) + "]"; }',
      'template<typename K, typename V, typename C, typename A> std::string __to_json(const std::map<K, V, C, A>& m) { return __json_object(m.begin(), m.end()); }',
      'template<typename K, typename V, typename H, typename E, typename A> std::string __to_json(const std::unordered_map<K, V, H, E, A>& m) { return __json_object(m.begin(), m.end()); }',
      'template<typename T, typename C, typename A> std::string __to_json(const std::set<T, C, A>& s) { return __json_list(s.begin(), s.end()); }',
      'template<typename T, typename H, typename E, typename A> std::string __to_json(const std::unordered_set<T, H, E, A>& s) { return __json_list(s.begin(), s.end()); }',
      'template<typename T, typename A> std::string __to_json(const std::deque<T, A>& d) { return __json_list(d.begin(), d.end()); }',
      '',
      '// stack: bottom first, top last',
      'template<typename T, typename C> std::string __to_json(const std::stack<T, C>& s) {',
      '    std::stack<T, C> copy = s;',
      '    std::vector<T> v;',
      '    while (!copy.empty()) { v.insert(v.begin(), copy.top()); copy.pop(); }',
      '    return __to_json(v);',
      '}',
      '',
      '// queue: front first',
      'template<typename T, typename C> std::string __to_json(const std::queue<T, C>& q) {',
      '    std::queue<T, C> copy = q;',
      '    std::vector<T> v;',
      '    while (!copy.empty()) { v.push_back(copy.front()); copy.pop(); }',
      '    return __to_json(v);',
      '}',
      '',
      '// priority_queue: its real heap array, read through the protected member every adaptor has.',
      'template<typename T, typename C, typename P> struct __PQAccess : std::priority_queue<T, C, P> {',
      '    static const C& get(const std::priority_queue<T, C, P>& q) { return q.*(&__PQAccess::c); }',
      '};',
      'template<typename T, typename C, typename P> std::string __to_json(const std::priority_queue<T, C, P>& q) {',
      '    return __to_json(__PQAccess<T, C, P>::get(q));',
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
      'template<typename T> std::string __to_json(T* const& ptr, int depth) {',
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
      '    // Endless or huge loops stop here instead of freezing the visualizer.',
      '    static int __steps = 0;',
      `    if (++__steps > 3000) { std::cout << ${DQ}\\n[AlgoViz] Stopped after 3000 steps. Try a smaller input.${DQ} << std::endl; std::exit(0); }`,
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
