import { useState, useCallback } from 'react';
import { PosterConfig } from '../types';

export const usePosterHistory = (initialState: PosterConfig) => {
  const [history, setHistory] = useState<PosterConfig[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = useCallback((newState: PosterConfig) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      // Only push if different (simple JSON check)
      if (JSON.stringify(newHistory[newHistory.length - 1]) === JSON.stringify(newState)) {
        return newHistory;
      }
      return [...newHistory, newState];
    });
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  const undo = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1
  };
};