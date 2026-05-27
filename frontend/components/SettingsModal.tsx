import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Info, Save } from 'lucide-react';
import { getThemeConfig, ThemeColor } from '../theme/theme';

export interface AppSettings {
  themeColor: 'auto' | 'saffron' | 'blue';
  cppCompiler: 'api' | 'wasm';
  arrayViewType: 'cells' | 'bars';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  activeThemeColor: ThemeColor;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  activeThemeColor,
}) => {
  const theme = getThemeConfig(activeThemeColor);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const handleUpdate = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-md bg-white dark:bg-[var(--dark-surface)] border-[3px] border-slate-900 dark:border-[var(--dark-border)] shadow-[4px_4px_0_#0f172a] dark:shadow-[4px_4px_0_var(--dark-shadow)] relative z-10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-12 flex items-center justify-between px-4 border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)]">
              <span className={`text-xs font-black uppercase tracking-[0.2em] ${theme.accentText}`}>
                Preferences / Settings
              </span>
              <button
                onClick={onClose}
                className="p-1 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 shadow-[1px_1px_0_rgba(15,23,42,1)] dark:shadow-[1px_1px_0_var(--dark-shadow)] transition-all hover:translate-y-[1px] hover:shadow-none"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-5 space-y-5 text-slate-800 dark:text-slate-200">
              {/* Theme Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Permanent Theme Accent
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'auto', label: 'Auto (Lang)' },
                    { val: 'saffron', label: 'Saffron (JS)' },
                    { val: 'blue', label: 'Blue (C++)' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => handleUpdate('themeColor', opt.val as any)}
                      className={`border-[2px] py-1.5 text-xs font-bold uppercase tracking-wider transition-all active:translate-y-[1px] ${
                        settings.themeColor === opt.val
                          ? activeThemeColor === 'saffron'
                            ? 'bg-saffron-100 border-saffron-500 text-saffron-700 dark:bg-saffron-950/20 dark:text-saffron-400 dark:border-saffron-700'
                            : 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-700'
                          : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Array view Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Default Array Rendering
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'cells', label: 'Memory Cells' },
                    { val: 'bars', label: 'Bar Chart Only' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => handleUpdate('arrayViewType', opt.val as any)}
                      className={`border-[2px] py-1.5 text-xs font-bold uppercase tracking-wider transition-all active:translate-y-[1px] ${
                        settings.arrayViewType === opt.val
                          ? activeThemeColor === 'saffron'
                            ? 'bg-saffron-100 border-saffron-500 text-saffron-700 dark:bg-saffron-950/20 dark:text-saffron-400 dark:border-saffron-700'
                            : 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-700'
                          : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* C++ Compiler Selection with Tooltips */}
              <div className="flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    C++ Compiler Strategy
                  </label>
                  <HelpCircle size={12} className="text-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Wandbox API Option */}
                  <button
                    onMouseEnter={() => setHoveredOption('api')}
                    onMouseLeave={() => setHoveredOption(null)}
                    onClick={() => handleUpdate('cppCompiler', 'api')}
                    className={`border-[2px] py-2 text-xs font-bold uppercase tracking-wider transition-all active:translate-y-[1px] flex flex-col items-center justify-center ${
                      settings.cppCompiler === 'api'
                        ? activeThemeColor === 'saffron'
                          ? 'bg-saffron-100 border-saffron-500 text-saffron-700 dark:bg-saffron-950/20 dark:text-saffron-400 dark:border-saffron-700'
                          : 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-700'
                        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span>Wandbox API</span>
                    <span className="text-[7px] font-medium tracking-normal normal-case opacity-60 mt-0.5">Remote GCC (Fast)</span>
                  </button>

                  {/* Local Wasm Clang Option */}
                  <button
                    onMouseEnter={() => setHoveredOption('wasm')}
                    onMouseLeave={() => setHoveredOption(null)}
                    onClick={() => handleUpdate('cppCompiler', 'wasm')}
                    className={`border-[2px] py-2 text-xs font-bold uppercase tracking-wider transition-all active:translate-y-[1px] flex flex-col items-center justify-center ${
                      settings.cppCompiler === 'wasm'
                        ? activeThemeColor === 'saffron'
                          ? 'bg-saffron-100 border-saffron-500 text-saffron-700 dark:bg-saffron-950/20 dark:text-saffron-400 dark:border-saffron-700'
                          : 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-700'
                        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span>Local Wasm Clang</span>
                    <span className="text-[7px] font-medium tracking-normal normal-case opacity-60 mt-0.5">In-Browser (Offline)</span>
                  </button>
                </div>

                {/* Compiler Custom Tooltip Container */}
                <div className="h-16 relative mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 flex items-start gap-2 rounded-sm overflow-hidden">
                  <Info size={12} className="text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    {hoveredOption === 'api' ? (
                      <strong>Remote GCC API</strong>
                    ) : hoveredOption === 'wasm' ? (
                      <strong>Local Wasm Clang Compiler</strong>
                    ) : (
                      <strong>Compiler Strategy Info</strong>
                    )}
                    {hoveredOption === 'api'
                      ? ': Compiles C++ code on a remote server. Instant startup, standard compliant, but requires an active internet connection.'
                      : hoveredOption === 'wasm'
                      ? ': Compiles and executes C++ entirely inside the browser using WebAssembly. Runs offline, but requires a one-time 30MB compiler download.'
                      : ': Hover over compiler choices to inspect their detailed execution details, bandwidth requirements, and offline support properties.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="h-14 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end px-5 bg-slate-50 dark:bg-[var(--dark-surface-2)] shrink-0">
              <button
                onClick={onClose}
                className={`flex items-center gap-1.5 border-[2px] border-slate-900 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] shadow-[2px_2px_0_rgba(15,23,42,1)] dark:shadow-[2px_2px_0_var(--dark-shadow)] transition-all hover:translate-y-[1px] hover:shadow-none ${
                  activeThemeColor === 'saffron' ? 'bg-saffron-400 text-slate-950' : 'bg-blue-500 text-white'
                }`}
              >
                <Save size={13} />
                Save / Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
