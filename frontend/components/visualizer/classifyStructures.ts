import { VariableMap } from '../../../types';

// Decides, for each variable in a step, which single diagram it belongs in. Shape comes first;
// names and how the code uses a variable only break ties. Before this, every visualizer guessed on
// its own from variable names, so one array could show as a heap, a stack and an array at once.

export type StructureKind = 'tree' | 'list' | 'graph' | 'heap' | 'matrix' | 'stack' | 'queue' | 'hashmap' | 'array' | 'string' | 'table';

export interface DetectedStructure {
  // A variable name, or `owner.field` for a container kept inside an object (class-based heaps and stacks).
  name: string;
  kind: StructureKind;
  value: unknown;
  // Heaps: true when the values satisfy the min-heap order better than the max-heap order.
  isMinHeap?: boolean;
  // Queues that are really priority queues (named pq / heap, or C++ priority_queue).
  isPriority?: boolean;
}

export interface CodeHints {
  popped: Set<string>;
  shifted: Set<string>;
  pushed: Set<string>;
  indexed: Set<string>;
  heapOps: boolean;
  declared: Map<string, 'stack' | 'queue' | 'priority' | 'map'>;
}

const HEAP_NAME = /^(min|max)?_?heap$|heap$|^pq$|^priority_?queue$|^minh$|^maxh$/i;
const PRIORITY_NAME = /^pq$|priority|heap/i;
const STACK_NAME = /^(stack|stk|st)$|stack$/i;
const QUEUE_NAME = /^(queue|q|deque|dq)$|queue$/i;
const GRAPH_NAME = /graph|^adj|adjacency|neighbo/i;
const NOT_GRAPH_NAME = /grid|matrix|board|table|dp|memo|nums|arr|mat$/i;

const IDENT = '([A-Za-z_$][\\w$]*)';

export function readCodeHints(code = ''): CodeHints {
  const popped = new Set<string>();
  const shifted = new Set<string>();
  const pushed = new Set<string>();
  const indexed = new Set<string>();
  const declared = new Map<string, 'stack' | 'queue' | 'priority' | 'map'>();

  for (const match of code.matchAll(new RegExp(`${IDENT}\\s*\\.\\s*(push_back|push_front|pop_back|pop_front|push|pop|shift|unshift|top|front|emplace)\\s*\\(`, 'g'))) {
    const [, name, method] = match;
    if (method === 'pop' || method === 'pop_back' || method === 'top') popped.add(name);
    if (method === 'shift' || method === 'pop_front' || method === 'front') shifted.add(name);
    if (method.startsWith('push') || method === 'unshift' || method === 'emplace') pushed.add(name);
  }
  for (const match of code.matchAll(new RegExp(`${IDENT}\\s*(?:\\[|\\.charAt\\(|\\.at\\(|\\.substring\\(|\\.slice\\()`, 'g'))) {
    indexed.add(match[1]);
  }
  // C++ declarations name the container outright.
  // Template arguments can nest (priority_queue<pair<int,int>, vector<...>, greater<...>>), so match brackets by hand.
  for (const match of code.matchAll(/\b(?:std::)?(stack|queue|deque|priority_queue|unordered_map|map)\s*</g)) {
    let depth = 0;
    let i = (match.index ?? 0) + match[0].length - 1;
    for (; i < code.length; i++) {
      if (code[i] === '<') depth++;
      else if (code[i] === '>' && --depth === 0) break;
    }
    const name = code.slice(i + 1).match(/^\s*&?\s*([A-Za-z_]\w*)/)?.[1];
    const type = match[1];
    if (name) declared.set(name, type === 'stack' ? 'stack' : type === 'priority_queue' ? 'priority' : type.endsWith('map') ? 'map' : 'queue');
  }

  return {
    popped,
    shifted,
    pushed,
    indexed,
    heapOps: /heapify|sift_?(up|down)|bubble_?(up|down)|sink_?down|\bswim\b|percolate|priority_queue|min_?heap|max_?heap/i.test(code),
    declared,
  };
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Set) && !(value instanceof Map);
}

