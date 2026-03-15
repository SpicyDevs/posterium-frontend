// src/dashboard/hooks/useInView.ts
// IntersectionObserver hook. The element is unobserved once it enters view
// (vis is sticky-true) so it never re-fires, keeping CPU cost near zero.
// Options type is intentionally narrow: threshold and rootMargin only.
import { useState, useEffect, useRef } from 'react';

interface InViewOptions {
  threshold?: number;
  rootMargin?: string;
  /** Skip observation entirely (e.g. when component is already known visible). */
  disabled?: boolean;
}

export const useInView = (
  thresholdOrOptions: number | InViewOptions = 0.1,
  rootMargin = '0px 0px -48px 0px'
) => {
  // Accept both legacy positional call and new options object
  const opts: InViewOptions =
    typeof thresholdOrOptions === 'number'
      ? { threshold: thresholdOrOptions, rootMargin }
      : thresholdOrOptions;

  const threshold  = opts.threshold  ?? 0.1;
  const margin     = opts.rootMargin ?? '0px 0px -48px 0px';
  const disabled   = opts.disabled   ?? false;

  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(disabled); // if disabled, treat as always visible

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    // Graceful degradation: no IO support → immediately visible
    if (typeof IntersectionObserver === 'undefined') {
      setVis(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVis(true);
          obs.unobserve(entry.target); // one-shot — no repeated callbacks
        }
      },
      { threshold, rootMargin: margin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, margin, disabled]);

  return { ref, vis };
};