import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CodeEditor from "./frontend/components/CodeEditor";
import VariablesPanel from "./frontend/components/VariablesPanel";
import CallStackPanel from "./frontend/components/CallStackPanel";
import ConsolePanel from "./frontend/components/ConsolePanel";
import Controls from "./frontend/components/Controls";
import HomePage from "./frontend/components/HomePage";
import { useExecutionEngine } from "./frontend/hooks/useExecutionEngine";
import {
  JS_TEMPLATES,
  CPP_TEMPLATES,
  CodeTemplate,
} from "./frontend/codeTemplates";
import {
  Play,
  RotateCcw,
  Box,
  Layers,
  Terminal as TerminalIcon,
  Info,
  Sparkles,
  Moon,
  Sun,
  ArrowLeft,
  Code,
  Link2,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Maximize2,
  Minimize2,
} from "lucide-react";

import logoLight from "./assets/logo-light.png";
import logoDark from "./assets/logo-dark.png";

const JS_DEFAULT_CODE = `// Welcome to AlgoViz!
// Edit this code and click the Play button below.

let sum = 0;
const limit = 5;

function addToSum(val) {
  let multiplier = 2;
  return val * multiplier;
}

for (let i = 1; i <= limit; i++) {
  console.log("Processing item", i);
  if (i % 2 === 0) {
    sum += addToSum(i);
  } else {
    sum += i;
  }
}

console.log("Final Sum:", sum);
`;

const CPP_DEFAULT_CODE = `// C++ Visualizer (Beta)
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;


int findMax(vector<int> arr) {
    int maxVal = arr[0];
    for (int i = 1; i < arr.size(); i++) {
        if (arr[i] > maxVal) {
            maxVal = arr[i];
        }
    }
    return maxVal;
}

int main() {
    vector<int> numbers = {64, 25, 12, 22, 11};
    cout << "Original: " << endl;
    
    for (int i = 0; i < numbers.size(); i++) {
        cout << numbers[i] << " " << endl;
    }
    
    // Sort the array
    sort(numbers.begin(), numbers.end());
    
    cout << "Sorted!" << endl;
    
    int biggest = findMax(numbers);
    
    int sum = 0;
    for (int x : numbers) {
        sum = sum + x;
    }
    
    cout << "Max: " << biggest << endl;
    cout << "Sum: " << sum << endl;
    
    return 0;
}
`;

// --- Shareable Link Helpers ---
function encodeShareLink(code: string, lang: string): string {
  const payload = JSON.stringify({ code, lang });
  const encoded = btoa(unescape(encodeURIComponent(payload)));
  return `${window.location.origin}${window.location.pathname}#share=${encoded}`;
}

function decodeShareLink(): { code: string; lang: string } | null {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith("#share=")) return null;
    const encoded = hash.slice(7);
    const payload = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

