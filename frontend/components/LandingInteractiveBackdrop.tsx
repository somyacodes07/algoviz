import React, { useEffect, useState, useRef, useCallback } from 'react';
import InteractiveGrid from './InteractiveGrid';
import {
  motion,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';

type SignalTone = 'amber' | 'blue' | 'emerald' | 'slate';

interface FloatingSignal {
  label: string;
  top: string;
  left?: string;
  right?: string;
  tone: SignalTone;
}

const floatingSignals: FloatingSignal[] = [
  { label: 'vector<int>', top: '16%', left: '10%', tone: 'amber' },
  { label: 'AST', top: '26%', right: '12%', tone: 'blue' },
  { label: '__tracer.step()', top: '58%', left: '8%', tone: 'emerald' },
  { label: 'call stack', top: '64%', right: '16%', tone: 'slate' },
  { label: 'Math.trunc()', top: '42%', left: '44%', tone: 'amber' },
  { label: 'Web Worker', top: '18%', right: '34%', tone: 'blue' },
];

const toneClasses = {
  amber:
    'border-amber-300/70 bg-amber-100/80 text-amber-900 dark:border-amber-700/50 dark:bg-amber-500/10 dark:text-amber-200',
  blue: 'border-sky-300/70 bg-sky-100/80 text-sky-900 dark:border-sky-700/50 dark:bg-sky-500/10 dark:text-sky-200',
  emerald:
    'border-emerald-300/70 bg-emerald-100/80 text-emerald-900 dark:border-emerald-700/50 dark:bg-emerald-500/10 dark:text-emerald-200',
  slate:
    'border-slate-300/80 bg-white/80 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/45 dark:text-slate-200',
} as const;

interface LandingInteractiveBackdropProps {
  hoverLang?: string | null;
  theme?: 'light' | 'dark';
}

const LandingInteractiveBackdrop: React.FC<LandingInteractiveBackdropProps> = ({ hoverLang, theme }) => {
  const prefersReducedMotion = useReducedMotion();
  const [viewport, setViewport] = useState({ width: 1440, height: 900 });

  // Track cursor position for wave origins
  const lastCursorPos = useRef({ x: 720, y: 450 });

  useEffect(() => {
    const syncViewport = () => {
      setViewport({ width: window.innerWidth, height: Math.max(window.innerHeight, 720) });
    };
    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      lastCursorPos.current = { x: e.clientX, y: e.clientY };
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // ── Neo-Brutalist Hover Aurora ──────────────────────────────────────
  const [auroraState, setAuroraState] = useState<{
    active: boolean;
    lang: string | null;
    originX: number;
    originY: number;
  }>({ active: false, lang: null, originX: 720, originY: 450 });

  useEffect(() => {
    if (hoverLang) {
      setAuroraState({
        active: true,
        lang: hoverLang,
        originX: lastCursorPos.current.x,
        originY: lastCursorPos.current.y,
      });
    } else {
      setAuroraState((prev) => ({ ...prev, active: false }));
    }
  }, [hoverLang]);

  // ── Neo-Brutalist Theme Toggle Wave ─────────────────────────────────
  const [themeWave, setThemeWave] = useState<{
    active: boolean;
    type: 'dark' | 'light';
    originX: number;
    originY: number;
    key: number;
  }>({ active: false, type: 'light', originX: 720, originY: 450, key: 0 });

  const prevTheme = useRef(theme);

  useEffect(() => {
    if (theme && prevTheme.current && theme !== prevTheme.current) {
      const pos = lastCursorPos.current;
      setThemeWave({
        active: true,
        type: theme,
        originX: pos.x,
        originY: pos.y,
        key: Date.now(),
      });
      const timer = setTimeout(() => {
        setThemeWave((prev) => ({ ...prev, active: false }));
      }, 2800);
      prevTheme.current = theme;
      return () => clearTimeout(timer);
    }
    prevTheme.current = theme;
  }, [theme]);

  // Compute the max radius to fully cover the viewport from any origin
  const computeMaxRadius = useCallback(
    (ox: number, oy: number) => {
      const corners = [[0, 0], [viewport.width, 0], [0, viewport.height], [viewport.width, viewport.height]];
      return Math.ceil(Math.max(...corners.map(([cx, cy]) => Math.sqrt((cx - ox) ** 2 + (cy - oy) ** 2))));
    },
    [viewport]
  );

  const getAuroraColors = (lang: string | null) => {
    if (lang === 'js') return { bg: 'bg-mesh-dark-saffron', ring: 'border-amber-500/50' };
    if (lang === 'cpp') return { bg: 'bg-mesh-dark-blue', ring: 'border-sky-500/50' };
    return { bg: '', ring: 'border-slate-500/40' };
  };

  // Slow, cinematic easing
  const slowEase = [0.16, 1, 0.3, 1] as const;

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* ── Base gradient backgrounds ────────────────────────────────── */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8ecd8_0%,#f8fafc_42%,#dbeafe_100%)] dark:bg-none" />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{ background: 'linear-gradient(135deg, var(--dark-base) 0%, var(--dark-surface) 48%, var(--dark-surface-2) 100%)' }}
      />

      {/* ── Neo-Brutalist Hover Aurora (hard circle + border ring) ──── */}
      <AnimatePresence>
        {auroraState.active && auroraState.lang && (() => {
          const maxR = computeMaxRadius(auroraState.originX, auroraState.originY) * 2.4;
          const colors = getAuroraColors(auroraState.lang);
          return (
            <motion.div
              key={`aurora-${auroraState.lang}`}
              className="absolute inset-0 pointer-events-none hidden dark:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Fill disc */}
              <motion.div
                className={`absolute pointer-events-none ${colors.bg}`}
                style={{
                  top: auroraState.originY,
                  left: auroraState.originX,
                  x: '-50%',
                  y: '-50%',
                  borderRadius: '50%',
                }}
                initial={{ width: 0, height: 0 }}
                animate={{ width: maxR, height: maxR }}
                exit={{ width: 0, height: 0 }}
                transition={{ duration: 1.4, ease: slowEase }}
              />
              {/* Hard border ring */}
              <motion.div
                className={`absolute pointer-events-none border-[3px] ${colors.ring}`}
                style={{
                  top: auroraState.originY,
                  left: auroraState.originX,
                  x: '-50%',
                  y: '-50%',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ width: maxR, height: maxR, opacity: [1, 0.6, 0.2] }}
                exit={{ width: 0, height: 0, opacity: 0 }}
                transition={{ duration: 1.4, ease: slowEase }}
              />
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Neo-Brutalist Theme Toggle Wave ─────────────────────────── */}
      <AnimatePresence>
        {themeWave.active && (() => {
          const maxR = computeMaxRadius(themeWave.originX, themeWave.originY) * 2.4;
          return (
            <motion.div
              key={themeWave.key}
              className="absolute inset-0 pointer-events-none z-[5]"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Fill disc */}
              <motion.div
                className={`absolute pointer-events-none ${
                  themeWave.type === 'dark' ? 'bg-slate-950' : 'bg-[#f7f0e3]'
                }`}
                style={{
                  top: themeWave.originY,
                  left: themeWave.originX,
                  x: '-50%',
                  y: '-50%',
                  borderRadius: '50%',
                }}
                initial={{ width: 0, height: 0, opacity: 0.9 }}
                animate={{
                  width: maxR,
                  height: maxR,
                  opacity: [0.9, 0.5, 0],
                }}
                transition={{
                  width: { duration: 1.6, ease: slowEase },
                  height: { duration: 1.6, ease: slowEase },
                  opacity: { duration: 2.4, ease: 'easeOut' },
                }}
              />
              {/* Thick border ring */}
              <motion.div
                className={`absolute pointer-events-none border-[4px] ${
                  themeWave.type === 'dark' ? 'border-slate-400/40' : 'border-amber-800/25'
                }`}
                style={{
                  top: themeWave.originY,
                  left: themeWave.originX,
                  x: '-50%',
                  y: '-50%',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                }}
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{
                  width: maxR,
                  height: maxR,
                  opacity: [1, 0.4, 0],
                }}
                transition={{
                  width: { duration: 1.6, ease: slowEase },
                  height: { duration: 1.6, ease: slowEase },
                  opacity: { duration: 2, ease: 'easeOut' },
                }}
              />
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── InteractiveGrid (sole mouse interaction layer) ──────────── */}
      <InteractiveGrid
        gridSize={55}
        radius={350}
        dotSize={2.5}
        gridThickness={1}
        baseOpacity={theme === 'dark' ? 0.18 : 0.08}
        repulsionStrength={-0.55}
        clickInteraction={true}
        cursorTrail={false}
        backgroundColor="transparent"
        gridColor={theme === 'dark' ? 'rgba(148, 163, 184, 0.35)' : 'rgba(15, 23, 42, 0.12)'}
        dotColor={theme === 'dark' ? 'rgba(148, 163, 184, 0.5)' : 'rgba(15, 23, 42, 0.25)'}
        hoverColor={theme === 'dark' ? 'rgba(56, 189, 248, 0.9)' : 'rgba(15, 23, 42, 0.7)'}
        clickProps={{ clickForce: 0.5, motionSpeed: 0.7 }}
      />

      {/* ── Decorative lines ───────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-[18%] h-px bg-gradient-to-r from-transparent via-slate-900/15 to-transparent dark:via-slate-100/10" />
      <div className="absolute inset-x-[12%] top-[48%] h-px bg-gradient-to-r from-transparent via-slate-900/10 to-transparent dark:via-slate-100/10" />
      <div className="absolute right-[18%] top-[12%] bottom-[18%] w-px bg-gradient-to-b from-transparent via-slate-900/10 to-transparent dark:via-slate-100/10" />

      {/* ── Floating signal labels ─────────────────────────────────── */}
      {floatingSignals.map((signal, index) => (
        <motion.div
          key={signal.label}
          className={`absolute rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-md ${toneClasses[signal.tone]}`}
          style={{
            top: signal.top,
            left: signal.left,
            right: signal.right,
          }}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: [0, -10, 0],
                  rotate: [-1.2, 1.5, -1.2],
                }
          }
          transition={{
            duration: 7 + index,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.35,
          }}
        >
          {signal.label}
        </motion.div>
      ))}
    </div>
  );
};

export default LandingInteractiveBackdrop;
