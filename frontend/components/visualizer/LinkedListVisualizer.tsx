import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, ArrowRight, Repeat2 } from 'lucide-react';
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

    while (isPlainObject(current) && 'next' in current) {
      if (refToIndex.has(current)) {
        cycleToIndex = refToIndex.get(current)!;
        break;
      }

      if (nodes.length >= 10) {
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

    const preview = { sourceName, nodes, cycleToIndex, truncated, score };
    if (!bestPreview || preview.score > bestPreview.score) {
      bestPreview = preview;
    }
  }

  if (!bestPreview || bestPreview.nodes.length < 2) return null;

  const { score: _score, ...preview } = bestPreview;
  return preview;
}

export const LinkedListPanel: React.FC<{
  preview: LinkedListPreview;
  themeColor: ThemeColor;
}> = ({ preview, themeColor }) => {
  const theme = getThemeConfig(themeColor);

  return (
    <section className={`${theme.panelClass} p-4`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={theme.badgeClass}>
              <GitBranch size={12} />
              Linked List
            </span>
          </div>
          <h3 className="mt-3 text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
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

      <div className="mt-5 flex flex-wrap items-start gap-2">
        <AnimatePresence mode="popLayout">
          {preview.nodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`min-w-[96px] border-[2px] px-3 py-3 ${theme.accentBorder} ${theme.accentSoftBg}`}
              >
                <div className="flex min-h-5 flex-wrap gap-1">
                  {node.pointerNames.map((pointer) => (
                    <span
                      key={pointer}
                      className={`border border-slate-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white ${theme.accentBg}`}
                    >
                      {pointer}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Node {index + 1}
                </div>
                <div className="mt-1 text-center text-xl font-black text-slate-900 dark:text-slate-100">
                  {node.label}
                </div>
              </motion.div>

              {index < preview.nodes.length - 1 && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className={`mt-8 flex items-center ${theme.accentText}`}
                >
                  <ArrowRight size={18} />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </AnimatePresence>
      </div>

      {preview.cycleToIndex !== null && (
        <div className="mt-4 border-[2px] border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          Tail reconnects to node {preview.cycleToIndex + 1}, so this list contains a cycle.
        </div>
      )}

      {preview.truncated && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Visualization truncated after 10 nodes to keep the panel readable.
        </div>
      )}
    </section>
  );
};