const App: React.FC = () => {
  // Check for shared link on load
  const shared = decodeShareLink();

  const [page, setPage] = useState<"home" | "editor">(
    shared ? "editor" : "home",
  );
  const [language, setLanguage] = useState(shared?.lang || "javascript");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  });

  const [code, setCode] = useState<string>(shared?.code || JS_DEFAULT_CODE);
  const [activeTab, setActiveTab] = useState<"variables" | "stack">(
    "variables",
  );
  const [linkCopied, setLinkCopied] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState(false);
  const [consoleExpanded, setConsoleExpanded] = useState(false);

  const { state, controls } = useExecutionEngine();
  const {
    timeline,
    currentStepIndex,
    isPlaying,
    speed,
    executionError,
    breakpoints,
  } = state;
  const {
    handleRun,
    setIsPlaying,
    setSpeed,
    togglePlayPause,
    reset,
    nextStep,
    prevStep,
    toggleBreakpoint,
  } = controls;

  // Derived Theme Color
  const themeColor = language === "c++" ? "blue" : "saffron";
  const isSaffron = themeColor === "saffron";
  const templates = language === "c++" ? CPP_TEMPLATES : JS_TEMPLATES;

  // Apply Theme class to Body for Tailwind Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Listen to System Theme Changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };
    // Use modern addEventListener if available, fallback for older Safari
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if ("addListener" in mediaQuery) {
      // @ts-ignore
      mediaQuery.addListener(handleChange);
      // @ts-ignore
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  useEffect(() => {
    // Only run if in editor mode and timeline is empty (initial load)
    if (page === "editor" && timeline.length === 0) {
      handleRun(code, language);
    }
  }, [page, handleRun, code, language, timeline.length]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts if user is typing in an input, textarea, or Monaco editor
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest(".monaco-editor")
      ) {
        return;
      }

      if (page !== "editor") return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextStep();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevStep();
          break;
        case "KeyR":
          if (e.metaKey || e.ctrlKey) return; // Don't block browser refresh
          e.preventDefault();
          reset(code, language);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, togglePlayPause, nextStep, prevStep, reset, code, language]);

  // Close template menu on outside click
  useEffect(() => {
    if (!templateMenuOpen) return;
    const handleClick = () => setTemplateMenuOpen(false);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [templateMenuOpen]);

  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode !== undefined) {
      setCode(newCode);
      setIsPlaying(false);
    }
  };

  const handleLanguageSelect = (lang: string) => {
    setLanguage(lang);
    if (lang === "c++") {
      setCode(CPP_DEFAULT_CODE);
    } else {
      setCode(JS_DEFAULT_CODE);
    }
    setPage("editor");
  };

  const handleTemplateSelect = (template: CodeTemplate) => {
    setCode(template.code);
    setIsPlaying(false);
    setTemplateMenuOpen(false);
    // Auto-run after loading template
    setTimeout(() => handleRun(template.code, language), 100);
  };

  const handleCopyLink = useCallback(() => {
    const url = encodeShareLink(code, language);
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, [code, language]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const currentStep = timeline[currentStepIndex] || {
    line: 0,
    variables: {},
    callStack: [],
    consoleOutput: [],
  };

  const prevStepVariables = timeline[currentStepIndex - 1] || { variables: {} };
  const progress =
    timeline.length > 1 ? (currentStepIndex / (timeline.length - 1)) * 100 : 0;

  const langLabel =
    language === "javascript" ? "JavaScript (ES6)" : "C++ (Beta)";

  // Theme Helper Classes
  const headerClass =
    themeColor === "saffron" ? "bg-saffron-500" : "bg-blue-600";
  const tagClass = themeColor === "saffron" ? "bg-white/20" : "bg-white/20";
  const iconTextClass =
    themeColor === "saffron" ? "text-saffron-500" : "text-blue-500";
  const runBtnClass =
    themeColor === "saffron"
      ? "bg-saffron-500 hover:bg-saffron-600 shadow-saffron-500/20"
      : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20";
  const tabActiveText =
    themeColor === "saffron"
      ? "text-saffron-600 dark:text-saffron-400"
      : "text-blue-600 dark:text-blue-400";
  const tabActiveBorder =
    themeColor === "saffron" ? "border-saffron-500" : "border-blue-500";
  const tabActiveBg =
    themeColor === "saffron" ? "bg-saffron-50/50" : "bg-blue-50/50";

  return (
    <div
      className={`flex flex-col h-screen w-screen text-slate-800 dark:text-slate-200 overflow-hidden transition-colors duration-500 ${theme === "dark" ? "bg-mesh-dark" : "bg-mesh-light"}`}
    >
      <AnimatePresence mode="wait">
        {page === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
            transition={{ duration: 0.4 }}
            className="relative h-full w-full"
          >
            {/* We moved the theme toggle INTO the HomePage header or we can just adjust its absolute position here to not overlap */}
            <div className="absolute top-6 right-6 z-50">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-md border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
            <HomePage onSelectLanguage={handleLanguageSelect} />
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col h-full w-full"
          >
            {/* Header */}
            <header
              className={`h-16 flex items-center px-4 md:px-6 justify-between ${theme === "dark" ? "bg-slate-900/80" : headerClass + "/90"} backdrop-blur-xl border-b border-transparent dark:border-slate-800 shadow-md z-30 text-white transition-all duration-300 relative`}
            >
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 dark:via-saffron-500/20 to-transparent"></div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setPage("home");
                    window.location.hash = "";
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="bg-white/20 dark:bg-slate-800 p-1.5 rounded-lg backdrop-blur-sm">
                  <img
                    src={theme === "dark" ? logoDark : logoLight}
                    alt="AlgoViz Logo"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h1 className="font-bold text-xl tracking-tight leading-none text-white">
                    AlgoViz
                  </h1>
                  <span className="text-saffron-100 dark:text-slate-500 text-xs font-medium opacity-90">
                    Editor Mode
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={`flex gap-4 text-xs font-semibold px-3 py-1.5 rounded-full border border-transparent dark:border-slate-700 ${tagClass} dark:bg-slate-800 text-white dark:text-slate-400`}
                >
                  <span>{langLabel}</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full ${tagClass} dark:bg-slate-800 text-white dark:text-slate-400 hover:bg-white/20 dark:hover:bg-slate-700 transition-colors`}
                >
                  {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden p-2 md:p-4 gap-4">
              {/* Left Panel: Editor */}
              <div
                className={`flex flex-col min-h-[50vh] md:min-h-0 w-full md:min-w-[300px] glass-panel rounded-2xl p-4 md:p-5 transition-all duration-[400ms] ease-in-out ${visualizerMode ? "md:w-[40%]" : "md:flex-1"}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-bold uppercase tracking-wider">
                    <Code size={18} className={iconTextClass} />
                    <span>Source Code</span>

                    {/* Template Selector */}
                    <div className="relative ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateMenuOpen(!templateMenuOpen);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700 transition-all normal-case tracking-normal"
                        title="Load a template"
                      >
                        <BookOpen size={12} />
                        Templates
                        <ChevronDown
                          size={12}
                          className={`transition-transform ${templateMenuOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      <AnimatePresence>
                        {templateMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {templates.map((tpl, i) => (
                              <button
                                key={i}
                                onClick={() => handleTemplateSelect(tpl)}
                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                              >
                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                  {tpl.name}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {tpl.description}
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {executionError && (
                      <span className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-200 dark:border-red-900/30 font-medium">
                        {executionError}
                      </span>
                    )}

                    {/* Copy Share Link */}
                    <button
                      onClick={handleCopyLink}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all active:scale-95 ${
                        linkCopied
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                      title="Copy shareable link"
                    >
                      {linkCopied ? <Check size={14} /> : <Link2 size={14} />}
                      {linkCopied ? "Copied!" : "Share"}
                    </button>

                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        handleRun(code, language);
                      }}
                      className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 ${runBtnClass}`}
                    >
                      <Play size={16} fill="currentColor" />
                      Run
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative rounded-xl overflow-hidden shadow-inner border border-gray-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
                  <CodeEditor
                    code={code}
                    language={language}
                    theme={theme}
                    readOnly={isPlaying}
                    onChange={handleCodeChange}
                    currentLine={currentStep.line}
                    isError={!!executionError}
                    themeColor={themeColor}
                    breakpoints={breakpoints}
                    onToggleBreakpoint={toggleBreakpoint}
                  />
                </div>
              </div>

              {/* Right Panel: Visualization */}
              <div
                className={`min-h-[50vh] md:min-h-0 flex flex-col shrink-0 glass-panel rounded-2xl z-10 transition-all duration-[400ms] ease-in-out overflow-hidden ${visualizerMode ? "w-full md:flex-1" : "w-full md:w-[480px]"}`}
              >
                {/* Visualizer Mode Toggle */}
                <div className="flex items-center justify-end px-3 py-1.5 bg-white/10 dark:bg-slate-900/20">
                  <button
                    onClick={() => setVisualizerMode(!visualizerMode)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border ${
                      visualizerMode
                        ? isSaffron
                          ? "bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-400 border-saffron-300 dark:border-saffron-700"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                    title={
                      visualizerMode
                        ? "Exit focus mode"
                        : "Enter focus mode (60/40 split)"
                    }
                  >
                    {visualizerMode ? (
                      <Minimize2 size={11} />
                    ) : (
                      <Maximize2 size={11} />
                    )}
                    {visualizerMode ? "Focus" : "Expand"}
                  </button>
                </div>
                {/* Top half: Variables / Call Stack */}
                <div
                  className={`flex flex-col min-h-0 transition-all duration-[400ms] ease-in-out ${consoleExpanded ? "flex-[3]" : "flex-[4]"}`}
                >
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200/50 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/30 backdrop-blur-md">
                    <button
                      onClick={() => setActiveTab("variables")}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "variables" ? `${tabActiveText} border-b-2 ${tabActiveBorder} ${tabActiveBg} dark:bg-slate-800` : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                    >
                      <Layers size={16} /> Variables
                    </button>
                    <button
                      onClick={() => setActiveTab("stack")}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "stack" ? `${tabActiveText} border-b-2 ${tabActiveBorder} ${tabActiveBg} dark:bg-slate-800` : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                    >
                      <Layers size={16} className="rotate-180" /> Call Stack
                    </button>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/40 dark:bg-slate-900/40 p-2 transition-colors relative">
                    {/* Inner subtle glow for depth */}
                    <div className="absolute inset-0 pointer-events-none rounded-b-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"></div>
                    {activeTab === "variables" ? (
                      <VariablesPanel
                        variables={currentStep.variables || {}}
                        prevVariables={prevStepVariables.variables || {}}
                        themeColor={themeColor}
                      />
                    ) : (
                      <CallStackPanel
                        stack={currentStep.callStack || []}
                        themeColor={themeColor}
                      />
                    )}
                  </div>
                </div>

                {/* Bottom half: Console */}
                <div
                  className={`flex flex-col border-t border-gray-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/80 backdrop-blur-md shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] transition-all duration-[400ms] ease-in-out ${
                    consoleExpanded ? "flex-[3] min-h-[150px]" : "h-10"
                  }`}
                >
                  <button
                    className="h-10 flex flex-shrink-0 items-center justify-between px-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer w-full"
                    onClick={() => setConsoleExpanded(!consoleExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <TerminalIcon size={16} className={iconTextClass} />
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Console Output
                      </span>
                      {!consoleExpanded &&
                        currentStep.consoleOutput &&
                        currentStep.consoleOutput.length > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                            {currentStep.consoleOutput.length}
                          </span>
                        )}
                    </div>
                    <div className="text-slate-400">
                      {consoleExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronUp size={16} />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {consoleExpanded && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 overflow-y-auto custom-scrollbar"
                      >
                        <ConsolePanel logs={currentStep.consoleOutput || []} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </main>

            <Controls
              isPlaying={isPlaying}
              onPlayPause={togglePlayPause}
              onNext={nextStep}
              onPrev={prevStep}
              onReset={() => reset(code, language)}
              canNext={currentStepIndex < timeline.length - 1}
              canPrev={currentStepIndex > 0}
              speed={speed}
              setSpeed={setSpeed}
              progress={progress}
              onSeek={(p) => {
                const targetIndex = Math.floor(
                  (p / 100) * (timeline.length - 1),
                );
                controls.jumpToStep(targetIndex);
              }}
              themeColor={themeColor}
              currentStep={currentStepIndex}
              totalSteps={timeline.length}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
