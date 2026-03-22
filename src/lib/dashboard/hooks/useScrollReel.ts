import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface LayoutCache { top: number; scrollable: number; maxShift: number; }

export const useScrollReel = (
  containerRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>,
  progressFillRef?: RefObject<HTMLDivElement | null>
) => {
  const rafId  = useRef<number | null>(null);
  const layout = useRef<LayoutCache>({ top: 0, scrollable: 0, maxShift: 0 });

  const measure = useCallback(() => {
    const c = containerRef.current;
    const t = trackRef.current;
    if (!c || !t) return;
    const rect = c.getBoundingClientRect();
    layout.current = {
      top:       rect.top + window.scrollY,
      scrollable: c.offsetHeight - window.innerHeight,
      maxShift:  Math.max(0, t.scrollWidth - window.innerWidth),
    };
  }, [containerRef, trackRef]);

  const compute = useCallback(() => {
    rafId.current = null;
    const { top, scrollable, maxShift } = layout.current;
    const track = trackRef.current;
    if (!track || scrollable <= 0) return;
    const progress = Math.max(0, Math.min(1, (window.scrollY - top) / scrollable));
    track.style.transform = `translate3d(${-progress * maxShift}px,0,0)`;
    if (progressFillRef?.current) progressFillRef.current.style.width = `${progress * 100}%`;
  }, [trackRef, progressFillRef]);

  useEffect(() => {
    measure();
    const schedule = () => { if (rafId.current === null) rafId.current = requestAnimationFrame(compute); };
    const onResize = () => { measure(); schedule(); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      if (containerRef.current) ro.observe(containerRef.current);
      if (trackRef.current)     ro.observe(trackRef.current);
    }
    schedule();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
      if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null; }
    };
  }, [compute, measure, containerRef, trackRef]);
};

export const useReelHeight = (
  containerRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>
) => {
  useEffect(() => {
    const recalc = () => {
      const c = containerRef.current;
      const t = trackRef.current;
      if (!c || !t) return;
      const tw = t.scrollWidth, vw = window.innerWidth, vh = window.innerHeight;
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
    const t1 = setTimeout(recalc, 300), t2 = setTimeout(recalc, 1000), t3 = setTimeout(recalc, 2500);
    return () => { ro?.disconnect(); window.removeEventListener('resize', recalc); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [containerRef, trackRef]);
};
