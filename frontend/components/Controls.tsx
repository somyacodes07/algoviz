import React, { useRef, useState, useCallback } from 'react';
import { Play, Pause, StepBack, StepForward, RotateCcw, CircleDot, Zap } from 'lucide-react';
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
    ? 'bg-saffron-500 hover:bg-saffron-400'
    : 'bg-blue-500 hover:bg-blue-400';
  const progressFillClass = isSaffron ? 'bg-saffron-500' : 'bg-blue-500';
  const accentClass = isSaffron ? 'accent-saffron-500' : 'accent-blue-500';
  const hoverStepClass = isSaffron
    ? 'hover:bg-saffron-50 dark:hover:bg-[#1a1a1c] hover:border-saffron-500 dark:hover:border-saffron-600'
    : 'hover:bg-blue-50 dark:hover:bg-[#1a1a1c] hover:border-blue-500 dark:hover:border-blue-600';
  const stepBadgeClass = isSaffron
    ? 'text-saffron-700 dark:text-saffron-400 bg-saffron-50 dark:bg-[#161618] border-saffron-500 dark:border-saffron-600 shadow-[2px_2px_0_#fbd38d] dark:shadow-[2px_2px_0_#9c4221]'
    : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-[#161618] border-blue-500 dark:border-blue-600 shadow-[2px_2px_0_#93c5fd] dark:shadow-[2px_2px_0_#1e3a8a]';
  const toolButtonClass =
    'border-[2px] border-slate-900 dark:border-[#333] bg-white dark:bg-[#161618] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000]';

  // ── Scrubber drag logic (#1) ─────────────────────────────────────────────
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
      className="h-auto px-6 py-4 flex flex-col md:flex-row items-center gap-6 shrink-0 z-20 bg-white dark:bg-[#0A0A0B] border-t-[2px] border-slate-900 dark:border-[#222]"
    >
      {/* Playback Buttons */}
      <div className="flex items-center justify-center gap-3 shrink-0">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onReset}
            className={`p-2 text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-[#222] active:translate-y-[2px] active:shadow-none ${toolButtonClass}`}
            title="Reset (R)"
          >
            <RotateCcw size={18} />
          </button>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase opacity-80">
            Reset
          </span>
        </div>

        <div className="w-px h-8 bg-slate-300 dark:bg-[#222] mx-2" />

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onPrev}
            disabled={!canPrev}
            className={`p-2 ${toolButtonClass} ${hoverStepClass} disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-900 dark:disabled:hover:bg-[#161618] dark:disabled:hover:border-[#333] text-slate-700 dark:text-slate-300 transition-all active:translate-y-[2px] active:shadow-none`}
          >
            <StepBack size={20} />
          </button>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase opacity-80">
            Prev
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onPlayPause}
            className={`p-3 text-white shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000] border-[2px] border-slate-900 dark:border-[#333] transition-all hover:-translate-y-[1px] active:translate-y-[2px] active:shadow-none ${playBtnClass}`}
          >
            {isPlaying ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" className="ml-1" />
            )}
          </button>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase opacity-80">
            Play
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onNext}
            disabled={!canNext}
            className={`p-2 ${toolButtonClass} ${hoverStepClass} disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-900 dark:disabled:hover:bg-[#161618] dark:disabled:hover:border-[#333] text-slate-700 dark:text-slate-300 transition-all active:translate-y-[2px] active:shadow-none`}
          >
            <StepForward size={20} />
          </button>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase opacity-80">
            Next
          </span>
        </div>
      </div>

      {/* Progress & Scrubber */}
      <div className="flex-1 w-full flex flex-col justify-center gap-1.5 px-2 md:px-6">
        {/* Top row */}
        <div className="flex justify-between items-center h-5">
          {totalSteps > 0 && (
            <span
              className={`text-[10px] font-bold font-mono px-2 py-0.5 border-[2px] ${stepBadgeClass}`}
            >
              Step {currentStep + 1} / {totalSteps}
            </span>
          )}
          {breakpointCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold font-mono text-red-500 dark:text-red-400">
              <CircleDot size={10} />
              {breakpointCount} breakpoint{breakpointCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Drag scrubber (#1) */}
        <div
          ref={trackRef}
          className="relative flex items-center h-7 cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPct(null)}
        >
          {/* Track */}
          <div className="absolute left-0 right-0 h-3 bg-slate-200 dark:bg-[#161618] border-[2px] border-slate-900 dark:border-[#333] overflow-hidden shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000]">
            {/* Fill */}
            <div
              className={`absolute top-0 left-0 h-full border-r-[2px] border-slate-900/20 dark:border-white/10 ${progressFillClass}`}
              style={{
                width: `${progress}%`,
                transition: isDraggingState ? 'none' : 'width 80ms linear',
              }}
            />
            {/* Hover preview tint */}
            {hoverPct !== null && (
              <div
                className="absolute top-0 left-0 h-full opacity-20 bg-slate-600 dark:bg-slate-300 pointer-events-none"
                style={{ width: `${hoverPct}%` }}
              />
            )}
          </div>

          {/* Draggable thumb */}
          <motion.div
            className={`absolute h-5 w-5 bg-white dark:bg-[#161618] border-[2px] border-slate-900 dark:border-[#333] shadow-[3px_3px_0_rgba(15,23,42,1)] dark:shadow-[3px_3px_0_#000] z-10 cursor-grab ${isDraggingState ? 'cursor-grabbing scale-110' : ''}`}
            style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
            animate={{ scale: isDraggingState ? 1.2 : hoverPct !== null ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />

          {/* Hover tooltip */}
          <AnimatePresence>
            {hoverStep !== null && (
              <motion.div
                key="tooltip"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="absolute -top-8 z-20 pointer-events-none"
                style={{ left: `${hoverPct ?? 0}%`, transform: 'translateX(-50%)' }}
              >
                <div className="border-[2px] border-slate-900 dark:border-[#333] bg-white dark:bg-[#161618] px-2 py-0.5 text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300 shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000] whitespace-nowrap">
                  Step {hoverStep}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Speed Presets (#10) */}
      <div className="shrink-0 flex items-center gap-2 bg-slate-50 dark:bg-[#111113] px-3 py-2 border-[2px] border-slate-900 dark:border-[#333] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000]">
        <span className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest hidden xl:block">
          Speed
        </span>
        {(
          [
            { label: 'Slow', value: 2000, icon: null },
            { label: 'Norm', value: 1000, icon: null },
            { label: 'Fast', value: 400, icon: null },
            { label: 'Instant', value: 80, icon: Zap },
          ] as { label: string; value: number; icon: typeof Zap | null }[]
        ).map((preset) => {
          const isActive = speed === preset.value;
          return (
            <button
              key={preset.label}
              data-no-transition
              onClick={() => setSpeed(preset.value)}
              className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border-[2px] transition-all active:translate-y-[1px] active:shadow-none ${
                isActive
                  ? isSaffron
                    ? 'bg-saffron-500 text-white border-slate-900 dark:border-[#333] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000]'
                    : 'bg-blue-500 text-white border-slate-900 dark:border-[#333] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000]'
                  : 'bg-white dark:bg-[#161618] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-[#333] hover:border-slate-900 dark:hover:border-[#555]'
              }`}
            >
              {preset.icon ? <preset.icon size={12} /> : preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Controls;
