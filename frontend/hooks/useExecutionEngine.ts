import { Timeline, ComplexityAnalysis, ExecutionConfig } from '../../types';

interface ExecutionState {
  timeline: Timeline;
  complexityAnalysis: ComplexityAnalysis | null;
  currentStepIndex: number;
  isPlaying: boolean;
  isExecuting: boolean;
  speed: number;
  executionError: string | null;
  breakpoints: Set<number>;
}

interface ExecutionControls {
  handleRun: (code: string, language: string, config?: ExecutionConfig) => Promise<boolean>;
  setIsPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setCurrentStepIndex: (index: number | ((prev: number) => number)) => void;
  togglePlayPause: () => void;
  reset: (code: string, language: string, config?: ExecutionConfig) => void;
  nextStep: () => void;
  prevStep: () => void;
  jumpToStep: (index: number) => void;
  toggleBreakpoint: (line: number) => void;
  clearError: () => void;
}

export const useExecutionEngine = (): { state: ExecutionState; controls: ExecutionControls } => {
  const [timeline, setTimeline] = useState<Timeline>([]);
  const [complexityAnalysis, setComplexityAnalysis] = useState<ComplexityAnalysis | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(800); // ms per step
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());

  const timerRef = useRef<number | null>(null);
  const breakpointsRef = useRef<Set<number>>(breakpoints);

  // Keep ref in sync with state for use inside interval callback
  useEffect(() => {
    breakpointsRef.current = breakpoints;
  }, [breakpoints]);

  const handleRun = useCallback(async (code: string, language: string, config?: ExecutionConfig): Promise<boolean> => {
    setExecutionError(null);
    setIsPlaying(false);
    setIsExecuting(true);
    try {
      const { timeline: rawTimeline, analysis } = await executeCode(code, language, config);

      // Reconstruct full console history from deltas to reduce worker memory bloat
      let currentLogs: import('../../types').ConsoleLog[] = [];
      const result = rawTimeline.map((step) => {
        currentLogs = [...currentLogs, ...(step.consoleOutput || [])];
        return { ...step, consoleOutput: currentLogs };
      });

      setTimeline(result);
      setComplexityAnalysis(analysis || null);
      if (result.length > 0 && result[result.length - 1].isError) {
        setExecutionError(result[result.length - 1].errorMessage || 'Error');
        return false;
      }
      setCurrentStepIndex(0);
      return true;
    } catch (e: any) {
      setExecutionError(e.message || 'Execution Failed');
      setTimeline([]);
      setComplexityAnalysis(null);
      setCurrentStepIndex(-1);
      return false;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < timeline.length - 1) {
            const next = prev + 1;
            const nextLine = timeline[next]?.line;
            // If the next step hits a breakpoint, advance to it then pause
            if (
              breakpointsRef.current.size > 0 &&
              nextLine &&
              breakpointsRef.current.has(nextLine)
            ) {
              setTimeout(() => setIsPlaying(false), 0);
              return next;
            }
            return next;
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
  }, [isPlaying, timeline, speed]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const reset = useCallback(
    (code: string, language: string, config?: ExecutionConfig) => {
      setIsPlaying(false);
      setCurrentStepIndex(0);
      handleRun(code, language, config);
    },
    [handleRun],
  );

  const nextStep = useCallback(() => {
    setCurrentStepIndex((i) => Math.min(timeline.length - 1, i + 1));
  }, [timeline.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const jumpToStep = useCallback(
    (index: number) => {
      setCurrentStepIndex(Math.max(0, Math.min(timeline.length - 1, index)));
    },
    [timeline.length],
  );

  const toggleBreakpoint = useCallback((line: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(line)) {
        next.delete(line);
      } else {
        next.add(line);
      }
      return next;
    });
  }, []);

  return {
    state: {
      timeline,
      complexityAnalysis,
      currentStepIndex,
      isPlaying,
      isExecuting,
      speed,
      executionError,
      breakpoints,
    },
    controls: {
      handleRun,
      setIsPlaying,
      setSpeed,
      setCurrentStepIndex,
      togglePlayPause,
      reset,
      nextStep,
      prevStep,
      jumpToStep,
      toggleBreakpoint,
      clearError: () => setExecutionError(null),
    },
  };
};
