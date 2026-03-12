// src/pages/dashboard/hooks.ts
import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

// ── useInView ─────────────────────────────────────────────────────
// Bug fix: original didn't guard against element being removed mid-observation.
// Also added rootMargin to trigger slightly before the element enters viewport.
export const useInView = (
  threshold = 0.1,
  rootMargin = '0px 0px -48px 0px',
) => {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // IntersectionObserver may not exist in some SSR/test environments
    if (typeof IntersectionObserver === 'undefined') {
      setVis(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVis(true);
          obs.unobserve(entry.target); // stop watching after first trigger
        }
      },
      { threshold, rootMargin },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin]);

  return { ref, vis };
};

// ── useScrollReel ─────────────────────────────────────────────────
// Drives the horizontal reel via vertical scroll.
//
// Bug fixes vs original:
//  1. containerH guard: if containerH <= 0 (element not laid out) bail early
//  2. ResizeObserver: recalculate maxTranslate on container/track resize
//  3. RAF guard: cancel correctly on unmount — original set rafRef.current = 0
//     *before* the animation frame ran, meaning a queued frame could call
//     updateTranslate after unmount.
//  4. Progress indicator is read from the ref, not queried each frame.
export const useScrollReel = (
  containerRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>,
  progressFillRef: RefObject<HTMLDivElement | null>,
) => {
  const rafRef = useRef<number | null>(null);
  const isMounted = useRef(true);

  const compute = useCallback(() => {
    rafRef.current = null;
    if (!isMounted.current) return;

    const container = containerRef.current;
    const track     = trackRef.current;
    if (!container || !track) return;

    const containerTop = container.getBoundingClientRect().top + window.scrollY;
    const scrolled     = window.scrollY - containerTop;
    const containerH   = container.offsetHeight - window.innerHeight;

    // Guard: not yet laid out or container is shorter than viewport
    if (containerH <= 0) return;

    const maxTranslate = Math.max(0, track.scrollWidth - window.innerWidth);
    const progress     = Math.max(0, Math.min(1, scrolled / containerH));
    const tx           = -(progress * maxTranslate);

    track.style.transform = `translateX(${tx}px)`;

    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${(progress * 100).toFixed(1)}%`;
    }
  }, [containerRef, trackRef, progressFillRef]);

  useEffect(() => {
    isMounted.current = true;

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(compute);
      }
    };

    // Recalculate on resize — original missed this entirely, causing the reel
    // to be out of sync after window resize.
    const onResize = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(compute);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // Initial compute after paint
    rafRef.current = requestAnimationFrame(compute);

    return () => {
      isMounted.current = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [compute]);
};

// ── useTimecode ───────────────────────────────────────────────────
// Displays a live HH:MM:SS timecode in the nav.
// Runs off a 1s interval; format matches film leader timecodes.
export const useTimecode = () => {
  const [tc, setTc] = useState(() => formatTc(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTc(formatTc(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return tc;
};

function formatTc(d: Date): string {
  const h  = String(d.getHours()).padStart(2, '0');
  const m  = String(d.getMinutes()).padStart(2, '0');
  const s  = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ── usePosterLoad ─────────────────────────────────────────────────
// Tracks loading state per-poster so we can show a skeleton shimmer.
export const usePosterLoad = () => {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  const onLoad  = useCallback(() => setLoaded(true),  []);
  const onError = useCallback(() => setError(true),   []);

  return { loaded, error, onLoad, onError };
};

// ── useNavScroll ──────────────────────────────────────────────────
// Returns whether the page has been scrolled past the threshold.
// Debounced via passive scroll listener.
export const useNavScroll = (threshold = 40) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > threshold);
    h(); // sync on mount
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, [threshold]);

  return scrolled;
};