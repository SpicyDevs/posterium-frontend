// src/dashboard/index.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';

// FIX: Static CSS now imported as a module instead of embedded in JS bundle.
// Astro extracts this at build time → separate .css asset linked in <head>
// before any JS loads. ~9 KB removed from the JS chunk. Shimmer keyframes are
// available on first paint (skeleton loaders work before hydration).
import './dashboard.css';

// Only CRT_CSS remains dynamic — it's injected client-side only on first visit.
import { CRT_CSS } from './styles';

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
// without a prop chain. Zero re-render cost.
// ─────────────────────────────────────────────────────────────────────
export let crtFlickering = false;

// ─────────────────────────────────────────────────────────────────────
// CRT INTRO OVERLAY — three layered elements
// ─────────────────────────────────────────────────────────────────────
const SvgNoiseFilter: React.FC = () => (
  <svg
    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <filter id="crt-static" x="0%" y="0%" width="100%" height="100%">
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

interface CRTIntroProps {
  onDone: () => void;
}

const CRTIntro: React.FC<CRTIntroProps> = ({ onDone }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    crtFlickering = true;

    const el = overlayRef.current;
    if (!el) return;

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
    <div ref={overlayRef} className="crt-overlay" aria-hidden="true">
      <div
        className="crt-noise"
        style={{
          background: 'rgba(180,172,155,0.12)',
          filter: 'url(#crt-static) brightness(1.1)',
          animation: 'crt-noise-fade 7s linear forwards, turbulence-shift 0.12s steps(1) infinite',
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────
// ContentSection — content-visibility:auto for below-fold sections
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

  const [showCRT, setShowCRT] = useState(false);
  const [pageFiltered, setPageFiltered] = useState(false);

  // FIX: CRT CSS injected via useEffect (client-only) instead of
  // dangerouslySetInnerHTML on the component root.
  //
  // The old approach caused a hydration mismatch:
  //   SSR:    isFirstVisit=false (localStorage unavailable) → no CRT CSS
  //   Client: isFirstVisit=true  (first real visit)         → CRT CSS added
  // React detected the style tag content differing and had to reconcile.
  //
  // Now: the style tag is never part of the SSR output. On first visit,
  // useEffect injects it after mount (client-only). React never sees a
  // mismatch. The style element cleans itself up when the component unmounts.
  useEffect(() => {
    if (!isFirstVisit) return;

    const style = document.createElement('style');
    style.dataset.crt = '';
    style.textContent = CRT_CSS;
    document.head.appendChild(style);

    // Activate CRT overlay and page filter after styles are in the DOM
    setShowCRT(true);
    setPageFiltered(true);

    return () => {
      style.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount — isFirstVisit is stable (useState with initialiser)

  const handleCRTDone = useCallback(() => {
    setShowCRT(false);
    setPageFiltered(false);
  }, []);

  return (
    <>
      {showCRT && <SvgNoiseFilter />}
      {showCRT && <CRTIntro onDone={handleCRTDone} />}

      {/* Film grain + scanlines (persistent, low-cost, defined in dashboard.css) */}
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
