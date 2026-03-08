import { useState, useRef, useEffect, useCallback } from 'react';
import { executeCode } from '../../backend/sandbox/executor';
import { Timeline } from '../../types';

interface ExecutionState {
    timeline: Timeline;
    currentStepIndex: number;
    isPlaying: boolean;
    speed: number;
    executionError: string | null;
}

interface ExecutionControls {
    handleRun: (code: string, language: string) => Promise<void>;
    setIsPlaying: (playing: boolean) => void;
    setSpeed: (speed: number) => void;
    setCurrentStepIndex: (index: number | ((prev: number) => number)) => void;
    togglePlayPause: () => void;
    reset: (code: string, language: string) => void;
    nextStep: () => void;
    prevStep: () => void;
    jumpToStep: (index: number) => void;
}

export const useExecutionEngine = (): { state: ExecutionState, controls: ExecutionControls } => {
    const [timeline, setTimeline] = useState<Timeline>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(800); // ms per step
    const [executionError, setExecutionError] = useState<string | null>(null);

    const timerRef = useRef<number | null>(null);

    const handleRun = useCallback(async (code: string, language: string) => {
        setExecutionError(null);
        setIsPlaying(false);
        try {
            const result = await executeCode(code, language);
            setTimeline(result);
            // If error exists in result
            if (result.length > 0 && result[result.length - 1].isError) {
                setExecutionError(result[result.length - 1].errorMessage || "Error");
            }
            setCurrentStepIndex(0);
        } catch (e: any) {
            setExecutionError(e.message || "Execution Failed");
            setTimeline([]);
            setCurrentStepIndex(-1);
        }
    }, []);

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

    const togglePlayPause = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    const reset = useCallback((code: string, language: string) => {
        setIsPlaying(false);
        setCurrentStepIndex(0);
        handleRun(code, language);
    }, [handleRun]);

    const nextStep = useCallback(() => {
        setCurrentStepIndex(i => Math.min(timeline.length - 1, i + 1));
    }, [timeline.length]);

    const prevStep = useCallback(() => {
        setCurrentStepIndex(i => Math.max(0, i - 1));
    }, []);

    const jumpToStep = useCallback((index: number) => {
        setCurrentStepIndex(Math.max(0, Math.min(timeline.length - 1, index)));
    }, [timeline.length]);

    return {
        state: { timeline, currentStepIndex, isPlaying, speed, executionError },
        controls: { handleRun, setIsPlaying, setSpeed, setCurrentStepIndex, togglePlayPause, reset, nextStep, prevStep, jumpToStep }
    };
};
