import React, { useRef, useEffect } from 'react';
import { ConsoleLog } from '../../types';
import { Terminal, AlertCircle, Info, AlertTriangle } from 'lucide-react';

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
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <p className="text-sm italic">No output yet...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2 font-mono text-xs md:text-sm">
      {logs.map((log, index) => {
        const isError = log.type === 'error';
        const isWarn = log.type === 'warn';

        return (
          <div
            key={index}
            className={`flex items-start gap-2 p-2 rounded-md transition-colors ${isError
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30'
                : isWarn
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-100 dark:border-yellow-900/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none'
              }`}
          >
            {isError ? (
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-500" />
            ) : isWarn ? (
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-yellow-500" />
            ) : (
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 opacity-70"></div>
            )}

            <div className="flex-1 overflow-hidden break-words">
              {isError && log.message.startsWith('Line ') ? (
                <span>
                  <span className="font-bold underline decoration-red-400 cursor-help" title="Error Location">
                    {log.message.split(':')[0]}
                  </span>
                  <span>: {log.message.split(':').slice(1).join(':')}</span>
                </span>
              ) : (
                <span>{log.message}</span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default ConsolePanel;