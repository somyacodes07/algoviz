import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { buildTreePreview } from '@/frontend/components/visualizer/TreeVisualizer';
import { buildLinkedListPreview } from '@/frontend/components/visualizer/LinkedListVisualizer';
import { buildGraphPreview } from '@/frontend/components/visualizer/GraphVisualizer';
import { GraphView, heapAsTree, ListView, MapView, StackView, TreeView } from './Linked';
import { classifyStructures, isPlainObject, readCodeHints } from '@/frontend/components/visualizer/classifyStructures';
import { accessesFor, displayValue, indexVariables, lineAccesses } from '@/frontend/components/visualizer/codeAccess';
import { valuesEqual } from '@/frontend/utils/describeStep';
import type { VariableMap, VisualizationEvent } from '@/types';

/*
 * Debugger-style drawings for the sidebar. Arrays, grids and objects that hold arrays
 * (class Queue { int data[]; int front, rear; }) are drawn here; linked structures
 * (trees, lists, graphs, heaps, hash maps) are handed to the shared visualizers.
 */

interface SceneProps {
  variables: VariableMap;
  prevVariables: VariableMap;
  events: VisualizationEvent[];
  code: string;
  line: number;
  stepIndex: number;
}

type Scalar = number | string | boolean | null;

const DELEGATED = new Set(['tree', 'list', 'graph', 'heap', 'hashmap', 'stack']);
const POINTER_FIELDS = /^(front|rear|head|tail|top|start|end|lo|hi|low|high|mid|left|right|i|j|k|l|r|p|idx|index|cur|curr|pos|ptr)$/i;

const isScalar = (v: unknown): v is Scalar => v === null || ['number', 'string', 'boolean'].includes(typeof v);
const isScalarArray = (v: unknown): v is Scalar[] => Array.isArray(v) && v.every(isScalar);
const isGrid = (v: unknown): v is Scalar[][] =>
  Array.isArray(v) && v.length > 1 && v.every((row) => isScalarArray(row) && row.length > 0);
const isNodeLike = (v: Record<string, unknown>) => '__addr' in v || 'next' in v || 'left' in v || 'right' in v || 'children' in v;

interface Pointer {
  name: string;
  value: number;
}

interface ArrayModel {
  key: string;
  owner?: string;
  name: string;
  value: Scalar[];
  prev?: unknown;
  pointers: Pointer[];
  live?: [number, number];
  // Only the first `limit` slots are drawn (int arr[100] with n = 4 in use).
  limit?: number;
}

