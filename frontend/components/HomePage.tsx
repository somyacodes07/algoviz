import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Code2,
  Cpu,
  ArrowRight,
  Activity,
  ChevronRight,
  Play,
  Star
} from "lucide-react";

interface HomePageProps {
  onSelectLanguage: (lang: string) => void;
}

// Animation Data for fake execution tracking
const EXECUTION_STEPS = [
  { line: 1, n: 6, callStack: [{ id: 0, call: "fibonacci(6)" }] },
  { line: 2, n: 6, callStack: [{ id: 0, call: "fibonacci(6)" }] },
  { line: 4, n: 6, callStack: [{ id: 0, call: "fibonacci(6)" }] },
  { line: 1, n: 5, callStack: [{ id: 1, call: "fibonacci(5)" }, { id: 0, call: "fibonacci(6)" }] },
  { line: 2, n: 5, callStack: [{ id: 1, call: "fibonacci(5)" }, { id: 0, call: "fibonacci(6)" }] },
  { line: 4, n: 5, callStack: [{ id: 1, call: "fibonacci(5)" }, { id: 0, call: "fibonacci(6)" }] },
  { line: 1, n: 4, callStack: [{ id: 2, call: "fibonacci(4)" }, { id: 1, call: "fibonacci(5)" }, { id: 0, call: "fibonacci(6)" }] },
  { line: 2, n: 4, callStack: [{ id: 2, call: "fibonacci(4)" }, { id: 1, call: "fibonacci(5)" }, { id: 0, call: "fibonacci(6)" }] },
];

