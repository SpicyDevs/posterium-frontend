// src/lib/breakpoints.ts
import { useState, useEffect } from 'react';

export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1600,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | null>(null);

  useEffect(() => {
    const handlers = Object.entries(BREAKPOINTS).map(([key, value]) => {
      const mql = window.matchMedia(`(min-width: ${value}px)`);
      return { key: key as Breakpoint, mql };
    });

    const updateBreakpoint = () => {
      const active = handlers
        .slice()
        .reverse()
        .find((h) => h.mql.matches);
      setBreakpoint(active ? active.key : null);
    };

    updateBreakpoint();
    handlers.forEach((h) => h.mql.addEventListener('change', updateBreakpoint));
    return () => handlers.forEach((h) => h.mql.removeEventListener('change', updateBreakpoint));
  }, []);

  return breakpoint;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.md - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
    setIsTablet(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isTablet;
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`);
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export const media = (bp: Breakpoint) => `@media (min-width: ${BREAKPOINTS[bp]}px)`;
