import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Terminal, Sparkles, Binary, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Raw markdown imports using Vite's ?raw syntax
import introMd from "../../docs/introduction.md?raw";
import setupMd from "../../docs/setup-guide.md?raw";
import featuresMd from "../../docs/features-and-ui.md?raw";
import transpilerMd from "../../docs/cpp-engine.md?raw";
import sandboxMd from "../../docs/instrumentation-sandbox.md?raw";
import templateMd from "../../docs/templates-and-palette.md?raw";

interface DocsPageProps {
  onBack: () => void;
  theme: "light" | "dark";
}

const docsStructure = [
  { id: "intro", title: "Introduction & Philosophy", icon: <BookOpen size={16} />, content: introMd },
  { id: "setup", title: "Setup & Installation", icon: <Settings size={16} />, content: setupMd },
  { id: "features", title: "Features & UI Layouts", icon: <Sparkles size={16} />, content: featuresMd },
  { id: "cpp-engine", title: "C++ Transpiler Engine", icon: <Terminal size={16} />, content: transpilerMd },
  { id: "sandbox", title: "Instrumentation Sandbox", icon: <Binary size={16} />, content: sandboxMd },
  { id: "template", title: "Template Library & Palette", icon: <Binary size={16} />, content: templateMd },
];

const DocsPage: React.FC<DocsPageProps> = ({ onBack, theme }) => {
  const [activeDoc, setActiveDoc] = useState(docsStructure[0].id);
  const activeContent = docsStructure.find((d) => d.id === activeDoc)?.content || "";

  return (
    <div className={`flex flex-col h-full w-full bg-[#faf9f6] dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-100`}>
      {/* Header */}
      <header className="h-14 flex items-center px-6 border-b border-slate-900 dark:border-[#222] bg-white dark:bg-[#0A0A0B] shrink-0 sticky top-0 z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#161618] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-xs transition-colors active:translate-y-[1px]"
        >
          <ArrowLeft size={16} /> Back to App
        </button>
        <div className="mx-auto flex items-center gap-2">
          <BookOpen size={18} className="text-saffron-500" />
          <h1 className="font-black text-lg tracking-tight leading-none uppercase">AlgoViz Docs</h1>
        </div>
      </header>

      {/* Split Pane Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Nav */}
        <aside className="w-64 border-r-[2px] border-slate-900 dark:border-[#222] bg-white dark:bg-[#111113] overflow-y-auto shrink-0 flex flex-col p-4 gap-2 shadow-[2px_0_0_#94a3b8] dark:shadow-[2px_0_0_#000] z-10 relative">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-2 px-3">Documentation</h2>
          <nav className="flex flex-col gap-1.5">
            {docsStructure.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded border transition-all text-sm font-bold active:translate-y-[1px] ${
                  activeDoc === doc.id
                    ? "bg-saffron-50 dark:bg-[#1A1A1C] border-saffron-400 dark:border-saffron-600 text-saffron-700 dark:text-saffron-500 shadow-[2px_2px_0_#fbd38d] dark:shadow-[2px_2px_0_#9c4221]"
                    : "bg-white dark:bg-[#161618] border-slate-200 dark:border-[#333] text-slate-600 dark:text-slate-400 shadow-[1px_1px_0_rgba(0,0,0,0.05)] dark:shadow-[1px_1px_0_#000] hover:bg-slate-50 dark:hover:bg-[#1A1A1C]"
                }`}
              >
                {doc.icon}
                <span className="truncate text-left">{doc.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#faf9f6]/95 dark:bg-transparent custom-scrollbar p-6 md:p-10 z-0">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeDoc}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto rounded border-[2px] border-slate-900 dark:border-[#333] shadow-[4px_4px_0_#0f172a] dark:shadow-[4px_4px_0_#000] bg-white dark:bg-[#161618] p-8 md:p-12 mb-20"
            >
              <article className="prose prose-slate dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-a:text-saffron-600 dark:prose-a:text-saffron-500 hover:prose-a:text-saffron-500 prose-code:font-mono prose-code:bg-slate-100 dark:prose-code:bg-[#222] prose-code:text-rose-600 dark:prose-code:text-rose-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeContent}</ReactMarkdown>
              </article>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default DocsPage;
