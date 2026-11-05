// Real execution data for the landing page. Nothing here is hand-authored:
// the traces come from running the algorithms below.

export const FIB_CODE_LINES = [
  'function fibonacci(n) {',
  '  if (n <= 1) return n;',
  '  return fibonacci(n - 1) + fibonacci(n - 2);',
  '}',
  'console.log(fibonacci(6));',
];

export interface TraceStep {
  line: number;
  n: number | null;
  stack: string[];
  nodeId: number;
  returned: number | null;
  output: string | null;
}

export interface CallNode {
  id: number;
  n: number;
  parent: number;
  depth: number;
  enter: number;
  exit: number;
  x: number;
  value: number;
}

function buildFibTrace(input: number) {
  const steps: TraceStep[] = [];
  const nodes: CallNode[] = [];
  const stack: string[] = [];
  let leaf = 0;

  const record = (line: number, n: number | null, nodeId: number, returned: number | null = null) => {
    steps.push({ line, n, stack: [...stack].reverse(), nodeId, returned, output: null });
  };

  const fib = (n: number, parent: number, depth: number): number => {
    const id = nodes.length;
    const node: CallNode = { id, n, parent, depth, enter: steps.length, exit: 0, x: 0, value: 0 };
    nodes.push(node);
    stack.push(`fibonacci(${n})`);
    record(1, n, id);
    record(2, n, id);

    let value: number;
    if (n <= 1) {
      value = n;
      node.x = leaf++;
    } else {
      record(3, n, id);
      const left = fib(n - 1, id, depth + 1);
      record(3, n, id, left);
      const right = fib(n - 2, id, depth + 1);
      value = left + right;
      const children = nodes.filter((c) => c.parent === id);
      node.x = (children[0].x + children[1].x) / 2;
      record(3, n, id, right);
    }

    node.value = value;
    node.exit = steps.length;
    stack.pop();
    return value;
  };

  const result = fib(input, -1, 0);
  steps.push({ line: 5, n: null, stack: [], nodeId: 0, returned: result, output: String(result) });
  return { steps, nodes, leaves: leaf };
}

export const FIB_TRACE = buildFibTrace(6);

export const BAR_VALUES = [7, 2, 11, 4, 13, 1, 9, 6, 14, 3, 10, 5, 12, 8];

export interface SortFrame {
  order: number[]; // order[slot] = bar index, where a bar's index is its rank
  moving: number;
  comparisons: number;
}

// Insertion sort, recorded one comparison at a time.
function buildInsertionSort(values: number[]): SortFrame[] {
  const ranks = [...values].sort((a, b) => a - b);
  const order = values.map((v) => ranks.indexOf(v));
  const frames: SortFrame[] = [{ order: [...order], moving: -1, comparisons: 0 }];
  let comparisons = 0;

  for (let i = 1; i < order.length; i++) {
    for (let j = i; j > 0; j--) {
      comparisons++;
      if (order[j - 1] <= order[j]) {
        frames.push({ order: [...order], moving: order[j], comparisons });
        break;
      }
      [order[j - 1], order[j]] = [order[j], order[j - 1]];
      frames.push({ order: [...order], moving: order[j - 1], comparisons });
    }
  }
  frames.push({ order: [...order], moving: -1, comparisons });
  return frames;
}

export const SORT_FRAMES = buildInsertionSort(BAR_VALUES);
