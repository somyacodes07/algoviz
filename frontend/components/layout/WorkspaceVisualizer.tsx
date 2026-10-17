import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Code2,
  Layers,
  Network,
  Terminal as TerminalIcon,
} from 'lucide-react';
import VariablesPanel from '../VariablesPanel';
import CallStackPanel from '../CallStackPanel';
import PerformancePanel from '../PerformancePanel';
import ConsolePanel from '../ConsolePanel';
import StructureVisualizer, { PlayerControlsProps } from '../StructureVisualizer';
import { ThemeColor } from '../../theme/theme';
import { ExecutionStep, Timeline, ComplexityAnalysis } from '../../../types';
import { AppSettings } from '../SettingsModal';

type DetailTab = 'variables' | 'stack' | 'performance';

interface WorkspaceVisualizerProps {
  activeTab: 'variables' | 'stack' | 'performance' | 'diagrams';
  setActiveTab: (tab: 'variables' | 'stack' | 'performance' | 'diagrams') => void;
  consoleExpanded: boolean;
  setConsoleExpanded: (expanded: boolean) => void;
  themeColor: ThemeColor;
  currentStep: ExecutionStep;
  prevStepVariables: { variables: Record<string, any> };
  timeline: Timeline;
  currentStepIndex: number;
  complexityAnalysis: ComplexityAnalysis | null;
  settings: AppSettings;
  onSeekStep?: (index: number) => void;
  playerControlsProps?: PlayerControlsProps;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function compactValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `Array(${value.length})`;
    return 'Object';
  }
  return String(value);
}

function describeStep(current: ExecutionStep, previous: ExecutionStep | undefined): string {
  if (current.isError) return current.errorMessage || 'Execution stopped with an error.';
  if (!previous) return 'Execution is ready. Step forward to see what changes.';

  const before = previous.variables || {};
  const after = current.variables || {};
  const changed = Object.keys(after).filter((name) => !valuesEqual(before[name], after[name]));

  for (const name of changed) {
    const oldValue = before[name];
    const newValue = after[name];
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      const indices = newValue.map((value, index) =>
        valuesEqual(oldValue[index], value) ? -1 : index,
      ).filter((index) => index >= 0);
      if (indices.length === 2 && valuesEqual(oldValue[indices[0]], newValue[indices[1]]) && valuesEqual(oldValue[indices[1]], newValue[indices[0]])) {
        return `${name} swapped values at indices ${indices[0]} and ${indices[1]}.`;
      }
      if (indices.length === 1) return `${name}[${indices[0]}] changed from ${compactValue(oldValue[indices[0]])} to ${compactValue(newValue[indices[0]])}.`;
      return `${name} changed (${indices.length} array positions updated).`;
    }
  }

  const pointerNames = new Set(['i', 'j', 'k', 'left', 'right', 'low', 'high', 'lo', 'hi', 'mid', 'current', 'curr', 'head', 'tail', 'node']);
  const pointerChange = changed.find((name) => pointerNames.has(name.toLowerCase()) && Number.isFinite(before[name]) && Number.isFinite(after[name]));
  if (pointerChange) return `${pointerChange} moved from ${compactValue(before[pointerChange])} to ${compactValue(after[pointerChange])}.`;

  const valueChange = changed.find((name) => typeof after[name] !== 'object' || after[name] === null);
  if (valueChange) {
    if (!(valueChange in before)) return `${valueChange} was created with value ${compactValue(after[valueChange])}.`;
    return `${valueChange} changed from ${compactValue(before[valueChange])} to ${compactValue(after[valueChange])}.`;
  }

  if (changed.length > 0) return `${changed.length} values changed at this step.`;
  if ((current.callStack || []).length > (previous.callStack || []).length) return 'A function call added a frame to the call stack.';
  if ((current.callStack || []).length < (previous.callStack || []).length) return 'A function returned to its caller.';
  return 'Execution moved to the next statement.';
}

