import * as acorn from 'acorn';
import { ComplexityAnalysis, Timeline } from '../../types';

interface AstNode {
  type: string;
  start?: number;
  end?: number;
  body?: AstNode | AstNode[];
  alternate?: AstNode;
  argument?: AstNode;
  callee?: AstNode;
  consequent?: AstNode;
  declarations?: AstNode[];
  expressions?: AstNode[];
  id?: AstNode;
  init?: AstNode;
  left?: AstNode;
  object?: AstNode;
  params?: AstNode[];
  property?: AstNode;
  right?: AstNode;
  test?: AstNode;
  update?: AstNode;
  value?: unknown;
  name?: string;
  operator?: string;
  [key: string]: unknown;
}

interface TraversalContext {
  functionName: string | null;
  loopDepth: number;
}

function isLoopNode(node: AstNode | null | undefined): boolean {
  return !!node && [
    'ForStatement',
    'ForInStatement',
    'ForOfStatement',
    'WhileStatement',
    'DoWhileStatement',
  ].includes(node.type);
}

function isFunctionNode(node: AstNode | null | undefined): boolean {
  return !!node && [
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression',
  ].includes(node.type);
}

function getFunctionName(node: AstNode, parent?: AstNode): string | null {
  if (node.id?.type === 'Identifier' && typeof node.id.name === 'string') {
    return node.id.name;
  }

  if (
    parent?.type === 'VariableDeclarator' &&
    parent.id?.type === 'Identifier' &&
    typeof parent.id.name === 'string'
  ) {
    return parent.id.name;
  }

  return null;
}

function isNumericLiteral(node: AstNode | null | undefined): boolean {
  return !!node && node.type === 'Literal' && typeof node.value === 'number';
}

function literalMagnitude(node: AstNode | null | undefined): number | null {
  return isNumericLiteral(node) ? Math.abs(Number(node.value)) : null;
}

function updateLooksLogarithmic(node: AstNode | null | undefined): boolean {
  if (!node) return false;

  if (node.type === 'AssignmentExpression') {
    if (['*=', '/=', '<<=', '>>='].includes(String(node.operator))) {
      return true;
    }

    if (
      node.right?.type === 'BinaryExpression' &&
      ['*', '/', '<<', '>>'].includes(String(node.right.operator))
    ) {
      const rightMagnitude = literalMagnitude(node.right.right as AstNode);
      return rightMagnitude !== null && rightMagnitude !== 1;
    }
  }

  if (
    node.type === 'UpdateExpression' &&
    ['++', '--'].includes(String(node.operator))
  ) {
    return false;
  }

  if (node.type === 'SequenceExpression' && Array.isArray(node.expressions)) {
    return node.expressions.some((expression) =>
      updateLooksLogarithmic(expression as AstNode),
    );
  }

  return false;
}

function bodyContainsGeometricMutation(node: AstNode | null | undefined): boolean {
  if (!node) return false;

  if (
    node.type === 'AssignmentExpression' &&
    ['*=', '/=', '<<=', '>>='].includes(String(node.operator))
  ) {
    return true;
  }

  if (
    node.type === 'BinaryExpression' &&
    ['*', '/'].includes(String(node.operator))
  ) {
    const rightMagnitude = literalMagnitude(node.right as AstNode);
    return rightMagnitude !== null && rightMagnitude !== 1;
  }

  if (isFunctionNode(node)) {
    return false;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      if (
        value.some(
          (child) =>
            child &&
            typeof child === 'object' &&
            typeof (child as AstNode).type === 'string' &&
            bodyContainsGeometricMutation(child as AstNode),
        )
      ) {
        return true;
      }
    } else if (
      value &&
      typeof value === 'object' &&
      typeof (value as AstNode).type === 'string' &&
      bodyContainsGeometricMutation(value as AstNode)
    ) {
      return true;
    }
  }

  return false;
}

