import React, { useEffect, useRef, useState, useMemo } from 'react';
import InteractiveGrid from './InteractiveGrid';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// ─── Blueprint SVG Canvas ──────────────────────────────────────────────────────
// A single full-viewport SVG that draws interconnected data structures
// as a technical schematic with animated traversal pulses.

interface LandingInteractiveBackdropProps {
  hoverLang?: string | null;
  defaultLang?: string;
  theme?: 'light' | 'dark';
}

const BlueprintCanvas: React.FC<{ isDark: boolean; isCpp: boolean }> = ({ isDark, isCpp }) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Color tokens that adapt to theme + language
  // Everything warm-tinted in JS/saffron mode, cool-tinted in C++/blue mode
  const accent = isCpp
    ? isDark ? '#38bdf8' : '#0284c7'   // sky-400 / sky-700
    : isDark ? '#f59e0b' : '#d97706';   // amber-500 / amber-600
  const accent2 = isCpp
    ? isDark ? '#818cf8' : '#6366f1'    // indigo-400 / indigo-500
    : isDark ? '#fbbf24' : '#b45309';   // amber-400 / amber-700
  const dim = isCpp
    ? isDark ? '#1e3a5f' : '#7dd3fc'    // cool blue dim
    : isDark ? '#3d2e1a' : '#d4a76a';   // warm brown dim
  const nodeFill = isCpp
    ? isDark ? 'rgba(15,30,55,0.6)' : 'rgba(240,249,255,0.7)'    // blue-tinted
    : isDark ? 'rgba(35,25,15,0.6)' : 'rgba(255,251,235,0.7)';   // amber-tinted
  const nodeStroke = isCpp
    ? isDark ? 'rgba(56,189,248,0.2)' : 'rgba(14,116,144,0.15)'  // sky strokes
    : isDark ? 'rgba(245,158,11,0.2)' : 'rgba(180,83,9,0.15)';   // amber strokes
  const textFill = isCpp
    ? isDark ? 'rgba(125,211,252,0.6)' : 'rgba(14,116,144,0.6)'  // sky text
    : isDark ? 'rgba(252,211,77,0.55)' : 'rgba(146,64,14,0.6)';  // amber text
  const labelFill = isCpp
    ? isDark ? 'rgba(125,211,252,0.3)' : 'rgba(14,116,144,0.35)' // sky labels
    : isDark ? 'rgba(252,211,77,0.25)' : 'rgba(180,83,9,0.3)';   // amber labels
  
  const animDur = prefersReducedMotion ? '0s' : undefined;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Glow filter for nodes */}
        <filter id="bp-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="bp-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Traversal pulse gradient */}
        <linearGradient id="pulse-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent} stopOpacity="0" />
          <stop offset="0.5" stopColor={accent} stopOpacity="0.8" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pulse-grad-2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={accent2} stopOpacity="0" />
          <stop offset="0.5" stopColor={accent2} stopOpacity="0.7" />
          <stop offset="1" stopColor={accent2} stopOpacity="0" />
        </linearGradient>

        {/* Dashed connector pattern */}
        <pattern id="dash-pattern" patternUnits="userSpaceOnUse" width="12" height="1">
          <line x1="0" y1="0" x2="6" y2="0" stroke={dim} strokeWidth="1" strokeOpacity="0.5"/>
        </pattern>
      </defs>

      {/* ═══ BINARY TREE (top-right area) ═══════════════════════════════════ */}
      <g opacity="0.55">
        {/* Label */}
        <text x="1080" y="130" fill={labelFill} fontSize="10" fontFamily="monospace" fontWeight="700" letterSpacing="0.15em">BINARY TREE</text>
        
        {/* Edges */}
        <line x1="1120" y1="170" x2="1060" y2="230" stroke={nodeStroke} strokeWidth="1.5" />
        <line x1="1120" y1="170" x2="1180" y2="230" stroke={nodeStroke} strokeWidth="1.5" />
        <line x1="1060" y1="230" x2="1030" y2="290" stroke={nodeStroke} strokeWidth="1.5" />
        <line x1="1060" y1="230" x2="1090" y2="290" stroke={nodeStroke} strokeWidth="1.5" />
        <line x1="1180" y1="230" x2="1210" y2="290" stroke={nodeStroke} strokeWidth="1.5" />
        
        {/* Traversal pulse on edge */}
        <circle r="3" fill={accent} filter="url(#bp-glow)">
          <animateMotion dur={animDur || "3s"} repeatCount="indefinite" path="M1120,170 L1060,230 L1030,290" />
          <animate attributeName="opacity" values="0;0.9;0.9;0" dur={animDur || "3s"} repeatCount="indefinite" />
        </circle>
        <circle r="3" fill={accent} filter="url(#bp-glow)">
          <animateMotion dur={animDur || "3.5s"} repeatCount="indefinite" begin="1.5s" path="M1120,170 L1180,230 L1210,290" />
          <animate attributeName="opacity" values="0;0.9;0.9;0" dur={animDur || "3.5s"} repeatCount="indefinite" begin="1.5s" />
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
              <animate attributeName="r" values="16;22;16" dur={animDur || "4s"} repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur={animDur || "4s"} repeatCount="indefinite" />
            </circle>}
            <text x={n.cx} y={n.cy + 4} textAnchor="middle" fill={textFill} fontSize="11" fontFamily="monospace" fontWeight="600">{n.label}</text>
          </g>
        ))}
      </g>

      {/* ═══ LINKED LIST (middle-right, flowing horizontally) ═══════════════ */}
      <g opacity="0.5">
        <text x="980" y="400" fill={labelFill} fontSize="10" fontFamily="monospace" fontWeight="700" letterSpacing="0.15em">LINKED LIST</text>
        
        {/* Nodes + arrows */}
        {[
          { x: 1000, val: 'H' },
          { x: 1080, val: '3' },
          { x: 1160, val: '7' },
          { x: 1240, val: '1' },
          { x: 1320, val: 'Ø' },
        ].map((n, i, arr) => (
          <g key={`ll-${i}`}>
            {/* Arrow to next node */}
            {i < arr.length - 1 && (
              <>
                <line x1={n.x + 18} y1={430} x2={arr[i+1].x - 18} y2={430} stroke={nodeStroke} strokeWidth="1.2" />
                <polygon points={`${arr[i+1].x - 18},426 ${arr[i+1].x - 18},434 ${arr[i+1].x - 12},430`} fill={nodeStroke} />
              </>
            )}
            {/* Node box */}
            <rect x={n.x - 18} y={414} width="36" height="32" rx="6" fill={nodeFill} stroke={nodeStroke} strokeWidth="1.5" />
            <text x={n.x} y={434} textAnchor="middle" fill={textFill} fontSize="12" fontFamily="monospace" fontWeight="600">{n.val}</text>
          </g>
        ))}
        
        {/* Traversal pulse along linked list */}
        <circle r="4" fill={accent2} filter="url(#bp-glow)" opacity="0.8">
          <animateMotion dur={animDur || "4s"} repeatCount="indefinite" path="M1000,430 L1080,430 L1160,430 L1240,430 L1320,430" />
          <animate attributeName="opacity" values="0;0.9;0.9;0.9;0" dur={animDur || "4s"} repeatCount="indefinite" />
        </circle>
      </g>

      {/* ═══ GRAPH / NETWORK (bottom-right corner) ═════════════════════════ */}
      <g opacity="0.45">
        <text x="1050" y="540" fill={labelFill} fontSize="10" fontFamily="monospace" fontWeight="700" letterSpacing="0.15em">GRAPH</text>
        
        {/* Edges */}
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

        {/* Nodes */}
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

        {/* BFS pulse along graph */}
        <circle r="3" fill={accent} filter="url(#bp-glow)">
          <animateMotion dur={animDur || "5s"} repeatCount="indefinite" path="M1080,580 L1160,600 L1240,580 L1220,660 L1140,680 L1050,660 L1080,580" />
          <animate attributeName="opacity" values="0;0.8;0.8;0.8;0.8;0.8;0" dur={animDur || "5s"} repeatCount="indefinite" />
        </circle>
      </g>

      {/* ═══ ARRAY / SORTING (upper-left area, partially behind hero text) ═ */}
      <g opacity="0.3">
        <text x="60" y="160" fill={labelFill} fontSize="10" fontFamily="monospace" fontWeight="700" letterSpacing="0.15em">ARRAY</text>

        {/* Bar chart style array visualization */}
        {[38, 65, 22, 85, 45, 55, 72, 30].map((h, i) => (
          <g key={`arr-${i}`}>
            <rect
              x={60 + i * 28}
              y={260 - h}
              width="20"
              height={h}
              rx="3"
              fill={i === 3 ? accent : nodeFill}
              fillOpacity={i === 3 ? 0.35 : 1}
              stroke={i === 3 ? accent : nodeStroke}
              strokeWidth="1"
            />
          </g>
        ))}
        {/* Index markers */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((idx, i) => (
          <text key={`idx-${i}`} x={70 + i * 28} y={275} textAnchor="middle" fill={labelFill} fontSize="8" fontFamily="monospace">{idx}</text>
        ))}
      </g>

      {/* ═══ STACK (left side, lower) ═══════════════════════════════════════ */}
      <g opacity="0.3">
        <text x="60" y="380" fill={labelFill} fontSize="10" fontFamily="monospace" fontWeight="700" letterSpacing="0.15em">STACK</text>

        {/* Stack frames - bottom to top */}
        {[
          { label: 'main()', y: 520, w: 110 },
          { label: 'sort(arr)', y: 488, w: 110 },
          { label: 'partition()', y: 456, w: 110 },
          { label: 'swap(i,j)', y: 424, w: 110, highlight: true },
        ].map((frame, i) => (
          <g key={`stk-${i}`}>
            <rect
              x="60"
              y={frame.y}
              width={frame.w}
              height="26"
              rx="4"
              fill={frame.highlight ? accent : nodeFill}
              fillOpacity={frame.highlight ? 0.2 : 1}
              stroke={frame.highlight ? accent : nodeStroke}
              strokeWidth={frame.highlight ? 1.5 : 1}
            />
            <text x={60 + frame.w / 2} y={frame.y + 17} textAnchor="middle" fill={frame.highlight ? accent : textFill} fontSize="10" fontFamily="monospace" fontWeight={frame.highlight ? '700' : '500'}>{frame.label}</text>
          </g>
        ))}
        {/* Stack pointer arrow */}
        <line x1="44" y1="437" x2="56" y2="437" stroke={accent} strokeWidth="1.5" />
        <polygon points="56,433 56,441 62,437" fill={accent} opacity="0.7" />
        <text x="34" y="441" textAnchor="middle" fill={accent} fontSize="8" fontFamily="monospace" fontWeight="700" opacity="0.6">SP</text>
      </g>

      {/* ═══ DASHED CONNECTORS (linking structures together) ════════════════ */}
      <g opacity="0.2" strokeDasharray="6 6">
        {/* Array → Tree (data flows into tree) */}
        <path d="M284,220 Q500,150 1060,170" stroke={dim} strokeWidth="1" fill="none" />
        {/* Stack → LinkedList */}
        <path d="M170,430 Q600,430 980,430" stroke={dim} strokeWidth="1" fill="none" />
        {/* Tree → Graph */}
        <path d="M1120,310 Q1100,440 1080,570" stroke={dim} strokeWidth="1" fill="none" />
      </g>

      {/* ═══ SUBTLE COORDINATE MARKERS (blueprint feel) ════════════════════ */}
      <g opacity="0.15" fill={dim} fontSize="8" fontFamily="monospace">
        <text x="1400" y="20">x:1440</text>
        <text x="10" y="890">y:900</text>
        <text x="710" y="20">x:720</text>
        <text x="10" y="450">y:450</text>
      </g>
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
      {/* In Dark mode, default to the selected language warmth and switch on hover */}
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
      <BlueprintCanvas isDark={isDark} isCpp={isCpp} />

      {/* ── Decorative lines ───────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-[18%] h-px bg-gradient-to-r from-transparent via-slate-900/15 to-transparent dark:via-slate-100/10" />
      <div className="absolute inset-x-[12%] top-[48%] h-px bg-gradient-to-r from-transparent via-slate-900/10 to-transparent dark:via-slate-100/10" />
      <div className="absolute right-[18%] top-[12%] bottom-[18%] w-px bg-gradient-to-b from-transparent via-slate-900/10 to-transparent dark:via-slate-100/10" />
    </div>
  );
};

export default LandingInteractiveBackdrop;
