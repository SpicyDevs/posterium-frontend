import { useState, useCallback } from 'react';
import type { PosterConfig } from '../types';

export const usePosterHistory = (initialState: PosterConfig | (() => PosterConfig)) => {
  const [stateObj, setStateObj] = useState(() => {
    const state = typeof initialState === 'function' ? initialState() : initialState;
    return {
      history: [state],
      currentIndex: 0,
    };
  });

  const state = stateObj.history[stateObj.currentIndex];

  const setState = useCallback((action: React.SetStateAction<PosterConfig>) => {
    setStateObj((prev) => {
      const current = prev.history[prev.currentIndex];
      const newState = typeof action === 'function' ? (action as Function)(current) : action;

      // FIX: Was JSON.stringify(current) === JSON.stringify(newState) — an O(n) string
      // build + comparison that ran on every single setState call including 60fps slider
      // drags, firing on the entire nested PosterConfig object (items Record included).
      //
      // Replaced with Object.is (reference equality): O(1), always correct.
      // Functional updaters like `(prev) => ({ ...prev, foo: bar })` always produce a
      // new object reference so they always add to history, which is the desired
      // behaviour — only an exact same-reference no-op is skipped.
      if (Object.is(current, newState)) {
        return prev;
      }

      // Truncate any future history if we're making a new change after undoing
      const newHistory = prev.history.slice(0, prev.currentIndex + 1);
      return {
        history: [...newHistory, newState],
        currentIndex: newHistory.length,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setStateObj((prev) => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
    }));
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
