import React, { useMemo } from 'react';
import { Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableMap } from '../../../types';
import { getThemeConfig, ThemeColor } from '../../theme/theme';

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
      for (const entry of value.values()) visited.add(String(entry));
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => visited.add(String(entry)));
      continue;
    }

    if (isPlainObject(value)) {
      for (const [key, flag] of Object.entries(value)) {
        if (flag) visited.add(String(key));
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
          ([, value]) => Array.isArray(value) || isPlainObject(value),
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

      // Detect bidirectional using O(1) Set lookup
      const edgeSet = new Set(edges.map((e) => `${e.from}->${e.to}`));
      edges.forEach((edge) => {
        if (edgeSet.has(`${edge.to}->${edge.from}`)) {
          edge.isBidirectional = true;
        }
      });

      return {
        sourceName,
        nodes: nodes.slice(0, 20),
        edges,
        directed:
          weighted ||
          edges.some((edge) => !edgeSet.has(`${edge.to}->${edge.from}`)),
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
        rows.forEach((row, rowIndex) => {
          (row as unknown[]).forEach((entry, colIndex) => {
            if (Number(entry)) {
              edges.push({ from: String(rowIndex), to: String(colIndex) });
            }
          });
        });

        if (edges.length === 0) continue;

        edges.forEach((edge) => {
          if (edges.find((e) => e.from === edge.to && e.to === edge.from)) {
            edge.isBidirectional = true;
          }
        });

        return {
          sourceName,
          nodes,
          edges,
          directed: edges.some(
            (edge) =>
              !edges.find(
                (candidateEdge) => candidateEdge.from === edge.to && candidateEdge.to === edge.from,
              ),
          ),
          truncated: false,
        };
      }

      const adjacencyListEdges: GraphEdgeView[] = [];
      let validListShape = true;

      rows.forEach((row, rowIndex) => {
        (row as unknown[]).forEach((entry) => {
          if (typeof entry === 'number' || typeof entry === 'string') {
            adjacencyListEdges.push({ from: String(rowIndex), to: String(entry) });
          } else if (Array.isArray(entry) && entry.length >= 2) {
            adjacencyListEdges.push({
              from: String(rowIndex),
              to: String(entry[0]),
              weight: String(entry[1]),
            });
          } else {
            validListShape = false;
          }
        });
      });

      if (!validListShape || adjacencyListEdges.length === 0) continue;

      adjacencyListEdges.forEach((edge) => {
        if (adjacencyListEdges.find((e) => e.from === edge.to && e.to === edge.from)) {
          edge.isBidirectional = true;
        }
      });

      return {
        sourceName,
        nodes,
        edges: adjacencyListEdges,
        directed: true,
        truncated: false,
      };
    }
  }

  return null;
}

// ─── Layout helpers ────────────────────────────────────────────────────────────

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
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { d: '', midX: from.x, midY: from.y };

  const ux = dx / dist;
  const uy = dy / dist;

  const gap = halfNodeSize + 4;
  const arrowGap = isDirected ? halfNodeSize + 14 : halfNodeSize + 4;

  const sx = from.x + ux * gap;
  const sy = from.y + uy * gap;
  const ex = to.x - ux * arrowGap;
  const ey = to.y - uy * arrowGap;

  if (isBidirectional) {
    const nx = -uy;
    const ny = ux;
    const curve = 28;
    const cpX = (from.x + to.x) / 2 + nx * curve;
    const cpY = (from.y + to.y) / 2 + ny * curve;
    const midX = 0.25 * sx + 0.5 * cpX + 0.25 * ex;
    const midY = 0.25 * sy + 0.5 * cpY + 0.25 * ey;

    return {
      d: `M ${sx} ${sy} Q ${cpX} ${cpY} ${ex} ${ey}`,
      midX,
      midY,
    };
  }

  return {
    d: `M ${sx} ${sy} L ${ex} ${ey}`,
    midX: (sx + ex) / 2,
    midY: (sy + ey) / 2,
  };
}

// ─── Panel ─────────────────────────────────────────────────────────────────────

