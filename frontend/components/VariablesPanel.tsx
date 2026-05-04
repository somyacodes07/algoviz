import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableMap } from '../../types';
import { ChevronRight, ArrowUp, ArrowDown, Sparkles, RefreshCw, Repeat } from 'lucide-react';
import StructureVisualizer from './StructureVisualizer';

import { getThemeConfig, ThemeColor } from '../theme/theme';

interface VariablesPanelProps {
  variables: VariableMap;
  prevVariables: VariableMap;
  themeColor: ThemeColor;
}

function safeSerialize(value: unknown, maxDepth: number = 3): string {
  const seen = new WeakSet<object>();

  const normalize = (current: unknown, depth: number): unknown => {
    if (current === null || typeof current !== 'object') {
      if (typeof current === 'function') return '[Function]';
      if (current === undefined) return 'undefined';
      if (Number.isNaN(current)) return 'NaN';
      return current;
    }

    if (seen.has(current as object)) {
      return '[Circular]';
    }

    if (depth >= maxDepth) {
      if (Array.isArray(current)) {
        return `[Array(${current.length})]`;
      }
      return '[Object]';
    }

    seen.add(current as object);

    if (Array.isArray(current)) {
      return current.map((item) => normalize(item, depth + 1));
    }

    const entries = Object.entries(current as Record<string, unknown>);
    const normalized: Record<string, unknown> = {};
    for (const [key, entryValue] of entries) {
      normalized[key] = normalize(entryValue, depth + 1);
    }

    return normalized;
  };

  try {
    return JSON.stringify(normalize(value, 0));
  } catch {
    return String(value);
  }
}

function valuesAreEqual(left: unknown, right: unknown): boolean {
  return safeSerialize(left) === safeSerialize(right);
}

