// src/lib/hooks/useAnimation.ts
import { useState, useEffect } from 'react';
import { usePausedWhenOffscreen } from './usePausedWhenOffscreen';

export function useAnimation<T extends HTMLElement>() {
  const { ref, isVisible } = usePausedWhenOffscreen<T>();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const shouldAnimate = isVisible && !prefersReducedMotion;

  return { ref, shouldAnimate };
}