export default function Scene({ variables, prevVariables, events, code, line, stepIndex }: SceneProps) {
  const lineText = code.split('\n')[line - 1];

  const model = useMemo(() => {
    const hints = readCodeHints(code);
    const kinds = new Map(
      classifyStructures(variables, hints)
        .filter((s) => DELEGATED.has(s.kind) && !s.name.includes('.'))
        .map((s) => [s.name, s.kind] as const),
    );
    const delegatedNames = new Set(kinds.keys());

    const ints = (scope: VariableMap) =>
      Object.entries(scope).filter((e): e is [string, number] => typeof e[1] === 'number' && Number.isInteger(e[1]));
    const topInts = ints(variables);

    const arrays: ArrayModel[] = [];
    const grids: { name: string; value: Scalar[][]; prev?: unknown; rowVars: Pointer[]; colVars: Pointer[] }[] = [];
    const objects: { name: string; scalars: [string, Scalar][]; prevScalars: Record<string, unknown>; arrays: ArrayModel[] }[] = [];
    const delegated: VariableMap = {};

    const pointersFor = (arrayName: string, len: number, scope: [string, number][], fieldScope: boolean) => {
      const usedAsIndex = new Set(indexVariables(code, arrayName)[0] || []);
      return scope
        .filter(([name, value]) => (usedAsIndex.has(name) || (fieldScope && POINTER_FIELDS.test(name))) && value >= -1 && value <= len)
        .map(([name, value]) => ({ name, value }));
    };

    for (const [name, value] of Object.entries(variables)) {
      if (name.startsWith('__')) continue;
      if (delegatedNames.has(name)) {
        delegated[name] = value;
        continue;
      }
      if (isGrid(value)) {
        const dims = indexVariables(code, name);
        const pick = (names: string[] = []) => topInts.filter(([n]) => names.includes(n)).map(([n, v]) => ({ name: n, value: v }));
        grids.push({ name, value, prev: prevVariables[name], rowVars: pick(dims[0]), colVars: pick(dims[1]) });
      } else if (isScalarArray(value) && value.length > 0) {
        // A big fixed array with a count variable (n, size, len) only uses its first n slots.
        const count = value.length > 16 ? topInts.find(([k, v]) => /^(n|m|N|size|len|length|count|num|cnt|sz)$/.test(k) && v > 0 && v < value.length) : undefined;
        const limit = count ? Math.min(value.length, count[1] + 2) : undefined;
        arrays.push({
          key: name,
          name,
          value: limit ? value.slice(0, limit) : value,
          prev: Array.isArray(prevVariables[name]) && limit ? (prevVariables[name] as unknown[]).slice(0, limit) : prevVariables[name],
          pointers: pointersFor(name, limit ?? value.length, topInts, false),
          live: count ? [0, count[1] - 1] : undefined,
          limit: limit ? value.length : undefined,
        });
      } else if (isPlainObject(value) && !isNodeLike(value)) {
        const fields = Object.entries(value).filter(([k]) => !k.startsWith('__'));
        const fieldArrays = fields.filter(([, v]) => isScalarArray(v) && (v as Scalar[]).length > 0) as [string, Scalar[]][];
        if (fieldArrays.length === 0) {
          // class LinkedList { Node* head; } — draw the linked fields themselves.
          for (const [k, v] of fields) if (isPlainObject(v) || Array.isArray(v)) delegated[`${name}.${k}`] = v;
          continue;
        }
        const scalars = fields.filter(([, v]) => isScalar(v)) as [string, Scalar][];
        const fieldInts = ints(Object.fromEntries(scalars));
        const prevObj = isPlainObject(prevVariables[name]) ? (prevVariables[name] as Record<string, unknown>) : {};
        objects.push({
          name,
          scalars,
          prevScalars: prevObj,
          arrays: fieldArrays.map(([field, arr]) => {
            const f = Object.fromEntries(fieldInts);
            let live: [number, number] | undefined;
            if ('front' in f && 'rear' in f) live = [f.front, f.rear];
            else if ('top' in f) live = [0, f.top];
            else if ('size' in f && !('capacity' in f && f.capacity === f.size)) live = [0, f.size - 1];
            else if ('count' in f) live = [0, f.count - 1];
            return {
              key: `${name}.${field}`,
              owner: name,
              name: field,
              value: arr,
              prev: prevObj[field],
              pointers: pointersFor(field, arr.length, [...fieldInts, ...topInts], true),
              live,
            };
          }),
        });
      } else if (!isScalar(value)) {
        delegated[name] = value;
      }
    }

    // Line accesses (`data[front]`) are evaluated with the object's fields in scope too.
    const scope: VariableMap = { ...variables };
    for (const o of objects) {
      const v = variables[o.name];
      if (isPlainObject(v)) Object.entries(v).forEach(([k, val]) => !(k in scope) && (scope[k] = val));
    }
    return { arrays, grids, objects, linked: buildLinked(delegated, kinds, variables, prevVariables), accesses: lineAccesses(lineText, scope) };
  }, [variables, prevVariables, code, lineText]);

  const swapEvent = events.find((e) => e.type === 'swap');
  const nothing = !model.arrays.length && !model.grids.length && !model.objects.length && !model.linked.length;

  if (nothing) {
    return <div className="vz-empty">No arrays or data structures in scope at this step. Single values are listed under Variables.</div>;
  }

  return (
    <div className="vz-scene">
      {model.objects.map((o) => (
        <div key={o.name} className="vz-object">
          <div className="vz-object-head">
            <span className="vz-name">{o.name}</span>
            <span className="vz-type">{typeName(code, o.name, line) || 'object'}</span>
          </div>
          {o.scalars.length > 0 && (
            <div className="vz-fields">
              {o.scalars.map(([k, v]) => (
                <span key={k} className={`vz-field ${!valuesEqual(v, o.prevScalars[k]) && k in o.prevScalars ? 'is-changed' : ''}`}>
                  <span className="vz-field-name">{k}</span>
                  <span className="vz-field-value">{displayValue(v)}</span>
                </span>
              ))}
            </div>
          )}
          {o.arrays.map((a) => (
            <ArrayView key={a.key} model={a} accesses={accessesFor(model.accesses, a.name)} stepIndex={stepIndex} />
          ))}
        </div>
      ))}

      {model.arrays.map((a) => (
        <ArrayView
          key={a.key}
          model={a}
          accesses={accessesFor(model.accesses, a.name)}
          stepIndex={stepIndex}
          swap={swapEvent?.variable === a.name ? swapEvent.indices : undefined}
        />
      ))}

      {model.grids.map((g) => (
        <GridView key={g.name} {...g} accesses={accessesFor(model.accesses, g.name)} stepIndex={stepIndex} />
      ))}

      {model.linked.map((item) => (
        <React.Fragment key={item.key}>{item.node}</React.Fragment>
      ))}
    </div>
  );
}

