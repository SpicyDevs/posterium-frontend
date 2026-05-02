// src/lib/breakpoints.ts
import { useState, useEffect } from 'react';

export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1600,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/** Returns the name of the largest breakpoint the current viewport satisfies, or null if below sm. */
export function useBreakpoint(): BreakpointKey | null {
  const getBreakpoint = (): BreakpointKey | null => {
    if (typeof window === 'undefined') return null;
    const w = window.innerWidth;
    if (w >= BREAKPOINTS.xxl) return 'xxl';
    if (w >= BREAKPOINTS.xl) return 'xl';
    if (w >= BREAKPOINTS.lg) return 'lg';
    if (w >= BREAKPOINTS.md) return 'md';
    if (w >= BREAKPOINTS.sm) return 'sm';
    return null;
  };

  const [bp, setBp] = useState<BreakpointKey | null>(getBreakpoint);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BREAKPOINTS.sm}px)`);
    const update = () => setBp(getBreakpoint());
    // Listen on resize instead of individual MQs for simplicity
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return bp;
}

/** True when viewport width is below `md` (768px). */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.md : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`);
    const handle = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  return isMobile;
}

/** True when viewport width is between `md` (768px) and `lg` (1024px). */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
  });

  useEffect(() => {
    const mqMin = window.matchMedia(`(min-width: ${BREAKPOINTS.md}px)`);
    const mqMax = window.matchMedia(`(max-width: ${BREAKPOINTS.lg - 1}px)`);
    const handle = () => setIsTablet(mqMin.matches && mqMax.matches);
    handle();
    mqMin.addEventListener('change', handle);
    mqMax.addEventListener('change', handle);
    return () => {
      mqMin.removeEventListener('change', handle);
      mqMax.removeEventListener('change', handle);
    };
  }, []);

  return isTablet;
}

/** True when viewport width is at or above `lg` (1024px). */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINTS.lg : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`);
    const handle = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  return isDesktop;
}

/** Returns a CSS media query string for the given breakpoint (min-width). */
export function media(bp: BreakpointKey): string {
  return `(min-width: ${BREAKPOINTS[bp]}px)`;
}
