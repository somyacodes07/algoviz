import React, { useEffect, useState, useRef, useCallback } from 'react';
import InteractiveGrid from './InteractiveGrid';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
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

  const pointerX = useMotionValue(720);
  const pointerY = useMotionValue(320);

  // Track last known cursor position for the wave origin
  const lastCursorPos = useRef({ x: 720, y: 320 });

  useEffect(() => {
    const syncViewport = () => {
      const width = window.innerWidth;
      const height = Math.max(window.innerHeight, 720);
      setViewport({ width, height });
    };

    const handlePointerMove = (event: PointerEvent | MouseEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
      lastCursorPos.current = { x: event.clientX, y: event.clientY };
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [pointerX, pointerY]);

  const smoothX = useSpring(pointerX, {
    stiffness: 110,
    damping: 24,
    mass: 0.7,
  });
  const smoothY = useSpring(pointerY, {
    stiffness: 110,
    damping: 24,
    mass: 0.7,
  });

  // ── Neo-Brutalist Aurora (hard-edged expanding circle with border ring) ──
  const [auroraState, setAuroraState] = useState<{
    active: boolean;
    lang: string | null;
    originX: number;
    originY: number;
  }>({ active: false, lang: null, originX: 720, originY: 320 });

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

  // ── Neo-Brutalist Theme Wave (hard-edged disc with a thick border ring) ──
  const [themeWave, setThemeWave] = useState<{
    active: boolean;
    type: 'dark' | 'light';
    originX: number;
    originY: number;
    key: number; // unique key to force re-mount on each toggle
  }>({ active: false, type: 'light', originX: 720, originY: 320, key: 0 });

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
      }, 1400);
      prevTheme.current = theme;
      return () => clearTimeout(timer);
    }
    prevTheme.current = theme;
  }, [theme]);

  // Compute the max radius needed to cover the entire viewport from the origin point
  const computeMaxRadius = useCallback(
    (ox: number, oy: number) => {
      const corners = [
        [0, 0],
        [viewport.width, 0],
        [0, viewport.height],
        [viewport.width, viewport.height],
      ];
      return Math.ceil(
        Math.max(...corners.map(([cx, cy]) => Math.sqrt((cx - ox) ** 2 + (cy - oy) ** 2)))
      );
    },
    [viewport]
  );

  const glowLayer = useMotionTemplate`
    radial-gradient(34rem 34rem at ${smoothX}px ${smoothY}px, rgba(249, 115, 22, 0.24), transparent 52%),
    radial-gradient(28rem 28rem at calc(${smoothX}px + 220px) calc(${smoothY}px - 120px), rgba(56, 189, 248, 0.18), transparent 56%),
    radial-gradient(26rem 26rem at calc(${smoothX}px - 250px) calc(${smoothY}px + 160px), rgba(16, 185, 129, 0.12), transparent 58%)
  `;

  const haloX = useTransform(smoothX, (value) => value - 144);
  const haloY = useTransform(smoothY, (value) => value - 144);

  // Aurora mesh colors for the neo-brutalist ring
  const getAuroraColors = (lang: string | null) => {
    if (lang === 'js') return { bg: 'bg-mesh-dark-saffron', ring: 'border-amber-500/60' };
    if (lang === 'cpp') return { bg: 'bg-mesh-dark-blue', ring: 'border-sky-500/60' };
    return { bg: '', ring: 'border-slate-500/40' };
  };

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient backgrounds */}
      <div
        className="absolute inset-0 bg-[linear-gradient(135deg,#f8ecd8_0%,#f8fafc_42%,#dbeafe_100%)] dark:bg-none"
        style={{ '--dark-grad': 'linear-gradient(135deg, var(--dark-base) 0%, var(--dark-surface) 48%, var(--dark-surface-2) 100%)' } as React.CSSProperties}
      />
      <div className="absolute inset-0 hidden dark:block" style={{ background: 'linear-gradient(135deg, var(--dark-base) 0%, var(--dark-surface) 48%, var(--dark-surface-2) 100%)' }} />

      {/* ── Neo-Brutalist Hover Aurora ─────────────────────────────────── */}
      <AnimatePresence>
        {auroraState.active && auroraState.lang && (
          <motion.div
            key={`aurora-${auroraState.lang}`}
            className="absolute inset-0 pointer-events-none hidden dark:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* The expanding hard-edged disc */}
            <motion.div
              className={`absolute pointer-events-none ${getAuroraColors(auroraState.lang).bg}`}
              style={{
                top: auroraState.originY,
                left: auroraState.originX,
                x: '-50%',
                y: '-50%',
                borderRadius: '50%',
              }}
              initial={{ width: 0, height: 0 }}
              animate={{
                width: computeMaxRadius(auroraState.originX, auroraState.originY) * 2.4,
                height: computeMaxRadius(auroraState.originX, auroraState.originY) * 2.4,
              }}
              exit={{ width: 0, height: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* The hard border ring (neo-brutalist outline that follows the edge) */}
            <motion.div
              className={`absolute pointer-events-none border-[3px] ${getAuroraColors(auroraState.lang).ring}`}
              style={{
                top: auroraState.originY,
                left: auroraState.originX,
                x: '-50%',
                y: '-50%',
                borderRadius: '50%',
                backgroundColor: 'transparent',
              }}
              initial={{ width: 0, height: 0 }}
              animate={{
                width: computeMaxRadius(auroraState.originX, auroraState.originY) * 2.4,
                height: computeMaxRadius(auroraState.originX, auroraState.originY) * 2.4,
              }}
              exit={{ width: 0, height: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Neo-Brutalist Theme Toggle Wave ────────────────────────────── */}
      <AnimatePresence>
        {themeWave.active && (
          <motion.div
            key={themeWave.key}
            className="absolute inset-0 pointer-events-none z-[5]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Hard-edged disc for theme transition */}
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
              initial={{ width: 0, height: 0, opacity: 0.85 }}
              animate={{
                width: computeMaxRadius(themeWave.originX, themeWave.originY) * 2.4,
                height: computeMaxRadius(themeWave.originX, themeWave.originY) * 2.4,
                opacity: [0.85, 0.6, 0],
              }}
              transition={{
                width: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                height: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 1.2, ease: 'easeOut' },
              }}
            />
            {/* Thick neo-brutalist border ring */}
            <motion.div
              className={`absolute pointer-events-none border-[4px] ${
                themeWave.type === 'dark'
                  ? 'border-slate-400/50'
                  : 'border-amber-800/30'
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
                width: computeMaxRadius(themeWave.originX, themeWave.originY) * 2.4,
                height: computeMaxRadius(themeWave.originX, themeWave.originY) * 2.4,
                opacity: [1, 0.5, 0],
              }}
              transition={{
                width: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                height: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 1, ease: 'easeOut' },
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mouse-follow ambient glow */}
      <motion.div
        className="absolute inset-0 opacity-90 dark:opacity-70"
        style={{ backgroundImage: glowLayer }}
      />

      {/* Interactive Kinetic Grid */}
      <div className="absolute inset-0 opacity-[0.25] dark:opacity-[0.35]">
        <InteractiveGrid
          gridSize={50}
          radius={300}
          dotSize={2}
          gridThickness={1.5}
          baseOpacity={0.05}
          repulsionStrength={-0.65}
          clickInteraction={true}
          cursorTrail={false}
          backgroundColor="transparent"
          gridColor="var(--dark-border)"
          dotColor={theme === 'dark' ? "var(--dark-surface-2)" : "rgba(15, 23, 42, 0.4)"}
          hoverColor={theme === 'dark' ? "var(--dark-scrollbar-thumb-hover)" : "rgba(15, 23, 42, 0.8)"}
          clickProps={{ clickForce: 0.5, motionSpeed: 0.8 }}
        />
      </div>

      {/* Mouse-follow halo */}
      <motion.div
        className="absolute h-72 w-72 rounded-full border border-white/50 bg-white/20 blur-2xl dark:border-sky-300/20 dark:bg-sky-400/10"
        style={{ x: haloX, y: haloY }}
      />

      {/* Decorative neo-brutalist lines */}
      <div className="absolute inset-x-0 top-[18%] h-px bg-gradient-to-r from-transparent via-slate-900/15 to-transparent dark:via-slate-100/10" />
      <div className="absolute inset-x-[12%] top-[48%] h-px bg-gradient-to-r from-transparent via-slate-900/10 to-transparent dark:via-slate-100/10" />
      <div className="absolute right-[18%] top-[12%] bottom-[18%] w-px bg-gradient-to-b from-transparent via-slate-900/10 to-transparent dark:via-slate-100/10" />

      {/* Floating signal labels */}
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