const FRONTIER = /^(queue|q|stack|st|s|pq|frontier|open|deque|dq|toVisit|bfs|dfs)$|queue$|stack$/i;
const NODE_VALUES = /^(dist|distance|cost|d|level|depth|indeg|indegree|deg|parent|par|color|low|disc)$/i;

/** Trees, lists, graphs, maps, heaps and stacks, each with its own native drawing. */
function buildLinked(
  delegated: VariableMap,
  kinds: Map<string, string>,
  variables: VariableMap,
  prevVariables: VariableMap,
): { key: string; node: React.ReactNode }[] {
  const out: { key: string; node: React.ReactNode }[] = [];
  const all = { ...variables, ...delegated };
  const lists: { name: string; preview: NonNullable<ReturnType<typeof buildLinkedListPreview>> }[] = [];
  const trees: { name: string; value: Record<string, unknown>; preview: NonNullable<ReturnType<typeof buildTreePreview>> }[] = [];
  for (const [name, value] of Object.entries(delegated)) {
    const kind = kinds.get(name);
    const prev = name.includes('.')
      ? (prevVariables[name.split('.')[0]] as Record<string, unknown> | undefined)?.[name.split('.').slice(1).join('.')]
      : prevVariables[name];

    if (kind === 'stack' && Array.isArray(value)) {
      out.push({ key: name, node: <StackView name={name} values={value} prev={prev} /> });
      continue;
    }
    if (kind === 'heap' && Array.isArray(value)) {
      out.push({ key: name, node: <TreeView preview={heapAsTree(name, value)} title={name} kind="heap" /> });
      continue;
    }
    if (isPlainObject(value) && 'next' in value) {
      const preview = buildLinkedListPreview(all, name);
      if (preview) {
        lists.push({ name, preview });
        continue;
      }
    }
    if (isPlainObject(value) && ('left' in value || 'right' in value || 'children' in value)) {
      const preview = buildTreePreview(all, name);
      if (preview) {
        trees.push({ name, value, preview });
        continue;
      }
    }
    if (kind === 'graph' || (Array.isArray(value) && value.every((r) => Array.isArray(r)))) {
      const scoped: VariableMap = { [name]: value };
      Object.entries(variables).forEach(([k, v]) => {
        if (k !== name && (!v || typeof v !== 'object' || /visited|seen|closed/i.test(k))) scoped[k] = v;
      });
      const preview = buildGraphPreview(scoped);
      if (preview) {
        const ids = new Set(preview.nodes.map((n) => n.id));
        const frontier = new Set<string>();
        let values: Record<string, string> | undefined;
        let valueName: string | undefined;
        for (const [k, v] of Object.entries(variables)) {
          if (FRONTIER.test(k) && Array.isArray(v)) v.forEach((x) => (isScalar(x) && ids.has(String(x)) ? frontier.add(String(x)) : null));
          if (!values && NODE_VALUES.test(k) && Array.isArray(v) && v.length === preview.nodes.length && v.every(isScalar)) {
            values = Object.fromEntries(v.map((x, i) => [String(i), displayValue(x)]));
            valueName = k;
          }
        }
        // visited[] as an array of booleans marks node i.
        const extraVisited = new Set<string>();
        for (const [k, v] of Object.entries(variables)) {
          if (/visited|seen|vis/i.test(k) && Array.isArray(v)) v.forEach((x, i) => (x === true || x === 1) && extraVisited.add(String(i)));
        }
        out.push({ key: name, node: <GraphView preview={preview} title={name} frontier={frontier} values={values} valueName={valueName} extraVisited={extraVisited} /> });
        continue;
      }
    }
    if (isPlainObject(value) && (kind === 'hashmap' || Object.values(value).every((v) => isScalar(v) || isScalarArray(v)))) {
      const entries = Object.entries(value).filter(([k]) => !k.startsWith('__'));
      if (entries.length) {
        out.push({ key: name, node: <MapView name={name} entries={entries} prev={isPlainObject(prev) ? prev : undefined} /> });
      }
    }
  }
  mergeLists(lists).forEach((l) => out.unshift({ key: `list-${l.name}`, node: <ListView preview={l.preview} title={l.title} /> }));
  mergeTrees(trees).forEach((t) => out.unshift({ key: `tree-${t.name}`, node: <TreeView preview={t.preview} title={t.title} /> }));
  return out;
}

