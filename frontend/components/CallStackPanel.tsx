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
                className={`relative w-full p-4 glass-panel rounded-xl shadow-lg border-t-4 mb-2 flex flex-col font-mono text-sm transition-colors ${borderClass} ${!isTop && 'border-t-transparent dark:border-t-transparent shadow-none bg-white/40 dark:bg-slate-800/40'}`}
                style={{ zIndex, marginTop: index > 0 ? -24 : 0 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isSaffron ? 'text-saffron-500/70' : 'text-blue-500/70'}`}>
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