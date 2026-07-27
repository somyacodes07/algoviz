import React, { useState } from 'react';
import { Code, BookOpen, Check, Link2, Play, Loader2, StickyNote, X, Pencil } from 'lucide-react';
import CodeEditor from '../CodeEditor';
import { ThemeColor, getThemeConfig } from '../../theme/theme';
import { motion, AnimatePresence } from 'framer-motion';

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
  // Annotation props (optional)
  annotationMode?: boolean;
  currentAnnotation?: string;
  currentStepIndex?: number;
  onSaveAnnotation?: (stepIndex: number, text: string) => void;
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
  annotationMode,
  currentAnnotation,
  currentStepIndex = 0,
  onSaveAnnotation,
}) => {
  const themeConfig = getThemeConfig(themeColor);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  const isSaffron = themeColor === 'saffron';
  const iconTextClass = isSaffron ? 'text-saffron-500' : 'text-blue-500';
  const toolbarBtnClass =
    'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[var(--dark-surface)] border-[2px] border-slate-900 dark:border-[var(--dark-border)] shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-all hover:bg-white dark:hover:bg-[var(--dark-surface-3)] active:translate-y-[2px] active:shadow-none';

  const showAnnotationBar = annotationMode || !!currentAnnotation;

  const handleStartEdit = () => {
    setNoteText(currentAnnotation || '');
    setEditingNote(true);
  };

  const handleSaveNote = () => {
    onSaveAnnotation?.(currentStepIndex, noteText);
    setEditingNote(false);
  };

  const handleCancelNote = () => {
    setNoteText(currentAnnotation || '');
    setEditingNote(false);
  };

  return (
    <div
      className={`flex flex-col h-full w-full md:min-w-[300px] min-h-[320px] md:min-h-0 bg-white dark:bg-[var(--dark-surface-2)] border-[2px] border-slate-900 dark:border-[var(--dark-border)] shadow-[4px_4px_0_#0f172a] dark:shadow-[3px_3px_0_var(--dark-shadow)] transition-all duration-200 ease-out ${visualizerMode ? 'md:w-[40%]' : 'md:flex-1'}`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center px-3 sm:px-4 py-2 sm:py-3 gap-2 border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface)]">
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
              <span className="ml-1 border-[2px] border-slate-300 dark:border-[var(--dark-border-dim)] bg-white dark:bg-[var(--dark-surface-2)] px-1 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                ⌘K
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className={`${toolbarBtnClass} ${
              linkCopied
                ? 'border-green-300 bg-green-100 text-green-700 shadow-[2px_2px_0_#bbf7d0] dark:border-green-700 dark:bg-green-950/30 dark:text-green-400 dark:shadow-[2px_2px_0_rgba(20,83,45,0.5)]'
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
                setToast({ message: 'Execution completed!', type: 'success' });
              } else {
                setToast({ message: 'Execution failed.', type: 'error' });
              }
              setTimeout(() => setToast(null), 3500);
            }}
            disabled={isExecuting}
            title="Run Code (Cmd/Ctrl + Enter)"
            className={`flex items-center justify-center gap-2 border-[2px] border-slate-900 dark:border-[var(--dark-border)] px-6 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-all hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-none min-w-[90px] ${
              isExecuting
                ? isSaffron ? 'bg-saffron-600 animate-pulse cursor-wait' : 'bg-blue-600 animate-pulse cursor-wait'
                : isSaffron ? 'bg-saffron-500 hover:bg-saffron-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            {isExecuting ? 'Running' : 'Run'}
          </button>
        </div>
      </div>

      {/* Code Editor — takes all remaining space */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-transparent min-h-0">
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

        {/* Toast Notification */}
        {toast && (
          <div className="absolute bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
              className={`flex items-center gap-2 px-4 py-2.5 border-[2px] shadow-[3px_3px_0_rgba(15,23,42,1)] dark:shadow-[3px_3px_0_#000] font-bold text-sm tracking-wide ${
                toast.type === 'success'
                  ? 'bg-green-100 border-green-700 text-green-900 dark:bg-emerald-950 dark:border-emerald-600 dark:text-emerald-100'
                  : 'bg-red-100 border-red-700 text-red-900 dark:bg-rose-950 dark:border-rose-600 dark:text-rose-100'
              }`}
            >
              {toast.type === 'success' ? <Check size={16} /> : <span className="w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black">!</span>}
              {toast.message}
            </div>
          </div>
        )}
      </div>

      {/* Annotation Panel — appears as a bottom dock when active */}
      <AnimatePresence>
        {showAnnotationBar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t-[2px] border-slate-900 dark:border-[var(--dark-border)] flex-shrink-0"
          >
            <div className={`${currentAnnotation ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-slate-50 dark:bg-[var(--dark-surface)]'}`}>
              {/* Annotation header */}
              <div className="flex items-center justify-between px-4 py-2 border-b-[1px] border-slate-200 dark:border-[var(--dark-border)]">
                <div className="flex items-center gap-2">
                  <StickyNote size={12} className={currentAnnotation ? 'text-amber-500' : 'text-slate-400'} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Step {currentStepIndex + 1} Note
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!editingNote && annotationMode && (
                    <button
                      onClick={handleStartEdit}
                      className={`flex items-center gap-1 px-2 py-0.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] text-[9px] font-black uppercase tracking-[0.1em] shadow-[1px_1px_0_rgba(15,23,42,1)] dark:shadow-[1px_1px_0_var(--dark-shadow)] active:translate-y-[1px] active:shadow-none transition-all ${
                        isSaffron
                          ? 'bg-saffron-100 dark:bg-saffron-900/20 text-saffron-700 dark:text-saffron-400'
                          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      <Pencil size={9} />
                      {currentAnnotation ? 'Edit' : 'Add Note'}
                    </button>
                  )}
                  {editingNote && (
                    <>
                      <button
                        onClick={handleSaveNote}
                        className="px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] border-[2px] border-emerald-700 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 shadow-[1px_1px_0_rgba(15,23,42,1)] active:translate-y-[1px] active:shadow-none"
                      >
                        <Check size={11} />
                      </button>
                      <button onClick={handleCancelNote} className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                        <X size={13} />
                      </button>
                    </>
                  )}
                  {currentAnnotation && !editingNote && (
                    <button
                      onClick={() => onSaveAnnotation?.(currentStepIndex, '')}
                      className="p-0.5 text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Note body */}
              {editingNote ? (
                <textarea
                  autoFocus
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveNote();
                    if (e.key === 'Escape') handleCancelNote();
                  }}
                  placeholder="Write a note for this step… (⌘/Ctrl+Enter to save)"
                  className="w-full px-4 py-2 text-xs text-slate-800 dark:text-slate-200 bg-transparent resize-none focus:outline-none min-h-[56px] placeholder-slate-400 dark:placeholder-slate-600"
                />
              ) : currentAnnotation ? (
                <p className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{currentAnnotation}</p>
              ) : (
                <p className="px-4 py-2 text-[10px] text-slate-400 dark:text-slate-600 italic">
                  Click "Add Note" to annotate this execution step.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceEditor;
