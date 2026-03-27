import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, Terminal, FileCode2 } from 'lucide-react';
import { CodeTemplate } from '../codeTemplates';

interface TemplatePaletteProps {
  isOpen: boolean;
  onClose: () => void;
  templates: CodeTemplate[];
  onSelect: (template: CodeTemplate) => void;
  language: string;
}

const TemplatePalette: React.FC<TemplatePaletteProps> = ({
  isOpen,
  onClose,
  templates,
  onSelect,
  language
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory ? t.category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          // The parent component should handle opening, but we catch it just in case
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < filteredTemplates.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredTemplates.length > 0) {
            onSelect(filteredTemplates[selectedIndex]);
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTemplates, selectedIndex, onClose, onSelect]);

  // Scroll into view on selection change
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        // Only scroll if out of view
        const topOfEl = selectedEl.offsetTop;
        const bottomOfEl = topOfEl + selectedEl.clientHeight;
        const topOfView = listRef.current.scrollTop;
        const bottomOfView = topOfView + listRef.current.clientHeight;

        if (topOfEl < topOfView) {
          listRef.current.scrollTop = topOfEl;
        } else if (bottomOfEl > bottomOfView) {
          listRef.current.scrollTop = bottomOfEl - listRef.current.clientHeight;
        }
      }
    }
  }, [selectedIndex]);

  // Prevent scrolling body when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  const activeTemplate = filteredTemplates[selectedIndex];
  const isSaffron = language !== 'c++';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full max-w-4xl h-[75vh] min-h-[600px] max-h-[850px] bg-white dark:bg-[#111113] border-[2px] border-slate-900 dark:border-[#222] shadow-[8px_8px_0_#0f172a] dark:shadow-[8px_8px_0_#000] rounded-none overflow-hidden flex flex-col md:flex-row pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              
              {/* Left Side: Search & List (Fixed Width) */}
              <div className="w-full md:w-[350px] shrink-0 flex flex-col h-full border-r-[2px] border-transparent md:border-slate-900 md:dark:border-[#222] overflow-hidden">
                
                {/* Search Header */}
                <div className="flex flex-col border-b-[2px] border-slate-900 dark:border-[#222] shrink-0 bg-slate-50 dark:bg-[#0A0A0B]">
                  <div className="flex items-center gap-3 px-4 h-14">
                    <Search size={18} className="text-slate-400 dark:text-slate-500" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={`Search ${language === 'c++' ? 'C++' : 'JavaScript'} templates...`}
                      className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-600"
                    />
                    <div className="flex items-center gap-1.5 opacity-50">
                      <span className="text-[10px] font-bold border border-slate-300 dark:border-[#333] px-1.5 py-0.5 rounded text-slate-500">ESC</span>
                      <span className="text-[10px] font-bold leading-none">to close</span>
                    </div>
                  </div>
                  
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto custom-scrollbar">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`shrink-0 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors ${
                        selectedCategory === null
                          ? isSaffron ? 'bg-saffron-500 text-white' : 'bg-blue-500 text-white'
                          : 'bg-slate-200 dark:bg-[#161618] text-slate-500 hover:bg-slate-300 dark:hover:bg-[#222]'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`shrink-0 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors ${
                          selectedCategory === cat
                            ? isSaffron ? 'bg-saffron-500 text-white' : 'bg-blue-500 text-white'
                            : 'bg-slate-200 dark:bg-[#161618] text-slate-500 hover:bg-slate-300 dark:hover:bg-[#222]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Templates List */}
                <div ref={listRef} className="flex-1 overflow-y-auto h-full custom-scrollbar bg-white dark:bg-[#111113] p-2 space-y-1 relative">
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((template, index) => {
                      const isSelected = index === selectedIndex;
                      const showHeader = index === 0 || template.category !== filteredTemplates[index - 1].category;
                      return (
                        <React.Fragment key={template.name}>
                          {showHeader && (
                            <div className="sticky top-0 z-10 px-4 py-1.5 mt-2 mb-1 bg-slate-100/90 dark:bg-[#161618]/95 backdrop-blur-sm border-y border-slate-200 dark:border-[#222]">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {template.category}
                              </span>
                            </div>
                          )}
                          <div
                            onMouseEnter={() => setSelectedIndex(index)}
                            onClick={() => {
                              onSelect(template);
                              onClose();
                            }}
                            className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                            isSelected 
                              ? isSaffron 
                                ? 'bg-saffron-50 dark:bg-[#1a1a1c] border-l-4 border-saffron-500' 
                                : 'bg-blue-50 dark:bg-[#1a1a1c] border-l-4 border-blue-500'
                              : 'bg-transparent border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-[#161618]'
                          }`}
                        >
                          <div className="flex flex-col gap-1 pr-4">
                            <span className={`text-sm font-bold ${isSelected ? (isSaffron ? 'text-saffron-700 dark:text-saffron-400' : 'text-blue-700 dark:text-blue-400') : 'text-slate-700 dark:text-slate-300'}`}>
                              {template.name}
                            </span>
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {template.description}
                            </span>
                          </div>
                          
                          <div className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border border-slate-200 dark:border-[#333] px-2 py-1 rounded bg-white dark:bg-[#0A0A0B]">Enter ↵</span>
                          </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500">
                      <Terminal size={32} className="opacity-20 mb-3" />
                      <p className="text-sm font-semibold">No templates found</p>
                      <p className="text-[11px] mt-1 opacity-70">Try a different search term</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Instant Preview (40%) */}
              <div className="hidden md:flex flex-[2] flex-col h-full bg-slate-50 dark:bg-[#0A0A0B]">
                <div className="h-14 border-b-[2px] border-slate-900 dark:border-[#222] px-6 flex items-center shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <FileCode2 size={14} /> Preview
                  </span>
                </div>
                
                <div className="flex-1 w-full relative overflow-y-auto h-full custom-scrollbar p-6">
                  {activeTemplate ? (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 leading-tight mb-2">
                          {activeTemplate.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {activeTemplate.description}
                        </p>
                      </div>
                      
                      <div className="bg-white dark:bg-[#161618] border-[2px] border-slate-900 dark:border-[#333] shadow-[4px_4px_0_rgba(0,0,0,0.1)] dark:shadow-[4px_4px_0_#000] p-4 font-mono text-xs overflow-x-auto">
                        <pre className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          <code>{activeTemplate.code}</code>
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center opacity-50">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Select a template to preview</p>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TemplatePalette;
