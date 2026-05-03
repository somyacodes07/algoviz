import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Terminal,
  Sparkles,
  Binary,
  Settings,
  LayoutTemplate,
  BarChart3,
  Cpu,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import introMd from '../../docs/introduction.md?raw';
import setupMd from '../../docs/setup-guide.md?raw';
import featuresMd from '../../docs/features-and-ui.md?raw';
import transpilerMd from '../../docs/cpp-engine.md?raw';
import sandboxMd from '../../docs/instrumentation-sandbox.md?raw';
import templateMd from '../../docs/templates-and-palette.md?raw';
import complexityMd from '../../docs/complexity-analysis.md?raw';
import architectureMd from '../../docs/architecture.md?raw';
import vscodeExtensionMd from '../../docs/vscode-extension.md?raw';
import image1 from '../../assets/image-1.png';
import image2 from '../../assets/image-2.png';
import image3 from '../../assets/image-3.png';
import image4 from '../../assets/image-4.png';
import image5 from '../../assets/image-5.png';
import image6 from '../../assets/image-6.png';

interface DocsPageProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  homeHref: string;
  javascriptHref: string;
  cppHref: string;
}

type VisualTone = 'amber' | 'blue' | 'emerald' | 'slate';

interface VisualStep {
  label: string;
  detail: string;
  tone: VisualTone;
}

interface VisualMetric {
  label: string;
  value: string;
}

interface VisualPair {
  leftLabel: string;
  leftCode: string;
  rightLabel: string;
  rightCode: string;
}

interface DocGalleryItem {
  src: string;
  alt: string;
  caption: string;
  label: string;
  tone: VisualTone;
}

interface DocVisual {
  eyebrow: string;
  title: string;
  summary: string;
  metrics: VisualMetric[];
  steps: VisualStep[];
  notes: string[];
  pair?: VisualPair;
  gallery?: DocGalleryItem[];
}

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  visual: DocVisual;
}

const toneClasses: Record<VisualTone, string> = {
  amber:
    'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-500/10 dark:text-amber-200',
  blue: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700/60 dark:bg-sky-500/10 dark:text-sky-200',
  emerald:
    'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-500/10 dark:text-emerald-200',
  slate:
    'border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200',
};

