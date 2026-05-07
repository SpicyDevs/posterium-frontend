import { useEffect, useMemo, useState } from 'react';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const useAnimation = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MOTION_QUERY);
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = prefersReducedMotion ? 'true' : 'false';
  }, [prefersReducedMotion]);

  return useMemo(
    () => ({
      prefersReducedMotion,
      shouldAnimate: !prefersReducedMotion,
    }),
    [prefersReducedMotion]
  );
};
