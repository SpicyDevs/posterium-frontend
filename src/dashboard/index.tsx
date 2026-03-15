// src/dashboard/index.tsx
// Performance: below-fold sections wrapped in content-visibility:auto
// so the browser can skip rendering and painting them until they approach
// the viewport. containIntrinsicSize gives a stable layout estimate,
// preventing the page from collapsing when content-visibility kicks in.
import React, { useEffect, useState } from 'react';
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

const SHIMMER_CSS = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`;

// ─────────────────────────────────────────────────────────────────────
// COLORIZE: authentic CRT / old-TV B&W → colour flicker.
//
// Phase 1 (0–6 %): phosphor-tube power-on surge — two brightness spikes
//   then stabilise to a clean B&W picture.
// Phase 2 (6–52 %): sitting in black-and-white.
// Phase 3 (52–64 %): colour dial turned — signal tries to lock on.
//   Four rapid B&W ↔ colour flips with intentional oversaturation on each
//   colour frame so the "click" is unmistakably visible against B&W.
// Phase 4 (64–100 %): colour locked, brief oversaturation ramps back to
//   natural.
//
// The total duration is 6.4 s so the viewer has ≈ 3 s in B&W before
// the payoff — long enough to register but not long enough to frustrate.
// ─────────────────────────────────────────────────────────────────────
const COLORIZE_CSS = `
  .intro-colorize { animation: intro-colorize 6.4s ease-out forwards; }

  @keyframes intro-colorize {
    /* ── Phase 1: CRT surge on ───────────────────────────── */
    0%    { filter: grayscale(1) brightness(0)   contrast(1.2); }
    0.8%  { filter: grayscale(1) brightness(3.2) contrast(2.4); }  /* phosphor burst  */
    1.8%  { filter: grayscale(1) brightness(0.3) contrast(1.5); }  /* dim rebound     */
    3.0%  { filter: grayscale(1) brightness(1.8) contrast(1.9); }  /* second surge    */
    4.2%  { filter: grayscale(1) brightness(0.8) contrast(1.2); }  /* near-stabilised */
    6.0%  { filter: grayscale(1) contrast(1.06) brightness(0.88); }/* stable B&W      */

    /* ── Phase 2: B&W viewing ───────────────────────────── */
    52%   { filter: grayscale(1) contrast(1.06) brightness(0.88); }

    /* ── Phase 3: colour dial — rapid lock-on flickers ──── */
    /* Flip 1: colour burst */
    53.2% { filter: grayscale(0) brightness(1.55) contrast(1.6) saturate(3.2) hue-rotate(10deg); }
    /* Flip 1: back to B&W */
    54.0% { filter: grayscale(1) brightness(0.78) contrast(1.12); }
    /* Flip 2: colour */
    54.9% { filter: grayscale(0) brightness(1.35) contrast(1.4) saturate(2.6); }
    /* Flip 2: back to B&W */
    55.7% { filter: grayscale(1) brightness(0.82) contrast(1.08); }
    /* Flip 3: colour — stays this time */
    56.8% { filter: grayscale(0) brightness(1.22) contrast(1.3) saturate(2.1); }
    /* Brief partial B&W slip */
    57.8% { filter: grayscale(0.45) brightness(0.95) contrast(1.05); }
    /* Colour locks in */
    59.5% { filter: grayscale(0) brightness(1.14) contrast(1.18) saturate(1.7); }

    /* ── Phase 4: settle to natural colour ──────────────── */
    63%   { filter: grayscale(0) brightness(1.08) saturate(1.3); }
    70%   { filter: grayscale(0) brightness(1.04) saturate(1.12); }
    80%   { filter: grayscale(0) saturate(1.04); }
    100%  { filter: grayscale(0); }
  }
`;

// ── ContentSection ────────────────────────────────────────────────
// Lightweight wrapper that applies content-visibility:auto on supported
// browsers (Chrome/Edge 85+). Falls back to no-op on Firefox/Safari
// where the property is ignored — no visual difference, just no paint skip.
// intrinsicH is a rough height estimate used for layout during skip phase.
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

const Dashboard: React.FC = () => {
  const [isFirstVisit] = useState<boolean>(() => {
    try {
      const KEY = 'posterium-visited-v2';
      if (!localStorage.getItem(KEY)) {
        localStorage.setItem(KEY, '1');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const FONT_ID = 'posterium-gf';
    if (document.getElementById(FONT_ID)) return;

    const preconn  = Object.assign(document.createElement('link'), { rel: 'preconnect', href: 'https://fonts.googleapis.com' });
    const preconn2 = Object.assign(document.createElement('link'), { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' });
    const link     = Object.assign(document.createElement('link'), {
      id:   FONT_ID,
      rel:  'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Bebas+Neue' +
            '&family=Syne:wght@400;600;700;800' +
            '&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300' +
            '&family=JetBrains+Mono:wght@400;500' +
            '&display=swap',
    });
    document.head.append(preconn, preconn2, link);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS + SHIMMER_CSS + COLORIZE_CSS }} />
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
        className={isFirstVisit ? 'intro-colorize' : undefined}
        style={{ minHeight: '100dvh', background: 'var(--film-black)', color: 'var(--film-cream)', fontFamily: 'DM Sans, sans-serif' }}
      >
        <Nav />

        <main id="main-content">
          {/* Hero — always rendered, no content-visibility (above fold) */}
          <HeroSection />

          <MarqueeTicker items={MARQUEE_TITLES} speed={128} />

          {/* Reel — large sticky scroll section; intrinsicH covers full scroll travel */}
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

          {/* Comparison section */}
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