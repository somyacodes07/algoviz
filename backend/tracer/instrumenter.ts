import * as acorn from 'acorn';

interface Node {
  type: string;
  start: number;
  end: number;
  body?: Node | Node[];
  expression?: Node;
  test?: Node;
  consequent?: Node;
  alternate?: Node;
  declarations?: Node[];
  id?: Node;
  init?: Node;
  params?: Node[];
  argument?: Node;
  left?: Node;
  [key: string]: any;
}

interface Patch {
  index: number;
  text: string;
}

/**
 * Recursively extract all bound variable names from a binding pattern.
 * Handles: Identifier, ArrayPattern, ObjectPattern, AssignmentPattern, RestElement.
 *
 * Examples:
 *   const [a, b] = [1, 2]           → collects a, b
 *   const { x, y: z } = obj         → collects x, z
 *   const [a, ...rest] = arr        → collects a, rest
 *   const { x = 10 } = obj          → collects x
 */
function collectBindingNames(node: any, target: Set<string>): void {
  if (!node) return;
  switch (node.type) {
    case 'Identifier':
      target.add(node.name);
      break;
    case 'ArrayPattern':
      node.elements?.forEach((el: any) => {
        if (el) collectBindingNames(el, target);
      });
      break;
    case 'ObjectPattern':
      node.properties?.forEach((prop: any) => {
        // { key: value } — the bound name is in value, not key
        if (prop.type === 'Property') {
          collectBindingNames(prop.value, target);
        } else if (prop.type === 'RestElement') {
          collectBindingNames(prop.argument, target);
        }
      });
      break;
    case 'AssignmentPattern':
      // const { x = 10 } or const [a = 5]
      collectBindingNames(node.left, target);
      break;
    case 'RestElement':
      // const [...rest]
      collectBindingNames(node.argument, target);
      break;
  }
}

