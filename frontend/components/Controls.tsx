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
}

const Controls: React.FC<ControlsProps> = ({
  isPlaying, onPlayPause, onNext, onPrev, onReset, canNext, canPrev, speed, setSpeed, progress, onSeek, themeColor
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
    <div className="h-auto min-h-[5rem] px-4 py-4 md:px-8 mb-4 mx-4 md:mx-0 flex-wrap md:flex-nowrap gap-y-6 flex flex-col md:flex-row items-center justify-between shrink-0 z-20 glass-panel rounded-2xl transition-all duration-300">

      {/* Playback Buttons Group */}
      <div className="flex items-center justify-center gap-3 w-full md:w-auto">
        <button
          onClick={onReset}
          className={`p-2.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-600 ${hoverResetClass} backdrop-blur-sm`}
          title="Reset"
        >
          <RotateCcw size={18} />
        </button>

        <div className="w-px h-6 bg-slate-300/50 dark:bg-slate-700/50 mx-1"></div>

        <button
          onClick={onPrev} disabled={!canPrev}
          className={`p-2 rounded-full ${hoverStepClass} dark:hover:bg-slate-800/80 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-300 transition-all active:scale-95`}
        >
          <StepBack size={20} />
        </button>

        <button
          onClick={onPlayPause}
          className={`p-3.5 rounded-full text-white shadow-xl transition-all hover:scale-110 active:scale-95 border border-white/20 ${playBtnClass}`}
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>

        <button
          onClick={onNext} disabled={!canNext}
          className={`p-2 rounded-full ${hoverStepClass} dark:hover:bg-slate-800/80 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 dark:text-slate-300 transition-all active:scale-95`}
        >
          <StepForward size={20} />
        </button>
      </div>

      {/* Progress Bar Container */}
      <div className="flex-1 w-full md:w-auto mx-0 md:mx-8 relative group flex items-center h-6">
        {/* Track background */}
        <div className="absolute left-0 right-0 h-2 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden backdrop-blur-sm border border-black/5 dark:border-white/5 pointer-events-none">
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-300 ease-out ${progressFillClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Interactive thumb (visible on hover) */}
        <div
          className={`absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform -translate-x-1/2 border border-slate-200 dark:border-slate-700 z-10`}
          style={{ left: `${progress}%` }}
        ></div>

        {/* Invicible Interactive Range Input */}
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

      {/* Speed Control */}
      <div className="flex items-center gap-3 w-full md:w-auto bg-white/50 dark:bg-slate-900/50 px-4 py-2.5 rounded-xl border border-white/40 dark:border-slate-700/50 shadow-inner backdrop-blur-md">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Speed</span>
        <input
          type="range"
          min="100" max="2000" step="100"
          value={2100 - speed}
          onChange={(e) => setSpeed(2100 - Number(e.target.value))}
          className={`w-20 md:w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer ${accentClass}`}
        />
        <span className="text-[11px] text-slate-600 dark:text-slate-300 w-8 text-right font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          {(1000 / speed).toFixed(1)}x
        </span>
      </div>
    </div>
  );
};

export default Controls;