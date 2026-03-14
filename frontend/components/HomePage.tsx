import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  Code2,
  Cpu,
  ArrowRight,
  Activity,
  ChevronRight,
  Play,
} from "lucide-react";

interface HomePageProps {
  onSelectLanguage: (lang: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectLanguage }) => {
  const [hoverLang, setHoverLang] = useState<string | null>(null);

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
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              See how your <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 text-white bg-slate-900 dark:bg-white dark:text-slate-900 px-3 py-1 leading-none inline-block transform -skew-x-6">
                  code
                </span>
                <span className="absolute inset-0 bg-amber-400 dark:bg-amber-500 transform skew-x-6 translate-x-2 translate-y-2 -z-10"></span>
              </span>
              <br />
              really works.
            </h1>

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
              <div className="w-12 bg-slate-50 dark:bg-[#1e1e1e] border-r-2 border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 font-mono text-[14px] text-slate-400 select-none leading-8">
                <div>1</div>
                <div>2</div>
                <div className="bg-amber-200/60 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 w-full text-center relative font-bold flex justify-center items-center h-[32px]">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                  <ChevronRight
                    size={14}
                    strokeWidth={3}
                    className="absolute left-1"
                  />
                  3
                </div>
                <div>4</div>
                <div>5</div>
                <div>6</div>
                <div>7</div>
              </div>

              {/* Dummy Code */}
              <div className="flex-1 py-4 px-5 font-mono text-[14px] leading-8 overflow-hidden text-slate-700 dark:text-slate-300">
                <motion.div
                  className="opacity-60 h-[32px]"
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
                <motion.div className="pl-4 opacity-60 h-[32px]">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    if
                  </span>{" "}
                  (n {"<="} 1){" "}
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    return
                  </span>{" "}
                  n;
                </motion.div>
                <motion.div className="pl-4 py-0 bg-amber-100 dark:bg-amber-900/30 -mx-5 px-9 border-y border-amber-300 dark:border-amber-700/50 relative font-bold text-slate-900 dark:text-white h-[32px] flex items-center">
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
            <div className="h-[120px] border-t-2 border-slate-900 dark:border-slate-700 bg-slate-50 dark:bg-[#1e1e1e] flex flex-col">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-200 dark:bg-[#2d2d30] border-b border-slate-300 dark:border-slate-700 flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>Variables / Watch</span>
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Play size={10} fill="currentColor" /> PAUSED on line 3
                </span>
              </div>
              <div className="flex-1 p-3 font-mono text-xs overflow-hidden">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    n
                  </span>
                  <span className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 rounded">
                    6
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800/50 transition-colors">
                  <span className="text-blue-600 dark:text-blue-400 font-bold mb-0.5 border-b border-amber-200/50 dark:border-amber-800/50 pb-0.5">
                    Call Stack
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 select-none">
                    <div className="flex gap-2">
                      <span>1</span>
                      <span>fibonacci(5)</span>
                    </div>
                    <div className="flex gap-2 font-bold text-slate-900 dark:text-white">
                      <span>0</span>
                      <span>fibonacci(6)</span>
                    </div>
                  </span>
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