export const GraphPanel: React.FC<{
  preview: GraphPreview;
  themeColor: ThemeColor;
}> = ({ preview, themeColor }) => {
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';

  const { positions, svgSize, NODE_SIZE } = useMemo(
    () => computeGraphLayout(preview),
    [preview],
  );

  const halfNode = NODE_SIZE / 2;

  return (
    <section className={`${theme.panelClass} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={theme.badgeClass}>
              <Network size={12} />
              Graph
            </span>
          </div>
          <h3 className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
            {preview.sourceName}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Auto-detected from adjacency-style runtime data.
          </p>
        </div>
        <span className="border-[2px] border-slate-900 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:border-[#333] dark:bg-[#111113] dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000]">
          {preview.directed ? 'Directed' : 'Undirected'}
        </span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px]">
        {/* SVG Canvas */}
        <div className={`${theme.subPanelClass} p-3 flex justify-center overflow-hidden`}>
          <svg
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className="h-[300px] w-full max-w-[340px]"
          >
            <defs>
              <marker
                id="graph-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerUnits="strokeWidth"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 L 3 5 z" fill={theme.accentFill} opacity="0.8" />
              </marker>
            </defs>

            {/* Edges */}
            <AnimatePresence>
              {preview.edges.map((edge) => {
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

                return (
                  <motion.g
                    key={`${edge.from}-${edge.to}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.path
                      d={d}
                      stroke={theme.accentFill}
                      strokeWidth="2.5"
                      fill="none"
                      opacity="0.6"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      markerEnd={preview.directed ? 'url(#graph-arrow)' : undefined}
                    />
                    {edge.weight && (
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                      >
                        {/* Weight badge — brutalist style */}
                        <rect
                          x={midX - 11}
                          y={midY - 10}
                          width="22"
                          height="18"
                          fill="#ffffff"
                          stroke="#0f172a"
                          strokeWidth="2"
                          className="dark:fill-[#161618] dark:stroke-[#333]"
                        />
                        <rect
                          x={midX - 11 + 2}
                          y={midY - 10 + 2}
                          width="22"
                          height="18"
                          fill="#0f172a"
                          className="dark:fill-black"
                          opacity="0.15"
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

                return (
                  <motion.g
                    key={node.id}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      delay: index * 0.04,
                    }}
                  >
                    {/* Pointer tags */}
                    {hasPointer &&
                      node.pointerNames.map((pName, pi) => (
                        <g key={pName}>
                          <rect
                            x={pos.x - halfNode + pi * 3}
                            y={pos.y - halfNode - 22 - pi * 2}
                            width={pName.length * 7 + 10}
                            height={15}
                            fill="#10b981"
                            stroke="#064e3b"
                            strokeWidth="2"
                          />
                          <text
                            x={pos.x - halfNode + pi * 3 + (pName.length * 7 + 10) / 2}
                            y={pos.y - halfNode - 22 - pi * 2 + 11}
                            textAnchor="middle"
                            className="text-[8px] font-black uppercase fill-white pointer-events-none"
                            style={{ letterSpacing: '0.12em' }}
                          >
                            {pName}
                          </text>
                        </g>
                      ))}

                    {/* Shadow */}
                    <rect
                      x={pos.x - halfNode + 2}
                      y={pos.y - halfNode + 2}
                      width={NODE_SIZE}
                      height={NODE_SIZE}
                      fill="#0f172a"
                      className="dark:fill-black"
                    />

                    {/* Main rect */}
                    <rect
                      x={pos.x - halfNode}
                      y={pos.y - halfNode}
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
                            ? '#10b981'
                            : '#0f172a'
                      }
                      strokeWidth="2"
                      className={
                        node.visited
                          ? isSaffron
                            ? 'dark:fill-[#431407] dark:stroke-[#ea580c]'
                            : 'dark:fill-[#172554] dark:stroke-[#2563eb]'
                          : hasPointer
                            ? 'dark:fill-[#022c22] dark:stroke-[#059669]'
                            : 'dark:fill-[#161618] dark:stroke-[#333]'
                      }
                    />

                    {/* Label */}
                    <text
                      x={pos.x}
                      y={pos.y + 5}
                      textAnchor="middle"
                      className={`text-[14px] font-black pointer-events-none ${
                        node.visited
                          ? isSaffron
                            ? 'fill-[#7c2d12] dark:fill-[#fdba74]'
                            : 'fill-[#1e3a8a] dark:fill-[#93c5fd]'
                          : 'fill-slate-900 dark:fill-slate-100'
                      }`}
                      style={{ fontFamily: 'ui-monospace, monospace' }}
                    >
                      {node.label}
                    </text>

                    {/* Visited chip */}
                    {node.visited && (
                      <motion.g
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
                      >
                        <rect
                          x={pos.x + halfNode - 8}
                          y={pos.y - halfNode - 4}
                          width={8}
                          height={8}
                          fill={theme.accentFill}
                          stroke="#0f172a"
                          strokeWidth="1.5"
                          className="dark:stroke-[#333]"
                        />
                      </motion.g>
                    )}
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </svg>
        </div>

        {/* Node list sidebar */}
        <div className="space-y-2">
          {preview.nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`border-[2px] px-3 py-2 ${
                node.visited
                  ? `${theme.accentSoftBg} ${theme.accentBorder} shadow-[2px_2px_0_rgba(15,23,42,0.3)] dark:shadow-[2px_2px_0_rgba(0,0,0,0.5)]`
                  : 'border-slate-900 bg-white dark:border-[#333] dark:bg-[#161618] shadow-[2px_2px_0_rgba(15,23,42,0.1)] dark:shadow-[2px_2px_0_rgba(0,0,0,0.3)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">
                  {node.label}
                </span>
                {node.visited && (
                  <span
                    className={`text-[9px] font-bold uppercase tracking-[0.16em] border px-1.5 py-0.5 ${
                      isSaffron
                        ? 'text-saffron-700 bg-saffron-100 border-saffron-300 dark:text-saffron-400 dark:bg-saffron-900/20 dark:border-saffron-700'
                        : 'text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-700'
                    }`}
                  >
                    ✓ Visited
                  </span>
                )}
              </div>
              {node.pointerNames.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {node.pointerNames.map((pointer) => (
                    <span
                      key={pointer}
                      className="border-[2px] border-emerald-700 bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white shadow-[1px_1px_0_rgba(0,0,0,1)]"
                    >
                      {pointer}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {preview.truncated && (
        <div className="mt-3 border-[2px] border-slate-900 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:border-[#333] dark:bg-[#111113] dark:text-slate-400">
          Visualization truncated to keep the graph readable.
        </div>
      )}
    </section>
  );
};