const docsStructure: DocSection[] = [
  {
    id: 'intro',
    title: 'Introduction & Philosophy',
    icon: <BookOpen size={16} />,
    content: introMd,
    visual: {
      eyebrow: 'Core Mental Model',
      title: 'Source code becomes visible state, not just output',
      summary:
        'AlgoViz is built around one promise: every step should reveal what the program knows right now, not just what it eventually prints.',
      metrics: [
        { label: 'Supported Modes', value: 'JavaScript + C++' },
        { label: 'Execution Surface', value: 'Browser + Web Worker' },
        { label: 'Teaching Focus', value: 'DSA and recursion' },
      ],
      steps: [
        {
          label: 'Author',
          detail: 'Write raw JavaScript or DSA-oriented C++ in the editor.',
          tone: 'amber',
        },
        {
          label: 'Translate',
          detail: 'Normalize the source into browser-runnable logic and trace points.',
          tone: 'blue',
        },
        {
          label: 'Replay',
          detail: 'Scrub variables, call stack frames, and console output like a timeline.',
          tone: 'emerald',
        },
      ],
      notes: [
        'The product is optimized for understanding state transitions, not just stepping line numbers.',
        'The visualizer intentionally favors bold, low-noise UI so students can map code to memory quickly.',
        'Docs are organized by the same system stages the app uses internally.',
      ],
    },
  },
  {
    id: 'setup',
    title: 'Setup & Installation',
    icon: <Settings size={16} />,
    content: setupMd,
    visual: {
      eyebrow: 'Local Workflow',
      title: 'Run locally, then ship as a static site',
      summary:
        'The app has no heavy application server. The parser, transpiler, instrumentation, and execution timeline all run in-browser.',
      metrics: [
        { label: 'Node Requirement', value: '18+' },
        { label: 'Dev Server', value: 'Vite on :3000' },
        { label: 'Deploy Model', value: 'Static hosting' },
      ],
      steps: [
        {
          label: 'Clone',
          detail: 'Pull the repository and install dependencies.',
          tone: 'amber',
        },
        {
          label: 'Develop',
          detail: 'Use `npm run dev` while Vite serves the app and worker.',
          tone: 'blue',
        },
        {
          label: 'Ship',
          detail: 'Generate static HTML, JS, CSS, and WASM assets with `npm run build`.',
          tone: 'emerald',
        },
      ],
      notes: [
        'Because execution happens in a worker, hosting stays simple.',
        'The production output contains static route entry points for home, docs, and visualizer pages.',
        'Browser-delivered WASM assets handle the parser layer for C++.',
      ],
    },
  },
  {
    id: 'features',
    title: 'Features & UI Layouts',
    icon: <Sparkles size={16} />,
    content: featuresMd,
    visual: {
      eyebrow: 'Workbench Anatomy',
      title: 'The interface is organized around decisions students make while debugging',
      summary:
        'Every panel in the UI exists to answer one question fast: where am I, what changed, what called this, and what is it printing?',
      metrics: [
        { label: 'Editor Engine', value: 'Monaco' },
        { label: 'Template Access', value: 'Cmd/Ctrl + K' },
        { label: 'Main Panels', value: 'Editor, state, stack, console' },
      ],
      steps: [
        {
          label: 'Source Editor',
          detail: 'Primary authoring surface with line focus, theme sync, and breakpoints.',
          tone: 'blue',
        },
        {
          label: 'Variables',
          detail: 'Highlights how values and algorithm pointers change across steps.',
          tone: 'emerald',
        },
        {
          label: 'Call Stack',
          detail: 'Shows recursive depth and nested function context without IDE overhead.',
          tone: 'amber',
        },
        {
          label: 'Console',
          detail: 'Replays logs in the exact order they become visible during execution.',
          tone: 'slate',
        },
      ],
      notes: [
        'The layout is tuned for line-by-line reasoning, not generic dashboard density.',
        'Algorithmic pointer tracking makes arrays and search windows easier to teach visually.',
        'The editor and visualizer can shift between compact and focus-heavy modes.',
      ],
      gallery: [
        {
          src: image1,
          alt: 'JavaScript visualizer showing a reverse array example with highlighted variables and pointer markers.',
          caption:
            'Array and pointer state stays front-and-center, which makes swap-based problems much easier to explain live.',
          label: 'Reverse Array Trace',
          tone: 'amber',
        },
        {
          src: image4,
          alt: 'AlgoViz graph traversal view showing visited and result arrays updating while a C++ depth-first search runs.',
          caption:
            'The workbench can keep multiple evolving structures readable at once, which is where a lot of teaching tools usually collapse.',
          label: 'Graph State View',
          tone: 'emerald',
        },
        {
          src: image5,
          alt: 'Performance and complexity panel tracking step frequency and Big O analysis.',
          caption:
            'The Complexity panel dynamically evaluates recursive depth, loop frequencies, and array mutations to visually model Big-O behavior at runtime.',
          label: 'Complexity Analysis',
          tone: 'blue',
        },
        {
          src: image6,
          alt: 'Source code editor highlighting hot lines and execution flow.',
          caption:
            'The editor visualizes the concentration of execution cycles with glowing hot lines, making bottlenecks and loop frequencies immediately recognizable during source flow tracking.',
          label: 'Source Flow & Hot Lines',
          tone: 'amber',
        },
      ],
    },
  },
  {
    id: 'cpp-engine',
    title: 'C++ Execution Engine',
    icon: <Terminal size={16} />,
    content: transpilerMd,
    visual: {
      eyebrow: 'Dual-Engine C++',
      title: 'Real GCC compilation with automatic local fallback',
      summary:
        'AlgoViz sends instrumented C++ to Wandbox for real GCC compilation. If the API is unreachable, it seamlessly falls back to a local C++→JS transpiler.',
      metrics: [
        { label: 'Primary Engine', value: 'Wandbox (GCC)' },
        { label: 'Fallback Engine', value: 'Local Transpiler' },
        { label: 'STL Support', value: 'vector, map, stack, queue' },
      ],
      steps: [
        {
          label: 'Instrument',
          detail: 'Tree-sitter parses C++ and injects __trace() calls with JSON serialization.',
          tone: 'blue',
        },
        {
          label: 'Compile',
          detail: 'Instrumented code is sent to Wandbox API for real GCC compilation and execution.',
          tone: 'amber',
        },
        {
          label: 'Parse',
          detail: 'Extract __TRACE__ JSON blocks from stdout and build the execution timeline.',
          tone: 'emerald',
        },
        {
          label: 'Fallback',
          detail: 'If Wandbox is down, automatically use the local C++→JS transpiler in a Web Worker.',
          tone: 'slate',
        },
      ],
      notes: [
        'The Wandbox API requires no API keys or credentials — it is fully public and free.',
        'Compiler errors are shown directly to the user; network errors trigger the silent fallback.',
        'The local transpiler covers DSA-focused C++ (vectors, loops, recursion) for offline use.',
      ],
      gallery: [
        {
          src: image2,
          alt: 'C++ bubble sort running in AlgoViz with the current line highlighted and runtime variables visible beside the source code.',
          caption:
            'C++ compiles with real GCC, producing accurate execution traces for any standard C++ code including full STL container support.',
          label: 'C++ Bubble Sort',
          tone: 'blue',
        },
      ],
      pair: {
        leftLabel: 'C++ Source',
        leftCode: `vector<int> nums = {5, 3, 8};\nsort(nums.begin(), nums.end());\nint mid = (left + right) / 2;`,
        rightLabel: 'Instrumented C++ (simplified)',
        rightCode: `vector<int> nums = {5, 3, 8};\n__trace(1, {{"nums", __to_json(nums)}});\nsort(nums.begin(), nums.end());\n__trace(2, {{"nums", __to_json(nums)}});`,
      },
    },
  },
  {
    id: 'sandbox',
    title: 'Instrumentation Sandbox',
    icon: <Binary size={16} />,
    content: sandboxMd,
    visual: {
      eyebrow: 'Execution Safety',
      title: 'Tracing, guardrails, and replay all happen in an isolated worker loop',
      summary:
        'Once code is runnable JavaScript, AlgoViz rewrites it with trace calls, blocks dangerous browser APIs, and records a timeline of program state snapshots.',
      metrics: [
        { label: 'AST Tooling', value: 'Acorn' },
        { label: 'Loop Guard', value: '2,000 steps default' },
        { label: 'Isolation', value: 'Web Worker sandbox' },
      ],
      steps: [
        {
          label: 'Inject',
          detail:
            'Append `__tracer.step()` calls and wrap functions with stack enter and exit hooks.',
          tone: 'amber',
        },
        {
          label: 'Protect',
          detail: 'Disable network and risky globals while the worker evaluates the code.',
          tone: 'slate',
        },
        {
          label: 'Snapshot',
          detail: 'Deep-clone variables and capture only new console output for each step.',
          tone: 'blue',
        },
        {
          label: 'Return',
          detail:
            'Emit a timeline the UI can scrub forward and backward without rerunning everything.',
          tone: 'emerald',
        },
      ],
      notes: [
        'The worker protects the UI thread from infinite loops and heavy recursion.',
        'Console history is stored incrementally to keep worker memory lower.',
        'Runtime, transpilation, and worker failures are separated so the UI can report them clearly.',
      ],
      gallery: [
        {
          src: image3,
          alt: 'Call stack focused AlgoViz view showing nested dfs stack frames during recursive execution.',
          caption:
            'Because execution is isolated and traced frame-by-frame, recursive calls can be replayed as a readable stack instead of a final opaque result.',
          label: 'DFS Call Stack Replay',
          tone: 'slate',
        },
      ],
    },
  },
  {
    id: 'template',
    title: 'Template Library & Palette',
    icon: <LayoutTemplate size={16} />,
    content: templateMd,
    visual: {
      eyebrow: 'Learning Acceleration',
      title: 'Templates are indexed for intent, not just exact string matches',
      summary:
        'The command palette is built so a student can think in concepts like heap, sliding window, or cycle detection and still land on a runnable example immediately.',
      metrics: [
        { label: 'Query Style', value: 'Title + tag search' },
        { label: 'Coverage', value: 'Search, graphs, DP, structures' },
        { label: 'Outcome', value: 'Load and run instantly' },
      ],
      steps: [
        {
          label: 'Search',
          detail: 'Open the palette and describe the problem, data structure, or technique.',
          tone: 'blue',
        },
        {
          label: 'Match',
          detail: 'Use heavily tagged template metadata to surface related algorithms.',
          tone: 'amber',
        },
        {
          label: 'Load',
          detail: 'Insert the selected template into the editor with teaching-friendly code.',
          tone: 'emerald',
        },
      ],
      notes: [
        'Templates reduce blank-page friction when the real goal is understanding execution.',
        'C++ templates work with both Wandbox (full C++) and the local transpiler (offline).',
        'The palette makes the visualizer useful for both exploration and demonstration.',
      ],
    },
  },
  {
    id: 'complexity',
    title: 'Complexity Analysis',
    icon: <BarChart3 size={16} />,
    content: complexityMd,
    visual: {
      eyebrow: 'Performance Insight',
      title: 'Live time complexity estimation from source structure and runtime behavior',
      summary:
        'The Complexity tab estimates Big-O notation using AST analysis for JavaScript and timeline-based heuristics for C++, complete with hotspot heatmaps.',
      metrics: [
        { label: 'JS Analysis', value: 'Acorn AST walk' },
        { label: 'C++ Analysis', value: 'Timeline heuristic' },
        { label: 'Visual Output', value: 'Heatmap + Big-O' },
      ],
      steps: [
        {
          label: 'Detect',
          detail: 'Identify loops, recursion, and sort calls from source structure or runtime traces.',
          tone: 'blue',
        },
        {
          label: 'Estimate',
          detail: 'Compare loop depth, hit counts, and input sizes to infer growth rate.',
          tone: 'amber',
        },
        {
          label: 'Visualize',
          detail: 'Show Big-O notation, hot lines, peak stack depth, and operation counts.',
          tone: 'emerald',
        },
      ],
      notes: [
        'Works for both JavaScript and C++ — JS uses AST analysis, C++ uses runtime trace heuristics.',
        'The hotspot heatmap reveals which lines consume the most execution time.',
        'Supports O(1), O(log n), O(n), O(n log n), O(n²), O(n³), and O(2^n) detection.',
      ],
    },
  },
  {
    id: 'architecture',
    title: 'Architecture Reference',
    icon: <Cpu size={16} />,
    content: architectureMd,
    visual: {
      eyebrow: 'Technical Overview',
      title: 'Module layout, data flow, and error handling strategy',
      summary:
        'A developer-focused reference covering the execution pipeline, module boundaries, timeline data format, and error categorization.',
      metrics: [
        { label: 'Frontend', value: 'React 19 + Vite' },
        { label: 'Backend', value: 'Web Worker + Wandbox' },
        { label: 'Parser', value: 'Tree-sitter WASM' },
      ],
      steps: [
        {
          label: 'Route',
          detail: 'executor.ts dispatches code by language to the appropriate engine.',
          tone: 'amber',
        },
        {
          label: 'Execute',
          detail: 'Wandbox (C++) or Web Worker (JS) produces a timeline of execution steps.',
          tone: 'blue',
        },
        {
          label: 'Analyze',
          detail: 'complexity.ts estimates Big-O from AST or timeline data.',
          tone: 'emerald',
        },
        {
          label: 'Render',
          detail: 'useExecutionEngine reconstructs console history and drives the React UI.',
          tone: 'slate',
        },
      ],
      notes: [
        'Error types are categorized (transpile, runtime, timeout, worker, network, compiler) for clear UI feedback.',
        'Console output is stored incrementally in the worker and reconstructed in the frontend.',
        'The Wandbox path and Web Worker path produce the same Timeline data structure.',
      ],
    },
  },
  {
    id: 'vscode-extension',
    title: 'VS Code Extension',
    icon: <Terminal size={16} />,
    content: vscodeExtensionMd,
    visual: {
      eyebrow: 'IDE Integration',
      title: 'Run AlgoViz directly inside Visual Studio Code',
      summary:
        'The AlgoViz VS Code extension brings the entire visualizer experience offline and right next to your codebase without making any API calls.',
      metrics: [
        { label: 'Network Req', value: 'None (Offline)' },
        { label: 'Environment', value: 'Webview UI' },
        { label: 'C++ Engine', value: 'Local Transpiler' },
      ],
      steps: [
        {
          label: 'Install',
          detail: 'Download and install directly from the Visual Studio Marketplace or Open VSX.',
          tone: 'blue',
        },
        {
          label: 'Launch',
          detail: 'Click "AlgoViz: Visualize" from the editor Run menu to instantly load your current file.',
          tone: 'emerald',
        },
        {
          label: 'Execute',
          detail: 'Run JavaScript or C++ seamlessly inside the IDE using the embedded worker.',
          tone: 'amber',
        },
      ],
      notes: [
        'The extension automatically reads your active editor and detects if it is C++ or JS.',
        'Because the extension uses the local transpiler for C++, it works completely offline.',
        'The user interface is identical to the web app, maintaining full parity.',
      ],
    },
  },
];

