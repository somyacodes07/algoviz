import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Controls from "./frontend/components/Controls";
import HomePage from "./frontend/components/HomePage";
import TemplatePalette from "./frontend/components/TemplatePalette";
import ErrorPopup from "./frontend/components/ErrorPopup";
import DocsPage from "./frontend/components/DocsPage";
import WorkspaceHeader from "./frontend/components/layout/WorkspaceHeader";
import WorkspaceEditor from "./frontend/components/layout/WorkspaceEditor";
import WorkspaceVisualizer from "./frontend/components/layout/WorkspaceVisualizer";
import { useExecutionEngine } from "./frontend/hooks/useExecutionEngine";
import { useSeoMetadata } from "./frontend/hooks/useSeoMetadata";
import { JS_TEMPLATES, CPP_TEMPLATES, CodeTemplate } from "./frontend/codeTemplates";
import { getSeoConfig } from "./frontend/seo";
import { AppPage, AppLanguage, getPathForState, getStateFromPath, ROUTES } from "./frontend/routes";

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
  const [activeTab, setActiveTab] = useState<"variables" | "stack" | "performance">("variables");
  const [linkCopied, setLinkCopied] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState(false);
  const [consoleExpanded, setConsoleExpanded] = useState(false);

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
    toggleBreakpoint,
    clearError,
  } = controls;

  // Derived Theme Color
  const themeColor = language === "c++" ? "blue" : "saffron";
  const [hoverThemeColor, setHoverThemeColor] = useState<"saffron" | "blue" | null>(null);
  const effectiveThemeColor = hoverThemeColor || themeColor;
  const templates = language === "c++" ? CPP_TEMPLATES : JS_TEMPLATES;
  const seoConfig = getSeoConfig(window.location.origin, page, language);

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
            handleRun(code, language);
          }
          break;
        case "KeyR":
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          reset(code, language);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, togglePlayPause, nextStep, prevStep, reset, code, language]);

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

  // Track cursor position for the theme circle reveal origin
  const lastMousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  useEffect(() => {
    const track = (e: MouseEvent) => { lastMousePos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', track, { passive: true });
    return () => window.removeEventListener('mousemove', track);
  }, []);

  const isTransitioning = useRef(false);

  const toggleTheme = () => {
    if (isTransitioning.current) return;
    const target = theme === 'light' ? 'dark' : 'light';
    const { x, y } = lastMousePos.current;

    // Use View Transitions API for dynamic color reveal
    if (document.startViewTransition) {
      isTransitioning.current = true;
      const transition = document.startViewTransition(() => {
        setTheme(target);
        // Force synchronous DOM update
        document.documentElement.classList.toggle('dark', target === 'dark');
      });

      transition.ready.then(() => {
        const maxRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 1800,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });

      transition.finished.then(() => {
        isTransitioning.current = false;
      });
    } else {
      // Fallback for unsupported browsers
      setTheme(target);
    }
  };

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
      <AnimatePresence initial={false} mode="wait">
        {page === "home" ? (
          <motion.div key="home" variants={routeVariants} initial="initial" animate="animate" exit="exit" className="relative h-full w-full will-change-transform">
            <HomePage
              onSelectLanguage={handleLanguageSelect}
              onOpenDocs={handleOpenDocs}
              docsHref={ROUTES.docs}
              javascriptHref={ROUTES.visualizerJavascript}
              cppHref={ROUTES.visualizerCpp}
              toggleTheme={toggleTheme}
              theme={theme}
              pendingTheme={pendingTheme}
              onHoverLanguage={(lang) => setHoverThemeColor(lang === 'javascript' ? 'saffron' : lang === 'c++' ? 'blue' : null)}
            />
          </motion.div>
        ) : page === "docs" ? (
          <motion.div key="docs" variants={routeVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full will-change-transform">
            <DocsPage
              onBack={handleGoHome}
              theme={theme}
              homeHref={ROUTES.home}
              javascriptHref={ROUTES.visualizerJavascript}
              cppHref={ROUTES.visualizerCpp}
            />
          </motion.div>
        ) : (
          <motion.div key="editor" variants={routeVariants} initial="initial" animate="animate" exit="exit" className="flex h-full w-full flex-col will-change-transform">
            <WorkspaceHeader
              language={language}
              theme={theme}
              langLabel={langLabel}
              onGoHome={handleGoHome}
              onOpenDocs={handleOpenDocs}
              toggleTheme={toggleTheme}
            />

            <main className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-6 bg-[#faf9f6]/95 dark:bg-[var(--dark-base)] z-10 relative">
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
                  return await handleRun(code, language);
                }}
                onShare={handleCopyLink}
                onOpenTemplates={() => setTemplateMenuOpen(true)}
                onToggleBreakpoint={toggleBreakpoint}
              />
              
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
              />
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
