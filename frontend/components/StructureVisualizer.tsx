import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VariableMap, VisualizationEvent } from '../../types';
import { getThemeConfig, ThemeColor } from '../theme/theme';
import { buildLinkedListPreview, LinkedListPanel, LinkedListPreview } from './visualizer/LinkedListVisualizer';
import { buildGraphPreview, GraphAnnotations, GraphPanel, GraphPreview } from './visualizer/GraphVisualizer';
import { accessesFor, displayValue, indexVariables, lineAccesses } from './visualizer/codeAccess';
import { buildTreePreview, TreePanel, TreePreview } from './visualizer/TreeVisualizer';
import { ArrayGridVisualizer } from './visualizer/ArrayGridVisualizer';
import { HeapPanel, HeapPreview } from './visualizer/HeapVisualizer';
import { HashMapPanel, HashMapPreview } from './visualizer/HashMapVisualizer';
import { StackQueuePanel, StackQueuePreview } from './visualizer/StackQueueVisualizer';
import {
  classifyStructures,
  DetectedStructure,
  isPlainObject,
  rankStructures,
  readCodeHints,
  StructureKind,
} from './visualizer/classifyStructures';
import { DiagramModal } from './visualizer/DiagramModal';
import Controls from './Controls';
import { Network } from 'lucide-react';

export interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  canNext: boolean;
  canPrev: boolean;
  speed: number;
  setSpeed: (s: number) => void;
  progress: number;
  onSeek: (progress: number) => void;
  totalSteps: number;
  breakpointCount?: number;
}

interface StructureVisualizerProps {
  variables: VariableMap;
  prevVariables: VariableMap;
  themeColor: ThemeColor;
  currentStepIndex: number;
  arrayViewType?: 'cells' | 'bars';
  playerControlsProps?: PlayerControlsProps;
  events?: VisualizationEvent[];
  onStructureAvailabilityChange?: (available: boolean) => void;
  // Source code, used to tell how a variable is used (pushed and popped, shifted, indexed).
  code?: string;
  // Call stack depth at this step.
  callDepth?: number;
  // Source line this step stopped on.
  line?: number;
}

const MAX_PANELS = 5;
const MAX_ARRAYS = 3;

const KIND_LABEL: Record<StructureKind, string> = {
  tree: 'Tree',
  list: 'Linked list',
  graph: 'Graph',
  heap: 'Heap',
  matrix: 'Grid',
  stack: 'Stack',
  queue: 'Queue',
  hashmap: 'Hash map',
  array: 'Array',
  string: 'String',
  table: 'Table',
};

const KIND_BADGE: Partial<Record<StructureKind, string>> = {
  tree: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  list: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
  graph: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
  heap: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  stack: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
  queue: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
  hashmap: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
};

interface Shown extends DetectedStructure {
  // True when the variable is out of scope at this step and the last known version is shown.
  stale: boolean;
}

const nodeValue = (node: Record<string, unknown>) => node.val ?? node.value ?? node.data ?? node.key;

// Path (L/R steps) from `full` to a node that looks like `sub`: same value, same child values.
function findSubtree(full: unknown, sub: Record<string, unknown>, path: string[] = []): string[] | null {
  if (!isPlainObject(full)) return null;
  const same =
    nodeValue(full) === nodeValue(sub) &&
    (isPlainObject(full.left) ? nodeValue(full.left) : null) === (isPlainObject(sub.left) ? nodeValue(sub.left) : null) &&
    (isPlainObject(full.right) ? nodeValue(full.right) : null) === (isPlainObject(sub.right) ? nodeValue(sub.right) : null);
  if (same) return path;
  return findSubtree(full.left, sub, [...path, 'L']) || findSubtree(full.right, sub, [...path, 'R']);
}

function countNodes(node: unknown, seen = new Set<unknown>()): number {
  if (!isPlainObject(node) || seen.has(node)) return 0;
  seen.add(node);
  return 1 + countNodes(node.left, seen) + countNodes(node.right, seen);
}

const VALUE_NAMES = [/dist|cost/i, /^key$|^keys$/i, /deg/i, /parent|prev|pred/i, /level|depth/i, /color|colour/i, /low|disc|time/i, /rank/i];
const FRONTIER_NAME = /^(queue|q|stack|st|pq|frontier|open|deque|dq|toVisit|minHeap|heap)$|queue$|stack$/i;

