import React, { useRef, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, ArrowRight, ArrowLeft, ChevronsDown, Repeat2, Trash2, Maximize2 } from 'lucide-react';
import { VariableMap } from '../../../types';
import { getThemeConfig, ThemeColor } from '../../theme/theme';

export interface LinkedListNodeView {
  id: string;
  label: string;
  pointerNames: string[];
  nodeAddress?: string;
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

const T = {
  nullText: 'NULL',
  delText: 'del',
  prevText: 'prev',
  dataText: 'data',
  nextText: 'next',
  pointersLabel: 'Pointers:',
  cyclePrefix: 'Tail reconnects to node ',
  cycleSuffix: ', so this list contains a cycle.',
  truncatedLabel: 'Visualization truncated after 16 nodes to keep the panel readable.',
};

function getNodeLabel(value: Record<string, unknown>, fallbackIndex: number): string {
  const candidates = ['val', 'value', 'data', 'id', 'label', 'name', 'key'];
  const entries = Object.entries(value);
  for (const candidate of candidates) {
    const current = entries.find(([k]) => k === candidate)?.[1];
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
    const addressToIndex = new Map<string, number>();
    const refToIndex = new WeakMap<object, number>();
    const nodes: LinkedListNodeView[] = [];
    let current: unknown = startNode;
    let cycleToIndex: number | null = null;
    let truncated = false;
    let isDoublyLinked = false;

    while (isPlainObject(current) && 'next' in current) {
      if ('prev' in current) isDoublyLinked = true;

      const objCurrent = current as Record<string, unknown>;
      const nodeAddress = (typeof objCurrent.__addr === 'string' || typeof objCurrent.__addr === 'number')
        ? String(objCurrent.__addr)
        : null;

      if (nodeAddress && addressToIndex.has(nodeAddress)) {
        cycleToIndex = addressToIndex.get(nodeAddress)!;
        break;
      }
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
      if (nodeAddress) {
        addressToIndex.set(nodeAddress, nextIndex);
      }

      nodes.push({
        id: `${sourceName}-${nextIndex}`,
        label: getNodeLabel(current, nextIndex),
        pointerNames: [],
        nodeAddress: nodeAddress || undefined,
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
export const POINTER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string; hex: string }> = {
  head:     { bg: 'bg-emerald-500', text: 'text-white',       border: 'border-emerald-600', glow: 'rgba(16,185,129,0.3)', hex: '#10b981' },
  root:     { bg: 'bg-emerald-500', text: 'text-white',       border: 'border-emerald-600', glow: 'rgba(16,185,129,0.3)', hex: '#10b981' },
  tail:     { bg: 'bg-purple-500',  text: 'text-white',       border: 'border-purple-600',  glow: 'rgba(168,85,247,0.3)', hex: '#a855f7' },
  curr:     { bg: 'bg-amber-500',   text: 'text-black',       border: 'border-amber-600',   glow: 'rgba(245,158,11,0.3)', hex: '#f59e0b' },
  current:  { bg: 'bg-amber-500',   text: 'text-black',       border: 'border-amber-600',   glow: 'rgba(245,158,11,0.3)', hex: '#f59e0b' },
  parent:   { bg: 'bg-orange-500',  text: 'text-white',       border: 'border-orange-600',  glow: 'rgba(249,115,22,0.3)', hex: '#f97316' },
  temp:     { bg: 'bg-rose-500',    text: 'text-white',       border: 'border-rose-600',     glow: 'rgba(244,63,94,0.3)',  hex: '#f43f5e' },
  prev:     { bg: 'bg-cyan-500',    text: 'text-black',       border: 'border-cyan-600',     glow: 'rgba(6,182,212,0.3)',  hex: '#06b6d4' },
  n:        { bg: 'bg-pink-500',    text: 'text-white',       border: 'border-pink-600',     glow: 'rgba(236,72,153,0.3)', hex: '#ec4899' },
  node:     { bg: 'bg-pink-500',    text: 'text-white',       border: 'border-pink-600',     glow: 'rgba(236,72,153,0.3)', hex: '#ec4899' },
  nxtNode:  { bg: 'bg-sky-500',     text: 'text-white',       border: 'border-sky-600',      glow: 'rgba(14,165,233,0.3)', hex: '#0ea5e9' },
  nextTemp: { bg: 'bg-sky-500',     text: 'text-white',       border: 'border-sky-600',      glow: 'rgba(14,165,233,0.3)', hex: '#0ea5e9' },
  found:    { bg: 'bg-lime-500',    text: 'text-black',       border: 'border-lime-600',     glow: 'rgba(132,204,22,0.3)', hex: '#84cc16' },
  target:   { bg: 'bg-lime-500',    text: 'text-black',       border: 'border-lime-600',     glow: 'rgba(132,204,22,0.3)', hex: '#84cc16' },
  left:     { bg: 'bg-sky-500',     text: 'text-white',       border: 'border-sky-600',      glow: 'rgba(14,165,233,0.3)', hex: '#0ea5e9' },
  right:    { bg: 'bg-indigo-500',  text: 'text-white',       border: 'border-indigo-600',   glow: 'rgba(99,102,241,0.3)', hex: '#6366f1' },
};

export function getPtrColor(name: string) {
  return Object.entries(POINTER_COLORS).find(([k]) => k === name)?.[1] || DEFAULT_PTR_COLOR;
}

export const LinkedListPanel: React.FC<{
  preview: LinkedListPreview;
  themeColor: ThemeColor;
  onEnlarge?: () => void;
}> = ({ preview, themeColor, onEnlarge }) => {
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';

  // Track previous nodes to detect deletions
  const prevNodesRef = useRef<LinkedListNodeView[]>([]);
  const prevPointedIds = useRef<Set<string>>(new Set());
  const trailIds = useRef<Set<string>>(new Set());

  // Build the merged render list in-place (current nodes + recently deleted ghost nodes)
  const renderNodes = useMemo<RenderNode[]>(() => {
    const prevNodes = prevNodesRef.current;
    const currentNodes = [...preview.nodes];
    const currentLabels = new Set(preview.nodes.map((n) => n.label));

    const result: RenderNode[] = [];
    let prevIdx = 0;
    let currIdx = 0;

    while (prevIdx < prevNodes.length || currIdx < currentNodes.length) {
      if (prevIdx >= prevNodes.length) {
        // Only new nodes left
        result.push({ ...currentNodes[currIdx], deleted: false, position: currIdx });
        currIdx++;
      } else if (currIdx >= currentNodes.length) {
        // Only deleted nodes left
        const prev = prevNodes[prevIdx];
        if (!result.some((r) => r.label === prev.label)) {
          result.push({
            ...prev,
            id: `deleted-${prev.id}`,
            pointerNames: [],
            deleted: true,
            position: -1,
          });
        }
        prevIdx++;
      } else {
        const prevNode = prevNodes[prevIdx];
        const currNode = currentNodes[currIdx];

        if (prevNode.label === currNode.label) {
          result.push({ ...currNode, deleted: false, position: currIdx });
          prevIdx++;
          currIdx++;
        } else {
          const isDeleted = !currentNodes.slice(currIdx).some((n) => n.label === prevNode.label);
          if (isDeleted) {
            if (!result.some((r) => r.label === prevNode.label)) {
              result.push({
                ...prevNode,
                id: `deleted-${prevNode.id}`,
                pointerNames: [],
                deleted: true,
                position: -1,
              });
            }
            prevIdx++;
          } else {
            result.push({ ...currNode, deleted: false, position: currIdx });
            currIdx++;
          }
        }
      }
    }

    return result;
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

  // Measure positions for the cycle overlay
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPositions = new Map<string, { x: number; y: number; width: number; height: number }>();

    preview.nodes.forEach((node) => {
      const el = containerRef.current?.querySelector(`[id="node-mem-${node.id}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        newPositions.set(node.id, {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    });

    let changed = newPositions.size !== nodePositions.size;
    if (!changed) {
      for (const [key, val] of newPositions.entries()) {
        const other = nodePositions.get(key);
        if (!other || other.x !== val.x || other.y !== val.y || other.width !== val.width || other.height !== val.height) {
          changed = true;
          break;
        }
      }
    }
    if (changed) {
      setNodePositions(newPositions);
    }
  });

  const cyclePath = useMemo(() => {
    if (preview.cycleToIndex === null || preview.nodes.length === 0) return null;
    const tailNode = preview.nodes.at(-1);
    const targetNode = preview.nodes.at(preview.cycleToIndex);

    const tailPos = tailNode ? nodePositions.get(tailNode.id) : undefined;
    const targetPos = targetNode ? nodePositions.get(targetNode.id) : undefined;

    if (!tailPos || !targetPos) return null;

    if (preview.cycleToIndex === 0) {
      // Circular list loop-back: right edge of tail to left edge of head
      const startX = tailPos.x + tailPos.width;
      const startY = tailPos.y + tailPos.height / 2;

      const endX = targetPos.x;
      const endY = targetPos.y + targetPos.height / 2;

      const dropY = Math.max(tailPos.y, targetPos.y) + tailPos.height + 24;

      return `M ${startX} ${startY} C ${startX + 25} ${startY}, ${startX + 25} ${dropY}, ${startX} ${dropY} L ${endX} ${dropY} C ${endX - 25} ${dropY}, ${endX - 25} ${endY}, ${endX} ${endY}`;
    } else {
      // General cycle reconnects in middle
      const startX = tailPos.x + tailPos.width / 2;
      const startY = tailPos.y + tailPos.height - 4;

      const endX = targetPos.x + targetPos.width / 2;
      const endY = targetPos.y + targetPos.height - 4;

      const drop = 48;
      const cp1x = startX;
      const cp1y = startY + drop;
      const cp2x = endX;
      const cp2y = endY + drop;

      return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
    }
  }, [preview.cycleToIndex, preview.nodes, nodePositions]);

  return (
    <section className={`${theme.panelClass} p-3`}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={theme.badgeClass}>
              <GitBranch size={12} />
              {preview.cycleToIndex === 0
                ? preview.isDoublyLinked
                  ? 'Circular Doubly Linked List'
                  : 'Circular Singly Linked List'
                : preview.isDoublyLinked
                ? 'Doubly Linked List'
                : 'Singly Linked List'}
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
            {preview.cycleToIndex !== null && preview.cycleToIndex !== 0 && (
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
        {onEnlarge && (
          <button
            onClick={onEnlarge}
            className="p-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-all hover:translate-y-[1px] hover:shadow-none shrink-0"
            title="Enlarge diagram"
          >
            <Maximize2 size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Visualization ── */}
      <div className="mt-4 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
        <div className="flex items-start gap-1 w-max pt-12 pb-14 px-12 relative" ref={containerRef}>
          {/* NULL sentinel — start */}
          {preview.cycleToIndex !== 0 && (
            <div className="flex items-center gap-1">
              <div className="mt-4 px-2 py-3 border-[3px] border-dashed border-slate-400 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface)] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {T.nullText}
              </div>
              <motion.div
                className={`mt-4 ${theme.accentText}`}
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight size={12} strokeWidth={2.5} />
              </motion.div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {renderNodes.map((node, index, arr) => {
              const isPointed = node.pointerNames.length > 0;
              const isTrail = trailIds.current.has(node.id);
              const isDeleted = node.deleted;

              return (
                <motion.div
                  key={node.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={isDeleted ? { opacity: 0, scale: 0.6, y: 28 } : { opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.4, y: 40 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex items-start gap-1"
                >
                  <div className="relative" id={`node-block-${node.id}`}>
                    {isDeleted ? (
                      /* Deleted node styling in-place */
                      <div className="mt-4 flex items-stretch border-[3px] border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950/40 shadow-[4px_4px_0_rgba(239,68,68,0.4)] relative overflow-hidden opacity-80 pointer-events-none">
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
                            {T.delText}
                          </div>
                          <div className="text-xl font-black text-red-600 dark:text-red-400 leading-none mt-0.5">
                            {node.label}
                          </div>
                        </div>
                        <div className="flex items-center justify-center px-2 border-l-[3px] border-red-500 dark:border-red-700 bg-red-100 dark:bg-red-900/50">
                          <div className="w-2 h-2 rounded-full bg-red-400 dark:bg-red-500" />
                        </div>
                      </div>
                    ) : (
                      <>
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
                              <div className="flex flex-col items-center mt-0.5">
                                <svg width="12" height="18" viewBox="0 0 12 18" className="overflow-visible">
                                  <defs>
                                    <linearGradient id={`ptr-grad-${node.id}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor={getPtrColor(node.pointerNames[0]).hex} stopOpacity="0.4" />
                                      <stop offset="100%" stopColor={getPtrColor(node.pointerNames[0]).hex} stopOpacity="1" />
                                    </linearGradient>
                                  </defs>
                                  <line x1="6" y1="0" x2="6" y2="12" stroke={`url(#ptr-grad-${node.id})`} strokeWidth="2.5" strokeLinecap="round" />
                                  <polygon points="2,11 6,17 10,11" fill={getPtrColor(node.pointerNames[0]).hex} />
                                </svg>
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
                            className="absolute inset-0 -m-1 pointer-events-none"
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
                          id={`node-mem-${node.id}`}
                          animate={isPointed ? { scale: 1.06, y: -1 } : { scale: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                          className={`mt-4 flex items-stretch border-[3px] bg-white dark:bg-[var(--dark-surface-2)] ${
                            isPointed
                              ? `border-slate-900 dark:border-slate-300 shadow-[4px_4px_0_#0f172a] dark:shadow-[4px_4px_0_var(--dark-shadow)] z-10`
                              : isTrail
                                ? 'border-slate-500 dark:border-slate-500 shadow-[4px_4px_0_#64748b] dark:shadow-[4px_4px_0_var(--dark-shadow)]'
                                : 'border-slate-900 dark:border-[var(--dark-border-bright)] shadow-[4px_4px_0_rgba(15,23,42,0.2)] dark:shadow-[4px_4px_0_var(--dark-shadow)]'
                          }`}
                        >
                          {/* Prev pointer slot (DLL only) */}
                          {preview.isDoublyLinked && (
                            <div className={`flex items-center justify-center px-2 border-r-[3px] ${
                              isPointed ? 'border-slate-900 dark:border-slate-300' : 'border-slate-900 dark:border-[#555]'
                            } bg-slate-100 dark:bg-[var(--dark-surface-3)]`}>
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="text-[7px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                  {T.prevText}
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
                              {T.dataText}
                            </div>
                            <div className={`text-xl font-black leading-none mt-0.5 ${
                              isPointed ? theme.accentText : 'text-slate-900 dark:text-slate-100'
                            }`}>
                              {node.label}
                            </div>
                          </div>

                          {/* Next pointer slot */}
                          <div className={`flex items-center justify-center px-2 border-l-[3px] ${
                            isPointed ? 'border-slate-900 dark:border-slate-300' : 'border-slate-900 dark:border-[var(--dark-border-bright)]'
                          } bg-slate-100 dark:bg-[var(--dark-surface-3)]`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="text-[7px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                {T.nextText}
                              </div>
                              <div className={`w-2 h-2 rounded-full ${
                                isPointed ? (isSaffron ? 'bg-orange-400' : 'bg-blue-400') : 'bg-slate-400 dark:bg-slate-500'
                              }`} />
                            </div>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </div>

                  {/* ── Arrow Connectors Between Nodes ── */}
                  {index < arr.length - 1 && !isDeleted && !arr.at(index + 1)?.deleted && (
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
          </AnimatePresence>

          {/* NULL sentinel — end */}
          {preview.cycleToIndex !== 0 && (
            <div className="flex items-center gap-1">
              <motion.div
                className={`mt-10 ${theme.accentText}`}
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <ArrowRight size={12} strokeWidth={2.5} />
              </motion.div>
              <div className="mt-4 px-2 py-3 border-[3px] border-dashed border-slate-400 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface)] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {T.nullText}
              </div>
            </div>
          )}

          {/* Dynamic Cycle Path SVG overlay */}
          {cyclePath && (
            <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-20">
              <defs>
                <marker
                  id="cycle-arrow"
                  viewBox="0 0 10 10"
                  refX="10"
                  refY="5"
                  markerUnits="strokeWidth"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 L 3 5 z" fill={isSaffron ? '#f97316' : '#3b82f6'} />
                </marker>
              </defs>
              <motion.path
                d={cyclePath}
                stroke={isSaffron ? '#f97316' : '#3b82f6'}
                strokeWidth="3"
                fill="none"
                strokeDasharray="4 3"
                markerEnd="url(#cycle-arrow)"
                markerStart={preview.cycleToIndex === 0 && preview.isDoublyLinked ? 'url(#cycle-arrow)' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
          )}
        </div>
      </div>

      {/* ── Pointer Legend ── */}
      {preview.nodes.some((n) => n.pointerNames.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2 border-t-[2px] border-slate-200 dark:border-[var(--dark-border-dim)] pt-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mr-1 self-center">
            {T.pointersLabel}
          </span>
          {Array.from(new Set<string>(preview.nodes.flatMap((n) => n.pointerNames))).map((name) => {
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
          {T.cyclePrefix}{preview.cycleToIndex + 1}{T.cycleSuffix}
        </div>
      )}

      {preview.truncated && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {T.truncatedLabel}
        </div>
      )}
    </section>
  );
};
