// hooks/useScrollReel.ts
// Smooth horizontal-parallax driven by vertical scroll.
//
// PERF FIX: getBoundingClientRect() triggers a layout flush when called in a
// rAF loop. Instead we cache layout measurements on mount + resize and read
// only window.scrollY (no reflow) in every animation frame.
//
// Formula (proof):
//   containerH  = trackScrollWidth - vw + vh   (set by useReelHeight)
//   scrollable  = containerH - vh = trackW - vw
//   rawProgress = (scrollY - containerDocTop) / scrollable
//   translateX  = -(clamp(progress, 0, 1) × maxShift)
//
// translate3d forces GPU compositing - avoids main-thread paint on move.
import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface LayoutCache {
  top: number; // container's absolute document top
  scrollable: number; // total scrollable distance
  maxShift: number; // max translateX magnitude
}

export const useScrollReel = (
  containerRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>,
  progressFillRef?: RefObject<HTMLDivElement | null>,
  onTranslateX?: (tx: number) => void
) => {
  const rafId = useRef<number | null>(null);
  const layout = useRef<LayoutCache>({ top: 0, scrollable: 0, maxShift: 0 });
  // Store callback in a ref so it is always up-to-date without appearing
  // in `compute`'s dep array (avoids infinite effect re-registrations).
  const onTranslateXRef = useRef(onTranslateX);
  onTranslateXRef.current = onTranslateX;

  // ── Measure: cache layout info - no reflow needed per scroll frame ──
  const measure = useCallback(() => {
    const c = containerRef.current;
    const t = trackRef.current;
    if (!c || !t) return;

    // getBoundingClientRect only called here (on resize / mount), not per frame
    const rect = c.getBoundingClientRect();
    layout.current = {
      top: rect.top + window.scrollY,
      scrollable: c.offsetHeight - window.innerHeight,
      maxShift: Math.max(0, t.scrollWidth - window.innerWidth),
    };
  }, [containerRef, trackRef]);

  // ── Compute: pure math + one DOM write - zero reflow ──────────────
  const compute = useCallback(() => {
    rafId.current = null;
    const { top, scrollable, maxShift } = layout.current;
    const track = trackRef.current;
    if (!track || scrollable <= 0) return;

    const progress = Math.max(0, Math.min(1, (window.scrollY - top) / scrollable));
    const tx = -(progress * maxShift);
    // translate3d puts the element on its own GPU layer → silky motion
    track.style.transform = `translate3d(${tx}px,0,0)`;
    onTranslateXRef.current?.(tx);

    if (progressFillRef?.current) {
      progressFillRef.current.style.width = `${progress * 100}%`;
    }
  }, [trackRef, progressFillRef]);

  useEffect(() => {
    measure(); // synchronous initial measurement

    const schedule = () => {
      if (rafId.current === null) rafId.current = requestAnimationFrame(compute);
    };

    const onResize = () => {
      measure();
      schedule();
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      if (containerRef.current) ro.observe(containerRef.current);
      if (trackRef.current) ro.observe(trackRef.current);
    }

    schedule();

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [compute, measure, containerRef, trackRef]);
};

// ── useReelHeight ─────────────────────────────────────────────────
// Direct DOM height write (no setState → no re-render flash).
// ResizeObserver catches image-load expansions; timeouts are belt-and-suspenders.
export const useReelHeight = (
  containerRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>
) => {
  useEffect(() => {
    const recalc = () => {
      const c = containerRef.current;
      const t = trackRef.current;
      if (!c || !t) return;
      const tw = t.scrollWidth;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (tw <= vw) return;
      c.style.height = `${tw - vw + vh}px`;
    };

    recalc();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(recalc);
      if (trackRef.current) ro.observe(trackRef.current);
    }

    window.addEventListener('resize', recalc, { passive: true });
    const t1 = setTimeout(recalc, 300);
    const t2 = setTimeout(recalc, 1000);
    const t3 = setTimeout(recalc, 2500);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', recalc);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [containerRef, trackRef]);
};
