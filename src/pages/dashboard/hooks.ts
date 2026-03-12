// src/pages/dashboard/hooks.ts
import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

// ── useInView ─────────────────────────────────────────────────────
export const useInView = (threshold = 0.1, rootMargin = '0px 0px -48px 0px') => {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVis(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.unobserve(e.target); } },
      { threshold, rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin]);
  return { ref, vis };
};

// ── useScrollReel ─────────────────────────────────────────────────
// FIX: Uses getBoundingClientRect().top directly — no scrollY arithmetic.
// Formula: progress = -rect.top / (containerH - vh)
// Requires: containerH = (trackScrollWidth - vw) + vh
// This ensures progress 0→1 maps exactly to translateX 0→-(trackW-vw).
//
// ResizeObserver on both container and track: fires when wrapperH state
// updates OR when poster images load and expand track scrollWidth.
export const useScrollReel = (
  containerRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>,
  progressFillRef?: RefObject<HTMLDivElement | null>,
) => {
  const rafId = useRef<number | null>(null);
  const alive = useRef(true);

  const compute = useCallback(() => {
    rafId.current = null;
    if (!alive.current) return;
    const container = containerRef.current;
    const track     = trackRef.current;
    if (!container || !track) return;

    const rect       = container.getBoundingClientRect();
    const scrollable = container.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;                         // not yet laid out

    const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
    const maxShift = Math.max(0, track.scrollWidth - window.innerWidth);
    track.style.transform = `translateX(${(-progress * maxShift).toFixed(1)}px)`;
    if (progressFillRef?.current) {
      progressFillRef.current.style.width = `${(progress * 100).toFixed(1)}%`;
    }
  }, [containerRef, trackRef, progressFillRef]);

  useEffect(() => {
    alive.current = true;
    const schedule = () => {
      if (rafId.current === null)
        rafId.current = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    // ResizeObserver: re-fires compute whenever container or track dimensions change
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(schedule);
      if (containerRef.current) ro.observe(containerRef.current);
      if (trackRef.current)     ro.observe(trackRef.current);
    }

    schedule(); // initial paint

    return () => {
      alive.current = false;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro?.disconnect();
      if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null; }
    };
  }, [compute, containerRef, trackRef]);
};

// ── useTimecode ───────────────────────────────────────────────────
export const useTimecode = () => {
  const fmt = (d: Date) =>
    [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(n => String(n).padStart(2, '0'))
      .join(':');
  const [tc, setTc] = useState(() => fmt(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTc(fmt(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return tc;
};

// ── useNavScroll ──────────────────────────────────────────────────
export const useNavScroll = (threshold = 40) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > threshold);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [threshold]);
  return scrolled;
};

// ── usePosterLoad ─────────────────────────────────────────────────
export const usePosterLoad = () => {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);
  return {
    loaded, error,
    onLoad:  useCallback(() => setLoaded(true), []),
    onError: useCallback(() => setError(true),  []),
  };
};

// ── useCounter ────────────────────────────────────────────────────
// Eased numeric counter that animates from 0 to target when triggered.
export const useCounter = (target: number, duration = 1600, trigger = true) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setVal(Math.round(e * target));
      if (p < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration, trigger]);
  return val;
};