type ListPreview = NonNullable<ReturnType<typeof buildLinkedListPreview>>;
type TreePreviewT = NonNullable<ReturnType<typeof buildTreePreview>>;

/**
 * `head`, `prev` and `curr` often point into the same chain. Draw each chain once and put
 * every pointer that lands in it on its node. Chains are matched by C++ node address, or
 * (for JavaScript, which has none) by a matching run of values at the end.
 */
function mergeLists(lists: { name: string; preview: ListPreview }[]) {
  const key = (p: ListPreview, i: number) => p.nodes[i].nodeAddress ?? null;
  const sorted = [...lists].sort((a, b) => b.preview.nodes.length - a.preview.nodes.length);
  const kept: { name: string; title: string; preview: ListPreview }[] = [];
  for (const item of sorted) {
    const first = item.preview.nodes[0];
    let host: (typeof kept)[number] | undefined;
    let at = -1;
    for (const k of kept) {
      if (first?.nodeAddress) {
        at = k.preview.nodes.findIndex((_, i) => key(k.preview, i) === first.nodeAddress);
      } else {
        const labels = item.preview.nodes.map((n) => n.label).join('\u0000');
        const hostLabels = k.preview.nodes.map((n) => n.label);
        at = hostLabels.findIndex((_, i) => hostLabels.slice(i).join('\u0000') === labels);
      }
      if (at >= 0) {
        host = k;
        break;
      }
    }
    if (host && at >= 0) {
      const nodes = host.preview.nodes.map((n, i) => (i === at && !n.pointerNames.includes(item.name) ? { ...n, pointerNames: [...n.pointerNames, item.name] } : n));
      host.preview = { ...host.preview, nodes };
      if (at === 0) host.title = `${host.title}, ${item.name}`;
    } else if (item.preview.nodes.length > 0) {
      kept.push({ name: item.name, title: item.name, preview: item.preview });
    }
  }
  return kept.reverse();
}

function treeAddresses(root: unknown): string[] {
  const out: string[] = [];
  const queue: unknown[] = [root];
  const seen = new Set<unknown>();
  while (queue.length && out.length < 31) {
    const node = queue.shift();
    if (!isPlainObject(node) || seen.has(node)) continue;
    seen.add(node);
    out.push(String(node.__addr ?? ''));
    if (Array.isArray(node.children)) queue.push(...node.children);
    else queue.push(node.left, node.right);
  }
  return out;
}

function mergeTrees(trees: { name: string; value: Record<string, unknown>; preview: TreePreviewT }[]) {
  const sorted = [...trees].sort((a, b) => b.preview.nodes.length - a.preview.nodes.length);
  const kept: { name: string; title: string; preview: TreePreviewT; addrs: string[] }[] = [];
  for (const item of sorted) {
    const addr = item.value.__addr !== undefined ? String(item.value.__addr) : '';
    const host = addr ? kept.find((k) => k.addrs.includes(addr)) : undefined;
    if (host) {
      const id = host.preview.nodes[host.addrs.indexOf(addr)]?.id;
      host.preview = {
        ...host.preview,
        nodes: host.preview.nodes.map((n) => (n.id === id && !n.pointerNames.includes(item.name) ? { ...n, pointerNames: [...n.pointerNames, item.name] } : n)),
      };
    } else {
      kept.push({ name: item.name, title: item.name, preview: item.preview, addrs: treeAddresses(item.value) });
    }
  }
  return kept.reverse();
}

/** `Queue q;` gives Queue for q; for `this`, the class whose body holds the current line. */
function typeName(code: string, name: string, line: number): string | undefined {
  if (name !== 'this') {
    const m = code.match(new RegExp(`([A-Za-z_][\\w:<>,\\s]*?)\\s+[*&]?${name}\\s*(?:[;({=\\[])`));
    const t = m?.[1].trim().split(/\s+/).pop();
    return t && !/^(return|else|new|delete)$/.test(t) ? t : undefined;
  }
  const lines = code.split('\n').slice(0, line);
  const stack: (string | null)[] = [];
  for (const text of lines) {
    const cls = text.match(/\b(?:class|struct)\s+([A-Za-z_]\w*)[^;]*$/)?.[1];
    for (const ch of text.replace(/\/\/.*$/, '').replace(/"(?:\\.|[^"])*"/g, '')) {
      if (ch === '{') stack.push(cls ?? null);
      else if (ch === '}') stack.pop();
    }
  }
  return [...stack].reverse().find((n) => n) ?? undefined;
}

