import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableMap } from '../../types';
import { ChevronRight, ArrowUp, ArrowDown, Sparkles, RefreshCw, Repeat } from 'lucide-react';

interface VariablesPanelProps {
    variables: VariableMap;
    prevVariables: VariableMap;
    themeColor: 'saffron' | 'blue';
}

// Bigger array visualization with index labels and swap highlighting
const ArrayVisualizer: React.FC<{
    value: number[];
    prevValue?: number[];
    themeColor: 'saffron' | 'blue';
}> = ({ value, prevValue, themeColor }) => {
    if (!value || value.length === 0 || value.length > 30) return null;

    const maxVal = Math.max(...value.map(Math.abs), 1);
    const isSaffron = themeColor === 'saffron';

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
                    className={`text-center text-[10px] font-bold uppercase tracking-widest mb-2 ${isSaffron ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'}`}
                >
                    ↔ swapped [{swapIndices[0]}] ⟷ [{swapIndices[1]}]
                </motion.div>
            )}

            {/* Array cells */}
            <div className="flex items-end gap-1 px-1">
                {value.map((v, i) => {
                    const height = Math.max(20, (Math.abs(v) / maxVal) * 100);
                    const isChanged = changedIndices.has(i);
                    const isSwapped = swapIndices && (i === swapIndices[0] || i === swapIndices[1]);

                    let barBg = isSaffron
                        ? 'bg-gradient-to-t from-saffron-500 to-saffron-300 dark:from-saffron-600 dark:to-saffron-400'
                        : 'bg-gradient-to-t from-blue-500 to-blue-300 dark:from-blue-600 dark:to-blue-400';
                    if (isSwapped) {
                        barBg = 'bg-gradient-to-t from-amber-500 to-yellow-300 dark:from-amber-500 dark:to-yellow-400';
                    } else if (isChanged) {
                        barBg = isSaffron
                            ? 'bg-gradient-to-t from-orange-500 to-amber-300 dark:from-orange-600 dark:to-amber-400'
                            : 'bg-gradient-to-t from-cyan-500 to-sky-300 dark:from-cyan-600 dark:to-sky-400';
                    }

                    const cellBorder = isSwapped
                        ? 'ring-2 ring-amber-400 dark:ring-amber-500'
                        : isChanged
                            ? 'ring-1 ring-orange-300 dark:ring-orange-500/50'
                            : '';

                    return (
                        <motion.div
                            key={i}
                            className="flex flex-col items-center flex-1 min-w-0"
                            layout
                        >
                            {/* Bar */}
                            <div className={`w-full rounded-t-md ${barBg} ${cellBorder} transition-all relative`}
                                style={{ minHeight: '8px' }}
                            >
                                <motion.div
                                    className="w-full rounded-t-md"
                                    initial={false}
                                    animate={{ height: `${height}%` }}
                                    transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                                    style={{ height: `${height}%`, minHeight: '8px' }}
                                />
                            </div>

                            {/* Value cell */}
                            <div className={`w-full text-center py-1 rounded-b-md border text-[11px] font-mono font-bold transition-all ${
                                isSwapped
                                    ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300'
                                    : isChanged
                                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                                {v}
                            </div>

                            {/* Index label */}
                            <span className={`text-[8px] mt-0.5 font-mono ${isChanged ? 'text-amber-500 font-bold' : 'text-slate-400 dark:text-slate-600'}`}>
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
    themeColor: 'saffron' | 'blue';
}> = ({ name, value, prevValue, wasPresent, themeColor }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const isObject = value !== null && typeof value === 'object';
    const isEmpty = isObject && Object.keys(value).length === 0;
    const isNumericArray = Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'number');
    const isFunction = typeof value === 'string' && value === '[Function]';
    const typeLabel = Array.isArray(value) ? `Array(${value.length})` : isFunction ? 'Function' : typeof value === 'object' && value !== null ? 'Object' : typeof value;

    const isNew = !wasPresent;
    const hasChanged = !isNew && JSON.stringify(value) !== JSON.stringify(prevValue);

    let delta: number | null = null;
    let changeDir: 'up' | 'down' | 'mod' | null = null;
    if (hasChanged && typeof value === 'number' && typeof prevValue === 'number') {
        delta = value - prevValue;
        changeDir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'mod';
    } else if (hasChanged) {
        changeDir = 'mod';
    }

    const isLoopVar = hasChanged && typeof value === 'number' && typeof prevValue === 'number' && Math.abs(value - prevValue) === 1;
    const isSaffron = themeColor === 'saffron';

    // Formatted value display
    const renderValue = () => {
        if (isFunction) return <span className="text-purple-500 dark:text-purple-400 italic font-medium text-xs">ƒ()</span>;
        if (value === null) return <span className="text-slate-400 italic text-sm">null</span>;
        if (value === undefined) return <span className="text-slate-400 italic text-sm">undefined</span>;
        if (typeof value === 'string') return <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">"{value}"</span>;
        if (typeof value === 'boolean') return <span className="text-purple-600 dark:text-purple-400 font-bold text-sm uppercase">{String(value)}</span>;
        if (typeof value === 'number') return <span className="text-blue-700 dark:text-blue-300 font-black text-lg tabular-nums">{value}</span>;
        if (isNumericArray) return <span className="text-slate-400 text-xs">[{value.length} items]</span>;
        if (isObject) return <span className="text-slate-400 text-xs">{Array.isArray(value) ? `[${value.length}]` : '{...}'}</span>;
        return <span className="text-slate-500 text-sm">{String(value)}</span>;
    };

    const cardBorder = isNew
        ? 'border-yellow-300 dark:border-yellow-600 shadow-yellow-100 dark:shadow-yellow-900/20'
        : hasChanged
            ? isSaffron
                ? 'border-saffron-300 dark:border-saffron-700 shadow-saffron-100 dark:shadow-saffron-900/20'
                : 'border-blue-300 dark:border-blue-700 shadow-blue-100 dark:shadow-blue-900/20'
            : 'border-slate-200/80 dark:border-slate-700/60';

    const cardBg = isNew
        ? 'bg-gradient-to-br from-yellow-50/80 to-amber-50/50 dark:from-yellow-900/15 dark:to-amber-900/10'
        : hasChanged
            ? isSaffron
                ? 'bg-gradient-to-br from-saffron-50/60 to-orange-50/40 dark:from-saffron-900/10 dark:to-orange-900/10'
                : 'bg-gradient-to-br from-blue-50/60 to-cyan-50/40 dark:from-blue-900/10 dark:to-cyan-900/10'
            : 'bg-white/70 dark:bg-slate-800/50';

    return (
        <motion.div
            layout
            initial={isNew ? { scale: 0.9, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
            <div
                className={`rounded-xl border-2 ${cardBorder} ${cardBg} backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${isObject && !isEmpty ? 'cursor-pointer' : ''}`}
                onClick={() => isObject && !isEmpty && setIsExpanded(!isExpanded)}
            >
                {/* Card Header */}
                <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {/* Expand arrow for objects */}
                        {isObject && !isEmpty && (
                            <ChevronRight
                                size={12}
                                className={`text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                            />
                        )}

                        {/* Variable name */}
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                            {name}
                        </span>

                        {/* Badges */}
                        {isNew && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-0.5 text-[9px] font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded-full flex-shrink-0"
                            >
                                <Sparkles size={8} /> NEW
                            </motion.span>
                        )}

                        {isLoopVar && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isSaffron ? 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20' : 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20'}`}>
                                <Repeat size={8} />
                            </span>
                        )}

                        {/* Type label */}
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 italic flex-shrink-0">
                            {typeLabel}
                        </span>
                    </div>

                    {/* Change indicator */}
                    {changeDir && (
                        <div className="flex-shrink-0 ml-2">
                            {changeDir === 'up' && (
                                <motion.span initial={{ y: 3, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    className="flex items-center gap-0.5 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
                                    <ArrowUp size={10} strokeWidth={3} />+{delta}
                                </motion.span>
                            )}
                            {changeDir === 'down' && (
                                <motion.span initial={{ y: -3, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    className="flex items-center gap-0.5 text-[10px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
                                    <ArrowDown size={10} strokeWidth={3} />{delta}
                                </motion.span>
                            )}
                            {changeDir === 'mod' && (
                                <span className={`${isSaffron ? 'text-saffron-500' : 'text-blue-500'} animate-pulse`}>
                                    <RefreshCw size={10} />
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Card Body — Value */}
                <div className="px-3 pb-2.5 flex items-baseline justify-between gap-2">
                    <div className="text-right flex-1">
                        {renderValue()}
                    </div>
                    {hasChanged && typeof prevValue !== 'object' && (
                        <span className="text-[10px] text-slate-400 line-through opacity-60 flex-shrink-0">
                            {typeof prevValue === 'string' ? `"${prevValue}"` : String(prevValue)}
                        </span>
                    )}
                </div>

                {/* Array Visualization */}
                {isNumericArray && (
                    <div className="px-2 pb-2">
                        <ArrayVisualizer
                            value={value as number[]}
                            prevValue={Array.isArray(prevValue) ? prevValue as number[] : undefined}
                            themeColor={themeColor}
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
                                {Object.keys(value).map(key => {
                                    const indexChanged = prevValue && JSON.stringify(value[key]) !== JSON.stringify(prevValue?.[key]);
                                    return (
                                        <div key={key}
                                            className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-xs font-mono ${
                                                indexChanged
                                                    ? 'bg-amber-50 dark:bg-amber-900/15 ring-1 ring-amber-200 dark:ring-amber-700/40'
                                                    : 'bg-white/50 dark:bg-slate-800/30'
                                            }`}
                                        >
                                            <span className="text-slate-500 dark:text-slate-400 font-bold">[{key}]</span>
                                            <span className={`font-semibold ${indexChanged ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {JSON.stringify(value[key])}
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

const VariablesPanel: React.FC<VariablesPanelProps> = ({ variables, prevVariables, themeColor }) => {
    const keys = Object.keys(variables);

    if (keys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500 italic glass-panel rounded-2xl border-2 border-dashed border-gray-200/50 dark:border-slate-700/50 m-2 transition-all duration-300">
                <span className="text-sm font-medium">No variables in scope</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-2 p-2">
            <AnimatePresence mode='popLayout'>
                {keys.map(key => (
                    <VariableCard
                        key={key}
                        name={key}
                        value={variables[key]}
                        prevValue={prevVariables[key]}
                        wasPresent={key in prevVariables}
                        themeColor={themeColor}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default VariablesPanel;