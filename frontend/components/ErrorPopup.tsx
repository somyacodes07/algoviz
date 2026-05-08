import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Copy, Check } from 'lucide-react';

interface ErrorPopupProps {
  error: string | null;
  onClose: () => void;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ error, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!error) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [error, onClose]);

  const handleCopyError = useCallback(() => {
    if (!error) return;
    navigator.clipboard.writeText(error).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = error;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [error]);

  return (
    <AnimatePresence>
      {error && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            className="fixed z-[9999] top-1/2 left-1/2"
            initial={{ opacity: 0, scale: 0.92, y: '-46%', x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.92, y: '-46%', x: '-50%' }}
            transition={{ type: 'spring', damping: 22, stiffness: 340 }}
          >
            <div
              className="
                relative w-[90vw] max-w-[560px]
                bg-[#fff5f5] dark:bg-[#1a0a0a]
                border-[3px] border-red-600 dark:border-red-500
                shadow-[6px_6px_0_#991b1b] dark:shadow-[6px_6px_0_#450a0a]
                select-text
              "
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 py-3 border-b-[3px] border-red-600 dark:border-red-500 bg-red-600 dark:bg-red-700">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-7 h-7 bg-white dark:bg-red-950 border-[2px] border-red-900 dark:border-red-400 shadow-[2px_2px_0_#450a0a]">
                    <AlertTriangle size={15} className="text-red-700 dark:text-red-300" />
                  </div>
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] text-white dark:text-red-100">
                    Compilation Error
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Copy Error Button */}
                  <button
                    onClick={handleCopyError}
                    className="
                      flex items-center gap-1.5 px-2.5 py-1
                      text-[10px] font-black uppercase tracking-[0.14em]
                      bg-white dark:bg-red-950
                      text-red-800 dark:text-red-200
                      border-[2px] border-red-900 dark:border-red-400
                      shadow-[2px_2px_0_#450a0a]
                      transition-all
                      hover:bg-red-50 dark:hover:bg-red-900
                      active:translate-y-[2px] active:shadow-none
                    "
                    title="Copy error to clipboard"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="
                      flex items-center justify-center w-7 h-7
                      bg-white dark:bg-red-950
                      text-red-800 dark:text-red-200
                      border-[2px] border-red-900 dark:border-red-400
                      shadow-[2px_2px_0_#450a0a]
                      transition-all
                      hover:bg-red-50 dark:hover:bg-red-900
                      active:translate-y-[2px] active:shadow-none
                    "
                    title="Close (Esc)"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* ── Error Body ── */}
              <div className="px-5 py-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                <pre className="
                  text-[12px] leading-[1.65] font-mono whitespace-pre-wrap break-words
                  text-red-900 dark:text-red-200
                  bg-red-100/60 dark:bg-red-950/40
                  border-[2px] border-red-300 dark:border-red-800
                  shadow-[3px_3px_0_#fecaca] dark:shadow-[3px_3px_0_#450a0a]
                  p-4
                ">
                  {error}
                </pre>
              </div>

              {/* ── Footer ── */}
              <div className="px-5 py-3 border-t-[3px] border-red-600 dark:border-red-500 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-500 dark:text-red-400">
                  Press Esc to close
                </span>
                <button
                  onClick={onClose}
                  className="
                    px-5 py-1.5
                    text-[11px] font-black uppercase tracking-[0.16em]
                    bg-red-600 dark:bg-red-700
                    text-white
                    border-[2px] border-red-900 dark:border-red-400
                    shadow-[3px_3px_0_#450a0a]
                    transition-all
                    hover:bg-red-700 dark:hover:bg-red-600
                    active:translate-y-[2px] active:shadow-none
                  "
                >
                  Dismiss
                </button>
              </div>

              {/* ── Corner Decorations (Neo-Brutalist accent) ── */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-red-600 dark:bg-red-500 border-[2px] border-red-900" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-600 dark:bg-red-500 border-[2px] border-red-900" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-red-600 dark:bg-red-500 border-[2px] border-red-900" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-red-600 dark:bg-red-500 border-[2px] border-red-900" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ErrorPopup;
