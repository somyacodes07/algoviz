/**
 * Symbol table for tracking variable declarations and their C++ types.
 *
 * This enables type-aware transformations such as wrapping integer
 * division in Math.trunc() and choosing correct container method mappings.
 */

import { CPP_INTEGER_TYPES } from './types';

export interface SymbolInfo {
  name: string;
  /** The raw C++ type string, e.g. "int", "vector<int>", "string" */
  cppType: string;
  /** Whether declared with `const` */
  isConst: boolean;
  /** Derived: whether the type requires integer semantics */
  isInteger: boolean;
  /** Container kind for STL types, or null for primitives */
  containerKind: 'vector' | 'map' | 'set' | 'pair' | 'stack' | 'queue' | 'priority_queue' | null;
  /** Scope depth at which this symbol was declared */
  scopeDepth: number;
}

export class SymbolTable {
  private scopes: Map<string, SymbolInfo>[] = [new Map()];
  private currentDepth = 0;

  /** Enter a new scope (e.g., function body, block) */
  enterScope(): void {
    this.currentDepth++;
    this.scopes.push(new Map());
  }

  /** Exit the current scope, discarding its symbols */
  exitScope(): void {
    if (this.scopes.length > 1) {
      this.scopes.pop();
      this.currentDepth--;
    }
  }

  /** Declare a new symbol in the current scope */
  declare(name: string, cppType: string, isConst: boolean = false): SymbolInfo {
    const normalizedType = cppType.replace(/\s+/g, ' ').trim();
    const containerKind = this.inferContainerKind(normalizedType);
    const isInteger = this.inferIsInteger(normalizedType);

    const info: SymbolInfo = {
      name,
      cppType: normalizedType,
      isConst,
      isInteger,
      containerKind,
      scopeDepth: this.currentDepth,
    };

    this.scopes[this.scopes.length - 1].set(name, info);
    return info;
  }

  /** Look up a symbol by name, searching from innermost to outermost scope */
  lookup(name: string): SymbolInfo | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const info = this.scopes[i].get(name);
      if (info) return info;
    }
    return undefined;
  }

  /** Check if a variable has integer type (for Math.trunc wrapping) */
  isIntegerVariable(name: string): boolean {
    const info = this.lookup(name);
    return info?.isInteger ?? false;
  }

  /** Infer the container kind from a C++ type string */
  private inferContainerKind(type: string): SymbolInfo['containerKind'] {
    // Strip std:: prefix and check for template containers
    const stripped = type.replace(/std::/g, '').trim();
    if (stripped.startsWith('vector')) return 'vector';
    if (stripped.startsWith('map') || stripped.startsWith('unordered_map')) return 'map';
    if (stripped.startsWith('set') || stripped.startsWith('unordered_set')) return 'set';
    if (stripped.startsWith('pair')) return 'pair';
    if (stripped.startsWith('stack')) return 'stack';
    if (stripped.startsWith('queue')) return 'queue';
    if (stripped.startsWith('priority_queue')) return 'priority_queue';
    return null;
  }

  /** Check if a type is an integer type */
  private inferIsInteger(type: string): boolean {
    const stripped = type.replace(/std::/g, '').replace(/const\s+/g, '').trim();
    return CPP_INTEGER_TYPES.has(stripped);
  }
}