const HomePage: React.FC<HomePageProps> = ({ onSelectLanguage }) => {
  const [hoverLang, setHoverLang] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  // Auto-play the execution mock
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % EXECUTION_STEPS.length);
    }, 1500); // Step every 1.5s
    return () => clearInterval(interval);
  }, []);

  const currentStep = EXECUTION_STEPS[stepIndex];

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f6] dark:bg-[#0f111a] text-slate-800 dark:text-slate-200 font-sans selection:bg-amber-200 dark:selection:bg-amber-900/50">
      {/* Top Navigation / Header */}
      <header className="w-full flex justify-between items-center p-6 border-b-2 border-slate-900 dark:border-slate-800 bg-white/50 dark:bg-black/20 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-2">
          <Activity
            className="text-amber-600 dark:text-amber-500"
            strokeWidth={3}
          />
          <span className="font-bold text-xl tracking-tight">AlgoViz.</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm font-bold text-slate-500 dark:text-slate-400 mr-12">
          <a
            href="#"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Docs
          </a>
          <a
            href="#"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row items-stretch relative">
        {/* Left Side: Copy & Actions */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 md:border-r-2 border-slate-900 dark:border-slate-800 relative z-10 bg-[#faf9f6] dark:bg-[#0f111a]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block px-3 py-1 mb-6 border-2 border-slate-900 dark:border-white/20 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300">
              Interactive Code Visualizer
            </div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
              className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6 flex flex-wrap gap-x-4 items-center"
            >
              <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>See</motion.span>
              <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>how</motion.span>
              <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>your</motion.span>
              
              <div className="w-full h-0"></div> {/* Break to next line */}

              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.05, rotate: -2 }}
                className="relative inline-block mt-2 mb-2 cursor-pointer group"
              >
                <span className="relative z-10 text-white bg-slate-900 dark:bg-white dark:text-slate-900 px-4 py-1.5 leading-none inline-block transform -skew-x-6 group-hover:bg-slate-800 dark:group-hover:bg-slate-200 transition-colors">
                  code
                </span>
                <span className="absolute inset-0 bg-amber-400 dark:bg-amber-500 transform skew-x-6 translate-x-2 translate-y-2 -z-10 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></span>
              </motion.span>
              
              <div className="w-full h-0"></div> {/* Break to next line */}

              <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>really</motion.span>
              <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}>works.</motion.span>
            </motion.h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-md mb-10 font-medium leading-relaxed">
              Stop guessing. Step through your logic line-by-line, watch
              variables mutate in real-time, and untangle the call stack.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <button
                onClick={() => onSelectLanguage("javascript")}
                onMouseEnter={() => setHoverLang("js")}
                onMouseLeave={() => setHoverLang(null)}
                className="group relative flex items-center justify-between px-6 py-4 bg-yellow-400 hover:bg-yellow-300 dark:bg-yellow-500 dark:hover:bg-yellow-400 text-slate-900 font-bold text-lg border-2 border-slate-900 transition-transform active:translate-y-1 transform hover:-translate-y-1 shadow-[4px_4px_0px_#0f172a] dark:shadow-[4px_4px_0px_#000]"
              >
                <span className="flex items-center gap-3">
                  <Code2 strokeWidth={2.5} />
                  Launch index.js
                </span>
                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform" />
              </button>

              <button
                onClick={() => onSelectLanguage("c++")}
                onMouseEnter={() => setHoverLang("cpp")}
                onMouseLeave={() => setHoverLang(null)}
                className="group relative flex items-center justify-between px-6 py-4 bg-blue-500 hover:bg-blue-400 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-lg border-2 border-slate-900 dark:border-white/10 transition-transform active:translate-y-1 transform hover:-translate-y-1 shadow-[4px_4px_0px_#0f172a] dark:shadow-[4px_4px_0px_#000]"
              >
                <span className="flex items-center gap-3">
                  <Cpu strokeWidth={2.5} />
                  Launch main.cpp
                </span>
                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform" />
              </button>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm font-mono text-slate-500">
              <Terminal size={14} />
              <span>Select a file to begin execution session.</span>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Visualizer abstract graphic */}
        <div className="hidden md:flex flex-1 items-center justify-center p-12 bg-slate-100 dark:bg-[#0a0c10] bg-dot-pattern relative z-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full max-w-lg bg-white dark:bg-[#1e1e1e] border-2 border-slate-900 dark:border-slate-700 shadow-[8px_8px_0px_#0f172a] dark:shadow-[8px_8px_0px_#000] rounded-lg overflow-hidden flex flex-col h-[420px]"
          >
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-[#252526]">
              <div className="w-3 h-3 rounded-full bg-red-400 border border-slate-900/20"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400 border border-slate-900/20"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 border border-slate-900/20"></div>
              <div className="ml-2 font-mono text-xs opacity-60 flex-1 text-center font-semibold text-slate-900 dark:text-slate-100">
                {hoverLang === "js"
                  ? "index.js"
                  : hoverLang === "cpp"
                    ? "main.cpp"
                    : "scratchpad.js"}{" "}
                - Execution View
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 flex bg-white dark:bg-[#1e1e1e]">
              {/* Lines */}
              <div className="w-12 bg-slate-50 dark:bg-[#1e1e1e] border-r-2 border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 font-mono text-[14px] text-slate-400 select-none leading-8 relative">
                <motion.div 
                  className="absolute left-0 w-full bg-amber-200/60 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold flex justify-center items-center h-[32px] z-0"
                  initial={false}
                  animate={{ top: 16 + ((currentStep.line - 1) * 32) }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                  <ChevronRight size={14} strokeWidth={3} className="absolute left-1" />
                </motion.div>
                <div className="relative z-10 w-full text-center">1</div>
                <div className="relative z-10 w-full text-center">2</div>
                <div className="relative z-10 w-full text-center">3</div>
                <div className="relative z-10 w-full text-center">4</div>
                <div className="relative z-10 w-full text-center">5</div>
                <div className="relative z-10 w-full text-center">6</div>
                <div className="relative z-10 w-full text-center">7</div>
              </div>

              {/* Dummy Code */}
              <div className="flex-1 py-4 px-5 font-mono text-[14px] leading-8 overflow-hidden text-slate-700 dark:text-slate-300 relative">
                {/* Highlight Background that moves */}
                <motion.div 
                  className="absolute left-0 right-0 h-[32px] bg-amber-100/50 dark:bg-amber-900/20 border-y border-amber-300/50 dark:border-amber-700/30 z-0"
                  initial={false}
                  animate={{ top: 16 + ((currentStep.line - 1) * 32) }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />

                <motion.div
                  className={`opacity-80 h-[32px] relative z-10 transition-colors ${currentStep.line === 1 ? 'font-bold text-slate-900 dark:text-white' : ''}`}
                  animate={{
                    opacity:
                      hoverLang === "js" ? 1 : hoverLang === "cpp" ? 0.3 : 0.8,
                  }}
                >
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    function
                  </span>{" "}
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    fibonacci
                  </span>
                  (n) {"{"}
                </motion.div>
                <motion.div className={`pl-4 opacity-80 h-[32px] relative z-10 transition-colors ${currentStep.line === 2 ? 'font-bold text-slate-900 dark:text-white' : ''}`}>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    if
                  </span>{" "}
                  (n {"<="} 1){" "}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    return
                  </span>{" "}
                  n;
                </motion.div>
                <motion.div className={`pl-4 h-[32px] relative z-10 transition-colors ${currentStep.line === 4 ? 'font-bold text-slate-900 dark:text-white' : 'opacity-80'}`}>
                  <span>
                    <span className="text-blue-700 dark:text-blue-400">
                      return
                    </span>{" "}
                    <span className="text-amber-700 dark:text-amber-400">
                      fibonacci
                    </span>
                    (n - 1) +{" "}
                    <span className="text-amber-700 dark:text-amber-400">
                      fibonacci
                    </span>
                    (n - 2);
                  </span>
                </motion.div>
                <motion.div className="opacity-60 h-[32px]">{"}"}</motion.div>
                <motion.div
                  className="opacity-60 h-[32px]"
                  animate={{
                    opacity:
                      hoverLang === "js" ? 1 : hoverLang === "cpp" ? 0.3 : 0.8,
                  }}
                >
                  console.
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    log
                  </span>
                  (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    fibonacci
                  </span>
                  (
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    6
                  </span>
                  ));
                </motion.div>
              </div>
            </div>

            {/* Variables Panel Mini */}
            <div className="h-[140px] border-t-2 border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-[#1e1e1e] flex flex-col">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-200 dark:bg-[#2d2d30] border-b border-slate-300 dark:border-slate-700 flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>Variables / Watch</span>
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Play size={10} fill="currentColor" /> PAUSED on line {currentStep.line}
                </span>
              </div>
              <div className="flex-1 p-3 font-mono text-xs overflow-hidden flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    n
                  </span>
                  <motion.span 
                    key={currentStep.n}
                    initial={{ backgroundColor: "rgb(254, 240, 138)", color: "rgb(161, 98, 7)" }}
                    animate={{ backgroundColor: "rgba(220, 252, 231, 0)", color: "rgb(22, 163, 74)" }}
                    className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 rounded"
                  >
                    {currentStep.n}
                  </motion.span>
                </div>
                <div className="flex-1 flex flex-col p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800/50 transition-colors overflow-hidden relative">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mb-1 border-b border-amber-200/50 dark:border-amber-800/50 pb-0.5 z-10 bg-inherit">
                    Call Stack
                  </span>
                  <div className="flex-1 overflow-hidden relative">
                      <AnimatePresence initial={false}>
                        {currentStep.callStack.map((frame, idx) => (
                            <motion.div 
                              key={frame.id}
                              initial={{ opacity: 0, x: -10, height: 0 }}
                              animate={{ opacity: 1, x: 0, height: 'auto' }}
                              exit={{ opacity: 0, x: 10, height: 0 }}
                              className={`flex gap-2 ${idx === 0 ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                              <span className="opacity-50 w-3 text-right">{currentStep.callStack.length - 1 - idx}</span>
                              <span>{frame.call}</span>
                            </motion.div>
                        ))}
                      </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