const isPrimitive = (value: unknown) => value === null || ['number', 'string', 'boolean'].includes(typeof value);

export function isTreeNode(value: unknown): value is Record<string, unknown> {
  if (!isPlainObject(value)) return false;
  if ('left' in value || 'right' in value || Array.isArray(value.children)) return true;
  // Tries: children is a map from character to child node.
  const children = value.children;
  return isPlainObject(children) && Object.values(children).every(isPlainObject);
}

// Nodes reachable from a tree or list root. C++ nodes arrive as copies, so they are keyed by address.
function reachable(value: unknown): Set<unknown> {
  const seen = new Set<unknown>();
  const keys = new Set<unknown>();
  const queue = [value];
  while (queue.length && seen.size < 200) {
    const node = queue.shift();
    if (!isPlainObject(node) || seen.has(node)) continue;
    seen.add(node);
    keys.add(node.__addr !== undefined ? `addr:${String(node.__addr)}` : node);
    ['left', 'right', 'next'].forEach((key) => queue.push(node[key]));
    const children = node.children;
    if (Array.isArray(children)) queue.push(...children);
    else if (isPlainObject(children)) queue.push(...Object.values(children));
  }
  return keys;
}

const nodeKey = (value: unknown) =>
  isPlainObject(value) && value.__addr !== undefined ? `addr:${String(value.__addr)}` : value;

export function isListNode(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && 'next' in value && !('left' in value) && !('right' in value);
}

function isRectangularGrid(value: unknown[]): boolean {
  if (value.length === 0 || !Array.isArray(value[0])) return false;
  const cols = (value[0] as unknown[]).length;
  if (cols === 0) return false;
  return value.every((row) => Array.isArray(row) && row.length === cols && row.every(isPrimitive));
}

// Graphs: an adjacency map whose neighbours are its own keys, or an index-based adjacency list.
export function isGraphShape(name: string, value: unknown): boolean {
  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0 || keys.length > 40) return false;
    let links = 0;
    let known = 0;
    for (const key of keys) {
      const neighbors = value[key];
      if (Array.isArray(neighbors)) {
        if (!neighbors.every((n) => typeof n === 'string' || typeof n === 'number')) return false;
        neighbors.forEach((n) => {
          links++;
          if (String(n) in value) known++;
        });
      } else if (isPlainObject(neighbors)) {
        Object.entries(neighbors).forEach(([n, weight]) => {
          if (typeof weight !== 'number' && typeof weight !== 'string') return;
          links++;
          if (n in value) known++;
        });
      } else {
        return false;
      }
    }
    // Most neighbours must be nodes of the same map, or the name must say graph.
    return links > 0 && (known / links >= 0.6 || GRAPH_NAME.test(name));
  }
  if (Array.isArray(value) && value.length > 0 && value.length <= 40 && value.every(Array.isArray)) {
    const rows = value as unknown[][];
    if (NOT_GRAPH_NAME.test(name)) return false;
    const square = rows.every((row) => row.length === rows.length);
    const binary = rows.every((row) => row.every((cell) => cell === 0 || cell === 1 || typeof cell === 'boolean'));
    if (square && binary) return GRAPH_NAME.test(name);
    // Weighted adjacency matrix: square, numeric, zero diagonal, named like a graph.
    if (square && GRAPH_NAME.test(name) && rows.every((row, i) => row.every((cell) => typeof cell === 'number') && row[i] === 0)) return true;
    const isNode = (cell: unknown) => Number.isInteger(cell) && (cell as number) >= 0 && (cell as number) < rows.length;
    // Plain neighbour indexes, or weighted [to, weight] pairs.
    const indexList = rows.every((row) => row.every((cell) => isNode(cell) || (Array.isArray(cell) && cell.length === 2 && isNode(cell[0]) && typeof cell[1] === 'number')));
    const ragged = rows.some((row) => row.length !== rows[0].length) || rows.some((row) => row.some(Array.isArray));
    return indexList && (ragged || GRAPH_NAME.test(name));
  }
  return false;
}

