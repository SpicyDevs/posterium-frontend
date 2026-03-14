// hooks.ts
// Backward-compatible barrel — existing imports (`from '../hooks'`) still resolve.
// All logic lives in ./hooks/ individual files.
export * from './hooks/index';

// Legacy alias kept for any internal usage that referenced usePosterLoad
import { useState, useCallback } from 'react';
export const usePosterLoad = () => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  return {
    loaded,
    error,
    onLoad: useCallback(() => setLoaded(true), []),
    onError: useCallback(() => setError(true), []),
  };
};
