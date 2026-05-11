import { useEffect, useState } from 'react';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

const getPrefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_QUERY).matches;
};

export const useAnimation = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getPrefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia(REDUCED_QUERY);
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (mediaQuery.addEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return { prefersReducedMotion, shouldAnimate: !prefersReducedMotion };
};
