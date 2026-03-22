import { useState, useEffect, useRef } from 'react';

interface InViewOptions {
  threshold?: number;
  rootMargin?: string;
  disabled?: boolean;
}

export const useInView = (
  thresholdOrOptions: number | InViewOptions = 0.1,
  rootMargin = '0px 0px -48px 0px'
) => {
  const opts: InViewOptions =
    typeof thresholdOrOptions === 'number'
      ? { threshold: thresholdOrOptions, rootMargin }
      : thresholdOrOptions;

  const threshold = opts.threshold  ?? 0.1;
  const margin    = opts.rootMargin ?? '0px 0px -48px 0px';
  const disabled  = opts.disabled   ?? false;

  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(disabled);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVis(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVis(true); obs.unobserve(entry.target); }
      },
      { threshold, rootMargin: margin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, margin, disabled]);

  return { ref, vis };
};
