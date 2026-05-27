import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns, Grid, Play, RefreshCw, Sparkles, ArrowDown } from 'lucide-react';
import { VariableMap } from '../../../types';
import { getThemeConfig, ThemeColor } from '../../theme/theme';
import { getPtrColor } from './LinkedListVisualizer';

interface ArrayGridVisualizerProps {
  variables: VariableMap;
  prevVariables: VariableMap;
  themeColor: ThemeColor;
}

export interface ArrayGridPreview {
  type: 'array' | 'matrix';
  sourceName: string;
  value: any[];
  prevValue?: any[];
}

function isMatrix(value: unknown): value is any[][] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const firstRow = value[0];
  if (!Array.isArray(firstRow) || firstRow.length === 0) return false;
  
  // Must be a grid (all rows have same length) and contains primitives
  const cols = firstRow.length;
  return value.every(row => 
    Array.isArray(row) && 
    row.length === cols && 
    row.every(cell => cell === null || typeof cell === 'number' || typeof cell === 'string' || typeof cell === 'boolean')
  );
}

function isPrimitiveArray(value: unknown): value is any[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(cell => cell === null || typeof cell === 'number' || typeof cell === 'string' || typeof cell === 'boolean')
  );
}

export function buildArrayGridPreview(variables: VariableMap, prevVariables: VariableMap): ArrayGridPreview | null {
  // Scan for 2D matrices first (higher priority)
  const matrixEntries = Object.entries(variables).filter(([, val]) => isMatrix(val));
  if (matrixEntries.length > 0) {
    // Prioritize name with 'grid', 'matrix', 'board', 'table'
    const best = matrixEntries.find(([name]) => /grid|matrix|board|table/i.test(name)) || matrixEntries[0];
    return {
      type: 'matrix',
      sourceName: best[0],
      value: best[1] as any[][],
      prevValue: prevVariables[best[0]] as any[][],
    };
  }

  // Scan for 1D arrays
  const arrayEntries = Object.entries(variables).filter(([name, val]) => 
    isPrimitiveArray(val) && !/visited|seen|closed/i.test(name)
  );
  if (arrayEntries.length > 0) {
    const best = arrayEntries.find(([name]) => /arr|nums|list|values/i.test(name)) || arrayEntries[0];
    return {
      type: 'array',
      sourceName: best[0],
      value: best[1] as any[],
      prevValue: prevVariables[best[0]] as any[],
    };
  }

  return null;
}

