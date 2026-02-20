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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
                        Master Algorithms with <br />
                        <span className="text-saffron-500">Visual Execution</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Step through your code line-by-line. Watch variables update in real-time.
                        Understand the call stack. The perfect tool for teaching and learning programming logic.
                    </p>
                </motion.div>

                {/* Language Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
                    {/* JavaScript Card */}
                    <motion.div
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        className="w-full"
                    >
                        <button
                            onClick={() => {
                                setTimeout(() => onSelectLanguage('javascript'), 80);
                            }}
                            className="w-full group relative flex flex-col items-center p-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-saffron-500 shadow-xl shadow-saffron-500/10 dark:shadow-saffron-900/20 text-left transition-all active:scale-95 duration-100"
                        >
                            <div className="absolute top-4 right-4">
                                <ArrowRight className="text-saffron-500 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
                            </div>
                            <div className="bg-saffron-100 dark:bg-saffron-900/50 p-4 rounded-xl mb-4 text-saffron-600 dark:text-saffron-400">
                                <Code2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">JavaScript</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                                ES6+ support with real-time visualization of variables and stack.
                            </p>
                            <div className="mt-6 px-4 py-1.5 bg-saffron-50 dark:bg-saffron-900/20 text-saffron-600 dark:text-saffron-400 text-xs font-bold rounded-full">
                                Available Now
                            </div>
                        </button>
                    </motion.div>

                    {/* Python Card (Disabled) */}
                    <div className="relative flex flex-col items-center p-8 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 opacity-70 cursor-not-allowed">
                        <div className="bg-gray-200 dark:bg-slate-800 p-4 rounded-xl mb-4 text-slate-500 dark:text-slate-400">
                            <Terminal size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-500 mb-2">Python</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                            Visualizer for Python 3.10+ execution and data structures.
                        </p>
                        <div className="mt-6 flex items-center gap-1 px-4 py-1.5 bg-gray-200 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-full">
                            <Lock size={10} /> Coming Soon
                        </div>
                    </div>

                    {/* C++ Card (Enabled) */}
                    <motion.div
                        whileHover={{ scale: 1.02, translateY: -5 }}
                        className="w-full"
                    >
                        <button
                            onClick={() => {
                                setTimeout(() => onSelectLanguage('c++'), 80);
                            }}
                            className="w-full group relative flex flex-col items-center p-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20 text-left transition-all active:scale-95 duration-100"
                        >
                            <div className="absolute top-4 right-4">
                                <ArrowRight className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-xl mb-4 text-blue-600 dark:text-blue-400">
                                <Cpu size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">C++</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                                Visualize loops, vectors, and control flow in real-time.
                            </p>
                            <div className="mt-6 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                                Beta Access
                            </div>
                        </button>
                    </motion.div>
                </div>

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