// ── Arrays ────────────────────────────────────────────────────────────────

/** Ids that follow values when they move (swaps, shifts, pushes), so cells can glide. */
function useSlotIds(value: Scalar[]): number[] {
  const state = useRef<{ ids: number[]; prev: Scalar[]; next: number }>({ ids: [], prev: [], next: 0 });
  return useMemo(() => {
    const s = state.current;
    const fresh = () => s.next++;
    const prev = s.prev;
    let ids: number[];
    if (prev.length === 0) ids = value.map(fresh);
    else if (value.length === prev.length) {
      const diff = value.map((v, i) => (valuesEqual(v, prev[i]) ? -1 : i)).filter((i) => i >= 0);
      ids = [...s.ids];
      if (diff.length === 2 && valuesEqual(value[diff[0]], prev[diff[1]]) && valuesEqual(value[diff[1]], prev[diff[0]])) {
        [ids[diff[0]], ids[diff[1]]] = [ids[diff[1]], ids[diff[0]]];
      }
    } else if (value.length === prev.length - 1 && valuesEqual(value, prev.slice(1))) ids = s.ids.slice(1);
    else if (value.length === prev.length + 1 && valuesEqual(value.slice(1), prev)) ids = [fresh(), ...s.ids];
    else if (value.length > prev.length && valuesEqual(value.slice(0, prev.length), prev)) ids = [...s.ids, ...value.slice(prev.length).map(fresh)];
    else if (value.length < prev.length && valuesEqual(value, prev.slice(0, value.length))) ids = s.ids.slice(0, value.length);
    else ids = value.map(fresh);
    s.ids = ids;
    s.prev = value;
    return ids;
  }, [value]);
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(300);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

const GAP = 4;

interface ArrayViewProps {
  model: ArrayModel;
  accesses: { indices: number[]; write: boolean }[];
  stepIndex: number;
  swap?: [number, number];
}

const ArrayView: React.FC<ArrayViewProps> = ({ model, accesses, stepIndex, swap }) => {
  const { value, prev, pointers, live } = model;
  const ids = useSlotIds(value);
  const [ref, width] = useWidth<HTMLDivElement>();
  const n = value.length;
  const cell = Math.max(28, Math.min(52, Math.floor((width - GAP * (n - 1)) / n)));

  const prevArr = Array.isArray(prev) ? prev : undefined;
  const changed = new Set<number>();
  if (prevArr) value.forEach((v, i) => i < prevArr.length && !valuesEqual(v, prevArr[i]) && changed.add(i));
  const reads = new Set<number>();
  const writes = new Set<number>();
  accesses.forEach((a) => a.indices.length === 1 && (a.write ? writes : reads).add(a.indices[0]));
  const swapped = swap ? new Set(swap) : new Set<number>();

  const numeric = value.every((v) => typeof v === 'number');
  const nums = numeric ? (value as number[]) : [];
  const liveNums = nums.filter((_, i) => !live || (i >= live[0] && i <= live[1]));
  const max = Math.max(1, ...liveNums.map(Math.abs));
  const showBars = numeric && n >= 4 && n <= 64 && max < 1e6 && liveNums.length > 0;

  // Pointers on the same cell stack under it.
  const byIndex = new Map<number, string[]>();
  pointers.forEach((p) => byIndex.set(p.value, [...(byIndex.get(p.value) || []), p.name]));
  const rows = Math.max(0, ...Array.from(byIndex.values()).map((v) => v.length));
  const pos = (i: number) => i * (cell + GAP) + cell / 2;

  const fontSize = (text: string) => (text.length <= 3 ? 13 : text.length <= 5 ? 11 : 9.5);

  return (
    <div className="vz-block">
      <div className="vz-head">
        <span className="vz-name">{model.owner ? <span className="vz-owner">{model.owner}.</span> : null}{model.name}</span>
        <span className="vz-type">[{model.limit ?? n}]</span>
        {model.limit && <span className="vz-note">first {n} of {model.limit} shown</span>}
        {live && live[1] < live[0] && <span className="vz-note">empty</span>}
      </div>
      <div ref={ref} className="vz-scroll">
        <div className="vz-track" style={{ width: n * cell + (n - 1) * GAP }}>
          <div className="vz-cells" style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)`, gap: GAP }}>
            {value.map((v, i) => {
              const text = displayValue(v);
              const dead = live ? i < live[0] || i > live[1] : false;
              const state = writes.has(i) || changed.has(i) ? 'is-write' : reads.has(i) ? 'is-read' : '';
              return (
                <motion.div
                  key={ids[i]}
                  layout="position"
                  transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                  className={`vz-slot ${dead ? 'is-dead' : ''} ${swapped.has(i) ? 'is-swap' : ''}`}
                >
                  {showBars && (
                    <div className="vz-bar-wrap">
                      <div
                        className="vz-bar"
                        style={{ height: dead ? 0 : `${Math.max(4, (Math.abs(v as number) / max) * 100)}%` }}
                      />
                    </div>
                  )}
                  <div key={state ? `${state}-${stepIndex}` : 'idle'} className={`vz-cell ${state}`} style={{ height: cell, fontSize: fontSize(text) }} title={`${model.name}[${i}] = ${text}`}>
                    {text}
                  </div>
                  <div className="vz-index">{i}</div>
                </motion.div>
              );
            })}
          </div>
          {rows > 0 && (
            <div className="vz-pointers" style={{ height: rows * 17 + 8 }}>
              {pointers.map((p) => {
                const stack = byIndex.get(p.value)!;
                const row = stack.indexOf(p.name);
                const outside = p.value < 0 || p.value >= n;
                const x = p.value < 0 ? -cell / 2 - GAP + 6 : p.value >= n ? pos(n - 1) + cell / 2 + 4 : pos(p.value);
                return (
                  <div
                    key={p.name}
                    className={`vz-pointer ${outside ? 'is-outside' : ''}`}
                    style={{ left: x, top: row * 17 }}
                    title={`${p.name} = ${p.value}`}
                  >
                    {row === 0 && <span className="vz-caret" />}
                    <span className="vz-pointer-label">{p.name}{outside ? ` = ${p.value}` : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Grids ─────────────────────────────────────────────────────────────────

function GridView({
  name,
  value,
  prev,
  rowVars,
  colVars,
  accesses,
  stepIndex,
}: {
  name: string;
  value: Scalar[][];
  prev?: unknown;
  rowVars: Pointer[];
  colVars: Pointer[];
  accesses: { indices: number[]; write: boolean }[];
  stepIndex: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const cols = Math.max(...value.map((r) => r.length));
  const cell = Math.max(24, Math.min(40, Math.floor((width - 24) / cols) - 2));
  const prevGrid = Array.isArray(prev) ? (prev as Scalar[][]) : undefined;
  const key = (r: number, c: number) => `${r},${c}`;
  const reads = new Set<string>();
  const writes = new Set<string>();
  accesses.forEach((a) => a.indices.length === 2 && (a.write ? writes : reads).add(key(a.indices[0], a.indices[1])));
  const activeRows = new Set(rowVars.map((p) => p.value));
  const activeCols = new Set(colVars.map((p) => p.value));

  return (
    <div className="vz-block">
      <div className="vz-head">
        <span className="vz-name">{name}</span>
        <span className="vz-type">[{value.length}][{cols}]</span>
        {(rowVars.length > 0 || colVars.length > 0) && (
          <span className="vz-note">
            {rowVars.map((p) => `${p.name}=${p.value}`).concat(colVars.map((p) => `${p.name}=${p.value}`)).join('  ')}
          </span>
        )}
      </div>
      <div ref={ref} className="vz-scroll">
        <table className="vz-grid" style={{ ['--cell' as string]: `${cell}px` }}>
          <thead>
            <tr>
              <th />
              {Array.from({ length: cols }, (_, c) => (
                <th key={c} className={activeCols.has(c) ? 'is-active' : ''}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((row, r) => (
              <tr key={r}>
                <th className={activeRows.has(r) ? 'is-active' : ''}>{r}</th>
                {Array.from({ length: cols }, (_, c) => {
                  const v = row[c];
                  const changed = prevGrid && prevGrid[r] && !valuesEqual(prevGrid[r][c], v);
                  const k = key(r, c);
                  const state = writes.has(k) || changed ? 'is-write' : reads.has(k) ? 'is-read' : '';
                  const cross = activeRows.has(r) && activeCols.has(c);
                  return (
                    <td key={state ? `${c}-${state}-${stepIndex}` : c} className={`${state} ${cross ? 'is-cross' : ''}`}>
                      {v === undefined ? '' : displayValue(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
