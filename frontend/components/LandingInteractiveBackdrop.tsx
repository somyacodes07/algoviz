import React, { useEffect, useState } from 'react';
import InteractiveGrid from './InteractiveGrid';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// ─── Blueprint SVG Canvas ──────────────────────────────────────────────────────
// A clean, right-aligned SVG schematic of interconnected data structures
// with animated traversal pulses. Only 3 structures, placed on the right half
// where the code preview lives — left side stays clean for hero text.

interface LandingInteractiveBackdropProps {
  hoverLang?: string | null;
  defaultLang?: string;
  theme?: 'light' | 'dark';
}

const BlueprintCanvas: React.FC<{ isDark: boolean; isCpp: boolean }> = ({ isDark, isCpp }) => {
  const prefersReducedMotion = useReducedMotion();

  // Color tokens — fully warm in JS mode, fully cool in C++ mode
  const accent = isCpp
    ? isDark ? '#38bdf8' : '#0284c7'
    : isDark ? '#f59e0b' : '#d97706';
  const accent2 = isCpp
    ? isDark ? '#818cf8' : '#6366f1'
    : isDark ? '#fbbf24' : '#b45309';
  const nodeFill = isCpp
    ? isDark ? 'rgba(15,30,55,0.6)' : 'rgba(240,249,255,0.7)'
    : isDark ? 'rgba(35,25,15,0.6)' : 'rgba(255,251,235,0.7)';
  const nodeStroke = isCpp
    ? isDark ? 'rgba(56,189,248,0.2)' : 'rgba(14,116,144,0.15)'
    : isDark ? 'rgba(245,158,11,0.2)' : 'rgba(180,83,9,0.15)';
  const textFill = isCpp
    ? isDark ? 'rgba(125,211,252,0.6)' : 'rgba(14,116,144,0.6)'
    : isDark ? 'rgba(252,211,77,0.55)' : 'rgba(146,64,14,0.6)';
  const labelFill = isCpp
    ? isDark ? 'rgba(125,211,252,0.3)' : 'rgba(14,116,144,0.35)'
    : isDark ? 'rgba(252,211,77,0.25)' : 'rgba(180,83,9,0.3)';
  const dimConnector = isCpp
    ? isDark ? 'rgba(56,189,248,0.08)' : 'rgba(14,116,144,0.08)'
    : isDark ? 'rgba(245,158,11,0.08)' : 'rgba(180,83,9,0.08)';

  // Stagger delays for fade-in
  const stagger = (i: number) => prefersReducedMotion ? 0 : 0.4 + i * 0.35;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="bp-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="pulse-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset="0.5" stopColor={accent} stopOpacity="0.8" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ═══ BINARY TREE (top-right) ═══════════════════════════════════════ */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1.2, delay: stagger(0) }}
      >
        <text x="1080" y="130" fill={labelFill} fontSize="10" fontFamily="monospace" fontWeight="700" letterSpacing="0.15em">BINARY TREE</text>

        {/* Edges */}
        <line x1="1120" y1="170" x2="1060" y2="230" stroke={nodeStroke} strokeWidth="1.5" />
        <line x1="1120" y1="170" x2="1180" y2="230" stroke={nodeStroke} strokeWidth="1.5" />
        <line x1="1060" y1="230" x2="1030" y2="290" stroke={nodeStroke} strokeWidth="1.5" />
        <line x1="1060" y1="230" x2="1090" y2="290" stroke={nodeStroke} strokeWidth="1.5" />
        <line x1="1180" y1="230" x2="1210" y2="290" stroke={nodeStroke} strokeWidth="1.5" />

        {/* Traversal pulses */}
        <circle r="3" fill={accent} filter="url(#bp-glow)">
          {!prefersReducedMotion && <>
            <animateMotion dur="3s" repeatCount="indefinite" path="M1120,170 L1060,230 L1030,290" />
            <animate attributeName="opacity" values="0;0.9;0.9;0" dur="3s" repeatCount="indefinite" />
          </>}
        </circle>
        <circle r="3" fill={accent} filter="url(#bp-glow)">
          {!prefersReducedMotion && <>
            <animateMotion dur="3.5s" repeatCount="indefinite" begin="1.5s" path="M1120,170 L1180,230 L1210,290" />
            <animate attributeName="opacity" values="0;0.9;0.9;0" dur="3.5s" repeatCount="indefinite" begin="1.5s" />
          </>}
        </circle>

        {/* Nodes */}
        {[
          { cx: 1120, cy: 170, label: '15' },
          { cx: 1060, cy: 230, label: '9' },
          { cx: 1180, cy: 230, label: '21' },
          { cx: 1030, cy: 290, label: '4' },
          { cx: 1090, cy: 290, label: '12' },
          { cx: 1210, cy: 290, label: '25' },
        ].map((n, i) => (
          <g key={`tree-${i}`}>
            <circle cx={n.cx} cy={n.cy} r="16" fill={nodeFill} stroke={nodeStroke} strokeWidth="1.5" />
            {i === 0 && <circle cx={n.cx} cy={n.cy} r="16" fill="none" stroke={accent} strokeWidth="1" strokeOpacity="0.4">
              {!prefersReducedMotion && <>
                <animate attributeName="r" values="16;22;16" dur="4s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="4s" repeatCount="indefinite" />
              </>}
            </circle>}
            <text x={n.cx} y={n.cy + 4} textAnchor="middle" fill={textFill} fontSize="11" fontFamily="monospace" fontWeight="600">{n.label}</text>
          </g>
        ))}
      </motion.g>

      {/* ═══ LINKED LIST (mid-right) ═══════════════════════════════════════ */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 1.2, delay: stagger(1) }}
      >
        <text x="980" y="400" fill={labelFill} fontSize="10" fontFamily="monospace" fontWeight="700" letterSpacing="0.15em">LINKED LIST</text>

        {[
          { x: 1000, val: 'H' },
          { x: 1080, val: '3' },
          { x: 1160, val: '7' },
          { x: 1240, val: '1' },
          { x: 1320, val: 'Ø' },
        ].map((n, i, arr) => (
          <g key={`ll-${i}`}>
            {i < arr.length - 1 && (
              <>
                <line x1={n.x + 18} y1={430} x2={arr[i+1].x - 18} y2={430} stroke={nodeStroke} strokeWidth="1.2" />
                <polygon points={`${arr[i+1].x - 18},426 ${arr[i+1].x - 18},434 ${arr[i+1].x - 12},430`} fill={nodeStroke} />
              </>
            )}
            <rect x={n.x - 18} y={414} width="36" height="32" rx="6" fill={nodeFill} stroke={nodeStroke} strokeWidth="1.5" />
            <text x={n.x} y={434} textAnchor="middle" fill={textFill} fontSize="12" fontFamily="monospace" fontWeight="600">{n.val}</text>
          </g>
        ))}

        {/* Traversal pulse */}
        <circle r="4" fill={accent2} filter="url(#bp-glow)" opacity="0.8">
          {!prefersReducedMotion && <>
            <animateMotion dur="4s" repeatCount="indefinite" path="M1000,430 L1080,430 L1160,430 L1240,430 L1320,430" />
            <animate attributeName="opacity" values="0;0.9;0.9;0.9;0" dur="4s" repeatCount="indefinite" />
          </>}
        </circle>
      </motion.g>

      {/* ═══ GRAPH (bottom-right) ══════════════════════════════════════════ */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1.2, delay: stagger(2) }}
      >
        <text x="1050" y="540" fill={labelFill} fontSize="10" fontFamily="monospace" fontWeight="700" letterSpacing="0.15em">GRAPH</text>

        {[
          [1080, 580, 1160, 600],
          [1080, 580, 1050, 660],
          [1160, 600, 1240, 580],
          [1160, 600, 1140, 680],
          [1050, 660, 1140, 680],
          [1240, 580, 1220, 660],
          [1140, 680, 1220, 660],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={`ge-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={nodeStroke} strokeWidth="1" />
        ))}

        {[
          { cx: 1080, cy: 580, l: 'A' },
          { cx: 1160, cy: 600, l: 'B' },
          { cx: 1240, cy: 580, l: 'C' },
          { cx: 1050, cy: 660, l: 'D' },
          { cx: 1140, cy: 680, l: 'E' },
          { cx: 1220, cy: 660, l: 'F' },
        ].map((n, i) => (
          <g key={`gn-${i}`}>
            <circle cx={n.cx} cy={n.cy} r="14" fill={nodeFill} stroke={nodeStroke} strokeWidth="1.5" />
            <text x={n.cx} y={n.cy + 4} textAnchor="middle" fill={textFill} fontSize="10" fontFamily="monospace" fontWeight="600">{n.l}</text>
          </g>
        ))}

        {/* BFS traversal pulse */}
        <circle r="3" fill={accent} filter="url(#bp-glow)">
          {!prefersReducedMotion && <>
            <animateMotion dur="5s" repeatCount="indefinite" path="M1080,580 L1160,600 L1240,580 L1220,660 L1140,680 L1050,660 L1080,580" />
            <animate attributeName="opacity" values="0;0.8;0.8;0.8;0.8;0.8;0" dur="5s" repeatCount="indefinite" />
          </>}
        </circle>
      </motion.g>

      {/* ═══ DASHED CONNECTORS (tree → list → graph flow) ══════════════════ */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: stagger(3) }}
        strokeDasharray="6 6"
      >
        {/* Tree → Linked List */}
        <path d="M1120,310 Q1100,360 1080,400" stroke={dimConnector} strokeWidth="1" fill="none" />
        {/* Linked List → Graph */}
        <path d="M1140,460 Q1130,500 1120,560" stroke={dimConnector} strokeWidth="1" fill="none" />
      </motion.g>
    </svg>
  );
};

const LandingInteractiveBackdrop: React.FC<LandingInteractiveBackdropProps> = ({
  hoverLang,
  defaultLang = 'javascript',
  theme = 'dark',
}) => {
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

  // Determine the effective language for the background (hover overrides default)
  const effectiveLang = hoverLang || defaultLang;
  const isCpp = effectiveLang === 'cpp' || effectiveLang === 'c++';

  // Dynamic Hover Glow
  let hoverGlowColor = isDark ? 'rgba(249, 115, 22, 0.45)' : 'rgba(234, 88, 12, 0.45)';
  if (isCpp) {
    hoverGlowColor = isDark ? 'rgba(56, 189, 248, 0.65)' : 'rgba(14, 165, 233, 0.6)';
  } else {
    hoverGlowColor = isDark ? 'rgba(245, 158, 11, 0.65)' : 'rgba(245, 158, 11, 0.6)';
  }

  // Light mode uses a mix of blue dots and saffron lines to create the requested gradient effect
  const gridDotColor = isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(56, 189, 248, 0.4)';
  const gridLineColor = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(245, 158, 11, 0.25)';

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* ── Base gradient backgrounds ────────────────────────────────── */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#fde68a_0%,#f8fafc_45%,#bae6fd_100%)] opacity-40 dark:opacity-100 dark:bg-none" />

      {/* ── Dark Gradients ───────────────────────────── */}
      <div className="absolute inset-0 hidden dark:block bg-[var(--dark-base)]" />
      <AnimatePresence>
        <motion.div
          key={isCpp ? 'blue' : 'saffron'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`absolute inset-0 hidden dark:block ${isCpp ? 'bg-mesh-dark-blue' : 'bg-mesh-dark-saffron'}`}
        />
      </AnimatePresence>

      {/* ── InteractiveGrid (sole mouse interaction layer) ──────────── */}
      <InteractiveGrid
        gridSize={55}
        radius={350}
        dotSize={1.5}
        gridThickness={0.5}
        baseOpacity={isDark ? 0.12 : 0.10}
        repulsionStrength={-0.55}
        clickInteraction={true}
        cursorTrail={false}
        backgroundColor="transparent"
        gridColor={gridLineColor}
        dotColor={gridDotColor}
        hoverColor={hoverGlowColor}
        clickProps={{ clickForce: 0.5, motionSpeed: 0.7 }}
      />

      {/* ── Blueprint data structure schematic ─────────────────────── */}
      <BlueprintCanvas key={isCpp ? 'bp-cpp' : 'bp-js'} isDark={isDark} isCpp={isCpp} />

      {/* ── Noise / grain texture overlay ──────────────────────────── */}
      <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.04] mix-blend-overlay pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '180px 180px',
      }} />

      {/* ── Dark vignette (focuses attention toward center) ─────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)'
            : 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(0,0,0,0.06) 100%)',
        }}
      />
    </div>
  );
};

export default LandingInteractiveBackdrop;
