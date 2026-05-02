import { Node, Tree } from 'web-tree-sitter';
import { parseCpp } from './parser';

interface Patch {
  index: number;
  text: string;
}

/**
 * C++ Source-to-Source Instrumenter.
 * Injects tracing calls into C++ code to capture variable states and execution path.
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

    return this.getTraceHeader() + "\n" + instrumentedCode;
  }

  private addPatch(index: number, text: string) {
    this.patches.push({ index, text });
  }

  private walk(node: Node) {
    if (!node) return;

    const type = node.type;
    const startLine = node.startPosition.row + 1; // 1-indexed for visualizer

    // Handle Scopes
    const isBlock = type === 'compound_statement';
    if (isBlock) {
      this.scopeStack.push(new Set());
    }

    // Capture Variable Declarations
    if (type === 'declaration') {
      this.handleDeclaration(node);
    }

    // Capture Assignments
    if (type === 'assignment_expression') {
      this.handleAssignment(node);
    }

    // Inject Line Trace for statements
    if (this.isStatement(node)) {
      this.injectTraceCall(node, startLine);
    }

    // Recurse
    for (let i = 0; i < node.namedChildCount; i++) {
      this.walk(node.namedChild(i)!);
    }

    if (isBlock) {
      this.scopeStack.pop();
    }
  }

  private isStatement(node: Node): boolean {
    const statementTypes = [
      'expression_statement',
      'declaration',
      'return_statement',
      'if_statement',
      'for_statement',
      'while_statement',
      'do_statement',
    ];
    return statementTypes.includes(node.type);
  }

  private handleDeclaration(node: Node) {
    // Basic variable detection: int x = 5;
    // We look for init_declarator
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i)!;
      if (child.type === 'init_declarator') {
        const declarator = child.childForFieldName('declarator');
        if (declarator) {
          const varName = declarator.text;
          this.scopeStack[this.scopeStack.length - 1].add(varName);
        }
      } else if (child.type === 'identifier') {
          // e.g., int x;
          this.scopeStack[this.scopeStack.length - 1].add(child.text);
      }
    }
  }

  private handleAssignment(node: Node) {
    // x = 10;
    const left = node.childForFieldName('left');
    if (left && left.type === 'identifier') {
        // Variable is modified, it's already in scope (hopefully)
    }
  }

  private injectTraceCall(node: Node, line: number) {
    const vars = this.getCurrentScopeVars();
    if (vars.length === 0) {
      this.addPatch(node.endIndex, `; __trace(${line}, {});`);
      return;
    }

    // Generate pairs for std::initializer_list<std::pair<string, string>>
    const varTrace = vars
      .map((v) => `{"${v}", __to_json(${v})}`)
      .join(', ');
    this.addPatch(node.endIndex, `; __trace(${line}, {${varTrace}});`);
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

  private getTraceHeader(): string {
    return `
#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <map>
#include <type_traits>

// Forward declarations for recursion
template<typename T> std::string __to_json(const T& v);
template<typename T> std::string __to_json(const std::vector<T>& v);
std::string __to_json(const std::string& v);
std::string __to_json(const char* v);
std::string __to_json(bool v);

// Implementation
template<typename T> std::string __to_json(const T& v) {
    if constexpr (std::is_arithmetic_v<T>) {
        return std::to_string(v);
    } else {
        return "\\"complex type\\"";
    }
}

std::string __to_json(const std::string& v) { return "\\"" + v + "\\""; }
std::string __to_json(const char* v) { return "\\"" + std::string(v) + "\\""; }
std::string __to_json(bool v) { return v ? "true" : "false"; }

template<typename T> std::string __to_json(const std::vector<T>& v) {
    std::string res = "[";
    for (size_t i = 0; i < v.size(); ++i) {
        res += __to_json(v[i]);
        if (i < v.size() - 1) res += ", ";
    }
    res += "]";
    return res;
}

// Helper for Tracing
void __trace(int line, std::initializer_list<std::pair<std::string, std::string>> vars) {
    std::cout << "__TRACE__{\\"line\\": " << line << ", \\"variables\\": {";
    bool first = true;
    for (auto& p : vars) {
        if (!first) std::cout << ", ";
        std::cout << "\\"" << p.first << "\\": " << p.second;
        first = false;
    }
    std::cout << "}}__TRACE__" << std::endl;
}
`;
  }
}