function countSelfCalls(node: AstNode | null | undefined, functionName: string): number {
  if (!node) return 0;

  if (isFunctionNode(node)) {
    return 0;
  }

  let total = 0;

  if (
    node.type === 'CallExpression' &&
    node.callee?.type === 'Identifier' &&
    node.callee.name === functionName
  ) {
    total += 1;
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      total += value.reduce((sum, child) => {
        if (
          child &&
          typeof child === 'object' &&
          typeof (child as AstNode).type === 'string'
        ) {
          return sum + countSelfCalls(child as AstNode, functionName);
        }
        return sum;
      }, 0);
    } else if (
      value &&
      typeof value === 'object' &&
      typeof (value as AstNode).type === 'string'
    ) {
      total += countSelfCalls(value as AstNode, functionName);
    }
  }

  return total;
}

function buildHotspots(timeline: Timeline) {
  const lineHits = new Map<number, number>();

  timeline.forEach((step) => {
    if (step.line > 0) {
      lineHits.set(step.line, (lineHits.get(step.line) || 0) + 1);
    }
  });

  const totalOperations = Math.max(timeline.length, 1);

  return Array.from(lineHits.entries())
    .map(([line, hits]) => ({
      line,
      hits,
      share: hits / totalOperations,
    }))
    .sort((left, right) => right.hits - left.hits)
    .slice(0, 6);
}

function buildEstimate(input: {
  maxLoopDepth: number;
  hasLogarithmicLoop: boolean;
  hasBranchingRecursion: boolean;
  recursiveFunctions: string[];
  hasArraySort: boolean;
  observedOperations: number;
  uniqueExecutedLines: number;
  peakStackDepth: number;
}) {
  const rationale: string[] = [];
  const recursionDetected = input.recursiveFunctions.length > 0;

  if (input.hasBranchingRecursion) {
    rationale.push('Detected multiple self-recursive calls in the same execution branch.');
    if (input.peakStackDepth > 2) {
      rationale.push(`Runtime reached ${input.peakStackDepth} stack frames, reinforcing a branching-recursion profile.`);
    }
    return {
      notation: 'O(2^n)',
      confidence: 'medium' as const,
      rationale,
    };
  }

  if (input.maxLoopDepth >= 3) {
    rationale.push(`Detected ${input.maxLoopDepth} nested loop levels in the analyzed control flow.`);
    rationale.push(`Observed ${input.observedOperations} traced operations across ${input.uniqueExecutedLines} executed lines.`);
    return {
      notation: input.maxLoopDepth === 3 ? 'O(n^3)' : `O(n^${input.maxLoopDepth})`,
      confidence: 'medium' as const,
      rationale,
    };
  }

  if (input.maxLoopDepth === 2) {
    if (input.hasLogarithmicLoop) {
      rationale.push('Detected nested iteration with at least one logarithmic-style update pattern.');
      rationale.push('This prototype treats the dominant shape as a linearithmic-style traversal.');
      return {
        notation: 'O(n log n)',
        confidence: 'low' as const,
        rationale,
      };
    }

    rationale.push('Detected two nested iterative regions.');
    rationale.push(`Observed ${input.observedOperations} traced operations, which is consistent with a quadratic hotspot.`);
    return {
      notation: 'O(n^2)',
      confidence: 'high' as const,
      rationale,
    };
  }

  if (input.hasArraySort && !recursionDetected && input.maxLoopDepth <= 1) {
    rationale.push('Detected a sort-style call, which is commonly implemented with linearithmic growth.');
    rationale.push('Treat this as a prototype estimate because built-in sort cost can depend on engine behavior.');
    return {
      notation: 'O(n log n)',
      confidence: 'low' as const,
      rationale,
    };
  }

  if (input.hasLogarithmicLoop && !recursionDetected && input.maxLoopDepth <= 1) {
    rationale.push('Detected a loop update that scales geometrically, such as multiplying or dividing by a constant.');
    return {
      notation: 'O(log n)',
      confidence: 'medium' as const,
      rationale,
    };
  }

  if (recursionDetected && input.maxLoopDepth === 0) {
    rationale.push(`Detected self-recursion in ${input.recursiveFunctions.join(', ')}.`);
    if (input.peakStackDepth > 2) {
      rationale.push(`Peak stack depth reached ${input.peakStackDepth}, suggesting a single recursive chain rather than branching recursion.`);
    }
    return {
      notation: 'O(n)',
      confidence: 'medium' as const,
      rationale,
    };
  }

  if (input.maxLoopDepth === 1 || recursionDetected) {
    rationale.push('Detected one dominant iterative or recursive pass.');
    rationale.push(`Observed ${input.uniqueExecutedLines} active lines over ${input.observedOperations} traced steps.`);
    return {
      notation: 'O(n)',
      confidence: 'medium' as const,
      rationale,
    };
  }

  rationale.push('No repeating loop or recursive structure dominated the analyzed source.');
  rationale.push(`Observed ${input.observedOperations} traced operations in this run.`);
  return {
    notation: 'O(1)',
    confidence: 'low' as const,
    rationale,
  };
}

