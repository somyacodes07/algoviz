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

    // Scope tracking
    const scopeStack: Set<string>[] = [new Set()];
    function getCurrentScopeVars(): string[] {
      const vars = new Set<string>();
      scopeStack.forEach(s => s.forEach(v => vars.add(v)));
      return Array.from(vars);
    }

    function generateTraceCall(line: number, type: string = 'step') {
      const vars = getCurrentScopeVars();
      const varObj = `{ ${vars.map(v => `${v}: (typeof ${v} !== 'undefined' ? ${v} : undefined)`).join(', ')} }`;
      return `__tracer.step(${line}, ${varObj});`; 
    }

    function shouldWrapInSyntheticBlock(node: Node, parent?: Node): boolean {
      if (!parent) return false;

      if (parent.type === 'IfStatement') {
        return parent.consequent === node || parent.alternate === node;
      }

      return ['ForStatement', 'WhileStatement', 'DoWhileStatement', 'ForInStatement', 'ForOfStatement'].includes(parent.type)
        && parent.body === node;
    }

    function walk(node: Node, parent?: Node) {
      if (!node) return;

      const isLoopInitializer =
        !!parent && (
          (parent.type === 'ForStatement' && parent.init === node) ||
          (parent.type === 'ForInStatement' && parent.left === node) ||
          (parent.type === 'ForOfStatement' && parent.left === node)
        );

      // Scope Management
      const isBlock = node.type === 'BlockStatement' || node.type === 'Program';
      const isFunction = node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
      
      if (isBlock || isFunction) {
        scopeStack.push(new Set());
      }

      // Variable Collection — supports destructuring (ArrayPattern, ObjectPattern)
      if (node.type === 'VariableDeclaration') {
        node.declarations?.forEach(decl => {
          collectBindingNames(decl.id, scopeStack[scopeStack.length - 1]);
        });
      }
      if (isFunction && node.id?.type === 'Identifier') {
         if(scopeStack.length > 1) scopeStack[scopeStack.length - 2].add(node.id.name);
      }
      if (isFunction && node.params) {
        node.params.forEach(param => {
          collectBindingNames(param, scopeStack[scopeStack.length - 1]);
        });
      }

      // Loop Protection
      if (['ForStatement', 'WhileStatement', 'DoWhileStatement', 'ForInStatement', 'ForOfStatement'].includes(node.type)) {
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
      if (!isLoopInitializer && (node.type === 'VariableDeclaration' || node.type === 'ExpressionStatement')) {
         const needsBlock = shouldWrapInSyntheticBlock(node, parent);
         const trace = generateTraceCall(line);

         addPatch(
            node.start,
            needsBlock
              ? `{ __tracer.setLine(${line}); `
              : `__tracer.setLine(${line}); `,
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
                needsBlock
                  ? `{ __tracer.setLine(${line}); `
                  : `__tracer.setLine(${line}); `,
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
              val.forEach(v => {
                  if (v && typeof v.type === 'string') walk(v, node);
              });
          } else if (val && typeof val.type === 'string') {
              walk(val, node);
          }
      }

      // Exit Scope
      if (isBlock || isFunction) {
        scopeStack.pop();
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
    console.error("Instrumentation error", e);
    throw e;
  }
}
