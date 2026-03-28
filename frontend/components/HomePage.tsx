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
  Star,
  Eye,
  Layers,
  BookOpen,
} from "lucide-react";
import homepagePreview from "../../assets/homepage.png";
import editorPreview from "../../assets/editor.png";
import { HOME_FAQ_ITEMS } from "../seo";
import LandingInteractiveBackdrop from "./LandingInteractiveBackdrop.tsx";

interface HomePageProps {
  onSelectLanguage: (lang: string) => void;
  onOpenDocs: () => void;
  docsHref: string;
  javascriptHref: string;
  cppHref: string;
}

// Animation Data for fake execution tracking
const EXECUTION_STEPS = [
  { line: 1, n: 6, callStack: [{ id: 0, call: "fibonacci(6)" }] },
  { line: 2, n: 6, callStack: [{ id: 0, call: "fibonacci(6)" }] },
  { line: 4, n: 6, callStack: [{ id: 0, call: "fibonacci(6)" }] },
  {
    line: 1,
    n: 5,
    callStack: [
      { id: 1, call: "fibonacci(5)" },
      { id: 0, call: "fibonacci(6)" },
    ],
  },
  {
    line: 2,
    n: 5,
    callStack: [
      { id: 1, call: "fibonacci(5)" },
      { id: 0, call: "fibonacci(6)" },
    ],
  },
  {
    line: 4,
    n: 5,
    callStack: [
      { id: 1, call: "fibonacci(5)" },
      { id: 0, call: "fibonacci(6)" },
    ],
  },
  {
    line: 1,
    n: 4,
    callStack: [
      { id: 2, call: "fibonacci(4)" },
      { id: 1, call: "fibonacci(5)" },
      { id: 0, call: "fibonacci(6)" },
    ],
  },
  {
    line: 2,
    n: 4,
    callStack: [
      { id: 2, call: "fibonacci(4)" },
      { id: 1, call: "fibonacci(5)" },
      { id: 0, call: "fibonacci(6)" },
    ],
  },
];

const HERO_SIGNAL_CARDS = [
  {
    label: "Live Variables",
    value: "See values mutate instead of guessing what changed.",
  },
  {
    label: "Call Stack",
    value: "Follow recursion depth and frame order in real time.",
  },
  {
    label: "Browser C++",
    value: "Trace DSA-style C++ through the same visual timeline.",
  },
];

