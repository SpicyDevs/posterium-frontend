// hooks/useScrollReel.ts
// Responsibility: scroll event → translateX animation only.
// Height management is the component's responsibility (via useReelHeight).
//
// Formula (proof):
//   containerH = trackScrollWidth - vw + vh   (set by useReelHeight)
//   scrollable  = containerH - vh = trackW - vw
//   progress    = -rect.top / scrollable        (0 at entry, 1 at exit)
//   translateX  = -(progress × (trackW - vw))   (0 → -(trackW-vw))
//
// Uses getBoundingClientRect().top directly — no scrollY arithmetic needed.
import { useCallback, useEffect, useRef, RefObject } from 'react';

export const useScrollReel = (
  containerRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>,
  progressFillRef?: RefObject<HTMLDivElement | null>,
) => {
  const rafId = useRef<number | null>(null);

  const compute = useCallback(() => {
    rafId.current = null;
    const container = containerRef.current;
    const track     = trackRef.current;
    if (!container || !track) return;

    const rect       = container.getBoundingClientRect();
    const scrollable = container.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return; // not laid out yet

    const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
    const maxShift  = Math.max(0, track.scrollWidth - window.innerWidth);
    track.style.transform = `translateX(${(-progress * maxShift).toFixed(1)}px)`;

    if (progressFillRef?.current) {
      progressFillRef.current.style.width = `${(progress * 100).toFixed(1)}%`;
    }
  }, [containerRef, trackRef, progressFillRef]);

  useEffect(() => {
    const schedule = () => {
      if (rafId.current === null)
        rafId.current = requestAnimationFrame(compute);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    // ResizeObserver re-fires compute when container dimensions change
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      if (containerRef.current) ro.observe(containerRef.current);
      if (trackRef.current)     ro.observe(trackRef.current);
    }

    schedule(); // initial position

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro?.disconnect();
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [compute, containerRef, trackRef]);
};

// ── useReelHeight ─────────────────────────────────────────────────
// Sets container height directly via DOM (no state → no re-render flash).
// useLayoutEffect ensures height is set before first paint.
// ResizeObserver catches lazy-loaded image expansions.
export const useReelHeight = (
  containerRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    const recalc = () => {
      const container = containerRef.current;
      const track     = trackRef.current;
      if (!container || !track) return;
      const tw = track.scrollWidth;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (tw <= vw) return; // track narrower than viewport — skip
      container.style.height = `${tw - vw + vh}px`;
    };

    // Synchronous first pass (before paint if called in useLayoutEffect upstream)
    recalc();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(recalc);
      if (trackRef.current) ro.observe(trackRef.current);
    }

    window.addEventListener('resize', recalc, { passive: true });

    // Safety passes for async image / font load
    const t1 = setTimeout(recalc, 300);
    const t2 = setTimeout(recalc, 1000);
    const t3 = setTimeout(recalc, 2200);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', recalc);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [containerRef, trackRef]);
};