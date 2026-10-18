import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { VariableMap } from '../../../types';
import { getThemeConfig, ThemeColor } from '../../theme/theme';
import { Maximize2 } from 'lucide-react';

export interface HeapPreview {
  sourceName: string;
  value: number[];
  isMinHeap: boolean;
}

const HEAP_NAMES = /^(min|max)?heap$|^pq$|^priorityqueue$|^h$/i;

export function buildHeapPreview(variables: VariableMap): HeapPreview | null {
  const entries = Object.entries(variables).filter(([name, val]) => {
    if (!Array.isArray(val) || val.length < 2) return false;
    if (!val.every((cell: unknown) => typeof cell === 'number')) return false;
    return HEAP_NAMES.test(name);
  });
  if (entries.length === 0) return null;
  const [name, val] = entries[0];
  const isMinHeap = /min/i.test(name) || name.toLowerCase() === 'pq';
  return { sourceName: name, value: val as number[], isMinHeap };
}

interface HeapNodeLayout {
  value: number;
  index: number;
  x: number;
  y: number;
  parentIndex: number | null;
}

function buildHeapLayout(arr: number[]): HeapNodeLayout[] {
  const nodes: HeapNodeLayout[] = [];
  const levelHeight = 60;
  const baseWidth = 300;
  const display = arr.slice(0, 15);

  for (let i = 0; i < display.length; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const posInLevel = i - (Math.pow(2, level) - 1);
    const totalInLevel = Math.pow(2, level);
    const spacing = baseWidth / (totalInLevel + 1);
    nodes.push({
      value: display[i],
      index: i,
      x: spacing * (posInLevel + 1),
      y: level * levelHeight + 30,
      parentIndex: i === 0 ? null : Math.floor((i - 1) / 2),
    });
  }
  return nodes;
}

interface HeapPanelProps {
  preview: HeapPreview;
  themeColor: ThemeColor;
  onEnlarge?: () => void;
}

export const HeapPanel: React.FC<HeapPanelProps> = ({ preview, themeColor, onEnlarge }) => {
  const theme = getThemeConfig(themeColor);
  const nodes = useMemo(() => buildHeapLayout(preview.value), [preview.value]);
  const maxY = nodes.reduce((m, n) => Math.max(m, n.y), 0) + 50;
  const isSaffron = themeColor === 'saffron';

  return (
    <div className="border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)]">
      <div className="flex items-center justify-between px-3 py-1.5 border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)]">
        <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${theme.accentText}`}>
          {preview.isMinHeap ? 'Min-Heap' : 'Max-Heap'} — <span className="font-mono">{preview.sourceName}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{preview.value.length} nodes</span>
          {onEnlarge && (
            <button onClick={onEnlarge} className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300" title="Enlarge">
              <Maximize2 size={12} />
            </button>
          )}
        </div>
      </div>

      <div role="region" aria-label={`${preview.sourceName} heap diagram`} tabIndex={0} className="diagram-viewport overflow-x-auto">
        <svg width="300" height={maxY} className="mx-auto block">
          {nodes.map(node => {
            if (node.parentIndex === null) return null;
            const parent = nodes[node.parentIndex];
            return (
              <line key={`e-${node.index}`} x1={parent.x} y1={parent.y} x2={node.x} y2={node.y}
                className="stroke-slate-400 dark:stroke-slate-600" strokeWidth={1.5} />
            );
          })}
          {nodes.map(node => (
            <g key={node.index}>
              <circle cx={node.x} cy={node.y} r={18}
                className={
                  node.index === 0
                    ? isSaffron ? 'fill-orange-400 dark:fill-orange-600 stroke-orange-700' : 'fill-blue-400 dark:fill-blue-600 stroke-blue-700'
                    : isSaffron ? 'fill-orange-100 dark:fill-orange-950 stroke-orange-400' : 'fill-blue-100 dark:fill-blue-950 stroke-blue-400'
                }
                strokeWidth={2}
              />
              <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
                fontSize={node.index === 0 ? 12 : 11} fontWeight={node.index === 0 ? 'bold' : 'normal'}
                className={node.index === 0 ? 'fill-white' : 'fill-slate-700 dark:fill-slate-200'}>
                {node.value}
              </text>
              <text x={node.x} y={node.y + 27} textAnchor="middle" fontSize={8} className="fill-slate-400 dark:fill-slate-600">
                [{node.index}]
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-t-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)] overflow-x-auto no-scrollbar">
        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 shrink-0 mr-1">arr:</span>
        {preview.value.slice(0, 20).map((val, i) => (
          <motion.div key={i} layout
            className={`flex-shrink-0 w-8 h-6 flex items-center justify-center border-[2px] text-[10px] font-bold font-mono ${
              i === 0
                ? isSaffron ? 'bg-orange-400 border-orange-700 text-white' : 'bg-blue-400 border-blue-700 text-white'
                : isSaffron ? 'bg-orange-50 dark:bg-orange-950 border-orange-400 text-orange-800 dark:text-orange-200' : 'bg-blue-50 dark:bg-blue-950 border-blue-400 text-blue-800 dark:text-blue-200'
            }`}
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            {val}
          </motion.div>
        ))}
        {preview.value.length > 20 && <span className="text-[9px] text-slate-400 ml-1">+{preview.value.length - 20}</span>}
      </div>
    </div>
  );
};