// Same keys on every item, primitive values: [{ u, v, w }, ...] or [{ name, start, finish }, ...].
export function isRecordList(value: unknown[]): boolean {
  if (value.length === 0 || !value.every(isPlainObject)) return false;
  const keys = Object.keys(value[0] as object).filter((k) => !k.startsWith('__')).sort().join(',');
  return keys.length > 0 && value.every((item) => {
    const record = item as Record<string, unknown>;
    return Object.keys(record).filter((k) => !k.startsWith('__')).sort().join(',') === keys && Object.values(record).every(isPrimitive);
  });
}

export function heapOrder(values: number[]): 'min' | 'max' {
  let minBreaks = 0;
  let maxBreaks = 0;
  for (let i = 1; i < values.length; i++) {
    const parent = values[Math.floor((i - 1) / 2)];
    if (parent > values[i]) minBreaks++;
    if (parent < values[i]) maxBreaks++;
  }
  return minBreaks <= maxBreaks ? 'min' : 'max';
}

export function classifyStructures(variables: VariableMap, hints: CodeHints): DetectedStructure[] {
  const found: DetectedStructure[] = [];

  // Class instances snapshot as plain objects ({ s1: [], s2: [] }, { root: TrieNode }, { cache: Map }).
  // Look one level inside for the containers and nodes they hold. `key` is the name the code uses
  // (`this.s1.push`), `name` is the label shown.
  const entries: { name: string; key: string; value: unknown }[] = [];
  const forced = new Map<string, 'heap' | 'stack' | 'queue'>();
  for (const [name, value] of Object.entries(variables)) {
    entries.push({ name, key: name, value });
    if (!isPlainObject(value) || isTreeNode(value) || isListNode(value) || isGraphShape(name, value)) continue;
    const fields = Object.entries(value).filter(
      ([, v]) => Array.isArray(v) || v instanceof Map || isTreeNode(v) || isListNode(v),
    );
    if (fields.length === 0 || fields.length > 4) continue;
    const arrays = fields.filter(([, v]) => Array.isArray(v));
    for (const [field, inner] of fields) {
      const label = `${name}.${field}`;
      entries.push({ name: label, key: field, value: inner });
      if (Array.isArray(inner) && arrays.length === 1) {
        const owner = HEAP_NAME.test(name) || HEAP_NAME.test(field) ? 'heap' : STACK_NAME.test(name) ? 'stack' : QUEUE_NAME.test(name) ? 'queue' : null;
        if (owner) forced.set(label, owner);
      }
    }
  }

  const treeCandidates: { name: string; value: unknown; nodes: Set<unknown> }[] = [];
  const listCandidates: { name: string; value: unknown; nodes: Set<unknown> }[] = [];

  for (const { name, key, value } of entries) {
    if (name.startsWith('__')) continue;
    const declared = hints.declared.get(key);

    if (typeof value === 'string') {
      if (value.length >= 2 && value.length <= 64 && hints.indexed.has(key)) found.push({ name, kind: 'string', value });
      continue;
    }

    if (value instanceof Map) {
      if (value.size > 0) found.push({ name, kind: 'hashmap', value });
      continue;
    }

    if (Array.isArray(value)) {
      const owner = forced.get(name);
      if (owner === 'heap' && value.length > 0 && value.every((v) => typeof v === 'number')) {
        found.push({ name, kind: 'heap', isMinHeap: heapOrder(value as number[]) === 'min', value });
        continue;
      }
      if (owner === 'stack' || owner === 'queue') {
        found.push({ name, kind: owner, value });
        continue;
      }
      if (declared === 'priority' && value.length > 0 && value.every((v) => typeof v === 'number')) {
        found.push({ name, kind: 'heap', isMinHeap: heapOrder(value as number[]) === 'min', value });
        continue;
      }
      const priority = declared === 'priority' || (PRIORITY_NAME.test(key) && !value.every((v) => typeof v === 'number'));
      if (declared === 'stack' || (declared !== 'queue' && !priority && STACK_NAME.test(key))) {
        found.push({ name, kind: 'stack', value });
        continue;
      }
      if (declared === 'queue' || priority || QUEUE_NAME.test(key)) {
        found.push({ name, kind: 'queue', isPriority: priority, value });
        continue;
      }
      if (value.length === 0) continue;

      const numeric = value.every((v) => typeof v === 'number');
      if (numeric && value.length >= 2 && (HEAP_NAME.test(key) || (hints.heapOps && hints.indexed.has(key) && hints.pushed.has(key)))) {
        found.push({ name, kind: 'heap', isMinHeap: heapOrder(value as number[]) === 'min', value });
        continue;
      }
      if (isGraphShape(key, value)) {
        found.push({ name, kind: 'graph', value });
        continue;
      }
      if (isRectangularGrid(value)) {
        found.push({ name, kind: 'matrix', value });
        continue;
      }
      if (value.every(isPrimitive)) {
        // Pushed and popped but never shifted: it is being used as a stack (DFS, backtracking, parentheses).
        const usedAsStack = hints.popped.has(key) && hints.pushed.has(key) && !hints.shifted.has(key);
        const usedAsQueue = hints.shifted.has(key) && hints.pushed.has(key);
        found.push({ name, kind: usedAsQueue ? 'queue' : usedAsStack ? 'stack' : 'array', value });
        continue;
      }
      // Arrays of nodes or pairs only make sense as a stack or queue.
      if (hints.shifted.has(key)) found.push({ name, kind: 'queue', value });
      else if (hints.popped.has(key)) found.push({ name, kind: 'stack', value });
      else if (isRecordList(value)) found.push({ name, kind: 'table', value });
      continue;
    }

    if (isPlainObject(value)) {
      if (isTreeNode(value)) {
        treeCandidates.push({ name, value, nodes: reachable(value) });
        continue;
      }
      if (isListNode(value)) {
        listCandidates.push({ name, value, nodes: reachable(value) });
        continue;
      }
      if (isGraphShape(key, value)) {
        found.push({ name, kind: 'graph', value });
        continue;
      }
      const keys = Object.keys(value).filter((key) => !key.startsWith('__'));
      // An empty container shell ({ head: null, tail: null, size: 0 }) is not a hash map.
      const shell = keys.some((k) => value[k] === null && /^(head|tail|root|top|front|rear|next|prev|left|right)$/.test(k));
      if (!shell && keys.length > 0 && keys.every((key) => isPrimitive(value[key]))) {
        found.push({ name, kind: 'hashmap', value });
      }
    }
  }

  // Biggest roots first, so a pointer like `node` or `next` never wins over the structure it points into.
  // A second root is kept only when it is a separate structure, like `prev` and `curr` mid-reversal.
  const pickRoots = (candidates: typeof treeCandidates, prefer: RegExp, kind: 'tree' | 'list') => {
    const covered = new Set<unknown>();
    let kept = 0;
    candidates
      .sort((a, b) => b.nodes.size + (prefer.test(b.name) ? 0.5 : 0) - (a.nodes.size + (prefer.test(a.name) ? 0.5 : 0)))
      .forEach((candidate) => {
        if (kept >= 2 || covered.has(nodeKey(candidate.value))) return;
        candidate.nodes.forEach((node) => covered.add(node));
        found.push({ name: candidate.name, kind, value: candidate.value });
        kept++;
      });
  };
  pickRoots(treeCandidates, /root|tree|trie/i, 'tree');
  pickRoots(listCandidates, /head|list|^l\d$/i, 'list');

  return found;
}

const KIND_ORDER: StructureKind[] = ['tree', 'list', 'graph', 'heap', 'matrix', 'stack', 'queue', 'array', 'string', 'table', 'hashmap'];

// Most important first: linked structures, then whatever changed in this step.
export function rankStructures(found: DetectedStructure[], variables: VariableMap, prevVariables: VariableMap): DetectedStructure[] {
  const changed = (name: string) => {
    try {
      return JSON.stringify(variables[name]) !== JSON.stringify(prevVariables[name]);
    } catch {
      return false;
    }
  };
  return [...found].sort((a, b) => {
    const order = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
    if (order !== 0) return order;
    return Number(changed(b.name)) - Number(changed(a.name));
  });
}
