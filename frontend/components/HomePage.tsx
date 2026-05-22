import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Code2,
  Cpu,
  ArrowRight,
  Activity,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Star,
  Eye,
  Layers,
  BookOpen,
  Sun,
  Moon,
  Github,
  Zap,
  Sparkles,
  TrendingUp,
  CheckCircle,
  HelpCircle,
  Code,
  Layout,
  Sliders,
  ChevronDown
} from 'lucide-react';
import homepagePreview from '../../assets/homepage.png';
import editorPreview from '../../assets/editor.png';
import { HOME_FAQ_ITEMS } from '../seo';
import LandingInteractiveBackdrop from './LandingInteractiveBackdrop.tsx';
import Logo from './Logo';

interface HomePageProps {
  language: string;
  onSelectLanguage: (lang: string) => void;
  onOpenDocs: () => void;
  docsHref: string;
  javascriptHref: string;
  cppHref: string;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
  onHoverLanguage?: (lang: string | null) => void;
}

// ==========================================
// 1. INTERACTIVE HERO DEBUGGER SIMULATION DATA
// ==========================================

interface SimulationStep {
  line: number;
  vars: Record<string, any>;
  callStack: string[];
  consoleOut: string[];
  visualState: any; // Context specific for graph/array rendering
}

interface AlgorithmConfig {
  name: string;
  lang: string;
  code: string[];
  steps: SimulationStep[];
}

