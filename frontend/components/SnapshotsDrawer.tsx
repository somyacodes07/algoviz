import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Play, History, Code2 } from 'lucide-react';
import { Snapshot } from '../hooks/useSnapshots';
import { getThemeConfig, ThemeColor } from '../theme/theme';

interface SnapshotsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: Snapshot[];
  currentCode: string;
  currentLanguage: string;
  themeColor: ThemeColor;
  onSave: (name: string, code: string, language: string) => void;
  onLoad: (snapshot: Snapshot) => void;
  onDelete: (id: string) => void;
}

const SnapshotsDrawer: React.FC<SnapshotsDrawerProps> = ({
  isOpen,
  onClose,
  snapshots,
  currentCode,
  currentLanguage,
  themeColor,
  onSave,
  onLoad,
  onDelete,
}) => {
  const theme = getThemeConfig(themeColor);
  const [saveName, setSaveName] = useState('');
  const isSaffron = themeColor === 'saffron';

  const handleSave = () => {
    const name = saveName.trim() || `Snapshot — ${new Date().toLocaleString()}`;
    onSave(name, currentCode, currentLanguage);
    setSaveName('');
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-80 z-50 flex flex-col bg-white dark:bg-[var(--dark-surface)] border-l-[3px] border-slate-900 dark:border-[var(--dark-border)] shadow-[-4px_0_0_#0f172a] dark:shadow-[-4px_0_0_var(--dark-shadow)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)] shrink-0">
              <div className="flex items-center gap-2">
                <History size={16} className={theme.accentText} />
                <span className={`text-xs font-black uppercase tracking-[0.2em] ${theme.accentText}`}>Snapshots</span>
              </div>
              <button onClick={onClose} className="p-1 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--dark-surface-3)] shadow-[1px_1px_0_#0f172a] dark:shadow-[1px_1px_0_var(--dark-shadow)] transition-all active:translate-y-[1px] active:shadow-none">
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Save current */}
            <div className="px-4 py-3 border-b-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] shrink-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 mb-2">Save Current Session</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="Name this snapshot..."
                  className="flex-1 text-xs border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)] px-2 py-1.5 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-current"
                />
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-1 px-3 py-1.5 border-[2px] border-slate-900 dark:border-[var(--dark-border)] text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)] active:translate-y-[2px] active:shadow-none transition-all ${
                    isSaffron ? 'bg-saffron-500 hover:bg-saffron-600' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  <Save size={12} />
                </button>
              </div>
            </div>

            {/* Snapshot list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                  <History size={32} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">No snapshots yet.<br />Save your current session above.</p>
                </div>
              ) : (
                snapshots.map(snap => (
                  <motion.div
                    key={snap.id}
                    layout
                    className="border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-slate-50 dark:bg-[var(--dark-surface-2)] shadow-[2px_2px_0_#0f172a] dark:shadow-[2px_2px_0_var(--dark-shadow)]"
                  >
                    <div className="flex items-start justify-between px-3 py-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{snap.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border ${
                            snap.language === 'javascript'
                              ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                              : 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>{snap.language === 'javascript' ? 'JS' : 'C++'}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-600">{formatDate(snap.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onLoad(snap)}
                          title="Load this snapshot"
                          className={`p-1 border-[2px] border-slate-900 dark:border-[var(--dark-border)] text-white shadow-[1px_1px_0_#0f172a] dark:shadow-[1px_1px_0_var(--dark-shadow)] active:translate-y-[1px] active:shadow-none transition-all ${
                            isSaffron ? 'bg-saffron-500 hover:bg-saffron-600' : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          <Play size={10} fill="currentColor" />
                        </button>
                        <button
                          onClick={() => onDelete(snap.id)}
                          title="Delete"
                          className="p-1 border-[2px] border-slate-900 dark:border-[var(--dark-border)] bg-white dark:bg-[var(--dark-surface)] text-slate-500 hover:text-red-600 dark:hover:text-red-400 shadow-[1px_1px_0_#0f172a] dark:shadow-[1px_1px_0_var(--dark-shadow)] active:translate-y-[1px] active:shadow-none transition-all"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                    {/* Code preview */}
                    <div className="border-t-[2px] border-slate-900 dark:border-[var(--dark-border)] px-3 py-1.5 bg-slate-100 dark:bg-[var(--dark-surface)]">
                      <p className="text-[9px] font-mono text-slate-500 dark:text-slate-600 truncate leading-relaxed flex items-center gap-1">
                        <Code2 size={9} />
                        {snap.code.trim().split('\n')[0].slice(0, 60)}…
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SnapshotsDrawer;
