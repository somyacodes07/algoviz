import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timeline } from '../../types';
import { getThemeConfig, ThemeColor } from '../theme/theme';

interface CallStackPanelProps {
  stack: string[];
  themeColor: ThemeColor;
  timeline?: Timeline;
  currentStepIndex?: number;
}

const T = {
  activeStack: 'Active Stack',
  noActiveFrames: 'No active frames',
  runToBuild: 'Run the code to build the stack.',
  live: 'Live',
  topFrame: 'Top frame',
  frameLabel: 'Frame',
  empty: 'Empty',
  topLive: 'Top live',
  frames: 'frames',
  frame: 'frame',
  idle: 'Idle',
};

const CallStackPanel: React.FC<CallStackPanelProps> = ({
  stack,
  themeColor,
  timeline = [],
  currentStepIndex = -1,
}) => {
  const displayStack = [...stack].reverse();
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';

  const activeClass = theme.panelClass + ` ${theme.accentSoftBg} ${theme.accentBorder}`;
  const inactiveClass =
    'border-[2px] border-slate-900 dark:border-[var(--dark-border)] shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] bg-white dark:bg-[var(--dark-surface)]';
  const accentBadge = theme.badgeClass;

  // Helper to walk backward and reconstruct historical variables for stack frame at depth
  const getVariablesForDepth = (depth: number) => {
    if (depth < 0 || timeline.length === 0 || currentStepIndex < 0) return {};
    const currentStep = timeline.at(currentStepIndex);
    if (!currentStep) return {};

    if (depth === currentStep.callStack.length - 1) {
      return currentStep.variables || {};
    }

    for (let i = currentStepIndex - 1; i >= 0; i--) {
      const step = timeline.at(i);
      if (step && step.callStack.length === depth + 1) {
        let match = true;
        for (let j = 0; j <= depth; j++) {
          if (step.callStack.at(j) !== currentStep.callStack.at(j)) {
            match = false;
            break;
          }
        }
        if (match) return step.variables || {};
      }
    }
    return {};
  };

  return (
    <div className="flex flex-col p-4 min-h-[100px] pb-10">
      <div className="mb-4 flex items-center justify-between border-[2px] border-slate-900 bg-white px-3 py-2 shadow-[2px_2px_0_#0f172a] dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface-2)] dark:shadow-[2px_2px_0_var(--dark-shadow)]">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {T.activeStack}
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
            {stack.length > 0 ? `${stack.length} ${stack.length > 1 ? T.frames : T.frame}` : T.idle}
          </div>
        </div>
        <span className={accentBadge}>{stack.length > 0 ? T.topLive : T.empty}</span>
      </div>

      <AnimatePresence>
        {displayStack.length === 0 ? (
          <div className="mt-8 border-[2px] border-dashed border-slate-900 bg-slate-100 p-6 text-center shadow-[2px_2px_0_#0f172a] dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface)] dark:shadow-[2px_2px_0_var(--dark-shadow)]">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {T.noActiveFrames}
            </div>
            <div className="mt-2 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
              {T.runToBuild}
            </div>
          </div>
        ) : (
          displayStack.map((frame, index) => {
            const isTop = index === 0;
            const depth = Math.min(index, 3);
            const scale = 1 - depth * 0.05;
            const translateY = isTop ? 0 : -(depth * 14);
            const zIndex = displayStack.length - index;
            const frameDepth = stack.length - 1 - index;
            const frameVars = getVariablesForDepth(frameDepth);

            return (
              <motion.div
                key={`${frame}-${displayStack.length - index}`}
                layout
                initial={{ opacity: 0, y: -40, scale: 1.05 }}
                animate={{ opacity: 1 - depth * 0.15, y: translateY, scale }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`relative w-full p-4 border-[2px] mb-2 flex flex-col font-mono text-sm transition-colors ${isTop ? activeClass : inactiveClass}`}
                style={{ zIndex, marginTop: index > 0 ? -20 : 0 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={
                      isTop
                        ? accentBadge
                        : 'border-[2px] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] border-slate-300 bg-slate-100 text-slate-500 dark:border-[var(--dark-border-dim)] dark:bg-[var(--dark-surface-2)] dark:text-slate-400'
                    }
                  >
                    {isTop ? T.topFrame : `${T.frameLabel} ${frameDepth}`}
                  </span>
                  {isTop && <span className={accentBadge}>{T.live}</span>}
                </div>
                <span
                  className={`font-black tracking-wide ${isTop ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  {frame}()
                </span>

                {/* Frame Variables display */}
                {Object.keys(frameVars).length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-900/10 dark:border-slate-100/10 flex flex-wrap gap-1.5">
                    {Object.entries(frameVars).map(([key, val]) => {
                      if (typeof val === 'function' || val === '[Function]') return null;
                      const displayVal = typeof val === 'object'
                        ? Array.isArray(val)
                          ? `[${val.length}]`
                          : '{…}'
                        : String(val);
                      return (
                        <span
                          key={key}
                          className={`px-1.5 py-0.5 border text-[10px] font-mono font-bold whitespace-nowrap ${
                            isTop
                              ? isSaffron
                                ? 'border-saffron-300 bg-saffron-50 text-saffron-700 dark:border-saffron-800 dark:bg-saffron-950/40 dark:text-saffron-400'
                                : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                              : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
                          }`}
                        >
                          <span className="opacity-60">{key}:</span> {displayVal}
                        </span>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallStackPanel;
