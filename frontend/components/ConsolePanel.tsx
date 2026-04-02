import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConsoleLog } from '../../types';
import { Terminal, AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react';

interface ConsolePanelProps {
  logs: ConsoleLog[];
  themeColor: 'saffron' | 'blue';
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs, themeColor }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const accentIconClass = themeColor === 'saffron' ? 'text-saffron-500' : 'text-blue-500';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-slate-500/80 font-mono">
        <div className="border-[2px] border-dashed border-slate-900 dark:border-[#333] bg-slate-100 dark:bg-[#111113] px-6 py-5 text-center shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000]">
          <Terminal size={28} className={`mx-auto mb-3 ${accentIconClass}`} />
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">Console idle</p>
          <p className="mt-2 text-xs font-medium normal-case opacity-70">Run the code to populate output.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 p-3 font-mono text-xs md:text-sm h-full font-medium">
      <AnimatePresence initial={false}>
        {logs.map((log, index) => {
          const isError = log.type === 'error';
          const isWarn = log.type === 'warn';

          return (
            <motion.div
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              key={index}
              className={`flex items-start gap-2.5 p-2.5 border-[2px] transition-all shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000] ${isError
                ? 'bg-red-50 dark:bg-[#201010] text-red-800 dark:text-red-300 border-red-300 dark:border-[#3a1a1a]'
                : isWarn
                  ? 'bg-yellow-50 dark:bg-[#201c10] text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-[#3a301a]'
                  : 'bg-white dark:bg-[#111113] text-slate-700 dark:text-slate-300 border-slate-900 dark:border-[#333]'
                }`}
            >
              {isError ? (
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500 opacity-90" />
              ) : isWarn ? (
                <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-yellow-500 opacity-90" />
              ) : (
                <ChevronRight size={15} className={`mt-0.5 flex-shrink-0 opacity-70 ${accentIconClass}`} />
              )}

              <div className="flex-1 break-words leading-normal select-text">
                {isError && log.message.startsWith('Line ') ? (
                  <span>
                    <span className="font-extrabold text-red-600 dark:text-red-400 underline decoration-red-500/50 cursor-help" title="Error Location">
                      {log.message.split(':')[0]}
                    </span>
                    <span className="opacity-90">: {log.message.split(':').slice(1).join(':')}</span>
                  </span>
                ) : (
                  <span className="opacity-90">{log.message}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={bottomRef} className="h-2" />
    </div>
  );
};

export default ConsolePanel;
