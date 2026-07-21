import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableMap } from '../../../types';
import { getThemeConfig, ThemeColor } from '../../theme/theme';
import { Maximize2 } from 'lucide-react';

export interface StackQueuePreview {
  sourceName: string;
  value: unknown[];
  type: 'stack' | 'queue';
}

const STACK_NAMES = /^(stack|stk|s)$/i;
const QUEUE_NAMES = /^(queue|q|deque|dq)$/i;

export function buildStackQueuePreview(variables: VariableMap): StackQueuePreview | null {
  // Check for explicit stacks first
  for (const [name, val] of Object.entries(variables)) {
    if (!Array.isArray(val) || val.length === 0) continue;
    if (STACK_NAMES.test(name)) {
      return { sourceName: name, value: val, type: 'stack' };
    }
  }
  // Check for queues
  for (const [name, val] of Object.entries(variables)) {
    if (!Array.isArray(val) || val.length === 0) continue;
    if (QUEUE_NAMES.test(name)) {
      return { sourceName: name, value: val, type: 'queue' };
    }
  }
  return null;
}

interface StackQueuePanelProps {
  preview: StackQueuePreview;
  themeColor: ThemeColor;
  onEnlarge?: () => void;
}

export const StackQueuePanel: React.FC<StackQueuePanelProps> = ({ preview, themeColor, onEnlarge }) => {
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';
  const isStack = preview.type === 'stack';

  const cellBase = `flex items-center justify-center border-[2px] font-mono text-xs font-bold shadow-[1px_1px_0_rgba(15,23,42,0.25)]`;
  const cellColor = isSaffron
    ? 'bg-orange-50 dark:bg-orange-950 border-orange-400 text-orange-800 dark:text-orange-200'
    : 'bg-blue-50 dark:bg-blue-950 border-blue-400 text-blue-800 dark:text-blue-200';
  const topCellColor = isSaffron
    ? 'bg-orange-400 border-orange-700 text-white'
    : 'bg-blue-400 border-blue-700 text-white';

  const displayItems = preview.value.slice(0, 12);

  return (
    <div className="border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)]">
        <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${theme.accentText}`}>
          {isStack ? 'Stack (LIFO)' : 'Queue (FIFO)'} — <span className="font-mono">{preview.sourceName}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{preview.value.length} items</span>
          {onEnlarge && (
            <button onClick={onEnlarge} className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300" title="Enlarge">
              <Maximize2 size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="p-3">
        {isStack ? (
          // Stack: vertical column, top at the top
          <div className="flex flex-col-reverse gap-1 items-center max-h-[200px] overflow-y-auto custom-scrollbar py-1">
            <div className="w-full flex justify-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">BOTTOM</span>
            </div>
            <AnimatePresence>
              {displayItems.map((item, i) => {
                const isTop = i === displayItems.length - 1;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className={`${cellBase} w-24 h-8 ${isTop ? topCellColor : cellColor}`}
                  >
                    {String(item)}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div className="w-full flex justify-center">
              <span className="text-[8px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">↑ TOP</span>
            </div>
          </div>
        ) : (
          // Queue: horizontal row, head on the left
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-1">
              <div className="flex flex-col items-center shrink-0">
                <span className="text-[8px] font-black text-slate-600 dark:text-slate-400 uppercase mb-1">FRONT →</span>
              </div>
              <AnimatePresence>
                {displayItems.map((item, i) => {
                  const isFront = i === 0;
                  const isBack = i === displayItems.length - 1;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className={`flex flex-col items-center shrink-0`}
                    >
                      <div className={`${cellBase} w-10 h-8 ${isFront ? topCellColor : cellColor}`}>
                        {String(item)}
                      </div>
                      {(isFront || isBack) && (
                        <span className="text-[7px] font-bold text-slate-400 mt-0.5">
                          {isFront ? 'head' : 'tail'}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div className="flex flex-col items-center shrink-0">
                <span className="text-[8px] font-black text-slate-600 dark:text-slate-400 uppercase mb-1">→ BACK</span>
              </div>
            </div>
          </div>
        )}
        {preview.value.length > 12 && (
          <p className="text-[9px] text-center text-slate-400 mt-2">+{preview.value.length - 12} more items</p>
        )}
      </div>
    </div>
  );
};
