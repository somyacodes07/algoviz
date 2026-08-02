import React, { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Analytics } from "@vercel/analytics/react";
import Controls from "./frontend/components/Controls";
import HomePage from "./frontend/components/HomePage";
import TemplatePalette from "./frontend/components/TemplatePalette";
import ErrorPopup from "./frontend/components/ErrorPopup";
import DocsPage from "./frontend/components/DocsPage";
import WorkspaceHeader from "./frontend/components/layout/WorkspaceHeader";
import WorkspaceEditor from "./frontend/components/layout/WorkspaceEditor";
import WorkspaceVisualizer from "./frontend/components/layout/WorkspaceVisualizer";
import SnapshotsDrawer from "./frontend/components/SnapshotsDrawer";
import { useExecutionEngine } from "./frontend/hooks/useExecutionEngine";
import { useSeoMetadata } from "./frontend/hooks/useSeoMetadata";
import { useSnapshots } from "./frontend/hooks/useSnapshots";
import { useAnnotations } from "./frontend/hooks/useAnnotations";
import { JS_TEMPLATES, CPP_TEMPLATES, CodeTemplate } from "./frontend/codeTemplates";
import { getSeoConfig } from "./frontend/seo";
import { prewarmWasmEngines } from "./backend/sandbox/transpiler/parser";
import { AppPage, AppLanguage, getPathForState, getStateFromPath, ROUTES } from "./frontend/routes";
import { SettingsModal, AppSettings } from "./frontend/components/SettingsModal";

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

function getDefaultCode(language: AppLanguage): string {
  return language === "c++" ? CPP_DEFAULT_CODE : JS_DEFAULT_CODE;
}

function normalizeLanguage(lang?: string): AppLanguage {
  return lang === "c++" || lang === "cpp" ? "c++" : "javascript";
}

function getInitialAppState(): {
  page: AppPage;
  language: AppLanguage;
  code: string;
} {
  const shared = decodeShareLink();
  const routedState = getStateFromPath(window.location.pathname);
  const language = shared
    ? normalizeLanguage(shared.lang)
    : routedState.language;

  return {
    page: shared ? "editor" : routedState.page,
    language,
    code: shared?.code || getDefaultCode(language),
  };
}

