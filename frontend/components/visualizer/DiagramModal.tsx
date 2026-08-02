import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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

  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Reset view when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setPanX(0);
      setPanY(0);
    }
  }, [isOpen]);

  const handleReset = useCallback(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.15, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.15, 0.25));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = -e.deltaY * 0.0015;
    setScale((s) => Math.min(Math.max(s + delta, 0.25), 4));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click

    const target = e.target as HTMLElement;
    // Don't drag if clicking buttons, links, or interactive node components
    if (target.closest('button') || target.closest('a') || target.closest('.node-interactive')) {
      return;
    }

    setIsDragging(true);
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.current.x);
    setPanY(e.clientY - dragStart.current.y);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.node-interactive')) {
      return;
    }

    setIsDragging(true);
    dragStart.current = { x: touch.clientX - panX, y: touch.clientY - panY };
  }, [panX, panY]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPanX(touch.clientX - dragStart.current.x);
    setPanY(touch.clientY - dragStart.current.y);
  }, [isDragging]);

  // Key listeners for zoom, recenter, and close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleReset]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 select-none my-auto">
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className={`w-[90vw] max-w-6xl h-[78vh] max-h-[720px] flex flex-col bg-[#faf9f6]/98 dark:bg-[var(--dark-base)] border-[3px] border-slate-900 dark:border-[var(--dark-border)] shadow-[8px_8px_0_#0f172a] dark:shadow-[8px_8px_0_var(--dark-shadow)] relative z-10 overflow-hidden rounded-lg my-auto`}
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

            {/* Interactive Zoom-Pan Content Area */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              onWheel={handleWheel}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              className="flex-1 overflow-hidden no-scrollbar relative p-6 bg-slate-50 dark:bg-[var(--dark-surface)] flex justify-center items-center"
            >
              {/* Transform Content Wrap */}
              <div
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }}
                className="w-full h-full flex justify-center items-center no-scrollbar"
              >
                {children}
              </div>

              {/* Floating Glassmorphic HUD Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 px-4 py-2 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white/90 dark:bg-[var(--dark-surface-2)] backdrop-blur-md shadow-[4px_4px_0_#0f172a] dark:shadow-[4px_4px_0_var(--dark-shadow)] rounded-xl">
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-[var(--dark-surface-3)] text-slate-800 dark:text-slate-200 rounded transition-colors"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="font-mono text-xs font-black min-w-[3.5rem] text-center text-slate-800 dark:text-slate-100">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-[var(--dark-surface-3)] text-slate-800 dark:text-slate-200 rounded transition-colors"
                    title="Zoom In (+)"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <div className="w-[2px] h-4 bg-slate-900/20 dark:bg-[var(--dark-border)]" />
                  <button
                    onClick={handleReset}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-[var(--dark-surface-3)] text-slate-800 dark:text-slate-200 rounded transition-colors"
                    title="Reset View (R)"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider drop-shadow-sm pointer-events-none">
                  Wheel to zoom • Drag background to pan
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
