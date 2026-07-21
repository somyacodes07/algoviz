import { useState, useCallback } from 'react';

export interface Snapshot {
  id: string;
  name: string;
  code: string;
  language: string;
  createdAt: number;
}

const STORAGE_KEY = 'algoviz-snapshots';
const MAX_SNAPSHOTS = 10;

function loadFromStorage(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Snapshot[];
  } catch {
    return [];
  }
}

function saveToStorage(snapshots: Snapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // quota exceeded — ignore
  }
}

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(loadFromStorage);

  const saveSnapshot = useCallback((name: string, code: string, language: string) => {
    const snap: Snapshot = {
      id: `snap-${Date.now()}`,
      name: name.trim() || `Snapshot ${new Date().toLocaleTimeString()}`,
      code,
      language,
      createdAt: Date.now(),
    };
    setSnapshots(prev => {
      const updated = [snap, ...prev].slice(0, MAX_SNAPSHOTS);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSnapshots([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { snapshots, saveSnapshot, deleteSnapshot, clearAll };
}