// What to print on a graph's nodes: the best per-node map in scope (dist, inDegree...), and which nodes are queued.
function graphAnnotations(variables: VariableMap, graphName: string, nodeIds: string[]): GraphAnnotations {
  const ids = new Set(nodeIds);
  const indexIds = nodeIds.every((id, i) => id === String(i));
  let best: { rank: number; name: string; values: Record<string, string> } | null = null;
  let frontierName: string | undefined;
  const frontier: string[] = [];

  for (const [name, value] of Object.entries(variables)) {
    if (name === graphName || /visited|seen|closed/i.test(name)) continue;
    if (FRONTIER_NAME.test(name) && Array.isArray(value)) {
      frontierName = name;
      value.forEach((item) => {
        if (ids.has(String(item)) && !Array.isArray(item) && typeof item !== 'object') frontier.push(String(item));
        else if (Array.isArray(item)) {
          const hit = [item[1], item[0]].find((part) => (typeof part === 'string' || typeof part === 'number') && ids.has(String(part)));
          if (hit !== undefined) frontier.push(String(hit));
        } else if (isPlainObject(item)) {
          const hit = ['node', 'vertex', 'id', 'v', 'to'].map((k) => item[k]).find((part) => part !== undefined && ids.has(String(part)));
          if (hit !== undefined) frontier.push(String(hit));
        }
      });
      continue;
    }
    const rank = VALUE_NAMES.findIndex((pattern) => pattern.test(name));
    if (rank < 0 || (best && best.rank <= rank)) continue;
    let values: Record<string, string> | null = null;
    if (isPlainObject(value)) {
      const keys = Object.keys(value);
      if (keys.length > 0 && keys.filter((k) => ids.has(k)).length >= keys.length * 0.6 && keys.every((k) => scalarText(value[k]) !== null)) {
        values = Object.fromEntries(keys.filter((k) => ids.has(k)).map((k) => [k, displayValue(value[k])]));
      }
    } else if (Array.isArray(value) && indexIds && value.length === nodeIds.length && value.every((v) => typeof v === 'number' || typeof v === 'boolean' || v === null)) {
      values = Object.fromEntries(value.map((v, i) => [String(i), displayValue(v)]));
    }
    if (values) best = { rank, name, values };
  }
  return { valueName: best?.name, values: best?.values, frontierName, frontier };
}

