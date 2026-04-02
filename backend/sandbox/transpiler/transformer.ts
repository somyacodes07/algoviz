/**
 * AST Transformer: Recursively traverses Tree-sitter C++ CST nodes
 * and directly emits equivalent JavaScript strings.
 *
 * No intermediate IR — each visitor returns a JS code string.
 * Uses a symbol table for type-aware transforms (e.g., integer division).
 */

import type { Node, Tree } from 'web-tree-sitter';

/** Alias for readability */
type SyntaxNode = Node;

import { SymbolTable } from './symbolTable';
import { WarningCollector } from './errors';
import {
  CPP_PRIMITIVE_TYPES,
  CPP_INTEGER_TYPES,
  STL_METHOD_MAP,
  STL_MATH_FUNCTIONS,
  CPP_CONSTANTS,
} from './types';

// ─── Supported node types whitelist ───────────────────────────────────────────

const SUPPORTED_NODE_TYPES = new Set([
  'translation_unit', 'function_definition', 'declaration',
  'expression_statement', 'return_statement', 'break_statement',
  'continue_statement', 'compound_statement',
  'if_statement', 'else_clause', 'for_statement', 'for_range_loop',
  'while_statement', 'do_statement', 'switch_statement', 'case_statement',
  'binary_expression', 'unary_expression', 'update_expression',
  'assignment_expression', 'call_expression', 'field_expression',
  'subscript_expression', 'parenthesized_expression', 'conditional_expression',
  'comma_expression',
  'number_literal', 'string_literal', 'char_literal', 'concatenated_string',
  'true', 'false', 'null', 'identifier', 'comment',
  'template_type', 'primitive_type', 'sized_type_specifier',
  'placeholder_type_specifier',
  'type_qualifier', 'storage_class_specifier',
  'preproc_include', 'preproc_def', 'preproc_call',
  'using_declaration', 'type_definition', 'alias_declaration',
  'struct_specifier', 'class_specifier', 'access_specifier', 'sizeof_expression', 
  'field_declaration_list', 'field_declaration',
  'field_initializer_list', 'field_initializer',
  'parameter_list', 'parameter_declaration', 'argument_list',
  'init_declarator', 'initializer_list',
  'array_declarator', 'pointer_declarator', 'reference_declarator',
  'function_declarator', 'parenthesized_declarator',
  'qualified_identifier', 'template_function',
  'field_identifier', 'type_identifier', 'namespace_identifier',
  'condition_clause',
  'labeled_statement',
]);

interface ContainerInfo {
  kind: 'vector' | 'map' | 'set' | 'pair' | 'stack' | 'queue' | 'priority_queue';
}

interface StructFieldInfo {
  name: string;
  cppType: string;
  isPointer: boolean;
  defaultValue: string;
}

interface StructConstructorInfo {
  params: { name: string; type: string }[];
  assignments: string[];
}

interface StructDefinition {
  name: string;
  fields: StructFieldInfo[];
  constructors: StructConstructorInfo[];
}

// ─── Transformer Class ───────────────────────────────────────────────────────

export class CppToJsTransformer {
  private symbols: SymbolTable;
  private warnings: WarningCollector;
  private helperFunctions: string[] = [];
  private injectedHelpers = new Set<string>();
  private queueVariables = new Set<string>();
  private priorityQueueModes = new Map<string, boolean>();
  private structDefinitions = new Map<string, StructDefinition>();
  private mainBody: string = '';
  private insideMain: boolean = false;

  constructor() {
    this.symbols = new SymbolTable();
    this.warnings = new WarningCollector();
  }

  /**
   * Transform a parsed C++ tree into JavaScript code.
   * Returns { code, warnings }.
   */
  transform(tree: Tree): { code: string; warnings: string[] } {
    this.helperFunctions = [];
    this.injectedHelpers.clear();
    this.queueVariables.clear();
    this.priorityQueueModes.clear();
    this.structDefinitions.clear();
    this.mainBody = '';
    this.insideMain = false;

    this.visitTranslationUnit(tree.rootNode);

    // Assemble: helper functions first, then main body
    const parts: string[] = [];

    const warningComments = this.warnings.toJsComments();
    if (warningComments) parts.push(warningComments);

    for (const fn of this.helperFunctions) {
      parts.push(fn);
    }

    if (this.mainBody) {
      parts.push(this.mainBody);
    }

    const code = this.postProcessContainerSemantics(
      parts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim(),
    );
    return { code, warnings: this.warnings.getWarningStrings() };
  }

  private ensureHelper(name: string, code: string): void {
    if (this.injectedHelpers.has(name)) return;
    this.injectedHelpers.add(name);
    this.helperFunctions.push(code);
  }

  private ensurePriorityQueueHelpers(): void {
    this.ensureHelper(
      '__cppComparePriorityQueueValues',
      `function __cppComparePriorityQueueValues(left, right) {
  if (Array.isArray(left) && Array.isArray(right)) {
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index++) {
      const leftValue = left[index];
      const rightValue = right[index];
      if (leftValue === rightValue) continue;
      if (leftValue === undefined) return -1;
      if (rightValue === undefined) return 1;
      return leftValue < rightValue ? -1 : 1;
    }
    return 0;
  }

  if (left === right) return 0;
  return left < right ? -1 : 1;
}`,
    );

    this.ensureHelper(
      '__cppPriorityQueuePush',
      `function __cppPriorityQueuePush(queue, value, isMinQueue) {
  queue.push(value);
  queue.sort((left, right) => {
    const comparison = __cppComparePriorityQueueValues(left, right);
    return isMinQueue ? comparison : -comparison;
  });
  return queue.length;
}`,
    );

    this.ensureHelper(
      '__cppPriorityQueueTop',
      `function __cppPriorityQueueTop(queue, isMinQueue) {
  if (queue.length === 0) return undefined;
  return isMinQueue ? queue[0] : queue[queue.length - 1];
}`,
    );

    this.ensureHelper(
      '__cppPriorityQueuePop',
      `function __cppPriorityQueuePop(queue, isMinQueue) {
  if (queue.length === 0) return undefined;
  return isMinQueue ? queue.shift() : queue.pop();
}`,
    );
  }

  private ensureMergeHelper(): void {
    this.ensureHelper(
      '__cppMergeSortedArrays',
      `function __cppMergeSortedArrays(left, right, comparator) {
  const merged = [];
  let leftIndex = 0;
  let rightIndex = 0;
  const compare = comparator || ((a, b) => a <= b);

  while (leftIndex < left.length && rightIndex < right.length) {
    if (compare(left[leftIndex], right[rightIndex])) {
      merged.push(left[leftIndex++]);
    } else {
      merged.push(right[rightIndex++]);
    }
  }

  while (leftIndex < left.length) merged.push(left[leftIndex++]);
  while (rightIndex < right.length) merged.push(right[rightIndex++]);

  return merged;
}`,
    );
  }

  private trackContainerVariable(
    varName: string,
    cppType: string,
    containerInfo: ContainerInfo | null,
  ): void {
    if (!containerInfo) return;

    if (containerInfo.kind === 'queue') {
      this.queueVariables.add(varName);
    }

    if (containerInfo.kind === 'priority_queue') {
      const normalizedType = cppType.replace(/std::/g, '');
      const isMinQueue = /(?:^|[<,\s])greater(?:\s*<|$)/.test(normalizedType);
      this.priorityQueueModes.set(varName, isMinQueue);
      this.ensurePriorityQueueHelpers();
    }
  }

  private postProcessContainerSemantics(code: string): string {
    let result = code;

    this.queueVariables.forEach((name) => {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(`\\b${escaped}\\.pop\\s*\\(\\s*\\)`, 'g'),
        `${name}.shift()`,
      );
    });

