import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch } from 'lucide-react';
import { VariableMap } from '../../../types';
import { getThemeConfig, ThemeColor } from '../../theme/theme';

export interface TreeNodeView {
  id: string;
  label: string;
  pointerNames: string[];
  leftId?: string;
  rightId?: string;
  childrenIds?: string[];
}

export interface TreePreview {
  sourceName: string;
  nodes: TreeNodeView[];
  rootId: string;
  truncated: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Set) &&
    !(value instanceof Map)
  );
}

function getNodeLabel(value: Record<string, unknown>, fallbackIndex: number): string {
  const candidates = ['val', 'value', 'id', 'label', 'name', 'key', 'data'];
  for (const candidate of candidates) {
    const current = value[candidate];
    if (typeof current === 'string' || typeof current === 'number') {
      return String(current);
    }
  }
  return `N${fallbackIndex}`;
}

export function buildTreePreview(variables: VariableMap): TreePreview | null {
  const entries = Object.entries(variables).filter(
    ([, value]) =>
      isPlainObject(value) && ('left' in value || 'right' in value || 'children' in value),
  );

  if (entries.length === 0) return null;

  let bestPreview: (TreePreview & { score: number }) | null = null;

  for (const [sourceName, startNode] of entries) {
    const nodes: TreeNodeView[] = [];
    let truncated = false;

    // Phase 1: BFS to collect nodes (cycle-safe via WeakMap)
    const objToId = new WeakMap<object, string>();

    // Pending links: parent-id → { left?: obj, right?: obj, children?: obj[] }
    const pendingLinks: { parentId: string; left?: object; right?: object; children?: object[] }[] =
      [];

    const bfsQueue: Record<string, unknown>[] = [startNode as Record<string, unknown>];
    let qi = 0;

    while (qi < bfsQueue.length) {
      if (nodes.length >= 31) {
        truncated = true;
        break;
      }

      const current = bfsQueue[qi++];

      // Cycle protection
      if (objToId.has(current)) continue;

      const nodeId = `${sourceName}-${nodes.length}`;
      objToId.set(current, nodeId);

      nodes.push({
        id: nodeId,
        label: getNodeLabel(current, nodes.length),
        pointerNames: [],
      });

      const link: (typeof pendingLinks)[0] = { parentId: nodeId };

      if (isPlainObject(current.left) && !objToId.has(current.left)) {
        bfsQueue.push(current.left as Record<string, unknown>);
        link.left = current.left;
      }
      if (isPlainObject(current.right) && !objToId.has(current.right)) {
        bfsQueue.push(current.right as Record<string, unknown>);
        link.right = current.right;
      }
      if (Array.isArray(current.children)) {
        link.children = [];
        for (const child of current.children) {
          if (isPlainObject(child) && !objToId.has(child)) {
            bfsQueue.push(child as Record<string, unknown>);
            link.children.push(child);
          }
        }
      }

      pendingLinks.push(link);
    }

    // Phase 2: Resolve object references → node IDs
    const nodeMap = new Map<string, TreeNodeView>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    for (const link of pendingLinks) {
      const parent = nodeMap.get(link.parentId);
      if (!parent) continue;

      if (link.left) parent.leftId = objToId.get(link.left);
      if (link.right) parent.rightId = objToId.get(link.right);
      if (link.children && link.children.length > 0) {
        parent.childrenIds = link.children
          .map((c) => objToId.get(c))
          .filter((id): id is string => !!id);
      }
    }

    if (nodes.length === 0) continue;

    for (const [name, value] of Object.entries(variables)) {
      if (value && typeof value === 'object') {
        const mappedId = objToId.get(value as object);
        if (mappedId !== undefined) {
          const node = nodeMap.get(mappedId);
          if (node) node.pointerNames.push(name);
        }
      }
    }

    const score = nodes.length * 10 + (/root|tree/i.test(sourceName) ? 20 : 0);
    const preview = { sourceName, nodes, rootId: nodes[0].id, truncated, score };

    if (!bestPreview || preview.score > bestPreview.score) {
      bestPreview = preview;
    }
  }

  if (!bestPreview || bestPreview.nodes.length < 1) return null;
  const { score: _score, ...preview } = bestPreview;
  return preview;
}

// ─── Layout helpers ────────────────────────────────────────────────────────────

interface LayoutPos {
  x: number;
  y: number;
}

