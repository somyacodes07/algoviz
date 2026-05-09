import React, { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, ArrowRight, ArrowLeft, ChevronsDown, Repeat2, Trash2 } from 'lucide-react';
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
  const candidates = ['val', 'value', 'data', 'id', 'label', 'name', 'key'];
  for (const candidate of candidates) {
    const current = value[candidate];
    if (typeof current === 'string' || typeof current === 'number') {
      return String(current);
    }
  }
  return `N${fallbackIndex + 1}`;
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

// Color-coded pointer tags — different colors for different pointer roles
const POINTER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  head:     { bg: 'bg-emerald-500', text: 'text-white',       border: 'border-emerald-600', glow: 'rgba(16,185,129,0.3)' },
  tail:     { bg: 'bg-purple-500',  text: 'text-white',       border: 'border-purple-600',  glow: 'rgba(168,85,247,0.3)' },
  curr:     { bg: 'bg-amber-500',   text: 'text-black',       border: 'border-amber-600',   glow: 'rgba(245,158,11,0.3)' },
  current:  { bg: 'bg-amber-500',   text: 'text-black',       border: 'border-amber-600',   glow: 'rgba(245,158,11,0.3)' },
  temp:     { bg: 'bg-rose-500',    text: 'text-white',       border: 'border-rose-600',     glow: 'rgba(244,63,94,0.3)' },
  prev:     { bg: 'bg-cyan-500',    text: 'text-black',       border: 'border-cyan-600',     glow: 'rgba(6,182,212,0.3)' },
  n:        { bg: 'bg-pink-500',    text: 'text-white',       border: 'border-pink-600',     glow: 'rgba(236,72,153,0.3)' },
  node:     { bg: 'bg-pink-500',    text: 'text-white',       border: 'border-pink-600',     glow: 'rgba(236,72,153,0.3)' },
  nxtNode:  { bg: 'bg-sky-500',     text: 'text-white',       border: 'border-sky-600',      glow: 'rgba(14,165,233,0.3)' },
  nextTemp: { bg: 'bg-sky-500',     text: 'text-white',       border: 'border-sky-600',      glow: 'rgba(14,165,233,0.3)' },
  found:    { bg: 'bg-lime-500',    text: 'text-black',       border: 'border-lime-600',     glow: 'rgba(132,204,22,0.3)' },
  target:   { bg: 'bg-lime-500',    text: 'text-black',       border: 'border-lime-600',     glow: 'rgba(132,204,22,0.3)' },
};
const DEFAULT_PTR_COLOR = { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600', glow: 'rgba(99,102,241,0.3)' };

function getPtrColor(name: string) {
  return POINTER_COLORS[name] || DEFAULT_PTR_COLOR;
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
  // Count pointer-tagged nodes
  const pointedCount = preview.nodes.filter((n) => n.pointerNames.length > 0).length;

  return (
    <section className={`${theme.panelClass} p-3`}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={theme.badgeClass}>
              <GitBranch size={12} />
              {preview.isDoublyLinked ? 'Doubly Linked List' : 'Singly Linked List'}
            </span>
            <span className="inline-flex items-center gap-1 border-[2px] border-slate-300 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
              {preview.nodes.length} nodes
            </span>
            {pointedCount > 0 && (
              <span className="inline-flex items-center gap-1 border-[2px] border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                <ChevronsDown size={10} />
                {pointedCount} tracked
              </span>
            )}
            {deletedCount > 0 && (
              <span className="inline-flex items-center gap-1 border-[2px] border-red-300 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <Trash2 size={10} />
                {deletedCount} removed
              </span>
            )}
            {preview.cycleToIndex !== null && (
              <span className="inline-flex items-center gap-1 border-[2px] border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                <Repeat2 size={12} />
                Cycle
              </span>
            )}
          </div>
          <h3 className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
            {preview.sourceName}
          </h3>
        </div>
      </div>

      {/* ── Visualization ── */}
      <div className="mt-4 overflow-x-auto custom-scrollbar pb-2">
        <div className="flex items-start gap-1 w-max pt-12 pb-2">
          {/* NULL sentinel — start */}
          <div className="flex items-center gap-1">
            <div className="mt-4 px-2 py-3 border-[3px] border-dashed border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-[#1a1a1c] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              NULL
            </div>
            <motion.div
              className={`mt-4 ${theme.accentText}`}
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRight size={12} strokeWidth={2.5} />
            </motion.div>
          </div>

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
                    className="flex items-start gap-1"
                  >
                    <div className="relative">
                      {/* ── Pointer Labels with Arrow Stalks ── */}
                      <AnimatePresence>
                        {isPointed && (
                          <motion.div
                            key={node.pointerNames.join(',')}
                            className="absolute left-0 right-0 flex flex-col items-center"
                            style={{ bottom: '100%', marginBottom: '6px' }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          >
                            {/* Pointer name badges — stacked vertically */}
                            <div className="flex flex-col items-center gap-1 mb-1">
                              {node.pointerNames.map((p) => {
                                const pc = getPtrColor(p);
                                return (
                                  <motion.div
                                    key={p}
                                    className={`px-2 py-0.5 border-[2px] ${pc.border} ${pc.bg} ${pc.text} text-[9px] font-black uppercase tracking-[0.18em] shadow-[2px_2px_0_rgba(0,0,0,0.3)] whitespace-nowrap`}
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.1 * node.pointerNames.indexOf(p) }}
                                  >
                                    {p}
                                  </motion.div>
                                );
                              })}
                            </div>
                            {/* Arrow stalk — drops down from labels into the node */}
                            <div className="flex flex-col items-center">
                              <div
                                className="w-[2px] h-3"
                                style={{ backgroundColor: getPtrColor(node.pointerNames[0]).glow.replace('0.3)', '0.8)') }}
                              />
                              <div
                                className="w-0 h-0"
                                style={{
                                  borderLeft: '4px solid transparent',
                                  borderRight: '4px solid transparent',
                                  borderTop: `5px solid ${getPtrColor(node.pointerNames[0]).glow.replace('0.3)', '0.9)')}`,
                                }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Glow ring for nodes with active pointers */}
                      {isPointed && (
                        <motion.div
                          className="absolute inset-0 -m-1 rounded-sm pointer-events-none"
                          style={{ boxShadow: `0 0 12px 2px ${getPtrColor(node.pointerNames[0]).glow}`, zIndex: -1, marginTop: '14px' }}
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}

                      {/* Trail fade for nodes that just lost pointers */}
                      {isTrail && (
                        <motion.div
                          className="absolute inset-0 -m-1"
                          style={{ marginTop: '14px' }}
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                          style={{
                            background: isSaffron
                              ? 'rgba(249,115,22,0.25)'
                              : 'rgba(59,130,246,0.25)',
                            border: `2px solid ${isSaffron ? '#f97316' : '#3b82f6'}`,
                            marginTop: '14px',
                          }}
                        />
                      )}

                      {/* ── Node Memory Block ── */}
                      <motion.div
                        animate={isPointed ? { scale: 1.06, y: -1 } : { scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                        className={`mt-4 flex items-stretch border-[3px] bg-white dark:bg-[#161618] ${
                          isPointed
                            ? `border-slate-900 dark:border-slate-300 shadow-[4px_4px_0_#0f172a] dark:shadow-[4px_4px_0_#000] z-10`
                            : isTrail
                              ? 'border-slate-500 dark:border-slate-500 shadow-[4px_4px_0_#64748b] dark:shadow-[4px_4px_0_#000]'
                              : 'border-slate-900 dark:border-[#555] shadow-[4px_4px_0_rgba(15,23,42,0.2)] dark:shadow-[4px_4px_0_#000]'
                        }`}
                      >
                        {/* Prev pointer slot (DLL only) */}
                        {preview.isDoublyLinked && (
                          <div className={`flex items-center justify-center px-2 border-r-[3px] ${
                            isPointed ? 'border-slate-900 dark:border-slate-300' : 'border-slate-900 dark:border-[#555]'
                          } bg-slate-100 dark:bg-[#222]`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="text-[7px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                prev
                              </div>
                              <div className={`w-2 h-2 rounded-full ${
                                isPointed ? 'bg-cyan-400 dark:bg-cyan-500' : 'bg-slate-400 dark:bg-slate-500'
                              }`} />
                            </div>
                          </div>
                        )}

                        {/* Data cell — center */}
                        <div className="flex flex-col items-center justify-center min-w-[52px] px-3 py-2">
                          <div className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                            data
                          </div>
                          <div className={`text-xl font-black leading-none mt-0.5 ${
                            isPointed ? theme.accentText : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {node.label}
                          </div>
                        </div>

                        {/* Next pointer slot */}
                        <div className={`flex items-center justify-center px-2 border-l-[3px] ${
                          isPointed ? 'border-slate-900 dark:border-slate-300' : 'border-slate-900 dark:border-[#555]'
                        } bg-slate-100 dark:bg-[#222]`}>
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="text-[7px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              next
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                              isPointed ? (isSaffron ? 'bg-orange-400' : 'bg-blue-400') : 'bg-slate-400 dark:bg-slate-500'
                            }`} />
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* ── Arrow Connectors Between Nodes ── */}
                    {index < arr.length - 1 && (
                      preview.isDoublyLinked ? (
                        <div className="mt-7 flex flex-col items-center gap-0 px-0.5">
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
                          className={`mt-10 flex items-center ${theme.accentText}`}
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

            {/* ── Deleted Ghost Nodes ── */}
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
                  className="flex items-start gap-1 pointer-events-none"
                >
                  <div className="relative">
                    <div className="mt-4 flex items-stretch border-[3px] border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950/40 shadow-[4px_4px_0_rgba(239,68,68,0.4)] relative overflow-hidden opacity-80">
                      {/* Strikethrough */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-full h-[3px] bg-red-600 dark:bg-red-500 rotate-[-12deg]" />
                      </div>
                      {preview.isDoublyLinked && (
                        <div className="flex items-center justify-center px-2 border-r-[3px] border-red-500 dark:border-red-700 bg-red-100 dark:bg-red-900/50">
                          <div className="w-2 h-2 rounded-full bg-red-400 dark:bg-red-500" />
                        </div>
                      )}
                      <div className="flex flex-col items-center justify-center min-w-[52px] px-3 py-2">
                        <div className="text-[7px] font-black uppercase tracking-[0.2em] text-red-500 dark:text-red-400">
                          del
                        </div>
                        <div className="text-xl font-black text-red-600 dark:text-red-400 leading-none mt-0.5">
                          {node.label}
                        </div>
                      </div>
                      <div className="flex items-center justify-center px-2 border-l-[3px] border-red-500 dark:border-red-700 bg-red-100 dark:bg-red-900/50">
                        <div className="w-2 h-2 rounded-full bg-red-400 dark:bg-red-500" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>

          {/* NULL sentinel — end */}
          <div className="flex items-center gap-1">
            <motion.div
              className={`mt-10 ${theme.accentText}`}
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <ArrowRight size={12} strokeWidth={2.5} />
            </motion.div>
            <div className="mt-4 px-2 py-3 border-[3px] border-dashed border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-[#1a1a1c] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              NULL
            </div>
          </div>
        </div>
      </div>

      {/* ── Pointer Legend ── */}
      {preview.nodes.some((n) => n.pointerNames.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t-[2px] border-slate-200 dark:border-[#333] pt-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mr-1 self-center">
            Pointers:
          </span>
          {Array.from(new Set(preview.nodes.flatMap((n) => n.pointerNames))).map((name) => {
            const pc = getPtrColor(name);
            return (
              <div key={name} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 border-[2px] ${pc.border} ${pc.bg}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {preview.cycleToIndex !== null && (
        <div className="mt-3 border-[2px] border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
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