    this.priorityQueueModes.forEach((isMinQueue, name) => {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(`\\b${escaped}\\.top\\s*\\(\\s*\\)`, 'g'),
        `__cppPriorityQueueTop(${name}, ${isMinQueue})`,
      );
      result = result.replace(
        new RegExp(`\\b${escaped}\\.pop\\s*\\(\\s*\\)`, 'g'),
        `__cppPriorityQueuePop(${name}, ${isMinQueue})`,
      );
    });

    return result;
  }

  private isStructType(typeName: string): boolean {
    return this.structDefinitions.has(typeName.replace(/std::/g, '').trim());
  }

  private handleStructSpecifier(node: SyntaxNode): void {
    const nameNode = node.namedChild(0);
    const bodyNode = node.namedChild(1);
    const structName = nameNode?.text?.trim();

    if (!structName || !bodyNode || bodyNode.type !== 'field_declaration_list') {
      this.warnUnsupported(node);
      return;
    }

    const fields = this.extractStructFields(structName, bodyNode);
    const constructors = this.extractStructConstructors(structName, bodyNode, fields);

    this.structDefinitions.set(structName, { name: structName, fields, constructors });
    this.ensureHelper(`struct:${structName}`, this.buildStructFactory(structName, fields, constructors));
  }

  private extractStructFields(structName: string, bodyNode: SyntaxNode): StructFieldInfo[] {
    const fields: StructFieldInfo[] = [];

    for (let i = 0; i < bodyNode.namedChildCount; i++) {
      const child = bodyNode.namedChild(i)!;
      if (child.type !== 'field_declaration') continue;

      const typeNode = child.childForFieldName('type') ?? child.namedChild(0);
      const rawType = typeNode?.text?.replace(/std::/g, '').trim() ?? 'auto';

      for (let childIndex = 1; childIndex < child.namedChildCount; childIndex++) {
        const declarator = child.namedChild(childIndex)!;

        const name = this.extractDeclaratorName(declarator);
        if (!name || name === '_unnamed') continue;

        fields.push({
          name,
          cppType: rawType,
          isPointer: declarator.type === 'pointer_declarator' || declarator.type === 'reference_declarator',
          defaultValue: this.getStructFieldDefaultValue(structName, rawType, declarator),
        });
      }
    }

    return fields;
  }

  private getStructFieldDefaultValue(
    structName: string,
    cppType: string,
    declarator: SyntaxNode,
  ): string {
    if (declarator.type === 'pointer_declarator' || declarator.type === 'reference_declarator') {
      return 'null';
    }

    const normalizedType = cppType.replace(/std::/g, '').trim();
    if (normalizedType === structName) {
      return 'null';
    }

    if (this.isStructType(normalizedType)) {
      return `${normalizedType}()`;
    }

    return this.getDefaultValue(normalizedType, null);
  }

  private extractStructConstructors(
    structName: string,
    bodyNode: SyntaxNode,
    fields: StructFieldInfo[],
  ): StructConstructorInfo[] {
    const constructors: StructConstructorInfo[] = [];
    const fieldNames = new Set(fields.map((field) => field.name));

    for (let i = 0; i < bodyNode.namedChildCount; i++) {
      const child = bodyNode.namedChild(i)!;
      if (child.type !== 'function_definition') continue;

      const declarator = child.childForFieldName('declarator');
      if (this.extractFunctionName(declarator) !== structName) continue;

      const params = this.extractFunctionParams(declarator);
      const assignments: string[] = [];
      const initializerList = child.namedChildCount > 1 && child.namedChild(1)?.type === 'field_initializer_list'
        ? child.namedChild(1)
        : child.childForFieldName('declarator')?.nextNamedSibling?.type === 'field_initializer_list'
          ? child.childForFieldName('declarator')?.nextNamedSibling
          : null;
      const body = child.childForFieldName('body');

      if (initializerList) {
        assignments.push(...this.extractStructInitializerAssignments(initializerList, fieldNames));
      }

      if (body) {
        assignments.push(...this.extractStructBodyAssignments(body, fieldNames));
      }

      constructors.push({ params, assignments });
    }

    return constructors;
  }

  private extractStructInitializerAssignments(
    initializerList: SyntaxNode,
    fieldNames: Set<string>,
  ): string[] {
    const assignments: string[] = [];

    for (let i = 0; i < initializerList.namedChildCount; i++) {
      const initializer = initializerList.namedChild(i)!;
      if (initializer.type !== 'field_initializer') continue;

      const fieldNode = initializer.namedChild(0);
      const argListNode = initializer.namedChild(1);
      const fieldName = fieldNode?.text?.trim();
      if (!fieldName || !fieldNames.has(fieldName) || !argListNode) continue;

      const args = this.visitArgumentList(argListNode);
      const expr = args[0] ?? 'undefined';
      assignments.push(`instance.${fieldName} = ${expr};`);
    }

    return assignments;
  }

  private extractStructBodyAssignments(body: SyntaxNode, fieldNames: Set<string>): string[] {
    const assignments: string[] = [];

    for (let i = 0; i < body.namedChildCount; i++) {
      const child = body.namedChild(i)!;
      if (child.type !== 'expression_statement') continue;

      const expr = child.namedChild(0);
      if (!expr || expr.type !== 'assignment_expression') continue;

      const left = expr.childForFieldName('left');
      const right = expr.childForFieldName('right');
      if (!left || !right) continue;

      const fieldName = this.extractStructFieldTarget(left, fieldNames);
      if (!fieldName) continue;

      assignments.push(`instance.${fieldName} = ${this.visitExpression(right)};`);
    }

    return assignments;
  }

  private extractStructFieldTarget(node: SyntaxNode, fieldNames: Set<string>): string | null {
    if (node.type === 'identifier' && fieldNames.has(node.text)) {
      return node.text;
    }

    if (node.type === 'field_expression') {
      const field = node.childForFieldName('field');
      if (field?.text && fieldNames.has(field.text)) {
        return field.text;
      }
    }

    return null;
  }

  private buildStructFactory(
    structName: string,
    fields: StructFieldInfo[],
    constructors: StructConstructorInfo[],
  ): string {
    const defaultAssignments = fields
      .map((field) => `  instance.${field.name} = ${field.defaultValue};`)
      .join('\n');

    const constructorCases = constructors.map((ctor) => {
      const lines = [`    case ${ctor.params.length}: {`];
      ctor.params.forEach((param, index) => {
        lines.push(`      const ${param.name} = args[${index}];`);
      });
      if (ctor.assignments.length > 0) {
        ctor.assignments.forEach((assignment) => lines.push(`      ${assignment}`));
      } else {
        fields.forEach((field, index) => {
          if (index < ctor.params.length) {
            lines.push(`      instance.${field.name} = args[${index}];`);
          }
        });
      }
      lines.push('      return instance;');
      lines.push('    }');
      return lines.join('\n');
    });

    const positionalFallback = fields
      .map((field, index) => `  if (args.length > ${index}) instance.${field.name} = args[${index}];`)
      .join('\n');

    const overloadBlock = constructorCases.length > 0
      ? `  switch (args.length) {\n${constructorCases.join('\n')}\n  }\n`
      : '';

    const fallbackBlock = positionalFallback
      ? `\n${positionalFallback}\n`
      : '\n';

    return `function ${structName}(...args) {
  const instance = {};
${defaultAssignments}
${overloadBlock}${fallbackBlock}  return instance;
}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOP LEVEL
  // ═══════════════════════════════════════════════════════════════════════════

  private visitTranslationUnit(node: SyntaxNode): void {
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i)!;
      switch (child.type) {
        case 'preproc_include':
          // Skip includes — they don't exist in JS
          break;
        case 'preproc_def':
          this.handlePreprocDef(child);
          break;
        case 'using_declaration':
          // Skip "using namespace std;" etc
          break;
        case 'struct_specifier':
        case 'class_specifier':
          this.handleStructSpecifier(child);
          break;
        case 'function_definition':
          this.handleFunctionDefinition(child);
          break;
        case 'declaration':
          // Top-level global declarations
          this.mainBody += this.visitDeclaration(child) + '\n';
          break;
        case 'type_definition':
        case 'alias_declaration':
          // Skip typedefs/using aliases
          break;
        case 'comment':
          this.mainBody += child.text + '\n';
          break;
        case 'expression_statement':
          this.mainBody += this.visitExpressionStatement(child) + '\n';
          break;
        default:
          // Check for preproc_call (other preprocessor directives)
          if (child.type === 'preproc_call') break;
          this.warnUnsupported(child);
          break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PREPROCESSOR
  // ═══════════════════════════════════════════════════════════════════════════

  private handlePreprocDef(node: SyntaxNode): void {
    const name = node.childForFieldName('name')?.text ?? '';
    const value = node.childForFieldName('value')?.text?.trim() ?? '';
    if (name && value) {
      const line = `const ${name} = ${value};`;
      this.mainBody += line + '\n';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  private handleFunctionDefinition(node: SyntaxNode): void {
    // Extract function name from declarator
    const declarator = node.childForFieldName('declarator');
    const funcName = this.extractFunctionName(declarator);
    const body = node.childForFieldName('body');
    const type = node.childForFieldName('type');

    if (funcName === 'main') {
      // Inline main body into global scope
      this.insideMain = true;

      // Track return type for main
      if (body) {
        this.symbols.enterScope();
        this.mainBody += this.visitCompoundStatementBody(body, true);
        this.symbols.exitScope();
      }

      this.insideMain = false;
    } else {
      // Helper function: emit as "function name(params) { ... }"
      const params = this.extractFunctionParams(declarator);
      const returnType = type?.text ?? 'void';

      // Track function return type
      this.symbols.declare(funcName, returnType, false);

      this.symbols.enterScope();
      // Declare params in scope
      for (const p of params) {
        if (p.name) this.symbols.declare(p.name, p.type, false);
      }

      const paramStr = params.map(p => p.name).join(', ');
      let bodyStr = '';
      if (body) {
        bodyStr = this.visitCompoundStatementBody(body, false);
      }

      this.helperFunctions.push(`function ${funcName}(${paramStr}) {\n${bodyStr}\n}`);
      this.symbols.exitScope();
    }
  }

  private extractFunctionName(declarator: SyntaxNode | null): string {
    if (!declarator) return 'unknown';

    // function_declarator has a declarator child (the name) and parameters
    if (declarator.type === 'function_declarator') {
      const nameNode = declarator.childForFieldName('declarator');
      return nameNode?.text ?? 'unknown';
    }

    // Could be pointer_declarator wrapping a function_declarator
    if (declarator.type === 'pointer_declarator' || declarator.type === 'reference_declarator') {
      for (let i = 0; i < declarator.namedChildCount; i++) {
        const child = declarator.namedChild(i)!;
        if (child.type === 'function_declarator') {
          return this.extractFunctionName(child);
        }
      }
    }

    return declarator.text ?? 'unknown';
  }

  private extractFunctionParams(declarator: SyntaxNode | null): { name: string; type: string }[] {
    if (!declarator) return [];

    let funcDecl = declarator;
    if (declarator.type !== 'function_declarator') {
      // Search for nested function_declarator
      for (let i = 0; i < declarator.namedChildCount; i++) {
        const child = declarator.namedChild(i)!;
        if (child.type === 'function_declarator') {
          funcDecl = child;
          break;
        }
      }
    }

    const paramList = funcDecl.childForFieldName('parameters');
    if (!paramList) return [];

    const params: { name: string; type: string }[] = [];
    for (let i = 0; i < paramList.namedChildCount; i++) {
      const param = paramList.namedChild(i)!;
      if (param.type === 'parameter_declaration') {
        const paramType = param.childForFieldName('type')?.text ?? 'auto';
        const paramDeclarator = param.childForFieldName('declarator');
        let paramName = paramDeclarator?.text ?? `_p${i}`;
        // Strip reference/pointer and array brackets from name
        paramName = paramName.replace(/^[&*\s]+/, '').replace(/\s*\[.*\]\s*/g, '').trim();
        params.push({ name: paramName, type: paramType });
      }
    }
    return params;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATEMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  private visitCompoundStatementBody(node: SyntaxNode, isMain: boolean): string {
    const lines: string[] = [];
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i)!;
      const line = this.visitStatement(child, isMain);
      if (line !== null && line !== undefined) {
        lines.push(line);
      }
    }
    return lines.join('\n');
  }

  private visitStatement(node: SyntaxNode, isMain: boolean = false): string {
    switch (node.type) {
      case 'declaration':
        return this.visitDeclaration(node);
      case 'expression_statement':
        return this.visitExpressionStatement(node);
      case 'return_statement':
        return this.visitReturnStatement(node, isMain);
      case 'if_statement':
        return this.visitIfStatement(node);
      case 'for_statement':
        return this.visitForStatement(node);
      case 'for_range_loop':
        return this.visitForRangeLoop(node);
      case 'struct_specifier':
      case 'class_specifier':
        this.handleStructSpecifier(node);
        return '';
      case 'while_statement':
        return this.visitWhileStatement(node);
      case 'do_statement':
        return this.visitDoWhileStatement(node);
      case 'switch_statement':
        return this.visitSwitchStatement(node);
      case 'case_statement':
        return this.visitCaseStatement(node);
      case 'compound_statement': {
        this.symbols.enterScope();
        const body = '{\n' + this.visitCompoundStatementBody(node, isMain) + '\n}';
        this.symbols.exitScope();
        return body;
      }
      case 'break_statement':
        return 'break;';
      case 'continue_statement':
        return 'continue;';
      case 'comment':
        return node.text;
      case 'labeled_statement': {
        // default: or label:
        const label = node.child(0)?.text ?? '';
        const body = node.namedChildCount > 0 ? this.visitStatement(node.namedChild(node.namedChildCount - 1)!) : '';
        return `${label}: ${body}`;
      }
      default:
        this.warnUnsupported(node);
        return `// unsupported: ${node.type}`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DECLARATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  private visitDeclaration(node: SyntaxNode): string {
    // A declaration has: type, declarator(s)
    // e.g., "int x = 5;" or "vector<int> arr = {1,2,3};"

    const typeNode = node.childForFieldName('type');
    const typeText = typeNode?.text ?? 'auto';

    // Check if const
    let isConst = false;
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i)!;
      if (child.type === 'type_qualifier' && child.text === 'const') {
        isConst = true;
      }
    }

    // Determine the base C++ type (stripping qualifiers, std::, etc.)
    const cleanType = typeText.replace(/^(const\s+)?/, '').replace(/std::/g, '').trim();

    // Check if this is an STL container type
    const containerInfo = this.parseContainerType(typeNode, cleanType);

    // Collect all declarators
    const results: string[] = [];

    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i)!;
      if (child.type === 'init_declarator' || this.isDeclaratorType(child.type)) {
        const decl = this.visitInitDeclarator(child, cleanType, isConst, containerInfo);
        if (decl) results.push(decl);
      }
    }

    return results.join('\n');
  }

  private isDeclaratorType(type: string): boolean {
    return type === 'identifier' || type === 'array_declarator' ||
           type === 'pointer_declarator' || type === 'reference_declarator' ||
           type === 'function_declarator';
  }

  private visitInitDeclarator(
    node: SyntaxNode,
    cppType: string,
    isConst: boolean,
    containerInfo: ContainerInfo | null
  ): string {
    const keyword = isConst ? 'const' : 'let';

    if (node.type === 'init_declarator') {
      // Has declarator and value
      const declarator = node.childForFieldName('declarator');
      const value = node.childForFieldName('value');
      const varName = this.extractDeclaratorName(declarator);

      // Register in symbol table
      this.symbols.declare(varName, cppType, isConst);
      this.trackContainerVariable(varName, cppType, containerInfo);

      // Handle array declarator: int arr[5] = {1,2,3}
      if (declarator?.type === 'array_declarator') {
        return this.handleArrayDeclarator(declarator, value, keyword, varName);
      }

      if (value) {
        const jsValue = this.visitInitValue(value, cppType, containerInfo);
        // Wrap integer initializations with division in Math.trunc
        if (CPP_INTEGER_TYPES.has(cppType) && !isConst) {
          return `${keyword} ${varName} = ${this.wrapIntegerExpr(jsValue)};`;
        }
        return `${keyword} ${varName} = ${jsValue};`;
      } else {
        // No initializer
        const defaultVal =
          this.isStructType(cppType) && this.isPointerLikeDeclarator(declarator)
            ? 'null'
            : this.getDefaultValue(cppType, containerInfo);
        return `${keyword} ${varName} = ${defaultVal};`;
      }
    }

    // Plain declarator without initializer (e.g., "int x;")
    const varName = this.extractDeclaratorName(node);
    this.symbols.declare(varName, cppType, isConst);
    this.trackContainerVariable(varName, cppType, containerInfo);

    if (node.type === 'array_declarator') {
      return this.handleArrayDeclarator(node, null, keyword, varName);
    }

    const defaultVal =
      this.isStructType(cppType) && this.isPointerLikeDeclarator(node)
        ? 'null'
        : this.getDefaultValue(cppType, containerInfo);
    return `${keyword} ${varName} = ${defaultVal};`;
  }

  private extractDeclaratorName(node: SyntaxNode | null): string {
    if (!node) return '_unnamed';
    switch (node.type) {
      case 'identifier':
        return node.text;
      case 'array_declarator': {
        // int arr[5] → declarator is "arr", size is "5"
        const inner = node.childForFieldName('declarator');
        return this.extractDeclaratorName(inner);
      }
      case 'pointer_declarator':
      case 'reference_declarator': {
        // Find the identifier child
        for (let i = 0; i < node.namedChildCount; i++) {
          const child = node.namedChild(i)!;
          const name = this.extractDeclaratorName(child);
          if (name !== '_unnamed') return name;
        }
        return '_unnamed';
      }
      case 'init_declarator': {
        const decl = node.childForFieldName('declarator');
        return this.extractDeclaratorName(decl);
      }
      default:
        return node.text.replace(/[&*]/g, '').trim();
    }
  }

  private isPointerLikeDeclarator(node: SyntaxNode | null): boolean {
    if (!node) return false;
    return node.type === 'pointer_declarator' || node.type === 'reference_declarator';
  }

  private handleArrayDeclarator(
    declarator: SyntaxNode,
    value: SyntaxNode | null,
    keyword: string,
    varName: string
  ): string {
    // Extract array size from the declarator
    const sizeNode = declarator.childForFieldName('size');
    const size = sizeNode?.text;

    // Check for 2D arrays: arr[3][4]
    const innerDecl = declarator.childForFieldName('declarator');
    if (innerDecl?.type === 'array_declarator') {
      const innerSize = innerDecl.childForFieldName('size')?.text;
      const innerName = this.extractDeclaratorName(innerDecl);
      if (value) {
        const jsVal = this.visitInitializerList(value);
        return `${keyword} ${innerName} = ${jsVal};`;
      }
      if (size && innerSize) {
        return `${keyword} ${innerName} = Array(${innerSize}).fill(null).map(() => Array(${size}).fill(0));`;
      }
    }

    if (value) {
      const jsVal = this.visitInitializerList(value);
      return `${keyword} ${varName} = ${jsVal};`;
    }

    if (size) {
      return `${keyword} ${varName} = Array(${size}).fill(0);`;
    }

    return `${keyword} ${varName} = [];`;
  }

  private visitInitValue(
    node: SyntaxNode,
    cppType: string,
    containerInfo: ContainerInfo | null
  ): string {
    const normalizedType = cppType.replace(/std::/g, '').trim();

    if (node.type === 'initializer_list') {
      if (this.isStructType(normalizedType)) {
        return `${normalizedType}(${this.visitInitializerListElements(node)})`;
      }
      // Container or array literal initialization
      if (containerInfo?.kind === 'set') {
        return `new Set([${this.visitInitializerListElements(node)}])`;
      }
      if (containerInfo?.kind === 'map') {
        // map init: {{k1,v1},{k2,v2}} → {k1: v1, k2: v2}
        return this.visitMapInitList(node);
      }
      if (containerInfo?.kind === 'pair') {
        return `[${this.visitInitializerListElements(node)}]`;
      }
      // vector or array → [...]
      return this.visitInitializerList(node);
    }

    if (node.type === 'argument_list') {
      if (this.isStructType(normalizedType)) {
        const args = this.visitArgumentList(node);
        return `${normalizedType}(${args.join(', ')})`;
      }
      // vector<int> v(n, val) → Array(n).fill(val)
      if (containerInfo?.kind === 'vector') {
        const args: string[] = [];
        for (let i = 0; i < node.namedChildCount; i++) {
          args.push(this.visitExpression(node.namedChild(i)!));
        }
        if (args.length === 2) {
          return `Array(${args[0]}).fill(${args[1]})`;
        }
        if (args.length === 1) {
          return `Array(${args[0]}).fill(0)`;
        }
      }
      // pair<int,int> p(a, b) → [a, b]
      if (containerInfo?.kind === 'pair') {
        const args: string[] = [];
        for (let i = 0; i < node.namedChildCount; i++) {
          args.push(this.visitExpression(node.namedChild(i)!));
        }
        return `[${args.join(', ')}]`;
      }
    }

    // Regular expression value
    return this.visitExpression(node);
  }

  private visitInitializerList(node: SyntaxNode): string {
    // {1, 2, 3} → [1, 2, 3]  or  {{1,2},{3,4}} → [[1,2],[3,4]]
    const elements: string[] = [];
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i)!;
      // Skip comments inside initializer lists — they break array literals
      if (child.type === 'comment') continue;
      if (child.type === 'initializer_list') {
        elements.push(this.visitInitializerList(child));
      } else {
        elements.push(this.visitExpression(child));
      }
    }
    return `[${elements.join(', ')}]`;
  }

  private visitInitializerListElements(node: SyntaxNode): string {
    const elements: string[] = [];
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i)!;
      if (child.type === 'initializer_list') {
        elements.push(this.visitInitializerList(child));
      } else {
        elements.push(this.visitExpression(child));
      }
    }
    return elements.join(', ');
  }

  private visitMapInitList(node: SyntaxNode): string {
    // {{key1, val1}, {key2, val2}} → { key1: val1, key2: val2 }
    // But this is hard to do perfectly with the brace notation.
    // Fall back to object literal
    const entries: string[] = [];
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i)!;
      if (child.type === 'initializer_list' && child.namedChildCount >= 2) {
        const key = this.visitExpression(child.namedChild(0)!);
        const val = this.visitExpression(child.namedChild(1)!);
        entries.push(`[${key}]: ${val}`);
      }
    }
    return `{${entries.join(', ')}}`;
  }

  private getDefaultValue(cppType: string, containerInfo: ContainerInfo | null): string {
    const normalizedType = cppType.replace(/std::/g, '').trim();

    if (containerInfo) {
      switch (containerInfo.kind) {
        case 'vector': return '[]';
        case 'map': return '{}';
        case 'set': return 'new Set()';
        case 'pair': return '[0, 0]';
        case 'stack':
        case 'queue':
        case 'priority_queue': return '[]';
      }
    }
    if (this.isStructType(normalizedType)) return `${normalizedType}()`;
    if (normalizedType === 'string') return '""';
    if (normalizedType === 'bool') return 'false';
    if (normalizedType === 'char') return "''";
    if (CPP_INTEGER_TYPES.has(normalizedType)) return '0';
    if (normalizedType === 'float' || normalizedType === 'double') return '0.0';
    return '0';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTAINER TYPE PARSING
  // ═══════════════════════════════════════════════════════════════════════════

  private parseContainerType(
    typeNode: SyntaxNode | null,
    cleanType: string
  ): ContainerInfo | null {
    if (!typeNode) return null;

    // Check for template_type node (vector<int>, map<string,int>, etc.)
    if (typeNode.type === 'template_type') {
      const nameNode = typeNode.childForFieldName('name');
      const name = nameNode?.text?.replace(/std::/g, '') ?? '';

      if (name === 'vector') return { kind: 'vector' };
      if (name === 'map' || name === 'unordered_map') return { kind: 'map' };
      if (name === 'set' || name === 'unordered_set') return { kind: 'set' };
      if (name === 'pair') return { kind: 'pair' };
      if (name === 'stack') return { kind: 'stack' };
      if (name === 'queue') return { kind: 'queue' };
      if (name === 'priority_queue') return { kind: 'priority_queue' };
    }

    // Check plain text for containers (might be qualified with std::)
    const stripped = cleanType.replace(/std::/g, '');
    if (stripped.startsWith('vector')) return { kind: 'vector' };
    if (stripped.startsWith('map') || stripped.startsWith('unordered_map')) return { kind: 'map' };
    if (stripped.startsWith('set') || stripped.startsWith('unordered_set')) return { kind: 'set' };
    if (stripped.startsWith('pair')) return { kind: 'pair' };
    if (stripped.startsWith('stack')) return { kind: 'stack' };
    if (stripped.startsWith('queue')) return { kind: 'queue' };
    if (stripped.startsWith('priority_queue')) return { kind: 'priority_queue' };

    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPRESSION STATEMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  private visitExpressionStatement(node: SyntaxNode): string {
    // expression_statement wraps an expression and ends with ;
    const expr = node.namedChildCount > 0 ? node.namedChild(0)! : null;
    if (!expr) return '';
    const js = this.visitExpression(expr);
    return js + ';';
  }

  private visitReturnStatement(node: SyntaxNode, isMain: boolean): string {
    const valueNode = node.namedChildCount > 0 ? node.namedChild(0) : null;

    if (isMain || this.insideMain) {
      // In main, "return 0;" → skip
      if (valueNode && valueNode.text.trim() === '0') {
        return '// return 0;';
      }
    }

    if (valueNode) {
      return `return ${this.visitExpression(valueNode)};`;
    }
    return 'return;';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROL FLOW
  // ═══════════════════════════════════════════════════════════════════════════

  private visitIfStatement(node: SyntaxNode): string {
    const condNode = node.childForFieldName('condition');
    const consequent = node.childForFieldName('consequence');
    const alternate = node.childForFieldName('alternative');

    const cond = condNode ? this.visitConditionClause(condNode) : 'true';
    let result = `if (${cond})`;

    if (consequent) {
      result += ' ' + this.visitStatementOrBlock(consequent);
    }

    if (alternate) {
      // else_clause: may contain if_statement (else if) or compound_statement
      result += ' else';
      const elseBody = alternate.namedChildCount > 0 ? alternate.namedChild(0)! : null;
      if (elseBody) {
        if (elseBody.type === 'if_statement') {
          result += ' ' + this.visitIfStatement(elseBody);
        } else {
          result += ' ' + this.visitStatementOrBlock(elseBody);
        }
      }
    }

    return result;
  }

  private visitForStatement(node: SyntaxNode): string {
    const init = node.childForFieldName('initializer');
    const cond = node.childForFieldName('condition');
    const update = node.childForFieldName('update');
    const body = node.childForFieldName('body');

    let initStr = '';
    if (init) {
      if (init.type === 'declaration') {
        // For-loop init declaration: "int i = 0"
        initStr = this.visitDeclaration(init).replace(/;$/, '');
      } else {
        initStr = this.visitExpression(init);
      }
    }

    const condStr = cond ? this.visitExpression(cond) : '';
    const updateStr = update ? this.visitExpression(update) : '';
    const bodyStr = body ? this.visitStatementOrBlock(body) : '{}';

    return `for (${initStr}; ${condStr}; ${updateStr}) ${bodyStr}`;
  }

  private visitForRangeLoop(node: SyntaxNode): string {
    // for (auto x : container) → for (let x of container)
    const declarator = node.childForFieldName('declarator');
    const right = node.childForFieldName('right');
    const body = node.childForFieldName('body');

    const varName = this.extractDeclaratorName(declarator);
    const container = right ? this.visitExpression(right) : '[]';
    const bodyStr = body ? this.visitStatementOrBlock(body) : '{}';

    return `for (let ${varName} of ${container}) ${bodyStr}`;
  }

  private visitWhileStatement(node: SyntaxNode): string {
    const condNode = node.childForFieldName('condition');
    const body = node.childForFieldName('body');

    const cond = condNode ? this.visitConditionClause(condNode) : 'true';
    const bodyStr = body ? this.visitStatementOrBlock(body) : '{}';

    return `while (${cond}) ${bodyStr}`;
  }

  private visitDoWhileStatement(node: SyntaxNode): string {
    const body = node.childForFieldName('body');
    const condNode = node.childForFieldName('condition');

    const bodyStr = body ? this.visitStatementOrBlock(body) : '{}';
    const cond = condNode ? this.visitConditionClause(condNode) : 'true';

    return `do ${bodyStr} while (${cond});`;
  }

  private visitSwitchStatement(node: SyntaxNode): string {
    const condNode = node.childForFieldName('condition');
    const body = node.childForFieldName('body');

    const cond = condNode ? this.visitConditionClause(condNode) : 'x';
    let bodyStr = '';
    if (body) {
      bodyStr = '{\n';
      for (let i = 0; i < body.namedChildCount; i++) {
        bodyStr += this.visitStatement(body.namedChild(i)!) + '\n';
      }
      bodyStr += '}';
    }

    return `switch (${cond}) ${bodyStr}`;
  }

  private visitCaseStatement(node: SyntaxNode): string {
    const valueNode = node.childForFieldName('value');
    const lines: string[] = [];

    if (valueNode) {
      lines.push(`case ${this.visitExpression(valueNode)}:`);
    } else {
      lines.push('default:');
    }

    // Process body statements
    for (let i = 0; i < node.namedChildCount; i++) {
      const child = node.namedChild(i)!;
      if (child === valueNode) continue;
      lines.push('  ' + this.visitStatement(child));
    }

    return lines.join('\n');
  }

  private visitConditionClause(node: SyntaxNode): string {
    // condition_clause wraps expressions in parentheses
    if (node.type === 'condition_clause' || node.type === 'parenthesized_expression') {
      // Get the inner expression (skip the parens)
      if (node.namedChildCount > 0) {
        return this.visitExpression(node.namedChild(0)!);
      }
    }
    return this.visitExpression(node);
  }

  private visitStatementOrBlock(node: SyntaxNode): string {
    if (node.type === 'compound_statement') {
      this.symbols.enterScope();
      const body = '{\n' + this.visitCompoundStatementBody(node, this.insideMain) + '\n}';
      this.symbols.exitScope();
      return body;
    }
    return this.visitStatement(node);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPRESSIONS (the core — every expression returns a JS string)
  // ═══════════════════════════════════════════════════════════════════════════

  visitExpression(node: SyntaxNode): string {
    switch (node.type) {
      case 'number_literal':
        return node.text;
      case 'string_literal':
        return node.text;
      case 'concatenated_string': {
        // Adjacent string literals → concatenated
        const parts: string[] = [];
        for (let i = 0; i < node.namedChildCount; i++) {
          parts.push(node.namedChild(i)!.text);
        }
        return parts.join(' + ');
      }
      case 'char_literal':
        return node.text;
      case 'true':
        return 'true';
      case 'false':
        return 'false';
      case 'null':
        return 'null';

      case 'identifier':
        return this.visitIdentifier(node);

      case 'qualified_identifier':
        return this.visitQualifiedIdentifier(node);

      case 'binary_expression':
        return this.visitBinaryExpression(node);

      case 'unary_expression':
        return this.visitUnaryExpression(node);

      case 'update_expression':
        return node.text; // i++, i--, ++i, --i → identical in JS

      case 'assignment_expression':
        return this.visitAssignmentExpression(node);

      case 'call_expression':
        return this.visitCallExpression(node);

      case 'field_expression':
        return this.visitFieldExpression(node);

      case 'subscript_expression':
        return this.visitSubscriptExpression(node);

      case 'parenthesized_expression': {
        const inner = node.namedChildCount > 0 ? node.namedChild(0)! : null;
        if (inner) {
          return `(${this.visitExpression(inner)})`;
        }
        return node.text;
      }

      case 'conditional_expression': {
        const cond = node.childForFieldName('condition');
        const cons = node.childForFieldName('consequence');
        const alt = node.childForFieldName('alternative');
        return `${cond ? this.visitExpression(cond) : '?'} ? ${cons ? this.visitExpression(cons) : ''} : ${alt ? this.visitExpression(alt) : ''}`;
      }

      case 'comma_expression': {
        const parts: string[] = [];
        const left = node.childForFieldName('left');
        const right = node.childForFieldName('right');
        if (left) parts.push(this.visitExpression(left));
        if (right) parts.push(this.visitExpression(right));
        return parts.join(', ');
      }

      case 'cast_expression':
        // (int)x → just the value, skip the cast
        return this.visitExpression(node.childForFieldName('value') ?? node.namedChild(node.namedChildCount - 1)!);

      case 'sizeof_expression': {
        const valueNode = node.childForFieldName('value') || node.namedChild(0);
        if (valueNode && valueNode.type === 'identifier') {
          return `(${valueNode.text}.length || 1)`;
        }
        return '1';
      }

      case 'initializer_list':
        return this.visitInitializerList(node);

      case 'template_function':
        // e.g., greater<int>() → skip, handled at call site
        return this.visitExpression(node.childForFieldName('name') ?? node.namedChild(0)!);

      case 'compound_literal_expression':
        return this.visitExpression(node.namedChild(node.namedChildCount - 1)!);

      case 'pointer_expression':
        // *ptr or &var → just emit the operand
        return this.visitExpression(node.namedChild(node.namedChildCount - 1)!);

      case 'user_defined_literal':
        return node.text;

      default:
        // Fallback: return raw text (may contain C++ syntax)
        if (!SUPPORTED_NODE_TYPES.has(node.type)) {
          this.warnUnsupported(node);
        }
        return node.text;
    }
  }

  private visitIdentifier(node: SyntaxNode): string {
    const name = node.text;
    // Map C++ constants to JS equivalents
    if (name in CPP_CONSTANTS) {
      return CPP_CONSTANTS[name];
    }
    // string::npos
    if (name === 'npos') return '-1';
    return name;
  }

  private visitQualifiedIdentifier(node: SyntaxNode): string {
    // std::cout, std::endl, std::string::npos, etc.
    const text = node.text.replace(/std::/g, '');
    if (text === 'npos' || text === 'string::npos') return '-1';
    if (text in CPP_CONSTANTS) return CPP_CONSTANTS[text];
    return text;
  }

  // ─── Binary Expressions ────────────────────────────────────────────────────

  private visitBinaryExpression(node: SyntaxNode): string {
    const left = node.childForFieldName('left');
    const right = node.childForFieldName('right');
    const operator = node.childForFieldName('operator')?.text ?? '';

    if (!left || !right) return node.text;

    // Special handling for cout/cerr << chains
    if (operator === '<<') {
      const coutResult = this.tryCoutChain(node);
      if (coutResult !== null) return coutResult;
    }

    // Special handling for cin >> chains
    if (operator === '>>') {
      const cinResult = this.tryCinChain(node);
      if (cinResult !== null) return cinResult;
    }

    const leftStr = this.visitExpression(left);
    const rightStr = this.visitExpression(right);

    // C++ == is JS ===
    if (operator === '==') return `${leftStr} === ${rightStr}`;
    if (operator === '!=') return `${leftStr} !== ${rightStr}`;

    return `${leftStr} ${operator} ${rightStr}`;
  }

  private tryCoutChain(node: SyntaxNode): string | null {
    // Recursively collect all << operands, check if leftmost is cout/cerr
    const parts: string[] = [];
    let current: SyntaxNode | null = node;
    let streamName = '';

    // Walk down the left-recursive << chain
    while (current && current.type === 'binary_expression') {
      const op = current.childForFieldName('operator')?.text;
      if (op !== '<<') break;

      const right = current.childForFieldName('right');
      if (right) {
        const rightText = right.text.replace(/std::/g, '').trim();
        // Skip endl and <iomanip> manipulators
        if (rightText !== 'endl' && 
            rightText !== '"\\n"' && 
            rightText !== 'fixed' && 
            !rightText.startsWith('setw') && 
            !rightText.startsWith('setprecision')) {
          parts.unshift(this.visitExpression(right));
        }
      }

      const left = current.childForFieldName('left');
      if (!left) break;

      if (left.type === 'identifier' || left.type === 'qualified_identifier') {
        const leftText = left.text.replace(/std::/g, '').trim();
        if (leftText === 'cout') {
          streamName = 'log';
          break;
        } else if (leftText === 'cerr') {
          streamName = 'error';
          break;
        }
      }

      current = left;
    }

    if (!streamName) return null;
    return `console.${streamName}(${parts.join(', ')})`;
  }

  private tryCinChain(node: SyntaxNode): string | null {
    // cin >> a >> b → a = __tracer.input(); b = __tracer.input()
    const vars: string[] = [];
    let current: SyntaxNode | null = node;
    let isCin = false;

    while (current && current.type === 'binary_expression') {
      const op = current.childForFieldName('operator')?.text;
      if (op !== '>>') break;

      const right = current.childForFieldName('right');
      if (right) vars.unshift(this.visitExpression(right));

      const left = current.childForFieldName('left');
      if (!left) break;

      if (left.type === 'identifier' || left.type === 'qualified_identifier') {
        const leftText = left.text.replace(/std::/g, '').trim();
        if (leftText === 'cin') {
          isCin = true;
          break;
        }
      }

      current = left;
    }

    if (!isCin) return null;
    return vars.map(v => `${v} = __tracer.input()`).join('; ');
  }

  // ─── Assignment Expressions ─────────────────────────────────────────────────

  private visitAssignmentExpression(node: SyntaxNode): string {
    const left = node.childForFieldName('left');
    const right = node.childForFieldName('right');
    const operator = node.childForFieldName('operator')?.text ?? '=';

    if (!left || !right) return node.text;

    const leftStr = this.visitExpression(left);
    const rightStr = this.visitExpression(right);

    // Integer division truncation for /= operator
    if (operator === '/=') {
      const varName = left.text.replace(/[&*]/g, '');
      if (this.symbols.isIntegerVariable(varName)) {
        return `${leftStr} = Math.trunc(${leftStr} / (${rightStr}))`;
      }
    }

    // Regular assignment — check if integer var being assigned a division
    if (operator === '=' && left.type === 'identifier') {
      const varName = left.text;
      if (this.symbols.isIntegerVariable(varName) && this.containsDivision(right)) {
        return `${leftStr} = Math.trunc(${rightStr})`;
      }
    }

    return `${leftStr} ${operator} ${rightStr}`;
  }

  private containsDivision(node: SyntaxNode): boolean {
    if (node.type === 'binary_expression') {
      const op = node.childForFieldName('operator')?.text;
      if (op === '/') return true;
    }
    for (let i = 0; i < node.childCount; i++) {
      if (this.containsDivision(node.child(i)!)) return true;
    }
    return false;
  }

  // ─── Call Expressions ───────────────────────────────────────────────────────

  private visitCallExpression(node: SyntaxNode): string {
    const funcNode = node.childForFieldName('function');
    const argsNode = node.childForFieldName('arguments');

    if (!funcNode) return node.text;

    // ── Method calls (funcNode is field_expression: obj.method) ──
    if (funcNode.type === 'field_expression') {
      const objNode = funcNode.childForFieldName('argument');
      const methodNode = funcNode.childForFieldName('field');
      if (objNode && methodNode) {
        const obj = this.visitExpression(objNode);
        const method = methodNode.text;
        const args = argsNode ? this.visitArgumentList(argsNode) : [];
        const containerKind = this.getContainerKindForExpression(objNode);
        const isMinPriorityQueue = this.isMinPriorityQueueExpression(objNode);

        // Methods that become properties (no parens)
        if (method === 'size' || method === 'length') return `${obj}.length`;
        if (method === 'empty') return `(${obj}.length === 0)`;
        if (method === 'front') return `${obj}[0]`;
        if (method === 'back') return `${obj}[${obj}.length - 1]`;
        if (method === 'top') {
          if (containerKind === 'priority_queue') {
            this.ensurePriorityQueueHelpers();
            return `__cppPriorityQueueTop(${obj}, ${isMinPriorityQueue})`;
          }
          return `${obj}[${obj}.length - 1]`;
        }

        // Methods with renamed equivalents
        if (method === 'push' && containerKind === 'priority_queue') {
          this.ensurePriorityQueueHelpers();
          return `__cppPriorityQueuePush(${obj}, ${args[0]}, ${isMinPriorityQueue})`;
        }
        if (method === 'pop') {
          if (containerKind === 'priority_queue') {
            this.ensurePriorityQueueHelpers();
            return `__cppPriorityQueuePop(${obj}, ${isMinPriorityQueue})`;
          }
          if (containerKind === 'queue') {
            return `${obj}.shift()`;
          }
        }
        if (method === 'push_back' || method === 'emplace_back') return `${obj}.push(${args.join(', ')})`;
        if (method === 'pop_back') return `${obj}.pop()`;
        if (method === 'clear') return `${obj}.length = 0`;

        // set.insert(x) → set.add(x)
        if (method === 'insert') {
          // Check if it's set insert (no .begin() in args)
          if (args.length === 1) return `${obj}.add(${args[0]})`;
          // array insert with begin(): .unshift
          if (args.length >= 2 && argsNode?.namedChild(0)?.text?.includes('.begin')) {
            return `${obj}.unshift(${args[1]})`;
          }
          return `${obj}.add(${args.join(', ')})`;
        }

        // erase(v.begin()) → .shift()
        if (method === 'erase') {
          if (args.length === 1 && argsNode?.namedChild(0)?.text?.includes('.begin')) {
            return `${obj}.shift()`;
          }
          return `${obj}.splice(${args.join(', ')})`;
        }

        // count(key) → has(key) ? 1 : 0
        if (method === 'count') return `(${obj}.has ? (${obj}.has(${args[0]}) ? 1 : 0) : (${args[0]} in ${obj} ? 1 : 0))`;

        // find for map/set → .has check or string → .indexOf
        if (method === 'find') return `${obj}.indexOf(${args.join(', ')})`;

        // substr(pos, len) → substring(pos, pos+len)
        if (method === 'substr') {
          if (args.length === 2) return `${obj}.substring(${args[0]}, ${args[0]} + ${args[1]})`;
          return `${obj}.substring(${args.join(', ')})`;
        }

        // begin/end → pass through (for sort/reverse matching at higher level)
        if (method === 'begin' || method === 'end') return `${obj}.${method}()`;

        // Default: keep the method call as-is
        return `${obj}.${method}(${args.join(', ')})`;
      }
    }

    const funcText = funcNode.text.replace(/std::/g, '');
    const args = argsNode ? this.visitArgumentList(argsNode) : [];

    const memberCallMatch = funcText.match(/^([A-Za-z_]\w*)\.(\w+)$/);
    if (memberCallMatch) {
      const [, objName, method] = memberCallMatch;
      const containerKind = this.symbols.lookup(objName)?.containerKind ?? null;
      const symbol = this.symbols.lookup(objName);
      const isMinPriorityQueue =
        !!symbol &&
        symbol.containerKind === 'priority_queue' &&
        /(?:^|[<,\s])greater(?:\s*<|$)/.test(symbol.cppType.replace(/std::/g, ''));

      if (method === 'top' && containerKind === 'priority_queue') {
        this.ensurePriorityQueueHelpers();
        return `__cppPriorityQueueTop(${objName}, ${isMinPriorityQueue})`;
      }

      if (method === 'push' && containerKind === 'priority_queue') {
        this.ensurePriorityQueueHelpers();
        return `__cppPriorityQueuePush(${objName}, ${args[0]}, ${isMinPriorityQueue})`;
      }

      if (method === 'pop') {
        if (containerKind === 'priority_queue') {
          this.ensurePriorityQueueHelpers();
          return `__cppPriorityQueuePop(${objName}, ${isMinPriorityQueue})`;
        }
        if (containerKind === 'queue') {
          return `${objName}.shift()`;
        }
      }
    }

    // ── STL free functions ──
    // sort(v.begin(), v.end()) → v.sort((a,b) => a-b)
    if (funcText === 'sort' && args.length >= 2) {
      const match = this.matchBeginEnd(argsNode!);
      if (match) {
        if (args.length === 3) {
          // Custom comparator or greater<>()
          const third = argsNode!.namedChild(2)!.text.replace(/std::/g, '');
          if (third.includes('greater')) {
            return `${match}.sort((a, b) => b - a)`;
          }
          return `${match}.sort(${args[2]})`;
        }
        return `${match}.sort((a, b) => a - b)`;
      }
      // sort(arr, arr + n) → arr.sort(...)
      if (argsNode && argsNode.namedChildCount >= 2) {
        const first = argsNode.namedChild(0)!.text;
        const second = argsNode.namedChild(1)!.text;
        if (second.includes(first + ' +') || second.includes(first + '+')) {
          return `${first}.sort((a, b) => a - b)`;
        }
      }
    }

    // reverse(v.begin(), v.end()) → v.reverse()
    if (funcText === 'reverse' && args.length >= 2) {
      const match = this.matchBeginEnd(argsNode!);
      if (match) return `${match}.reverse()`;
    }

    // merge(a.begin(), a.end(), b.begin(), b.end(), out.begin()) → write merged result into out
    if (funcText === 'merge' && args.length >= 5) {
      const match = this.matchMergeCall(argsNode!);
      if (match) {
        this.ensureMergeHelper();
        const comparator = args.length >= 6 ? `, ${args[5]}` : '';
        return `${match.out}.splice(0, ${match.out}.length, ...__cppMergeSortedArrays(${match.left}, ${match.right}${comparator}))`;
      }
    }

    // swap(a, b) → [a, b] = [b, a]
    if (funcText === 'swap' && args.length === 2) {
      return `[${args[0]}, ${args[1]}] = [${args[1]}, ${args[0]}]`;
    }

    // find(v.begin(), v.end(), val) → v.indexOf(val)
    if (funcText === 'find' && args.length >= 3) {
      const match = this.matchBeginEnd(argsNode!);
      if (match) return `${match}.indexOf(${args[2]})`;
    }

    // accumulate(v.begin(), v.end(), 0) → v.reduce((a,b) => a+b, 0)
    if (funcText === 'accumulate' && args.length >= 3) {
      const match = this.matchBeginEnd(argsNode!);
      if (match) return `${match}.reduce((a, b) => a + b, ${args[2]})`;
    }

    // fill(v.begin(), v.end(), val) → v.fill(val)
    if (funcText === 'fill' && args.length >= 3) {
      const match = this.matchBeginEnd(argsNode!);
      if (match) return `${match}.fill(${args[2]})`;
    }

    // count(v.begin(), v.end(), val) → v.filter(x => x === val).length
    if (funcText === 'count' && args.length >= 3) {
      const match = this.matchBeginEnd(argsNode!);
      if (match) return `${match}.filter(x => x === ${args[2]}).length`;
    }

    // min/max(a, b) → Math.min/Math.max(a, b)
    if (funcText === 'min' && args.length === 2) {
      return `Math.min(${args[0]}, ${args[1]})`;
    }
    if (funcText === 'max' && args.length === 2) {
      return `Math.max(${args[0]}, ${args[1]})`;
    }

    // Math functions: abs, pow, sqrt, etc.
    if (funcText in STL_MATH_FUNCTIONS) {
      return `${STL_MATH_FUNCTIONS[funcText]}(${args.join(', ')})`;
    }

    // min_element / max_element
    if (funcText === 'min_element' || funcText === '*min_element') {
      const match = this.matchBeginEnd(argsNode!);
      if (match) return `Math.min(...${match})`;
    }
    if (funcText === 'max_element' || funcText === '*max_element') {
      const match = this.matchBeginEnd(argsNode!);
      if (match) return `Math.max(...${match})`;
    }

    // make_pair(a, b) → [a, b]
    if (funcText === 'make_pair' && args.length === 2) {
      return `[${args[0]}, ${args[1]}]`;
    }

    // to_string(x) → String(x)
    if (funcText === 'to_string') return `String(${args.join(', ')})`;
    // stoi(x) → parseInt(x)
    if (funcText === 'stoi') return `parseInt(${args.join(', ')})`;
    // stof/stod → parseFloat
    if (funcText === 'stof' || funcText === 'stod') return `parseFloat(${args.join(', ')})`;

    // getline(cin, str) → str = __tracer.input()
    if (funcText === 'getline' && args.length >= 2) {
      const cinArg = args[0].replace(/std::/g, '').trim();
      if (cinArg === 'cin') {
        return `${args[1]} = __tracer.input()`;
      }
    }

    // printf("fmt", args) → console.log(args)
    if (funcText === 'printf') {
      if (args.length > 1) {
        return `console.log(${args.slice(1).join(', ')})`;
      }
      return `console.log(${args[0]})`;
    }

    // scanf → not supported
    if (funcText === 'scanf') {
      return '/* scanf not supported in visualizer */';
    }

    // Regular function call
    return `${funcText}(${args.join(', ')})`;
  }

  private visitArgumentList(node: SyntaxNode): string[] {
    const args: string[] = [];
    for (let i = 0; i < node.namedChildCount; i++) {
      args.push(this.visitExpression(node.namedChild(i)!));
    }
    return args;
  }

  private getContainerKindForExpression(node: SyntaxNode | null): string | null {
    if (!node || node.type !== 'identifier') return null;
    return this.symbols.lookup(node.text)?.containerKind ?? null;
  }

  private isMinPriorityQueueExpression(node: SyntaxNode | null): boolean {
    if (!node || node.type !== 'identifier') return false;
    const symbol = this.symbols.lookup(node.text);
    if (!symbol || symbol.containerKind !== 'priority_queue') return false;
    return /(?:^|[<,\s])greater(?:\s*<|$)/.test(symbol.cppType.replace(/std::/g, ''));
  }

  private matchBeginCall(node: SyntaxNode): string | null {
    const text = node.text.replace(/std::/g, '');
    const beginMatch = text.match(/^(\w+)\.begin\s*\(\s*\)$/);
    return beginMatch ? beginMatch[1] : null;
  }

  private matchMergeCall(argsNode: SyntaxNode): { left: string; right: string; out: string } | null {
    if (argsNode.namedChildCount < 5) return null;

    const leftBegin = this.matchBeginCall(argsNode.namedChild(0)!);
    const leftEnd = argsNode.namedChild(1)!.text.replace(/std::/g, '');
    const rightBegin = this.matchBeginCall(argsNode.namedChild(2)!);
    const rightEnd = argsNode.namedChild(3)!.text.replace(/std::/g, '');
    const outBegin = this.matchBeginCall(argsNode.namedChild(4)!);

    if (!leftBegin || !rightBegin || !outBegin) return null;
    if (!new RegExp(`^${leftBegin}\\.end\\s*\\(\\s*\\)$`).test(leftEnd)) return null;
    if (!new RegExp(`^${rightBegin}\\.end\\s*\\(\\s*\\)$`).test(rightEnd)) return null;

    return { left: leftBegin, right: rightBegin, out: outBegin };
  }

  /** Try to match pattern: v.begin(), v.end() → returns "v" */
  private matchBeginEnd(argsNode: SyntaxNode): string | null {
    if (argsNode.namedChildCount < 2) return null;
    const first = argsNode.namedChild(0)!;
    const second = argsNode.namedChild(1)!;

    // Check if both are call_expressions for .begin() and .end()
    const firstText = first.text.replace(/std::/g, '');
    const secondText = second.text.replace(/std::/g, '');

    const beginMatch = firstText.match(/^(\w+)\.begin\s*\(\s*\)$/);
    const endMatch = secondText.match(/^(\w+)\.end\s*\(\s*\)$/);

    if (beginMatch && endMatch && beginMatch[1] === endMatch[1]) {
      return beginMatch[1];
    }
    return null;
  }

  // ─── Field (Member) Expressions ─────────────────────────────────────────────

  private visitFieldExpression(node: SyntaxNode): string {
    const argument = node.childForFieldName('argument');
    const field = node.childForFieldName('field');

    if (!argument || !field) return node.text;

    const obj = this.visitExpression(argument);
    const member = field.text;
    const containerKind = this.getContainerKindForExpression(argument);
    const isMinPriorityQueue = this.isMinPriorityQueueExpression(argument);

    // STL method translations
    if (member in STL_METHOD_MAP) {
      return `${obj}.${STL_METHOD_MAP[member]}`;
    }

    // .size() / .length() → .length (handled at call site when followed by ())
    if (member === 'size' || member === 'length') {
      return `${obj}.length`;
    }

    // .empty() → (obj.length === 0)
    if (member === 'empty') {
      return `(${obj}.length === 0)`;
    }

    // .front() → obj[0]
    if (member === 'front') {
      return `${obj}[0]`;
    }

    // .back() → obj[obj.length - 1]
    if (member === 'back') {
      return `${obj}[${obj}.length - 1]`;
    }

    // .top() → stack/priority_queue peek
    if (member === 'top') {
      if (containerKind === 'priority_queue') {
        this.ensurePriorityQueueHelpers();
        return `__cppPriorityQueueTop(${obj}, ${isMinPriorityQueue})`;
      }
      return `${obj}[${obj}.length - 1]`;
    }

    // .clear() → obj.length = 0
    if (member === 'clear') {
      return `${obj}.length = 0`;
    }

    // .begin() / .end() — keep as-is (handled at call_expression level for sort/reverse)
    if (member === 'begin' || member === 'end') {
      return `${obj}.${member}`;
    }

    // .first → [0], .second → [1]  (pair members)
    if (member === 'first') return `${obj}[0]`;
    if (member === 'second') return `${obj}[1]`;

    // .erase → handled at call site
    // .insert → could be set.add or array.unshift — handled at call site
    // .find → could be map.has or string.indexOf — handled at call site
    // .count → handled at call site
    // .substr → handled at call site
    // .has → pass through

    return `${obj}.${member}`;
  }

  // ─── Subscript Expressions ──────────────────────────────────────────────────

  private visitSubscriptExpression(node: SyntaxNode): string {
    const argument = node.childForFieldName('argument');
    const index = node.childForFieldName('index');

    if (!argument || !index) return node.text;

    return `${this.visitExpression(argument)}[${this.visitExpression(index)}]`;
  }

  // ─── Unary Expressions ──────────────────────────────────────────────────────

  private visitUnaryExpression(node: SyntaxNode): string {
    const operator = node.childForFieldName('operator')?.text ?? '';
    const operand = node.childForFieldName('argument');

    if (!operand) return node.text;

    // Dereference *ptr or address-of &var → just the variable in educational context
    if (operator === '*' || operator === '&') {
      return this.visitExpression(operand);
    }

    return `${operator}${this.visitExpression(operand)}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════

  /** Wrap expression in Math.trunc if it contains division */
  private wrapIntegerExpr(expr: string): string {
    // Only wrap if expression contains division and isn't already wrapped
    if (expr.includes('/') && !expr.includes('Math.trunc') && !expr.includes('Math.floor')) {
      return `Math.trunc(${expr})`;
    }
    return expr;
  }

  private warnUnsupported(node: SyntaxNode): void {
    this.warnings.warn(
      node.startPosition.row + 1,
      node.startPosition.column,
      node.type,
      `Unsupported C++ construct: ${node.type} — "${node.text.substring(0, 40)}..."`
    );
  }
}