function computeTreeLayout(preview: TreePreview) {
  const positions = new Map<string, LayoutPos>();
  const nodeById = new Map<string, TreeNodeView>();
  preview.nodes.forEach((n) => nodeById.set(n.id, n));

  const NODE_W = 56;
  const LEVEL_H = 88;
  const TOP_PAD = 56; // Extra room for pointer tags above root

  const depths = new Map<string, number>();
  let maxDepth = 0;

  const assignDepth = (id: string, d: number) => {
    depths.set(id, d);
    maxDepth = Math.max(maxDepth, d);
    const node = nodeById.get(id);
    if (!node) return;
    if (node.leftId) assignDepth(node.leftId, d + 1);
    if (node.rightId) assignDepth(node.rightId, d + 1);
    node.childrenIds?.forEach((cid) => assignDepth(cid, d + 1));
  };

  assignDepth(preview.rootId, 0);

  // Compute subtree widths for better spacing
  const subtreeWidth = new Map<string, number>();
  const computeWidth = (id: string): number => {
    const node = nodeById.get(id);
    if (!node) return 1;

    const children: string[] = [];
    if (node.leftId) children.push(node.leftId);
    node.childrenIds?.forEach((cid) => children.push(cid));
    if (node.rightId) children.push(node.rightId);

    if (children.length === 0) {
      subtreeWidth.set(id, 1);
      return 1;
    }

    const totalWidth = children.reduce((sum, cid) => sum + computeWidth(cid), 0);
    subtreeWidth.set(id, totalWidth);
    return totalWidth;
  };
  computeWidth(preview.rootId);

  // Assign X using subtree widths for proper spacing
  const assignX = (id: string, leftBound: number, rightBound: number) => {
    const node = nodeById.get(id);
    if (!node) return;

    const myX = (leftBound + rightBound) / 2;
    positions.set(id, { x: myX, y: (depths.get(id) || 0) * LEVEL_H + TOP_PAD });

    const children: string[] = [];
    if (node.leftId) children.push(node.leftId);
    node.childrenIds?.forEach((cid) => children.push(cid));
    if (node.rightId) children.push(node.rightId);

    if (children.length === 0) return;

    const totalChildWidth = children.reduce((s, cid) => s + (subtreeWidth.get(cid) || 1), 0);
    let cursor = leftBound;

    children.forEach((cid) => {
      const childWidth = subtreeWidth.get(cid) || 1;
      const childSlice = ((rightBound - leftBound) * childWidth) / totalChildWidth;
      assignX(cid, cursor, cursor + childSlice);
      cursor += childSlice;
    });
  };

  const totalWidth = (subtreeWidth.get(preview.rootId) || 1) * NODE_W;
  assignX(preview.rootId, 0, Math.max(totalWidth, 300));

  // Normalize into SVG coordinates
  let minX = Infinity;
  let maxX = -Infinity;
  positions.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
  });

  const span = maxX - minX;
  const svgW = Math.max(360, span > 0 ? span + 120 : 360);

  positions.forEach((p) => {
    p.x = span === 0 ? svgW / 2 : 60 + ((p.x - minX) / span) * (svgW - 120);
  });

  const svgH = (maxDepth + 1) * LEVEL_H + TOP_PAD + 30;

  return { positions, svgW, svgH, NODE_W };
}

// ─── Panel ─────────────────────────────────────────────────────────────────────

