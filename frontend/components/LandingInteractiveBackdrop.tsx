import React, { useEffect, useState } from 'react';
import InteractiveGrid from './InteractiveGrid';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

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

  useEffect(() => {
    const syncViewport = () => {
      setViewport({ width: window.innerWidth, height: Math.max(window.innerHeight, 720) });
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const isDark = theme === 'dark';

  // Dynamic Hover Glow
  let hoverGlowColor = isDark ? 'rgba(249, 115, 22, 0.6)' : 'rgba(234, 88, 12, 0.6)'; // Default orangish saffron
  if (hoverLang === 'js') hoverGlowColor = isDark ? 'rgba(245, 158, 11, 0.9)' : 'rgba(245, 158, 11, 0.8)'; // Saffron
  if (hoverLang === 'cpp') hoverGlowColor = isDark ? 'rgba(56, 189, 248, 0.9)' : 'rgba(14, 165, 233, 0.8)'; // Intense Blue

  // Light mode uses a mix of blue dots and saffron lines to create the requested gradient effect
  const gridDotColor = isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(56, 189, 248, 0.4)';
  const gridLineColor = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(245, 158, 11, 0.25)';

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* ── Base gradient backgrounds ────────────────────────────────── */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#fde68a_0%,#f8fafc_45%,#bae6fd_100%)] opacity-40 dark:opacity-100 dark:bg-none" />

      {/* ── Dark Gradients ───────────────────────────── */}
      {/* In Dark mode, default to Saffron (orange warmth) and switch to Blue only when hovering C++ */}
      <div className="absolute inset-0 hidden dark:block bg-[var(--dark-base)]" />
      <AnimatePresence>
        <motion.div
          key={hoverLang === 'cpp' ? 'blue' : 'saffron'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`absolute inset-0 hidden dark:block ${hoverLang === 'cpp' ? 'bg-mesh-dark-blue' : 'bg-mesh-dark-saffron'}`}
        />
      </AnimatePresence>

      {/* ── InteractiveGrid (sole mouse interaction layer) ──────────── */}
      <InteractiveGrid
        gridSize={55}
        radius={350}
        dotSize={2.5}
        gridThickness={1}
        baseOpacity={isDark ? 0.18 : 0.15}
        repulsionStrength={-0.55}
        clickInteraction={true}
        cursorTrail={false}
        backgroundColor="transparent"
        gridColor={gridLineColor}
        dotColor={gridDotColor}
        hoverColor={hoverGlowColor}
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