export const ArrayGridVisualizer: React.FC<ArrayGridVisualizerProps> = ({
  variables,
  prevVariables,
  themeColor,
}) => {
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';

  const preview = useMemo(() => buildArrayGridPreview(variables, prevVariables), [variables, prevVariables]);

  if (!preview) return null;

  // ── 1D Array Rendering ──
  if (preview.type === 'array') {
    const arr = preview.value;
    const prevArr = preview.prevValue;

    // Detect active pointer index variables (e.g., i, j, left, right, mid, low, high)
    const activePointers = new Map<number, string[]>();
    Object.entries(variables).forEach(([name, val]) => {
      if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val < arr.length) {
        // Exclude common constants/boundaries
        const ignored = new Set(['n', 'limit', 'target', 'sum', 'length']);
        if (!ignored.has(name)) {
          if (!activePointers.has(val)) activePointers.set(val, []);
          activePointers.get(val)!.push(name);
        }
      }
    });

    // Detect changed indices
    const changedIndices = new Set<number>();
    if (prevArr && prevArr.length === arr.length) {
      for (let idx = 0; idx < arr.length; idx++) {
        if (prevArr[idx] !== arr[idx]) changedIndices.add(idx);
      }
    }

    // Detect swap pattern
    let swapIndices: [number, number] | null = null;
    if (changedIndices.size === 2 && prevArr) {
      const [a, b] = Array.from(changedIndices);
      if (prevArr[a] === arr[b] && prevArr[b] === arr[a]) {
        swapIndices = [a, b];
      }
    }

    const maxVal = Math.max(...arr.map(v => typeof v === 'number' ? Math.abs(v) : 1), 1);

    return (
      <section className={`${theme.panelClass} p-4`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={theme.badgeClass}>
              <Columns size={12} /> Array Visualizer
            </span>
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
            {preview.sourceName}
          </h3>
        </div>

        {swapIndices && (
          <div className={`mt-3 text-center text-[10px] font-black uppercase tracking-widest ${isSaffron ? 'text-saffron-600 dark:text-saffron-400' : 'text-blue-600 dark:text-blue-400'}`}>
            ↔ Swapped indexes [{swapIndices[0]}] ⟷ [{swapIndices[1]}]
          </div>
        )}

        <div className="mt-8 flex items-end gap-2 overflow-x-auto custom-scrollbar pb-4 pt-8 min-h-[160px] px-2">
          {arr.map((val, i) => {
            const hasPointers = activePointers.has(i);
            const pointers = activePointers.get(i) || [];
            const isChanged = changedIndices.has(i);
            const isSwapped = swapIndices && (i === swapIndices[0] || i === swapIndices[1]);

            // Heights for numeric bars
            const isNum = typeof val === 'number';
            const barHeight = isNum ? Math.max(12, (Math.abs(val) / maxVal) * 80) : 0;

            let cellBg = 'bg-white dark:bg-[var(--dark-surface-2)]';
            let cellBorder = 'border-slate-900 dark:border-[var(--dark-border)]';
            let cellText = 'text-slate-900 dark:text-slate-100';
            let barBg = 'bg-slate-200 dark:bg-slate-700/50';

            if (isSwapped) {
              cellBg = 'bg-yellow-50 dark:bg-yellow-950/20';
              cellBorder = 'border-yellow-500 dark:border-yellow-600';
              cellText = 'text-yellow-900 dark:text-yellow-300';
              barBg = 'bg-yellow-400 dark:bg-yellow-500';
            } else if (isChanged) {
              cellBg = isSaffron ? 'bg-saffron-50 dark:bg-saffron-950/20' : 'bg-blue-50 dark:bg-blue-950/20';
              cellBorder = isSaffron ? 'border-saffron-500 dark:border-saffron-600' : 'border-blue-500 dark:border-blue-600';
              cellText = isSaffron ? 'text-saffron-900 dark:text-saffron-300' : 'text-blue-900 dark:text-blue-300';
              barBg = isSaffron ? 'bg-saffron-400 dark:bg-saffron-500' : 'bg-blue-400 dark:bg-blue-500';
            } else if (hasPointers) {
              const pc = getPtrColor(pointers[0]);
              cellBg = pc.glow.replace('0.3)', '0.08)');
              cellBorder = pc.border.replace('border-', 'border-'); // fallback
              cellText = 'text-slate-900 dark:text-slate-100 font-black';
              barBg = pc.bg;
            }

            return (
              <motion.div
                key={i}
                layout
                className="flex flex-col items-center flex-1 min-w-[48px] max-w-[72px] relative"
              >
                {/* Pointer Arrow Flags */}
                {hasPointers && (
                  <div className="absolute -top-10 left-0 right-0 flex flex-col items-center z-20">
                    <div className="flex gap-0.5 pointer-events-none">
                      {pointers.map((p) => {
                        const pc = getPtrColor(p);
                        return (
                          <span
                            key={p}
                            className={`px-1.5 py-0.5 border-[2px] ${pc.border} ${pc.bg} ${pc.text} text-[9px] font-black uppercase tracking-wider shadow-[2px_2px_0_rgba(0,0,0,0.25)]`}
                          >
                            {p}
                          </span>
                        );
                      })}
                    </div>
                    <motion.div
                      animate={{ y: [0, 3, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-slate-900 dark:text-slate-300 mt-0.5"
                    >
                      <ArrowDown size={12} strokeWidth={3} />
                    </motion.div>
                  </div>
                )}

                {/* Numeric bar */}
                {isNum && (
                  <div className="w-full h-24 flex items-end justify-center mb-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                      className={`w-4 border-[2px] border-b-0 border-slate-900 dark:border-[var(--dark-border-bright)] ${barBg}`}
                    />
                  </div>
                )}

                {/* Memory cell block */}
                <div
                  className={`w-full text-center py-2.5 border-[3px] text-base font-mono font-black border-slate-900 ${cellBg} ${cellBorder} ${cellText} shadow-[3px_3px_0_#0f172a] dark:shadow-[3px_3px_0_var(--dark-shadow)] relative z-10`}
                >
                  {val === null ? 'nil' : String(val)}
                </div>

                {/* Index label */}
                <span className="text-[10px] mt-2 font-mono font-bold text-slate-400 dark:text-slate-500">
                  [{i}]
                </span>
              </motion.div>
            );
          })}
        </div>
      </section>
    );
  }

  // ── 2D Matrix Rendering ──
  const matrix = preview.value as any[][];
  const prevMatrix = preview.prevValue;

  const rowsCount = matrix.length;
  const colsCount = matrix[0].length;

  // Resolve coordinate pointers (row/col)
  // Mapping variables matching row coordinates: row, r, i, y
  // Mapping variables matching col coordinates: col, c, j, x
  const rowVars = ['row', 'r', 'i', 'y'];
  const colVars = ['col', 'c', 'j', 'x'];

  const activeRowPtrs = new Map<number, string[]>();
  const activeColPtrs = new Map<number, string[]>();

  Object.entries(variables).forEach(([name, val]) => {
    if (typeof val === 'number' && Number.isInteger(val)) {
      if (rowVars.includes(name) && val >= 0 && val < rowsCount) {
        if (!activeRowPtrs.has(val)) activeRowPtrs.set(val, []);
        activeRowPtrs.get(val)!.push(name);
      }
      if (colVars.includes(name) && val >= 0 && val < colsCount) {
        if (!activeColPtrs.has(val)) activeColPtrs.set(val, []);
        activeColPtrs.get(val)!.push(name);
      }
    }
  });

  // Calculate coordinates pointing to target cells
  const highlightedCells = new Map<string, string[]>(); // "r,c" -> pointer names list
  
  // Find intersections of matched row/col pointers (e.g. matching 'r' and 'c', or 'i' and 'j')
  // We also check all combinations
  Object.entries(variables).forEach(([rName, rVal]) => {
    if (rowVars.includes(rName) && typeof rVal === 'number' && rVal >= 0 && rVal < rowsCount) {
      Object.entries(variables).forEach(([cName, cVal]) => {
        if (colVars.includes(cName) && typeof cVal === 'number' && cVal >= 0 && cVal < colsCount) {
          // Exclude loops where name doesn't match coordinate pair logic (e.g. mix 'i' with 'c')
          const isMatchedPair = 
            (rName === 'r' && cName === 'c') ||
            (rName === 'row' && cName === 'col') ||
            (rName === 'i' && cName === 'j') ||
            (rName === 'y' && cName === 'x') ||
            // Fallback if they are the only coordinate variables in scope
            (rowVars.includes(rName) && colVars.includes(cName));

          if (isMatchedPair) {
            const key = `${rVal},${cVal}`;
            if (!highlightedCells.has(key)) highlightedCells.set(key, []);
            const label = `(${rName},${cName})`;
            if (!highlightedCells.get(key)!.includes(label)) {
              highlightedCells.get(key)!.push(label);
            }
          }
        }
      });
    }
  });

  // Find cell differences
  const changedCells = new Set<string>();
  if (prevMatrix && prevMatrix.length === rowsCount && prevMatrix[0].length === colsCount) {
    for (let r = 0; r < rowsCount; r++) {
      for (let c = 0; c < colsCount; c++) {
        if (prevMatrix[r][c] !== matrix[r][c]) {
          changedCells.add(`${r},${c}`);
        }
      }
    }
  }

  return (
    <section className={`${theme.panelClass} p-4`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={theme.badgeClass}>
            <Grid size={12} /> Grid/Matrix Visualizer
          </span>
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
          {preview.sourceName}
        </h3>
      </div>

      <div className="mt-6 overflow-auto custom-scrollbar pb-3 max-h-[360px] flex justify-center">
        <div className="grid grid-cols-[auto_1fr] gap-x-2 pt-8 pl-8">
          {/* Top Column Labels */}
          <div className="col-start-2 flex">
            {Array.from({ length: colsCount }).map((_, c) => {
              const pointers = activeColPtrs.get(c) || [];
              const hasColPointers = pointers.length > 0;
              return (
                <div
                  key={`col-head-${c}`}
                  className="w-14 h-8 flex flex-col items-center justify-end relative"
                >
                  {hasColPointers && (
                    <div className="absolute -top-7 flex flex-col items-center">
                      <span className="bg-cyan-500 text-black border border-cyan-700 text-[8px] font-black px-1 py-0.2 shadow-[1px_1px_0_rgba(0,0,0,1)] uppercase">
                        {pointers.join(',')}
                      </span>
                      <ArrowDown size={8} className="text-cyan-600" />
                    </div>
                  )}
                  <span className={`text-[10px] font-mono font-bold ${hasColPointers ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-600'}`}>
                    [{c}]
                  </span>
                </div>
              );
            })}
          </div>

          {/* Left Row Labels + Matrix cells */}
          <div className="col-start-1 flex flex-col">
            {Array.from({ length: rowsCount }).map((_, r) => {
              const pointers = activeRowPtrs.get(r) || [];
              const hasRowPointers = pointers.length > 0;
              return (
                <div
                  key={`row-head-${r}`}
                  className="h-14 w-8 flex items-center justify-end pr-2 relative"
                >
                  {hasRowPointers && (
                    <div className="absolute -left-12 flex items-center">
                      <span className="bg-purple-500 text-white border border-purple-700 text-[8px] font-black px-1 py-0.2 shadow-[1px_1px_0_rgba(0,0,0,1)] uppercase">
                        {pointers.join(',')}
                      </span>
                      <span className="text-purple-500 font-bold ml-0.5">→</span>
                    </div>
                  )}
                  <span className={`text-[10px] font-mono font-bold ${hasRowPointers ? 'text-purple-500' : 'text-slate-400 dark:text-slate-600'}`}>
                    [{r}]
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cells grid container */}
          <div
            className="col-start-2 grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))`,
            }}
          >
            {matrix.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r},${c}`;
                const hasPointers = highlightedCells.has(key);
                const pointerNames = highlightedCells.get(key) || [];
                const isChanged = changedCells.has(key);

                let cellBg = 'bg-white dark:bg-[var(--dark-surface-2)]';
                let cellBorder = 'border-slate-900 dark:border-[var(--dark-border)]';
                let cellText = 'text-slate-900 dark:text-slate-100';

                if (hasPointers) {
                  cellBg = isSaffron ? 'bg-saffron-100 dark:bg-saffron-950/40' : 'bg-blue-100 dark:bg-blue-950/40';
                  cellBorder = isSaffron ? 'border-saffron-500 dark:border-saffron-600 border-[3px]' : 'border-blue-500 dark:border-blue-600 border-[3px]';
                  cellText = isSaffron ? 'text-saffron-900 dark:text-saffron-300 font-black' : 'text-blue-900 dark:text-blue-300 font-black';
                } else if (isChanged) {
                  cellBg = 'bg-yellow-50 dark:bg-yellow-950/15';
                  cellBorder = 'border-yellow-500 dark:border-yellow-600 border-[3px]';
                  cellText = 'text-yellow-700 dark:text-yellow-300';
                }

                return (
                  <motion.div
                    key={key}
                    layout
                    className={`w-14 h-14 border-2 flex flex-col items-center justify-center relative select-none ${cellBg} ${cellBorder} ${cellText} shadow-[2px_2px_0_rgba(15,23,42,0.15)] dark:shadow-[2px_2px_0_var(--dark-shadow)] group hover:-translate-y-[1px] transition-transform`}
                  >
                    {/* Intersection pointer indicator */}
                    {hasPointers && (
                      <div className="absolute -top-3.5 z-20 pointer-events-none">
                        <span className="bg-emerald-500 text-white text-[7px] font-black px-1 border border-emerald-700 shadow-[1px_1px_0_rgba(0,0,0,1)] uppercase">
                          {pointerNames[0]}
                        </span>
                      </div>
                    )}
                    
                    <span className="text-[14px] font-mono font-black">
                      {cell === null ? 'nil' : String(cell)}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
