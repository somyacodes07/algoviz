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
        <div className="border-[2px] border-dashed border-slate-900 dark:border-[var(--dark-border)] bg-slate-100 dark:bg-[var(--dark-surface)] px-6 py-5 text-center shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)]">
          <Terminal size={28} className={`mx-auto mb-3 ${accentIconClass}`} />
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-80">
            Console idle
          </p>
          <p className="mt-2 text-xs font-medium normal-case opacity-70">
            Run the code to populate output.
          </p>
        </div>
      </div>
    );
  }

  const [copied, setCopied] = React.useState(false);

  const handleCopyLogs = () => {
    const text = logs.map(l => l.message).join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2 p-3 font-mono text-xs md:text-sm h-full font-medium overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-200 dark:border-[var(--dark-border)] shrink-0">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Output ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})
        </span>
        <button
          onClick={handleCopyLogs}
          className="px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-100 dark:bg-[var(--dark-surface-2)] text-slate-700 dark:text-slate-300 shadow-[1px_1px_0_rgba(15,23,42,1)] active:translate-y-[1px] active:shadow-none transition-all"
        >
          {copied ? 'Copied!' : 'Copy Console'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {logs.map((log, index) => {
          const isError = log.type === 'error';
          const isWarn = log.type === 'warn';

          return (
            <motion.div
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              key={index}
              className={`flex items-start gap-2.5 p-2.5 border-[2px] transition-all shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)] ${
                isError
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800/50'
                  : isWarn
                    ? 'bg-yellow-50 dark:bg-yellow-950/25 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800/50'
                    : 'bg-white dark:bg-[var(--dark-surface-2)] text-slate-700 dark:text-slate-300 border-slate-900 dark:border-[var(--dark-border)]'
              }`}
            >
              {isError ? (
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500 opacity-90" />
              ) : isWarn ? (
                <AlertTriangle
                  size={15}
                  className="mt-0.5 flex-shrink-0 text-yellow-500 opacity-90"
                />
              ) : (
                <ChevronRight
                  size={15}
                  className={`mt-0.5 flex-shrink-0 opacity-70 ${accentIconClass}`}
                />
              )}

              <div className="flex-1 break-words leading-normal select-text">
                {isError && log.message.startsWith('Line ') ? (
                  <span>
                    <span
                      className="font-extrabold text-red-600 dark:text-red-400 underline decoration-red-500/50 cursor-help"
                      title="Error Location"
                    >
                      {log.message.split(':')[0]}
                    </span>
                    <span className="opacity-90">
                      : {log.message.split(':').slice(1).join(':')}
                    </span>
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
