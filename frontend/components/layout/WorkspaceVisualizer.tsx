import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  BarChart3,
  Maximize2,
  Minimize2,
  Terminal as TerminalIcon,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import VariablesPanel from '../VariablesPanel';
import CallStackPanel from '../CallStackPanel';
import PerformancePanel from '../PerformancePanel';
import ConsolePanel from '../ConsolePanel';
import { ThemeColor, getThemeConfig } from '../../theme/theme';
import { ExecutionStep, Timeline, ComplexityAnalysis } from '../../../types';

interface WorkspaceVisualizerProps {
  activeTab: 'variables' | 'stack' | 'performance';
  setActiveTab: (tab: 'variables' | 'stack' | 'performance') => void;
  consoleExpanded: boolean;
  setConsoleExpanded: (expanded: boolean) => void;
  visualizerMode: boolean;
  setVisualizerMode: (mode: boolean) => void;
  themeColor: ThemeColor;
  currentStep: ExecutionStep;
  prevStepVariables: { variables: Record<string, any> };
  timeline: Timeline;
  currentStepIndex: number;
  complexityAnalysis: ComplexityAnalysis | null;
}

const WorkspaceVisualizer: React.FC<WorkspaceVisualizerProps> = ({
  activeTab,
  setActiveTab,
  consoleExpanded,
  setConsoleExpanded,
  visualizerMode,
  setVisualizerMode,
  themeColor,
  currentStep,
  prevStepVariables,
  timeline,
  currentStepIndex,
  complexityAnalysis,
}) => {
  const isSaffron = themeColor === 'saffron';

  const tabActiveText =
    themeColor === 'saffron'
      ? 'text-saffron-600 dark:text-saffron-400'
      : 'text-blue-600 dark:text-blue-400';
  const tabActiveBg = themeColor === 'saffron' ? 'bg-saffron-50/50' : 'bg-blue-50/50';
  const tabActiveShadow =
    themeColor === 'saffron'
      ? 'shadow-[inset_0_-4px_0_#f97316]'
      : 'shadow-[inset_0_-4px_0_#3b82f6]';
  const iconTextClass = themeColor === 'saffron' ? 'text-saffron-500' : 'text-blue-500';

  // ── Step diff (#7) ────────────────────────────────────────────────────────
  const stepDiff = useMemo(() => {
    const prev = prevStepVariables.variables || {};
    const curr = currentStep.variables || {};
    const changes: { name: string; from: unknown; to: unknown; isNew: boolean }[] = [];
    const stringify = (v: unknown) => {
      if (v === null) return 'null';
      if (v === undefined) return '—';
      if (typeof v === 'object') return Array.isArray(v) ? `[${(v as unknown[]).length}]` : '{…}';
      return String(v);
    };
    for (const [key, val] of Object.entries(curr)) {
      if (typeof val === 'function' || (typeof val === 'string' && val === '[Function]')) continue;
      if (typeof val === 'object' && val !== null) continue; // skip objects/arrays for brevity
      const isNew = !(key in prev);
      const changed = !isNew && String(prev[key]) !== String(val);
      if (isNew || changed) {
        changes.push({ name: key, from: prev[key], to: val, isNew });
      }
    }
    return changes;
  }, [currentStep, prevStepVariables]);

  return (
    <div
      className={`min-h-[50vh] md:min-h-0 flex flex-col shrink-0 bg-slate-50 dark:bg-[#111113] border-[2px] border-slate-900 dark:border-[#222] shadow-[2px_2px_0_#1e293b] dark:shadow-[2px_2px_0_#000] z-10 transition-all duration-200 ease-out overflow-hidden ${visualizerMode ? 'w-full md:flex-1' : 'w-full md:w-[480px]'}`}
    >
      <div className="flex items-center justify-end px-3 py-1 bg-white dark:bg-[#161618] border-b-[2px] border-slate-900 dark:border-[#222]">
        <button
          onClick={() => setVisualizerMode(!visualizerMode)}
          className={`flex items-center gap-1.5 border-[2px] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000] transition-all active:translate-y-[2px] active:shadow-none ${
            visualizerMode
              ? isSaffron
                ? 'bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-400 border-saffron-500 dark:border-saffron-700'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-500 dark:border-blue-700'
              : 'bg-slate-100 dark:bg-[#1a1a1c] text-slate-600 dark:text-slate-400 border-slate-900 dark:border-[#333] hover:bg-slate-200 dark:hover:bg-[#222]'
          }`}
          title={visualizerMode ? 'Exit focus mode' : 'Enter focus mode (60/40 split)'}
        >
          {visualizerMode ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          {visualizerMode ? 'Focus' : 'Expand'}
        </button>
      </div>

      {/* Top half: Variables / Call Stack */}
      <div
        className={`flex flex-col min-h-0 transition-all duration-200 ease-out ${consoleExpanded ? 'flex-[3]' : 'flex-[4]'}`}
      >
        {/* Tabs */}
        <div className="flex border-b-[2px] border-slate-900 dark:border-[#222] bg-white dark:bg-[#111113]">
          <button
            onClick={() => setActiveTab('variables')}
            className={`flex-1 border-r-[2px] border-slate-900 py-3.5 text-sm font-black uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors active:translate-y-[1px] dark:border-[#222] ${activeTab === 'variables' ? `${tabActiveText} ${tabActiveBg} ${tabActiveShadow} dark:bg-[#161618]` : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161618]'}`}
          >
            <Layers size={16} /> Variables
          </button>
          <button
            onClick={() => setActiveTab('stack')}
            className={`flex-1 border-r-[2px] border-slate-900 py-3.5 text-sm font-black uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors active:translate-y-[1px] dark:border-[#222] ${activeTab === 'stack' ? `${tabActiveText} ${tabActiveBg} ${tabActiveShadow} dark:bg-[#161618]` : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161618]'}`}
          >
            <Layers size={16} className="rotate-180" /> Call Stack
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex-1 py-3.5 text-sm font-black uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors active:translate-y-[1px] ${activeTab === 'performance' ? `${tabActiveText} ${tabActiveBg} ${tabActiveShadow} dark:bg-[#161618]` : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161618]'}`}
          >
            <BarChart3 size={16} /> Complexity
          </button>
        </div>

        {/* Step diff annotation bar (#7) */}
        <AnimatePresence mode="wait">
          {stepDiff.length > 0 && activeTab === 'variables' && (
            <motion.div
              key={`diff-${currentStepIndex}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#111113] border-b-[2px] border-slate-900 dark:border-[#222] overflow-x-auto custom-scrollbar shrink-0"
            >
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 shrink-0">
                Δ Changed
              </span>
              {stepDiff.map((d) => (
                <span
                  key={d.name}
                  className={`flex items-center gap-1 border-[2px] px-2 py-0.5 text-[10px] font-bold font-mono whitespace-nowrap shadow-[1px_1px_0_rgba(15,23,42,0.5)] ${
                    d.isNew
                      ? 'border-yellow-400 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                      : isSaffron
                      ? 'border-saffron-400 bg-saffron-50 text-saffron-800 dark:border-saffron-700 dark:bg-saffron-900/20 dark:text-saffron-300'
                      : 'border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  }`}
                >
                  <span className="font-black">{d.name}</span>
                  {!d.isNew && (
                    <>
                      <span className="opacity-50 line-through">{String(d.from)}</span>
                      <ArrowRight size={8} className="opacity-50" />
                    </>
                  )}
                  <span>{String(d.to)}</span>
                  {d.isNew && <span className="text-[8px] opacity-60 ml-0.5">NEW</span>}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent p-3 relative">
          {activeTab === 'variables' ? (
            <VariablesPanel
              variables={currentStep.variables || {}}
              prevVariables={prevStepVariables.variables || {}}
              themeColor={themeColor}
            />
          ) : activeTab === 'stack' ? (
            <CallStackPanel stack={currentStep.callStack || []} themeColor={themeColor} />
          ) : (
            <PerformancePanel
              timeline={timeline}
              currentStepIndex={currentStepIndex}
              analysis={complexityAnalysis}
              themeColor={themeColor}
            />
          )}
        </div>
      </div>

      {/* Bottom half: Console */}
      <div
        className={`flex flex-col border-t-[2px] border-slate-900 dark:border-[#222] bg-white dark:bg-[#0A0A0B] transition-all duration-200 ease-out ${consoleExpanded ? 'flex-[3] min-h-[150px]' : 'h-10'}`}
      >
        <button
          className="h-10 flex flex-shrink-0 items-center justify-between px-4 hover:bg-slate-50 dark:hover:bg-[#161618] transition-colors cursor-pointer w-full"
          onClick={() => setConsoleExpanded(!consoleExpanded)}
        >
          <div className="flex items-center gap-2">
            <TerminalIcon size={16} className={iconTextClass} />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-400 uppercase tracking-wider">
              Console Output
            </span>
            {!consoleExpanded &&
              currentStep.consoleOutput &&
              currentStep.consoleOutput.length > 0 && (
                <span className="ml-2 border-[2px] border-slate-900 dark:border-[#333] bg-slate-200 dark:bg-[#222] px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000]">
                  {currentStep.consoleOutput.length}
                </span>
              )}
          </div>
          <div className="text-slate-500 dark:text-slate-600">
            {consoleExpanded ? (
              <ChevronDown size={14} strokeWidth={3} />
            ) : (
              <ChevronUp size={14} strokeWidth={3} />
            )}
          </div>
        </button>

        <AnimatePresence>
          {consoleExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto custom-scrollbar"
            >
              <ConsolePanel logs={currentStep.consoleOutput || []} themeColor={themeColor} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkspaceVisualizer;