const WorkspaceVisualizer: React.FC<WorkspaceVisualizerProps> = ({
  activeTab,
  setActiveTab,
  consoleExpanded,
  setConsoleExpanded,
  themeColor,
  currentStep,
  prevStepVariables,
  timeline,
  currentStepIndex,
  complexityAnalysis,
  settings,
  onSeekStep,
  playerControlsProps,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pinnedVars, setPinnedVars] = useState<Set<string>>(new Set());
  const isSaffron = themeColor === 'saffron';
  const accentText = isSaffron ? 'text-saffron-700 dark:text-saffron-300' : 'text-blue-700 dark:text-blue-300';
  const accentBg = isSaffron ? 'bg-saffron-500' : 'bg-blue-500';
  const selectedTabClass = isSaffron
    ? 'bg-saffron-50 text-saffron-800 dark:bg-saffron-900/30 dark:text-saffron-200'
    : 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';

  const handleTogglePin = useCallback((name: string) => {
    setPinnedVars((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const previousStep = timeline[currentStepIndex - 1];
  const insight = useMemo(() => describeStep(currentStep, previousStep), [currentStep, previousStep]);
  const loopWarning = useMemo(() => {
    if (currentStepIndex < 100) return null;
    const slice = timeline.slice(Math.max(0, currentStepIndex - 100), currentStepIndex + 1);
    const firstLine = slice[0]?.line;
    if (!firstLine || !slice.every((step) => step.line === firstLine)) return null;
    if (valuesEqual(slice[0]?.variables ?? {}, slice[slice.length - 1]?.variables ?? {})) return firstLine;
    return null;
  }, [timeline, currentStepIndex]);

  const openDetails = (tab: DetailTab) => {
    setActiveTab(tab);
    setDetailsOpen(true);
  };

  const detailButtons: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'variables', label: 'Variables', icon: <Code2 size={14} /> },
    { id: 'stack', label: 'Call stack', icon: <Layers size={14} /> },
    { id: 'performance', label: 'Complexity', icon: <Activity size={14} /> },
  ];

  return (
    <div className="h-full min-h-0 w-full flex flex-col flex-1 bg-slate-50 dark:bg-[var(--dark-surface)] border-[2px] border-slate-900 dark:border-[var(--dark-border)] shadow-[2px_2px_0_#1e293b] dark:shadow-[3px_3px_0_var(--dark-shadow)] z-10 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Network size={16} className={isSaffron ? 'text-saffron-500' : 'text-blue-500'} />
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">Live visualization</span>
          {currentStep.line > 0 && <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Line {currentStep.line}</span>}
        </div>
        <button
          type="button"
          onClick={() => {
            if (!detailsOpen && activeTab === 'diagrams') setActiveTab('variables');
            setDetailsOpen((open) => !open);
          }}
          aria-expanded={detailsOpen}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)] text-slate-700 dark:text-slate-200 shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)] hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <Code2 size={13} />
          Inspect
          {detailsOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-[var(--dark-border-dim)] bg-slate-50 dark:bg-[var(--dark-base)] min-h-10 shrink-0" aria-live="polite" aria-atomic="true">
        <span className={`w-2 h-2 rounded-full shrink-0 ${accentBg}`} />
        <p className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{insight}</p>
      </div>

      {loopWarning && (
        <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-800 shrink-0">
          <AlertTriangle size={14} />
          <span>Line {loopWarning} has repeated without a visible state change.</span>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-transparent p-3 relative">
        <StructureVisualizer
          variables={currentStep.variables || {}}
          prevVariables={prevStepVariables.variables || {}}
          themeColor={themeColor}
          currentStepIndex={currentStepIndex}
          arrayViewType={settings.arrayViewType}
          playerControlsProps={playerControlsProps}
        />
      </div>

      <AnimatePresence initial={false}>
        {detailsOpen && (
          <motion.section
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'min(38vh, 300px)', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="shrink-0 overflow-hidden border-t-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)]"
            aria-label="Execution details"
          >
            <div className="flex items-center gap-1 px-2 pt-2 border-b border-slate-200 dark:border-[var(--dark-border-dim)] overflow-x-auto">
              {detailButtons.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={activeTab === tab.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-[10px] sm:text-xs font-bold border-b-2 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${activeTab === tab.id ? `${selectedTabClass} border-current` : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'}`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
              <span className={`ml-auto hidden sm:block pr-2 text-[10px] font-mono ${accentText}`}>Step {Math.max(0, currentStepIndex + 1)} / {timeline.length}</span>
            </div>
            <div className="h-[calc(100%-42px)] overflow-y-auto custom-scrollbar p-3">
              {activeTab === 'variables' ? (
                <VariablesPanel variables={currentStep.variables || {}} prevVariables={prevStepVariables.variables || {}} themeColor={themeColor} pinnedVars={pinnedVars} onTogglePin={handleTogglePin} timeline={timeline} currentStepIndex={currentStepIndex} onSeekStep={onSeekStep} />
              ) : activeTab === 'stack' ? (
                <CallStackPanel stack={currentStep.callStack || []} themeColor={themeColor} timeline={timeline} currentStepIndex={currentStepIndex} />
              ) : (
                <PerformancePanel timeline={timeline} currentStepIndex={currentStepIndex} analysis={complexityAnalysis} themeColor={themeColor} />
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className={`flex flex-col border-t-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-base)] transition-[height] duration-200 ease-out ${consoleExpanded ? 'h-40 sm:h-48 shrink-0' : 'h-10 shrink-0'}`}>
        <button
          type="button"
          className="h-10 flex flex-shrink-0 items-center justify-between px-4 hover:bg-slate-50 dark:hover:bg-[var(--dark-surface-2)] transition-colors w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-500"
          onClick={() => setConsoleExpanded(!consoleExpanded)}
          aria-expanded={consoleExpanded}
        >
          <div className="flex items-center gap-2">
            <TerminalIcon size={16} className={isSaffron ? 'text-saffron-500' : 'text-blue-500'} />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Console</span>
            {!consoleExpanded && currentStep.consoleOutput?.length ? (
              <span className="border border-slate-900 dark:border-[var(--dark-border)] bg-slate-200 dark:bg-[var(--dark-surface-3)] px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300">{currentStep.consoleOutput.length}</span>
            ) : null}
          </div>
          {consoleExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {consoleExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <ConsolePanel logs={currentStep.consoleOutput || []} themeColor={themeColor} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkspaceVisualizer;
