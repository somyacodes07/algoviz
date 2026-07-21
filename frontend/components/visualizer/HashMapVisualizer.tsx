import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableMap } from '../../../types';
import { getThemeConfig, ThemeColor } from '../../theme/theme';
import { Maximize2 } from 'lucide-react';

export interface HashMapPreview {
  sourceName: string;
  entries: [string, unknown][];
  isMap: boolean;
}

const HASHMAP_NAMES = /^(char|word|freq|count|memo|cache|hash|map|lookup|table|index|dict).*$/i;

function isPlainObjectMap(val: unknown): val is Record<string, unknown> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return false;
  const keys = Object.keys(val as object);
  if (keys.length === 0) return false;
  // All values must be primitives (numbers, strings, booleans)
  return keys.every(k => {
    const v = (val as Record<string, unknown>)[k];
    return typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean';
  });
}

export function buildHashMapPreview(variables: VariableMap): HashMapPreview | null {
  const entries = Object.entries(variables).filter(([name, val]) => {
    if (!HASHMAP_NAMES.test(name)) return false;
    return isPlainObjectMap(val);
  });
  if (entries.length === 0) return null;
  const [name, val] = entries[0];
  const mapEntries = Object.entries(val as Record<string, unknown>).slice(0, 24);
  return { sourceName: name, entries: mapEntries, isMap: false };
}

interface HashMapPanelProps {
  preview: HashMapPreview;
  themeColor: ThemeColor;
  prevVariables?: VariableMap;
  onEnlarge?: () => void;
}

export const HashMapPanel: React.FC<HashMapPanelProps> = ({ preview, themeColor, prevVariables, onEnlarge }) => {
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';

  const prevEntries: Record<string, unknown> = useMemo(() => {
    if (!prevVariables) return {};
    const prev = prevVariables[preview.sourceName];
    if (isPlainObjectMap(prev)) return prev as Record<string, unknown>;
    return {};
  }, [prevVariables, preview.sourceName]);

  return (
    <div className="border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)]">
        <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${theme.accentText}`}>
          HashMap — <span className="font-mono">{preview.sourceName}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{preview.entries.length} entries</span>
          {onEnlarge && (
            <button onClick={onEnlarge} className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300" title="Enlarge">
              <Maximize2 size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {preview.entries.map(([key, value]) => {
            const isNew = !(key in prevEntries);
            const isChanged = !isNew && String(prevEntries[key]) !== String(value);

            return (
              <motion.div
                key={key}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`flex border-[2px] overflow-hidden shadow-[1px_1px_0_rgba(15,23,42,0.3)] ${
                  isNew
                    ? 'border-yellow-400 dark:border-yellow-600'
                    : isChanged
                      ? isSaffron
                        ? 'border-saffron-500 dark:border-saffron-600'
                        : 'border-blue-500 dark:border-blue-600'
                      : 'border-slate-300 dark:border-[var(--dark-border)]'
                }`}
              >
                {/* Key cell */}
                <div className={`px-2 py-1.5 text-[10px] font-bold font-mono border-r-[2px] shrink-0 flex items-center ${
                  isNew
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-400 dark:border-yellow-600'
                    : isChanged
                      ? isSaffron
                        ? 'bg-saffron-100 dark:bg-saffron-900/30 text-saffron-800 dark:text-saffron-300 border-saffron-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-400'
                      : 'bg-slate-100 dark:bg-[var(--dark-surface-2)] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-[var(--dark-border)]'
                }`}>
                  {String(key).length > 6 ? String(key).slice(0, 6) + '…' : String(key)}
                </div>
                {/* Value cell */}
                <div className="px-2 py-1.5 text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-[var(--dark-surface)] flex items-center flex-1 min-w-0">
                  <span className="truncate">{String(value)}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {preview.entries.length === 0 && (
          <div className="col-span-3 text-center text-[11px] text-slate-400 dark:text-slate-600 py-4">
            Empty map
          </div>
        )}
      </div>
    </div>
  );
};