const DocsPage: React.FC<DocsPageProps> = ({
  onBack,
  theme,
  homeHref,
  javascriptHref,
  cppHref,
}) => {
  const [activeDoc, setActiveDoc] = useState(docsStructure[0].id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeSection = docsStructure.find((doc) => doc.id === activeDoc) || docsStructure[0];

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeDoc]);

  return (
    <div
      ref={scrollContainerRef}
      data-theme={theme}
      className="flex h-full w-full flex-col overflow-y-auto bg-[#faf9f6] text-slate-900 dark:bg-[#0A0A0B] dark:text-slate-100"
    >
      <header className="h-14 flex items-center px-6 border-b border-slate-900 dark:border-[#222] bg-white dark:bg-[#0A0A0B] shrink-0 sticky top-0 z-30">
        <a
          href={homeHref}
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
          className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#161618] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-xs transition-colors active:translate-y-[1px]"
        >
          <ArrowLeft size={16} /> Back to App
        </a>
        <div className="mx-auto flex items-center gap-2">
          <BookOpen size={18} className="text-saffron-500" />
          <h1 className="font-black text-lg tracking-tight leading-none uppercase">AlgoViz Docs</h1>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1520px] flex-1 flex-col gap-4 px-4 py-6 md:px-6 lg:flex-row lg:items-start lg:gap-5 lg:px-8">
        <aside className="w-full shrink-0 lg:sticky lg:top-[5.25rem] lg:w-[17.5rem]">
          <div className="relative z-10 flex flex-col gap-2 rounded border-[2px] border-slate-900 bg-white p-3.5 shadow-[2px_2px_0_#94a3b8] dark:border-[#222] dark:bg-[#111113] dark:shadow-[2px_2px_0_#000]">
            <h2 className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500">
              Documentation
            </h2>
            <nav className="grid w-full gap-1.5">
              {docsStructure.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc.id)}
                  className={`flex w-full items-center gap-3 rounded border px-3 py-2.5 text-left text-sm font-bold transition-all active:translate-y-[1px] ${
                    activeDoc === doc.id
                      ? 'border-saffron-400 bg-saffron-50 text-saffron-700 shadow-[2px_2px_0_#fbd38d] dark:border-saffron-600 dark:bg-[#1A1A1C] dark:text-saffron-500 dark:shadow-[2px_2px_0_#9c4221]'
                      : 'border-slate-200 bg-white text-slate-600 shadow-[1px_1px_0_rgba(0,0,0,0.05)] hover:bg-slate-50 dark:border-[#333] dark:bg-[#161618] dark:text-slate-400 dark:shadow-[1px_1px_0_#000] dark:hover:bg-[#1A1A1C]'
                  }`}
                >
                  {doc.icon}
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-[#222]">
              <a
                href={javascriptHref}
                className="flex w-full items-center justify-center rounded border border-slate-900 bg-saffron-50 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-saffron-700 dark:border-slate-700 dark:bg-[#1A1A1C] dark:text-saffron-400"
              >
                Open JS Visualizer
              </a>
              <a
                href={cppHref}
                className="flex w-full items-center justify-center rounded border border-slate-900 bg-blue-50 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-blue-700 dark:border-slate-700 dark:bg-[#1A1A1C] dark:text-blue-400"
              >
                Open C++ Visualizer
              </a>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeDoc}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-20 w-full max-w-[1120px] space-y-6"
            >
              <section className="overflow-hidden rounded border-[2px] border-slate-900 bg-slate-900 text-white shadow-[4px_4px_0_#0f172a] dark:border-[#333] dark:shadow-[4px_4px_0_#000]">
                <div className="relative bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.35),transparent_38%),linear-gradient(135deg,#0f172a_0%,#111827_55%,#172554_100%)] p-8 md:p-10">
                  <p className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-saffron-300">
                    {activeSection.visual.eyebrow}
                  </p>
                  <h2 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">
                    {activeSection.visual.title}
                  </h2>
                  <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-200 md:text-lg">
                    {activeSection.visual.summary}
                  </p>
                  <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {activeSection.visual.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-300">
                          {metric.label}
                        </div>
                        <div className="mt-2 text-lg font-black text-white">{metric.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
                <section className="rounded border-[2px] border-slate-900 bg-white p-6 shadow-[4px_4px_0_#0f172a] dark:border-[#333] dark:bg-[#161618] dark:shadow-[4px_4px_0_#000] md:p-7">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-500">
                        System Flow
                      </p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight">
                        How this section works in practice
                      </h3>
                    </div>
                    <div className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 md:flex">
                      <span>Stage map</span>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeSection.visual.steps.map((step, index) => (
                      <div
                        key={step.label}
                        className={`rounded border p-4 md:p-5 ${toneClasses[step.tone]}`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">
                            Step {index + 1}
                          </span>
                          <span className="text-xs font-black uppercase tracking-[0.18em]">
                            {step.label}
                          </span>
                        </div>
                        <p className="text-sm font-semibold leading-relaxed md:text-[15px]">
                          {step.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded border-[2px] border-slate-900 bg-white p-6 shadow-[4px_4px_0_#0f172a] dark:border-[#333] dark:bg-[#161618] dark:shadow-[4px_4px_0_#000] md:p-7">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-500">
                    Why It Matters
                  </p>
                  <h3 className="mb-5 mt-2 text-2xl font-black tracking-tight">
                    Design constraints behind the feature
                  </h3>
                  <div className="space-y-3">
                    {activeSection.visual.notes.map((note) => (
                      <div
                        key={note}
                        className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-700 dark:border-[#2a2a2d] dark:bg-[#111113] dark:text-slate-300"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {activeSection.visual.gallery && (
                <section className="rounded border-[2px] border-slate-900 bg-white p-6 shadow-[4px_4px_0_#0f172a] dark:border-[#333] dark:bg-[#161618] dark:shadow-[4px_4px_0_#000] md:p-7">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-500">
                        Product Visuals
                      </p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight">
                        What this system looks like in the actual workbench
                      </h3>
                    </div>
                    <span className="hidden text-[11px] font-bold uppercase tracking-widest text-slate-400 md:block">
                      Real UI captures
                    </span>
                  </div>

                  <div
                    className={`grid gap-5 ${
                      activeSection.visual.gallery.length > 1 ? 'lg:grid-cols-2' : 'grid-cols-1'
                    }`}
                  >
                    {activeSection.visual.gallery.map((item) => (
                      <figure
                        key={item.label}
                        className="overflow-hidden rounded border border-slate-200 bg-[#faf9f6] dark:border-[#2a2a2d] dark:bg-[#111113]"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-[#2a2a2d] dark:bg-[#161618]">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${toneClasses[item.tone]}`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <img
                          src={item.src}
                          alt={item.alt}
                          className="w-full border-b border-slate-200 dark:border-[#2a2a2d]"
                          loading="lazy"
                        />
                        <figcaption className="px-4 py-4 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                          {item.caption}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              )}

              {activeSection.visual.pair && (
                <section className="grid gap-5 md:grid-cols-2">
                  <div className="overflow-hidden rounded border-[2px] border-slate-900 bg-white shadow-[4px_4px_0_#0f172a] dark:border-[#333] dark:bg-[#161618] dark:shadow-[4px_4px_0_#000]">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:border-[#2a2a2d] dark:bg-[#111113]">
                      {activeSection.visual.pair.leftLabel}
                    </div>
                    <pre className="overflow-x-auto bg-white p-5 text-[13px] leading-6 text-slate-800 dark:bg-[#161618] dark:text-slate-200">
                      <code>{activeSection.visual.pair.leftCode}</code>
                    </pre>
                  </div>
                  <div className="overflow-hidden rounded border-[2px] border-slate-900 bg-white shadow-[4px_4px_0_#0f172a] dark:border-[#333] dark:bg-[#161618] dark:shadow-[4px_4px_0_#000]">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 dark:border-[#2a2a2d] dark:bg-[#111113]">
                      {activeSection.visual.pair.rightLabel}
                    </div>
                    <pre className="overflow-x-auto bg-white p-5 text-[13px] leading-6 text-slate-800 dark:bg-[#161618] dark:text-slate-200">
                      <code>{activeSection.visual.pair.rightCode}</code>
                    </pre>
                  </div>
                </section>
              )}

              <section className="rounded border-[2px] border-slate-900 bg-white p-8 shadow-[4px_4px_0_#0f172a] dark:border-[#333] dark:bg-[#161618] dark:shadow-[4px_4px_0_#000] md:p-12">
                <article className="prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-saffron-600 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-rose-600 prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-strong:text-slate-900 prose-table:text-sm prose-th:text-[11px] prose-th:uppercase prose-th:tracking-wider hover:prose-a:text-saffron-500 dark:prose-invert dark:prose-headings:text-slate-100 dark:prose-p:text-slate-300 dark:prose-a:text-saffron-500 dark:prose-code:bg-[#222] dark:prose-code:text-rose-400 dark:prose-strong:text-slate-100">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSection.content}</ReactMarkdown>
                </article>
              </section>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default DocsPage;