// [{ u, v, w }, ...] as a table, with the rows the current line touches marked.
const RecordTable: React.FC<{ rows: Record<string, unknown>[]; prev?: unknown; touched: Set<number> }> = ({ rows, prev, touched }) => {
  const columns = Object.keys(rows[0] || {}).filter((k) => !k.startsWith('__'));
  const prevRows = Array.isArray(prev) ? (prev as Record<string, unknown>[]) : [];
  return (
    <div className="max-h-[320px] overflow-auto border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)]">
      <table className="w-full border-collapse font-mono text-xs">
        <thead className="sticky top-0 bg-slate-100 dark:bg-[var(--dark-surface-2)]">
          <tr>
            <th className="border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] px-2 py-1 text-left text-slate-500">#</th>
            {columns.map((column) => (
              <th key={column} className="border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] px-2 py-1 text-left font-black text-slate-800 dark:text-slate-200">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={touched.has(i) ? 'bg-orange-100 dark:bg-orange-950/40' : i % 2 ? 'bg-slate-50 dark:bg-white/[0.02]' : ''}>
              <td className="px-2 py-1 text-slate-400">{i}</td>
              {columns.map((column) => {
                const changed = prevRows[i] && prevRows[i][column] !== row[column];
                return (
                  <td key={column} className={`px-2 py-1 font-bold ${changed ? 'bg-yellow-200 text-slate-900' : 'text-slate-800 dark:text-slate-200'}`}>
                    {displayValue(row[column])}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function scalarText(value: unknown): string | null {
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (typeof value === 'string' && value !== '[Function]') return value.length > 18 ? `"${value.slice(0, 16)}…"` : `"${value}"`;
  return null;
}

/**
 * Shows one diagram per data structure in scope. Each variable is classified once
 * (see classifyStructures), so the same array never appears as a heap, a stack and an array.
 * A structure that goes out of scope (inside a helper call) keeps its last known version, marked as such.
 */
const StructureVisualizer: React.FC<StructureVisualizerProps> = ({
  variables,
  prevVariables,
  themeColor,
  currentStepIndex,
  arrayViewType = 'cells',
  playerControlsProps,
  events = [],
  onStructureAvailabilityChange,
  code = '',
  callDepth = 0,
  line,
}) => {
  const theme = getThemeConfig(themeColor);
  const [enlarged, setEnlarged] = useState<string | null>(null);
  const lastSeen = useRef(new Map<string, DetectedStructure>());
  // Recursion often passes a subtree under the same name (insert(root.left, v)), hiding the real root.
  // Remember the biggest binary tree seen so the whole tree stays on screen.
  const fullTree = useRef<{ name: string; value: Record<string, unknown>; size: number; depth: number } | null>(null);

  const hints = useMemo(() => readCodeHints(code), [code]);
  const codeLines = useMemo(() => code.split('\n'), [code]);
  const accesses = useMemo(() => lineAccesses(line ? codeLines[line - 1] : undefined, variables), [codeLines, line, variables]);
  const detected = useMemo(() => rankStructures(classifyStructures(variables, hints), variables, prevVariables), [variables, prevVariables, hints]);

  // The whole tree to draw when the tree in scope is only part of it, plus where that part sits.
  const treeContext = useMemo(() => {
    const live = detected.find((item) => item.kind === 'tree');
    const full = fullTree.current;
    if (!live || !full || currentStepIndex <= 0 || !isPlainObject(live.value)) return null;
    // Only inside deeper calls: back at the level the tree was seen at, the live tree is the truth.
    if (callDepth <= full.depth || countNodes(live.value) >= full.size) return null;
    const path = findSubtree(full.value, live.value);
    return path ? { full, path, pointer: live.name } : null;
  }, [detected, currentStepIndex, callDepth]);

  useEffect(() => {
    if (currentStepIndex <= 0) {
      lastSeen.current.clear();
      fullTree.current = null;
    }
    detected.forEach((item) => lastSeen.current.set(`${item.kind}:${item.name}`, item));
    const live = detected.find((item) => item.kind === 'tree');
    const full = fullTree.current;
    if (live && isPlainObject(live.value) && !treeContext && (!full || callDepth <= full.depth || countNodes(live.value) >= full.size)) {
      fullTree.current = { name: live.name, value: live.value, size: countNodes(live.value), depth: callDepth };
    }
  }, [currentStepIndex, detected, treeContext, callDepth]);

  const shown: Shown[] = useMemo(() => {
    const now: Shown[] = detected.map((item) => ({ ...item, stale: false }));
    if (currentStepIndex > 0) {
      const present = new Set(detected.map((item) => (item.kind === 'tree' || item.kind === 'list' ? item.kind : `${item.kind}:${item.name}`)));
      const liveRoots = detected.filter((item) => item.kind === 'tree' || item.kind === 'list').length;
      lastSeen.current.forEach((item, key) => {
        const slot = item.kind === 'tree' || item.kind === 'list' ? item.kind : key;
        const rootName = item.name.split('.')[0];
        // A tree or list is only shown stale when none is in scope at all.
        if (!present.has(slot) && !(rootName in variables) && !(slot === item.kind && liveRoots > 0)) now.push({ ...item, stale: true });
      });
    }
    let arrays = 0;
    return now
      .filter((item) => {
        if (item.kind !== 'array' && item.kind !== 'string') return true;
        arrays++;
        return arrays <= MAX_ARRAYS;
      })
      .slice(0, MAX_PANELS);
    // lastSeen is read on purpose: it only changes together with `detected`.
  }, [detected, variables, currentStepIndex]);

  // Synthetic names like `minHeap.heap` and stale values need to be visible to the per-variable panels.
  const displayVars = useMemo(() => {
    const merged: VariableMap = { ...variables };
    shown.forEach((item) => {
      if (!(item.name in merged)) merged[item.name] = item.value;
    });
    return merged;
  }, [variables, shown]);

  const hasStructure = shown.length > 0;
  useEffect(() => {
    onStructureAvailabilityChange?.(hasStructure);
  }, [hasStructure, onStructureAvailabilityChange]);

  const scalars = useMemo(
    () =>
      Object.entries(variables)
        .filter(([name]) => !name.startsWith('__'))
        .map(([name, value]) => ({ name, text: scalarText(value), changed: prevVariables[name] !== value }))
        .filter((entry): entry is { name: string; text: string; changed: boolean } => entry.text !== null)
        .slice(0, 12),
    [variables, prevVariables],
  );

  const renderPanel = (item: Shown, inModal = false) => {
    const onEnlarge = inModal ? undefined : () => setEnlarged(`${item.kind}:${item.name}`);
    switch (item.kind) {
      case 'tree': {
        if (!item.stale && treeContext) {
          // Draw the remembered whole tree and mark the subtree the current call is working on.
          const preview = buildTreePreview({ [treeContext.full.name]: treeContext.full.value }, treeContext.full.name);
          if (preview) {
            const byId = new Map(preview.nodes.map((node) => [node.id, node]));
            let node = byId.get(preview.rootId);
            for (const step of treeContext.path) node = byId.get((step === 'L' ? node?.leftId : node?.rightId) || '');
            const marked = preview.nodes.map((n) => (n === node ? { ...n, pointerNames: [...n.pointerNames, treeContext.pointer] } : n));
            return <TreePanel preview={{ ...preview, nodes: marked }} themeColor={themeColor} onEnlarge={onEnlarge} />;
          }
        }
        const preview: TreePreview | null = item.stale ? buildTreePreview({ [item.name]: item.value }, item.name) : buildTreePreview({ ...variables, [item.name]: item.value }, item.name);
        return preview && <TreePanel preview={preview} themeColor={themeColor} onEnlarge={onEnlarge} />;
      }
      case 'list': {
        const preview: LinkedListPreview | null = item.stale ? buildLinkedListPreview({ [item.name]: item.value }, item.name) : buildLinkedListPreview({ ...variables, [item.name]: item.value }, item.name);
        return preview && <LinkedListPanel preview={preview} themeColor={themeColor} onEnlarge={onEnlarge} />;
      }
      case 'graph': {
        // Only this variable may be the graph; scalars and visited sets still mark nodes.
        const scoped: VariableMap = { [item.name]: item.value };
        Object.entries(variables).forEach(([name, value]) => {
          if (name !== item.name && (!value || typeof value !== 'object' || /visited|seen|closed/i.test(name))) scoped[name] = value;
        });
        const preview: GraphPreview | null = buildGraphPreview(scoped);
        if (!preview) return null;
        const annotations = graphAnnotations(variables, item.name, preview.nodes.map((node) => node.id));
        return <GraphPanel preview={preview} themeColor={themeColor} onEnlarge={onEnlarge} annotations={annotations} />;
      }
      case 'heap': {
        const preview: HeapPreview = { sourceName: item.name, value: item.value as number[], isMinHeap: item.isMinHeap !== false };
        return <HeapPanel preview={preview} themeColor={themeColor} onEnlarge={onEnlarge} />;
      }
      case 'stack':
      case 'queue': {
        const preview: StackQueuePreview = { sourceName: item.name, value: item.value as unknown[], type: item.kind, isPriority: item.isPriority };
        return <StackQueuePanel preview={preview} themeColor={themeColor} onEnlarge={onEnlarge} />;
      }
      case 'hashmap': {
        const source = item.value instanceof Map ? Array.from(item.value.entries()).map(([k, v]) => [String(k), v] as [string, unknown]) : isPlainObject(item.value) ? Object.entries(item.value) : [];
        const preview: HashMapPreview = { sourceName: item.name, entries: source.filter(([k]) => !k.startsWith('__')).slice(0, 24), isMap: item.value instanceof Map };
        return <HashMapPanel preview={preview} themeColor={themeColor} prevVariables={prevVariables} onEnlarge={onEnlarge} />;
      }
      case 'table': {
        const touched = new Set(accessesFor(accesses, item.name).filter((a) => a.indices.length >= 1).map((a) => a.indices[0]));
        return <RecordTable rows={item.value as Record<string, unknown>[]} prev={prevVariables[item.name]} touched={touched} />;
      }
      default: {
        // DP over two strings (LCS, edit distance): label rows and columns with their characters.
        let rowLabels: string[] | undefined;
        let colLabels: string[] | undefined;
        if (item.kind === 'matrix' && Array.isArray(item.value)) {
          const rows = item.value.length;
          const cols = Array.isArray(item.value[0]) ? item.value[0].length : 0;
          const strings = Object.values(variables).filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length <= 40);
          const forRows = strings.find((str) => str.length + 1 === rows) || strings.find((str) => str.length === rows);
          const forCols = strings.find((str) => str !== forRows && (str.length + 1 === cols || str.length === cols)) || (forRows && (forRows.length + 1 === cols || forRows.length === cols) ? forRows : undefined);
          if (forRows && forCols) {
            rowLabels = forRows.length + 1 === rows ? ['', ...forRows] : forRows.split('');
            colLabels = forCols.length + 1 === cols ? ['', ...forCols] : forCols.split('');
          }
        }
        return (
          <ArrayGridVisualizer
            variables={displayVars}
            prevVariables={prevVariables}
            themeColor={themeColor}
            arrayViewType={arrayViewType}
            events={events}
            sourceName={item.name}
            onEnlarge={onEnlarge}
            accesses={accessesFor(accesses, item.name)}
            indexVars={code ? indexVariables(code, item.name) : undefined}
            rowLabels={rowLabels}
            colLabels={colLabels}
          />
        );
      }
    }
  };

  const scalarStrip = scalars.length > 0 && (
    <div className="flex flex-wrap gap-1.5" aria-label="Values in scope">
      {scalars.map((entry) => (
        <span
          key={entry.name}
          className={`inline-flex items-baseline gap-1 border-[2px] px-1.5 py-0.5 font-mono text-[11px] ${
            entry.changed
              ? 'border-slate-900 bg-yellow-300 text-slate-900 dark:border-yellow-500'
              : 'border-slate-300 bg-white text-slate-700 dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface-2)] dark:text-slate-300'
          }`}
        >
          <span className="font-bold">{entry.name}</span>
          <span>{entry.text}</span>
        </span>
      ))}
    </div>
  );

  if (!hasStructure) {
    return (
      <div className="flex h-full flex-col gap-3">
        {currentStepIndex >= 0 && scalarStrip}
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 border-[2px] border-dashed border-slate-400 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface)]">
          <span className={`border px-2 py-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${theme.badgeClass}`}>
            <Network size={12} />
            Visualizer
          </span>
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400 text-center">
            {currentStepIndex < 0 ? 'Run your code to draw its data structures.' : 'No data structure in scope at this step.'}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-500 max-w-[260px] text-center">
            Arrays, strings, stacks, queues, heaps, hash maps, linked lists, trees and graphs appear here as your code runs.
          </span>
        </div>
      </div>
    );
  }

  const enlargedItem = shown.find((item) => `${item.kind}:${item.name}` === enlarged) || null;

  return (
    <div className="grid grid-cols-1 gap-4">
      {scalarStrip}
      {shown.map((item) => {
        const label = item.kind === 'heap' ? `${item.isMinHeap === false ? 'Max' : 'Min'} heap` : item.kind === 'queue' && item.isPriority ? 'Priority queue' : KIND_LABEL[item.kind];
        return (
          <div key={`${item.kind}:${item.name}`} className={`flex flex-col gap-1 ${item.stale ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-2 px-1">
              <span
                className={`text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] shadow-[1px_1px_0_#0f172a] ${KIND_BADGE[item.kind] || theme.badgeClass}`}
              >
                {label}
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
              {item.stale && <span className="text-[11px] font-semibold text-slate-500">Out of scope, last known value</span>}
            </div>
            {renderPanel(item)}
          </div>
        );
      })}

      <DiagramModal
        isOpen={enlargedItem !== null}
        onClose={() => setEnlarged(null)}
        title={enlargedItem ? `${KIND_LABEL[enlargedItem.kind]}: ${enlargedItem.name}` : ''}
        themeColor={themeColor}
        playerControls={
          playerControlsProps && (
            <Controls
              isPlaying={playerControlsProps.isPlaying}
              onPlayPause={playerControlsProps.onPlayPause}
              onNext={playerControlsProps.onNext}
              onPrev={playerControlsProps.onPrev}
              onReset={playerControlsProps.onReset}
              canNext={playerControlsProps.canNext}
              canPrev={playerControlsProps.canPrev}
              speed={playerControlsProps.speed}
              setSpeed={playerControlsProps.setSpeed}
              progress={playerControlsProps.progress}
              onSeek={playerControlsProps.onSeek}
              themeColor={themeColor}
              currentStep={currentStepIndex}
              totalSteps={playerControlsProps.totalSteps}
              breakpointCount={playerControlsProps.breakpointCount}
            />
          )
        }
      >
        <div className="w-full p-2">{enlargedItem && renderPanel(enlargedItem, true)}</div>
      </DiagramModal>
    </div>
  );
};

export default StructureVisualizer;
