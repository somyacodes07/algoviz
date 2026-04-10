import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { getThemeConfig, ThemeColor } from '../theme/theme';

interface CallStackPanelProps {
  stack: string[];
  themeColor: ThemeColor;
}

const CallStackPanel: React.FC<CallStackPanelProps> = ({ stack, themeColor }) => {
  const displayStack = [...stack].reverse();
  const theme = getThemeConfig(themeColor);

  const activeClass = theme.panelClass + ` ${theme.accentSoftBg} ${theme.accentBorder}`;
  const inactiveClass =
    'border-[2px] border-slate-900 dark:border-[#333] shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000] bg-white dark:bg-[#111113]';
  const accentBadge = theme.badgeClass;

  return (
    <div className="flex flex-col p-4 min-h-[100px] pb-10">
      <div className="mb-4 flex items-center justify-between border-[2px] border-slate-900 bg-white px-3 py-2 shadow-[2px_2px_0_#0f172a] dark:border-[#333] dark:bg-[#161618] dark:shadow-[2px_2px_0_#000]">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Active Stack
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
            {stack.length > 0 ? `${stack.length} frame${stack.length > 1 ? 's' : ''}` : 'Idle'}
          </div>
        </div>
        <span className={accentBadge}>{stack.length > 0 ? 'Top live' : 'Empty'}</span>
      </div>

      <AnimatePresence>
        {displayStack.length === 0 ? (
          <div className="mt-8 border-[2px] border-dashed border-slate-900 bg-slate-100 p-6 text-center shadow-[2px_2px_0_#0f172a] dark:border-[#333] dark:bg-[#111113] dark:shadow-[2px_2px_0_#000]">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              No active frames
            </div>
            <div className="mt-2 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
              Run the code to build the stack.
            </div>
          </div>
        ) : (
          displayStack.map((frame, index) => {
            const isTop = index === 0;
            const depth = Math.min(index, 3);
            const scale = 1 - depth * 0.05;
            const translateY = isTop ? 0 : -(depth * 14);
            const zIndex = displayStack.length - index;

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
                        : 'border-[2px] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] border-slate-300 bg-slate-100 text-slate-500 dark:border-[#333] dark:bg-[#161618] dark:text-slate-400'
                    }
                  >
                    {isTop ? 'Top frame' : `Frame ${stack.length - 1 - index}`}
                  </span>
                  {isTop && <span className={accentBadge}>Live</span>}
                </div>
                <span
                  className={`font-black tracking-wide ${isTop ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  {frame}()
                </span>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallStackPanel;