// Bigger array visualization with index labels and swap highlighting
const ArrayVisualizer: React.FC<{
  value: number[];
  prevValue?: number[];
  themeColor: ThemeColor;
  variables?: VariableMap;
}> = ({ value, prevValue, themeColor, variables = {} }) => {
  if (!value || value.length === 0 || value.length > 30) return null;

  const maxVal = Math.max(...value.map(Math.abs), 1);
  const isSaffron = themeColor === 'saffron';

  // Extract potential pointers (values that are integers and correspond to valid indices)
  const activePointers = new Map<number, string[]>(); // index -> pointer names
  Object.entries(variables).forEach(([key, val]) => {
    if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val < value.length) {
      // Ignore large common loop boundaries/values
      const ignored = new Set(['n', 'limit', 'target', 'sum', 'maxVal', 'currentMax', 'globalMax']);
      if (!ignored.has(key)) {
        if (!activePointers.has(val)) activePointers.set(val, []);
        activePointers.get(val)!.push(key);
      }
    }
  });

  // Detect which indices changed
  const changedIndices = new Set<number>();
  if (prevValue && prevValue.length === value.length) {
    for (let i = 0; i < value.length; i++) {
      if (prevValue[i] !== value[i]) changedIndices.add(i);
    }
  }

  // Detect swap pattern: exactly 2 indices changed and values swapped
  let swapIndices: [number, number] | null = null;
  if (changedIndices.size === 2 && prevValue) {
    const [a, b] = Array.from(changedIndices);
    if (prevValue[a] === value[b] && prevValue[b] === value[a]) {
      swapIndices = [a, b];
    }
  }

  return (
    <div className="mt-3 mb-2">
      {/* Swap indicator */}
      {swapIndices && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center text-[10px] font-bold uppercase tracking-widest mb-3 ${isSaffron ? 'text-saffron-600 dark:text-saffron-400' : 'text-blue-600 dark:text-blue-400'}`}
        >
          ↔ swapped [{swapIndices[0]}] ⟷ [{swapIndices[1]}]
        </motion.div>
      )}

      {/* Array cells */}
      <div className="flex items-end gap-[6px] px-2 h-24">
        {value.map((v, i) => {
          const height = Math.max(15, (Math.abs(v) / maxVal) * 100);
          const isChanged = changedIndices.has(i);
          const isSwapped = swapIndices && (i === swapIndices[0] || i === swapIndices[1]);

          // Structural Neo-brutalist colors
          let barBg = 'bg-slate-300 dark:bg-[#333]';
          let cellBg = 'bg-white dark:bg-[#111113]';
          let cellText = 'text-slate-800 dark:text-slate-200';
          let borderColor = 'border-slate-900 dark:border-[#444]';

          const pointers = activePointers.get(i) || [];
          const isPointer = pointers.length > 0;

          if (isSwapped) {
            barBg = 'bg-yellow-400 dark:bg-yellow-500';
            cellBg = 'bg-yellow-50 dark:bg-[#2a2400]';
            cellText = 'text-yellow-900 dark:text-yellow-200';
            borderColor = 'border-yellow-500 dark:border-yellow-600';
          } else if (isChanged) {
            barBg = isSaffron
              ? 'bg-saffron-400 dark:bg-saffron-500'
              : 'bg-blue-400 dark:bg-blue-500';
            cellBg = isSaffron ? 'bg-saffron-50 dark:bg-[#1e1300]' : 'bg-blue-50 dark:bg-[#00132a]';
            cellText = isSaffron
              ? 'text-saffron-900 dark:text-saffron-200'
              : 'text-blue-900 dark:text-blue-200';
            borderColor = isSaffron
              ? 'border-saffron-500 dark:border-saffron-600'
              : 'border-blue-500 dark:border-blue-600';
          } else if (isPointer) {
            barBg = 'bg-emerald-300 dark:bg-emerald-700';
            borderColor = 'border-emerald-500 dark:border-emerald-600';
            cellBg = 'bg-emerald-50 dark:bg-emerald-900/30';
            cellText = 'text-emerald-900 dark:text-emerald-300';
          }

          return (
            <motion.div
              key={i}
              className={`flex flex-col items-center flex-1 min-w-0 group relative`}
              layout
            >
              {/* Pointer Flags */}
              {isPointer && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                  <div className="flex gap-0.5 pointer-events-none">
                    {pointers.map((p) => (
                      <span
                        key={p}
                        className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 border border-emerald-700 shadow-[1px_1px_0_rgba(0,0,0,1)] dark:shadow-none"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="w-0.5 h-1.5 bg-emerald-500 mt-0.5"></div>
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full relative flex flex-col justify-end mt-[18px]"
                style={{ height: 'calc(100% - 18px)' }}
              >
                <motion.div
                  className={`w-full border-[2px] border-b-0 ${barBg} ${borderColor}`}
                  initial={false}
                  animate={{ height: `${height}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, mass: 0.8 }}
                  style={{ minHeight: '8px' }}
                />
              </div>

              {/* Value cell */}
              <div
                className={`w-full text-center py-2 border-[2px] text-sm font-mono font-black transition-all ${cellBg} ${borderColor} ${cellText} drop-shadow-[2px_2px_0_rgba(15,23,42,1)] dark:drop-shadow-[2px_2px_0_rgba(0,0,0,1)] group-hover:-translate-y-[1px] relative z-10`}
              >
                {v}
              </div>

              {/* Index label */}
              <span
                className={`text-[10px] mt-2 font-mono tracking-wider ${isChanged ? (isSaffron ? 'text-saffron-600 dark:text-saffron-400 font-bold' : 'text-blue-600 dark:text-blue-400 font-bold') : isPointer ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-500'}`}
              >
                [{i}]
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Card-style variable display
const VariableCard: React.FC<{
  name: string;
  value: any;
  prevValue?: any;
  wasPresent: boolean;
  themeColor: ThemeColor;
  variables: VariableMap;
}> = ({ name, value, prevValue, wasPresent, themeColor, variables }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isObject = value !== null && typeof value === 'object';
  const isEmpty = isObject && Object.keys(value).length === 0;
  const isNumericArray =
    Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'number');
  const isFunction = typeof value === 'string' && value === '[Function]';
  const typeLabel = Array.isArray(value)
    ? `Array(${value.length})`
    : isFunction
      ? 'Function'
      : typeof value === 'object' && value !== null
        ? 'Object'
        : typeof value;

  const isNew = !wasPresent;
  const hasChanged = !isNew && !valuesAreEqual(value, prevValue);

  let delta: number | null = null;
  let changeDir: 'up' | 'down' | 'mod' | null = null;
  if (hasChanged && typeof value === 'number' && typeof prevValue === 'number') {
    delta = value - prevValue;
    changeDir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'mod';
  } else if (hasChanged) {
    changeDir = 'mod';
  }

  const isLoopVar =
    hasChanged &&
    typeof value === 'number' &&
    typeof prevValue === 'number' &&
    Math.abs(value - prevValue) === 1;
  const isSaffron = themeColor === 'saffron';

  // Formatted value display
  const renderValue = () => {
    if (isFunction)
      return (
        <span className="text-purple-500 dark:text-purple-400 italic font-medium text-xs">ƒ()</span>
      );
    if (value === null) return <span className="text-slate-400 italic text-sm">null</span>;
    if (value === undefined)
      return <span className="text-slate-400 italic text-sm">undefined</span>;
    if (typeof value === 'string')
      return (
        <span
          className="text-emerald-600 dark:text-emerald-400 font-bold text-lg truncate max-w-full inline-block"
          title={value}
        >
          "{value}"
        </span>
      );
    if (typeof value === 'boolean')
      return (
        <span className="text-purple-600 dark:text-purple-400 font-bold text-lg uppercase">
          {String(value)}
        </span>
      );
    if (typeof value === 'number') {
      const displayValue = Number.isInteger(value)
        ? value
        : Number.parseFloat(value.toPrecision(7));
      return (
        <span
          className={`${isSaffron ? 'text-saffron-700 dark:text-saffron-300' : 'text-blue-700 dark:text-blue-300'} font-black text-3xl tabular-nums truncate max-w-full inline-block`}
          title={String(value)}
        >
          {displayValue}
        </span>
      );
    }
    if (isNumericArray)
      return <span className="text-slate-400 text-sm font-semibold">[{value.length} items]</span>;
    if (isObject)
      return (
        <span className="text-slate-400 text-sm font-semibold">
          {Array.isArray(value) ? `[${value.length}]` : '{...}'}
        </span>
      );
    return (
      <span className="text-slate-500 text-lg truncate max-w-full inline-block">
        {String(value)}
      </span>
    );
  };

  const cardBorder = isNew
    ? 'border-[2px] border-yellow-400 dark:border-yellow-600 shadow-[2px_2px_0_#fef08a] dark:shadow-[2px_2px_0_#854d0e]'
    : hasChanged
      ? isSaffron
        ? 'border-[2px] border-saffron-400 dark:border-saffron-600 shadow-[2px_2px_0_#fbd38d] dark:shadow-[2px_2px_0_#9c4221]'
        : 'border-[2px] border-blue-400 dark:border-blue-600 shadow-[2px_2px_0_#93c5fd] dark:shadow-[2px_2px_0_#1e3a8a]'
      : 'border-[2px] border-slate-900 dark:border-[#333] shadow-[2px_2px_0_rgba(0,0,0,0.1)] dark:shadow-[2px_2px_0_#000]';

  const cardBg = isNew
    ? 'bg-yellow-50 dark:bg-[#1a1c11]'
    : hasChanged
      ? isSaffron
        ? 'bg-orange-50 dark:bg-[#1c1411]'
        : 'bg-blue-50 dark:bg-[#11151c]'
      : 'bg-white dark:bg-[#161618]';

  return (
    <motion.div
      layout
      initial={isNew ? { scale: 0.9, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div
        className={`border-2 ${cardBorder} ${cardBg} transition-all duration-200 ease-out overflow-hidden ${isObject && !isEmpty ? 'cursor-pointer active:translate-y-[1px]' : ''}`}
        onClick={() => isObject && !isEmpty && setIsExpanded(!isExpanded)}
      >
        {/* Main Card Content */}
        <div
          className={`px-4 py-3 flex ${isNumericArray || (isObject && !isEmpty) ? 'flex-col gap-3' : 'items-center justify-between gap-4'}`}
        >
          {/* Left: Name & Type */}
          <div className="flex flex-col gap-1 min-w-0 shrink-0">
            <div className="flex items-center gap-2">
              {isObject && !isEmpty && (
                <ChevronRight
                  size={14}
                  className={`text-slate-400 transition-transform flex-shrink-0 cursor-pointer ${isExpanded ? 'rotate-90' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                />
              )}
              <span className="text-base font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 truncate">
                {name}
              </span>

              {/* Badges */}
              {isNew && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-0.5 text-[9px] font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 border border-yellow-300 dark:border-yellow-700 flex-shrink-0"
                >
                  <Sparkles size={10} /> NEW
                </motion.span>
              )}

              {isLoopVar && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 border flex-shrink-0 ${isSaffron ? 'text-orange-600 bg-orange-100 border-orange-300 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-700' : 'text-indigo-600 bg-indigo-100 border-indigo-300 dark:text-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-700'}`}
                >
                  <Repeat size={10} />
                </span>
              )}
            </div>

            {/* Type & Change Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 italic uppercase tracking-wider opacity-80">
                {typeLabel}
              </span>

              {changeDir && !isNumericArray && (
                <div className="flex items-center">
                  {changeDir === 'up' && (
                    <motion.span
                      initial={{ y: 3, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex items-center gap-0.5 text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 px-1 py-0.5"
                    >
                      <ArrowUp size={10} strokeWidth={3} />+{delta}
                    </motion.span>
                  )}
                  {changeDir === 'down' && (
                    <motion.span
                      initial={{ y: -3, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex items-center gap-0.5 text-[9px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 px-1 py-0.5"
                    >
                      <ArrowDown size={10} strokeWidth={3} />
                      {delta}
                    </motion.span>
                  )}
                  {changeDir === 'mod' && (
                    <span
                      className={`${isSaffron ? 'text-saffron-500' : 'text-blue-500'} animate-pulse px-1`}
                    >
                      <RefreshCw size={10} />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Value */}
          <div
            className={`flex items-baseline gap-4 ${isNumericArray || (isObject && !isEmpty) ? 'justify-start' : 'justify-end text-right flex-1'}`}
          >
            {hasChanged && typeof prevValue !== 'object' && (
              <span className="text-[16px] text-slate-400 line-through opacity-50 flex-shrink-0 font-bold decoration-2">
                {typeof prevValue === 'string' ? `"${prevValue}"` : String(prevValue)}
              </span>
            )}
            {renderValue()}
          </div>
        </div>

        {/* Array Visualization */}
        {isNumericArray && (
          <div className="px-3 pb-3 mt-4">
            <ArrayVisualizer
              value={value as number[]}
              prevValue={Array.isArray(prevValue) ? (prevValue as number[]) : undefined}
              themeColor={themeColor}
              variables={variables}
            />
          </div>
        )}

        {/* Expanded children for objects/arrays */}
        <AnimatePresence>
          {isExpanded && isObject && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-200/60 dark:border-slate-700/40"
            >
              <div className="p-2 space-y-1 bg-slate-50/50 dark:bg-slate-900/30">
                {Object.keys(value).map((key) => {
                  const indexChanged = prevValue && !valuesAreEqual(value[key], prevValue?.[key]);
                  return (
                    <div
                      key={key}
                      className={`flex justify-between items-center px-2.5 py-1.5 border text-xs font-mono ${
                        indexChanged
                          ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/15 dark:border-amber-700/40'
                          : 'bg-white/50 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700/40'
                      }`}
                    >
                      <span className="text-slate-500 dark:text-slate-400 font-bold">[{key}]</span>
                      <span
                        className={`font-semibold ${indexChanged ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        {safeSerialize(value[key], 2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const VariablesPanel: React.FC<VariablesPanelProps> = ({
  variables,
  prevVariables,
  themeColor,
}) => {
  const keys = Object.keys(variables);
  const isSaffron = themeColor === 'saffron';

  return (
    <div className="grid grid-cols-1 gap-2 p-2">
      {/* Always render — uses useRef to cache last-known structure across scopes */}
      <StructureVisualizer variables={variables} themeColor={themeColor} />

      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-28 border-[2px] border-dashed border-slate-900 dark:border-[#333] bg-slate-100 dark:bg-[#111113] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000] transition-all duration-300">
          <span
            className={`border px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isSaffron ? 'border-saffron-500 bg-saffron-100 text-saffron-700 dark:border-saffron-600 dark:bg-saffron-900/30 dark:text-saffron-400' : 'border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}
          >
            Scope
          </span>
          <span className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
            No variables in scope
          </span>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {keys.map((key) => (
            <VariableCard
              key={key}
              name={key}
              value={variables[key]}
              prevValue={prevVariables[key]}
              wasPresent={key in prevVariables}
              themeColor={themeColor}
              variables={variables}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default VariablesPanel;
