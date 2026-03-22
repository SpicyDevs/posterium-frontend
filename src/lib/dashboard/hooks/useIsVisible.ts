import { useState, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface Options { threshold?: number; rootMargin?: string; }

export function useIsVisible(opts: Options = {}) {
  const { threshold = 0.05, rootMargin = '0px' } = opts;
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin]);
  return { ref: ref as RefObject<HTMLDivElement>, visible };
}

export function useIsVisibleRef(
  elementRef: RefObject<HTMLElement | null>,
  visibleRef: RefObject<boolean>,
  opts: Options = {}
) {
  const { threshold = 0.05, rootMargin = '0px' } = opts;
  useEffect(() => {
    const el = elementRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => { (visibleRef as React.MutableRefObject<boolean>).current = entry.isIntersecting; },
      { threshold, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [elementRef, visibleRef, threshold, rootMargin]);
}
