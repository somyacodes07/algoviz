import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getThemeConfig, ThemeColor } from '../../theme/theme';

interface DiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  themeColor: ThemeColor;
  children: React.ReactNode;
}

export const DiagramModal: React.FC<DiagramModalProps> = ({
  isOpen,
  onClose,
  title,
  themeColor,
  children,
}) => {
  const theme = getThemeConfig(themeColor);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 select-none">
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className={`w-full max-w-5xl max-h-[85vh] flex flex-col bg-[#faf9f6]/95 dark:bg-[var(--dark-base)] border-[3px] border-slate-900 dark:border-[var(--dark-border)] shadow-[6px_6px_0_#0f172a] dark:shadow-[6px_6px_0_var(--dark-shadow)] relative z-10 overflow-hidden`}
          >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 bg-white dark:bg-[var(--dark-surface-2)] border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] shrink-0">
              <span className={`text-xs font-black uppercase tracking-[0.2em] ${theme.accentText}`}>
                Enlarged View: {title}
              </span>
              <button
                onClick={onClose}
                className="p-1 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-all hover:translate-y-[1px] hover:shadow-none"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-slate-50 dark:bg-[var(--dark-surface)] flex justify-center items-center">
              <div className="w-full h-full max-w-full max-h-full overflow-auto flex justify-center items-center">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