const HomePage: React.FC<HomePageProps> = ({
  onSelectLanguage,
  onOpenDocs,
  docsHref,
  javascriptHref,
  cppHref,
}) => {
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
    <div className="flex flex-col min-h-screen bg-[#f7f0e3] dark:bg-[#08121f] text-slate-800 dark:text-slate-200 font-sans selection:bg-amber-200 dark:selection:bg-amber-900/50">
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <LandingInteractiveBackdrop />

        {/* Top Navigation / Header */}
        <header className="relative z-10 flex w-full shrink-0 items-center justify-between border-b-2 border-slate-900/90 bg-white/35 p-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <Activity
              className="text-amber-600 dark:text-amber-500"
              strokeWidth={3}
            />
            <span className="font-bold text-xl tracking-tight">AlgoViz.</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-300 mr-12">
            <a
              href={docsHref}
              onClick={(e) => {
                e.preventDefault();
                onOpenDocs();
              }}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/ssgamingop/AlgoViz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-white/70 dark:bg-slate-900/55 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-white/50 dark:border-slate-700 rounded-full transition-colors group cursor-pointer backdrop-blur-sm"
            >
              <Star
                size={14}
                className="group-hover:text-amber-500 transition-colors"
              />
              <span>Star us on GitHub</span>
            </a>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 flex-col items-stretch md:flex-row">
          {/* Left Side: Copy & Actions */}
          <div className="relative flex flex-1 flex-col justify-between gap-12 border-slate-900/80 bg-white/35 p-8 backdrop-blur-sm md:border-r-2 md:p-16 lg:p-24 dark:border-slate-800 dark:bg-[#091323]/40">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <div className="inline-block px-3 py-1 mb-6 border-2 border-slate-900 dark:border-white/20 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300">
                Interactive Code Visualizer
              </div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
                className="mb-6 flex flex-wrap items-center gap-x-4 text-5xl font-black tracking-tight leading-[1.1] md:text-7xl"
              >
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  See
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  how
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  your
                </motion.span>
                <div className="h-0 w-full" />
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.4,
                    type: "spring",
                    stiffness: 200,
                  }}
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  className="group relative mb-2 mt-2 inline-block cursor-pointer"
                >
                  <span className="relative z-10 inline-block transform -skew-x-6 bg-slate-900 px-4 py-1.5 leading-none text-white transition-colors group-hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:group-hover:bg-slate-200">
                    code
                  </span>
                  <span className="absolute inset-0 -z-10 translate-x-2 translate-y-2 transform skew-x-6 bg-amber-400 transition-transform group-hover:translate-x-3 group-hover:translate-y-3 dark:bg-amber-500"></span>
                </motion.span>
                <div className="h-0 w-full" />
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  really
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  works.
                </motion.span>
              </motion.h1>

              <p className="mb-10 max-w-md text-lg font-medium leading-relaxed text-slate-600 md:text-xl dark:text-slate-400">
                Stop guessing. Step through your logic line-by-line, watch
                variables mutate in real-time, and untangle the call stack.
              </p>

              <div className="mb-4 flex flex-col gap-4 sm:flex-row">
                <a
                  href={javascriptHref}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectLanguage("javascript");
                  }}
                  onMouseEnter={() => setHoverLang("js")}
                  onMouseLeave={() => setHoverLang(null)}
                  className="group relative flex items-center justify-between border-2 border-slate-900 bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-900 shadow-[4px_4px_0px_#0f172a] transition-transform hover:-translate-y-1 hover:bg-yellow-300 active:translate-y-1 dark:bg-yellow-500 dark:shadow-[4px_4px_0px_#000] dark:hover:bg-yellow-400"
                >
                  <span className="flex items-center gap-3">
                    <Code2 strokeWidth={2.5} />
                    Launch index.js
                  </span>
                  <ArrowRight className="-translate-x-4 transform opacity-0 transition-opacity group-hover:translate-x-0 group-hover:opacity-100" />
                </a>

                <a
                  href={cppHref}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectLanguage("c++");
                  }}
                  onMouseEnter={() => setHoverLang("cpp")}
                  onMouseLeave={() => setHoverLang(null)}
                  className="group relative flex items-center justify-between border-2 border-slate-900 bg-blue-500 px-6 py-4 text-lg font-bold text-white shadow-[4px_4px_0px_#0f172a] transition-transform hover:-translate-y-1 hover:bg-blue-400 active:translate-y-1 dark:border-white/10 dark:bg-blue-600 dark:shadow-[4px_4px_0px_#000] dark:hover:bg-blue-500"
                >
                  <span className="flex items-center gap-3">
                    <Cpu strokeWidth={2.5} />
                    Launch main.cpp
                  </span>
                  <ArrowRight className="-translate-x-4 transform opacity-0 transition-opacity group-hover:translate-x-0 group-hover:opacity-100" />
                </a>
              </div>

              <div className="mb-4 mt-8 flex items-center gap-4">
                <a
                  href={docsHref}
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenDocs();
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900 active:translate-y-[1px] dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <BookOpen size={14} /> Read Documentation
                </a>
              </div>

              <div className="mt-4 flex items-center gap-2 font-mono text-sm text-slate-500">
                <Terminal size={14} />
                <span>Select a file to begin execution session.</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {HERO_SIGNAL_CARDS.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-900/15 bg-white/60 px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/35 dark:shadow-[0_16px_40px_rgba(2,6,23,0.45)]"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
                    {card.value}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Side: Visualizer abstract graphic */}
          <div className="relative z-0 hidden flex-1 items-center justify-center bg-slate-100/35 p-8 backdrop-blur-[2px] md:flex md:p-12 lg:p-16 dark:bg-[#08111d]/30">
            <div className="absolute inset-0 bg-dot-pattern opacity-60 dark:opacity-40" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex h-[420px] w-full max-w-[40rem] flex-col overflow-hidden rounded-lg border-2 border-slate-900 bg-white shadow-[8px_8px_0px_#0f172a] dark:border-slate-700 dark:bg-[#1e1e1e] dark:shadow-[8px_8px_0px_#000] lg:h-[460px]"
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
                  animate={{ top: 16 + (currentStep.line - 1) * 32 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                  <ChevronRight
                    size={14}
                    strokeWidth={3}
                    className="absolute left-1"
                  />
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
                  animate={{ top: 16 + (currentStep.line - 1) * 32 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />

                <motion.div
                  className={`opacity-80 h-[32px] relative z-10 transition-colors ${currentStep.line === 1 ? "font-bold text-slate-900 dark:text-white" : ""}`}
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
                <motion.div
                  className={`pl-4 opacity-80 h-[32px] relative z-10 transition-colors ${currentStep.line === 2 ? "font-bold text-slate-900 dark:text-white" : ""}`}
                >
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    if
                  </span>{" "}
                  (n {"<="} 1){" "}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    return
                  </span>{" "}
                  n;
                </motion.div>
                <motion.div
                  className={`pl-4 h-[32px] relative z-10 transition-colors ${currentStep.line === 4 ? "font-bold text-slate-900 dark:text-white" : "opacity-80"}`}
                >
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
                  <Play size={10} fill="currentColor" /> PAUSED on line{" "}
                  {currentStep.line}
                </span>
              </div>
              <div className="flex-1 p-3 font-mono text-xs overflow-hidden flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    n
                  </span>
                  <motion.span
                    key={currentStep.n}
                    initial={{
                      backgroundColor: "rgb(254, 240, 138)",
                      color: "rgb(161, 98, 7)",
                    }}
                    animate={{
                      backgroundColor: "rgba(220, 252, 231, 0)",
                      color: "rgb(22, 163, 74)",
                    }}
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
                          animate={{ opacity: 1, x: 0, height: "auto" }}
                          exit={{ opacity: 0, x: 10, height: 0 }}
                          className={`flex gap-2 ${idx === 0 ? "font-bold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                        >
                          <span className="opacity-50 w-3 text-right">
                            {currentStep.callStack.length - 1 - idx}
                          </span>
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
      </section>

      {/* Features Section */}
      <section className="border-t-2 border-slate-900 dark:border-slate-800 bg-[#faf9f6]/80 dark:bg-[#0f111a]/80 backdrop-blur-md relative z-10 py-24 px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Why use AlgoViz?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-2xl mx-auto">
              Built for students and educators to strip away the magic and show
              exactly how algorithms compute data in memory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-[#1e1e1e] border-2 border-slate-900 dark:border-slate-700 p-8 shadow-[6px_6px_0px_#0f172a] dark:shadow-[6px_6px_0px_#000] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_#000] transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 border-2 border-blue-200 dark:border-blue-800/50">
                <Terminal strokeWidth={2.5} size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Language Support</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Whether you're learning web paradigms in JavaScript or digging
                into memory management in C++, AlgoViz speaks your language.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-[#1e1e1e] border-2 border-slate-900 dark:border-slate-700 p-8 shadow-[6px_6px_0px_#0f172a] dark:shadow-[6px_6px_0px_#000] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_#000] transition-all"
            >
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 border-2 border-amber-200 dark:border-amber-800/50">
                <Eye strokeWidth={2.5} size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Step-by-Step Debugging</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Control the flow of time. Pause execution, step forwards, trace
                backwards, and watch variables mutate exactly when lines
                evaluate.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-[#1e1e1e] border-2 border-slate-900 dark:border-slate-700 p-8 shadow-[6px_6px_0px_#0f172a] dark:shadow-[6px_6px_0px_#000] hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_#000] transition-all"
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-6 border-2 border-green-200 dark:border-green-800/50">
                <Layers strokeWidth={2.5} size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Visual Call Stack</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Demystify recursion and nested function calls. See the stack
                grow and shrink in real-time as frames are pushed and popped.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-t-2 border-slate-900 dark:border-slate-800 bg-white dark:bg-[#11131a] relative z-10 py-24 px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-14">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              See the algorithm visualizer interface before you start
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium">
              AlgoViz combines a code editor, variable inspector, console
              playback, and call stack timeline into one place so students can
              understand how JavaScript and C++ algorithms actually execute.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <article className="bg-[#faf9f6] dark:bg-[#0f111a] border-2 border-slate-900 dark:border-slate-700 p-5 shadow-[6px_6px_0px_#0f172a] dark:shadow-[6px_6px_0px_#000]">
              <img
                src={homepagePreview}
                alt="AlgoViz homepage showing the algorithm visualizer landing page and launch options for JavaScript and C++."
                className="w-full border-2 border-slate-900 dark:border-slate-700"
                loading="lazy"
              />
              <h3 className="text-xl font-bold mt-5 mb-2">
                Launch into JavaScript or C++ visual debugging
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                The homepage is built to get students into the right visualizer
                fast, whether they want to trace JavaScript logic or inspect C++
                algorithm flow.
              </p>
            </article>

            <article className="bg-[#faf9f6] dark:bg-[#0f111a] border-2 border-slate-900 dark:border-slate-700 p-5 shadow-[6px_6px_0px_#0f172a] dark:shadow-[6px_6px_0px_#000]">
              <img
                src={editorPreview}
                alt="AlgoViz code visualizer workbench with a Monaco editor, execution controls, variable watch panel, and call stack."
                className="w-full border-2 border-slate-900 dark:border-slate-700"
                loading="lazy"
              />
              <h3 className="text-xl font-bold mt-5 mb-2">
                Follow variables, stack frames, and console output
              </h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                The workbench focuses on the exact runtime state students care
                about during recursion, sorting, graph traversal, and debugging.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t-2 border-slate-900 dark:border-slate-800 bg-[#faf9f6] dark:bg-[#0f111a] relative z-10 py-24 px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Frequently asked questions about AlgoViz
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium">
              If you are comparing code visualization tools for teaching data
              structures, recursion, or debugging practice, these are the
              questions people usually ask first.
            </p>
          </div>

          <div className="space-y-4">
            {HOME_FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group bg-white dark:bg-[#161618] border-2 border-slate-900 dark:border-slate-700 p-6 shadow-[5px_5px_0px_#0f172a] dark:shadow-[5px_5px_0px_#000]"
              >
                <summary className="cursor-pointer list-none text-lg font-bold pr-8 relative">
                  {item.question}
                  <span className="absolute right-0 top-0 text-slate-400 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <a
              href={javascriptHref}
              onClick={(e) => {
                e.preventDefault();
                onSelectLanguage("javascript");
              }}
              className="inline-flex items-center justify-center px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold border-2 border-slate-900 transition-colors"
            >
              Try the JavaScript visualizer
            </a>
            <a
              href={docsHref}
              onClick={(e) => {
                e.preventDefault();
                onOpenDocs();
              }}
              className="inline-flex items-center justify-center px-5 py-3 bg-white dark:bg-[#161618] text-slate-900 dark:text-slate-100 font-bold border-2 border-slate-900 dark:border-slate-700 transition-colors"
            >
              Explore the documentation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
