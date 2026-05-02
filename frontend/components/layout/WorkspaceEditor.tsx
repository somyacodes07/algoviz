import React, { useState } from 'react';
import { Code, BookOpen, Check, Link2, Play, Loader2 } from 'lucide-react';
import CodeEditor from '../CodeEditor';
import { ThemeColor, getThemeConfig } from '../../theme/theme';

interface WorkspaceEditorProps {
  language: string;
  theme: 'dark' | 'light';
  themeColor: ThemeColor;
  code: string;
  executionError?: string | null;
  isPlaying: boolean;
  isExecuting?: boolean;
  visualizerMode: boolean;
  currentStepLine: number;
  breakpoints: Set<number>;
  linkCopied: boolean;
  onCodeChange: (newCode: string | undefined) => void;
  onRun: () => Promise<boolean>;
  onShare: () => void;
  onOpenTemplates: () => void;
  onToggleBreakpoint: (line: number) => void;
}

const WorkspaceEditor: React.FC<WorkspaceEditorProps> = ({
  language,
  theme,
  themeColor,
  code,
  executionError,
  isPlaying,
  isExecuting,
  visualizerMode,
  currentStepLine,
  breakpoints,
  linkCopied,
  onCodeChange,
  onRun,
  onShare,
  onOpenTemplates,
  onToggleBreakpoint,
}) => {
  const themeConfig = getThemeConfig(themeColor);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const iconTextClass = themeColor === 'saffron' ? 'text-saffron-500' : 'text-blue-500';
  const toolbarBtnClass =
    'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#111113] border-[2px] border-slate-900 dark:border-[#333] shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000] transition-all hover:bg-white dark:hover:bg-[#1a1a1c] active:translate-y-[2px] active:shadow-none';

  return (
    <div
      className={`flex flex-col h-full w-full md:min-w-[300px] bg-white dark:bg-[#161618] border-[2px] border-slate-900 dark:border-[#333] shadow-[4px_4px_0_#0f172a] dark:shadow-[3px_3px_0_#000] p-4 md:p-5 transition-all duration-200 ease-out ${visualizerMode ? 'md:w-[40%]' : 'md:flex-1'}`}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-slate-800 dark:text-slate-200 text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Code size={16} className={iconTextClass} />
            Source Code
          </span>

          <div className="relative ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenTemplates();
              }}
              className={toolbarBtnClass}
              title="Open Template Palette (Cmd+K)"
            >
              <BookOpen size={12} />
              Templates
              <span className="ml-1 border-[2px] border-slate-300 dark:border-[#333] bg-white dark:bg-[#161618] px-1 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                ⌘K
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {executionError && (
            <span className="border-[2px] border-red-300 bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-red-700 shadow-[2px_2px_0_#fecaca] dark:border-red-700 dark:bg-[#201010] dark:text-red-300 dark:shadow-[2px_2px_0_#3a1a1a]">
              {executionError}
            </span>
          )}

          <button
            onClick={onShare}
            className={`${toolbarBtnClass} ${
              linkCopied
                ? 'border-green-300 bg-green-100 text-green-700 shadow-[2px_2px_0_#bbf7d0] dark:border-green-700 dark:bg-[#111113] dark:text-green-400 dark:shadow-[2px_2px_0_#14532d]'
                : ''
            }`}
            title="Copy shareable link"
          >
            {linkCopied ? <Check size={14} /> : <Link2 size={14} />}
            {linkCopied ? 'Copied' : 'Share'}
          </button>

          <button
            onClick={async () => {
              if (isExecuting) return;
              setToast(null);
              const success = await onRun();
              if (success) {
                setToast({ message: 'Execution completed successfully!', type: 'success' });
              } else {
                setToast({ message: 'Execution failed: Check console or errors.', type: 'error' });
              }
              setTimeout(() => setToast(null), 4000);
            }}
            disabled={isExecuting}
            className={`flex items-center justify-center gap-2 border-[2px] border-slate-900 dark:border-[#333] px-6 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000] transition-all hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-none min-w-[100px] ${
              isExecuting 
                ? themeColor === 'saffron' 
                  ? 'bg-saffron-600 animate-pulse cursor-wait'
                  : 'bg-blue-600 animate-pulse cursor-wait'
                : themeColor === 'saffron' 
                  ? 'bg-saffron-500 hover:bg-saffron-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isExecuting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            {isExecuting ? 'Running' : 'Run'}
          </button>
        </div>
      </div>
      <div className="flex-1 relative border-[2px] border-slate-900 dark:border-[#333] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000] overflow-hidden bg-white dark:bg-transparent">
        <CodeEditor
          code={code}
          language={language}
          theme={theme}
          readOnly={isPlaying}
          onChange={onCodeChange}
          currentLine={currentStepLine}
          isError={!!executionError}
          themeColor={themeColor}
          breakpoints={breakpoints}
          onToggleBreakpoint={onToggleBreakpoint}
        />

        {/* Toast Notification Popup */}
        {toast && (
          <div className="absolute bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded border-[2px] shadow-[4px_4px_0_rgba(15,23,42,1)] dark:shadow-[4px_4px_0_#000] font-bold text-sm tracking-wide
              ${
                toast.type === 'success'
                  ? 'bg-green-100 border-green-700 text-green-900 dark:bg-emerald-950 dark:border-emerald-600 dark:text-emerald-100'
                  : 'bg-red-100 border-red-700 text-red-900 dark:bg-rose-950 dark:border-rose-600 dark:text-rose-100'
              }`}
            >
              {toast.type === 'success' ? (
                <Check size={18} />
              ) : (
                <div className="w-4 h-4 rounded-full bg-current flex items-center justify-center text-white text-[10px]">
                  !
                </div>
              )}
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceEditor;
