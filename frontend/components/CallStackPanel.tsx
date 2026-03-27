import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallStackPanelProps {
  stack: string[];
  themeColor: 'saffron' | 'blue';
}

const CallStackPanel: React.FC<CallStackPanelProps> = ({ stack, themeColor }) => {
  const displayStack = [...stack].reverse();
  const isSaffron = themeColor === 'saffron';

  // Define active border and shadow based on theme
  const activeClass = isSaffron
    ? 'border-saffron-400 dark:border-saffron-600 shadow-[2px_2px_0_#fbd38d] dark:shadow-[2px_2px_0_#9c4221] bg-white dark:bg-[#161618]'
    : 'border-blue-400 dark:border-blue-600 shadow-[2px_2px_0_#93c5fd] dark:shadow-[2px_2px_0_#1e3a8a] bg-white dark:bg-[#161618]';
  const inactiveClass = 'border-slate-300 dark:border-[#333] shadow-none bg-slate-100 dark:bg-[#111113]';

  return (
    <div className="flex flex-col p-4 min-h-[100px] pb-10">
      <AnimatePresence>
        {displayStack.length === 0 ? (
          <div className="text-slate-500 italic text-center text-sm font-medium mt-8">Stack is empty</div>
        ) : (
          displayStack.map((frame, index) => {
            const isTop = index === 0;
            // Calculate a scale and y-offset based on depth (max 3 visible depth effects)
            const depth = Math.min(index, 3);
            const scale = 1 - (depth * 0.05);
            const translateY = isTop ? 0 : -(depth * 15);
            const zIndex = displayStack.length - index;

            return (
              <motion.div
                key={`${frame}-${displayStack.length - index}`}
                layout
                initial={{ opacity: 0, y: -40, scale: 1.05 }}
                animate={{ opacity: 1 - (depth * 0.15), y: translateY, scale }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`relative w-full p-4 rounded border-[2px] mb-2 flex flex-col font-mono text-sm transition-colors ${isTop ? activeClass : inactiveClass}`}
                style={{ zIndex, marginTop: index > 0 ? -24 : 0 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isTop ? (isSaffron ? 'text-saffron-600 dark:text-saffron-400' : 'text-blue-600 dark:text-blue-400') : 'text-slate-500'}`}>
                    Frame {stack.length - 1 - index}
                  </span>
                  {isTop && (
                    <span className="flex h-2 w-2 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSaffron ? 'bg-saffron-400' : 'bg-blue-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isSaffron ? 'bg-saffron-500' : 'bg-blue-500'}`}></span>
                    </span>
                  )}
                </div>
                <span className={`font-bold ${isTop ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
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