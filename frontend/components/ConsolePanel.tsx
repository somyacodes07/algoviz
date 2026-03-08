import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConsoleLog } from '../../types';
import { Terminal, AlertCircle, Info, AlertTriangle, ChevronRight } from 'lucide-react';

interface ConsolePanelProps {
  logs: ConsoleLog[];
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500/80 font-mono">
        <Terminal size={32} className="mb-3 opacity-20" />
        <p className="text-[11px] tracking-widest uppercase opacity-70">Waiting for compiler output...</p>
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
              className={`flex items-start gap-2.5 p-2 rounded-lg transition-all ${isError
                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
                : isWarn
                  ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20'
                  : 'bg-slate-500/5 dark:bg-slate-400/5 text-slate-700 dark:text-slate-300 border border-slate-500/10'
                }`}
            >
              {isError ? (
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500 opacity-90" />
              ) : isWarn ? (
                <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-yellow-500 opacity-90" />
              ) : (
                <ChevronRight size={15} className="mt-0.5 flex-shrink-0 text-blue-500 opacity-70" />
              )}

              <div className="flex-1 overflow-hidden break-words leading-relaxed select-text">
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