const App: React.FC = () => {
  const [initialAppState] = useState(getInitialAppState);
  const [page, setPage] = useState<AppPage>(initialAppState.page);
  const [language, setLanguage] = useState<AppLanguage>(initialAppState.language);
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

  const [code, setCode] = useState<string>(initialAppState.code);
  const [activeTab, setActiveTab] = useState<"variables" | "stack" | "performance" | "diagrams">("diagrams");
  const [linkCopied, setLinkCopied] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState(false);
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);

  // Embed mode: ?embed=true hides the header for iframe usage
  const embedMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === 'true';

  // Draggable Split Ratio State
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('algoviz-split-ratio');
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val >= 20 && val <= 80) return val;
      }
    } catch (e) {}
    return 50;
  });

  const [isResizing, setIsResizing] = useState(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!mainContainerRef.current) return;
      const rect = mainContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const percentage = (relativeX / rect.width) * 100;
      const clamped = Math.max(25, Math.min(75, percentage));
      setSplitRatio(clamped);
      try {
        localStorage.setItem('algoviz-split-ratio', String(clamped));
      } catch (err) {}
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Settings Panel States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaultSettings: AppSettings = {
      themeColor: 'auto',
      cppCompiler: 'api',
      arrayViewType: 'cells',
    };
    try {
      const stored = localStorage.getItem('algoviz-settings');
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
    }
    return defaultSettings;
  });

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('algoviz-settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
    }
  }, [settings]);

  const { state, controls } = useExecutionEngine();
  const {
    timeline,
    complexityAnalysis,
    currentStepIndex,
    isPlaying,
    isExecuting,
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
    jumpToStep,
    toggleBreakpoint,
    clearError,
  } = controls;

  // Snapshots & Annotations
  const { snapshots, saveSnapshot, deleteSnapshot } = useSnapshots();
  const { setAnnotation, getAnnotation, hasAnnotation } = useAnnotations(code);

  // Derived Theme Color
  const themeColor = settings.themeColor === "auto"
    ? (language === "c++" ? "blue" : "saffron")
    : settings.themeColor;
  const [hoverThemeColor, setHoverThemeColor] = useState<"saffron" | "blue" | null>(null);
  const effectiveThemeColor = hoverThemeColor || themeColor;
  const templates = language === "c++" ? CPP_TEMPLATES : JS_TEMPLATES;
  const seoConfig = getSeoConfig(window.location.origin, page, language);

  useEffect(() => {
    prewarmWasmEngines();
  }, []);

  useSeoMetadata(seoConfig);

  const syncUrl = useCallback(
    (
      nextPage: AppPage,
      nextLanguage: AppLanguage,
      options?: { replace?: boolean; preserveShareHash?: boolean },
    ) => {
      const path = getPathForState(nextPage, nextLanguage);
      const hash =
        options?.preserveShareHash && window.location.hash.startsWith("#share=")
          ? window.location.hash
          : "";
      const nextUrl = `${path}${hash}`;
      const currentUrl = `${window.location.pathname}${window.location.hash}`;

      if (currentUrl === nextUrl) return;

      if (options?.replace) {
        window.history.replaceState(null, "", nextUrl);
        return;
      }

      window.history.pushState(null, "", nextUrl);
    },
    [],
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Sync the language-based warmth class on the root element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("theme-saffron", "theme-blue");
    root.classList.add(`theme-${effectiveThemeColor}`);
  }, [effectiveThemeColor]);

  useEffect(() => {
    if (
      page === "editor" &&
      window.location.pathname === ROUTES.home &&
      window.location.hash.startsWith("#share=")
    ) {
      syncUrl("editor", language, {
        replace: true,
        preserveShareHash: true,
      });
    }
  }, [page, language, syncUrl]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };
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

  // Auto-run has been removed per user request. 
  // Execution will only start when the user explicitly clicks the "Run" button.

  // VS Code Extension Integration
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'setContext') {
        const newLang = normalizeLanguage(message.language);
        setLanguage(newLang);
        setCode(message.code || getDefaultCode(newLang));
        setPage('editor');
        setIsPlaying(false);
      }
    };
    window.addEventListener('message', handleMessage);
    
    // Notify VS Code that the React app has loaded and is ready to receive context
    // We use a global variable to avoid acquireVsCodeApi error on multiple calls (Strict Mode)
    // @ts-ignore
    if (typeof acquireVsCodeApi === 'function') {
      // @ts-ignore
      if (!window.vscodeApi) {
        // @ts-ignore
        window.vscodeApi = acquireVsCodeApi();
      }
      // @ts-ignore
      window.vscodeApi.postMessage({ command: 'webviewReady' });
    }

    return () => window.removeEventListener('message', handleMessage);
  }, [setIsPlaying]);

  useEffect(() => {
    const handlePopState = () => {
      const shared = decodeShareLink();
      const routedState = getStateFromPath(window.location.pathname);
      const nextPage = shared ? "editor" : routedState.page;
      const nextLanguage = shared
        ? normalizeLanguage(shared.lang)
        : routedState.language;

      setPage(nextPage);
      setIsPlaying(false);
      setTemplateMenuOpen(false);
      setLinkCopied(false);

      if (nextPage === "editor") {
        setLanguage(nextLanguage);
        if (shared?.code) {
          setCode(shared.code);
        } else if (nextLanguage !== language) {
          setCode(getDefaultCode(nextLanguage));
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [language, setIsPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        case "Enter":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleRun(code, language, { cppCompiler: settings.cppCompiler });
          }
          break;
        case "KeyR":
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          reset(code, language, { cppCompiler: settings.cppCompiler });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, togglePlayPause, nextStep, prevStep, reset, code, language, settings.cppCompiler]);

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

  const handleOpenDocs = useCallback(() => {
    setIsPlaying(false);
    setPage("docs");
    syncUrl("docs", language);
  }, [language, setIsPlaying, syncUrl]);

  const handleGoHome = useCallback(() => {
    setIsPlaying(false);
    setPage("home");
    syncUrl("home", language);
  }, [language, setIsPlaying, syncUrl]);

  const handleLanguageSelect = (lang: string) => {
    const nextLanguage = normalizeLanguage(lang);

    setIsPlaying(false);
    setLanguage(nextLanguage);
    setCode(getDefaultCode(nextLanguage));
    setPage("editor");
    setTemplateMenuOpen(false);
    syncUrl("editor", nextLanguage);
  };

  const handleTemplateSelect = (template: CodeTemplate) => {
    setCode(template.code);
    setIsPlaying(false);
    setTemplateMenuOpen(false);
  };

  const handleCopyLink = useCallback(() => {
    const url = encodeShareLink(code, language);
    
    // In VS Code Webviews, navigator.clipboard might be restricted or undefined.
    // We try it first, then fallback to execCommand.
    const copyToClipboard = async () => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          return true;
        }
      } catch (e) {
        console.warn('navigator.clipboard failed, using fallback', e);
      }
      
      try {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        textArea.remove();
        return success;
      } catch (e) {
        console.error('Fallback copy failed', e);
        return false;
      }
    };

    copyToClipboard().then((success) => {
      if (success) {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    });

    syncUrl("editor", language, { replace: true, preserveShareHash: true });
  }, [code, language, syncUrl]);

  const isTransitioning = useRef(false);

  const toggleTheme = useCallback((e?: React.MouseEvent<HTMLElement> | MouseEvent) => {
    if (isTransitioning.current) return;
    const target = theme === 'light' ? 'dark' : 'light';

    let x = window.innerWidth - 40;
    let y = 28;

    // Get exact center of button from event or querySelector fallback
    const targetEl = (e?.currentTarget as HTMLElement) || (e?.target as HTMLElement)?.closest('button') || document.querySelector('[data-theme-toggle]');
    if (targetEl && targetEl.getBoundingClientRect) {
      const r = targetEl.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
    } else if (e && 'clientX' in e && (e.clientX !== 0 || e.clientY !== 0)) {
      x = e.clientX;
      y = e.clientY;
    }

    if (document.startViewTransition) {
      isTransitioning.current = true;
      document.documentElement.classList.add('view-transitioning');

      const transition = document.startViewTransition(() => {
        flushSync(() => {
          setTheme(target);
          document.documentElement.classList.toggle('dark', target === 'dark');
        });
      });

      transition.ready.then(() => {
        const maxRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );
        const anim = document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 550,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );

        anim.onfinish = () => {
          document.documentElement.classList.remove('view-transitioning');
        };
      });

      transition.finished.then(() => {
        isTransitioning.current = false;
        document.documentElement.classList.remove('view-transitioning');
      });
    } else {
      setTheme(target);
      document.documentElement.classList.toggle('dark', target === 'dark');
    }
  }, [theme]);

  // ── Hover Language Color Change ──────────────────
  const handleHoverLanguage = useCallback((lang: string | null) => {
    const newColor = lang === 'javascript' ? 'saffron' : lang === 'c++' ? 'blue' : null;
    setHoverThemeColor(newColor);
  }, []);
  const currentStep = timeline[currentStepIndex] || {
    line: 0,
    variables: {},
    callStack: [],
    consoleOutput: [],
  };

  const prevStepVariables = timeline[currentStepIndex - 1] || { variables: {} };
  const progress = timeline.length > 1 ? (currentStepIndex / (timeline.length - 1)) * 100 : 0;
  const langLabel = language === "javascript" ? "JavaScript (ES6)" : "C++ (Beta)";

  const routeVariants: Variants = {
    initial: { opacity: 0, y: 24, scale: 0.985, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -18, scale: 1.01, filter: "blur(8px)", transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
  };

  return (
    <div
      className={`flex min-w-0 flex-col w-full text-slate-800 dark:text-slate-200 ${
        page === "home" ? "min-h-screen overflow-x-hidden overflow-y-auto" : "h-screen overflow-hidden"
      } ${
        page === "home" ? "bg-[#f7f0e3] dark:bg-[var(--dark-base)]" : theme === "dark" ? (effectiveThemeColor === "blue" ? "bg-mesh-dark-blue" : "bg-mesh-dark-saffron") : "bg-mesh-light"
      }`}
    >
      <Analytics />
      <AnimatePresence initial={false} mode="wait">
        {page === "home" ? (
          <motion.div key="home" variants={routeVariants} initial="initial" animate="animate" exit="exit" className="relative h-full w-full will-change-transform">
            <HomePage
              language={language}
              onSelectLanguage={handleLanguageSelect}
              onOpenDocs={handleOpenDocs}
              docsHref={ROUTES.docs}
              javascriptHref={ROUTES.visualizerJavascript}
              cppHref={ROUTES.visualizerCpp}
              toggleTheme={toggleTheme}
              theme={theme}
              onHoverLanguage={handleHoverLanguage}
            />
          </motion.div>
        ) : page === "docs" ? (
          <motion.div key="docs" variants={routeVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full will-change-transform">
            <DocsPage
              onBack={handleGoHome}
              theme={theme}
              toggleTheme={toggleTheme}
              homeHref={ROUTES.home}
              javascriptHref={ROUTES.visualizerJavascript}
              cppHref={ROUTES.visualizerCpp}
            />
          </motion.div>
        ) : (
          <motion.div key="editor" variants={routeVariants} initial="initial" animate="animate" exit="exit" className="flex h-full w-full flex-col will-change-transform">
            {!embedMode && (
              <WorkspaceHeader
                language={language}
                theme={theme}
                langLabel={langLabel}
                onGoHome={handleGoHome}
                onOpenDocs={handleOpenDocs}
                toggleTheme={toggleTheme}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenSnapshots={() => setSnapshotsOpen(true)}
                annotationMode={annotationMode}
                onToggleAnnotationMode={() => setAnnotationMode(prev => !prev)}
              />
            )}

            <main ref={mainContainerRef} className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden p-3 md:p-5 gap-2 md:gap-3 bg-[#faf9f6]/95 dark:bg-[var(--dark-base)] z-10 relative">
              <div style={{ flex: typeof window !== 'undefined' && window.innerWidth >= 768 ? `0 0 calc(${splitRatio}% - 6px)` : undefined }} className="flex flex-col min-w-0 h-full w-full">
                <WorkspaceEditor
                  language={language}
                  theme={theme}
                  themeColor={themeColor}
                  code={code}
                  executionError={executionError}
                  isPlaying={isPlaying}
                  isExecuting={isExecuting}
                  visualizerMode={visualizerMode}
                  currentStepLine={currentStep.line}
                  breakpoints={breakpoints}
                  linkCopied={linkCopied}
                  onCodeChange={handleCodeChange}
                  onRun={async () => {
                    setIsPlaying(false);
                    return await handleRun(code, language, { cppCompiler: settings.cppCompiler });
                  }}
                  onShare={handleCopyLink}
                  onOpenTemplates={() => setTemplateMenuOpen(true)}
                  onToggleBreakpoint={toggleBreakpoint}
                  annotationMode={annotationMode}
                  currentAnnotation={getAnnotation(currentStepIndex)}
                  currentStepIndex={currentStepIndex}
                  onSaveAnnotation={setAnnotation}
                />
              </div>

              {/* Draggable Divider Handle */}
              <div
                onMouseDown={handleDividerMouseDown}
                onDoubleClick={() => {
                  setSplitRatio(50);
                  try { localStorage.setItem('algoviz-split-ratio', '50'); } catch (e) {}
                }}
                title="Drag to resize panels (Double-click to reset 50/50)"
                className="hidden md:flex items-center justify-center w-3 cursor-col-resize z-20 group transition-all shrink-0 hover:bg-amber-400/20 rounded select-none"
              >
                <div className={`w-1.5 h-12 rounded-full transition-colors ${isResizing ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-amber-500'}`} />
              </div>

              <div className="flex-1 flex flex-col min-w-0 h-full w-full">
                <WorkspaceVisualizer
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  consoleExpanded={consoleExpanded}
                  setConsoleExpanded={setConsoleExpanded}
                  visualizerMode={visualizerMode}
                  setVisualizerMode={setVisualizerMode}
                  themeColor={themeColor}
                  currentStep={currentStep}
                  prevStepVariables={prevStepVariables}
                  timeline={timeline}
                  currentStepIndex={currentStepIndex}
                  complexityAnalysis={complexityAnalysis}
                  settings={settings}
                  onSeekStep={jumpToStep}
                />
              </div>
            </main>

            <Controls
              isPlaying={isPlaying}
              onPlayPause={togglePlayPause}
              onNext={nextStep}
              onPrev={prevStep}
              onReset={() => reset(code, language, { cppCompiler: settings.cppCompiler })}
              canNext={currentStepIndex < timeline.length - 1}
              canPrev={currentStepIndex > 0}
              speed={speed}
              setSpeed={setSpeed}
              progress={progress}
              onSeek={(p) => {
                const targetIndex = Math.floor((p / 100) * (timeline.length - 1));
                controls.jumpToStep(targetIndex);
              }}
              themeColor={themeColor}
              currentStep={currentStepIndex}
              totalSteps={timeline.length}
              breakpointCount={breakpoints.size}
            />

            <TemplatePalette
              isOpen={templateMenuOpen}
              onClose={() => setTemplateMenuOpen(false)}
              templates={templates}
              onSelect={handleTemplateSelect}
              language={language}
            />

            <ErrorPopup
              error={executionError}
              onClose={clearError}
            />

            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              settings={settings}
              onUpdateSettings={setSettings}
              activeThemeColor={themeColor}
            />

            {/* Snapshots Drawer */}
            <SnapshotsDrawer
              isOpen={snapshotsOpen}
              onClose={() => setSnapshotsOpen(false)}
              snapshots={snapshots}
              currentCode={code}
              currentLanguage={language}
              themeColor={themeColor}
              onSave={saveSnapshot}
              onLoad={(snap) => {
                setCode(snap.code);
                setLanguage(snap.language as AppLanguage);
                setSnapshotsOpen(false);
                setIsPlaying(false);
              }}
              onDelete={deleteSnapshot}
            />
          </motion.div>

        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
