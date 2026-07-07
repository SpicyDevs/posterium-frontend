import { useState, useCallback } from 'react';
import type { PosterConfig } from './types';

export const usePosterHistory = (initialState: PosterConfig | (() => PosterConfig)) => {
  const [stateObj, setStateObj] = useState(() => {
    const state = typeof initialState === 'function' ? initialState() : initialState;
    return { history: [state], currentIndex: 0 };
  });

  const state = stateObj.history[stateObj.currentIndex];

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
    setState,
    undo,
    redo,
    canUndo: stateObj.currentIndex > 0,
    canRedo: stateObj.currentIndex < stateObj.history.length - 1,
  };
};