const SIMULATIONS: Record<string, AlgorithmConfig> = {
  fibonacci: {
    name: "Fibonacci (Recursion)",
    lang: "javascript",
    code: [
      "function fib(n) {",
      "  if (n <= 1) return n;",
      "  return fib(n - 1) + fib(n - 2);",
      "}",
      "fib(4);"
    ],
    steps: [
      { line: 5, vars: { n: "undefined" }, callStack: ["global()"], consoleOut: ["$ node fib.js"], visualState: { activeNode: null, nodes: [4] } },
      { line: 1, vars: { n: 4 }, callStack: ["fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)"], visualState: { activeNode: 0, nodes: [4] } },
      { line: 2, vars: { n: 4 }, callStack: ["fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)"], visualState: { activeNode: 0, nodes: [4] } },
      { line: 3, vars: { n: 4 }, callStack: ["fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)", "Recursing left..."], visualState: { activeNode: 0, nodes: [4, 3] } },
      { line: 1, vars: { n: 3 }, callStack: ["fib(3)", "fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)", "Recursing left...", "Calling fib(3)"], visualState: { activeNode: 1, nodes: [4, 3] } },
      { line: 2, vars: { n: 3 }, callStack: ["fib(3)", "fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)", "Recursing left...", "Calling fib(3)"], visualState: { activeNode: 1, nodes: [4, 3] } },
      { line: 3, vars: { n: 3 }, callStack: ["fib(3)", "fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)", "Recursing left...", "Calling fib(3)", "Recursing left..."], visualState: { activeNode: 1, nodes: [4, 3, 2] } },
      { line: 1, vars: { n: 2 }, callStack: ["fib(2)", "fib(3)", "fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)", "Recursing left...", "Calling fib(3)", "Recursing left...", "Calling fib(2)"], visualState: { activeNode: 2, nodes: [4, 3, 2] } },
      { line: 2, vars: { n: 2 }, callStack: ["fib(2)", "fib(3)", "fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)", "Recursing left...", "Calling fib(3)", "Recursing left...", "Calling fib(2)"], visualState: { activeNode: 2, nodes: [4, 3, 2] } },
      { line: 3, vars: { n: 2 }, callStack: ["fib(2)", "fib(3)", "fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)", "Recursing left...", "Calling fib(3)", "Recursing left...", "Calling fib(2)", "Recursing left..."], visualState: { activeNode: 2, nodes: [4, 3, 2, 1] } },
      { line: 1, vars: { n: 1 }, callStack: ["fib(1)", "fib(2)", "fib(3)", "fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)", "Recursing left...", "Calling fib(3)", "Recursing left...", "Calling fib(2)", "Recursing left...", "Calling fib(1)"], visualState: { activeNode: 3, nodes: [4, 3, 2, 1] } },
      { line: 2, vars: { n: 1 }, callStack: ["fib(1)", "fib(2)", "fib(3)", "fib(4)", "global()"], consoleOut: ["$ node fib.js", "Calling fib(4)", "Recursing left...", "Calling fib(3)", "Recursing left...", "Calling fib(2)", "Recursing left...", "Calling fib(1)", "Base case: n=1, returning 1"], visualState: { activeNode: 3, nodes: [4, 3, 2, 1] } }
    ]
  },
  bubbleSort: {
    name: "Bubble Sort (Loops)",
    lang: "javascript",
    code: [
      "let arr = [4, 2, 5, 1];",
      "for (let i = 0; i < arr.length; i++) {",
      "  if (arr[i] > arr[i+1]) {",
      "    swap(arr, i, i+1);",
      "  }",
      "}"
    ],
    steps: [
      { line: 1, vars: { arr: "[4, 2, 5, 1]", i: "undefined" }, callStack: ["global()"], consoleOut: ["$ node sort.js"], visualState: { arr: [4, 2, 5, 1], activeIdx: [] } },
      { line: 2, vars: { arr: "[4, 2, 5, 1]", i: 0 }, callStack: ["global()"], consoleOut: ["$ node sort.js", "Outer loop: i = 0"], visualState: { arr: [4, 2, 5, 1], activeIdx: [0] } },
      { line: 3, vars: { arr: "[4, 2, 5, 1]", i: 0 }, callStack: ["global()"], consoleOut: ["$ node sort.js", "Outer loop: i = 0", "Comparing arr[0] (4) > arr[1] (2)"], visualState: { arr: [4, 2, 5, 1], activeIdx: [0, 1] } },
      { line: 4, vars: { arr: "[4, 2, 5, 1]", i: 0 }, callStack: ["swap()", "global()"], consoleOut: ["$ node sort.js", "Outer loop: i = 0", "Comparing arr[0] (4) > arr[1] (2)", "Swapping 4 and 2"], visualState: { arr: [2, 4, 5, 1], activeIdx: [0, 1] } },
      { line: 2, vars: { arr: "[2, 4, 5, 1]", i: 1 }, callStack: ["global()"], consoleOut: ["$ node sort.js", "Outer loop: i = 1"], visualState: { arr: [2, 4, 5, 1], activeIdx: [1] } },
      { line: 3, vars: { arr: "[2, 4, 5, 1]", i: 1 }, callStack: ["global()"], consoleOut: ["$ node sort.js", "Outer loop: i = 1", "Comparing arr[1] (4) > arr[2] (5)"], visualState: { arr: [2, 4, 5, 1], activeIdx: [1, 2] } },
      { line: 2, vars: { arr: "[2, 4, 5, 1]", i: 2 }, callStack: ["global()"], consoleOut: ["$ node sort.js", "Outer loop: i = 2"], visualState: { arr: [2, 4, 5, 1], activeIdx: [2] } },
      { line: 3, vars: { arr: "[2, 4, 5, 1]", i: 2 }, callStack: ["global()"], consoleOut: ["$ node sort.js", "Outer loop: i = 2", "Comparing arr[2] (5) > arr[3] (1)"], visualState: { arr: [2, 4, 5, 1], activeIdx: [2, 3] } },
      { line: 4, vars: { arr: "[2, 4, 5, 1]", i: 2 }, callStack: ["swap()", "global()"], consoleOut: ["$ node sort.js", "Outer loop: i = 2", "Comparing arr[2] (5) > arr[3] (1)", "Swapping 5 and 1"], visualState: { arr: [2, 4, 1, 5], activeIdx: [2, 3] } },
      { line: 2, vars: { arr: "[2, 4, 1, 5]", i: 3 }, callStack: ["global()"], consoleOut: ["$ node sort.js", "Bubble sort passes continuing..."], visualState: { arr: [2, 4, 1, 5], activeIdx: [] } }
    ]
  },
  binarySearch: {
    name: "Binary Search (Divide & Conquer)",
    lang: "javascript",
    code: [
      "let arr = [1, 3, 5, 7, 9];",
      "let target = 7;",
      "let L = 0, R = 4;",
      "while (L <= R) {",
      "  let M = Math.floor((L + R) / 2);",
      "  if (arr[M] === target) return M;",
      "  if (arr[M] < target) L = M + 1;",
      "}"
    ],
    steps: [
      { line: 1, vars: { arr: "[1, 3, 5, 7, 9]", target: 7, L: "undefined", R: "undefined" }, callStack: ["global()"], consoleOut: ["$ node search.js"], visualState: { L: 0, R: 4, M: -1 } },
      { line: 3, vars: { arr: "[1, 3, 5, 7, 9]", target: 7, L: 0, R: 4 }, callStack: ["global()"], consoleOut: ["$ node search.js", "Pointers initialized: L=0, R=4"], visualState: { L: 0, R: 4, M: -1 } },
      { line: 4, vars: { arr: "[1, 3, 5, 7, 9]", target: 7, L: 0, R: 4 }, callStack: ["global()"], consoleOut: ["$ node search.js", "Pointers initialized: L=0, R=4", "Checking loop: L <= R (0 <= 4 is true)"], visualState: { L: 0, R: 4, M: -1 } },
      { line: 5, vars: { arr: "[1, 3, 5, 7, 9]", target: 7, L: 0, R: 4, M: 2 }, callStack: ["global()"], consoleOut: ["$ node search.js", "Pointers initialized: L=0, R=4", "Checking loop: L <= R (0 <= 4 is true)", "Calculated Mid index: M = 2"], visualState: { L: 0, R: 4, M: 2 } },
      { line: 6, vars: { arr: "[1, 3, 5, 7, 9]", target: 7, L: 0, R: 4, M: 2 }, callStack: ["global()"], consoleOut: ["$ node search.js", "Calculated Mid index: M = 2", "arr[2] (5) !== target (7)"], visualState: { L: 0, R: 4, M: 2 } },
      { line: 7, vars: { arr: "[1, 3, 5, 7, 9]", target: 7, L: 3, R: 4, M: 2 }, callStack: ["global()"], consoleOut: ["$ node search.js", "arr[2] < 7, shifting L to M + 1 = 3"], visualState: { L: 3, R: 4, M: 2 } },
      { line: 4, vars: { arr: "[1, 3, 5, 7, 9]", target: 7, L: 3, R: 4 }, callStack: ["global()"], consoleOut: ["$ node search.js", "Checking loop: L <= R (3 <= 4 is true)"], visualState: { L: 3, R: 4, M: -1 } },
      { line: 5, vars: { arr: "[1, 3, 5, 7, 9]", target: 7, L: 3, R: 4, M: 3 }, callStack: ["global()"], consoleOut: ["$ node search.js", "Checking loop: L <= R (3 <= 4 is true)", "Calculated Mid index: M = 3"], visualState: { L: 3, R: 4, M: 3 } },
      { line: 6, vars: { arr: "[1, 3, 5, 7, 9]", target: 7, L: 3, R: 4, M: 3 }, callStack: ["global()"], consoleOut: ["$ node search.js", "Checking loop: L <= R (3 <= 4 is true)", "Calculated Mid index: M = 3", "arr[3] (7) === target (7) MATCH!"], visualState: { L: 3, R: 4, M: 3, match: true } }
    ]
  }
};

