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

const COLORIZE_CSS = `
  .intro-colorize { animation: intro-colorize 5.2s ease-out forwards; }
  @keyframes intro-colorize {
    0%    { filter: grayscale(1) contrast(1.06) brightness(0.88); }
    57%   { filter: grayscale(1) contrast(1.06) brightness(0.88); }
    58%   { filter: grayscale(0) contrast(1.18) brightness(1.12) saturate(1.3); }
    59%   { filter: grayscale(1) contrast(0.92) brightness(0.82); }
    61%   { filter: grayscale(0) contrast(1.1)  brightness(1.06); }
    62.5% { filter: grayscale(0.85) contrast(0.96); }
    64%   { filter: grayscale(0) brightness(1.08); }
    65.5% { filter: grayscale(0.5) contrast(1.02); }
    68%   { filter: grayscale(0) brightness(1.04); }
    72%   { filter: grayscale(0.18); }
    76%   { filter: grayscale(0); }
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