export function analyzeComplexity(code: string, timeline: Timeline): ComplexityAnalysis {
  const hotspots = buildHotspots(timeline);
  const observedOperations = timeline.length;
  const uniqueExecutedLines = new Set(
    timeline.map((step) => step.line).filter((line) => line > 0),
  ).size;
  const peakStackDepth = timeline.reduce(
    (maxDepth, step) => Math.max(maxDepth, step.callStack.length),
    1,
  );

  let maxLoopDepth = 0;
  let hasLogarithmicLoop = false;
  let hasBranchingRecursion = false;
  let hasArraySort = false;
  const recursiveFunctions = new Set<string>();

  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 2020,
      sourceType: 'script',
    }) as unknown as AstNode;

    function walk(node: AstNode | null | undefined, parent?: AstNode, context: TraversalContext = {
      functionName: null,
      loopDepth: 0,
    }) {
      if (!node) return;

      let nextContext = context;

      if (isLoopNode(node)) {
        const nextLoopDepth = context.loopDepth + 1;
        maxLoopDepth = Math.max(maxLoopDepth, nextLoopDepth);
        nextContext = {
          ...context,
          loopDepth: nextLoopDepth,
        };

        if (
          updateLooksLogarithmic(node.update as AstNode) ||
          bodyContainsGeometricMutation(node.body as AstNode)
        ) {
          hasLogarithmicLoop = true;
        }
      }

      if (isFunctionNode(node)) {
        const functionName = getFunctionName(node, parent);
        nextContext = {
          functionName,
          loopDepth: 0,
        };
      }

      if (
        nextContext.functionName &&
        node.type === 'CallExpression' &&
        node.callee?.type === 'Identifier' &&
        node.callee.name === nextContext.functionName
      ) {
        recursiveFunctions.add(nextContext.functionName);
      }

      if (
        node.type === 'CallExpression' &&
        (
          (node.callee?.type === 'Identifier' && node.callee.name === 'sort') ||
          (node.callee?.type === 'MemberExpression' &&
            node.callee.property?.type === 'Identifier' &&
            node.callee.property.name === 'sort')
        )
      ) {
        hasArraySort = true;
      }

      if (
        nextContext.functionName &&
        node.type === 'ReturnStatement' &&
        countSelfCalls(node.argument as AstNode, nextContext.functionName) >= 2
      ) {
        hasBranchingRecursion = true;
      }

      for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
          value.forEach((child) => {
            if (
              child &&
              typeof child === 'object' &&
              typeof (child as AstNode).type === 'string'
            ) {
              walk(child as AstNode, node, nextContext);
            }
          });
        } else if (
          value &&
          typeof value === 'object' &&
          typeof (value as AstNode).type === 'string'
        ) {
          walk(value as AstNode, node, nextContext);
        }
      }
    }

    walk(ast);
  } catch {
    // If parsing fails, keep the observed metrics and fall back to a low-confidence estimate.
  }

  const estimate = buildEstimate({
    maxLoopDepth,
    hasLogarithmicLoop,
    hasBranchingRecursion,
    recursiveFunctions: Array.from(recursiveFunctions),
    hasArraySort,
    observedOperations,
    uniqueExecutedLines,
    peakStackDepth,
  });

  return {
    estimate,
    maxLoopDepth,
    recursiveFunctions: Array.from(recursiveFunctions),
    hasLogarithmicLoop,
    hasBranchingRecursion,
    hasArraySort,
    observedOperations,
    uniqueExecutedLines,
    peakStackDepth,
    hotspots,
  };
}
