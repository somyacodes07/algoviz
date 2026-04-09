import React from 'react';
import { Network } from 'lucide-react';
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
}

export interface GraphPreview {
  sourceName: string;
  nodes: GraphNodeView[];
  edges: GraphEdgeView[];
  directed: boolean;
  truncated: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Set) && !(value instanceof Map);
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

  const candidates = namedCandidates.length > 0
    ? namedCandidates
    : Object.entries(variables).filter(([, value]) => Array.isArray(value) || isPlainObject(value));

  const visitedIds = collectVisitedNodeIds(variables);

  for (const [sourceName, candidate] of candidates) {
    const pointerMap = new Map<string, string[]>();
    const pushPointer = (nodeId: string, name: string) => {
      if (!pointerMap.has(nodeId)) pointerMap.set(nodeId, []);
      pointerMap.get(nodeId)!.push(name);
    };

    if (isPlainObject(candidate)) {
      const keys = Object.keys(candidate);
      if (keys.length === 0 || keys.length > 12) continue;

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
        if ((typeof value === 'string' || typeof value === 'number') && keys.includes(String(value))) {
          pushPointer(String(value), name);
        }
      }

      nodes.forEach((node) => {
        node.pointerNames = pointerMap.get(node.id) || [];
      });

      return {
        sourceName,
        nodes,
        edges,
        directed: weighted || edges.some((edge) => !edges.find((candidateEdge) => candidateEdge.from === edge.to && candidateEdge.to === edge.from)),
        truncated: false,
      };
    }

    if (Array.isArray(candidate) && candidate.length > 0 && candidate.length <= 10 && candidate.every(Array.isArray)) {
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
        if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < rows.length) {
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

        return {
          sourceName,
          nodes,
          edges,
          directed: edges.some((edge) => !edges.find((candidateEdge) => candidateEdge.from === edge.to && candidateEdge.to === edge.from)),
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

export const GraphPanel: React.FC<{
  preview: GraphPreview;
  themeColor: ThemeColor;
}> = ({ preview, themeColor }) => {
  const theme = getThemeConfig(themeColor);
  const size = 260;
  const radius = 88;
  const center = size / 2;
  const positions = new Map<string, { x: number; y: number }>();

  preview.nodes.forEach((node, index) => {
    const angle = ((Math.PI * 2) / Math.max(preview.nodes.length, 1)) * index - Math.PI / 2;
    positions.set(node.id, {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    });
  });

  return (
    <section className={`${theme.panelClass} p-4`}>
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
        <span className="border-[2px] border-slate-900 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:border-[#333] dark:bg-[#111113] dark:text-slate-400">
          {preview.directed ? 'Directed' : 'Undirected'}
        </span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px]">
        <div className="border-[2px] border-slate-900 bg-slate-50 p-3 dark:border-[#333] dark:bg-[#111113]">
          <svg viewBox={`0 0 ${size} ${size}`} className="h-[260px] w-full">
            {preview.edges.map((edge, index) => {
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from || !to) return null;

              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;

              return (
                <g key={`${edge.from}-${edge.to}-${index}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={theme.accentFill}
                    strokeWidth="2"
                    opacity="0.65"
                  />
                  {edge.weight && (
                     <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      className="fill-slate-500 text-[9px] font-bold dark:fill-slate-400"
                    >
                      {edge.weight}
                    </text>
                  )}
                </g>
              );
            })}

            {preview.nodes.map((node) => {
              const position = positions.get(node.id)!;
              const hasPointer = node.pointerNames.length > 0;

              return (
                <g key={node.id}>
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={node.visited ? 24 : 20}
                    fill={node.visited ? theme.accentFill : '#ffffff'}
                    stroke={hasPointer ? '#10b981' : '#0f172a'}
                    strokeWidth={hasPointer ? 4 : 3}
                  />
                  <text
                    x={position.x}
                    y={position.y + 4}
                    textAnchor="middle"
                    className={`text-[10px] font-black ${node.visited ? 'fill-white' : 'fill-slate-900'}`}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-2">
          {preview.nodes.map((node) => (
            <div
              key={node.id}
              className={`border-[2px] px-3 py-2 ${node.visited ? `${theme.accentSoftBg} ${theme.accentBorder}` : 'border-slate-900 bg-white dark:border-[#333] dark:bg-[#111113]'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">
                  {node.label}
                </span>
                {node.visited && (
                  <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${theme.accentText}`}>
                    Visited
                  </span>
                )}
              </div>
              {node.pointerNames.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {node.pointerNames.map((pointer) => (
                    <span key={pointer} className="border border-emerald-700 bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white">
                      {pointer}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {preview.truncated && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Visualization truncated to keep the graph readable.
        </div>
      )}
    </section>
  );
};
