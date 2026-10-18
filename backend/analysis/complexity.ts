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
  loopTerms: GrowthTerm[];
}

type GrowthTerm = 'n' | 'log n';

function isLoopNode(node: AstNode | null | undefined): boolean {
  return (
    !!node &&
    [
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'WhileStatement',
      'DoWhileStatement',
    ].includes(node.type)
  );
}

function isFunctionNode(node: AstNode | null | undefined): boolean {
  return (
    !!node &&
    ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)
  );
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

  if (node.type === 'UpdateExpression' && ['++', '--'].includes(String(node.operator))) {
    return false;
  }

  if (node.type === 'SequenceExpression' && Array.isArray(node.expressions)) {
    return node.expressions.some((expression) => updateLooksLogarithmic(expression as AstNode));
  }

  return false;
}

function bodyContainsGeometricMutation(
  node: AstNode | null | undefined,
  nested: boolean = false,
): boolean {
  if (!node) return false;

  if (nested && isLoopNode(node)) {
    return false;
  }

  if (
    node.type === 'AssignmentExpression' &&
    ['*=', '/=', '<<=', '>>='].includes(String(node.operator))
  ) {
    return true;
  }

  if (node.type === 'BinaryExpression' && ['*', '/'].includes(String(node.operator))) {
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
            bodyContainsGeometricMutation(child as AstNode, true),
        )
      ) {
        return true;
      }
    } else if (
      value &&
      typeof value === 'object' &&
      typeof (value as AstNode).type === 'string' &&
      bodyContainsGeometricMutation(value as AstNode, true)
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
        if (child && typeof child === 'object' && typeof (child as AstNode).type === 'string') {
          return sum + countSelfCalls(child as AstNode, functionName);
        }
        return sum;
      }, 0);
    } else if (value && typeof value === 'object' && typeof (value as AstNode).type === 'string') {
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

function formatGrowthNotation(terms: GrowthTerm[]): string {
  const nCount = terms.filter((term) => term === 'n').length;
  const logCount = terms.filter((term) => term === 'log n').length;
  const parts: string[] = [];

  if (nCount === 1) {
    parts.push('n');
  } else if (nCount > 1) {
    parts.push(`n^${nCount}`);
  }

  if (logCount === 1) {
    parts.push('log n');
  } else if (logCount > 1) {
    parts.push(`(log n)^${logCount}`);
  }

  return parts.length > 0 ? parts.join(' ') : '1';
}

function rankNotation(notation: string): number {
  if (notation === '2^n') return 1000;
  if (notation === '1') return 0;

  let score = 0;
  const nPower = notation.match(/n\^(\d+)/);
  const logPower = notation.match(/\(log n\)\^(\d+)/);

  if (nPower) {
    score += Number(nPower[1]) * 100;
  } else if (notation.includes('n')) {
    score += 100;
  }

  if (logPower) {
    score += Number(logPower[1]) * 10;
  } else if (notation.includes('log n')) {
    score += 10;
  }

  return score;
}

function buildEstimate(input: {
  maxLoopDepth: number;
  hasLogarithmicLoop: boolean;
  hasBranchingRecursion: boolean;
  recursiveFunctions: string[];
  hasArraySort: boolean;
  loopCandidates: string[];
  observedOperations: number;
  uniqueExecutedLines: number;
  peakStackDepth: number;
  hasRecursiveTreeInsertion: boolean;
}) {
  const rationale: string[] = [];
  const recursionDetected = input.recursiveFunctions.length > 0;
  const candidates = new Set<string>(input.loopCandidates);

  if (input.hasBranchingRecursion) {
    rationale.push('Detected multiple self-recursive calls in the same execution branch.');
    if (input.peakStackDepth > 2) {
      rationale.push(
        `Runtime reached ${input.peakStackDepth} stack frames, reinforcing a branching-recursion profile.`,
      );
    }
    return {
      notation: 'O(2^n)',
      confidence: 'medium' as const,
      rationale,
    };
  }

  if (input.hasArraySort) {
    candidates.add('n log n');
  }

  if (input.hasRecursiveTreeInsertion) {
    candidates.add('n^2');
    rationale.push('Repeated recursive binary-search-tree insertion is O(n²) in the worst case.');
  }

  if (recursionDetected) {
    candidates.add('n');
  }

  if (candidates.size === 0) {
    candidates.add('1');
  }

  const rankedCandidates = Array.from(candidates).sort(
    (left, right) => rankNotation(right) - rankNotation(left),
  );
  const dominant = rankedCandidates[0];
  const dominated = rankedCandidates.slice(1);

  if (dominant === '1') {
    rationale.push('No repeating loop or recursive structure dominated the analyzed source.');
    rationale.push(`Observed ${input.observedOperations} traced operations in this run.`);
    return {
      notation: 'O(1)',
      confidence: 'low' as const,
      rationale,
    };
  }

  if (dominant === 'log n') {
    rationale.push(
      'Detected a loop update that scales geometrically, such as multiplying or dividing by a constant.',
    );
  } else if (dominant === 'n') {
    rationale.push('Detected one dominant iterative or recursive pass.');
    if (recursionDetected) rationale.push(`Detected self-recursion in ${input.recursiveFunctions.join(', ')}.`);
    if (!recursionDetected) {
      rationale.pop();
      rationale.push('Detected one dominant linear traversal in the analyzed control flow.');
    }
  } else if (dominant === 'n log n') {
    rationale.push('Detected a combined linear and logarithmic growth pattern.');
  } else if (/^n\^\d+$/.test(dominant)) {
    const power = dominant.split('^')[1];
    if (!input.hasRecursiveTreeInsertion) {
      rationale.push(`Detected a polynomial loop nest with dominant power ${power}.`);
    }
  } else if (dominant.includes('log n')) {
    rationale.push(`Detected a mixed loop stack shaped like ${dominant}.`);
  }

  if (input.hasArraySort && dominant === 'n log n') {
    rationale.push('A sort-style call was detected and contributes a linearithmic signal.');
  }

  if (input.maxLoopDepth >= 2 && rankNotation(dominant) >= rankNotation('n^2')) {
    rationale.push(
      `Observed ${input.observedOperations} traced operations across ${input.uniqueExecutedLines} executed lines, with higher-order loop structure dominating weaker signals.`,
    );
  } else {
    rationale.push(
      `Observed ${input.uniqueExecutedLines} active lines over ${input.observedOperations} traced steps.`,
    );
  }

  if (dominated.length > 0) {
    rationale.push(`Other weaker signals were also detected: ${dominated.join(', ')}.`);
  }

  if (
    recursionDetected &&
    input.peakStackDepth > 2 &&
    rankNotation(dominant) <= rankNotation('n')
  ) {
    rationale.push(
      `Peak stack depth reached ${input.peakStackDepth}, which is consistent with a recursive chain in this run.`,
    );
  }

  return {
    notation: `O(${dominant})`,
    confidence:
      rankNotation(dominant) >= rankNotation('n^2')
        ? ('high' as const)
        : dominant === 'n log n' || dominant === 'log n'
          ? ('medium' as const)
          : ('medium' as const),
    rationale,
  };
}

export function analyzeComplexity(code: string, timeline: Timeline): ComplexityAnalysis {
  const hotspots = buildHotspots(timeline);
  const observedOperations = timeline.length;
  const uniqueExecutedLines = new Set(timeline.map((step) => step.line).filter((line) => line > 0))
    .size;
  const peakStackDepth = timeline.reduce(
    (maxDepth, step) => Math.max(maxDepth, step.callStack.length),
    1,
  );

  let maxLoopDepth = 0;
  let hasLogarithmicLoop = false;
  let hasBranchingRecursion = false;
  let hasArraySort = false;
  const recursiveFunctions = new Set<string>();
  const loopCandidates = new Set<string>();

  // Try Acorn-based AST analysis (works for JS, fails for C++)
  let astParsed = false;
  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 2020,
      sourceType: 'script',
    }) as unknown as AstNode;

    function walk(
      node: AstNode | null | undefined,
      parent?: AstNode,
      context: TraversalContext = {
        functionName: null,
        loopDepth: 0,
        loopTerms: [],
      },
    ) {
      if (!node) return;

      let nextContext = context;

      if (isLoopNode(node)) {
        const loopTerm: GrowthTerm =
          updateLooksLogarithmic(node.update as AstNode) ||
          bodyContainsGeometricMutation(node.body as AstNode)
            ? 'log n'
            : 'n';
        const nextLoopDepth = context.loopDepth + 1;
        maxLoopDepth = Math.max(maxLoopDepth, nextLoopDepth);
        nextContext = {
          ...context,
          loopDepth: nextLoopDepth,
          loopTerms: [...context.loopTerms, loopTerm],
        };
        loopCandidates.add(formatGrowthNotation(nextContext.loopTerms));

        if (loopTerm === 'log n') {
          hasLogarithmicLoop = true;
        }
      }

      if (isFunctionNode(node)) {
        const functionName = getFunctionName(node, parent);
        nextContext = {
          functionName,
          loopDepth: 0,
          loopTerms: [],
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
        ((node.callee?.type === 'Identifier' && node.callee.name === 'sort') ||
          (node.callee?.type === 'MemberExpression' &&
            node.callee.property?.type === 'Identifier' &&
            node.callee.property.name === 'sort'))
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
            if (child && typeof child === 'object' && typeof (child as AstNode).type === 'string') {
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
    astParsed = true;
  } catch {
    // AST parsing failed (e.g. C++ code) — fall through to timeline heuristic
  }

  // ── Timeline-based heuristic (used when AST parsing fails, i.e. for C++) ──
  if (!astParsed && timeline.length > 0) {
    // Runtime call frames are available even when the source is C++ and Acorn
    // cannot parse it. Repeated frame names in one trace reveal recursion.
    for (const step of timeline) {
      const frameCounts = new Map<string, number>();
      for (const frame of step.callStack) {
        const name = frame.split('(')[0].trim();
        if (name) {
          frameCounts.set(name, (frameCounts.get(name) || 0) + 1);
        }
      }
      for (const [name, count] of frameCounts) if (count > 1) recursiveFunctions.add(name);
    }
    const heuristic = inferComplexityFromTimeline(code);
    maxLoopDepth = heuristic.maxLoopDepth;
    hasLogarithmicLoop = heuristic.hasLogarithmicLoop;
    hasArraySort = heuristic.hasArraySort;
    for (const c of heuristic.loopCandidates) loopCandidates.add(c);
  }

  const estimate = buildEstimate({
    maxLoopDepth,
    hasLogarithmicLoop,
    hasBranchingRecursion,
    recursiveFunctions: Array.from(recursiveFunctions),
    hasArraySort,
    loopCandidates: Array.from(loopCandidates),
    observedOperations,
    uniqueExecutedLines,
    peakStackDepth,
    hasRecursiveTreeInsertion: /\b(left|right)\b/i.test(code) &&
      Array.from(recursiveFunctions).some((name) => /insert/i.test(name)),
  });

  const spaceEstimate = buildSpaceEstimate({
    peakStackDepth,
    recursiveFunctions: Array.from(recursiveFunctions),
    hasBranchingRecursion,
    timeline,
  });

  return {
    estimate,
    spaceEstimate,
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

function buildSpaceEstimate(input: {
  peakStackDepth: number;
  recursiveFunctions: string[];
  hasBranchingRecursion: boolean;
  timeline: Timeline;
}) {
  const rationale: string[] = [];
  const maxAlloc = estimateInputSize(input.timeline);

  if (input.recursiveFunctions.length > 0) {
    rationale.push(`Recursive calls use O(h) auxiliary stack space; worst-case depth is O(n) (peak observed: ${input.peakStackDepth}).`);
    return {
      notation: 'O(n)',
      confidence: 'medium' as const,
      rationale,
    };
  }

  if (maxAlloc > 50) {
    rationale.push(`Allocated dynamic heap collections scaling with input size n (${maxAlloc} items).`);
    return {
      notation: 'O(n)',
      confidence: 'medium' as const,
      rationale,
    };
  }

  rationale.push('In-place auxiliary space complexity. Uses scalar primitive variables.');
  return {
    notation: 'O(1)',
    confidence: 'high' as const,
    rationale,
  };
}

// ─── Timeline-Based Complexity Heuristic ──────────────────────────────────────
//
// When Acorn cannot parse the source (e.g. C++), inspect loop nesting in the
// source itself. A single short run is too small to infer asymptotic growth
// from line hit counts reliably.

function inferComplexityFromTimeline(
  code: string,
): {
  maxLoopDepth: number;
  hasLogarithmicLoop: boolean;
  hasArraySort: boolean;
  loopCandidates: string[];
} {
  const sanitized = code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, ' ');
  const loops: Array<{ start: number; end: number; geometric: boolean }> = [];
  const loopPattern = /\b(for|while|do)\b/g;
  let match: RegExpExecArray | null;
  while ((match = loopPattern.exec(sanitized))) {
    let bodyStart = match.index + match[0].length;
    let geometric = false;
    if (match[1] !== 'do') {
      while (/\s/.test(sanitized[bodyStart] || '')) bodyStart++;
      if (sanitized[bodyStart] !== '(') continue;
      let parens = 0;
      let headerEnd = bodyStart;
      for (; headerEnd < sanitized.length; headerEnd++) {
        if (sanitized[headerEnd] === '(') parens++;
        if (sanitized[headerEnd] === ')' && --parens === 0) break;
      }
      const header = sanitized.slice(bodyStart, headerEnd + 1);
      geometric = /(?:\*=|\/=|<<=|>>=|=\s*\w+\s*[*/]\s*\d)/.test(header);
      bodyStart = headerEnd + 1;
      while (/\s/.test(sanitized[bodyStart] || '')) bodyStart++;
    }
    if (sanitized[bodyStart] !== '{') continue;
    let braces = 0;
    let bodyEnd = bodyStart;
    for (; bodyEnd < sanitized.length; bodyEnd++) {
      if (sanitized[bodyEnd] === '{') braces++;
      if (sanitized[bodyEnd] === '}' && --braces === 0) break;
    }
    loops.push({ start: bodyStart, end: bodyEnd, geometric });
  }
  let maxLoopDepth = 0;
  for (const loop of loops) {
    const depth = loops.filter((other) => other.start <= loop.start && other.end >= loop.end).length;
    maxLoopDepth = Math.max(maxLoopDepth, depth);
  }
  const hasLogarithmicLoop = loops.some((loop) => loop.geometric);

  // Check source for sort() calls (works for both C++ and JS)
  const lowerCode = code.toLowerCase();
  const hasArraySort =
    lowerCode.includes('sort(') || lowerCode.includes('.sort(') || lowerCode.includes('sort (');

  // Build loop candidates
  const loopCandidates: string[] = [];
  const isNLogN = hasArraySort && maxLoopDepth <= 1;

  if (isNLogN) {
    loopCandidates.push('n log n');
  } else if (hasLogarithmicLoop) {
    const terms: GrowthTerm[] = [];
    for (let i = 0; i < Math.max(maxLoopDepth, 1); i++) terms.push('log n');
    loopCandidates.push(formatGrowthNotation(terms));
  } else if (maxLoopDepth > 0) {
    const terms: GrowthTerm[] = [];
    for (let i = 0; i < maxLoopDepth; i++) terms.push('n');
    loopCandidates.push(formatGrowthNotation(terms));
  }

  return { maxLoopDepth, hasLogarithmicLoop, hasArraySort, loopCandidates };
}

/**
 * Estimate the "input size" from the timeline by looking at array/vector
 * sizes in the first step's variables.
 */
function estimateInputSize(timeline: Timeline): number {
  if (timeline.length === 0) return 0;

  let maxSize = 0;

  for (const step of timeline) {
    for (const [key, value] of Object.entries(step.variables)) {
      if (Array.isArray(value)) {
        maxSize = Math.max(maxSize, value.length);
      } else if (typeof value === 'string') {
        // Wandbox returns vectors as "[1, 2, 3]" strings
        const match = value.match(/^\[.*\]$/);
        if (match) {
          const items = value
            .slice(1, -1)
            .split(',')
            .filter((s: string) => s.trim());
          maxSize = Math.max(maxSize, items.length);
        }
      } else if (value && typeof value === 'object') {
        // Count nodes for trees / linked lists / graphs
        let nodeCount = 0;
        const countNodes = (obj: any, visited = new Set()) => {
          if (!obj || typeof obj !== 'object') return;
          if (visited.has(obj)) return;
          visited.add(obj);
          nodeCount++;
          for (const k in obj) {
            countNodes(obj[k], visited);
          }
        };
        countNodes(value);
        // An object might have a few basic keys, so we subtract some noise if needed,
        // but maxSize uses the max across all objects
        maxSize = Math.max(maxSize, nodeCount);
      } else if (typeof value === 'number') {
        // If it's a numeric variable like 'n', 'size', 'length', etc.
        const lowerKey = key.toLowerCase();
        if (
          lowerKey === 'n' ||
          lowerKey === 'size' ||
          lowerKey === 'length' ||
          lowerKey === 'target'
        ) {
          maxSize = Math.max(maxSize, Math.abs(value));
        }
      }
    }
  }

  return maxSize;
}
