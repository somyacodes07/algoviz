import React from 'react';
import { ArrowLeft, BookOpen, Sun, Moon } from 'lucide-react';
import { ROUTES } from '../../routes';
import Logo from '../Logo';

interface WorkspaceHeaderProps {
  language: string;
  theme: 'light' | 'dark';
  langLabel: string;
  onGoHome: () => void;
  onOpenDocs: () => void;
  toggleTheme: () => void;
}

const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  language,
  theme,
  langLabel,
  onGoHome,
  onOpenDocs,
  toggleTheme,
}) => {
  return (
    <header
      className={`h-14 flex items-center px-6 justify-between bg-white dark:bg-[#0A0A0B] border-b border-slate-900 dark:border-[#222] z-30 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative shrink-0`}
    >
      <div className="flex items-center gap-4">
        <a
          href={ROUTES.home}
          onClick={(e) => {
            e.preventDefault();
            onGoHome();
          }}
          className="p-1.5 border-[2px] border-slate-900 dark:border-[#333] bg-white dark:bg-[#111113] text-slate-500 dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000] transition-colors hover:bg-slate-100 dark:hover:bg-[#161618] active:translate-y-[2px] active:shadow-none"
        >
          <ArrowLeft size={18} />
        </a>
        <Logo
          language={language}
          className="w-[2.2rem] h-[2.2rem] drop-shadow-[1px_1px_0_rgba(15,23,42,1)] dark:drop-shadow-[1px_1px_0_#000]"
        />
        <div className="flex items-baseline gap-2">
          <h1 className="font-black text-lg tracking-tight leading-none text-slate-900 dark:text-slate-100">
            AlgoViz
          </h1>
          <span className="text-slate-500 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">
            Workbench
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] px-3 py-1.5 border-[2px] border-slate-900 dark:border-[#333] bg-slate-50 dark:bg-[#111113] text-slate-600 dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000]">
          <span>{langLabel}</span>
        </div>
        <a
          href={ROUTES.docs}
          onClick={(e) => {
            e.preventDefault();
            onOpenDocs();
          }}
          className="hidden sm:inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] px-3 py-1.5 border-[2px] border-slate-900 dark:border-[#333] bg-slate-50 dark:bg-[#111113] text-slate-600 dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000] hover:text-slate-900 dark:hover:text-slate-200 active:translate-y-[2px] active:shadow-none"
        >
          <BookOpen size={12} />
          Docs
        </a>
        <button
          onClick={toggleTheme}
          className="p-1.5 border-[2px] border-slate-900 dark:border-[#333] bg-white dark:bg-[#111113] text-slate-600 dark:text-slate-400 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000] transition-colors hover:bg-slate-100 dark:hover:bg-[#161618] active:translate-y-[2px] active:shadow-none"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
