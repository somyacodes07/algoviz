import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Code2, Terminal, ArrowRight, Lock } from 'lucide-react';

interface HomePageProps {
    onSelectLanguage: (lang: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectLanguage }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
            <div className="max-w-4xl w-full flex flex-col items-center text-center">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                    className="mb-12"
                >
                    <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
                        Master Algorithms with <br />
                        <span className="text-gradient">Visual Execution</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Step through your code line-by-line. Watch variables update in real-time.
                        Understand the call stack. The perfect tool for teaching and learning programming logic.
                    </p>
                </motion.div>

                {/* Language Selection Grid */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.15 }
                        }
                    }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl"
                >
                    {/* JavaScript Card */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                        }}
                        whileHover={{ scale: 1.03, translateY: -5 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full"
                    >
                        <button
                            onClick={() => {
                                setTimeout(() => onSelectLanguage('javascript'), 150);
                            }}
                            className="w-full h-full group relative flex flex-col items-center p-8 glass-panel rounded-2xl border-t-2 border-t-saffron-400 shadow-xl shadow-saffron-500/10 dark:shadow-saffron-900/20 text-left transition-all duration-300 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-saffron-50/50 before:to-transparent dark:before:from-saffron-500/5 before:opacity-0 hover:before:opacity-100"
                        >
                            <div className="absolute top-4 right-4 bg-saffron-100 dark:bg-slate-800 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                                <ArrowRight size={16} className="text-saffron-600 dark:text-saffron-400" />
                            </div>
                            <div className="bg-gradient-to-br from-saffron-100 to-amber-100 dark:from-saffron-900/40 dark:to-slate-800 p-4 rounded-2xl mb-5 text-saffron-600 dark:text-saffron-400 shadow-sm border border-white/50 dark:border-saffron-500/20">
                                <Code2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">JavaScript</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center flex-1">
                                ES6+ support with real-time visualization of variables and stack.
                            </p>
                            <div className="mt-6 px-4 py-1.5 bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-400 text-xs font-bold rounded-full border border-saffron-200 dark:border-saffron-500/30">
                                Available Now
                            </div>
                        </button>
                    </motion.div>

                    {/* Python Card (Disabled) */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                        }}
                        className="w-full relative flex flex-col items-center p-8 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 opacity-60 cursor-not-allowed backdrop-blur-sm"
                    >
                        <div className="bg-gray-200 dark:bg-slate-800 p-4 rounded-2xl mb-5 text-slate-500 dark:text-slate-400 shadow-inner">
                            <Terminal size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-500 mb-3">Python</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center flex-1">
                            Visualizer for Python 3.10+ execution and data structures.
                        </p>
                        <div className="mt-6 flex items-center gap-1.5 px-4 py-1.5 bg-gray-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full border border-gray-300 dark:border-slate-700">
                            <Lock size={12} /> Coming Soon
                        </div>
                    </motion.div>

                    {/* C++ Card (Enabled) */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                        }}
                        whileHover={{ scale: 1.03, translateY: -5 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full"
                    >
                        <button
                            onClick={() => {
                                setTimeout(() => onSelectLanguage('c++'), 150);
                            }}
                            className="w-full h-full group relative flex flex-col items-center p-8 glass-panel rounded-2xl border-t-2 border-t-blue-400 shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20 text-left transition-all duration-300 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-50/50 before:to-transparent dark:before:from-blue-500/5 before:opacity-0 hover:before:opacity-100"
                        >
                            <div className="absolute top-4 right-4 bg-blue-100 dark:bg-slate-800 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                                <ArrowRight size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-slate-800 p-4 rounded-2xl mb-5 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-blue-500/20">
                                <Cpu size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">C++</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center flex-1">
                                Visualize loops, vectors, and control flow in real-time.
                            </p>
                            <div className="mt-6 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-500/30">
                                Beta Access
                            </div>
                        </button>
                    </motion.div>
                </motion.div>

                <div className="mt-20 flex flex-col items-center gap-1">
                    <p className="text-blue-500 dark:text-blue-400 font-medium">Made by Somyajeet Singh</p>
                    <footer className="text-slate-400 dark:text-slate-600 text-sm">
                        © 2026 AlgoViz. Built for Educators.
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
