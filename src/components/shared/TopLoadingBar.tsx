// src/components/shared/TopLoadingBar.tsx
/**
 * Fixed 3px amber loading bar at the top of the page.
 * 0%→85% on mount, 100%+fade on completion.
 * Reduced-motion fallback: pulsing amber dot.
 */
import React, { useEffect, useRef, useState } from 'react';

interface TopLoadingBarProps {
  /** Controlled loading state — when false, bar completes and fades out. */
  loading?: boolean;
}

export const TopLoadingBar: React.FC<TopLoadingBarProps> = ({ loading = true }) => {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    if (loading) {
      setVisible(true);
      setWidth(0);
      // Animate to 85% over ~1200ms (easeOut)
      startRef.current = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startRef.current;
        const progress = Math.min(elapsed / 1200, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setWidth(eased * 85);
        if (eased < 1) rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    } else {
      // Complete to 100%, then fade
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setWidth(100);
      timerRef.current = setTimeout(() => setVisible(false), 400);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loading]);

  if (!visible) return null;

  if (prefersReduced) {
    // Reduced-motion: pulsing amber dot
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 8,
          right: 16,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--film-amber)',
          opacity: loading ? 1 : 0,
          zIndex: 'var(--z-top)' as unknown as number,
          animation: loading ? 'pulse 1.2s ease infinite' : 'none',
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 'var(--z-top)' as unknown as number,
        pointerEvents: 'none',
        opacity: loading ? 1 : 0,
        transition: `opacity ${loading ? '0ms' : '350ms'} ease`,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, var(--film-amber), #E5C06A)',
          boxShadow: '0 0 12px rgba(196,124,46,0.6)',
          transition: loading ? 'width 0.1s linear' : 'width 0.3s ease',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  );
};

export default TopLoadingBar;