export const TreePanel: React.FC<{
  preview: TreePreview;
  themeColor: ThemeColor;
}> = ({ preview, themeColor }) => {
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';

  const { positions, svgW, svgH, NODE_W } = useMemo(
    () => computeTreeLayout(preview),
    [preview],
  );

  const nodeById = useMemo(() => {
    const m = new Map<string, TreeNodeView>();
    preview.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [preview]);

  // Collect all edges
  const edges = useMemo(() => {
    const result: { fromId: string; toId: string }[] = [];
    preview.nodes.forEach((node) => {
      if (node.leftId) result.push({ fromId: node.id, toId: node.leftId });
      if (node.rightId) result.push({ fromId: node.id, toId: node.rightId });
      node.childrenIds?.forEach((cid) => result.push({ fromId: node.id, toId: cid }));
    });
    return result;
  }, [preview]);

  return (
    <section className={`${theme.panelClass} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={theme.badgeClass}>
              <GitBranch size={12} />
              Tree
            </span>
          </div>
          <h3 className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
            {preview.sourceName}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Auto-detected from <code className="font-mono">left</code>/
            <code className="font-mono">right</code> pointers in runtime state.
          </p>
        </div>
        <span className="border-[2px] border-slate-900 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:border-[#333] dark:bg-[#111113] dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000]">
          {preview.nodes.length} Nodes
        </span>
      </div>

      {/* Canvas */}
      <div className={`mt-4 ${theme.subPanelClass} p-4 overflow-x-auto custom-scrollbar`}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full"
          style={{ minWidth: Math.min(svgW, 360), height: svgH }}
        >
          {/* Edges */}
          <AnimatePresence>
            {edges.map((edge) => {
              const from = positions.get(edge.fromId);
              const to = positions.get(edge.toId);
              if (!from || !to) return null;

              return (
                <motion.line
                  key={`${edge.fromId}-${edge.toId}`}
                  x1={from.x}
                  y1={from.y + 20}
                  x2={to.x}
                  y2={to.y - 20}
                  stroke={theme.accentFill}
                  strokeWidth="3"
                  opacity="0.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              );
            })}
          </AnimatePresence>

          {/* Nodes */}
          <AnimatePresence>
            {preview.nodes.map((node, index) => {
              const pos = positions.get(node.id);
              if (!pos) return null;

              const hasPointer = node.pointerNames.length > 0;

              // Determine L/R child labels
              const parent = preview.nodes.find(
                (n) => n.leftId === node.id || n.rightId === node.id,
              );
              let childLabel: string | null = null;
              if (parent) {
                if (parent.leftId === node.id) childLabel = 'L';
                else if (parent.rightId === node.id) childLabel = 'R';
              }

              const boxW = NODE_W;
              const boxH = 42;

              return (
                <motion.g
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 28,
                    delay: index * 0.04,
                  }}
                >
                  {/* Pointer tags */}
                  {hasPointer && (
                    <>
                      {node.pointerNames.map((pName, pi) => (
                        <g key={pName}>
                          <rect
                            x={pos.x - boxW / 2 + pi * 4}
                            y={pos.y - boxH / 2 - 24 - pi * 2}
                            width={pName.length * 7 + 12}
                            height={16}
                            fill="#10b981"
                            stroke="#064e3b"
                            strokeWidth="2"
                          />
                          <text
                            x={pos.x - boxW / 2 + pi * 4 + (pName.length * 7 + 12) / 2}
                            y={pos.y - boxH / 2 - 24 - pi * 2 + 12}
                            textAnchor="middle"
                            className="text-[9px] font-black uppercase fill-white pointer-events-none"
                            style={{ letterSpacing: '0.12em' }}
                          >
                            {pName}
                          </text>
                        </g>
                      ))}
                      {/* Connector line */}
                      <line
                        x1={pos.x - boxW / 2 + 8}
                        y1={pos.y - boxH / 2 - 8}
                        x2={pos.x - boxW / 2 + 8}
                        y2={pos.y - boxH / 2}
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                    </>
                  )}

                  {/* L/R label */}
                  {childLabel && (
                    <>
                      <rect
                        x={pos.x + boxW / 2 + 4}
                        y={pos.y - 8}
                        width={16}
                        height={16}
                        fill={isSaffron ? '#fed7aa' : '#bfdbfe'}
                        stroke={isSaffron ? '#c2410c' : '#1d4ed8'}
                        strokeWidth="1.5"
                        className={isSaffron ? 'dark:fill-[#431407]' : 'dark:fill-[#172554]'}
                      />
                      <text
                        x={pos.x + boxW / 2 + 12}
                        y={pos.y + 5}
                        textAnchor="middle"
                        className={`text-[10px] font-black pointer-events-none ${isSaffron ? 'fill-[#c2410c] dark:fill-[#fb923c]' : 'fill-[#1d4ed8] dark:fill-[#60a5fa]'}`}
                      >
                        {childLabel}
                      </text>
                    </>
                  )}

                  {/* Shadow rect */}
                  <rect
                    x={pos.x - boxW / 2 + 2}
                    y={pos.y - boxH / 2 + 2}
                    width={boxW}
                    height={boxH}
                    fill="#0f172a"
                    className="dark:fill-black"
                  />

                  {/* Main node rect */}
                  <rect
                    x={pos.x - boxW / 2}
                    y={pos.y - boxH / 2}
                    width={boxW}
                    height={boxH}
                    fill={hasPointer ? '#ecfdf5' : '#ffffff'}
                    stroke={hasPointer ? '#10b981' : '#0f172a'}
                    strokeWidth="2"
                    className={
                      hasPointer
                        ? 'dark:fill-[#022c22] dark:stroke-[#059669]'
                        : 'dark:fill-[#161618] dark:stroke-[#333]'
                    }
                  />

                  {/* Value text */}
                  <text
                    x={pos.x}
                    y={pos.y + 6}
                    textAnchor="middle"
                    className="text-[15px] font-black fill-slate-900 dark:fill-slate-100 pointer-events-none"
                    style={{ fontFamily: 'ui-monospace, monospace' }}
                  >
                    {node.label}
                  </text>
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </div>

      {preview.truncated && (
        <div className="mt-3 border-[2px] border-slate-900 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:border-[#333] dark:bg-[#111113] dark:text-slate-400">
          Visualization truncated after 31 nodes to keep the panel readable.
        </div>
      )}
    </section>
  );
};
