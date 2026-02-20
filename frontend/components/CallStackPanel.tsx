import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallStackPanelProps {
  stack: string[];
  themeColor: 'saffron' | 'blue';
}

const CallStackPanel: React.FC<CallStackPanelProps> = ({ stack, themeColor }) => {
  const displayStack = [...stack].reverse();
  const isSaffron = themeColor === 'saffron';

  // Define border color based on theme
  const borderClass = isSaffron
    ? 'border-saffron-500 dark:border-saffron-400'
    : 'border-blue-500 dark:border-blue-400';

  return (
    <div className="flex flex-col gap-2 p-4 min-h-[100px]">
      <AnimatePresence>
        {displayStack.length === 0 ? (
          <div className="text-slate-500 italic text-center">Stack empty</div>
        ) : (
          displayStack.map((frame, index) => (
            <motion.div
              key={`${frame}-${index}`}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-3 bg-white dark:bg-slate-800 border-l-4 rounded shadow-sm dark:shadow-none font-mono text-sm text-slate-700 dark:text-slate-200 flex items-center border border-gray-200 dark:border-slate-700 transition-colors ${borderClass}`}
            >
              <span className="text-slate-400 dark:text-slate-500 mr-3 text-xs font-bold uppercase tracking-wider">Frame {stack.length - 1 - index}</span>
              <span className="font-semibold">{frame}</span>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallStackPanel;