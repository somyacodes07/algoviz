import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network } from 'lucide-react';
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
    ([, value]) => isPlainObject(value) && ('left' in value || 'right' in value || 'children' in value)
  );

  if (entries.length === 0) return null;

  let bestPreview: (TreePreview & { score: number }) | null = null;

  for (const [sourceName, startNode] of entries) {
    const nodes: TreeNodeView[] = [];
    const refToIndex = new WeakMap<object, number>();
    const queue = [startNode as Record<string, unknown>];
    let truncated = false;
    
    // BFS traversal
    let i = 0;
    while (i < queue.length) {
      if (nodes.length >= 31) {
        truncated = true;
        break;
      }
      
      const current = queue[i];
      const currentIndex = i;
      refToIndex.set(current, currentIndex);
      
      const nodeView: TreeNodeView = {
        id: `${sourceName}-${currentIndex}`,
        label: getNodeLabel(current, currentIndex),
        pointerNames: []
      };
      
      if (isPlainObject(current.left)) {
        queue.push(current.left as Record<string, unknown>);
        nodeView.leftId = `${sourceName}-${queue.length - 1}`;
      }
      if (isPlainObject(current.right)) {
        queue.push(current.right as Record<string, unknown>);
        nodeView.rightId = `${sourceName}-${queue.length - 1}`;
      }
      if (Array.isArray(current.children)) {
        nodeView.childrenIds = [];
        for (const child of current.children) {
            if (isPlainObject(child)) {
                queue.push(child as Record<string, unknown>);
                nodeView.childrenIds.push(`${sourceName}-${queue.length - 1}`);
            }
        }
      }
      
      nodes.push(nodeView);
      i++;
    }

    if (nodes.length === 0) continue;

    for (const [name, value] of Object.entries(variables)) {
      if (value && typeof value === 'object') {
        const mappedIndex = refToIndex.get(value as object);
        if (mappedIndex !== undefined) {
          nodes[mappedIndex].pointerNames.push(name);
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

export const TreePanel: React.FC<{
  preview: TreePreview;
  themeColor: ThemeColor;
}> = ({ preview, themeColor }) => {
  const theme = getThemeConfig(themeColor);
  
  // Basic Tree Layout Algorithm
  const positions = useMemo(() => {
    const pos = new Map<string, {x: number, y: number}>();
    const nodeById = new Map<string, TreeNodeView>();
    preview.nodes.forEach(n => nodeById.set(n.id, n));
    
    const levelHeight = 80;
    const nodeWidth = 60;
    
    let maxDepth = 0;
    const depths = new Map<string, number>();
    
    const assignDepth = (id: string, d: number) => {
        depths.set(id, d);
        maxDepth = Math.max(maxDepth, d);
        const node = nodeById.get(id);
        if (!node) return;
        if (node.leftId) assignDepth(node.leftId, d + 1);
        if (node.rightId) assignDepth(node.rightId, d + 1);
        if (node.childrenIds) {
            node.childrenIds.forEach(cid => assignDepth(cid, d + 1));
        }
    };
    
    assignDepth(preview.rootId, 0);
    
    let xOffset = 0;
    const assignX = (id: string) => {
        const node = nodeById.get(id);
        if (!node) return 0;
        
        let leftX = null;
        let rightX = null;
        let childrenX: number[] = [];
        
        if (node.leftId) leftX = assignX(node.leftId);
        if (node.childrenIds) {
            childrenX = node.childrenIds.map(assignX);
        }
        if (node.rightId) rightX = assignX(node.rightId);
        
        let myX = 0;
        if (leftX !== null && rightX !== null) {
            myX = (leftX + rightX) / 2;
        } else if (childrenX.length > 0) {
            myX = (childrenX[0] + childrenX[childrenX.length - 1]) / 2;
        } else if (leftX !== null) {
            myX = leftX + nodeWidth / 2;
        } else if (rightX !== null) {
            myX = rightX - nodeWidth / 2;
        } else {
            myX = xOffset;
            xOffset += nodeWidth;
        }
        
        pos.set(id, { x: myX, y: (depths.get(id) || 0) * levelHeight + 30 });
        return myX;
    };
    
    assignX(preview.rootId);
    
    // Normalize X so it fits in svg
    let minX = Infinity;
    let maxX = -Infinity;
    pos.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
    });
    
    const span = maxX - minX;
    const targetWidth = 340;
    
    pos.forEach(p => {
        if (span === 0) {
            p.x = 200; // Center of 400
        } else {
            p.x = 30 + ((p.x - minX) / span) * (targetWidth - 60);
        }
    });
    
    return pos;
  }, [preview]);

  const sizeX = 400;
  const sizeY = Math.max(200, (Math.max(...Array.from(positions.values()).map(p => p.y)) || 0) + 60);

  return (
    <section className={`${theme.panelClass} p-4`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={theme.badgeClass}>
              <Network size={12} />
              Tree
            </span>
          </div>
          <h3 className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
            {preview.sourceName}
          </h3>
        </div>
      </div>

      <div className="mt-4 border-[2px] border-slate-900 bg-slate-50 p-4 dark:border-[#333] dark:bg-[#111113] flex justify-center overflow-x-auto custom-scrollbar">
        <svg viewBox={`0 0 ${sizeX} ${sizeY}`} className="w-full min-w-[320px] max-w-[400px]" style={{ height: sizeY }}>
          <AnimatePresence>
            {preview.nodes.map((node) => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              
              const edges = [];
              if (node.leftId && positions.has(node.leftId)) edges.push(positions.get(node.leftId)!);
              if (node.rightId && positions.has(node.rightId)) edges.push(positions.get(node.rightId)!);
              if (node.childrenIds) {
                  node.childrenIds.forEach(cid => {
                      if (positions.has(cid)) edges.push(positions.get(cid)!);
                  });
              }

              return (
                <motion.g key={`edges-${node.id}`}>
                  {edges.map((target, idx) => (
                    <motion.path
                      key={idx}
                      d={`M ${pos.x} ${pos.y} L ${target.x} ${target.y}`}
                      stroke={theme.accentFill}
                      strokeWidth="2.5"
                      opacity="0.6"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                    />
                  ))}
                </motion.g>
              );
            })}
            
            {preview.nodes.map((node) => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              const hasPointer = node.pointerNames.length > 0;

              return (
                <motion.g key={node.id} layoutId={`tree-node-${node.id}`}>
                  {hasPointer && (
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={28}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                      style={{ originX: `${pos.x}px`, originY: `${pos.y}px` }}
                    />
                  )}
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={20}
                    fill="#ffffff"
                    stroke={hasPointer ? '#10b981' : '#0f172a'}
                    strokeWidth={hasPointer ? 3.5 : 3}
                    className="dark:fill-[#111113]"
                  />
                  <motion.text
                    x={pos.x}
                    y={pos.y + 4.5}
                    textAnchor="middle"
                    className="text-[12px] font-black fill-slate-900 dark:fill-slate-100 pointer-events-none"
                  >
                    {node.label}
                  </motion.text>
                  {hasPointer && (
                    <motion.text
                      x={pos.x + 24}
                      y={pos.y - 16}
                      className="text-[10px] font-black fill-emerald-600 dark:fill-emerald-400"
                    >
                      {node.pointerNames.join(', ')}
                    </motion.text>
                  )}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>
      </div>
      {preview.truncated && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Visualization truncated.
        </div>
      )}
    </section>
  );
};
