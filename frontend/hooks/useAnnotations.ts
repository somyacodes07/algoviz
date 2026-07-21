import { useState, useCallback, useMemo, useEffect } from 'react';

export interface Annotation {
  stepIndex: number;
  text: string;
}

function hashCode(str: string): string {
  let h = 0;
  for (let i = 0; i < Math.min(str.length, 200); i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return `anno-${(h >>> 0).toString(36)}`;
}

function loadAnnotations(key: string): Map<number, string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    const arr: [number, string][] = JSON.parse(raw);
    return new Map(arr);
  } catch {
    return new Map();
  }
}

function saveAnnotations(key: string, map: Map<number, string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...map.entries()]));
  } catch {
    // quota exceeded
  }
}

export function useAnnotations(code: string) {
  const storageKey = useMemo(() => hashCode(code), [code]);
  const [annotations, setAnnotations] = useState<Map<number, string>>(() => loadAnnotations(storageKey));

  useEffect(() => {
    setAnnotations(loadAnnotations(storageKey));
  }, [storageKey]);

  const setAnnotation = useCallback((stepIndex: number, text: string) => {
    setAnnotations(prev => {
      const next = new Map<number, string>(prev);
      if (text.trim() === '') {
        next.delete(stepIndex);
      } else {
        next.set(stepIndex, text);
      }
      saveAnnotations(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const removeAnnotation = useCallback((stepIndex: number) => {
    setAnnotations(prev => {
      const next = new Map<number, string>(prev);
      next.delete(stepIndex);
      saveAnnotations(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const getAnnotation = useCallback((stepIndex: number): string | undefined => {
    return annotations.get(stepIndex);
  }, [annotations]);

  const hasAnnotation = useCallback((stepIndex: number): boolean => {
    return annotations.has(stepIndex);
  }, [annotations]);

  return { annotations, setAnnotation, removeAnnotation, getAnnotation, hasAnnotation };
}
