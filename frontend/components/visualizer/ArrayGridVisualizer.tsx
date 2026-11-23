import React, { useMemo, useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns, Grid, Play, RefreshCw, Sparkles, ArrowDown, Maximize2 } from 'lucide-react';
import { VariableMap, VisualizationEvent } from '../../../types';
import { getThemeConfig, ThemeColor } from '../../theme/theme';
import { DEFAULT_PTR_COLOR, getPtrColor } from './LinkedListVisualizer';
import { TreePanel } from './TreeVisualizer';
import { CellAccess, displayValue } from './codeAccess';


interface ArrayGridVisualizerProps {
  variables: VariableMap;
  prevVariables: VariableMap;
  events?: VisualizationEvent[];
  themeColor: ThemeColor;
  arrayViewType?: 'cells' | 'bars';
  onEnlarge?: () => void;
  // Which variable to draw. Without it, the best-looking array in scope is picked.
  sourceName?: string;
  // Cells the current line reads or writes.
  accesses?: CellAccess[];
  // Variables the code uses as an index, per dimension. Only these count as pointers.
  indexVars?: string[][];
  // Matrix headers, e.g. the characters of two strings for an LCS table.
  rowLabels?: string[];
  colLabels?: string[];
}

export interface ArrayGridPreview {
  type: 'array' | 'matrix';
  sourceName: string;
  value: any[];
  prevValue?: any[];
}

const ARRAY_ITEM_STRIDE = 72;
const ARRAY_OVERSCAN = 6;
const ARRAY_VIRTUALIZATION_THRESHOLD = 120;
const MATRIX_OVERSCAN = 2;

function isMatrix(value: unknown): value is any[][] {
  if (!Array.isArray(value) || value.length === 0) return false;
  const firstRow = value[0];
  if (!Array.isArray(firstRow) || firstRow.length === 0) return false;
  
  // Must be a grid (all rows have same length) and contains primitives
  const cols = firstRow.length;
  // Check every row's shape (O(rows)) and sample cell types so very large grids
  // don't require a full O(rows × columns) classification pass before rendering.
  return value.every((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== cols) return false;
    if (value.length <= 128 && cols <= 128) {
      return row.every((cell) => cell === null || ['number', 'string', 'boolean'].includes(typeof cell));
    }
    if (rowIndex >= 32 && rowIndex < value.length - 32 && rowIndex % Math.ceil(value.length / 32) !== 0) return true;
    const sampleColumns = new Set([0, Math.floor(cols / 2), cols - 1]);
    return Array.from(sampleColumns).every((column) => row[column] === null || ['number', 'string', 'boolean'].includes(typeof row[column]));
  });
}

function isPrimitiveArray(value: unknown): value is any[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    (value.length <= 5000
      ? value.every(cell => cell === null || typeof cell === 'number' || typeof cell === 'string' || typeof cell === 'boolean')
      : [...value.slice(0, 64), ...value.slice(-64)].every(cell => cell === null || typeof cell === 'number' || typeof cell === 'string' || typeof cell === 'boolean'))
  );
}

export function buildArrayGridPreview(variables: VariableMap, prevVariables: VariableMap, sourceName?: string): ArrayGridPreview | null {
  if (sourceName) {
    const asCells = (value: unknown) => (typeof value === 'string' ? value.split('') : value);
    const value = asCells(variables[sourceName]);
    const prevValue = asCells(prevVariables[sourceName]);
    if (isMatrix(value)) return { type: 'matrix', sourceName, value, prevValue: prevValue as any[][] };
    if (isPrimitiveArray(value)) return { type: 'array', sourceName, value, prevValue: prevValue as any[] };
    return null;
  }

  // Scan for 2D matrices first (higher priority)
  const matrixEntries = Object.entries(variables).filter(([, val]) => isMatrix(val));
  if (matrixEntries.length > 0) {
    // Prioritize name with 'grid', 'matrix', 'board', 'table'
    const best = matrixEntries.find(([name]) => /grid|matrix|board|table/i.test(name)) || matrixEntries[0];
    const prevVal = Object.entries(prevVariables).find(([k]) => k === best[0])?.[1];
    return {
      type: 'matrix',
      sourceName: best[0],
      value: best[1] as any[][],
      prevValue: prevVal as any[][],
    };
  }

  // Scan for 1D arrays
  const arrayEntries = Object.entries(variables).filter(([name, val]) => 
    isPrimitiveArray(val) && !/visited|seen|closed/i.test(name)
  );
  if (arrayEntries.length > 0) {
    const best = arrayEntries.find(([name]) => /arr|nums|list|values/i.test(name)) || arrayEntries[0];
    const prevVal = Object.entries(prevVariables).find(([k]) => k === best[0])?.[1];
    return {
      type: 'array',
      sourceName: best[0],
      value: best[1] as any[],
      prevValue: prevVal as any[],
    };
  }

  return null;
}

