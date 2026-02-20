import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableMap } from '../../types';
import { ChevronRight, ChevronDown, ArrowUp, ArrowDown, Sparkles, RefreshCw, Repeat } from 'lucide-react';

interface VariablesPanelProps {
    variables: VariableMap;
    prevVariables: VariableMap;
    themeColor: 'saffron' | 'blue';
}

const RenderPrimitive: React.FC<{ value: any }> = ({ value }) => {
    if (value === null) return <span className="text-slate-500 font-medium">null</span>;
    if (value === undefined) return <span className="text-slate-500 font-medium">undefined</span>;
    if (typeof value === 'string') return <span className="text-green-600 dark:text-green-400 font-medium">"{value}"</span>;
    if (typeof value === 'number') return <span className="text-blue-600 dark:text-blue-400 font-bold">{value}</span>;
    if (typeof value === 'boolean') return <span className="text-purple-600 dark:text-purple-400 font-bold">{String(value)}</span>;
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
                className={`flex justify-between items-center py-2 px-3 rounded-lg font-mono text-sm border mb-1 transition-colors ${hasChanged || isNew
                        ? currentTheme.border
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/30'
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
        <div className="font-mono text-sm" style={{ marginLeft: depth * 16 }}>
            <motion.div
                className={`flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-colors border border-transparent ${hasChanged || isNew ? `${currentTheme.bgSoft} ${currentTheme.borderSoft}` : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                animate={hasChanged ? { backgroundColor: [currentTheme.modBg, 'rgba(0,0,0,0)'] } : {}}
                onClick={() => !isEmpty && setIsExpanded(!isExpanded)}
            >
                <button
                    disabled={isEmpty}
                    className={`p-0.5 rounded text-slate-400 ${isEmpty ? 'opacity-30' : 'hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                    {isEmpty ? <div className="w-4" /> : (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </button>

                <span className="text-slate-700 dark:text-slate-300 font-bold">{name}:</span>
                <span className="text-slate-500 dark:text-slate-400 italic text-xs ml-1">{typeLabel}</span>

                {isNew && (
                    <span className="ml-2 flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold">
                        <Sparkles size={10} />
                    </span>
                )}

                {!isExpanded && !isEmpty && <span className="text-slate-400 text-xs ml-1">{Array.isArray(value) ? '[...]' : '{...}'}</span>}
                {isEmpty && <span className="text-slate-400 text-xs ml-1">{Array.isArray(value) ? '[]' : '{}'}</span>}
            </motion.div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-l-2 border-gray-100 dark:border-slate-800 ml-3 pl-1"
                    >
                        {Object.keys(value).map(key => (
                            <ValueNode
                                key={key}
                                name={key}
                                value={value[key]}
                                prevValue={prevValue?.[key]}
                                wasPresent={prevValue && key in prevValue}
                                depth={0}
                                themeColor={themeColor}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const VariablesPanel: React.FC<VariablesPanelProps> = ({ variables, prevVariables, themeColor }) => {
    const keys = Object.keys(variables);

    if (keys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-800 m-2 transition-colors">
                <span className="text-sm">No variables in scope</span>
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