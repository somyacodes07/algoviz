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
  themeColor: 'saffron' | 'blue';
}

const Controls: React.FC<ControlsProps> = ({
  isPlaying, onPlayPause, onNext, onPrev, onReset, canNext, canPrev, speed, setSpeed, progress, themeColor
}) => {
  const isSaffron = themeColor === 'saffron';

  const playBtnClass = isSaffron
    ? "bg-saffron-500 hover:bg-saffron-400 shadow-saffron-500/30"
    : "bg-blue-500 hover:bg-blue-400 shadow-blue-500/30";

  const progressFillClass = isSaffron ? "bg-saffron-500" : "bg-blue-500";
  const accentClass = isSaffron ? "accent-saffron-500" : "accent-blue-500";
  const hoverResetClass = isSaffron
    ? "hover:bg-saffron-100 dark:hover:bg-saffron-900/30 hover:text-saffron-600 dark:hover:text-saffron-400"
    : "hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400";
  const hoverStepClass = isSaffron
    ? "hover:bg-saffron-50"
    : "hover:bg-blue-50";

  return (
    <div className="h-auto min-h-[5rem] flex-wrap md:flex-nowrap py-4 gap-y-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 md:px-8 justify-between shrink-0 z-10 shadow-lg transition-colors duration-200">
      {/* Playback Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={onReset}
          className={`p-2.5 rounded-full bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border border-gray-200 dark:border-slate-700 ${hoverResetClass}`}
          title="Reset"
        >
          <RotateCcw size={18} />
        </button>

        <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-2"></div>

        <button
          onClick={onPrev} disabled={!canPrev}
          className={`p-2.5 rounded-full ${hoverStepClass} dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 dark:text-slate-200 transition-colors`}
        >
          <StepBack size={22} />
        </button>

        <button
          onClick={onPlayPause}
          className={`p-4 rounded-full text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${playBtnClass}`}
        >
          {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>

        <button
          onClick={onNext} disabled={!canNext}
          className={`p-2.5 rounded-full ${hoverStepClass} dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 dark:text-slate-200 transition-colors`}
        >
          <StepForward size={22} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex-1 basis-full md:basis-auto order-last md:order-none mx-2 md:mx-12 relative h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-300 ${progressFillClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-3 min-w-[140px] bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Speed</span>
        <input
          type="range"
          min="100" max="2000" step="100"
          value={2100 - speed}
          onChange={(e) => setSpeed(2100 - Number(e.target.value))}
          className={`w-24 h-1.5 bg-gray-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer ${accentClass}`}
        />
        <span className="text-xs text-slate-600 dark:text-slate-300 w-10 text-right font-mono font-bold">
          {(1000 / speed).toFixed(1)}x
        </span>
      </div>
    </div>
  );
};

export default Controls;