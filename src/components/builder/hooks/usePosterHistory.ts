import { useState, useCallback, useEffect } from 'react';
import type { PosterConfig } from '../types';
import {
  loadBuilderHistory,
  saveBuilderHistory,
  type PosterHistorySnapshot,
} from '../systems/storage/builderStorage';

interface Options {
  persist?: boolean;
}

export const usePosterHistory = (
  initialState: PosterConfig | (() => PosterConfig),
  { persist = false }: Options = {}
) => {
  const [stateObj, setStateObj] = useState(() => {
    if (persist) {
      const stored = loadBuilderHistory();
      if (stored) return stored;
    }
    const state = typeof initialState === 'function' ? initialState() : initialState;
    return { history: [state], currentIndex: 0 } satisfies PosterHistorySnapshot;
  });

  const state = stateObj.history[stateObj.currentIndex];

  useEffect(() => {
    if (!persist) return;
    saveBuilderHistory(stateObj);
  }, [persist, stateObj]);

  const setState = useCallback((action: React.SetStateAction<PosterConfig>) => {
    setStateObj((prev) => {
      const current = prev.history[prev.currentIndex];
      const newState = typeof action === 'function' ? (action as Function)(current) : action;
      if (Object.is(current, newState)) return prev;
      const MAX_HISTORY = 100;
      const trimmed = prev.history.slice(0, prev.currentIndex + 1);
      const capped =
        trimmed.length >= MAX_HISTORY ? trimmed.slice(trimmed.length - MAX_HISTORY + 1) : trimmed;
      return { history: [...capped, newState], currentIndex: capped.length };
    });
  }, []);

  const undo = useCallback(() => {
    setStateObj((prev) => ({ ...prev, currentIndex: Math.max(0, prev.currentIndex - 1) }));
  }, []);

  const redo = useCallback(() => {
    setStateObj((prev) => ({
      ...prev,
      currentIndex: Math.min(prev.history.length - 1, prev.currentIndex + 1),
    }));
  }, []);

  return {
    state,
    historyState: stateObj,
    setState,
    undo,
    redo,
    canUndo: stateObj.currentIndex > 0,
    canRedo: stateObj.currentIndex < stateObj.history.length - 1,
  };
};
