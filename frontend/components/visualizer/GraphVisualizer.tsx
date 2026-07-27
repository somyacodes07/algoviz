import React, { useMemo, useRef, useEffect } from 'react';
import { Network, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableMap } from '../../../types';
import { getThemeConfig, ThemeColor } from '../../theme/theme';
import { getPointerSvgColor } from './TreeVisualizer';

export interface GraphNodeView {
  id: string;
  label: string;
  pointerNames: string[];
  visited: boolean;
}

export interface GraphEdgeView {
  from: string;
  to: string;
  weight?: string;
  isBidirectional?: boolean;
}

export interface GraphPreview {
  sourceName: string;
  nodes: GraphNodeView[];
  edges: GraphEdgeView[];
  directed: boolean;
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

function collectVisitedNodeIds(variables: VariableMap): Set<string> {
  const visited = new Set<string>();
  for (const [name, value] of Object.entries(variables)) {
    if (!/visited|seen|closed/i.test(name) || value == null) continue;
    if (value instanceof Set) {
      for (const e of value.values()) visited.add(String(e));
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((e) => visited.add(String(e)));
      continue;
    }
    if (isPlainObject(value)) {
      for (const [k, f] of Object.entries(value)) {
        if (f) visited.add(String(k));
      }
    }
  }
  return visited;
}

export function buildGraphPreview(variables: VariableMap): GraphPreview | null {
  const namedCandidates = Object.entries(variables).filter(([name, value]) => {
    if (!/graph|adj|adjacency/i.test(name)) return false;
    return Array.isArray(value) || isPlainObject(value);
  });
  const candidates =
    namedCandidates.length > 0
      ? namedCandidates
      : Object.entries(variables).filter(
          ([name, value]) =>
            (Array.isArray(value) || isPlainObject(value)) &&
            !/grid|matrix|board|table|nums|arr/i.test(name),
        );

  const visitedIds = collectVisitedNodeIds(variables);

  for (const [sourceName, candidate] of candidates) {
    const pointerMap = new Map<string, string[]>();
    const pushPointer = (nodeId: string, name: string) => {
      if (!pointerMap.has(nodeId)) pointerMap.set(nodeId, []);
      pointerMap.get(nodeId)!.push(name);
    };

    if (isPlainObject(candidate)) {
      const keys = Object.keys(candidate);
      if (keys.length === 0 || keys.length > 20) continue;

      const edges: GraphEdgeView[] = [];
      let validShape = true;
      let weighted = false;

      for (const key of keys) {
        const neighbors = candidate[key];
        if (Array.isArray(neighbors)) {
          for (const neighbor of neighbors) {
            if (typeof neighbor === 'string' || typeof neighbor === 'number') {
              edges.push({ from: key, to: String(neighbor) });
            } else {
              validShape = false;
            }
          }
        } else if (isPlainObject(neighbors)) {
          weighted = true;
          for (const [neighbor, weight] of Object.entries(neighbors)) {
            if (typeof weight === 'number' || typeof weight === 'string') {
              edges.push({ from: key, to: neighbor, weight: String(weight) });
            }
          }
        } else {
          validShape = false;
        }
      }

      if (!validShape || edges.length === 0) continue;

      const nodes = keys.map((key) => ({
        id: key,
        label: key,
        pointerNames: pointerMap.get(key) || [],
        visited: visitedIds.has(key),
      }));

      for (const [name, value] of Object.entries(variables)) {
        if (
          (typeof value === 'string' || typeof value === 'number') &&
          keys.includes(String(value))
        ) {
          pushPointer(String(value), name);
        }
      }
      nodes.forEach((node) => {
        node.pointerNames = pointerMap.get(node.id) || [];
      });

      const edgeSet = new Set(edges.map((e) => `${e.from}->${e.to}`));
      edges.forEach((edge) => {
        if (edgeSet.has(`${edge.to}->${edge.from}`)) edge.isBidirectional = true;
      });

      return {
        sourceName,
        nodes: nodes.slice(0, 20),
        edges,
        directed: weighted || edges.some((edge) => !edgeSet.has(`${edge.to}->${edge.from}`)),
        truncated: nodes.length > 20,
      };
    }

    if (
      Array.isArray(candidate) &&
      candidate.length > 0 &&
      candidate.length <= 10 &&
      candidate.every(Array.isArray)
    ) {
      const rows = candidate as unknown[];
      const isMatrix = rows.every(
        (row) =>
          Array.isArray(row) &&
          row.length === rows.length &&
          row.every((entry) => typeof entry === 'number' || typeof entry === 'boolean'),
      );

      const nodes = rows.map((_, index) => ({
        id: String(index),
        label: String(index),
        pointerNames: [] as string[],
        visited: visitedIds.has(String(index)),
      }));

      for (const [name, value] of Object.entries(variables)) {
        if (
          typeof value === 'number' &&
          Number.isInteger(value) &&
          value >= 0 &&
          value < rows.length
        ) {
          pushPointer(String(value), name);
        }
      }
      nodes.forEach((node) => {
        node.pointerNames = pointerMap.get(node.id) || [];
      });

      if (isMatrix) {
        const edges: GraphEdgeView[] = [];
        rows.forEach((row, ri) => {
          (row as unknown[]).forEach((e, ci) => {
            if (Number(e)) edges.push({ from: String(ri), to: String(ci) });
          });
        });
        if (edges.length === 0) continue;
        const s = new Set(edges.map((e) => `${e.from}->${e.to}`));
        edges.forEach((edge) => {
          if (s.has(`${edge.to}->${edge.from}`)) edge.isBidirectional = true;
        });
        return {
          sourceName,
          nodes,
          edges,
          directed: edges.some((e) => !s.has(`${e.to}->${e.from}`)),
          truncated: false,
        };
      }

      const adjEdges: GraphEdgeView[] = [];
      let valid = true;
      rows.forEach((row, ri) => {
        (row as unknown[]).forEach((entry) => {
          if (typeof entry === 'number' || typeof entry === 'string')
            adjEdges.push({ from: String(ri), to: String(entry) });
          else if (Array.isArray(entry) && entry.length >= 2)
            adjEdges.push({ from: String(ri), to: String(entry[0]), weight: String(entry[1]) });
          else valid = false;
        });
      });
      if (!valid || adjEdges.length === 0) continue;
      const as2 = new Set(adjEdges.map((e) => `${e.from}->${e.to}`));
      adjEdges.forEach((edge) => {
        if (as2.has(`${edge.to}->${edge.from}`)) edge.isBidirectional = true;
      });
      return { sourceName, nodes, edges: adjEdges, directed: true, truncated: false };
    }
  }
  return null;
}

// ─── Layout ────────────────────────────────────────────────────────────────────

function computeGraphLayout(preview: GraphPreview) {
  const NODE_SIZE = 48;
  const positions = new Map<string, { x: number; y: number }>();
  const count = Math.max(preview.nodes.length, 1);
  const radius = Math.max(80, count * 22);
  const svgSize = radius * 2 + NODE_SIZE * 2 + 40;
  const center = svgSize / 2;
  preview.nodes.forEach((node, index) => {
    const angle = ((Math.PI * 2) / count) * index - Math.PI / 2;
    positions.set(node.id, {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    });
  });
  return { positions, svgSize, NODE_SIZE, center };
}

function calculateEdgePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  halfNodeSize: number,
  isBidirectional: boolean,
  isDirected: boolean,
) {
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { d: '', midX: from.x, midY: from.y };
  const ux = dx / dist,
    uy = dy / dist;
  const gap = halfNodeSize + 4;
  const arrowGap = isDirected ? halfNodeSize + 14 : halfNodeSize + 4;
  const sx = from.x + ux * gap,
    sy = from.y + uy * gap;
  const ex = to.x - ux * arrowGap,
    ey = to.y - uy * arrowGap;
  if (isBidirectional) {
    const nx = -uy,
      ny = ux,
      curve = 28;
    const cpX = (from.x + to.x) / 2 + nx * curve,
      cpY = (from.y + to.y) / 2 + ny * curve;
    return {
      d: `M ${sx} ${sy} Q ${cpX} ${cpY} ${ex} ${ey}`,
      midX: 0.25 * sx + 0.5 * cpX + 0.25 * ex,
      midY: 0.25 * sy + 0.5 * cpY + 0.25 * ey,
    };
  }
  return { d: `M ${sx} ${sy} L ${ex} ${ey}`, midX: (sx + ex) / 2, midY: (sy + ey) / 2 };
}

