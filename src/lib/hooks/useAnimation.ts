// src/lib/hooks/useAnimation.ts
import { useRef, useState, useEffect } from 'react';
import type { RefObject } from 'react';

interface UseAnimationOptions {
  /** IntersectionObserver rootMargin, e.g. '80px' (default: '0px') */
  rootMargin?: string;
  /** IntersectionObserver threshold (default: 0.05) */
  threshold?: number;
}

interface UseAnimationResult<T extends Element = Element> {
  ref: RefObject<T | null>;
  /** True when animations should run: element is visible AND user has no reduced-motion preference. */
  shouldAnimate: boolean;
  /** Whether the element is currently in the viewport */
  isVisible: boolean;
}

/**
 * Combines IntersectionObserver visibility tracking with prefers-reduced-motion detection.
 * Use `shouldAnimate` to gate all CSS animations/transitions on user-facing elements.
 *
 * When shouldAnimate is false:
 *   - Skip reveal animations and show elements immediately at full opacity.
 *   - Freeze scroll-driven transforms at their initial position.
 *   - Pause interval-driven animations.
 */
export function useAnimation<T extends Element = Element>(
  options: UseAnimationOptions = {}
): UseAnimationResult<T> {
  const { rootMargin = '0px', threshold = 0.05 } = options;
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersMotion, setPrefersMotion] = useState(true);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: no-preference)');
    setPrefersMotion(mq.matches);
    const handle = (e: MediaQueryListEvent) => setPrefersMotion(e.matches);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  // IntersectionObserver for offscreen detection
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, isVisible, shouldAnimate: isVisible && prefersMotion };
}
