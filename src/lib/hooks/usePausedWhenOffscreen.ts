// src/lib/hooks/usePausedWhenOffscreen.ts
import { useRef, useState, useEffect } from 'react';
import type { RefObject } from 'react';

interface UsePausedWhenOffscreenOptions {
  /** Intersection threshold, 0–1 (default 0.05) */
  threshold?: number;
  /** IntersectionObserver rootMargin (default '0px') */
  rootMargin?: string;
}

interface UsePausedWhenOffscreenResult<T extends Element = Element> {
  ref: RefObject<T | null>;
  isVisible: boolean;
}

/**
 * Tracks whether an element is within the viewport using IntersectionObserver.
 * Use `isVisible` to pause animations/intervals when the element is not visible.
 *
 * Accepts either a numeric threshold (legacy) or an options object.
 */
export function usePausedWhenOffscreen<T extends Element = Element>(
  options: UsePausedWhenOffscreenOptions | number = {}
): UsePausedWhenOffscreenResult<T> {
  // Support legacy numeric call signature: usePausedWhenOffscreen(0.1)
  const opts = typeof options === 'number' ? { threshold: options } : options;
  const { threshold = 0.05, rootMargin = '0px' } = opts;

  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(true); // default true to avoid flash on first render

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}