// ─── Panel ─────────────────────────────────────────────────────────────────────

export const GraphPanel: React.FC<{
  preview: GraphPreview;
  themeColor: ThemeColor;
  onEnlarge?: () => void;
}> = ({
  preview,
  themeColor,
  onEnlarge,
}) => {
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';
  const { positions, svgSize, NODE_SIZE } = useMemo(() => computeGraphLayout(preview), [preview]);
  const halfNode = NODE_SIZE / 2;

  // Track newly-visited nodes for ripple animation
  const prevVisited = useRef<Set<string>>(new Set());
  const newlyVisited = useRef<Set<string>>(new Set());
  const rippleKey = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const current = new Set<string>(preview.nodes.filter((n) => n.visited).map((n) => n.id));
    const justVisited = new Set<string>();
    current.forEach((id) => {
      if (!prevVisited.current.has(id)) {
        justVisited.add(id);
        // Bump ripple key so AnimatePresence remounts the ring each time
        rippleKey.current.set(id, (rippleKey.current.get(id) || 0) + 1);
      }
    });
    newlyVisited.current = justVisited;
    prevVisited.current = current;
  });

  const visitedCount = preview.nodes.filter((n) => n.visited).length;
  const hasWeights = preview.edges.some((e) => e.weight);

  const edgesPerNode = useMemo(() => {
    const c = new Map<string, number>();
    preview.edges.forEach((e) => {
      c.set(e.from, (c.get(e.from) || 0) + 1);
      if (!preview.directed || e.isBidirectional) c.set(e.to, (c.get(e.to) || 0) + 1);
    });
    return c;
  }, [preview]);

  return (
    <section className={`${theme.panelClass} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={theme.badgeClass}>
              <Network size={12} /> Graph
            </span>
          </div>
          <h3 className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
            {preview.sourceName}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Auto-detected from adjacency-style runtime data.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="border-[2px] border-slate-900 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface-2)] dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)]">
            {preview.directed ? 'Directed' : 'Undirected'}
          </span>
          {onEnlarge && (
            <button
              onClick={onEnlarge}
              className="p-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-all hover:translate-y-[1px] hover:shadow-none"
              title="Enlarge diagram"
            >
              <Maximize2 size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="border-[2px] border-slate-900 bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface-2)] dark:text-slate-400">
          {preview.nodes.length} Nodes
        </span>
        <span
          className={`border-[2px] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${isSaffron ? 'border-saffron-300 bg-saffron-50 text-saffron-700 dark:border-saffron-800 dark:bg-saffron-900/20 dark:text-saffron-400' : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400'}`}
        >
          {preview.edges.length} Edges
        </span>
        {visitedCount > 0 && (
          <span className="border-[2px] border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
            {visitedCount}/{preview.nodes.length} Visited
          </span>
        )}
        {hasWeights && (
          <span className="border-[2px] border-purple-300 bg-purple-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
            Weighted
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px]">
        {/* SVG Canvas */}
        <div className={`${theme.subPanelClass} p-3 flex justify-center overflow-hidden`}>
          <svg
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className={onEnlarge ? "h-[300px] w-full max-w-[340px]" : "h-[550px] w-full max-w-[580px]"}
            style={{ overflow: 'visible' }}
          >
            <defs>
              <marker
                id="graph-arrow"
                viewBox="0 0 12 12"
                refX="9"
                refY="6"
                markerUnits="strokeWidth"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 1 1 L 11 6 L 1 11 L 4 6 z" fill={isSaffron ? '#f97316' : '#3b82f6'} />
              </marker>
              <marker
                id="graph-arrow-traversed"
                viewBox="0 0 12 12"
                refX="9"
                refY="6"
                markerUnits="strokeWidth"
                markerWidth="7.5"
                markerHeight="7.5"
                orient="auto"
              >
                <path d="M 1 1 L 11 6 L 1 11 L 4 6 z" fill={isSaffron ? '#f59e0b' : '#06b6d4'} />
              </marker>
            </defs>

            {/* Edges */}
            <AnimatePresence>
              {preview.edges.map((edge, ei) => {
                const fromPos = positions.get(edge.from);
                const toPos = positions.get(edge.to);
                if (!fromPos || !toPos) return null;
                const { d, midX, midY } = calculateEdgePath(
                  fromPos,
                  toPos,
                  halfNode,
                  !!edge.isBidirectional,
                  preview.directed,
                );
                const fromNode = preview.nodes.find((n) => n.id === edge.from);
                const toNode = preview.nodes.find((n) => n.id === edge.to);
                const isTraversed = !!(fromNode?.visited && toNode?.visited);

                return (
                  <motion.g
                    key={`${edge.from}-${edge.to}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: ei * 0.04 }}
                  >
                    <motion.path
                      d={d}
                      stroke={theme.accentFill}
                      strokeWidth={isTraversed ? '3' : '2.5'}
                      fill="none"
                      opacity={isTraversed ? '0.85' : '0.4'}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut', delay: ei * 0.04 }}
                      markerEnd={preview.directed ? (isTraversed ? 'url(#graph-arrow-traversed)' : 'url(#graph-arrow)') : undefined}
                    />
                    {/* Animated traversal dot */}
                    {isTraversed && preview.directed && (
                      <motion.circle
                        r={3}
                        fill={theme.accentFill}
                        initial={{ offsetDistance: '0%' }}
                        animate={{ offsetDistance: '100%' }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                        style={{ offsetPath: `path("${d}")` }}
                      />
                    )}
                    {edge.weight && (
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 0.15 + ei * 0.04,
                          type: 'spring',
                          stiffness: 400,
                          damping: 20,
                        }}
                      >
                        <rect
                          x={midX - 11 + 2}
                          y={midY - 10 + 2}
                          width="22"
                          height="18"
                          fill="#0f172a"
                          className="dark:fill-[rgba(0,0,0,0.35)]"
                          opacity="0.2"
                        />
                        <rect
                          x={midX - 11}
                          y={midY - 10}
                          width="22"
                          height="18"
                          fill="#ffffff"
                          stroke="#0f172a"
                          strokeWidth="2"
                          className="dark:fill-[var(--dark-surface-2)] dark:stroke-[var(--dark-border)]"
                        />
                        <text
                          x={midX}
                          y={midY + 3}
                          textAnchor="middle"
                          className="text-[10px] font-black fill-slate-800 dark:fill-slate-200"
                          style={{ fontFamily: 'ui-monospace, monospace' }}
                        >
                          {edge.weight}
                        </text>
                      </motion.g>
                    )}
                  </motion.g>
                );
              })}
            </AnimatePresence>

            {/* Nodes */}
            <AnimatePresence>
              {preview.nodes.map((node, index) => {
                const pos = positions.get(node.id);
                if (!pos) return null;
                const hasPointer = node.pointerNames.length > 0;
                const degree = edgesPerNode.get(node.id) || 0;

                return (
                  <motion.g
                    key={node.id}
                    initial={{ translateX: pos.x, translateY: pos.y, scale: 0.5, opacity: 0 }}
                    animate={{ translateX: pos.x, translateY: pos.y, scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 25,
                      delay: index * 0.06,
                    }}
                  >
                    {/* Visited ripple ring */}
                    {node.visited && (
                      <AnimatePresence>
                        <motion.rect
                          key={`ripple-${node.id}-${rippleKey.current.get(node.id) || 0}`}
                          x={-halfNode - 4}
                          y={-halfNode - 4}
                          width={NODE_SIZE + 8}
                          height={NODE_SIZE + 8}
                          fill="none"
                          stroke={isSaffron ? '#f97316' : '#3b82f6'}
                          strokeWidth="3"
                          initial={{ opacity: 0.9, scale: 1 }}
                          animate={{ opacity: 0, scale: 1.9 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.75, ease: 'easeOut' }}
                          style={{ originX: 0, originY: 0 }}
                        />
                      </AnimatePresence>
                    )}

                    {/* Active pointer ring animation */}
                    {hasPointer && (
                      <motion.rect
                        x={-halfNode - 5}
                        y={-halfNode - 5}
                        width={NODE_SIZE + 10}
                        height={NODE_SIZE + 10}
                        fill="none"
                        stroke={getPointerSvgColor(node.pointerNames[0]).fill}
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        animate={{ strokeDashoffset: [0, -20] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    )}

                    {/* Pointer tags — bounce in/out (#8) */}
                    <AnimatePresence>
                      {hasPointer &&
                        node.pointerNames.map((pName, pi) => {
                          const pc = getPointerSvgColor(pName);
                          const tagW = pName.length * 7 + 10;
                          const rectY = -halfNode - 20 - (pi * 17);
                          return (
                            <motion.g
                              key={pName}
                              initial={{ opacity: 0, scale: 0.5, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.5, y: 4 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            >
                              <rect
                                x={-tagW / 2}
                                y={rectY}
                                width={tagW}
                                height={15}
                                fill={pc.fill}
                                stroke={pc.stroke}
                                strokeWidth="2"
                              />
                              <text
                                x={0}
                                y={rectY + 11}
                                textAnchor="middle"
                                className="text-[8px] font-black uppercase pointer-events-none"
                                fill={pc.text}
                                style={{ letterSpacing: '0.12em' }}
                              >
                                {pName}
                              </text>
                            </motion.g>
                          );
                        })}
                    </AnimatePresence>

                    <rect
                      x={-halfNode + 2}
                      y={-halfNode + 2}
                      width={NODE_SIZE}
                      height={NODE_SIZE}
                      fill="#0f172a"
                      className="dark:fill-[rgba(0,0,0,0.35)]"
                    />

                    {/* Main rect */}
                    <rect
                      x={-halfNode}
                      y={-halfNode}
                      width={NODE_SIZE}
                      height={NODE_SIZE}
                      fill={
                        node.visited
                          ? isSaffron
                            ? '#fed7aa'
                            : '#bfdbfe'
                          : hasPointer
                            ? '#ecfdf5'
                            : '#ffffff'
                      }
                      stroke={
                        node.visited
                          ? isSaffron
                            ? '#c2410c'
                            : '#1d4ed8'
                          : hasPointer
                            ? getPointerSvgColor(node.pointerNames[0]).fill
                            : '#0f172a'
                      }
                      strokeWidth="2"
                      className={
                        node.visited
                          ? isSaffron
                            ? 'dark:fill-[#431407] dark:stroke-[#ea580c]'
                            : 'dark:fill-[#172554] dark:stroke-[#2563eb]'
                          : hasPointer
                            ? 'dark:fill-[#062920]'
                            : 'dark:fill-[var(--dark-surface-2)] dark:stroke-[var(--dark-border)]'
                      }
                    />

                    {/* Label */}
                    <text
                      x={0}
                      y={5}
                      textAnchor="middle"
                      className={`text-[14px] font-black pointer-events-none ${node.visited ? (isSaffron ? 'fill-[#7c2d12] dark:fill-[#fdba74]' : 'fill-[#1e3a8a] dark:fill-[#93c5fd]') : 'fill-slate-900 dark:fill-slate-100'}`}
                      style={{ fontFamily: 'ui-monospace, monospace' }}
                    >
                      {node.label}
                    </text>

                    {/* Visited indicator */}
                    {node.visited && (
                      <motion.g
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 20,
                          delay: 0.15 + index * 0.04,
                        }}
                      >
                        <rect
                          x={halfNode - 8}
                          y={-halfNode - 4}
                          width={8}
                          height={8}
                          fill={theme.accentFill}
                          stroke="#0f172a"
                          strokeWidth="1.5"
                          className="dark:stroke-[var(--dark-border)]"
                        />
                      </motion.g>
                    )}

                    {/* Degree badge */}
                    {degree > 0 && (
                      <>
                        <rect
                          x={halfNode - 14}
                          y={halfNode - 2}
                          width={14}
                          height={12}
                          fill="#0f172a"
                          className="dark:fill-[var(--dark-border)]"
                        />
                        <text
                          x={halfNode - 7}
                          y={halfNode + 8}
                          textAnchor="middle"
                          className="text-[8px] font-black fill-white pointer-events-none"
                          style={{ fontFamily: 'ui-monospace, monospace' }}
                        >
                          {degree}
                        </text>
                      </>
                    )}
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </svg>
        </div>

        {/* Sidebar */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {preview.nodes.map((node, index) => {
            const degree = edgesPerNode.get(node.id) || 0;
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                className={`border-[2px] px-3 py-2 ${
                  node.visited
                    ? `${theme.accentSoftBg} ${theme.accentBorder} shadow-[2px_2px_0_rgba(15,23,42,0.3)] dark:shadow-[2px_2px_0_rgba(0,0,0,0.5)]`
                    : 'border-slate-900 bg-white dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface-2)] shadow-[2px_2px_0_rgba(15,23,42,0.1)] dark:shadow-[2px_2px_0_var(--dark-shadow)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">
                    {node.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {degree > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        deg:{degree}
                      </span>
                    )}
                    {node.visited && (
                      <span
                        className={`text-[9px] font-bold uppercase tracking-[0.16em] border px-1.5 py-0.5 ${
                          isSaffron
                            ? 'text-saffron-700 bg-saffron-100 border-saffron-300 dark:text-saffron-400 dark:bg-saffron-900/20 dark:border-saffron-700'
                            : 'text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-700'
                        }`}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                </div>
                {node.pointerNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {node.pointerNames.map((p) => (
                      <span
                        key={p}
                        className="border-[2px] border-emerald-700 bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white shadow-[1px_1px_0_rgba(0,0,0,1)]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {preview.truncated && (
        <div className="mt-3 border-[2px] border-slate-900 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface)] dark:text-slate-400">
          Visualization truncated to keep the graph readable.
        </div>
      )}
    </section>
  );
};
