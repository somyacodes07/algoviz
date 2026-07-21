import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, X, Check, Pencil } from 'lucide-react';
import { ThemeColor, getThemeConfig } from '../theme/theme';

interface AnnotationOverlayProps {
  stepIndex: number;
  currentAnnotation?: string;
  annotationMode: boolean;
  themeColor: ThemeColor;
  onSave: (stepIndex: number, text: string) => void;
}

const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  stepIndex,
  currentAnnotation,
  annotationMode,
  themeColor,
  onSave,
}) => {
  const theme = getThemeConfig(themeColor);
  const isSaffron = themeColor === 'saffron';
  const [editText, setEditText] = useState(currentAnnotation || '');
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset edit text when step changes
  useEffect(() => {
    setEditText(currentAnnotation || '');
    setIsEditing(false);
  }, [stepIndex, currentAnnotation]);

  const handleSave = () => {
    onSave(stepIndex, editText);
    setIsEditing(false);
  };

  const handleDiscard = () => {
    setEditText(currentAnnotation || '');
    setIsEditing(false);
  };

  const shouldShow = annotationMode || !!currentAnnotation;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key={`anno-${stepIndex}`}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`border-[2px] border-slate-900 dark:border-[var(--dark-border)] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)] ${
            currentAnnotation
              ? 'bg-amber-50 dark:bg-amber-950/30'
              : 'bg-white dark:bg-[var(--dark-surface-2)]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface)]">
            <div className="flex items-center gap-2">
              <StickyNote size={12} className={currentAnnotation ? 'text-amber-500' : 'text-slate-400'} />
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Step {stepIndex + 1} Note
              </span>
            </div>
            <div className="flex items-center gap-1">
              {!isEditing && annotationMode && (
                <button
                  onClick={() => { setIsEditing(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
                  className={`flex items-center gap-1 px-2 py-0.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] text-[9px] font-black uppercase tracking-[0.12em] shadow-[1px_1px_0_#0f172a] dark:shadow-[1px_1px_0_var(--dark-shadow)] active:translate-y-[1px] active:shadow-none transition-all ${
                    isSaffron
                      ? 'bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-400 border-saffron-500'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-500'
                  }`}
                >
                  <Pencil size={9} />
                  {currentAnnotation ? 'Edit' : 'Add Note'}
                </button>
              )}
              {isEditing && (
                <>
                  <button onClick={handleSave} className="p-0.5 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors" title="Save">
                    <Check size={14} />
                  </button>
                  <button onClick={handleDiscard} className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors" title="Discard">
                    <X size={14} />
                  </button>
                </>
              )}
              {currentAnnotation && !isEditing && (
                <button
                  onClick={() => onSave(stepIndex, '')}
                  className="p-0.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Remove note"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.metaKey) handleSave();
                if (e.key === 'Escape') handleDiscard();
              }}
              placeholder="Write a note for this step... (⌘Enter to save)"
              className="w-full px-3 py-2 text-xs text-slate-800 dark:text-slate-200 bg-transparent resize-none focus:outline-none min-h-[60px] placeholder-slate-400"
            />
          ) : currentAnnotation ? (
            <p className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {currentAnnotation}
            </p>
          ) : (
            <p className="px-3 py-2 text-[10px] text-slate-400 dark:text-slate-600 italic">
              Click "Add Note" to annotate this execution step.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnotationOverlay;
