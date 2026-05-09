import React, { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, ArrowRight, ArrowLeft, Repeat2, Trash2 } from 'lucide-react';
import { VariableMap } from '../../../types';
import { getThemeConfig, ThemeColor } from '../../theme/theme';

export interface LinkedListNodeView {
  id: string;
  label: string;
  pointerNames: string[];
}

export interface LinkedListPreview {
  sourceName: string;
  nodes: LinkedListNodeView[];
  cycleToIndex: number | null;
  truncated: boolean;
  isDoublyLinked: boolean;
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
  const candidates = ['val', 'value', 'id', 'label', 'name', 'key'];
  for (const candidate of candidates) {
    const current = value[candidate];
    if (typeof current === 'string' || typeof current === 'number') {
      return String(current);
    }
  }
  return `Node ${fallbackIndex + 1}`;
}

export function buildLinkedListPreview(variables: VariableMap): LinkedListPreview | null {
  const entries = Object.entries(variables).filter(
    ([, value]) => isPlainObject(value) && 'next' in value,
  );

  if (entries.length === 0) return null;

  let bestPreview: (LinkedListPreview & { score: number }) | null = null;

  for (const [sourceName, startNode] of entries) {
    const refToIndex = new WeakMap<object, number>();
    const nodes: LinkedListNodeView[] = [];
    let current: unknown = startNode;
    let cycleToIndex: number | null = null;
    let truncated = false;
    let isDoublyLinked = false;

    while (isPlainObject(current) && 'next' in current) {
      if ('prev' in current) isDoublyLinked = true;
      if (refToIndex.has(current)) {
        cycleToIndex = refToIndex.get(current)!;
        break;
      }

      if (nodes.length >= 16) {
        truncated = true;
        break;
      }

      const nextIndex = nodes.length;
      refToIndex.set(current, nextIndex);
      nodes.push({
        id: `${sourceName}-${nextIndex}`,
        label: getNodeLabel(current, nextIndex),
        pointerNames: [],
      });

      current = current.next;
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

    const score =
      nodes.length * 10 +
      (cycleToIndex !== null ? 6 : 0) +
      (/head|root|start|list/i.test(sourceName) ? 20 : 0);

    const preview = { sourceName, nodes, cycleToIndex, truncated, isDoublyLinked, score };
    if (!bestPreview || preview.score > bestPreview.score) {
      bestPreview = preview;
    }
  }

  if (!bestPreview || bestPreview.nodes.length < 1) return null;

  const { score: _score, ...preview } = bestPreview;
  return preview;
}

// Extended node with deletion status for rendering
interface RenderNode extends LinkedListNodeView {
  deleted: boolean;
  position: number; // original position for ordering
}

export const LinkedListPanel: React.FC<{
  preview: LinkedListPreview;
  themeColor: ThemeColor;
}> = ({ preview, themeColor }) => {
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';

  // Track previous nodes to detect deletions
  const prevNodesRef = useRef<LinkedListNodeView[]>([]);
  const prevPointedIds = useRef<Set<string>>(new Set());
  const trailIds = useRef<Set<string>>(new Set());

  // Build the merged render list: current nodes + recently deleted ghost nodes
  const renderNodes = useMemo<RenderNode[]>(() => {
    const prevNodes = prevNodesRef.current;
    const currentLabels = new Set(preview.nodes.map((n) => n.label));
    const deletedNodes: RenderNode[] = [];

    // Find nodes that existed in prev but not in current (by label match)
    for (const prev of prevNodes) {
      if (!currentLabels.has(prev.label)) {
        deletedNodes.push({
          ...prev,
          id: `deleted-${prev.id}`,
          pointerNames: [],
          deleted: true,
          position: -1,
        });
      }
    }

    // Build merged list: insert deleted nodes near their old position
    const result: RenderNode[] = preview.nodes.map((n, i) => ({
      ...n,
      deleted: false,
      position: i,
    }));

    // Append deleted nodes (they animate out via AnimatePresence)
    return [...result, ...deletedNodes];
  }, [preview.nodes]);

  useEffect(() => {
    const currentPointedIds = new Set<string>();
    preview.nodes.forEach((n) => {
      if (n.pointerNames.length > 0) currentPointedIds.add(n.id);
    });

    const newTrail = new Set<string>();
    prevPointedIds.current.forEach((id) => {
      if (!currentPointedIds.has(id)) newTrail.add(id);
    });

    trailIds.current = newTrail;
    prevPointedIds.current = currentPointedIds;

    // Update prev snapshot after render
    prevNodesRef.current = [...preview.nodes];
  });

  // Count deleted nodes for the badge
  const deletedCount = renderNodes.filter((n) => n.deleted).length;

  return (
    <section className={`${theme.panelClass} p-3`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={theme.badgeClass}>
              <GitBranch size={12} />
              {preview.isDoublyLinked ? 'Doubly Linked List' : 'Linked List'}
            </span>
            {deletedCount > 0 && (
              <span className="inline-flex items-center gap-1 border-[2px] border-red-300 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <Trash2 size={10} />
                {deletedCount} removed
              </span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
            {preview.sourceName}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Auto-detected from a `next` chain in runtime state.
          </p>
        </div>

        {preview.cycleToIndex !== null && (
          <span className="inline-flex items-center gap-1 border-[2px] border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
            <Repeat2 size={12} />
            Cycle
          </span>
        )}
      </div>

      <div className="mt-3 overflow-x-auto custom-scrollbar pb-2">
        <div className="flex items-start gap-2 w-max">
          <AnimatePresence mode="popLayout">
            {renderNodes
              .filter((n) => !n.deleted)
              .map((node, index, arr) => {
                const isPointed = node.pointerNames.length > 0;
                const isTrail = trailIds.current.has(node.id);

                return (
                  <motion.div
                    key={node.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="flex items-start gap-2"
                  >
                    <div className="relative">
                      {/* Trail glow */}
                      {isTrail && (
                        <motion.div
                          className="absolute inset-0 -m-1"
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          style={{
                            background: isSaffron
                              ? 'rgba(249,115,22,0.25)'
                              : 'rgba(59,130,246,0.25)',
                            border: `2px solid ${isSaffron ? '#f97316' : '#3b82f6'}`,
                          }}
                        />
                      )}

                      {/* Pointer tag */}
                      <AnimatePresence>
                        {isPointed && (
                          <motion.div
                            key={node.pointerNames.join(',')}
                            className="absolute -top-5 left-0 right-0 flex justify-center gap-0.5"
                            initial={{ opacity: 0, scale: 0.5, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: 4 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          >
                            {node.pointerNames.map((p) => (
                              <span
                                key={p}
                                className={`border border-slate-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white ${theme.accentBg}`}
                              >
                                {p}
                              </span>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div
                        animate={isPointed ? { scale: 1.05, y: -2 } : { scale: 1, y: 0 }}
                        className={`mt-5 flex items-stretch border-[3px] bg-white dark:bg-[#161618] ${
                          isPointed 
                            ? `${theme.accentBorder} shadow-[4px_4px_0_#0f172a] dark:shadow-[4px_4px_0_#000] z-10` 
                            : isTrail
                              ? 'border-slate-500 shadow-[4px_4px_0_#64748b] dark:shadow-[4px_4px_0_#000]'
                              : 'border-slate-900 dark:border-[#555] shadow-[4px_4px_0_rgba(15,23,42,0.2)] dark:shadow-[4px_4px_0_#000]'
                        }`}
                      >
                        {preview.isDoublyLinked && (
                          <div className={`flex items-center justify-center px-1.5 border-r-[3px] ${isPointed ? theme.accentBorder : 'border-slate-900 dark:border-[#555]'} bg-slate-100 dark:bg-[#222]`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isPointed ? theme.accentBg : 'bg-slate-400 dark:bg-slate-500'}`}></div>
                          </div>
                        )}
                        <div className="flex flex-col items-center justify-center min-w-[56px] px-2 py-1.5">
                          <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-0.5">
                            Node {index + 1}
                          </div>
                          <div className={`text-lg font-black ${isPointed ? theme.accentText : 'text-slate-900 dark:text-slate-100'}`}>
                            {node.label}
                          </div>
                        </div>
                        <div className={`flex items-center justify-center px-1.5 border-l-[3px] ${isPointed ? theme.accentBorder : 'border-slate-900 dark:border-[#555]'} bg-slate-100 dark:bg-[#222]`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isPointed ? theme.accentBg : 'bg-slate-400 dark:bg-slate-500'}`}></div>
                        </div>
                      </motion.div>
                    </div>

                    {index < arr.length - 1 && (
                      preview.isDoublyLinked ? (
                        <div className="mt-8 flex flex-col items-center gap-0.5">
                          <motion.div
                            className={theme.accentText}
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
                          >
                            <ArrowRight size={13} strokeWidth={2.5} />
                          </motion.div>
                          <div className={`h-[2px] w-5 ${isSaffron ? 'bg-orange-300 dark:bg-orange-700' : 'bg-blue-300 dark:bg-blue-700'} rounded-full`} />
                          <motion.div
                            className={theme.accentText}
                            animate={{ x: [0, -4, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6, delay: 0.3 }}
                          >
                            <ArrowLeft size={13} strokeWidth={2.5} />
                          </motion.div>
                        </div>
                      ) : (
                        <motion.div
                          className={`mt-11 flex items-center ${theme.accentText}`}
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
                        >
                          <ArrowRight size={14} />
                        </motion.div>
                      )
                    )}
                  </motion.div>
                );
              })}

            {/* Deleted ghost nodes */}
            {renderNodes
              .filter((n) => n.deleted)
              .map((node) => (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 1, scale: 1, y: 0 }}
                  animate={{ opacity: 0, scale: 0.6, y: 28 }}
                  exit={{ opacity: 0, scale: 0.4, y: 40 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-start gap-2 pointer-events-none"
                >
                  <div className="relative">
                    <div className="mt-5 flex items-stretch border-[3px] border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950/40 shadow-[4px_4px_0_rgba(239,68,68,0.4)] relative overflow-hidden opacity-80">
                      {/* Strikethrough line */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-full h-[3px] bg-red-600 dark:bg-red-500 rotate-[-12deg]" />
                      </div>
                      
                      {preview.isDoublyLinked && (
                        <div className="flex items-center justify-center px-1.5 border-r-[3px] border-red-500 dark:border-red-700 bg-red-100 dark:bg-red-900/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500"></div>
                        </div>
                      )}
                      <div className="flex flex-col items-center justify-center min-w-[56px] px-2 py-1.5">
                        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-red-500 dark:text-red-400 mb-0.5">
                          Deleted
                        </div>
                        <div className="text-lg font-black text-red-600 dark:text-red-400">
                          {node.label}
                        </div>
                      </div>
                      <div className="flex items-center justify-center px-1.5 border-l-[3px] border-red-500 dark:border-red-700 bg-red-100 dark:bg-red-900/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>

      {preview.cycleToIndex !== null && (
        <div className="mt-4 border-[2px] border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          Tail reconnects to node {preview.cycleToIndex + 1}, so this list contains a cycle.
        </div>
      )}

      {preview.truncated && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Visualization truncated after 16 nodes to keep the panel readable.
        </div>
      )}
    </section>
  );
};