// ==========================================
// 2. STATS COMPONENT WITH RADIAL METER
// ==========================================

const STATS = [
  { label: 'Runtimes Supported', value: 2, suffix: '', icon: Cpu, color: 'from-blue-500 to-indigo-500' },
  { label: 'Code Templates', value: 50, suffix: '+', icon: Terminal, color: 'from-saffron-500 to-amber-500' },
  { label: 'Steps Simulated', value: 12000, suffix: '+', icon: Activity, color: 'from-emerald-500 to-teal-500' },
  { label: 'Open Source', value: 100, suffix: '%', icon: Github, color: 'from-violet-500 to-fuchsia-500' },
];

const StatCard: React.FC<{ label: string; value: number; suffix: string; icon: any; color: string }> = ({
  label,
  value,
  suffix,
  icon: Icon,
  color,
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const duration = 1500;
        const step = 16;
        const steps = duration / step;
        const increment = value / steps;
        const timer = setInterval(() => {
          start += increment;
          if (start >= value) {
            setCount(value);
            clearInterval(timer);
          } else setCount(Math.floor(start));
        }, step);
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="relative group overflow-hidden bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md rounded-3xl p-6 flex items-center gap-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-500/5 dark:hover:shadow-black/20">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr ${color} text-white shadow-lg`}>
        <Icon size={22} className="group-hover:scale-110 transition-transform duration-300" />
      </div>
      <div>
        <div className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-baseline gap-0.5">
          <span>{count.toLocaleString()}</span>
          <span className="text-xl font-bold text-slate-400">{suffix}</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN HOMEPAGE REDESIGN COMPONENT
// ==========================================

const HomePage: React.FC<HomePageProps> = ({
  language,
  onSelectLanguage,
  onOpenDocs,
  docsHref,
  javascriptHref,
  cppHref,
  toggleTheme,
  theme,
  onHoverLanguage,
}) => {
  const [hoverLang, setHoverLang] = useState<string | null>(null);
  
  // Simulation control states
  const [activeSimKey, setActiveSimKey] = useState<string>('fibonacci');
  const [simStepIdx, setSimStepIdx] = useState(0);
  const [isPlayingSim, setIsPlayingSim] = useState(true);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Bento interactive variables state
  const [bentoVars, setBentoVars] = useState([
    { name: 'val', value: 42, color: 'text-amber-500' },
    { name: 'multiplier', value: 2, color: 'text-blue-500' },
    { name: 'result', value: 84, color: 'text-emerald-500' }
  ]);
  
  // Bento interactive stack state
  const [bentoStack, setBentoStack] = useState(['main()', 'compute(42)']);
  
  // FAQ expanded state index array
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // How it works active tab
  const [activeStepTab, setActiveStepTab] = useState(0);

  const activeSim = SIMULATIONS[activeSimKey];
  const currentSimStep = activeSim.steps[simStepIdx] || activeSim.steps[0];

  // Simulation Playback Loop
  useEffect(() => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    
    if (isPlayingSim) {
      simTimerRef.current = setInterval(() => {
        setSimStepIdx((prev) => {
          const next = prev + 1;
          return next >= activeSim.steps.length ? 0 : next;
        });
      }, 1600);
    }
    
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isPlayingSim, activeSimKey, activeSim.steps.length]);

  const handleSimSelect = (key: string) => {
    setActiveSimKey(key);
    setSimStepIdx(0);
    setIsPlayingSim(true);
  };

  const handleNextStep = () => {
    setIsPlayingSim(false);
    setSimStepIdx((prev) => (prev + 1) % activeSim.steps.length);
  };

  const handlePrevStep = () => {
    setIsPlayingSim(false);
    setSimStepIdx((prev) => (prev - 1 + activeSim.steps.length) % activeSim.steps.length);
  };

  const handleResetSim = () => {
    setIsPlayingSim(false);
    setSimStepIdx(0);
  };

  // Bento functions
  const mutateBentoVar = (index: number) => {
    setBentoVars(prev => prev.map((v, i) => {
      if (i !== index) return v;
      const delta = Math.floor(Math.random() * 20) - 10;
      const newValue = Math.max(1, v.value + delta);
      
      // If we change val or multiplier, auto-recalculate result!
      let resultUpdate = {};
      if (v.name === 'val') {
        const mult = prev.find(x => x.name === 'multiplier')?.value || 2;
        resultUpdate = { result: newValue * mult };
      } else if (v.name === 'multiplier') {
        const val = prev.find(x => x.name === 'val')?.value || 42;
        resultUpdate = { result: val * newValue };
      }
      
      return { ...v, value: newValue };
    }));

    // Perform cascades
    setTimeout(() => {
      setBentoVars(current => {
        const val = current.find(x => x.name === 'val')?.value || 0;
        const mult = current.find(x => x.name === 'multiplier')?.value || 0;
        return current.map(v => v.name === 'result' ? { ...v, value: val * mult } : v);
      });
    }, 100);
  };

  const pushStackFrame = () => {
    if (bentoStack.length >= 5) return;
    const names = ['helper()', 'validate()', 'format()', 'render()', 'callback()'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    setBentoStack(prev => [randomName, ...prev]);
  };

  const popStackFrame = () => {
    if (bentoStack.length <= 1) return;
    setBentoStack(prev => prev.slice(1));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8] dark:bg-[#070b13] text-slate-800 dark:text-slate-200 font-sans selection:bg-amber-200 dark:selection:bg-amber-900/60 transition-colors duration-500 overflow-x-hidden">
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px]" />
      </div>

      <LandingInteractiveBackdrop hoverLang={hoverLang} defaultLang={language} theme={theme} />

      {/* ==========================================
      1. FLOATING NAVIGATION BAR
      ========================================== */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between border-b border-slate-200/50 bg-white/60 backdrop-blur-xl dark:border-slate-800/40 dark:bg-slate-950/50 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-500/20 rounded-xl blur-md group-hover:blur-lg transition-all duration-300" />
            <Logo
              language={hoverLang === 'cpp' ? 'c++' : 'javascript'}
              className="relative w-10 h-10 drop-shadow-md z-10 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
            AlgoViz
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <a
            href={docsHref}
            onClick={(e) => {
              e.preventDefault();
              onOpenDocs();
            }}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors duration-200 flex items-center gap-1 group"
          >
            Documentation
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="https://github.com/ssgamingop/AlgoViz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-sm font-semibold transition-all group shadow-sm"
          >
            <Github size={16} />
            <span className="hidden sm:inline">Star on GitHub</span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-lg text-xs">
              <Star size={10} fill="currentColor" />
            </span>
          </a>
          
          <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-all shadow-sm"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </nav>
      </header>

      {/* ==========================================
      2. HERO SECTION
      ========================================== */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Hand: High impact pitch */}
        <div className="lg:col-span-5 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles size={12} className="animate-spin-slow" />
            Visual Debugging Reimagined
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white mb-6">
            See your code <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-saffron-500 to-amber-500 dark:from-saffron-400 dark:to-amber-300">
              execute in memory.
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl font-medium leading-relaxed mb-10 max-w-lg">
            Stop tracing code blindly with console logs. Step through logic line-by-line, watch variables morph, and untangle recursion trees in real time.
          </p>

          {/* Core Selectors */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <a
              href={javascriptHref}
              onClick={(e) => {
                e.preventDefault();
                onSelectLanguage('javascript');
              }}
              onMouseEnter={() => { setHoverLang('js'); onHoverLanguage?.('javascript'); }}
              onMouseLeave={() => { setHoverLang(null); onHoverLanguage?.(null); }}
              className="group relative flex items-center justify-between border-2 border-slate-900 dark:border-slate-800 bg-yellow-400 hover:bg-yellow-300 dark:bg-yellow-500 dark:hover:bg-yellow-400 px-6 py-4 rounded-2xl text-slate-900 dark:text-slate-950 font-bold transition-all shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-900/10 flex items-center justify-center">
                  <Code2 size={18} />
                </div>
                <span>Launch Javascript</span>
              </div>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href={cppHref}
              onClick={(e) => {
                e.preventDefault();
                onSelectLanguage('c++');
              }}
              onMouseEnter={() => { setHoverLang('cpp'); onHoverLanguage?.('c++'); }}
              onMouseLeave={() => { setHoverLang(null); onHoverLanguage?.(null); }}
              className="group relative flex items-center justify-between border-2 border-slate-900 dark:border-slate-800 bg-blue-600 hover:bg-blue-500 px-6 py-4 rounded-2xl text-white font-bold transition-all shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Cpu size={18} />
                </div>
                <span>Launch C++</span>
              </div>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Subtext docs and extension */}
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <a
              href={docsHref}
              onClick={(e) => {
                e.preventDefault();
                onOpenDocs();
              }}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors py-1 font-semibold"
            >
              <BookOpen size={16} /> Read Documentation
            </a>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:inline" />
            <a
              href="https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors py-1 font-semibold"
            >
              <Zap size={14} /> Get VS Code Extension
            </a>
          </div>
        </div>

        {/* Right Hand: Fully interactive simulation panel */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="w-full rounded-3xl border border-slate-200/80 bg-white/70 shadow-2xl dark:border-slate-800/80 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden flex flex-col h-[520px]">
            
            {/* Header / Tabs */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 rounded-xl p-1">
                {Object.keys(SIMULATIONS).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSimSelect(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeSimKey === key
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {SIMULATIONS[key].name}
                  </button>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevStep}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                  title="Previous Step"
                >
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                <button
                  onClick={() => setIsPlayingSim(!isPlayingSim)}
                  className={`p-2 rounded-xl flex items-center justify-center text-white transition-all shadow-md ${
                    isPlayingSim ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                  title={isPlayingSim ? "Pause Simulation" : "Play Simulation"}
                >
                  {isPlayingSim ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
                <button
                  onClick={handleNextStep}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all"
                  title="Next Step"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={handleResetSim}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                  title="Reset"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* Editor & Visualization split screen */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-white/40 dark:bg-slate-950/20">
              
              {/* Fake Code Editor (5 cols) */}
              <div className="md:col-span-6 flex flex-col border-r border-slate-200 dark:border-slate-800/80 font-mono text-sm leading-6 relative">
                <div className="absolute top-3 left-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">Editor</div>
                <div className="flex-1 overflow-y-auto py-10 px-4">
                  {activeSim.code.map((line, idx) => {
                    const isCurrentLine = currentSimStep.line === idx + 1;
                    return (
                      <div
                        key={idx}
                        className={`flex items-start rounded-lg px-2 py-0.5 transition-all ${
                          isCurrentLine
                            ? 'bg-amber-100/70 dark:bg-amber-900/30 text-slate-900 dark:text-white font-bold border-l-2 border-amber-500'
                            : 'text-slate-500 dark:text-slate-400 opacity-80'
                        }`}
                      >
                        <span className="w-5 text-right text-xs pr-2 select-none opacity-45">{idx + 1}</span>
                        <pre className="flex-1 overflow-x-auto whitespace-pre">{line}</pre>
                      </div>
                    );
                  })}
                </div>

                {/* Mini Variables / Watch list inside simulation */}
                <div className="h-[140px] border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 p-4 overflow-hidden flex flex-col">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Variable State</div>
                  <div className="flex-1 overflow-y-auto space-y-1.5">
                    {Object.entries(currentSimStep.vars).map(([name, val]) => (
                      <div key={name} className="flex justify-between items-center text-xs">
                        <span className="text-blue-500 dark:text-blue-400 font-bold">{name}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fake Debugger Output & Visual State (6 cols) */}
              <div className="md:col-span-6 flex flex-col overflow-hidden">
                
                {/* Visual Representation Area */}
                <div className="flex-1 bg-slate-50/30 dark:bg-slate-950/10 p-5 flex flex-col items-center justify-center border-b border-slate-200 dark:border-slate-800/80 relative">
                  <div className="absolute top-3 left-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">Visualizer</div>
                  
                  {/* Dynamic Graphic based on active simulation */}
                  <div className="w-full h-full flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {activeSimKey === 'fibonacci' && (
                        <motion.div
                          key="fib"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center gap-4"
                        >
                          <div className="flex items-center gap-6 relative">
                            {currentSimStep.visualState.nodes.map((nodeVal: number, i: number) => {
                              const isActive = currentSimStep.visualState.activeNode === i;
                              return (
                                <motion.div
                                  key={i}
                                  layout
                                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                                    isActive
                                      ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/30'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                  }`}
                                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                >
                                  {nodeVal}
                                </motion.div>
                              );
                            })}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-2">Active stack frame evaluation</div>
                        </motion.div>
                      )}

                      {activeSimKey === 'bubbleSort' && (
                        <motion.div
                          key="sort"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-end justify-center gap-3.5 h-[100px] w-full px-8"
                        >
                          {currentSimStep.visualState.arr.map((val: number, idx: number) => {
                            const isActive = currentSimStep.visualState.activeIdx.includes(idx);
                            return (
                              <motion.div
                                key={idx}
                                layout
                                className={`w-8 rounded-t-lg transition-all duration-300 flex items-center justify-center text-xs font-bold text-white shadow-md`}
                                style={{
                                  height: `${val * 20}px`,
                                  backgroundColor: isActive ? '#f59e0b' : '#3b82f6',
                                }}
                              >
                                {val}
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}

                      {activeSimKey === 'binarySearch' && (
                        <motion.div
                          key="search"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center gap-4 w-full px-6"
                        >
                          <div className="flex justify-center gap-1.5 w-full">
                            {[1, 3, 5, 7, 9].map((val, idx) => {
                              const isMid = currentSimStep.visualState.M === idx;
                              const inRange = idx >= currentSimStep.visualState.L && idx <= currentSimStep.visualState.R;
                              const isMatch = currentSimStep.visualState.match && isMid;

                              return (
                                <motion.div
                                  key={idx}
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border-2 ${
                                    isMatch
                                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg'
                                      : isMid
                                      ? 'bg-amber-500 border-amber-400 text-white shadow-md'
                                      : inRange
                                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-300'
                                      : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700'
                                  }`}
                                >
                                  {val}
                                </motion.div>
                              );
                            })}
                          </div>
                          <div className="flex gap-4 text-[10px] font-mono text-slate-400">
                            <span>L: {currentSimStep.visualState.L}</span>
                            <span>R: {currentSimStep.visualState.R}</span>
                            <span>M: {currentSimStep.visualState.M !== -1 ? currentSimStep.visualState.M : 'N/A'}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Call Stack mini display */}
                <div className="h-[140px] p-4 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden flex flex-col font-mono">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Call Stack Trace</div>
                  <div className="flex-1 overflow-y-auto space-y-1.5">
                    <AnimatePresence initial={false}>
                      {currentSimStep.callStack.map((frame, index) => (
                        <motion.div
                          key={`${frame}-${index}`}
                          initial={{ opacity: 0, x: -10, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 10, scale: 0.95 }}
                          className={`text-xs px-2.5 py-1 rounded border flex justify-between items-center ${
                            index === 0
                              ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-bold'
                              : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          <span>{frame}</span>
                          <span className="text-[9px] opacity-60">frame {currentSimStep.callStack.length - index - 1}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer console stream */}
            <div className="px-5 py-2.5 bg-slate-950 text-slate-300 font-mono text-xs border-t border-slate-900 flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-emerald-400 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {currentSimStep.consoleOut[currentSimStep.consoleOut.length - 1]}
              </span>
              <span className="text-[10px] text-slate-500 shrink-0">Step {simStepIdx + 1} of {activeSim.steps.length}</span>
            </div>

          </div>
        </div>

      </section>

      {/* ==========================================
      3. HIGH ENERGY BENTO GRID SHOWCASE
      ========================================== */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-wider mb-4">
            <Activity size={12} /> Features Bento Grid
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Engineered for deeper learning.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Stripping away compiler complexity to show you memory, execution scopes, and recursive trees in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[220px]">
          
          {/* Bento 1: Variable Watcher (5 cols) */}
          <div className="md:col-span-5 bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Interactive Watch</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">Watch State</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">State Mutations</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
                Variables are captured at each step. Click values below to simulate live runtime changes.
              </p>
            </div>
            
            <div className="flex gap-2.5 py-1">
              {bentoVars.map((v, i) => (
                <button
                  key={v.name}
                  onClick={() => mutateBentoVar(i)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 transition-all text-left group"
                >
                  <span className={`text-[10px] font-mono font-bold block ${v.color}`}>{v.name}</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:scale-105 inline-block transition-transform mt-0.5">{v.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bento 2: Call Stack Visualizer (7 cols) */}
          <div className="md:col-span-7 bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Interactive Frames</span>
                <div className="flex gap-1.5">
                  <button onClick={pushStackFrame} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all border border-emerald-500/20">Push</button>
                  <button onClick={popStackFrame} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-all border border-red-500/20">Pop</button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Visual Call Stack</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-md">
                Deconstruct scope trees and trace nested recursive functions. Add or delete stack layers to observe layout changes.
              </p>
            </div>

            <div className="flex gap-2 items-center justify-start overflow-x-auto py-1">
              <AnimatePresence>
                {bentoStack.map((frame, idx) => (
                  <motion.div
                    key={`${frame}-${idx}`}
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -15 }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono border whitespace-nowrap ${
                      idx === 0
                        ? 'bg-blue-500 border-blue-400 text-white font-bold shadow-md shadow-blue-500/25'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800/60 text-slate-500'
                    }`}
                  >
                    {frame}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Bento 3: Complexity Curve (7 cols) */}
          <div className="md:col-span-7 bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Analysis Engine</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold">Big-O Tracker</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Time & Space Complexity</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
                Get real-time feedback on execution speed and step operations to learn the mathematical boundaries of your designs.
              </p>
            </div>

            <div className="w-full h-[60px] flex items-end justify-between gap-1 border-b border-slate-200 dark:border-slate-800 pb-1 relative">
              <div className="absolute top-0 right-0 text-[9px] font-mono text-slate-400">O(N^2) Exponential Growth</div>
              {[1, 2, 4, 8, 16, 28, 45, 64].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-violet-500 to-indigo-500 rounded-t"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Bento 4: VS Code Extension (5 cols) */}
          <div className="md:col-span-5 bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Extension Integration</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" /> VS Code
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Direct Editor Link</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Connect your active workspaces using our marketplace extension to visualize local code directly.
              </p>
            </div>

            <a
              href="https://marketplace.visualstudio.com/items?itemName=somyacodes.algoviz-vscode"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Zap size={14} className="fill-current text-yellow-400" />
              Download Extension
            </a>
          </div>

        </div>
      </section>

      {/* ==========================================
      4. STATS COUNTER SECTION
      ========================================== */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* ==========================================
      5. INTERACTIVE HOW-IT-WORKS SECTION
      ========================================== */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-4">
            <Sliders size={12} /> Visual Walkthrough
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Three simple steps.
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            How AlgoViz converts static source files into interactive runtime timelines.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-col md:flex-row gap-8 items-stretch justify-between">
          <div className="flex flex-col gap-3 md:w-1/3 shrink-0">
            {[
              { title: "1. Write or Import Code", desc: "Select C++ or JavaScript files, or type directly into our Monaco-backed workspace sandbox." },
              { title: "2. Trigger compilation", desc: "The Tree-sitter pipeline analyzes breakpoints, functions, and loop variables dynamically." },
              { title: "3. Explore memory frames", desc: "Use playback buttons to watch stack layers, console buffers, and variables animate." }
            ].map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStepTab(idx)}
                className={`text-left p-6 rounded-2xl border transition-all ${
                  activeStepTab === idx
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <div className="font-black text-slate-900 dark:text-white mb-1.5">{step.title}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </button>
            ))}
          </div>

          {/* Graphical Frame depending on active step tab */}
          <div className="flex-1 rounded-3xl border border-slate-200/80 bg-white/40 dark:border-slate-800/80 dark:bg-slate-900/40 backdrop-blur-xl p-8 flex items-center justify-center overflow-hidden min-h-[300px] relative">
            <div className="absolute top-4 left-6 text-[10px] font-mono text-slate-400">Step Preview</div>
            <AnimatePresence mode="wait">
              {activeStepTab === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full flex flex-col gap-4 max-w-md"
                >
                  <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-amber-500 shadow-md">
                    <div className="text-slate-500">// write your algorithms</div>
                    <div><span className="text-blue-400">const</span> numbers = [64, 25, 12];</div>
                    <div>numbers.sort((a,b) =&gt; a-b);</div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> Monaco Editor Bindings</span>
                  </div>
                </motion.div>
              )}

              {activeStepTab === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center gap-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold">Source File</div>
                    <ArrowRight size={14} className="text-slate-400" />
                    <div className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/25">Tree-sitter</div>
                    <ArrowRight size={14} className="text-slate-400" />
                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold">Trace Frame Buffer</div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">AST (Abstract Syntax Tree) traversal captures mutations</div>
                </motion.div>
              )}

              {activeStepTab === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex items-center justify-center gap-6 max-w-sm"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-amber-500 flex items-center justify-center font-black text-amber-500 text-xl shadow-md">
                    O(1)
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center font-black text-blue-500 text-xl shadow-md">
                    O(N)
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-emerald-500 text-xl shadow-md animate-pulse">
                    O(logN)
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ==========================================
      6. INTERFACE WORKBENCH IMAGE REVEAL
      ========================================== */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 font-mono text-xs font-bold uppercase tracking-wider mb-4">
            <Layout size={12} /> Workspace Layout
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Visual debugger workspace.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium">
            Explore the AlgoViz workspace, integrating a Monaco editor, a variables watcher, a complexity analyzer, and a console playback timeline.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.article
            whileHover={{ y: -4 }}
            className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-md mb-6">
              <img
                src={homepagePreview}
                alt="AlgoViz landing page launch workbench"
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                1. Dual-Language Workspace Launches
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Launch code files straight into the workspace from the landing page. Perfect for student assignments, recursion visual mapping, and algorithm tracing.
              </p>
            </div>
          </motion.article>

          <motion.article
            whileHover={{ y: -4 }}
            className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-md mb-6">
              <img
                src={editorPreview}
                alt="AlgoViz active debugger layout"
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                2. Live Variable Mutations & Call Stack Loops
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Track nested function calls, recursive arrays, stack frame variables, and performance indexes while the sandboxed script runs in the browser.
              </p>
            </div>
          </motion.article>
        </div>
      </section>

      {/* ==========================================
      7. EXPANDABLE FAQ ACCORDION SECTION
      ========================================== */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 border-t border-slate-200/50 dark:border-slate-800/40">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle size={12} /> FAQ Accordion
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Everything you need to know about the AlgoViz browser sandbox, transpilation patterns, and setup.
          </p>
        </div>

        <div className="space-y-4">
          {HOME_FAQ_ITEMS.map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-800 dark:text-white hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <span className="pr-4">{item.question}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-amber-500' : ''}`}
                  />
                </button>
                
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-1 text-slate-500 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800/40">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==========================================
      8. CTA FOOTER SECTION
      ========================================== */}
      <section className="relative z-10 w-full border-t border-slate-200/50 dark:border-slate-800/40 py-24 bg-white/40 dark:bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-6">
            Ready to rewrite your learning path?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-xl mx-auto mb-10">
            Open the visual workspace now to write algorithms, set checkpoints, and watch variables update in real time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={javascriptHref}
              onClick={(e) => {
                e.preventDefault();
                onSelectLanguage('javascript');
              }}
              className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 dark:bg-yellow-500 dark:hover:bg-yellow-400 text-slate-900 font-bold border-2 border-slate-900 rounded-2xl transition-all shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-0.5 active:translate-y-0 text-center w-full sm:w-auto"
            >
              Try Javascript Visualizer
            </a>
            <a
              href={docsHref}
              onClick={(e) => {
                e.preventDefault();
                onOpenDocs();
              }}
              className="px-8 py-4 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-center w-full sm:w-auto"
            >
              Explore Documentation
            </a>
          </div>

          <div className="mt-16 text-slate-400 dark:text-slate-600 text-xs font-mono">
            &copy; {new Date().getFullYear()} AlgoViz. Designed with visual debugging in mind. Open source under the MIT License.
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