export const ArrayGridVisualizer: React.FC<ArrayGridVisualizerProps> = ({
  variables,
  prevVariables,
  events = [],
  themeColor,
  arrayViewType = 'cells',
  onEnlarge,
  sourceName,
  accesses = [],
  indexVars,
  rowLabels,
  colLabels,
}) => {
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';
  const getArrayPointerColor = (name: string) => {
    const color = getPtrColor(name);
    if (isSaffron && color === DEFAULT_PTR_COLOR) {
      return {
        bg: 'bg-orange-500',
        text: 'text-white',
        border: 'border-orange-600',
        glow: 'rgba(249,115,22,0.3)',
        hex: '#f97316',
      };
    }
    return color;
  };

  const [viewAsHeap, setViewAsHeap] = useState(false);
  const arrayViewportRef = useRef<HTMLDivElement>(null);
  const matrixViewportRef = useRef<HTMLDivElement>(null);
  const [arrayWindow, setArrayWindow] = useState({ start: 0, end: 0, firstVisible: 0, lastVisible: 0 });
  const [matrixWindow, setMatrixWindow] = useState({ rowStart: 0, rowEnd: 0, colStart: 0, colEnd: 0 });
  const [matrixViewportWidth, setMatrixViewportWidth] = useState(0);

  const preview = useMemo(() => buildArrayGridPreview(variables, prevVariables, sourceName), [variables, prevVariables, sourceName]);
  const arrayLength = preview?.type === 'array' ? preview.value.length : 0;
  const fitSmallArray = arrayLength > 0 && arrayLength <= 16;
  const matrixRows = preview?.type === 'matrix' ? preview.value.length : 0;
  const matrixCols = preview?.type === 'matrix' ? (preview.value[0]?.length || 0) : 0;
  // Cells shrink (down to 30px) so small tables fit without scrolling.
  const MATRIX_CELL_STRIDE = matrixViewportWidth > 0 && matrixCols > 0
    ? Math.max(30, Math.min(62, Math.floor((matrixViewportWidth - 48) / matrixCols)))
    : 62;

  const updateArrayWindow = useCallback(() => {
    const viewport = arrayViewportRef.current;
    if (!viewport) return;
    const firstVisible = Math.max(0, Math.floor(Math.max(0, viewport.scrollLeft - 8) / ARRAY_ITEM_STRIDE));
    const visibleCount = Math.ceil(viewport.clientWidth / ARRAY_ITEM_STRIDE);
    const lastVisible = Math.min(arrayLength, firstVisible + visibleCount + 1);
    const start = Math.max(0, firstVisible - ARRAY_OVERSCAN);
    const end = Math.min(arrayLength, lastVisible + ARRAY_OVERSCAN);
    setArrayWindow((current) => current.start === start && current.end === end && current.firstVisible === firstVisible && current.lastVisible === lastVisible
      ? current
      : { start, end, firstVisible, lastVisible });
  }, [arrayLength]);

  const updateMatrixWindow = useCallback(() => {
    const viewport = matrixViewportRef.current;
    if (!viewport) return;
    const firstCol = Math.max(0, Math.floor(Math.max(0, viewport.scrollLeft - 40) / MATRIX_CELL_STRIDE));
    const firstRow = Math.max(0, Math.floor(Math.max(0, viewport.scrollTop - 32) / MATRIX_CELL_STRIDE));
    const visibleCols = Math.ceil(Math.max(1, viewport.clientWidth - 40) / MATRIX_CELL_STRIDE);
    const visibleRows = Math.ceil(Math.max(1, viewport.clientHeight - 32) / MATRIX_CELL_STRIDE);
    const colStart = Math.max(0, firstCol - MATRIX_OVERSCAN);
    const rowStart = Math.max(0, firstRow - MATRIX_OVERSCAN);
    const colEnd = Math.min(matrixCols, firstCol + visibleCols + MATRIX_OVERSCAN + 1);
    const rowEnd = Math.min(matrixRows, firstRow + visibleRows + MATRIX_OVERSCAN + 1);
    setMatrixWindow((current) => current.rowStart === rowStart && current.rowEnd === rowEnd && current.colStart === colStart && current.colEnd === colEnd
      ? current
      : { rowStart, rowEnd, colStart, colEnd });
  }, [matrixCols, matrixRows, MATRIX_CELL_STRIDE]);

  useLayoutEffect(() => {
    const viewport = matrixViewportRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setMatrixViewportWidth(viewport.clientWidth));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [preview?.type]);

  useLayoutEffect(() => {
    updateArrayWindow();
    updateMatrixWindow();
  }, [updateArrayWindow, updateMatrixWindow]);

  const isNumericArray = useMemo(() => {
    if (!preview || preview.type !== 'array') return false;
    const value = preview.value;
    if (value.length === 0) return false;
    const sample = value.length <= 5000 ? value : [...value.slice(0, 64), ...value.slice(-64)];
    return sample.every(v => typeof v === 'number');
  }, [preview]);

  // Give each distinct number its own height in both views. These heights
  // communicate order without suggesting a proportional scale.
  const numericBarHeights = useMemo(() => {
    if (!preview || preview.type !== 'array') return new Map<number, number>();
    const finiteValues = preview.value.filter((value: unknown): value is number =>
      typeof value === 'number' && Number.isFinite(value),
    );
    const orderedValues = Array.from(new Set<number>(finiteValues)).sort((a, b) => a - b);
    const heights = new Map<number, number>();
    orderedValues.forEach((value, rank) => {
      heights.set(value, orderedValues.length <= 1 ? 52 : 18 + (rank / (orderedValues.length - 1)) * 66);
    });
    return heights;
  }, [preview]);

  const heapTreePreview = useMemo(() => {
    if (!viewAsHeap || !preview || preview.type !== 'array') return null;
    const arr = preview.value;
    if (arr.length === 0) return null;

    const nodes: any[] = [];
    
    // BFS construction
    const buildSubtree = (i: number): string | undefined => {
      if (i >= Math.min(arr.length, 31) || arr[i] == null) return undefined;
      const nodeId = `${preview.sourceName}-heap-${i}`;
      const leftId = buildSubtree(2 * i + 1);
      const rightId = buildSubtree(2 * i + 2);
      
      nodes.push({
        id: nodeId,
        label: String(arr[i]),
        pointerNames: i === 0 ? ['root'] : [],
        leftId,
        rightId,
      });
      return nodeId;
    };

    buildSubtree(0);

    nodes.sort((a, b) => {
      const idxA = parseInt(a.id.split('-').pop() || '0');
      const idxB = parseInt(b.id.split('-').pop() || '0');
      return idxA - idxB;
    });

    return {
      sourceName: `${preview.sourceName} (Heap Tree View)`,
      nodes,
      rootId: `${preview.sourceName}-heap-0`,
      truncated: arr.length > 31,
    };
  }, [viewAsHeap, preview]);

  const activeArrayIndices = useMemo(() => {
    if (!preview || preview.type !== 'array') return [];
    const pointers = ['i', 'j', 'k', 'left', 'right', 'low', 'high', 'lo', 'hi', 'mid', 'current', 'curr', 'index', 'start', 'end'];
    return pointers
      .map((name) => variables[name])
      .filter((value): value is number => Number.isInteger(value) && value >= 0 && value < preview.value.length);
  }, [preview, variables]);

  const activeMatrixTarget = useMemo(() => {
    if (!preview || preview.type !== 'matrix') return null;
    const rowName = ['row', 'r', 'i', 'y'].find((name) => Number.isInteger(variables[name]) && variables[name] >= 0 && variables[name] < preview.value.length);
    const colName = ['col', 'c', 'j', 'x'].find((name) => Number.isInteger(variables[name]) && variables[name] >= 0 && variables[name] < (preview.value[0]?.length || 0));
    return rowName && colName ? { row: variables[rowName] as number, col: variables[colName] as number } : null;
  }, [preview, variables]);

  useEffect(() => {
    const viewport = arrayViewportRef.current;
    if (!viewport || activeArrayIndices.length === 0) return;
    const capacity = Math.max(1, Math.floor(viewport.clientWidth / ARRAY_ITEM_STRIDE) - 2);
    const sorted = [...new Set<number>(activeArrayIndices as number[])].sort((a, b) => a - b);
    let first = sorted[0];
    let last = sorted[sorted.length - 1];
    if (last - first + 1 > capacity) {
      const preferredValue = variables.i ?? variables.current ?? variables.curr ?? variables.mid ?? variables.left ?? first;
      const preferred = typeof preferredValue === 'number' ? preferredValue : first;
      first = Number.isInteger(preferred) && preferred >= 0 ? preferred : first;
      last = first;
    }
    // Include the row's horizontal inset so small arrays and virtual windows
    // use the same index-to-scroll coordinate system.
    const left = 8 + first * ARRAY_ITEM_STRIDE;
    const right = (last + 1) * ARRAY_ITEM_STRIDE;
    if (left < viewport.scrollLeft || right > viewport.scrollLeft + viewport.clientWidth) {
      const nextLeft = Math.max(0, left - Math.max(0, (viewport.clientWidth - (right - left)) / 2));
      viewport.scrollTo({ left: nextLeft, behavior: 'smooth' });
      requestAnimationFrame(updateArrayWindow);
    }
  }, [activeArrayIndices, arrayLength, updateArrayWindow, variables]);

  useEffect(() => {
    const viewport = matrixViewportRef.current;
    if (!viewport || !activeMatrixTarget) return;
    const left = 40 + activeMatrixTarget.col * MATRIX_CELL_STRIDE;
    const top = 32 + activeMatrixTarget.row * MATRIX_CELL_STRIDE;
    if (left < viewport.scrollLeft || left + MATRIX_CELL_STRIDE > viewport.scrollLeft + viewport.clientWidth) {
      viewport.scrollLeft = Math.max(0, left - Math.max(0, (viewport.clientWidth - MATRIX_CELL_STRIDE) / 2));
    }
    if (top < viewport.scrollTop || top + MATRIX_CELL_STRIDE > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTop = Math.max(0, top - Math.max(0, (viewport.clientHeight - MATRIX_CELL_STRIDE) / 2));
    }
    updateMatrixWindow();
  }, [activeMatrixTarget, updateMatrixWindow, MATRIX_CELL_STRIDE]);

  useEffect(() => {
    if (!isNumericArray) {
      setViewAsHeap(false);
    }
  }, [isNumericArray]);

  if (!preview) return null;

  if (preview.type === 'array' && viewAsHeap && heapTreePreview) {
    return (
      <TreePanel
        preview={heapTreePreview}
        themeColor={themeColor}
        onEnlarge={onEnlarge}
      />
    );
  }

  // ── 1D Array Rendering ──
  if (preview.type === 'array') {
    const arr = preview.value;
    const prevArr = preview.prevValue;

    // Detect active pointer index variables (e.g., i, j, left, right, mid, low, high)
    const activePointers = new Map<number, string[]>();
    const declaredIndexes = indexVars?.[0];
    Object.entries(variables).forEach(([name, val]) => {
      if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val < arr.length) {
        // With the code available, a pointer is a variable used inside arr[...]; otherwise guess, minus common constants.
        const ignored = new Set(['n', 'limit', 'target', 'sum', 'length']);
        const conventional = /^(i|j|k|lo|hi|low|high|left|right|mid|start|end|l|r|p|q|slow|fast|curr|current|index|idx|ptr|pos)$/;
        if (declaredIndexes ? declaredIndexes.includes(name) || conventional.test(name) : !ignored.has(name)) {
          if (!activePointers.has(val)) activePointers.set(val, []);
          activePointers.get(val)!.push(name);
        }
      }
    });

    // Detect sliding window range boundaries
    let rangeStart: number | null = null;
    let rangeEnd: number | null = null;

    for (const key of ['left', 'start', 'low', 'windowStart']) {
      const val = variables[key];
      if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val < arr.length) {
        rangeStart = val;
        break;
      }
    }

    for (const key of ['right', 'end', 'high', 'windowEnd']) {
      const val = variables[key];
      if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val < arr.length) {
        rangeEnd = val;
        break;
      }
    }

    const hasSlidingWindow = rangeStart !== null && rangeEnd !== null && rangeStart <= rangeEnd;

    // Detect changed indices
    const virtualized = arr.length > ARRAY_VIRTUALIZATION_THRESHOLD;
    const renderStart = virtualized ? Math.min(arrayWindow.start, Math.max(0, arr.length - 1)) : 0;
    const renderEnd = virtualized ? Math.min(arr.length, Math.max(renderStart, arrayWindow.end)) : arr.length;
    const changedIndices = new Set<number>();
    const explicitArrayEvents = events.filter((event) => event.variable === preview.sourceName && (event.type === 'array-write' || event.type === 'swap'));
    if (explicitArrayEvents.length > 0) {
      explicitArrayEvents.forEach((event) => {
        if (event.type === 'array-write' && event.index !== undefined) changedIndices.add(event.index);
        if (event.type === 'swap' && event.indices) event.indices.forEach((index) => changedIndices.add(index));
      });
    } else if (prevArr && prevArr.length === arr.length) {
      for (let idx = renderStart; idx < renderEnd; idx++) {
        if (prevArr[idx] !== arr[idx]) changedIndices.add(idx);
      }
    }

    // Detect swap pattern
    let swapIndices: [number, number] | null = null;
    if (changedIndices.size === 2 && prevArr) {
      const [a, b] = Array.from(changedIndices);
      if (prevArr.at(a) === arr.at(b) && prevArr.at(b) === arr.at(a)) {
        swapIndices = [a, b];
      }
    }

    const visibleItems = Array.from({ length: Math.max(0, renderEnd - renderStart) }, (_, offset) => renderStart + offset);
    const readIndices = new Set(accesses.filter((a) => !a.write && a.indices.length === 1).map((a) => a.indices[0]));
    const writeIndices = new Set(accesses.filter((a) => a.write && a.indices.length === 1).map((a) => a.indices[0]));

    return (
      <section className={`${theme.panelClass} p-4`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={theme.badgeClass}>
              <Columns size={12} /> Array Visualizer
            </span>
            {isNumericArray && (
              <button
                onClick={() => setViewAsHeap(v => !v)}
                className={`flex items-center gap-1 border-[2px] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-[1px_1px_0_rgba(15,23,42,1)] dark:shadow-[1px_1px_0_var(--dark-shadow)] transition-all active:translate-y-[1px] active:shadow-none ${
                  viewAsHeap
                    ? isSaffron
                      ? 'bg-saffron-100 text-saffron-700 border-saffron-500'
                      : 'bg-blue-100 text-blue-700 border-blue-500'
                    : 'bg-slate-100 dark:bg-[var(--dark-surface-3)] text-slate-600 dark:text-slate-400 border-slate-900 dark:border-[var(--dark-border)] hover:bg-slate-200'
                }`}
                title="View 1D array as a Binary Heap tree"
              >
                <Sparkles size={10} />
                Heap Tree View
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
              {preview.sourceName}
            </h3>
            {onEnlarge && (
              <button
                onClick={onEnlarge}
                className="p-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-all hover:translate-y-[1px] hover:shadow-none"
                title="Enlarge diagram"
              >
                <Maximize2 size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {virtualized && (
          <div className="mt-3 flex items-center gap-3 border-y border-slate-200 py-2 text-[10px] font-mono text-slate-500 dark:border-[var(--dark-border-dim)] dark:text-slate-400">
            <span className="shrink-0">Items {arrayWindow.firstVisible + 1}–{arrayWindow.lastVisible} of {arr.length}</span>
            <input
              aria-label={`Array window for ${preview.sourceName}`}
              type="range"
              min={0}
              max={Math.max(0, arr.length - Math.max(1, arrayWindow.lastVisible - arrayWindow.firstVisible))}
              value={Math.min(arrayWindow.firstVisible, Math.max(0, arr.length - Math.max(1, arrayWindow.lastVisible - arrayWindow.firstVisible)))}
              onChange={(event) => {
                const viewport = arrayViewportRef.current;
                if (!viewport) return;
                viewport.scrollLeft = Number(event.target.value) * ARRAY_ITEM_STRIDE;
                updateArrayWindow();
              }}
              className={`min-w-0 flex-1 ${isSaffron ? 'accent-orange-500' : 'accent-blue-500'}`}
            />
          </div>
        )}

        {swapIndices && (
          <div className={`mt-3 text-center text-[10px] font-black uppercase tracking-widest ${isSaffron ? 'text-saffron-600 dark:text-saffron-400' : 'text-blue-600 dark:text-blue-400'}`}>
            ↔ Swapped indexes [{swapIndices[0]}] ⟷ [{swapIndices[1]}]
          </div>
        )}

        <div ref={arrayViewportRef} role="region" aria-label={`${preview.sourceName} array diagram`} tabIndex={0} onScroll={updateArrayWindow} className="diagram-viewport custom-scrollbar mt-6 pb-4 pt-16 min-h-[190px] w-full">
          <div className={`flex min-w-full items-end px-2 ${fitSmallArray ? 'w-full gap-1.5' : 'w-max gap-2'}`}>
            {virtualized && <div aria-hidden="true" className="shrink-0" style={{ width: renderStart * ARRAY_ITEM_STRIDE }} />}
            {visibleItems.map((i) => {
            const val = arr[i];
            const hasPointers = activePointers.has(i);
            const pointers = activePointers.get(i) || [];
            const isChanged = changedIndices.has(i);
            const isSwapped = swapIndices && (i === swapIndices[0] || i === swapIndices[1]);
            const isInRange = hasSlidingWindow && i >= rangeStart! && i <= rangeEnd!;
            const isWritten = writeIndices.has(i);
            const isRead = !isWritten && readIndices.has(i);

            // Heights for numeric bars
            const isNum = typeof val === 'number';
            const barHeight = isNum ? numericBarHeights.get(val) ?? 18 : 0;

            let cellBg = 'bg-white dark:bg-[var(--dark-surface-2)]';
            let cellBackgroundColor: string | undefined;
            let cellBorderColor: string | undefined;
            let cellBorder = 'border-slate-900 dark:border-[var(--dark-border)]';
            let cellText = 'text-slate-900 dark:text-slate-100';
            let barBg = isSaffron ? 'bg-orange-300 dark:bg-orange-700' : 'bg-blue-300 dark:bg-blue-700';

            if (isWritten) {
              cellBg = 'bg-orange-100 dark:bg-orange-950/40';
              cellBorderColor = '#ea580c';
              cellText = 'text-orange-950 dark:text-orange-200 font-black';
              barBg = 'bg-orange-500';
            } else if (isSwapped) {
              cellBg = 'bg-yellow-50 dark:bg-yellow-950/20';
              cellBorderColor = '#eab308';
              cellBorder = 'border-yellow-500 dark:border-yellow-600';
              cellText = 'text-yellow-900 dark:text-yellow-300';
              barBg = 'bg-yellow-400 dark:bg-yellow-500';
            } else if (isChanged) {
              cellBg = isSaffron ? 'bg-saffron-50 dark:bg-saffron-950/20' : 'bg-blue-50 dark:bg-blue-950/20';
              cellBorderColor = isSaffron ? '#f97316' : '#3b82f6';
              cellBorder = isSaffron ? 'border-saffron-500 dark:border-saffron-600' : 'border-blue-500 dark:border-blue-600';
              cellText = isSaffron ? 'text-saffron-900 dark:text-saffron-300' : 'text-blue-900 dark:text-blue-300';
              barBg = isSaffron ? 'bg-saffron-400 dark:bg-saffron-500' : 'bg-blue-400 dark:bg-blue-500';
            } else if (hasPointers) {
              const pc = getArrayPointerColor(pointers[0]);
              cellBackgroundColor = pc.glow.replace('0.3)', '0.22)');
              cellBorderColor = pc.hex;
              cellBorder = pc.border;
              cellText = 'text-slate-900 dark:text-slate-100 font-black';
              barBg = pc.bg;
            } else if (isInRange) {
              cellBg = isSaffron ? 'bg-saffron-50/50 dark:bg-saffron-900/10' : 'bg-blue-50/50 dark:bg-blue-900/10';
              cellBorderColor = isSaffron ? 'rgba(249,115,22,0.5)' : 'rgba(59,130,246,0.5)';
              cellBorder = isSaffron ? 'border-saffron-500/50 dark:border-saffron-600/40' : 'border-blue-500/50 dark:border-blue-600/40';
              cellText = isSaffron ? 'text-saffron-900 dark:text-saffron-300 font-bold' : 'text-blue-900 dark:text-blue-300 font-bold';
              barBg = isSaffron ? 'bg-saffron-300 dark:bg-saffron-800/40' : 'bg-blue-300 dark:bg-blue-800/40';
            }

            return (
              <motion.div
                key={i}
                layout
                style={fitSmallArray ? { flex: '1 1 64px', minWidth: 24, maxWidth: 64 } : undefined}
                className={`relative flex w-16 flex-col items-center ${fitSmallArray ? 'shrink' : 'shrink-0'}`}
              >
                {/* Sliding Window Brackets & Link Lines */}
                {isInRange && (
                  <>
                    <div className={`absolute -inset-y-1.5 left-0 right-0 border-y-[2px] border-dashed ${isSaffron ? 'border-saffron-500/50' : 'border-blue-500/50'} pointer-events-none z-20`} />
                    {i === rangeStart && (
                      <div className={`absolute -inset-y-1.5 -left-1.5 w-3 border-y-[3px] border-l-[3px] ${isSaffron ? 'border-saffron-500' : 'border-blue-500'} pointer-events-none z-20`} />
                    )}
                    {i === rangeEnd && (
                      <div className={`absolute -inset-y-1.5 -right-1.5 w-3 border-y-[3px] border-r-[3px] ${isSaffron ? 'border-saffron-500' : 'border-blue-500'} pointer-events-none z-20`} />
                    )}
                  </>
                )}
                {/* Pointer Arrow Flags */}
                {hasPointers && (
                  <div className="absolute -top-10 left-0 right-0 flex flex-col items-center z-20">
                    <div className="flex gap-0.5 pointer-events-none">
                      {pointers.map((p) => {
                        const pc = getArrayPointerColor(p);
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
                  <div className="w-full h-24 flex items-end justify-center mb-1 relative">
                    {arrayViewType === 'bars' && (
                      <span className="absolute -top-5 font-mono font-black text-xs text-slate-800 dark:text-slate-200">
                        {val === null ? 'nil' : String(val)}
                      </span>
                    )}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}px` }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                      title="Bar height shows relative order, not exact proportions"
                      className={`w-4 border-[2px] border-b-0 border-slate-900 dark:border-[var(--dark-border-bright)] ${barBg} ${
                        arrayViewType === 'bars' ? 'w-8 border-b-[2px]' : ''
                      }`}
                    />
                  </div>
                )}

                {/* Memory cell block / String fallback */}
                {((arrayViewType === 'cells') || !isNum) ? (
                  <div
                    style={cellBackgroundColor || cellBorderColor ? {
                      ...(cellBackgroundColor ? { backgroundColor: cellBackgroundColor } : {}),
                      ...(cellBorderColor ? { borderColor: cellBorderColor } : {}),
                    } : undefined}
                    className={`w-full text-center py-2.5 border-[3px] text-base font-mono font-black border-slate-900 ${cellBg} ${cellBorder} ${cellText} shadow-[3px_3px_0_#0f172a] dark:shadow-[3px_3px_0_var(--dark-shadow)] relative z-10 ${isRead ? 'outline outline-2 outline-dashed outline-sky-500 outline-offset-2' : ''}`}
                  >
                    {displayValue(val)}
                  </div>
                ) : (
                  // For non-numeric items or in bars mode (if any exist)
                  !isNum && (
                    <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 py-2">
                      {val === null ? 'nil' : String(val)}
                    </div>
                  )
                )}

                {/* Index label */}
                <span className="text-[10px] mt-2 font-mono font-bold text-slate-400 dark:text-slate-500">
                  [{i}]
                </span>
                {(isWritten || isRead) && (
                  <span className={`mt-0.5 px-1 text-[8px] font-black uppercase tracking-wider ${isWritten ? 'bg-orange-500 text-white' : 'bg-sky-500 text-white'}`}>
                    {isWritten ? 'write' : 'read'}
                  </span>
                )}
              </motion.div>
            );
          })}
          {virtualized && <div aria-hidden="true" className="shrink-0" style={{ width: Math.max(0, arr.length - renderEnd) * ARRAY_ITEM_STRIDE }} />}
          </div>
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
  const rowVars = indexVars?.[0]?.length ? indexVars[0] : ['row', 'r', 'i', 'y'];
  const colVars = indexVars?.[1]?.length ? indexVars[1] : ['col', 'c', 'j', 'x'];
  const cellAccess = new Map<string, 'read' | 'write'>();
  accesses.forEach((access) => {
    if (access.indices.length !== 2) return;
    const key = `${access.indices[0]},${access.indices[1]}`;
    if (access.write || !cellAccess.has(key)) cellAccess.set(key, access.write ? 'write' : 'read');
  });

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
  // When the line touches exact cells those are shown instead; otherwise mark the (row, col) pointer pair.
  Object.entries(cellAccess.size > 0 ? {} : variables).forEach(([rName, rVal]) => {
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

  const rowStart = Math.min(matrixWindow.rowStart, Math.max(0, rowsCount - 1));
  const rowEnd = Math.min(rowsCount, Math.max(rowStart, matrixWindow.rowEnd));
  const colStart = Math.min(matrixWindow.colStart, Math.max(0, colsCount - 1));
  const colEnd = Math.min(colsCount, Math.max(colStart, matrixWindow.colEnd));

  // Compare only mounted cells; scrolling into another window computes its own
  // diffs and never scans or creates DOM for the entire matrix at once.
  const changedCells = new Set<string>();
  const explicitGridEvents = events.filter((event) => event.variable === preview.sourceName && event.type === 'grid-write');
  explicitGridEvents.forEach((event) => {
    if (event.row !== undefined && event.column !== undefined) changedCells.add(`${event.row},${event.column}`);
  });
  if (explicitGridEvents.length === 0 && prevMatrix && prevMatrix.length === rowsCount && prevMatrix.at(0)?.length === colsCount) {
    for (let r = rowStart; r < rowEnd; r++) {
      for (let c = colStart; c < colEnd; c++) {
        if (prevMatrix.at(r)?.at(c) !== matrix.at(r)?.at(c)) {
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
        <div className="flex items-center gap-2 shrink-0">
          <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-700 dark:text-slate-300">
            {preview.sourceName}
          </h3>
          {onEnlarge && (
            <button
              onClick={onEnlarge}
              className="p-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-all hover:translate-y-[1px] hover:shadow-none"
              title="Enlarge diagram"
            >
              <Maximize2 size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
        <span>{rowsCount} × {colsCount}</span>
        {(rowEnd - rowStart < rowsCount || colEnd - colStart < colsCount) && (
          <span>
            Showing rows {rowStart + 1}–{rowEnd}, columns {colStart + 1}–{colEnd}. Scroll to explore.
          </span>
        )}
        {cellAccess.size > 0 && (
          <span className="flex items-center gap-2 font-sans font-bold">
            <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 border-2 border-orange-600 bg-orange-200" /> written</span>
            <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 border-2 border-dashed border-sky-500" /> read</span>
          </span>
        )}
      </div>
      <div ref={matrixViewportRef} role="region" aria-label={`${preview.sourceName} matrix diagram`} tabIndex={0} onScroll={updateMatrixWindow} className="diagram-viewport mt-3 w-full custom-scrollbar">
        <div className="relative" style={{ width: 40 + colsCount * MATRIX_CELL_STRIDE, height: 32 + rowsCount * MATRIX_CELL_STRIDE }}>
          {Array.from({ length: Math.max(0, colEnd - colStart) }, (_, offset) => colStart + offset).map((c) => {
            const pointers = activeColPtrs.get(c) || [];
            const hasColPointers = pointers.length > 0;
            return (
              <div key={`col-head-${c}`} className="absolute flex h-8 flex-col items-center justify-end" style={{ left: 40 + c * MATRIX_CELL_STRIDE, top: 0, width: MATRIX_CELL_STRIDE - 6 }}>
                {hasColPointers && <span className="absolute -top-2 bg-cyan-500 px-1 text-[8px] font-black uppercase text-black shadow-[1px_1px_0_rgba(0,0,0,1)]">{pointers.join(',')}</span>}
                {colLabels?.[c] !== undefined && <span className="text-[11px] font-mono font-black text-slate-700 dark:text-slate-200">{colLabels[c] || 'ε'}</span>}
                <span className={`text-[10px] font-mono font-bold ${hasColPointers ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-600'}`}>[{c}]</span>
              </div>
            );
          })}

          {Array.from({ length: Math.max(0, rowEnd - rowStart) }, (_, offset) => rowStart + offset).map((r) => {
            const pointers = activeRowPtrs.get(r) || [];
            const hasRowPointers = pointers.length > 0;
            return (
              <div key={`row-head-${r}`} className="absolute flex w-10 items-center justify-end pr-2" style={{ left: 0, top: 32 + r * MATRIX_CELL_STRIDE, height: MATRIX_CELL_STRIDE - 6 }}>
                {hasRowPointers && <span className="absolute left-0 -translate-x-1/2 bg-purple-500 px-1 text-[8px] font-black uppercase text-white shadow-[1px_1px_0_rgba(0,0,0,1)]">{pointers.join(',')}</span>}
                {rowLabels?.[r] !== undefined && <span className="mr-1 text-[11px] font-mono font-black text-slate-700 dark:text-slate-200">{rowLabels[r] || 'ε'}</span>}
                <span className={`text-[10px] font-mono font-bold ${hasRowPointers ? 'text-purple-500' : 'text-slate-400 dark:text-slate-600'}`}>[{r}]</span>
              </div>
            );
          })}

          {Array.from({ length: Math.max(0, rowEnd - rowStart) }, (_, rowOffset) => rowStart + rowOffset).flatMap((r) =>
            Array.from({ length: Math.max(0, colEnd - colStart) }, (_, colOffset) => colStart + colOffset).map((c) => {
              const cell = matrix[r][c];
              const key = `${r},${c}`;
              const hasPointers = highlightedCells.has(key);
              const pointerNames = highlightedCells.get(key) || [];
              const isChanged = changedCells.has(key);
              const access = cellAccess.get(key);

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
              } else if (cell === true || cell === 1 && preview.value.every((row: unknown[]) => row.every((v) => v === 0 || v === 1 || typeof v === 'boolean'))) {
                // Boolean and 0/1 grids: filled cells read at a glance.
                cellBg = 'bg-emerald-100 dark:bg-emerald-900/40';
              }
              if (access === 'write') {
                cellBg = 'bg-orange-200 dark:bg-orange-900/60';
                cellBorder = 'border-orange-600 border-[3px]';
                cellText = 'text-orange-950 dark:text-orange-100 font-black';
              } else if (access === 'read') {
                cellBorder = 'border-sky-500 border-[3px] border-dashed';
                cellText = 'text-sky-900 dark:text-sky-200 font-black';
              }
              const cellSize = MATRIX_CELL_STRIDE - 6;

              return (
                <div key={key} aria-label={`Row ${r}, column ${c}: ${displayValue(cell)}${access ? `, ${access}` : ''}`} className={`absolute flex select-none flex-col items-center justify-center border-2 transition-colors duration-150 ${cellBg} ${cellBorder} ${cellText} shadow-[2px_2px_0_rgba(15,23,42,0.15)] dark:shadow-[2px_2px_0_var(--dark-shadow)]`} style={{ left: 40 + c * MATRIX_CELL_STRIDE, top: 32 + r * MATRIX_CELL_STRIDE, width: cellSize, height: cellSize }}>
                  {hasPointers && <span className="absolute -top-2 z-20 bg-emerald-500 px-1 text-[7px] font-black uppercase text-white">{pointerNames[0]}</span>}
                  <span className="font-mono font-black" style={{ fontSize: cellSize >= 48 ? 14 : cellSize >= 36 ? 12 : 10 }}>{displayValue(cell)}</span>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </section>
  );
};
