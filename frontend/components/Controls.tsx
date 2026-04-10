import React from 'react';
import { Play, Pause, StepBack, StepForward, RotateCcw } from 'lucide-react';

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
}) => {
  const isSaffron = themeColor === 'saffron';

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

  return (
    <div className="h-auto px-6 py-4 flex flex-col md:flex-row items-center gap-6 shrink-0 z-20 bg-white dark:bg-[#0A0A0B] border-t-[2px] border-slate-900 dark:border-[#222] transition-colors duration-200 ease-out">
      {/* Playback Buttons Group */}
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

        <div className="w-px h-8 bg-slate-300 dark:bg-[#222] mx-2"></div>

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
            Play/Pause
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

      {/* Progress & Info Container */}
      <div className="flex-1 w-full flex flex-col justify-center gap-1.5 px-2 md:px-6">
        {/* Top row: Step Counter */}
        <div className="flex justify-between items-center h-5">
          {totalSteps > 0 && (
            <span
              className={`text-[10px] font-bold font-mono px-2 py-0.5 border-[2px] ${stepBadgeClass}`}
            >
              Step {currentStep + 1} / {totalSteps}
            </span>
          )}
        </div>

        {/* Bottom row: Progress bar */}
        <div className="relative group flex items-center h-6 cursor-pointer">
          {/* Track background */}
          <div className="absolute left-0 right-0 h-3 bg-slate-200 dark:bg-[#161618] border-[2px] border-slate-900 dark:border-[#333] overflow-hidden pointer-events-none shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_#000]">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-200 ease-out border-r-[2px] border-slate-900/20 dark:border-white/10 ${progressFillClass}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Interactive thumb (visible on hover) */}
          <div
            className={`absolute h-4 w-4 bg-white border-[2px] border-slate-900 shadow-[2px_2px_0_rgba(15,23,42,1)] dark:bg-[#161618] dark:border-[#333] dark:shadow-[2px_2px_0_#000] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform -translate-x-1/2 z-10`}
            style={{ left: `${progress}%` }}
          ></div>

          {/* Invisible Interactive Range Input */}
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0 p-0"
            title="Scrub timeline"
          />
        </div>
      </div>

      {/* Speed Control */}
      <div className="shrink-0 flex items-center gap-3 bg-slate-50 dark:bg-[#111113] px-3 py-2 border-[2px] border-slate-900 dark:border-[#333] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_#000]">
        <span className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest hidden xl:block">
          Speed
        </span>
        <input
          type="range"
          min="100"
          max="2000"
          step="100"
          value={2100 - speed}
          onChange={(e) => setSpeed(2100 - Number(e.target.value))}
          className={`w-20 h-1.5 bg-slate-200 dark:bg-[#333] appearance-none cursor-pointer ${accentClass}`}
        />
        <span className="text-[11px] text-slate-700 dark:text-slate-300 w-8 text-right font-mono font-bold">
          {(1000 / speed).toFixed(1)}x
        </span>
      </div>
    </div>
  );
};

export default Controls;
