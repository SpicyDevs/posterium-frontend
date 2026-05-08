import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const getAnimationsAllowed = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return !window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

export const useAnimation = (): boolean => {
  const [animationsAllowed, setAnimationsAllowed] = useState<boolean>(getAnimationsAllowed);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setAnimationsAllowed(!mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return animationsAllowed;
};
