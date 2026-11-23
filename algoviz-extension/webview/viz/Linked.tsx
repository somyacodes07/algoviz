import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { TreePreview } from '@/frontend/components/visualizer/TreeVisualizer';
import type { LinkedListPreview } from '@/frontend/components/visualizer/LinkedListVisualizer';
import type { GraphPreview } from '@/frontend/components/visualizer/GraphVisualizer';
import { displayValue } from '@/frontend/components/visualizer/codeAccess';
import { valuesEqual } from '@/frontend/utils/describeStep';

// Native drawings for linked structures: trees, linked lists, graphs, hash maps, stacks, heaps.
// Everything is drawn with VS Code theme tokens (see sidebar.css, .lk-*).

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

/** Ids seen at the previous step, so new nodes can be marked. */
function useNewIds(ids: string[]) {
  const prev = useRef<Set<string> | null>(null);
  return useMemo(() => {
    const before = prev.current;
    prev.current = new Set(ids);
    return before ? new Set(ids.filter((id) => !before.has(id))) : new Set<string>();
  }, [ids.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
}

function Header({ name, kind, note }: { name: string; kind: string; note?: string }) {
  return (
    <div className="vz-head">
      <span className="vz-name">{name}</span>
      <span className="vz-type">{kind}</span>
      {note && <span className="vz-note">{note}</span>}
    </div>
  );
}

// ── Tree ──────────────────────────────────────────────────────────────────

interface Placed {
  id: string;
  label: string;
  pointers: string[];
  x: number;
  y: number;
  parent?: string;
  side?: 'L' | 'R';
}

function layoutTree(preview: TreePreview): { placed: Placed[]; cols: number; depth: number } {
  const byId = new Map(preview.nodes.map((n) => [n.id, n]));
  const placed: Placed[] = [];
  let col = 0;
  let depth = 0;
  const seen = new Set<string>();
  const visit = (id: string | undefined, d: number, parent?: string, side?: 'L' | 'R') => {
    if (!id || seen.has(id)) return;
    const node = byId.get(id);
    if (!node) return;
    seen.add(id);
    depth = Math.max(depth, d);
    const kids = node.childrenIds;
    if (kids && kids.length) {
      // n-ary: children left to right, parent centred over them.
      const start = placed.length;
      kids.forEach((k) => visit(k, d + 1, id));
      const mine = placed.slice(start).filter((p) => p.parent === id);
      const x = mine.length ? (mine[0].x + mine[mine.length - 1].x) / 2 : col++;
      placed.push({ id, label: node.label, pointers: node.pointerNames, x, y: d, parent, side });
      return;
    }
    // Binary: in-order position gives a tidy layout.
    visit(node.leftId, d + 1, id, 'L');
    placed.push({ id, label: node.label, pointers: node.pointerNames, x: col++, y: d, parent, side });
    visit(node.rightId, d + 1, id, 'R');
  };
  visit(preview.rootId, 0);
  return { placed, cols: Math.max(1, col), depth };
}

export function TreeView({ preview, title, kind = 'tree' }: { preview: TreePreview; title: string; kind?: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { placed, cols, depth } = useMemo(() => layoutTree(preview), [preview]);
  const fresh = useNewIds(placed.map((p) => `${p.id}:${p.label}`));
  const R = 14;
  const gapX = Math.max(30, Math.min(56, (width - 8) / cols));
  const gapY = 54;
  const w = Math.max(width, cols * gapX);
  const h = (depth + 1) * gapY + 18;
  const pos = new Map<string, { x: number; y: number }>(placed.map((p) => [p.id, { x: p.x * gapX + gapX / 2, y: p.y * gapY + R + 4 }]));

  return (
    <div className="vz-block">
      <Header name={title} kind={kind} note={`${placed.length} node${placed.length === 1 ? '' : 's'}${preview.truncated ? ', cut short' : ''}`} />
      <div ref={ref} className="vz-scroll">
        <svg className="lk-svg" width={w} height={h} role="img" aria-label={`${title} ${kind}`}>
          {placed.map((p) => {
            if (!p.parent) return null;
            const a = pos.get(p.parent)!;
            const b = pos.get(p.id)!;
            return <line key={`e-${p.id}`} className="lk-edge" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
          {placed.map((p) => {
            const { x, y } = pos.get(p.id)!;
            const isNew = fresh.has(`${p.id}:${p.label}`);
            const marked = p.pointers.length > 0;
            return (
              <g key={p.id} className="lk-node-g" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <circle r={R} className={`lk-node ${marked ? 'is-marked' : ''} ${isNew ? 'is-new' : ''}`} />
                <text className="lk-label" dy="0.35em" textAnchor="middle" style={{ fontSize: p.label.length > 3 ? 9 : 11 }}>
                  {p.label.length > 5 ? `${p.label.slice(0, 4)}…` : p.label}
                </text>
                {marked && (
                  <text className="lk-ptr" y={R + 12} textAnchor="middle">
                    {p.pointers.join(', ')}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/** A heap stored in an array, drawn as the tree it represents. */
export function heapAsTree(name: string, values: unknown[]): TreePreview {
  return {
    sourceName: name,
    rootId: '0',
    truncated: false,
    nodes: values.map((v, i) => ({
      id: String(i),
      label: displayValue(v),
      pointerNames: [],
      leftId: 2 * i + 1 < values.length ? String(2 * i + 1) : undefined,
      rightId: 2 * i + 2 < values.length ? String(2 * i + 2) : undefined,
    })),
  };
}

// ── Linked list ───────────────────────────────────────────────────────────

export function ListView({ preview, title }: { preview: LinkedListPreview; title: string }) {
  const fresh = useNewIds(preview.nodes.map((n) => `${n.id}:${n.label}`));
  const arrow = preview.isDoublyLinked ? '⇄' : '→';
  return (
    <div className="vz-block">
      <Header
        name={title}
        kind={preview.isDoublyLinked ? 'doubly linked list' : 'linked list'}
        note={`${preview.nodes.length} node${preview.nodes.length === 1 ? '' : 's'}${preview.cycleToIndex !== null ? ', has a cycle' : ''}`}
      />
      <div className="vz-scroll">
        <div className="lk-list">
          {preview.nodes.map((n, i) => (
            <React.Fragment key={n.id}>
              <div className="lk-item">
                <div className={`lk-box ${n.pointerNames.length ? 'is-marked' : ''} ${fresh.has(`${n.id}:${n.label}`) ? 'is-new' : ''}`}>
                  {n.label}
                </div>
                <div className="lk-tags">
                  {n.pointerNames.map((p) => (
                    <span key={p} className="vz-pointer-label">{p}</span>
                  ))}
                </div>
              </div>
              {i < preview.nodes.length - 1 && <span className="lk-arrow">{arrow}</span>}
            </React.Fragment>
          ))}
          <span className="lk-arrow">{preview.cycleToIndex !== null ? `↺ ${preview.cycleToIndex}` : '→'}</span>
          {preview.cycleToIndex === null && <span className="lk-null">{preview.truncated ? '…' : 'null'}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Graph ─────────────────────────────────────────────────────────────────

export function GraphView({
  preview,
  title,
  frontier,
  values,
  valueName,
  extraVisited,
}: {
  extraVisited?: Set<string>;
  preview: GraphPreview;
  title: string;
  frontier: Set<string>;
  values?: Record<string, string>;
  valueName?: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const n = preview.nodes.length;
  const size = Math.max(180, Math.min(width, 360));
  const R = n > 12 ? 12 : 15;
  const radius = size / 2 - R - 16;
  const pos = new Map<string, { x: number; y: number }>(
    preview.nodes.map((node, i): [string, { x: number; y: number }] => {
      const a = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
      return [node.id, { x: size / 2 + radius * Math.cos(a), y: size / 2 + radius * Math.sin(a) }];
    }),
  );
  const visitedIds = new Set(preview.nodes.filter((v) => v.visited || extraVisited?.has(v.id)).map((v) => v.id));
  const visited = visitedIds.size;
  const directed = preview.directed && preview.edges.some((e) => !e.isBidirectional);

  return (
    <div className="vz-block">
      <Header
        name={title}
        kind={directed ? 'directed graph' : 'graph'}
        note={`${n} nodes, ${preview.edges.length} edges${visited ? `, ${visited} visited` : ''}`}
      />
      <div ref={ref} className="vz-scroll">
        <svg className="lk-svg" width={size} height={size} role="img" aria-label={`${title} graph`}>
          <defs>
            <marker id="lk-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="lk-arrowhead" />
            </marker>
          </defs>
          {preview.edges.map((e, i) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            if (!a || !b) return null;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const arrow = directed && !e.isBidirectional;
            const x1 = a.x + ux * R;
            const y1 = a.y + uy * R;
            const x2 = b.x - ux * (R + (arrow ? 2 : 0));
            const y2 = b.y - uy * (R + (arrow ? 2 : 0));
            return (
              <g key={i}>
                <line className="lk-edge" x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={arrow ? 'url(#lk-arrow)' : undefined} />
                {e.weight !== undefined && (
                  <text className="lk-weight" x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 3} textAnchor="middle">
                    {e.weight}
                  </text>
                )}
              </g>
            );
          })}
          {preview.nodes.map((node) => {
            const { x, y } = pos.get(node.id)!;
            const value = values?.[node.id];
            return (
              <g key={node.id} className="lk-node-g" style={{ transform: `translate(${x}px, ${y}px)` }}>
                <circle
                  r={R}
                  className={`lk-node ${visitedIds.has(node.id) ? 'is-visited' : ''} ${frontier.has(node.id) ? 'is-frontier' : ''} ${node.pointerNames.length ? 'is-marked' : ''}`}
                />
                <text className="lk-label" dy="0.35em" textAnchor="middle">
                  {node.label.length > 4 ? `${node.label.slice(0, 3)}…` : node.label}
                </text>
                {value !== undefined && (
                  <text className="lk-ptr" y={R + 11} textAnchor="middle">
                    {value}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {(frontier.size > 0 || visited > 0 || valueName) && (
        <div className="lk-legend">
          {visited > 0 && <span><i className="lk-dot is-visited" /> visited</span>}
          {frontier.size > 0 && <span><i className="lk-dot is-frontier" /> waiting</span>}
          {valueName && <span>numbers under nodes: {valueName}</span>}
        </div>
      )}
    </div>
  );
}

// ── Hash map ──────────────────────────────────────────────────────────────

export function MapView({ name, entries, prev }: { name: string; entries: [string, unknown][]; prev?: Record<string, unknown> }) {
  return (
    <div className="vz-block">
      <Header name={name} kind="map" note={`${entries.length} key${entries.length === 1 ? '' : 's'}`} />
      <table className="lk-map">
        <tbody>
          {entries.slice(0, 60).map(([k, v]) => {
            const isNew = prev && !(k in prev);
            const changed = prev && k in prev && !valuesEqual(prev[k], v);
            return (
              <tr key={k} className={isNew ? 'is-new' : changed ? 'is-changed' : ''}>
                <td className="lk-key">{k}</td>
                <td className="lk-val">{typeof v === 'object' && v !== null ? JSON.stringify(v) : displayValue(v)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {entries.length > 60 && <div className="vz-empty">and {entries.length - 60} more</div>}
    </div>
  );
}

// ── Stack ─────────────────────────────────────────────────────────────────

export function StackView({ name, values, prev }: { name: string; values: unknown[]; prev?: unknown }) {
  const before = Array.isArray(prev) ? prev : [];
  const pushed = values.length > before.length;
  const shown = values.slice(-12).reverse();
  return (
    <div className="vz-block">
      <Header name={name} kind="stack" note={values.length ? `${values.length} item${values.length === 1 ? '' : 's'}` : 'empty'} />
      <div className="lk-stack">
        {shown.map((v, i) => (
          <div key={values.length - i} className={`lk-stack-item ${i === 0 && pushed ? 'is-new' : ''}`}>
            <span>{typeof v === 'object' && v !== null ? JSON.stringify(v) : displayValue(v)}</span>
            {i === 0 && <span className="lk-top">top</span>}
          </div>
        ))}
        {values.length > 12 && <div className="lk-more">{values.length - 12} more below</div>}
        {values.length === 0 && <div className="lk-more">empty</div>}
      </div>
    </div>
  );
}
