// src/dashboard/hooks/useIsVisible.ts
// ─────────────────────────────────────────────────────────────────────
// Bi-directional IntersectionObserver hook.
//
// Unlike the existing `useInView` (which is one-shot — once visible,
// stays true), this hook follows the element's live visibility state.
// Use it to cull animations or intervals that should stop when the
// section is scrolled off-screen.
//
// USAGE
// ─────
//   const { ref, visible } = useIsVisible({ threshold: 0.1 });
//   useEffect(() => {
//     if (!visible) return; // pause work when off-screen
//     const id = setInterval(tick, 200);
//     return () => clearInterval(id);
//   }, [visible]);
//
// Alternatively, store `visible` in a ref to avoid restarting effects:
//   const visibleRef = useRef(true);
//   useIsVisibleRef(elementRef, visibleRef);  ← see overload below
// ─────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, RefObject } from 'react';

interface Options {
  threshold?: number;
  rootMargin?: string;
}

// ── React state version — causes a re-render on visibility change ──
export function useIsVisible(opts: Options = {}) {
  const { threshold = 0.05, rootMargin = '0px' } = opts;
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true); // optimistic: assume visible on mount

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

// ── Ref version — updates a mutable ref, zero re-renders ───────────
// Pass an existing element ref and a boolean ref to sync.
// Ideal for culling intervals without triggering effect restarts.
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
      ([entry]) => {
        // Direct ref mutation — no state, no re-render
        (visibleRef as React.MutableRefObject<boolean>).current = entry.isIntersecting;
      },
      { threshold, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [elementRef, visibleRef, threshold, rootMargin]);
}