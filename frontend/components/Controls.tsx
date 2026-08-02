import React, { useRef, useState, useCallback } from 'react';
import { Play, Pause, StepBack, StepForward, RotateCcw, CircleDot, Zap, Gauge, Turtle, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  canNext: boolean;
  canPrev: boolean;
  speed: number;
  setSpeed: (s: number) => void;
  progress: number; // 0 to 100
  onSeek: (progress: number) => void;
  themeColor: 'saffron' | 'blue';
  currentStep: number;
  totalSteps: number;
  breakpointCount?: number;
}

const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onReset,
  canNext,
  canPrev,
  speed,
  setSpeed,
  progress,
  onSeek,
  themeColor,
  currentStep,
  totalSteps,
  breakpointCount = 0,
}) => {
  const isSaffron = themeColor === 'saffron';
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const playBtnClass = isSaffron
    ? 'bg-saffron-500 hover:bg-saffron-600'
    : 'bg-blue-500 hover:bg-blue-600';
  const progressFillClass = isSaffron ? 'bg-saffron-500' : 'bg-blue-500';
  const stepBadgeClass = isSaffron
    ? 'text-saffron-700 dark:text-saffron-400 bg-saffron-50 dark:bg-[var(--dark-surface-2)] border-saffron-500 dark:border-saffron-600'
    : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-[var(--dark-surface-2)] border-blue-500 dark:border-blue-600';
  const toolButtonClass =
    'border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface-2)] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)]';

  const getPctFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
      if (!trackRef.current) return null;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : (e as MouseEvent).clientX;
      const raw = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(1, raw)) * 100;
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      setIsDraggingState(true);
      const pct = getPctFromEvent(e);
      if (pct !== null) onSeek(pct);

      const onMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const p = getPctFromEvent(ev);
        if (p !== null) onSeek(p);
      };
      const onUp = () => {
        isDragging.current = false;
        setIsDraggingState(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [getPctFromEvent, onSeek],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pct = getPctFromEvent(e);
      setHoverPct(pct);
    },
    [getPctFromEvent],
  );

  const hoverStep =
    hoverPct !== null && totalSteps > 1
      ? Math.round((hoverPct / 100) * (totalSteps - 1)) + 1
      : null;

  return (
    <div
      data-no-transition
      className="h-auto py-2.5 sm:py-3 px-3 sm:px-6 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 shrink-0 z-20 bg-white dark:bg-[var(--dark-surface)] border-t-[2px] border-slate-900 dark:border-[var(--dark-border)] select-none"
    >
      {/* Sleek Compact Playback Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onReset}
          className={`p-1.5 text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] active:translate-y-[1px] active:shadow-none ${toolButtonClass}`}
          title="Reset (R)"
        >
          <RotateCcw size={16} />
        </button>

        <div className="w-px h-5 bg-slate-300 dark:bg-[var(--dark-border)] mx-1" />

        <button
          onClick={onPrev}
          disabled={!canPrev}
          className={`p-1.5 ${toolButtonClass} disabled:opacity-30 disabled:hover:bg-white text-slate-700 dark:text-slate-300 transition-all active:translate-y-[1px] active:shadow-none`}
          title="Previous Step (Left Arrow)"
        >
          <StepBack size={16} />
        </button>

        <button
          onClick={onPlayPause}
          className={`p-2 text-white border-[2px] border-slate-900 dark:border-[var(--dark-border)] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-all hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-none ${playBtnClass}`}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={onNext}
          disabled={!canNext}
          className={`p-1.5 ${toolButtonClass} disabled:opacity-30 disabled:hover:bg-white text-slate-700 dark:text-slate-300 transition-all active:translate-y-[1px] active:shadow-none`}
          title="Next Step (Right Arrow)"
        >
          <StepForward size={16} />
        </button>
      </div>

      {/* Progress & Scrubber */}
      <div className="flex-1 w-full flex flex-col justify-center gap-1 px-1 sm:px-3">
        <div className="flex justify-between items-center text-[10px] font-mono font-bold">
          {totalSteps > 0 ? (
            <span className={`px-2 py-0.5 border-[1px] border-slate-900 dark:border-[var(--dark-border)] ${stepBadgeClass}`}>
              Step {currentStep + 1} / {totalSteps}
            </span>
          ) : (
            <span className="text-slate-400">Ready</span>
          )}
          {breakpointCount > 0 && (
            <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
              <CircleDot size={10} />
              {breakpointCount} BP
            </span>
          )}
        </div>

        {/* Drag scrubber */}
        <div
          ref={trackRef}
          className="relative flex items-center h-5 cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPct(null)}
        >
          <div className="absolute left-0 right-0 h-2 bg-slate-200 dark:bg-[var(--dark-surface-3)] border-[1px] border-slate-900 dark:border-[var(--dark-border)] overflow-hidden shadow-[1px_1px_0_rgba(15,23,42,0.8)]">
            <div
              className={`absolute top-0 left-0 h-full ${progressFillClass}`}
              style={{
                width: `${progress}%`,
                transition: isDraggingState ? 'none' : 'width 80ms linear',
              }}
            />
            {hoverPct !== null && (
              <div
                className="absolute top-0 left-0 h-full opacity-25 bg-slate-600 dark:bg-slate-300 pointer-events-none"
                style={{ width: `${hoverPct}%` }}
              />
            )}
          </div>

          <motion.div
            className={`absolute h-4 w-4 bg-white dark:bg-slate-200 border-[1.5px] border-slate-900 shadow-[2px_2px_0_rgba(15,23,42,1)] z-10 cursor-grab ${isDraggingState ? 'cursor-grabbing scale-110' : ''}`}
            style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
            animate={{ scale: isDraggingState ? 1.25 : hoverPct !== null ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />

          <AnimatePresence>
            {hoverStep !== null && (
              <motion.div
                key="tooltip"
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }}
                transition={{ duration: 0.1 }}
                className="absolute -top-7 z-20 pointer-events-none"
                style={{ left: `${hoverPct ?? 0}%`, transform: 'translateX(-50%)' }}
              >
                <div className="border border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface-2)] px-1.5 py-0.5 text-[9px] font-bold font-mono text-slate-700 dark:text-slate-300 shadow-[1px_1px_0_#0f172a]">
                  Step {hoverStep}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Speed Selector Icon Pills */}
      <div className="shrink-0 flex items-center gap-1 bg-slate-100 dark:bg-[var(--dark-surface-2)] p-1 border-[1.5px] border-slate-900 dark:border-[var(--dark-border)] shadow-[1.5px_1.5px_0_#0f172a] rounded">
        {(
          [
            { label: '0.5x', value: 2000, title: 'Slow (0.5x)', Icon: Turtle },
            { label: '1x', value: 1000, title: 'Normal (1x)', Icon: Gauge },
            { label: '2x', value: 400, title: 'Fast (2x)', Icon: Flame },
            { label: 'Max', value: 80, title: 'Turbo (Instant)', Icon: Zap },
          ]
        ).map((preset) => {
          const isActive = speed === preset.value;
          const Icon = preset.Icon;
          return (
            <button
              key={preset.label}
              data-no-transition
              onClick={() => setSpeed(preset.value)}
              className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 border transition-all active:translate-y-[1px] active:shadow-none ${
                isActive
                  ? isSaffron
                    ? 'bg-saffron-500 text-white border-slate-900 shadow-[1px_1px_0_#0f172a]'
                    : 'bg-blue-500 text-white border-slate-900 shadow-[1px_1px_0_#0f172a]'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={preset.title}
            >
              <Icon size={12} strokeWidth={2.5} />
              <span>{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Controls;
