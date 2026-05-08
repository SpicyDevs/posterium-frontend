import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export const useAnimation = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    setPrefersReducedMotion(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.reducedMotion = prefersReducedMotion ? 'true' : 'false';
  }, [prefersReducedMotion]);

  return {
    prefersReducedMotion,
    shouldAnimate: !prefersReducedMotion,
  };
};

