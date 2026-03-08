import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableMap } from '../../types';
import { ChevronRight, ChevronDown, ArrowUp, ArrowDown, Sparkles, RefreshCw, Repeat } from 'lucide-react';

interface VariablesPanelProps {
    variables: VariableMap;
    prevVariables: VariableMap;
    themeColor: 'saffron' | 'blue';
}

// Compact inline array bar chart
const ArrayVisualizer: React.FC<{
    value: number[];
    prevValue?: number[];
    themeColor: 'saffron' | 'blue';
}> = ({ value, prevValue, themeColor }) => {
    if (!value || value.length === 0 || value.length > 20) return null;

    const maxVal = Math.max(...value.map(Math.abs), 1);
    const isSaffron = themeColor === 'saffron';
    const barColor = isSaffron ? 'bg-saffron-400 dark:bg-saffron-500' : 'bg-blue-400 dark:bg-blue-500';
    const barChangedColor = isSaffron ? 'bg-amber-500 dark:bg-amber-400' : 'bg-cyan-400 dark:bg-cyan-300';

    return (
        <div className="flex items-end gap-px mt-2 px-1 h-10">
            {value.map((v, i) => {
                const height = Math.max(4, (Math.abs(v) / maxVal) * 100);
                const changed = prevValue && prevValue[i] !== undefined && prevValue[i] !== v;
                return (
                    <motion.div
                        key={i}
                        className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
                        initial={false}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            className={`w-full rounded-sm ${changed ? barChangedColor : barColor} transition-all duration-300`}
                            style={{ height: `${height}%`, minHeight: '3px' }}
                            initial={false}
                            animate={{ height: `${height}%` }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        />
                        <span className={`text-[8px] font-mono leading-none ${changed ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                            {v}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
};

const RenderPrimitive: React.FC<{ value: any }> = ({ value }) => {
    if (value === null) return <span className="text-slate-400/80 font-medium italic">null</span>;
    if (value === undefined) return <span className="text-slate-400/80 font-medium italic">undefined</span>;
    if (typeof value === 'string') return <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 font-semibold tracking-wide">"{value}"</span>;
    if (typeof value === 'number') return <span className="text-gradient-blue font-black tracking-tight">{value}</span>;
    if (typeof value === 'boolean') return <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-fuchsia-500 dark:from-purple-400 dark:to-fuchsia-300 font-extrabold uppercase text-[11px] tracking-widest">{String(value)}</span>;
    return <span className="text-slate-500 italic">Complex</span>;
};

const ValueNode: React.FC<{
    name: string;
    value: any;
    prevValue?: any;
    wasPresent: boolean;
    depth?: number;
    themeColor: 'saffron' | 'blue';
}> = ({ name, value, prevValue, wasPresent, depth = 0, themeColor }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const isObject = value !== null && typeof value === 'object';
    const isEmpty = isObject && Object.keys(value).length === 0;
    const isNumericArray = Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'number');
    const typeLabel = Array.isArray(value) ? `Array(${value.length})` : 'Object';

    // Change Detection Logic
    const isNew = !wasPresent;
    const hasChanged = !isNew && JSON.stringify(value) !== JSON.stringify(prevValue);

    let changeType: 'none' | 'inc' | 'dec' | 'mod' = 'none';
    let delta = 0;

    // Heuristic: Small integer changes often indicate loops
    const isLoopVar = hasChanged && typeof value === 'number' && typeof prevValue === 'number' && Math.abs(value - prevValue) === 1;

    if (hasChanged && typeof value === 'number' && typeof prevValue === 'number') {
        delta = value - prevValue;
        if (delta > 0) changeType = 'inc';
        else if (delta < 0) changeType = 'dec';
        else changeType = 'mod';
    } else if (hasChanged) {
        changeType = 'mod';
    }

    // Theme Configuration
    const styles = {
        saffron: {
            modBg: 'rgba(255, 237, 213, 0.6)', // saffron-100
            border: 'border-saffron-200 dark:border-saffron-900/50',
            modIcon: 'text-saffron-500',
            bgSoft: 'bg-saffron-50/50 dark:bg-saffron-900/10',
            borderSoft: 'border-saffron-100 dark:border-saffron-900/30'
        },
        blue: {
            modBg: 'rgba(219, 234, 254, 0.6)', // blue-100
            border: 'border-blue-200 dark:border-blue-900/50',
            modIcon: 'text-blue-500',
            bgSoft: 'bg-blue-50/50 dark:bg-blue-900/10',
            borderSoft: 'border-blue-100 dark:border-blue-900/30'
        }
    };
    const currentTheme = styles[themeColor];

    const bgColorStart = isNew
        ? 'rgba(254, 240, 138, 0.4)' // yellow-200 always for new
        : hasChanged
            ? currentTheme.modBg
            : 'rgba(0,0,0,0)';

    if (!isObject) {
        return (
            <motion.div
                layout
                initial={isNew ? { x: -20, opacity: 0 } : false}
                animate={{
                    x: 0,
                    opacity: 1,
                    backgroundColor: [bgColorStart, 'rgba(0,0,0,0)'],
                }}
                transition={{ duration: 0.5 }}
                className={`flex justify-between items-center py-2 px-3 rounded-xl font-mono text-sm border mb-2 transition-colors duration-300 ${hasChanged || isNew
                    ? currentTheme.border
                    : 'border-white/20 dark:border-slate-700/30 bg-white/40 dark:bg-slate-800/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white/60 dark:hover:bg-slate-800/40'
                    }`}
                style={{ marginLeft: depth * 16 }}
            >
                <div className="flex items-center gap-2">
                    {/* New Badge */}
                    {isNew && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm"
                        >
                            <Sparkles size={10} /> New
                        </motion.span>
                    )}

                    {/* Loop Indicator */}
                    {isLoopVar && (
                        <motion.span
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className={`flex items-center gap-1 ${themeColor === 'saffron' ? 'bg-orange-100 text-orange-700 dark:text-orange-400' : 'bg-indigo-100 text-indigo-700 dark:text-indigo-400'} dark:bg-opacity-20 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm`}
                            title="Loop Variable"
                        >
                            <Repeat size={10} />
                        </motion.span>
                    )}

                    <span className="text-slate-700 dark:text-slate-300 font-bold">{name}</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Change Indicators with Deltas */}
                    {changeType === 'inc' && (
                        <motion.div
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded"
                        >
                            <ArrowUp size={12} strokeWidth={3} />
                            <span>+{delta}</span>
                        </motion.div>
                    )}
                    {changeType === 'dec' && (
                        <motion.div
                            initial={{ y: -5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded"
                        >
                            <ArrowDown size={12} strokeWidth={3} />
                            <span>{delta}</span>
                        </motion.div>
                    )}
                    {changeType === 'mod' && (
                        <div className={`${currentTheme.modIcon} dark:text-opacity-80 animate-pulse`} title="Modified">
                            <RefreshCw size={12} />
                        </div>
                    )}

                    <div className="flex flex-col items-end leading-none">
                        <RenderPrimitive value={value} />
                        {hasChanged && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600 decoration-1 opacity-75 mt-0.5">
                                {JSON.stringify(prevValue)}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    // Complex Object/Array
    return (
        <div className="font-mono text-sm mb-1" style={{ marginLeft: depth * 16 }}>
            <motion.div
                className={`flex items-center gap-2 py-2 px-3 rounded-xl cursor-pointer transition-all border ${hasChanged || isNew ? `${currentTheme.bgSoft} ${currentTheme.borderSoft}` : 'border-white/20 dark:border-slate-700/30 bg-white/40 dark:bg-slate-800/20 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-slate-800/40 shadow-sm'
                    }`}
                animate={hasChanged ? { backgroundColor: [currentTheme.modBg, 'rgba(0,0,0,0)'] } : {}}
                onClick={() => !isEmpty && setIsExpanded(!isExpanded)}
            >
                <button
                    disabled={isEmpty}
                    className={`p-0.5 rounded text-slate-400 ${isEmpty ? 'opacity-30' : 'hover:text-slate-600 dark:hover:text-slate-200'} transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
                >
                    {isEmpty ? <div className="w-4" /> : <ChevronRight size={14} />}
                </button>

                <span className="text-slate-700 dark:text-slate-300 font-bold tracking-tight">{name}:</span>
                <span className="text-slate-400/80 dark:text-slate-500/80 italic text-[11px] ml-1">{typeLabel}</span>

                {isNew && (
                    <span className="ml-2 flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold">
                        <Sparkles size={10} />
                    </span>
                )}

                {hasChanged && !isNew && (
                    <div className={`ml-1 ${currentTheme.modIcon} dark:text-opacity-80`} title="Modified">
                        <RefreshCw size={10} />
                    </div>
                )}

                {!isExpanded && !isEmpty && <span className="text-slate-400 text-xs ml-auto opacity-60 font-medium tracking-widest">{Array.isArray(value) ? '[...]' : '{...}'}</span>}
                {isEmpty && <span className="text-slate-400 text-xs ml-auto opacity-60 font-medium tracking-widest">{Array.isArray(value) ? '[]' : '{}'}</span>}
            </motion.div>

            {/* Array bar visualization - always visible for numeric arrays */}
            {isNumericArray && (
                <ArrayVisualizer
                    value={value as number[]}
                    prevValue={Array.isArray(prevValue) ? prevValue as number[] : undefined}
                    themeColor={themeColor}
                />
            )}

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-l border-slate-200/50 dark:border-slate-700/50 ml-4 pl-2 mt-1"
                    >
                        {Object.keys(value).map(key => {
                            const indexChanged = prevValue && JSON.stringify(value[key]) !== JSON.stringify(prevValue?.[key]);
                            return (
                                <div key={key} className={`${indexChanged ? 'ring-1 ring-amber-300/50 dark:ring-amber-500/30 rounded-lg' : ''}`}>
                                    <ValueNode
                                        name={key}
                                        value={value[key]}
                                        prevValue={prevValue?.[key]}
                                        wasPresent={prevValue && key in prevValue}
                                        depth={0}
                                        themeColor={themeColor}
                                    />
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
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
        <div className="flex flex-col gap-1 p-2">
            <AnimatePresence mode='popLayout'>
                {keys.map(key => (
                    <ValueNode
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