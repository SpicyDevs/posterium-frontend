// src/dashboard/index.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GLOBAL_CSS } from './styles';
import { MARQUEE_TITLES } from './constants';

import Nav from './components/Nav';
import HeroSection from './components/HeroSection';
import FilmReelSection from './components/FilmReelSection/index';
import { MarqueeTicker } from './components/primitives';
import {
  StatsBar,
  CombinedSection,
  CTASection,
  FooterSection,
  ComparisonSection,
} from './components/sections/index';

// ─────────────────────────────────────────────────────────────────────
// FLICKER STATE — module-level boolean so HeroSection can check it
// without a prop chain.  Zero re-render cost.
// ─────────────────────────────────────────────────────────────────────
export let crtFlickering = false;

// ─────────────────────────────────────────────────────────────────────
// SHIMMER keyframes (only injected once, as a separate constant)
// ─────────────────────────────────────────────────────────────────────
const SHIMMER_CSS = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`;

// ─────────────────────────────────────────────────────────────────────
// CRT INTRO OVERLAY
// ─────────────────
// Layered system — three independent elements:
//
//  [A] PAGE FILTER  (.crt-page)
//      CSS animation that takes the WHOLE PAGE from B&W → colour.
//      Removed from DOM via animationend.
//
//  [B] STATIC NOISE (.crt-noise)
//      SVG feTurbulence noise layer, animated rapidly during "static"
//      phases and faded out as colour locks in.
//
//  [C] SCANLINES + BRIGHTNESS FLICKER (.crt-overlay)
//      Controls the bright surges, flickering brightness, and the
//      final fade-out.  Also removed from DOM via animationend.
//
// Timeline (total: 7.5 s)
//  0.0 – 0.5  : Screen black (all above-black)
//  0.5 – 1.2  : Phosphor surge — bright white flash
//  1.2 – 2.0  : Dim, B&W, heavy static noise
//  2.0 – 4.5  : Stable B&W with gentle scanlines; hero is paused
//  4.5 – 6.0  : Colour-lock flickering (B&W ↔ colour × 3)
//  6.0 – 7.0  : Colour locked, overlay fades
//  7.0 – 7.5  : Overlay fully gone; hero carousel resumes
// ─────────────────────────────────────────────────────────────────────
const CRT_CSS = `
  /* ── [A] Page colour filter ── */
  .crt-page {
    animation: crt-colorize 7s cubic-bezier(0.4,0,0.2,1) forwards;
  }
  @keyframes crt-colorize {
    /* Phosphor start — black */
    0%    { filter: grayscale(1) brightness(0) contrast(1.4); }
    /* Surge */
    6.5%  { filter: grayscale(1) brightness(4.5) contrast(3.0); }
    /* Dim rebound */
    10%   { filter: grayscale(1) brightness(0.2) contrast(1.6); }
    /* Second surge */
    16%   { filter: grayscale(1) brightness(2.2) contrast(2.0); }
    /* Stable B&W */
    22%   { filter: grayscale(1) contrast(1.10) brightness(0.85); }
    59%   { filter: grayscale(1) contrast(1.10) brightness(0.85); }
    /* Flip 1: colour burst */
    62%   { filter: grayscale(0) brightness(1.7) contrast(1.8) saturate(4.0) hue-rotate(12deg); }
    /* Back to B&W */
    64%   { filter: grayscale(1) brightness(0.72) contrast(1.15); }
    /* Flip 2: colour */
    67%   { filter: grayscale(0) brightness(1.45) contrast(1.5) saturate(3.2); }
    /* Back to B&W */
    69%   { filter: grayscale(1) brightness(0.80) contrast(1.08); }
    /* Flip 3: colour — stays */
    72%   { filter: grayscale(0) brightness(1.28) contrast(1.35) saturate(2.4); }
    /* Slight B&W slip */
    74%   { filter: grayscale(0.38) brightness(0.94) contrast(1.04); }
    /* Colour locked */
    78%   { filter: grayscale(0) brightness(1.16) contrast(1.20) saturate(1.8); }
    /* Settle */
    86%   { filter: grayscale(0) brightness(1.06) saturate(1.24); }
    93%   { filter: grayscale(0) saturate(1.06); }
    100%  { filter: grayscale(0); }
  }

  /* ── [B] Static noise layer ── */
  .crt-noise {
    position: fixed; inset: 0; z-index: 99998; pointer-events: none;
    animation: crt-noise-fade 7s linear forwards;
    /* SVG filter applied inline via the element's style */
  }
  @keyframes crt-noise-fade {
    /* Phase 1: heavy static during B&W */
    0%    { opacity: 0; }
    5%    { opacity: 0.72; }
    20%   { opacity: 0.55; }
    55%   { opacity: 0.48; }
    /* Static spikes during colour flicker */
    60%   { opacity: 0.82; }
    63%   { opacity: 0.28; }
    66%   { opacity: 0.76; }
    69%   { opacity: 0.24; }
    72%   { opacity: 0.58; }
    77%   { opacity: 0.10; }
    /* Fade out after colour locked */
    85%   { opacity: 0; }
    100%  { opacity: 0; }
  }

  /* ── [C] Brightness / scanline overlay ── */
  .crt-overlay {
    position: fixed; inset: 0; z-index: 99997; pointer-events: none;
    /* Persistent scanlines via background */
    background: repeating-linear-gradient(
      180deg,
      rgba(0,0,0,0)   0px, rgba(0,0,0,0)   2px,
      rgba(0,0,0,0.28) 2px, rgba(0,0,0,0.28) 4px
    );
    animation: crt-overlay-anim 7.5s linear forwards;
    mix-blend-mode: multiply;
  }
  @keyframes crt-overlay-anim {
    /* Fully opaque black — screen off */
    0%    { opacity: 1; background-color: #000; }
    /* Phosphor surge flash */
    6.5%  { opacity: 1; background-color: rgba(255,255,255,0.9); }
    10%   { opacity: 1; background-color: rgba(0,0,0,0.8); }
    16%   { opacity: 1; background-color: rgba(255,255,255,0.6); }
    22%   { opacity: 1; background-color: rgba(0,0,0,0.55); }
    /* Slight ambient dim during B&W phase */
    35%   { opacity: 0.85; background-color: rgba(0,0,0,0.45); }
    55%   { opacity: 0.80; background-color: rgba(0,0,0,0.40); }
    /* Flash during colour flicker */
    60%   { opacity: 1;    background-color: rgba(255,255,255,0.4); }
    63%   { opacity: 0.75; background-color: rgba(0,0,0,0.38); }
    66%   { opacity: 0.95; background-color: rgba(255,255,255,0.35); }
    69%   { opacity: 0.72; background-color: rgba(0,0,0,0.35); }
    72%   { opacity: 0.88; background-color: rgba(255,255,255,0.2); }
    /* Colour locked — dissolve the overlay */
    78%   { opacity: 0.55; background-color: transparent; }
    88%   { opacity: 0.20; background-color: transparent; }
    96%   { opacity: 0;    background-color: transparent; }
    100%  { opacity: 0;    background-color: transparent; }
  }

  /* Noise turbulence animation — inline SVG controlled by JS */
  @keyframes turbulence-shift {
    0%   { filter: url(#crt-static) brightness(1.0); }
    25%  { filter: url(#crt-static) brightness(1.4); }
    50%  { filter: url(#crt-static) brightness(0.7); }
    75%  { filter: url(#crt-static) brightness(1.2); }
    100% { filter: url(#crt-static) brightness(0.9); }
  }
`;

// ─────────────────────────────────────────────────────────────────────
// SVG filter definition for TV static noise (placed invisibly in DOM)
// ─────────────────────────────────────────────────────────────────────
const SvgNoiseFilter: React.FC = () => (
  <svg
    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <filter id="crt-static" x="0%" y="0%" width="100%" height="100%">
        {/* fractalNoise gives a better TV-static look than turbulence */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.65"
          numOctaves="3"
          stitchTiles="stitch"
          result="noise"
        />
        <feColorMatrix type="saturate" values="0" in="noise" result="bw" />
        <feBlend in="SourceGraphic" in2="bw" mode="overlay" />
      </filter>
    </defs>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────
// CRTIntro
// Manages three layers + the page-level colour filter.
// Completely removes itself (and all injected CSS) from the DOM once
// done — zero persistent memory or GPU cost after the intro finishes.
// ─────────────────────────────────────────────────────────────────────
interface CRTIntroProps {
  onDone: () => void;
}

const CRTIntro: React.FC<CRTIntroProps> = ({ onDone }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    crtFlickering = true;

    const el = overlayRef.current;
    if (!el) return;

    // animationend fires when the LONGEST animation (.crt-overlay at 7.5s) ends
    const handleEnd = (e: AnimationEvent) => {
      if (e.animationName !== 'crt-overlay-anim') return;
      crtFlickering = false;
      onDone();
    };

    el.addEventListener('animationend', handleEnd);
    return () => {
      el.removeEventListener('animationend', handleEnd);
      crtFlickering = false;
    };
  }, [onDone]);

  return (
    // Outer ref tracks the longest animation for cleanup
    <div ref={overlayRef} className="crt-overlay" aria-hidden="true">
      {/* Static noise layer — sits above the overlay */}
      <div
        className="crt-noise"
        style={{
          background: 'rgba(180,172,155,0.12)',
          // Apply the SVG noise filter
          filter: 'url(#crt-static) brightness(1.1)',
          animation: 'crt-noise-fade 7s linear forwards, turbulence-shift 0.12s steps(1) infinite',
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ContentSection — content-visibility:auto wrapper for below-fold sections
// ─────────────────────────────────────────────────────────────────────
const ContentSection: React.FC<{ children: React.ReactNode; intrinsicH?: number }> = ({
  children,
  intrinsicH = 600,
}) => (
  <div
    style={{
      contentVisibility: 'auto',
      containIntrinsicSize: `0 ${intrinsicH}px`,
    } as React.CSSProperties}
  >
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  // Track first visit — both the B&W page filter AND the overlay run
  const [isFirstVisit] = useState<boolean>(() => {
    try {
      const KEY = 'posterium-visited-v3';
      if (!localStorage.getItem(KEY)) {
        localStorage.setItem(KEY, '1');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Whether to show the CRT overlay in DOM at all
  const [showCRT, setShowCRT] = useState(isFirstVisit);

  // Whether to apply the page-level B&W→colour filter
  const [pageFiltered, setPageFiltered] = useState(isFirstVisit);

  // Callback fired when the CRT animation is fully done
  const handleCRTDone = useCallback(() => {
    // Remove overlay from DOM (frees GPU resources)
    setShowCRT(false);
    // Remove the page filter class (frees compositor layer)
    setPageFiltered(false);
  }, []);

  return (
    <>
      {/* Inject global CSS + shimmer + CRT keyframes */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS + SHIMMER_CSS + (isFirstVisit ? CRT_CSS : '') }} />

      {/* Invisible SVG filter definition — needed by noise layer */}
      {showCRT && <SvgNoiseFilter />}

      {/* CRT intro overlay — removed from DOM after animation */}
      {showCRT && <CRTIntro onDone={handleCRTDone} />}

      {/* Film grain + scanlines (persistent, low-cost) */}
      <div className="grain-layer" aria-hidden="true" />
      <div className="scan-layer"  aria-hidden="true" />

      <a
        href="#main-content"
        style={{ position: 'absolute', left: -9999, top: 8, zIndex: 9999, background: 'var(--film-amber)', color: '#070706', padding: '8px 14px', borderRadius: 4, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11, textDecoration: 'none', letterSpacing: '0.06em' }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.left = '8px'; }}
        onBlur={(e)  => { (e.currentTarget as HTMLElement).style.left = '-9999px'; }}
      >
        Skip to main content
      </a>

      {/*
        .crt-page applies the B&W→colour CSS animation.
        The class is removed (via pageFiltered state) when the CRT
        intro completes — so the animation CSS and the stacking context
        it creates are freed from memory.
      */}
      <div
        className={pageFiltered ? 'crt-page' : undefined}
        style={{ minHeight: '100dvh', background: 'var(--film-black)', color: 'var(--film-cream)', fontFamily: 'DM Sans, sans-serif' }}
      >
        <Nav />

        <main id="main-content">
          <HeroSection />

          <MarqueeTicker items={MARQUEE_TITLES} speed={128} />

          <ContentSection intrinsicH={2400}>
            <FilmReelSection />
          </ContentSection>

          <MarqueeTicker items={MARQUEE_TITLES} speed={128} />

          <ContentSection intrinsicH={320}>
            <StatsBar />
          </ContentSection>

          <ContentSection intrinsicH={640}>
            <CombinedSection />
          </ContentSection>

          <ContentSection intrinsicH={700}>
            <ComparisonSection />
          </ContentSection>

          <ContentSection intrinsicH={480}>
            <CTASection />
          </ContentSection>
        </main>

        <ContentSection intrinsicH={360}>
          <FooterSection />
        </ContentSection>
      </div>
    </>
  );
};

export default Dashboard;