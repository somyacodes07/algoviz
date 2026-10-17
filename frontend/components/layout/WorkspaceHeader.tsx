import React from 'react';
import { ArrowLeft, BookOpen, Sun, Moon, Settings, History, StickyNote } from 'lucide-react';
import { ROUTES } from '../../routes';
import Logo from '../Logo';

interface WorkspaceHeaderProps {
  language: string;
  theme: 'light' | 'dark';
  langLabel: string;
  onGoHome: () => void;
  onOpenDocs: () => void;
  toggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenSnapshots?: () => void;
  annotationMode?: boolean;
  onToggleAnnotationMode?: () => void;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  language,
  theme,
  langLabel,
  onGoHome,
  onOpenDocs,
  toggleTheme,
  onOpenSettings,
  onOpenSnapshots,
  annotationMode,
  onToggleAnnotationMode,
}) => {
  return (
    <header className="h-14 flex items-center px-2 sm:px-6 justify-between gap-2 bg-white dark:bg-[var(--dark-surface)] border-b border-slate-900 dark:border-[var(--dark-border)] z-30 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative shrink-0">
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <a
          href={ROUTES.home}
          onClick={(e) => { e.preventDefault(); onGoHome(); }}
          className="p-1 sm:p-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface-2)] text-slate-500 dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-colors hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] active:translate-y-[2px] active:shadow-none"
        >
          <ArrowLeft className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </a>
        <Logo language={language} className="h-8 w-8 sm:w-[2.2rem] sm:h-[2.2rem] drop-shadow-[1px_1px_0_rgba(15,23,42,1)] dark:drop-shadow-[1px_1px_0_rgba(0,0,0,0.6)]" />
        <div className="flex items-baseline gap-2">
          <h1 className="font-black text-lg tracking-tight leading-none text-slate-900 dark:text-slate-100">AlgoViz</h1>
          <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Workbench</span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] px-3 py-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)] text-slate-600 dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)]">
          <span>{langLabel}</span>
        </div>
        <a
          href={ROUTES.docs}
          onClick={(e) => { e.preventDefault(); onOpenDocs(); }}
          className="hidden sm:inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] px-3 py-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)] text-slate-600 dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] hover:text-slate-900 dark:hover:text-slate-200 active:translate-y-[2px] active:shadow-none"
        >
          <BookOpen size={12} />
          Docs
        </a>
        {onOpenSnapshots && (
          <button
            onClick={onOpenSnapshots}
            className="p-1 sm:p-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface-2)] text-slate-600 dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-colors hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] active:translate-y-[2px] active:shadow-none"
            title="Saved Snapshots"
          >
            <History className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </button>
        )}
        {onToggleAnnotationMode && (
          <button
            onClick={onToggleAnnotationMode}
            className={`p-1 sm:p-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-colors active:translate-y-[2px] active:shadow-none ${
              annotationMode
                ? 'bg-amber-400 dark:bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-[var(--dark-surface-2)] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)]'
            }`}
            title={annotationMode ? 'Exit Annotation Mode' : 'Annotation Mode'}
          >
            <StickyNote className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className="p-1 sm:p-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface-2)] text-slate-600 dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-colors hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] active:translate-y-[2px] active:shadow-none"
          title="Open Settings"
        >
          <Settings className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </button>
        <button
          data-theme-toggle
          onClick={toggleTheme}
          className="p-1 sm:p-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface-2)] text-slate-600 dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-colors hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] active:translate-y-[2px] active:shadow-none"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" /> : <Sun className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />}
        </button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
