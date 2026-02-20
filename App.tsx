import React, { useState, useEffect, useCallback, useRef } from 'react';
import CodeEditor from './frontend/components/CodeEditor';
import VariablesPanel from './frontend/components/VariablesPanel';
import CallStackPanel from './frontend/components/CallStackPanel';
import ConsolePanel from './frontend/components/ConsolePanel';
import Controls from './frontend/components/Controls';
import HomePage from './frontend/components/HomePage';
import { executeCode } from './backend/sandbox/executor';
import { Timeline } from './types';
import { Code, Layers, Terminal as TerminalIcon, Cpu, Sun, Moon, ArrowLeft, Play } from 'lucide-react';

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


const App: React.FC = () => {
    const [page, setPage] = useState<'home' | 'editor'>('home');
    const [language, setLanguage] = useState('javascript');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const [code, setCode] = useState<string>(JS_DEFAULT_CODE);
    const [timeline, setTimeline] = useState<Timeline>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(800); // ms per step
    const [activeTab, setActiveTab] = useState<'variables' | 'stack'>('variables');
    const [executionError, setExecutionError] = useState<string | null>(null);

    const timerRef = useRef<number | null>(null);

    // Derived Theme Color
    const themeColor = language === 'c++' ? 'blue' : 'saffron';

    // Apply Theme class to Body for Tailwind Dark Mode
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const handleRun = useCallback(async () => {
        setExecutionError(null);
        const result = await executeCode(code, language);
        setTimeline(result);
        // If error exists in result
        if (result.length > 0 && result[result.length - 1].isError) {
            setExecutionError(result[result.length - 1].errorMessage || "Error");
        }
        setCurrentStepIndex(0);
    }, [code, language]);

    useEffect(() => {
        // Only run if in editor mode and timeline is empty (initial load)
        if (page === 'editor' && timeline.length === 0) {
            handleRun();
        }
    }, [page]);

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = window.setInterval(() => {
                setCurrentStepIndex(prev => {
                    if (prev < timeline.length - 1) {
                        return prev + 1;
                    } else {
                        setIsPlaying(false);
                        return prev;
                    }
                });
            }, speed);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, timeline.length, speed]);

    const handleCodeChange = (newCode: string | undefined) => {
        if (newCode !== undefined) {
            setCode(newCode);
            setIsPlaying(false);
        }
    };

    const handleLanguageSelect = (lang: string) => {
        setLanguage(lang);
        if (lang === 'c++') {
            setCode(CPP_DEFAULT_CODE);
        } else {
            setCode(JS_DEFAULT_CODE);
        }
        setTimeline([]);
        setPage('editor');
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const currentStep = timeline[currentStepIndex] || {
        line: 0,
        variables: {},
        callStack: [],
        consoleOutput: []
    };

    const prevStep = timeline[currentStepIndex - 1] || { variables: {} };
    const progress = timeline.length > 1 ? (currentStepIndex / (timeline.length - 1)) * 100 : 0;

    if (page === 'home') {
        return (
            <div className="relative">
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-md border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                </div>
                <HomePage onSelectLanguage={handleLanguageSelect} />
            </div>
        );
    }

    const langLabel = language === 'javascript' ? 'JavaScript (ES6)' : 'C++ (Beta)';

    // Theme Helper Classes
    const headerClass = themeColor === 'saffron' ? 'bg-saffron-500' : 'bg-blue-600';
    const tagClass = themeColor === 'saffron' ? 'bg-white/20' : 'bg-white/20';
    const iconTextClass = themeColor === 'saffron' ? 'text-saffron-500' : 'text-blue-500';
    const runBtnClass = themeColor === 'saffron'
        ? 'bg-saffron-500 hover:bg-saffron-600 shadow-saffron-500/20'
        : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20';
    const tabActiveText = themeColor === 'saffron' ? 'text-saffron-600 dark:text-saffron-400' : 'text-blue-600 dark:text-blue-400';
    const tabActiveBorder = themeColor === 'saffron' ? 'border-saffron-500' : 'border-blue-500';
    const tabActiveBg = themeColor === 'saffron' ? 'bg-saffron-50/50' : 'bg-blue-50/50';

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden transition-colors duration-300">
            {/* Header */}
            <header className={`h-16 flex items-center px-6 justify-between ${headerClass} dark:bg-slate-900 border-b border-transparent dark:border-slate-800 shadow-md z-20 text-white transition-colors duration-300`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPage('home')}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="bg-white/20 dark:bg-slate-800 p-2 rounded-lg backdrop-blur-sm">
                        <Cpu size={24} className="text-white dark:text-saffron-500" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight leading-none text-white">
                            AlgoViz
                        </h1>
                        <span className="text-saffron-100 dark:text-slate-500 text-xs font-medium opacity-90">Editor Mode</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex gap-4 text-xs font-semibold px-3 py-1.5 rounded-full border border-transparent dark:border-slate-700 ${tagClass} dark:bg-slate-800 text-white dark:text-slate-400`}>
                        <span>{langLabel}</span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-full ${tagClass} dark:bg-slate-800 text-white dark:text-slate-400 hover:bg-white/20 dark:hover:bg-slate-700 transition-colors`}
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">

                {/* Left Panel: Editor */}
                <div className="flex flex-col min-h-[50vh] md:min-h-0 md:flex-1 w-full md:min-w-[400px] border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-800 p-4 md:p-6 bg-white dark:bg-slate-950 transition-colors">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-bold uppercase tracking-wide">
                            <Code size={18} className={iconTextClass} />
                            <span>Source Code</span>
                        </div>

                        <div className="flex items-center gap-4">
                            {executionError && (
                                <span className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-200 dark:border-red-900/30 font-medium">
                                    {executionError}
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setIsPlaying(false);
                                    handleRun();
                                }}
                                className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 ${runBtnClass}`}
                            >
                                <Play size={16} fill="currentColor" />
                                Run
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 relative rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-slate-800">
                        <CodeEditor
                            code={code}
                            language={language}
                            onChange={handleCodeChange}
                            activeLine={currentStep.line}
                            isError={currentStep.isError}
                            theme={theme}
                            themeColor={themeColor}
                        />
                    </div>
                </div>

                {/* Right Panel: Visualization */}
                <div className="w-full md:w-[450px] min-h-[50vh] md:min-h-0 flex flex-col shrink-0 bg-gray-50 dark:bg-slate-900 shadow-xl z-10 md:border-l border-gray-200 dark:border-slate-800 transition-colors">

                    {/* Top Half: Variables & Stack */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
                            <button
                                onClick={() => setActiveTab('variables')}
                                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'variables' ? `${tabActiveText} border-b-2 ${tabActiveBorder} ${tabActiveBg} dark:bg-slate-800` : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                            >
                                <Layers size={16} /> Variables
                            </button>
                            <button
                                onClick={() => setActiveTab('stack')}
                                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'stack' ? `${tabActiveText} border-b-2 ${tabActiveBorder} ${tabActiveBg} dark:bg-slate-800` : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                            >
                                <Layers size={16} className="rotate-180" /> Call Stack
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-slate-900 p-2 transition-colors">
                            {activeTab === 'variables' ? (
                                <VariablesPanel variables={currentStep.variables} prevVariables={prevStep.variables} themeColor={themeColor} />
                            ) : (
                                <CallStackPanel stack={currentStep.callStack} themeColor={themeColor} />
                            )}
                        </div>
                    </div>

                    {/* Bottom Half: Console */}
                    <div className="h-[35%] flex flex-col min-h-[150px] bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] transition-colors">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-2">
                                <TerminalIcon size={16} className={iconTextClass} />
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Console Output</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-gray-50/50 dark:bg-slate-950/50 transition-colors">
                            <ConsolePanel logs={currentStep.consoleOutput} />
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer Controls */}
            <Controls
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onNext={() => setCurrentStepIndex(i => Math.min(timeline.length - 1, i + 1))}
                onPrev={() => setCurrentStepIndex(i => Math.max(0, i - 1))}
                onReset={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(0);
                    handleRun();
                }}
                canNext={currentStepIndex < timeline.length - 1}
                canPrev={currentStepIndex > 0}
                speed={speed}
                setSpeed={setSpeed}
                progress={progress}
                themeColor={themeColor}
            />
        </div>
    );
};

export default App;