export function instrumentCode(code: string): string {
  try {
    const comments: any[] = [];
    const ast = acorn.parse(code, {
      ecmaVersion: 2020,
      locations: true,
      onComment: comments,
    }) as Node;

    const patches: Patch[] = [];

    function addPatch(index: number, text: string) {
      patches.push({ index, text });
    }

    // Scope tracking. Each scope maps a name to whether reading it needs a TDZ guard:
    // let/const are known from the start of their scope (so functions see globals declared below them),
    // but reading one before its line runs throws, so the trace reads it inside try/catch.
    const scopeStack: Map<string, boolean>[] = [new Map()];
    // Parallel to scopeStack: true where the scope is a function body or the program, which is where `var` lives.
    const functionScope: boolean[] = [true];

    function declare(scope: Map<string, boolean>, name: string, guarded: boolean) {
      if (!scope.has(name) || !guarded) scope.set(name, guarded);
    }
    function declarePattern(pattern: any, scope: Map<string, boolean>, guarded: boolean) {
      const names = new Set<string>();
      collectBindingNames(pattern, names);
      names.forEach((name) => declare(scope, name, guarded));
    }

    // let/const and function declarations directly in this block.
    function predeclareBlock(statements: Node[], scope: Map<string, boolean>) {
      statements.forEach((statement) => {
        if (statement.type === 'VariableDeclaration' && statement.kind !== 'var') {
          statement.declarations?.forEach((decl) => declarePattern(decl.id, scope, true));
        } else if (statement.type === 'FunctionDeclaration' && statement.id) {
          declare(scope, statement.id.name, false);
        }
      });
    }

    // Every `var` in a function body, however deep, without entering nested functions.
    function predeclareVars(node: any, scope: Map<string, boolean>) {
      if (!node || typeof node.type !== 'string') return;
      if (node.type === 'VariableDeclaration' && node.kind === 'var') {
        node.declarations?.forEach((decl: Node) => declarePattern(decl.id, scope, false));
      }
      for (const key of Object.keys(node)) {
        const value = node[key];
        const children = Array.isArray(value) ? value : [value];
        children.forEach((child: any) => {
          if (!child || typeof child.type !== 'string') return;
          if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ClassDeclaration', 'ClassExpression'].includes(child.type)) return;
          predeclareVars(child, scope);
        });
      }
    }

    function getCurrentScopeVars(): Map<string, boolean> {
      const vars = new Map<string, boolean>();
      scopeStack.forEach((scope) => scope.forEach((guarded, name) => vars.set(name, guarded)));
      return vars;
    }

    function generateTraceCall(line: number, type: string = 'step') {
      const fields = Array.from(getCurrentScopeVars()).map(([v, guarded]) =>
        guarded
          ? `${v}: (() => { try { return ${v}; } catch (__e) { return __tracer.TDZ; } })()`
          : `${v}: (typeof ${v} !== 'undefined' ? ${v} : undefined)`,
      );
      return `__tracer.step(${line}, { ${fields.join(', ')} });`;
    }

    function shouldWrapInSyntheticBlock(node: Node, parent?: Node): boolean {
      if (!parent) return false;

      if (parent.type === 'IfStatement') {
        return parent.consequent === node || parent.alternate === node;
      }

      return (
        [
          'ForStatement',
          'WhileStatement',
          'DoWhileStatement',
          'ForInStatement',
          'ForOfStatement',
        ].includes(parent.type) && parent.body === node
      );
    }

    function walk(node: Node, parent?: Node) {
      if (!node) return;

      const isLoopInitializer =
        !!parent &&
        ((parent.type === 'ForStatement' && parent.init === node) ||
          (parent.type === 'ForInStatement' && parent.left === node) ||
          (parent.type === 'ForOfStatement' && parent.left === node));

      // Scope Management
      const isBlock = node.type === 'BlockStatement' || node.type === 'Program';
      const isFunction =
        node.type === 'FunctionDeclaration' ||
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'FunctionExpression';
      // `for (let i ...)` binds i to the loop, so it must leave scope when the loop ends.
      const isLoopScope = ['ForStatement', 'ForInStatement', 'ForOfStatement'].includes(node.type);
      const opensScope = isBlock || isFunction || isLoopScope;

      if (opensScope) {
        const scope = new Map<string, boolean>();
        scopeStack.push(scope);
        functionScope.push(isFunction || node.type === 'Program');
        if (isBlock && Array.isArray(node.body)) predeclareBlock(node.body as Node[], scope);
        if (node.type === 'Program') predeclareVars(node, scope);
        if (isFunction) predeclareVars(node.body, scope);
      }

      // Variable Collection — supports destructuring (ArrayPattern, ObjectPattern).
      // Loop bindings (`for (let i ...)`) land here; they are initialised before the body runs.
      if (node.type === 'VariableDeclaration') {
        let target = scopeStack.length - 1;
        if (node.kind === 'var') {
          while (target > 0 && !functionScope[target]) target--;
        }
        node.declarations?.forEach((decl) => {
          declarePattern(decl.id, scopeStack[target], node.kind !== 'var' && !isLoopInitializer);
        });
      }
      if (isFunction && node.id?.type === 'Identifier' && node.type !== 'FunctionDeclaration') {
        // A named function expression is visible inside itself.
        declare(scopeStack[scopeStack.length - 1], node.id.name, false);
      }
      if (isFunction && node.params) {
        node.params.forEach((param) => {
          declarePattern(param, scopeStack[scopeStack.length - 1], false);
        });
      }

      // Loop Protection
      if (
        [
          'ForStatement',
          'WhileStatement',
          'DoWhileStatement',
          'ForInStatement',
          'ForOfStatement',
        ].includes(node.type)
      ) {
        const body = node.body as Node;
        if (body.type === 'BlockStatement') {
          addPatch(body.start + 1, ` if (__tracer.checkLoop()) break; `);
        } else {
          addPatch(body.start, `{ if (__tracer.checkLoop()) break; `);
          addPatch(body.end, ` }`);
        }
      }

      // Line Tracking & Call Stack Instrumentation
      const line = acorn.getLineInfo(code, node.start).line;

      // One step at the top of every loop iteration, on the loop's line.
      const LOOP_TYPES = ['ForStatement', 'WhileStatement', 'DoWhileStatement', 'ForInStatement', 'ForOfStatement'];
      if (node.type === 'BlockStatement' && parent && LOOP_TYPES.includes(parent.type) && parent.body === node) {
        const loopLine = acorn.getLineInfo(code, parent.start).line;
        addPatch(node.start + 1, ` __tracer.setLine(${loopLine}); ${generateTraceCall(loopLine)} `);
      }
      // A step on each `if` before its condition is checked.
      if (node.type === 'IfStatement' && parent && (parent.type === 'BlockStatement' || parent.type === 'Program')) {
        addPatch(node.start, `__tracer.setLine(${line}); ${generateTraceCall(line)} `);
      }

      // Emit one explicit comparison event for each branch/loop condition.
      // The expression is passed as an argument, so it is evaluated exactly once.
      if (
        ['IfStatement', 'ConditionalExpression', 'WhileStatement', 'DoWhileStatement', 'ForStatement'].includes(node.type) &&
        node.test
      ) {
        const condition = node.test as Node;
        const expression = code.slice(condition.start, condition.end);
        addPatch(condition.start, `__tracer.test(${line}, ${JSON.stringify(expression)}, (`);
        addPatch(condition.end, '))');
      }

      // Function Entry/Exit with Try-Finally
      if (isFunction) {
        const body = node.body as Node;
        const funcName = node.id?.name || '(anonymous)';
        if (body.type === 'BlockStatement') {
          // Wrap body in try-finally to ensure exit is called
          // We insert: __tracer.enter(name); try { ... } finally { __tracer.exit(); }
          // body.start + 1 is after '{'
          // body.end - 1 is before '}'
          addPatch(body.start + 1, ` __tracer.enter("${funcName}"); try { `);
          addPatch(body.end - 1, ` } finally { __tracer.exit(); } `);
        }
      }

      // Statement Instrumentation
      if (
        !isLoopInitializer &&
        (node.type === 'VariableDeclaration' || node.type === 'ExpressionStatement')
      ) {
        const needsBlock = shouldWrapInSyntheticBlock(node, parent);
        const trace = generateTraceCall(line);

        addPatch(
          node.start,
          needsBlock ? `{ __tracer.setLine(${line}); ` : `__tracer.setLine(${line}); `,
        );
        addPatch(node.end, needsBlock ? `; ${trace} }` : `; ${trace}`);
      }

      // Return Trace
      if (!isLoopInitializer && node.type === 'ReturnStatement') {
        const needsBlock = shouldWrapInSyntheticBlock(node, parent);
        const trace = generateTraceCall(line);
        const traceExpr = trace.replace(/;$/, '');

        if (node.argument) {
          addPatch(
            node.start,
            needsBlock ? `{ __tracer.setLine(${line}); ` : `__tracer.setLine(${line}); `,
          );
          addPatch(node.argument.start, `(${traceExpr}, `);
          addPatch(node.argument.end, `)`);
          if (needsBlock) {
            addPatch(node.end, ` }`);
          }
        } else {
          addPatch(
            node.start,
            needsBlock
              ? `{ __tracer.setLine(${line}); ${trace} `
              : `__tracer.setLine(${line}); ${trace} `,
          );
          if (needsBlock) {
            addPatch(node.end, ' }');
          }
        }
      }

      // Children Traversal
      const keys = Object.keys(node);
      for (const key of keys) {
        const val = node[key];
        if (Array.isArray(val)) {
          val.forEach((v) => {
            if (v && typeof v.type === 'string') walk(v, node);
          });
        } else if (val && typeof val.type === 'string') {
          walk(val, node);
        }
      }

      // Exit Scope
      if (opensScope) {
        scopeStack.pop();
        functionScope.pop();
      }
    }

    walk(ast);

    patches.sort((a, b) => b.index - a.index);

    let out = code;
    for (const p of patches) {
      out = out.slice(0, p.index) + p.text + out.slice(p.index);
    }

    return out;
  } catch (e) {
    console.error('Instrumentation error', e);
    throw e;
  }
}
